import type { Device, StatusType } from '@/shared/types/entity.type'
import { defineStore } from 'pinia'
import { resolveDeviceColor } from '../utils/spatial-color'

export interface DeviceMarkerState {
  deviceId: string
  floorId: string
  color: string
  status: StatusType
  lastUpdated: number
}

interface State {
  markerStates: Map<string, DeviceMarkerState>
}

export const useDeviceMarkerStateStore = defineStore('device-marker-state', {
  state: (): State => ({
    markerStates: new Map(),
  }),

  getters: {
    markerColorMap(): Record<string, string> {
      const colorMap: Record<string, string> = {}
      this.markerStates.forEach((state) => {
        colorMap[state.deviceId] = state.color
      })
      return colorMap
    },

    abnormalDeviceCount(): number {
      let count = 0
      this.markerStates.forEach((state) => {
        if (state.status === 'ALARM' || state.status === 'TROUBLE') {
          count++
        }
      })
      return count
    },
  },

  actions: {
    initializeDeviceMarkers(devices: Device[]) {
      for (const device of devices) {
        const color = resolveDeviceColor(device.status)
        const state: DeviceMarkerState = {
          deviceId: device.id,
          floorId: device.floor_id,
          color,
          status: device.status,
          lastUpdated: Date.now(),
        }
        this.markerStates.set(device.id, state)
      }
    },

    updateDeviceMarkerColor(deviceId: string, color: string, status?: StatusType) {
      const existing = this.markerStates.get(deviceId)
      if (!existing) {
        console.warn(`Device marker state not found for ${deviceId}`)
        return false
      }

      existing.color = color
      if (status) {
        existing.status = status
      }
      existing.lastUpdated = Date.now()

      this.markerStates.set(deviceId, existing)
      return true
    },

    getDeviceMarkerColor(deviceId: string): string {
      const state = this.markerStates.get(deviceId)
      if (!state) {
        return resolveDeviceColor('NORMAL')
      }
      return state.color
    },

    getAbnormalDevices(): DeviceMarkerState[] {
      const abnormal: DeviceMarkerState[] = []
      this.markerStates.forEach((state) => {
        if (state.status === 'ALARM' || state.status === 'TROUBLE') {
          abnormal.push(state)
        }
      })
      return abnormal
    },

    clearMarkerStates() {
      this.markerStates.clear()
    },
  },
})
