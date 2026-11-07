import { ref, type Ref } from 'vue'
import type { Camera2DPayload, Camera3DPayload } from '../types/camera.type'
import type {
  Camera2DCommand,
  Camera3DCommand,
  SpatialCommand,
  SpatialViewMode,
  SwitchViewCommand,
} from '../types/spatial.type'

export function useSpatialOrchestrator(
  viewMode: Ref<SpatialViewMode>,
  onCamera3DCommand?: (
    payload: Camera3DPayload,
    movement: 'ABSOLUTE' | 'RELATIVE',
    signal: AbortSignal,
  ) => Promise<void>,
  onCamera2DCommand?: (
    payload: Camera2DPayload,
    movement: 'ABSOLUTE' | 'RELATIVE',
    signal: AbortSignal,
  ) => Promise<void>,
) {
  const isTransitioning = ref(false)

  async function executeSwitchView(command: SwitchViewCommand, signal: AbortSignal): Promise<void> {
    if (viewMode.value === command.target) {
      console.log('Already in target view mode:', command.target)
      return
    }

    console.log('Switching view mode:', viewMode.value, '->', command.target)
    isTransitioning.value = true

    try {
      await sleep(500, signal)

      viewMode.value = command.target

      await sleep(100, signal)
    } finally {
      isTransitioning.value = false
    }
  }

  async function executeCamera3D(command: Camera3DCommand, signal: AbortSignal): Promise<void> {
    if (viewMode.value !== '3D') {
      console.warn('Camera 3D command ignored: not in 3D mode')
      return
    }

    if (!onCamera3DCommand) {
      console.warn('No Camera 3D handler registered')
      return
    }

    console.log('Executing Camera 3D command:', command.movement, command.payload)

    await onCamera3DCommand(command.payload, command.movement, signal)
  }

  async function executeCamera2D(command: Camera2DCommand, signal: AbortSignal): Promise<void> {
    if (viewMode.value !== '2D') {
      console.warn('Camera 2D command ignored: not in 2D mode')
      return
    }

    if (!onCamera2DCommand) {
      console.warn('No Camera 2D handler registered')
      return
    }

    console.log('Executing Camera 2D command:', command.movement, command.payload)

    await onCamera2DCommand(command.payload, command.movement, signal)
  }

  async function executeCommand(command: SpatialCommand, signal: AbortSignal): Promise<void> {
    switch (command.type) {
      case 'SWITCH_VIEW':
        await executeSwitchView(command, signal)
        break
      case 'CAMERA_3D':
        await executeCamera3D(command, signal)
        break
      case 'CAMERA_2D':
        await executeCamera2D(command, signal)
        break
      default:
        console.error('Unknown command type:', (command as any).type)
    }
  }

  function sleep(ms: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      if (signal.aborted) {
        reject(new DOMException('Aborted', 'AbortError'))
        return
      }

      const timeout = setTimeout(resolve, ms)

      const onAbort = () => {
        clearTimeout(timeout)
        reject(new DOMException('Aborted', 'AbortError'))
      }

      signal.addEventListener('abort', onAbort, { once: true })
    })
  }

  return {
    executeCommand,
    isTransitioning,
  }
}
