import { db } from '@/shared/db/database'

const LEGACY_KEY = 'is_seeded'
const SEED_VERSION_KEY = 'seed_version'
const SEED_VERSION = '2.0.1'
const DB_NAME = 'HeimdallDB'

const deleteDatabase = async () => {
  db.close()
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
    req.onblocked = () => {
      console.warn('Please close the other tabs')
    }
  })
}

export const versionCheck = async (update: (msg: string) => void) => {
  localStorage.removeItem(LEGACY_KEY)

  const current = localStorage.getItem(SEED_VERSION_KEY)
  if (current === SEED_VERSION) return

  update('Resetting local database...')
  await deleteDatabase()
  localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION)

  await db.open()
}
