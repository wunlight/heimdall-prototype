import { getCachedBlueprintUrl } from '@/db/operations'
import type { Floor } from '@/types/entity.type'

// In-memory cache for blob URLs to avoid recreating them
const blobUrlCache = new Map<string, string>()

export const getBlueprintBlobUrl = async (floorId: string, publicUrl: string): Promise<string> => {
  // Check in-memory cache first
  const cachedUrl = blobUrlCache.get(floorId)
  if (cachedUrl) {
    return cachedUrl
  }

  // Get from Dexie cache (which stores blob)
  const url = await getCachedBlueprintUrl(floorId, publicUrl)

  // Store in memory cache if it's a blob URL
  if (url.startsWith('blob:')) {
    blobUrlCache.set(floorId, url)
  }

  return url
}

export const preloadBlueprints = async (
  floors: Floor[],
  onProgress?: (msg: string) => void,
): Promise<void> => {
  for (let i = 0; i < floors.length; i++) {
    const floor = floors[i]
    if (!floor?.blueprint_url) continue

    onProgress?.(`Caching blueprint: ${floor.name} (${i + 1}/${floors.length})`)
    await getBlueprintBlobUrl(floor.id, floor.blueprint_url)
  }
}

export const clearBlueprintUrlCache = (floorId?: string): void => {
  if (floorId) {
    const url = blobUrlCache.get(floorId)
    if (url?.startsWith('blob:')) {
      URL.revokeObjectURL(url)
    }
    blobUrlCache.delete(floorId)
  } else {
    blobUrlCache.forEach((url) => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url)
      }
    })
    blobUrlCache.clear()
  }
}

export const hasCachedBlueprintUrl = (floorId: string): boolean => {
  return blobUrlCache.has(floorId)
}
