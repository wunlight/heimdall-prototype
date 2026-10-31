import { getAllBuildings, getFloorsByBuildingId } from '@/db/operations'
import type { Building, Floor } from '@/types/entity.type'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useBuildingStore = defineStore('building', () => {
  const buildings = ref<Building[]>([])
  const floors = ref<Floor[]>([])

  const activeBuilding = ref<null | Building>(null)

  const loadBuildings = async () => {
    buildings.value = await getAllBuildings()
  }

  const selectBuilding = async (building: Building) => {
    activeBuilding.value = building
    floors.value = await getFloorsByBuildingId(building.id)
  }

  return {
    buildings,
    floors,
    activeBuilding,
    loadBuildings,
    selectBuilding,
  }
})
