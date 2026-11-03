import type { Floor } from '@/types/entity.type'
import {
  BoxGeometry,
  DoubleSide,
  EdgesGeometry,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Scene,
  TextureLoader,
} from 'three'
import { getBlueprintBlobUrl } from '../services/blueprint-cache.service'

export interface CachedScene {
  scene: Scene
  floorLayers: Mesh[]
  floorAreas: Mesh[]
  isLoading: boolean
  progress: number
  loadedCount: number
  totalCount: number
}

export type ProgressCallback = (loaded: number, total: number, floorName: string) => void

const FLOOR_HEIGHT = 10

const sceneCache = new Map<string, CachedScene>()

export function useBuildingSceneCache() {
  const getOrCreateScene = (buildingId: string): CachedScene => {
    if (!sceneCache.has(buildingId)) {
      sceneCache.set(buildingId, {
        scene: new Scene(),
        floorLayers: [],
        floorAreas: [],
        isLoading: false,
        progress: 0,
        loadedCount: 0,
        totalCount: 0,
      })
    }
    return sceneCache.get(buildingId)!
  }

  const hasScene = (buildingId: string): boolean => {
    const cached = sceneCache.get(buildingId)
    return cached !== undefined && cached.floorLayers.length > 0
  }

  const isLoading = (buildingId: string): boolean => {
    const cached = sceneCache.get(buildingId)
    return cached?.isLoading ?? false
  }

  const getProgress = (buildingId: string): number => {
    const cached = sceneCache.get(buildingId)
    return cached?.progress ?? 0
  }

  const getLoadedCount = (buildingId: string): number => {
    const cached = sceneCache.get(buildingId)
    return cached?.loadedCount ?? 0
  }

  const getTotalCount = (buildingId: string): number => {
    const cached = sceneCache.get(buildingId)
    return cached?.totalCount ?? 0
  }

  const loadFloorsToScene = async (
    buildingId: string,
    floors: Floor[],
    baseScale: number = 40,
    initialColor: string = '#62748e',
    onProgress?: ProgressCallback,
  ): Promise<void> => {
    const cached = getOrCreateScene(buildingId)

    if (cached.floorLayers.length > 0) {
      // Already loaded
      return
    }

    cached.isLoading = true
    cached.progress = 0
    cached.loadedCount = 0
    cached.totalCount = floors.length

    const textureLoader = new TextureLoader()

    const insertFloorLayer = (
      img: string,
      yPos: number,
    ): Promise<{ width: number; depth: number }> => {
      return new Promise((resolve, reject) => {
        textureLoader.load(
          img,
          (texture) => {
            const imgHeight = texture.image.height
            const imgWidth = texture.image.width
            const imgAspect = imgWidth / imgHeight

            const planeWidth = baseScale
            const planeDepth = baseScale / imgAspect

            const geometry = new PlaneGeometry(planeWidth, planeDepth)
            const material = new MeshBasicMaterial({
              map: texture,
              side: DoubleSide,
              transparent: true,
            })

            const plane = new Mesh(geometry, material)
            plane.rotation.x = -Math.PI / 2
            plane.position.y = yPos

            cached.scene.add(plane)
            cached.floorLayers.push(plane)

            resolve({ width: planeWidth, depth: planeDepth })
          },
          undefined,
          (error) => {
            console.error(`Failed to load texture: ${img}`, error)
            reject(error)
          },
        )
      })
    }

    const insertFloorArea = (
      floor: Floor,
      yPos: number,
      width: number,
      depth: number,
      height: number,
    ) => {
      const geometry = new BoxGeometry(width, height, depth)
      geometry.translate(0, height / 2, 0)

      const material = new MeshBasicMaterial({
        color: initialColor,
        transparent: true,
        opacity: 0.3,
        wireframe: false,
      })

      const box = new Mesh(geometry, material)
      box.position.y = yPos
      box.userData = { ...floor }

      const edges = new EdgesGeometry(geometry)
      const line = new LineBasicMaterial({
        color: initialColor,
        linewidth: 2,
        transparent: true,
        opacity: 0.8,
      })
      const edgeLines = new LineSegments(edges, line)
      box.add(edgeLines)

      cached.scene.add(box)
      cached.floorAreas.push(box)
    }

    // Load floors in parallel batches to avoid blocking main thread
    const BATCH_SIZE = 2 // Load 2 floors concurrently

    for (let batchStart = 0; batchStart < floors.length; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, floors.length)
      const batch = floors.slice(batchStart, batchEnd)

      // Load batch in parallel
      const batchResults = await Promise.all(
        batch.map(async (floor, batchIdx) => {
          if (!floor) return null

          const idx = batchStart + batchIdx
          const yPos = idx * FLOOR_HEIGHT

          try {
            // Use cached blueprint URL
            const blueprintUrl = await getBlueprintBlobUrl(floor.id, floor.blueprint_url)

            const { width, depth } = await insertFloorLayer(blueprintUrl, yPos)
            insertFloorArea(floor, yPos, width, depth, FLOOR_HEIGHT)

            return { success: true, floor }
          } catch (error) {
            console.warn(`Failed to load floor ${floor.name}:`, error)
            return { success: false, floor }
          }
        }),
      )

      // Update progress after each batch
      const successCount = batchResults.filter((r) => r?.success).length
      cached.loadedCount += batch.length
      cached.progress = (cached.loadedCount / floors.length) * 100

      // Report progress
      batchResults.forEach((result) => {
        if (result?.floor) {
          onProgress?.(cached.loadedCount, floors.length, result.floor.name)
        }
      })

      // Small delay to allow UI updates
      await new Promise((resolve) => setTimeout(resolve, 0))
    }

    cached.isLoading = false
  }

  const disposeScene = (buildingId: string) => {
    const cached = sceneCache.get(buildingId)
    if (!cached) return

    cached.floorLayers.forEach((mesh) => {
      cached.scene.remove(mesh)
      mesh.geometry.dispose()
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      materials.forEach((mat) => {
        const materialWithMap = mat as MeshBasicMaterial
        if (materialWithMap.map) {
          materialWithMap.map.dispose()
        }
        mat.dispose()
      })
    })

    cached.floorAreas.forEach((mesh) => {
      cached.scene.remove(mesh)
      mesh.geometry.dispose()
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((mat) => mat.dispose())
      } else {
        mesh.material.dispose()
      }
      mesh.children.forEach((child) => {
        if (child instanceof LineSegments) {
          child.geometry.dispose()
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose())
          } else {
            child.material.dispose()
          }
        }
      })
    })

    sceneCache.delete(buildingId)
  }

  const clearCache = () => {
    sceneCache.forEach((_, buildingId) => {
      disposeScene(buildingId)
    })
  }

  return {
    getOrCreateScene,
    hasScene,
    isLoading,
    getProgress,
    getLoadedCount,
    getTotalCount,
    loadFloorsToScene,
    disposeScene,
    clearCache,
  }
}
