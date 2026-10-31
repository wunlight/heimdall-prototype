import type { Building, Floor } from '@/types/entity.type'
import { defineStore } from 'pinia'
import { loadFloorsByBuildingId } from '../services/task.service'

interface State {
  buildings: Building[]
  floors: Floor[]
  selectedBuilding: null | Building
}

export const useBuildingStore = defineStore('building', {
  state: (): State => ({
    buildings: [],
    floors: [],
    selectedBuilding: null,
  }),

  actions: {
    setBuildings(data: Building[]) {
      this.buildings = data
    },

    async selectBuilding(data: Building) {
      this.selectedBuilding = data
      const res = await loadFloorsByBuildingId(data.id)
      this.setFloors(res)
    },

    setFloors(data: Floor[]) {
      this.floors = data
    },
  },
})
