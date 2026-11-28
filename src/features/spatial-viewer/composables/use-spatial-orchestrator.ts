import { ref, type Ref } from 'vue'
import type { BuildingCameraPayload, FloorCameraPayload } from '../types/camera.type'
import type {
  BuildingCameraCommand,
  DeviceColorCommand,
  FloorCameraCommand,
  FloorColorCommand,
  SpatialCommand,
  SpatialViewMode,
  SwitchViewCommand,
} from '../types/spatial.type'

export function useSpatialOrchestrator(
  viewMode: Ref<SpatialViewMode>,
  onBuildingCameraCommand?: (
    payload: BuildingCameraPayload,
    movement: 'ABSOLUTE' | 'RELATIVE',
    signal: AbortSignal,
  ) => Promise<void>,
  onFloorCameraCommand?: (
    payload: FloorCameraPayload,
    movement: 'ABSOLUTE' | 'RELATIVE',
    signal: AbortSignal,
  ) => Promise<void>,
  onFloorColorCommand?: (buildingId: string, floorId: string, color: string) => Promise<void>,
  onDeviceColorCommand?: (
    buildingId: string,
    floorId: string,
    deviceId: string,
    color: string,
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

  async function executeBuildingCamera(
    command: BuildingCameraCommand,
    signal: AbortSignal,
  ): Promise<void> {
    if (viewMode.value !== '3D') {
      console.warn('Camera 3D command ignored: not in 3D mode')
      return
    }

    if (!onBuildingCameraCommand) {
      console.warn('No Camera 3D handler registered')
      return
    }

    console.log('Executing Camera 3D command:', command.movement, command.payload)

    await onBuildingCameraCommand(command.payload, command.movement, signal)
  }

  async function executeFloorCamera(
    command: FloorCameraCommand,
    signal: AbortSignal,
  ): Promise<void> {
    if (viewMode.value !== '2D') {
      console.warn('Camera 2D command ignored: not in 2D mode')
      return
    }

    if (!onFloorCameraCommand) {
      console.warn('No Camera 2D handler registered')
      return
    }

    console.log('Executing Camera 2D command:', command.movement, command.payload)

    await onFloorCameraCommand(command.payload, command.movement, signal)
  }

  async function executeFloorColor(command: FloorColorCommand): Promise<void> {
    if (!command.context || !command.context.buildingId || !command.context.floorId) {
      return
    }

    if (!onFloorColorCommand) {
      return
    }

    await onFloorColorCommand(
      command.context.buildingId,
      command.context.floorId,
      command.payload.color,
    )
  }

  async function executeDeviceColor(command: DeviceColorCommand): Promise<void> {
    if (
      !command.context ||
      !command.context.buildingId ||
      !command.context.floorId ||
      !command.context.deviceId
    ) {
      return
    }

    if (!onDeviceColorCommand) {
      return
    }

    await onDeviceColorCommand(
      command.context.buildingId,
      command.context.floorId,
      command.context.deviceId,
      command.payload.color,
    )
  }

  async function executeCommand(command: SpatialCommand, signal: AbortSignal): Promise<void> {
    switch (command.type) {
      case 'SWITCH_VIEW':
        await executeSwitchView(command, signal)
        break
      case 'BUILDING_CAMERA':
        await executeBuildingCamera(command, signal)
        break
      case 'FLOOR_CAMERA':
        await executeFloorCamera(command, signal)
        break
      case 'FLOOR_COLOR':
        await executeFloorColor(command)
        break
      case 'DEVICE_COLOR':
        await executeDeviceColor(command)
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
