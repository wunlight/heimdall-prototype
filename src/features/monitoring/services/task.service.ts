import {
  getAllBuildings,
  getDevicesByFloorId,
  getFloorsByBuildingId,
  seedDatabase,
} from '@/db/operations'
import type { Device, Floor } from '@/features/monitoring/types/entity.type'
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

export const loadFloorsByBuildingId = async (id: string) => {
  return await getFloorsByBuildingId(id)
}

export const preLoadBuildings = async (updateMsg: (msg: string) => void) => {
  updateMsg('Fetching buildings')
  const buildings = await getAllBuildings()

  updateMsg('Storing buildings')
  const store = useBuildingStore()
  store.setBuildings(buildings)

  if (buildings.length === 0) {
    updateMsg('No buildings found to preload floors')
    return
  }

  updateMsg('Pre-load floors for all buildings')
  for (let i = 0; i < buildings.length; i++) {
    const building = buildings[i]
    if (!building) continue

    let floors: Floor[] = []

    if (!store.hasCachedFloors(building.id)) {
      floors = await loadFloorsByBuildingId(building.id)
      store.setCachedFloors(building.id, floors)
    } else {
      floors = store.getFloorsByBuildingId(building.id)
    }

    if (floors && floors.length > 0) {
      updateMsg(`Caching devices for building: ${building.name} (${i + 1}/${buildings.length})`)

      for (const floor of floors) {
        if (!store.hasCachedDevices(floor.id)) {
          try {
            const devices: Device[] = await getDevicesByFloorId(floor.id)
            store.setCachedDevices(floor.id, devices)
          } catch (e) {
            console.warn(`Failed to preload devices for floor ID: ${floor.id}`, e)
          }
        }
      }
    }
  }

  updateMsg('Buildings, floors, and devices preloaded successfully')
}
