import { db } from '@/shared/db/database'

const LEGACY_KEY = 'is_seeded'
const SEED_VERSION_KEY = 'seed_version'
const SEED_VERSION = '2.0.0'

const clearDatabase = () =>
  db.transaction('rw', db.tables, () => Promise.all(db.tables.map((t) => t.clear())))

export const versionCheck = async (update: (msg: string) => void) => {
  if (localStorage.getItem(LEGACY_KEY) !== null) {
    update('Removing legacy seed...')
    localStorage.removeItem(LEGACY_KEY)
    update('Clearing local database...')
    await clearDatabase()
    localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION)
    return
  }

  const current = localStorage.getItem(SEED_VERSION_KEY)
  if (current === SEED_VERSION) return

  update('Resetting local database')
  await clearDatabase()
  localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION)
}
