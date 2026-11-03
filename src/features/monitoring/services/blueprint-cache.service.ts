import { db } from '@/db/database'
import type { Floor } from '@/types/entity.type'

// In-memory cache for blob URLs to avoid recreating them
const blobUrlCache = new Map<string, string>()

/**
 * Get cached blueprint blob URL with optimized blob handling
 * Returns cached blob URL if available, otherwise fetches and caches
 */
export const getBlueprintBlobUrl = async (floorId: string, publicUrl: string): Promise<string> => {
  // Check in-memory cache first (fastest path)
  const cachedUrl = blobUrlCache.get(floorId)
  if (cachedUrl) {
    return cachedUrl
  }

  try {
    // Check Dexie cache for blob
    const cached = await db.blueprints.get(floorId)

    if (cached) {
      // Create blob URL from cached blob
      const url = URL.createObjectURL(cached.blob)
      blobUrlCache.set(floorId, url)
      return url
    }

    // Fetch from public URL if not cached
    const res = await fetch(publicUrl)
    if (!res.ok) {
      throw new Error(`Failed to fetch blueprint from ${publicUrl}`)
    }

    const blob = await res.blob()

    // Store blob in Dexie for future use
    await db.blueprints.put({
      floor_id: floorId,
      blob,
    })

    // Create and cache blob URL
    const url = URL.createObjectURL(blob)
    blobUrlCache.set(floorId, url)
    return url
  } catch (error) {
    console.warn(`Failed to cache blueprint for floor ${floorId}, fallback to public URL`, error)
    return publicUrl
  }
}

/**
 * Pre-create blob URLs during idle time using requestIdleCallback
 * This prevents blocking the main thread during user interactions
 */
export const preloadBlueprintsIdle = (floors: Floor[]): void => {
  if (typeof requestIdleCallback === 'undefined') {
    // Fallback for browsers without requestIdleCallback
    preloadBlueprints(floors)
    return
  }

  let index = 0

  const processNext = (deadline: IdleDeadline) => {
    // Process as many items as possible within the idle period
    while (index < floors.length && deadline.timeRemaining() > 0) {
      const floor = floors[index]
      if (floor?.blueprint_url && !blobUrlCache.has(floor.id)) {
        // Fire and forget - we don't want to block
        getBlueprintBlobUrl(floor.id, floor.blueprint_url).catch(() => {})
      }
      index++
    }

    // Schedule next batch if there are more items
    if (index < floors.length) {
      requestIdleCallback(processNext, { timeout: 1000 })
    }
  }

  requestIdleCallback(processNext, { timeout: 2000 })
}

/**
 * Preload blueprints sequentially with progress callback
 */
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

/**
 * Clear blob URL cache and revoke URLs to free memory
 */
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

/**
 * Check if a blob URL is already cached
 */
export const hasCachedBlueprintUrl = (floorId: string): boolean => {
  return blobUrlCache.has(floorId)
}
