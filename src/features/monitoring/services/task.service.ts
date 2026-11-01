import { getAllBuildings, getFloorsByBuildingId, seedDatabase } from '@/db/operations'
import { generateMockData } from '@/utils/mock-data'
import { useBuildingStore } from '../stores/building.store'

const IS_SEEDED_KEY = 'is_seeded'

export const databaseSeeding = async (updateMsg: (msg: string) => void) => {
  if (localStorage.getItem(IS_SEEDED_KEY) === 'true') {
    updateMsg('Database already initialized')
    return
  }

  updateMsg('Generating mock buildings, floors, and devices')
  const data = generateMockData()
  await new Promise((resolve) => setTimeout(resolve, 500))

  updateMsg('Storing data to local database')
  await seedDatabase({
    buildings: data.buildings,
    floors: data.floors,
    devices: data.devices,
    events: data.events,
  })

  localStorage.setItem(IS_SEEDED_KEY, String(true))
}

export const loadBuildings = async (updateMsg: (msg: string) => void) => {
  updateMsg('Fetching buildings')
  const buildings = await getAllBuildings()
  await new Promise((resolve) => setTimeout(resolve, 500))

  updateMsg('Storing buildings')
  const store = useBuildingStore()
  store.setBuildings(buildings)
  await new Promise((resolve) => setTimeout(resolve, 500))
}

export const preLoadAllFloors = async (updateMsg: (msg: string) => void) => {
  const store = useBuildingStore()
  const buildings = store.buildings

  if (buildings.length === 0) {
    updateMsg('No buildings to preload')
    return
  }

  updateMsg('Pre-loading all building floors')

  for (let i = 0; i < buildings.length; i++) {
    const building = buildings[i]
    if (!building) continue

    updateMsg(`Loading floors for ${building.name} (${i + 1}/${buildings.length})`)

    if (!store.hasCachedFloors(building.id)) {
      const floors = await getFloorsByBuildingId(building.id)
      store.setCachedFloors(building.id, floors)
    }
  }

  updateMsg('All floors pre-loaded')
}

export const loadFloorsByBuildingId = async (id: string) => {
  return await getFloorsByBuildingId(id)
}
