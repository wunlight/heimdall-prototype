import { getAllBuildings, getDevicesByFloorId } from '@/db/operations'
import { useSpatialCache } from '@/features/monitoring/stores/spatial.cache'
import { loadFloorsByBuildingId } from '@/features/spatial-viewer/services/spatial.service'
import type { Device, Floor } from '@/shared/types/entity.type'

const loadFloorDimensions = async (floor: Floor): Promise<Floor> => {
  if (floor.blueprint_width && floor.blueprint_height) {
    return floor
  }

  return new Promise((resolve) => {
    if (!floor.blueprint_url) {
      resolve({ ...floor, blueprint_width: 1, blueprint_height: 1 })
      return
    }

    const img = new Image()
    img.src = floor.blueprint_url

    img.onload = () => {
      resolve({
        ...floor,
        blueprint_width: img.naturalWidth || 1,
        blueprint_height: img.naturalHeight || 1,
      })
    }

    img.onerror = () => {
      console.warn(`Gagal memuat dimensi gambar untuk floor: ${floor.id}`)
      resolve({
        ...floor,
        blueprint_width: 40,
        blueprint_height: 30,
      })
    }
  })
}

export const preLoadBuildings = async (updateMsg: (msg: string) => void) => {
  updateMsg('Fetching buildings')
  const buildings = await getAllBuildings()

  updateMsg('Storing buildings')
  const store = useSpatialCache()
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
      const rawFloors = await loadFloorsByBuildingId(building.id)
      updateMsg(`Loading blueprint dimensions for: ${building.name}`)

      floors = await Promise.all(rawFloors.map((floor) => loadFloorDimensions(floor)))
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
