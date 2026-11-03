import type { Building, Device, Floor, StatusType } from '@/types/entity.type'
import { defineStore } from 'pinia'
import { loadFloorsByBuildingId } from '../services/task.service'

interface State {
  buildings: Building[]
  cachedFloors: Map<string, Floor[]>
  cachedDevices: Map<string, Device[]>
  selectedBuilding: null | Building
  selectedFloor: null | Floor
  loadingBuildingIds: Set<string>
}

export const useBuildingStore = defineStore('building', {
  state: (): State => ({
    buildings: [],
    cachedFloors: new Map(),
    cachedDevices: new Map(),
    selectedBuilding: null,
    selectedFloor: null,
    loadingBuildingIds: new Set(),
  }),

  getters: {
    getFloorsByBuildingId:
      (state) =>
      (buildingId: string): Floor[] => {
        return state.cachedFloors.get(buildingId) ?? []
      },

    hasCachedFloors:
      (state) =>
      (buildingId: string): boolean => {
        const floors = state.cachedFloors.get(buildingId)
        return floors !== undefined && floors.length > 0
      },

    getDevicesByFloorId:
      (state) =>
      (floorId: string): Device[] => {
        return state.cachedDevices.get(floorId) ?? []
      },

    hasCachedDevices:
      (state) =>
      (floorId: string): boolean => {
        const devices = state.cachedDevices.get(floorId)
        return devices !== undefined && devices.length > 0
      },

    getFloorStatus:
      (state) =>
      (floorId: string): StatusType => {
        const devices = state.cachedDevices.get(floorId) ?? []
        if (devices.length === 0) return 'NORMAL'

        let status: StatusType = 'NORMAL'

        for (const device of devices) {
          if (device.status === 'ALARM') {
            return 'ALARM'
          }
          if (device.status === 'TROUBLE') {
            status = 'TROUBLE'
          }
        }

        return status
      },

    getBuildingStatus:
      (state) =>
      (buildingId: string): StatusType => {
        const floors = state.cachedFloors.get(buildingId) ?? []
        if (floors.length === 0) return 'NORMAL'

        let buildingStatus: StatusType = 'NORMAL'

        for (const floor of floors) {
          const devices = state.cachedDevices.get(floor.id) ?? []

          for (const device of devices) {
            if (device.status === 'ALARM') {
              return 'ALARM'
            }
            if (device.status === 'TROUBLE') {
              buildingStatus = 'TROUBLE'
            }
          }
        }

        return buildingStatus
      },
  },

  actions: {
    setBuildings(data: Building[]) {
      this.buildings = data
    },

    setCachedFloors(buildingId: string, floors: Floor[]) {
      this.cachedFloors.set(buildingId, floors)
    },

    setCachedDevices(floorId: string, devices: Device[]) {
      this.cachedDevices.set(floorId, devices)
    },

    async selectBuilding(building: Building) {
      this.selectedBuilding = building
      this.selectedFloor = null

      if (!this.cachedFloors.has(building.id)) {
        this.loadingBuildingIds.add(building.id)
        try {
          const floors = await loadFloorsByBuildingId(building.id)
          this.cachedFloors.set(building.id, floors)
        } finally {
          this.loadingBuildingIds.delete(building.id)
        }
      }
    },

    selectFloor(floor: Floor) {
      this.selectedFloor = floor
    },

    clearFloorsCache(buildingId?: string) {
      if (buildingId) {
        this.cachedFloors.delete(buildingId)
      } else {
        this.cachedFloors.clear()
      }
    },

    clearDevicesCache(floorId?: string) {
      if (floorId) {
        this.cachedDevices.delete(floorId)
      } else {
        this.cachedDevices.clear()
      }
    },
  },
})
