import { resolveSpatialColor } from '@/features/spatial-viewer/utils/spatial-color'
import type { Device, Event, Floor } from '@/shared/types/entity.type'

interface ProcessorOptions {
  devices: Map<string, Device[]>
  floors: Map<string, Floor[]>
  updateDeviceStatus: (deviceId: string, status: string) => void
  updateFloorStatus: (floorId: string, status: string) => void
  dispatchDeviceColor: (
    buildingId: string,
    floorId: string,
    deviceId: string,
    color: string,
  ) => Promise<void>
  dispatchFloorColor: (buildingId: string, floorId: string, color: string) => Promise<void>
}

export function useEventProcessor(options: ProcessorOptions) {
  async function processEvent(event: Event): Promise<void> {
    // 1. Resolve device dan floor
    let targetDevice: Device | undefined
    let targetFloor: Floor | undefined
    let targetBuildingId: string | undefined

    for (const [buildingId, floorList] of options.floors) {
      for (const floor of floorList) {
        const floorDevices = options.devices.get(floor.id) ?? []

        const device = floorDevices.find((item) => item.id === event.device_id)

        if (device) {
          targetDevice = device
          targetFloor = floor
          targetBuildingId = buildingId
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

    // 2. Update monitoring state
    options.updateDeviceStatus(targetDevice.id, newStatus)

    // 3. Dispatch device color
    await options.dispatchDeviceColor(
      targetBuildingId,
      targetFloor.id,
      targetDevice.id,
      resolveSpatialColor(newStatus),
    )

    // 4. Resolve aggregate floor status
    // TODO: calculate using all devices on this floor
  }

  return {
    processEvent,
  }
}
