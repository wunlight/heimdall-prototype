import type { GeoCoordinate, Vector3 } from '@/features/spatial-viewer/types/camera.type'
import type { SpatialViewMode } from '@/features/spatial-viewer/types/spatial.type'
import {
  resolveDeviceColor,
  resolveFloorColor,
} from '@/features/spatial-viewer/utils/spatial-color'
import {
  calculate2DWorldTarget,
  calculate3DWorldTarget,
} from '@/features/spatial-viewer/utils/spatial-world'
import type { Device, Event, Floor } from '@/shared/types/entity.type'

interface ProcessorOptions {
  devices: Map<string, Device[]>
  floors: Map<string, Floor[]>
  dispatchDeviceColor: (
    buildingId: string,
    floorId: string,
    deviceId: string,
    color: string,
  ) => Promise<void>
  dispatchFloorColor: (buildingId: string, floorId: string, color: string) => Promise<void>
  dispatchDeviceCamera: (
    buildingId: string,
    floorId: string,
    deviceId: string,
    worldTarget: Vector3 | GeoCoordinate,
  ) => Promise<void>
}

export function useEventProcessor(options: ProcessorOptions) {
  async function processEvent(event: Event, viewMode: SpatialViewMode): Promise<void> {
    let targetDevice: Device | undefined
    let targetFloor: Floor | undefined
    let targetBuildingId: string | undefined
    let floorIndex = -1

    for (const [buildingId, floorList] of options.floors) {
      for (let i = 0; i < floorList.length; i++) {
        const floor = floorList[i]!
        const floorDevices = options.devices.get(floor.id) ?? []

        const device = floorDevices.find((item) => item.id === event.device_id)
        if (device) {
          targetDevice = device
          targetFloor = floor
          targetBuildingId = buildingId
          floorIndex = i
          break
        }
      }

      if (targetDevice) break
    }

    if (!targetDevice || !targetFloor || !targetBuildingId) {
      console.warn(`Unable to resolve device context: ${event.device_id}`)
      return
    }

    const newStatus = event.type

    await options.dispatchDeviceColor(
      targetBuildingId,
      targetFloor.id,
      targetDevice.id,
      viewMode === '2D' && newStatus === 'NORMAL' ? 'transparent' : resolveDeviceColor(newStatus),
    )

    await options.dispatchFloorColor(targetBuildingId, targetFloor.id, resolveFloorColor(newStatus))

    const cameraTarget =
      viewMode === '3D'
        ? calculate3DWorldTarget(targetDevice, targetFloor, floorIndex)
        : calculate2DWorldTarget(targetDevice, targetFloor)

    await options.dispatchDeviceCamera(
      targetBuildingId,
      targetFloor.id,
      targetDevice.id,
      cameraTarget,
    )
  }

  return {
    processEvent,
  }
}
