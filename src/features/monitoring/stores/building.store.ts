import type { Building, Floor } from '@/types/entity.type'
import { defineStore } from 'pinia'
import { getBlueprintBlobUrl } from '../services/blueprint-cache.service'
import { loadFloorsByBuildingId } from '../services/task.service'

interface State {
  buildings: Building[]
  cachedFloors: Map<string, Floor[]>
  cachedBlueprintUrls: Map<string, string>
  selectedBuilding: null | Building
  selectedFloor: null | Floor
  loadingBuildingIds: Set<string>
}

export const useBuildingStore = defineStore('building', {
  state: (): State => ({
    buildings: [],
    cachedFloors: new Map(),
    cachedBlueprintUrls: new Map(),
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

    getBlueprintUrl:
      (state) =>
      (floorId: string): string | undefined => {
        return state.cachedBlueprintUrls.get(floorId)
      },
  },

  actions: {
    setBuildings(data: Building[]) {
      this.buildings = data
    },

    setCachedFloors(buildingId: string, floors: Floor[]) {
      this.cachedFloors.set(buildingId, floors)
    },

    async cacheBlueprintUrl(floorId: string, publicUrl: string): Promise<string> {
      const cached = this.cachedBlueprintUrls.get(floorId)
      if (cached) return cached

      const url = await getBlueprintBlobUrl(floorId, publicUrl)
      this.cachedBlueprintUrls.set(floorId, url)
      return url
    },

    async cacheBlueprintsForFloors(floors: Floor[]): Promise<void> {
      await Promise.all(
        floors
          .filter((f) => f.blueprint_url)
          .map((floor) => this.cacheBlueprintUrl(floor.id, floor.blueprint_url)),
      )
    },

    async selectBuilding(building: Building) {
      this.selectedBuilding = building
      this.selectedFloor = null

      if (!this.cachedFloors.has(building.id)) {
        this.loadingBuildingIds.add(building.id)
        try {
          const floors = await loadFloorsByBuildingId(building.id)
          this.cachedFloors.set(building.id, floors)

          // Pre-cache blueprint URLs for all floors
          await this.cacheBlueprintsForFloors(floors)
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
  },
})
