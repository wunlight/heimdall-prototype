import type { Device } from '@/shared/types/entity.type'
import { useDeviceMarkerStateStore } from '../stores/device-marker-state.store'
import type { DeviceColorCommand } from '../types/spatial.type'
import type { useSpatialCommandQueue } from './use-spatial-command-queue'

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function useDeviceMarkerSynchronizer(
  buildingId: string,
  devices: Device[],
  commandQueue: ReturnType<typeof useSpatialCommandQueue>,
) {
  const store = useDeviceMarkerStateStore()

  const initializeMarkerStates = async () => {
    if (!devices || devices.length === 0) {
      return
    }

    store.clearMarkerStates()

    store.initializeDeviceMarkers(devices)

    const abnormalDevices = store.getAbnormalDevices()

    for (const deviceState of abnormalDevices) {
      const command: DeviceColorCommand = {
        id: generateId(),
        timestamp: Date.now(),
        source: 'SYSTEM',
        type: 'DEVICE_COLOR',
        context: {
          buildingId,
          floorId: deviceState.floorId,
          deviceId: deviceState.deviceId,
        },
        payload: { color: deviceState.color },
      }

      await commandQueue.enqueueCommand(command)
    }
  }

  const getDeviceMarkerColor = (deviceId: string): string => {
    return store.getDeviceMarkerColor(deviceId)
  }

  return {
    initializeMarkerStates,
    getDeviceMarkerColor,
  }
}
