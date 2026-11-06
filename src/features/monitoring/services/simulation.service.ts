import { getDevices } from '@/db/operations'
import type { Device } from '../../../shared/types/entity.type'

export interface DeviceOption {
  label: string
  value: string
}

class SimulationService {
  private deviceOptionsCache: DeviceOption[] | null = null

  /**
   * Fetch device options from database
   * Returns options in format: {label: "type+id", value: "id"}
   * Cached after first fetch
   */
  async getDeviceOptions(): Promise<DeviceOption[]> {
    if (this.deviceOptionsCache) {
      return this.deviceOptionsCache
    }

    const devices: Device[] = await getDevices()
    this.deviceOptionsCache = devices.map((device) => ({
      label: `${device.type} - ${device.id}`,
      value: device.id,
    }))

    return this.deviceOptionsCache
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.deviceOptionsCache = null
  }
}

export const simulationService = new SimulationService()
