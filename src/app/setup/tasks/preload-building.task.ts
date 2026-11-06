import { getAllBuildings, getDevicesByFloorId } from '@/db/operations'
import { loadFloorsByBuildingId } from '@/features/spatial-viewer/services/spatial.service'
import { useSpatialStore } from '@/features/spatial-viewer/stores/spatial.store'
import type { Device, Floor } from '@/shared/types/entity.type'

export const preLoadBuildings = async (updateMsg: (msg: string) => void) => {
  updateMsg('Fetching buildings')
  const buildings = await getAllBuildings()

  updateMsg('Storing buildings')
  const store = useSpatialStore()
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
