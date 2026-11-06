import { seedDatabase } from '@/db/operations'
import { generateMockData } from '@/utils/mock-data'

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
