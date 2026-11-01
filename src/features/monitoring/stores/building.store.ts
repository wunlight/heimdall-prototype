import type { Building, Floor } from '@/types/entity.type'
import { defineStore } from 'pinia'
import { loadFloorsByBuildingId } from '../services/task.service'

interface State {
  buildings: Building[]
  cachedFloors: Map<string, Floor[]>
  selectedBuilding: null | Building
  selectedFloor: null | Floor
  loadingBuildingIds: Set<string>
}

export const useBuildingStore = defineStore('building', {
  state: (): State => ({
    buildings: [],
    cachedFloors: new Map(),
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

    isBuildingFloorsLoading:
      (state) =>
      (buildingId: string): boolean => {
        return state.loadingBuildingIds.has(buildingId)
      },

    hasCachedFloors:
      (state) =>
      (buildingId: string): boolean => {
        const floors = state.cachedFloors.get(buildingId)
        return floors !== undefined && floors.length > 0
      },
  },

  actions: {
    setBuildings(data: Building[]) {
      this.buildings = data
    },

    setCachedFloors(buildingId: string, floors: Floor[]) {
      this.cachedFloors.set(buildingId, floors)
    },

    async selectBuilding(building: Building) {
      this.selectedBuilding = building
      this.selectedFloor = null

      // Check if floors already cached
      if (!this.cachedFloors.has(building.id)) {
        // Load floors and cache them
        this.loadingBuildingIds.add(building.id)
        try {
          const floors = await loadFloorsByBuildingId(building.id)
          this.cachedFloors.set(building.id, floors)
        } finally {
          this.loadingBuildingIds.delete(building.id)
        }
      }
    },

    async preLoadBuilding(buildingId: string) {
      // Pre-load floors without changing selected building
      if (!this.cachedFloors.has(buildingId) && !this.loadingBuildingIds.has(buildingId)) {
        this.loadingBuildingIds.add(buildingId)
        try {
          const floors = await loadFloorsByBuildingId(buildingId)
          this.cachedFloors.set(buildingId, floors)
        } finally {
          this.loadingBuildingIds.delete(buildingId)
        }
      }
    },

    async preLoadAllBuildings() {
      // Pre-load all buildings floors in background
      const promises = this.buildings.map((building) => this.preLoadBuilding(building.id))
      await Promise.allSettled(promises)
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
  },
})
