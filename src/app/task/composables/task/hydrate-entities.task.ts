import { buildingOps, deviceOps, floorOps } from '@/shared/db/operations'
import { useEntityStore } from '@/shared/stores/entity.store'
import { generateMockData } from '@/shared/utils/mock-data.helper'

interface ImageDimensions {
  width: number
  height: number
}

const readImageDimensions = (src: string): Promise<ImageDimensions | null> => {
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => {
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      })
    }
    image.onerror = () => resolve(null)
    image.src = src
  })
}

export const hydrateEntities = async (updateMsg: (msg: string) => void) => {
  const entityStore = useEntityStore()

  updateMsg('Reading local database...')
  let [buildings, floors, devices] = await Promise.all([
    buildingOps.getAll(),
    floorOps.getAll(),
    deviceOps.getAll(),
  ])

  if (buildings.length <= 0) {
    updateMsg('Generating mock data...')
    const mock = generateMockData()
    await Promise.all([
      buildingOps.bulkUpsert(mock.buildings),
      floorOps.bulkUpsert(mock.floors),
      deviceOps.bulkUpsert(mock.devices),
    ])

    buildings = mock.buildings
    floors = mock.floors
    devices = mock.devices
  }

  updateMsg('Reading floor blueprint dimensions...')
  const hydratedFloors = await Promise.all(
    floors.map(async (floor) => {
      if (!floor.blueprint_url) return floor

      const dimensions = await readImageDimensions(floor.blueprint_url)

      if (!dimensions) return floor

      return {
        ...floor,
        blueprint_width: dimensions.width,
        blueprint_height: dimensions.height,
      }
    }),
  )
  floors = hydratedFloors

  updateMsg('Hydrating store...')
  await entityStore.hydrate(buildings, floors, devices)
}
