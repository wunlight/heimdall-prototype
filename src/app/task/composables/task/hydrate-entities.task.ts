import { buildingOps, deviceOps, floorOps } from '@/shared/db/operations'
import { useEntityStore } from '@/shared/stores/entity.store'
import { generateMockData } from '@/shared/utils/mock-data.helper'

const entityStore = useEntityStore()

export const hydrateEntities = async (updateMsg: (msg: string) => void) => {
  updateMsg('Reading local database...')
  const [buildings, floors, devices] = await Promise.all([
    buildingOps.getAll(),
    floorOps.getAll(),
    deviceOps.getAll(),
  ])

  if (buildings.length <= 0) {
    updateMsg('Generating mock data')
    const mock = generateMockData()
    await Promise.all([
      buildingOps.bulkUpsert(mock.buildings),
      floorOps.bulkUpsert(mock.floors),
      deviceOps.bulkUpsert(mock.devices),
    ])
    updateMsg('Hydrating store')
    await entityStore.hydrate(mock.buildings, mock.floors, mock.devices)
    return
  }

  updateMsg('Hydrating store')
  await entityStore.hydrate(buildings, floors, devices)
}
