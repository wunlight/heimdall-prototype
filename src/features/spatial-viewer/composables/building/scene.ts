import type { Device, Floor } from '@/shared/types/entity.type'
import * as THREE from 'three'

export interface BuildingScene {
  scene: THREE.Scene
  floorPlanes: Map<string, THREE.Mesh>
  floorSpaces: Map<string, THREE.Mesh>
  deviceMarkers: Map<string, Map<string, THREE.Mesh>>
  isLoading: boolean
}

type FloorLayerSize = {
  width: number
  depth: number
}

const MAX_CACHE_SIZE = 5
const FLOOR_HEIGHT = 16

const buildingScenes = new Map<string, BuildingScene>()

export function useBuildingScene() {
  const hasScene = (buildingId: string): boolean => {
    const cached = buildingScenes.get(buildingId)
    return cached !== undefined && cached.floorPlanes.size > 0
  }

  const isLoading = (buildingId: string): boolean => {
    const cached = buildingScenes.get(buildingId)
    return cached?.isLoading ?? false
  }

  const getOrCreateScene = (buildingId: string): BuildingScene => {
    if (!buildingScenes.has(buildingId)) {
      if (buildingScenes.size >= MAX_CACHE_SIZE) {
        const oldestKey = buildingScenes.keys().next().value
        if (oldestKey) disposeBuilding(oldestKey)
      }

      buildingScenes.set(buildingId, {
        scene: new THREE.Scene(),
        floorPlanes: new Map(),
        floorSpaces: new Map(),
        deviceMarkers: new Map(),
        isLoading: false,
      })
    }
    return buildingScenes.get(buildingId)!
  }

  const renderBuilding = async (
    buildingId: string,
    floors: Floor[],
    devicesByFloor: Map<string, Device[]>,
    baseScale: number = 40,
  ): Promise<void> => {
    const cached = getOrCreateScene(buildingId)

    if (cached.floorPlanes.size > 0) {
      // Already loaded
      return
    }

    cached.isLoading = true

    const textureLoader = new THREE.TextureLoader()

    const insertFloorPlane = (
      floorId: string,
      blueprint: string,
      yPos: number,
    ): Promise<FloorLayerSize> => {
      return new Promise((resolve) => {
        textureLoader.load(blueprint, (texture) => {
          const height = texture.image.height
          const width = texture.image.width
          const aspectRatio = width / height

          const planeWidth = baseScale
          const planeDepth = baseScale / aspectRatio

          const geometry = new THREE.PlaneGeometry(planeWidth, planeDepth)
          const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
            transparent: true,
          })

          const plane = new THREE.Mesh(geometry, material)
          plane.rotation.x = -Math.PI / 2
          plane.position.y = yPos

          cached.scene.add(plane)
          cached.floorPlanes.set(floorId, plane)

          resolve({
            width: planeWidth,
            depth: planeDepth,
          })
        })
      })
    }

    const insertFloorSpace = (
      yPos: number,
      width: number,
      depth: number,
      height: number,
      data: Floor,
    ) => {
      const geometry = new THREE.BoxGeometry(width, height, depth)
      geometry.translate(0, height / 2, 0)

      const material = new THREE.MeshBasicMaterial({
        color: '#62748E',
        transparent: true,
        opacity: 0.3,
        wireframe: false,
      })

      const space = new THREE.Mesh(geometry, material)
      space.position.y = yPos
      space.userData = { ...data }

      const edges = new THREE.EdgesGeometry(geometry)
      const line = new THREE.LineBasicMaterial({
        color: '#62748E',
        linewidth: 3,
        transparent: true,
        opacity: 0.8,
      })
      const edgeLines = new THREE.LineSegments(edges, line)

      space.add(edgeLines)

      cached.scene.add(space)
      cached.floorSpaces.set(data.id, space)
    }

    const insertDeviceMarker = (
      floorId: string,
      yPos: number,
      planeWidth: number,
      planeDepth: number,
      data: Device,
    ) => {
      const markerX = (data.x - 0.5) * planeWidth
      const markerZ = (data.y - 0.5) * planeDepth

      const geometry = new THREE.SphereGeometry(0.75, 16, 16)

      const material = new THREE.MeshBasicMaterial({ color: '#2B7FFF' })
      const marker = new THREE.Mesh(geometry, material)

      marker.position.set(markerX, yPos + 0.5, markerZ)
      marker.userData = { ...data }

      cached.scene.add(marker)

      if (!cached.deviceMarkers.has(floorId)) {
        cached.deviceMarkers.set(floorId, new Map())
      }

      const floorDevices = cached.deviceMarkers.get(floorId)!
      floorDevices.set(String(data.id), marker)
    }

    const BATCH_SIZE = 2

    for (let batchStart = 0; batchStart < floors.length; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, floors.length)
      const batch = floors.slice(batchStart, batchEnd)

      await Promise.all(
        batch.map(async (floor, batchIdx) => {
          if (!floor) return

          const idx = batchStart + batchIdx
          const yPos = idx * FLOOR_HEIGHT

          try {
            const { width, depth } = await insertFloorPlane(floor.id, floor.blueprint_url, yPos)
            insertFloorSpace(yPos, width, depth, FLOOR_HEIGHT, floor)

            const floorDevices = devicesByFloor.get(floor.id) ?? []
            floorDevices.forEach((device) => {
              insertDeviceMarker(floor.id, yPos, width, depth, device)
            })
          } catch (e) {
            console.warn(`Failed to load floor ${floor.name}: `, e)
          }
        }),
      )
    }

    cached.isLoading = false
  }

  const setFloorSpaceColor = (
    buildingId: string,
    floorId: string,
    color: THREE.ColorRepresentation,
  ) => {
    const building = buildingScenes.get(buildingId)
    if (!building) return false

    const floorSpace = building.floorSpaces.get(floorId)
    if (!floorSpace) return false

    const material = floorSpace.material as THREE.MeshBasicMaterial
    material.color.set(color)

    floorSpace.children.forEach((child) => {
      if (child instanceof THREE.LineSegments) {
        const edgeMaterial = child.material as THREE.LineBasicMaterial
        edgeMaterial.color.set(color)
      }
    })

    return true
  }

  const setDeviceMarkerColor = (
    buildingId: string,
    floorId: string,
    deviceId: string,
    color: THREE.ColorRepresentation,
  ) => {
    const building = buildingScenes.get(buildingId)
    if (!building) return false

    const floorDevices = building.deviceMarkers.get(floorId)
    if (!floorDevices) return false

    const marker = floorDevices.get(deviceId)
    if (!marker) return false

    const material = marker.material as THREE.MeshBasicMaterial
    material.color.set(color)

    return true
  }

  const disposeBuilding = (buildingId: string) => {
    const building = buildingScenes.get(buildingId)
    if (!building) return

    building.floorPlanes.forEach((plane) => {
      building.scene.remove(plane)
      plane.geometry.dispose()

      const materials = Array.isArray(plane.material) ? plane.material : [plane.material]
      materials.forEach((mat) => {
        const material = mat as THREE.MeshBasicMaterial
        if (material.map) material.map.dispose()
        mat.dispose()
      })
    })

    building.floorSpaces.forEach((space) => {
      building.scene.remove(space)
      space.geometry.dispose()

      const materials = Array.isArray(space.material) ? space.material : [space.material]
      materials.forEach((mat) => {
        const material = mat as THREE.MeshBasicMaterial
        if (material.map) material.map.dispose()
        mat.dispose()
      })

      space.children.forEach((child) => {
        if (child instanceof THREE.LineSegments) {
          child.geometry.dispose()

          const materials = Array.isArray(child.material) ? child.material : [child.material]
          materials.forEach((mat) => {
            const material = mat as THREE.MeshBasicMaterial
            if (material.map) material.map.dispose()
            mat.dispose()
          })
        }
      })
    })

    building.deviceMarkers.forEach((floorDevices) => {
      floorDevices.forEach((marker) => {
        building.scene.remove(marker)
        marker.geometry.dispose()

        const materials = Array.isArray(marker.material) ? marker.material : [marker.material]
        materials.forEach((material) => material.dispose())
      })
    })

    buildingScenes.delete(buildingId)
  }

  const clearAllBuildings = () => {
    buildingScenes.forEach((_, buildingId) => {
      disposeBuilding(buildingId)
    })
  }

  return {
    hasScene,
    isLoading,
    getOrCreateScene,
    renderBuilding,
    setFloorSpaceColor,
    setDeviceMarkerColor,
    disposeBuilding,
    clearAllBuildings,
  }
}
