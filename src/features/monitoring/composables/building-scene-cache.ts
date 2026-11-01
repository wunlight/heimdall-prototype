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

export interface CachedScene {
  scene: Scene
  floorLayers: Mesh[]
  floorAreas: Mesh[]
  isLoading: boolean
  progress: number
}

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

  const loadFloorsToScene = async (
    buildingId: string,
    floors: Floor[],
    baseScale: number = 40,
    initialColor: string = '#62748e',
  ): Promise<void> => {
    const cached = getOrCreateScene(buildingId)

    if (cached.floorLayers.length > 0) {
      // Already loaded
      return
    }

    cached.isLoading = true
    cached.progress = 0

    const textureLoader = new TextureLoader()

    const insertFloorLayer = (
      img: string,
      yPos: number,
    ): Promise<{ width: number; depth: number }> => {
      return new Promise((resolve) => {
        textureLoader.load(img, (texture) => {
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
        })
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

    for (let idx = 0; idx < floors.length; idx++) {
      const floor = floors[idx]
      if (!floor) continue

      const yPos = idx * FLOOR_HEIGHT

      const { width, depth } = await insertFloorLayer(floor.blueprint_url, yPos)
      insertFloorArea(floor, yPos, width, depth, FLOOR_HEIGHT)

      cached.progress = ((idx + 1) / floors.length) * 100
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
    loadFloorsToScene,
    disposeScene,
    clearCache,
  }
}
