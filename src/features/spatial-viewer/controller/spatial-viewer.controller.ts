import { SpatialCommandQueue, type SpatialCommandExecutor } from '../queue/spatial-command.queue'
import type { SpatialCommand, SpatialViewMode } from '../types/spatial.type'

export interface ViewLifecycle {
  activate(mode: SpatialViewMode, signal: AbortSignal): Promise<void>
}

export interface CameraController {
  execute(
    command: Extract<SpatialCommand, { type: 'CAMERA_3D' | 'CAMERA_2D' }>,
    signal: AbortSignal,
  ): Promise<void>
}

export class SpatialViewerController {
  private activeMode: SpatialViewMode = '3D'

  private queue: SpatialCommandQueue

  constructor(
    private readonly viewLifecycle: ViewLifecycle,
    private readonly camera3D: CameraController,
    private readonly camera2D: CameraController,
  ) {
    const executor: SpatialCommandExecutor = {
      execute: (command, signal) => this.executeCommand(command, signal),
    }

    this.queue = new SpatialCommandQueue(executor)
  }

  dispatch(command: SpatialCommand): void {
    this.queue.enqueue(command)
  }

  private async executeCommand(command: SpatialCommand, signal: AbortSignal): Promise<void> {
    if (signal.aborted) return

    if (command.type === 'SWITCH_VIEW') {
      await this.switchView(command.target, signal)
      return
    }

    const mode = command.type === 'CAMERA_3D' ? '3D' : '2D'

    if (mode !== this.activeMode) {
      return
    }

    const controller = mode === '3D' ? this.camera3D : this.camera2D

    await controller.execute(command, signal)
  }

  private async switchView(mode: SpatialViewMode, signal: AbortSignal): Promise<void> {
    if (signal.aborted) return

    await this.viewLifecycle.activate(mode, signal)

    if (signal.aborted) return

    this.activeMode = mode
  }

  get currentMode(): SpatialViewMode {
    return this.activeMode
  }

  dispose(): void {
    this.queue.clear()
  }
}
