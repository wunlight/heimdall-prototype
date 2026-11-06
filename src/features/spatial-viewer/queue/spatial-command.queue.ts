import type { CameraCommand, SpatialCommand, SpatialViewMode } from '../types/spatial.type'

export interface SpatialCommandExecutor {
  execute(command: SpatialCommand, signal: AbortSignal): Promise<void>
}

function getCameraMode(command: SpatialCommand): SpatialViewMode | null {
  if (command.type === 'CAMERA_3D') return '3D'
  if (command.type === 'CAMERA_2D') return '2D'
  return null
}

function sameContext(a: CameraCommand, b: CameraCommand): boolean {
  return (
    a.context?.buildingId === b.context?.buildingId && a.context?.floorId === b.context?.floorId
  )
}

export class SpatialCommandQueue {
  private pending: SpatialCommand[] = []
  private active: AbortController | null = null
  private processing = false

  constructor(
    private readonly executor: SpatialCommandExecutor,
    private readonly onError: (command: SpatialCommand, error: unknown) => void = console.error,
  ) {}

  enqueue(command: SpatialCommand): void {
    if (command.type === 'SWITCH_VIEW') {
      this.enqueueSwitch(command)
    } else {
      this.enqueueCamera(command)
    }

    void this.process()
  }

  private enqueueSwitch(command: Extract<SpatialCommand, { type: 'SWITCH_VIEW' }>): void {
    this.active?.abort()

    const targetCommands = this.pending.filter((item) => getCameraMode(item) === command.target)

    this.pending = [command, ...targetCommands]
  }

  private enqueueCamera(command: CameraCommand): void {
    if (command.movement === 'ABSOLUTE') {
      const activeCommand = this.getActiveCommand()

      if (
        activeCommand &&
        getCameraMode(activeCommand) === getCameraMode(command) &&
        activeCommand.type !== 'SWITCH_VIEW' &&
        sameContext(activeCommand, command)
      ) {
        this.active?.abort()
      }

      let lastSwitchIndex = -1

      for (let i = this.pending.length - 1; i >= 0; i--) {
        if (this.pending[i]?.type === 'SWITCH_VIEW') {
          lastSwitchIndex = i
          break
        }
      }

      let index = -1

      for (let i = this.pending.length - 1; i > lastSwitchIndex; i--) {
        const item = this.pending[i]!

        if (
          item.type !== 'SWITCH_VIEW' &&
          item.movement === 'ABSOLUTE' &&
          getCameraMode(item) === getCameraMode(command) &&
          sameContext(item, command)
        ) {
          index = i
          break
        }
      }

      if (index !== -1) {
        this.pending[index] = command
        return
      }
    }

    this.pending.push(command)
  }

  private getActiveCommand(): SpatialCommand | null {
    return this.active ? this.activeCommand : null
  }

  private activeCommand: SpatialCommand | null = null

  private async process(): Promise<void> {
    if (this.processing) return

    this.processing = true

    try {
      while (this.pending.length > 0) {
        const command = this.pending.shift()!
        const controller = new AbortController()

        this.active = controller
        this.activeCommand = command

        try {
          await this.executor.execute(command, controller.signal)
        } catch (error) {
          if (!controller.signal.aborted) {
            this.onError(command, error)
          }
        } finally {
          if (this.active === controller) {
            this.active = null
            this.activeCommand = null
          }
        }
      }
    } finally {
      this.processing = false

      if (this.pending.length > 0) {
        void this.process()
      }
    }
  }

  clear(): void {
    this.active?.abort()
    this.pending = []
  }

  get size(): number {
    return this.pending.length
  }

  get isProcessing(): boolean {
    return this.processing
  }
}
