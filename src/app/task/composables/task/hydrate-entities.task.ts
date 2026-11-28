import { buildingOps, deviceOps, floorOps } from '@/shared/db/operations'
import { useEntityStore } from '@/shared/stores/entity.store'
import { generateMockData } from '@/shared/utils/mock-data.helper'

interface ImageDimensions {
  width: number
  height: number
}

const IMAGE_TIMEOUT_MS = 8_000

const readImageDimensions = (src: string): Promise<ImageDimensions | null> => {
  return new Promise((resolve) => {
    const image = new Image()
    const timer = setTimeout(() => {
      console.error('[blueprint] timeout', src)
      resolve(null)
    }, IMAGE_TIMEOUT_MS)

    image.onload = () => {
      clearTimeout(timer)
      const { naturalWidth: width, naturalHeight: height } = image
      if (width <= 0 || height <= 0) {
        console.error('[blueprint] invalid dimension', src, { width, height })
        return resolve(null)
      }
      resolve({ width, height })
    }
    image.onerror = (e) => {
      clearTimeout(timer)
      console.error('[blueprint] failed to load', src, e)
      resolve(null)
    }
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
  floors = await Promise.all(
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

  updateMsg('Hydrating store...')
  await entityStore.hydrate(buildings, floors, devices)
}
