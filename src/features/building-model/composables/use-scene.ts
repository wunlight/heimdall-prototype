import type { Device, Floor } from '@/shared/types/entity.type'
import * as THREE from 'three'

interface BuildingScene {
  scene: THREE.Scene
  floorPlanes: Map<string, THREE.Mesh>
  floorSpaces: Map<string, THREE.Mesh>
  deviceMarkers: Map<string, Map<string, THREE.Mesh>>
  isLoading: boolean
}

const MAX_CACHE_SIZE = 5
const FLOOR_HEIGHT = 16
const BATCH_SIZE = 2
const FLOOR_SPACE_COLOR = '#62748E'
const DEFAULT_BASE_SCALE = 40

const buildingScenes = new Map<string, BuildingScene>()

export function useBuildingScene() {
  return {
    hasBuildingScene,
    isBuildingLoading,
    getOrCreateBuildingScene,
    renderBuildingScene,
    setFloorSpaceColor,
    setDeviceMarkerColor,
    disposeBuildingScene,
    disposeAllBuildingScenes,
  }
}

const getScene = (buildingId: string) => buildingScenes.get(buildingId)

const hasBuildingScene = (buildingId: string) => (getScene(buildingId)?.floorPlanes.size ?? 0) > 0

const isBuildingLoading = (buildingId: string) => getScene(buildingId)?.isLoading ?? false

const evictOldestScenes = (incomingId: string) => {
  if (buildingScenes.has(incomingId)) return
  while (buildingScenes.size >= MAX_CACHE_SIZE) {
    const oldestId = buildingScenes.keys().next().value
    if (!oldestId) break
    disposeBuildingScene(oldestId)
  }
}

const getOrCreateBuildingScene = (buildingId: string): BuildingScene => {
  const existing = getScene(buildingId)
  if (existing) return existing

  evictOldestScenes(buildingId)

  const created: BuildingScene = {
    scene: new THREE.Scene(),
    floorPlanes: new Map(),
    floorSpaces: new Map(),
    deviceMarkers: new Map(),
    isLoading: false,
  }
  buildingScenes.set(buildingId, created)
  return created
}

const createFloorPlane = (
  loader: THREE.TextureLoader,
  blueprintUrl: string,
  baseScale: number,
  yPos: number,
): Promise<{ mesh: THREE.Mesh; width: number; depth: number }> =>
  new Promise((resolve, reject) => {
    loader.load(
      blueprintUrl,
      (texture) => {
        const { width: pxW, height: pxH } = texture.image
        const width = baseScale
        const depth = baseScale / (pxW / pxH)

        const mesh = new THREE.Mesh(
          new THREE.PlaneGeometry(width, depth),
          new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: true }),
        )
        mesh.rotation.x = -Math.PI / 2
        mesh.position.y = yPos + 0.01

        resolve({ mesh, width, depth })
      },
      undefined,
      reject,
    )
  })

const createFloorSpace = (width: number, depth: number, yPos: number, floor: Floor) => {
  const geometry = new THREE.BoxGeometry(width, FLOOR_HEIGHT, depth)
  geometry.translate(0, FLOOR_HEIGHT / 2, 0)

  const space = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({ color: FLOOR_SPACE_COLOR, transparent: true, opacity: 0.3 }),
  )
  space.position.y = yPos
  space.userData = { ...floor }

  space.add(
    new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry),
      new THREE.LineBasicMaterial({
        color: FLOOR_SPACE_COLOR,
        linewidth: 3,
        transparent: true,
        opacity: 0.8,
      }),
    ),
  )

  return space
}

const createDeviceMarker = (device: Device, yPos: number, width: number, depth: number) => {
  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(0.75, 16, 16),
    new THREE.MeshBasicMaterial(),
  )
  marker.position.set((device.x - 0.5) * width, yPos + 0.5, (device.y - 0.5) * depth)
  marker.userData = { ...device }
  return marker
}

const addFloorLayer = async (
  building: BuildingScene,
  loader: THREE.TextureLoader,
  floor: Floor,
  index: number,
  devices: Device[],
  baseScale: number,
) => {
  const yPos = index * FLOOR_HEIGHT
  const { mesh, width, depth } = await createFloorPlane(
    loader,
    floor.blueprint_url,
    baseScale,
    yPos,
  )

  building.scene.add(mesh)
  building.floorPlanes.set(floor.id, mesh)

  const space = createFloorSpace(width, depth, yPos, floor)
  building.scene.add(space)
  building.floorSpaces.set(floor.id, space)

  const markers = new Map<string, THREE.Mesh>()
  for (const device of devices) {
    const marker = createDeviceMarker(device, yPos, width, depth)
    building.scene.add(marker)
    markers.set(String(device.id), marker)
  }
  building.deviceMarkers.set(floor.id, markers)
}

const renderFloorsInBatches = async (
  building: BuildingScene,
  floors: Floor[],
  devicesByFloor: Map<string, Device[]>,
  baseScale: number,
) => {
  const loader = new THREE.TextureLoader()

  for (let start = 0; start < floors.length; start += BATCH_SIZE) {
    const batch = floors.slice(start, start + BATCH_SIZE)
    await Promise.all(
      batch.map((floor, i) =>
        addFloorLayer(
          building,
          loader,
          floor,
          start + i,
          devicesByFloor.get(floor.id) ?? [],
          baseScale,
        ).catch((e) => console.warn(`Failed to load floor ${floor.name}:`, e)),
      ),
    )
  }
}

const renderBuildingScene = async (
  buildingId: string,
  floors: Floor[],
  devices: Map<string, Device[]>,
  baseScale: number = DEFAULT_BASE_SCALE,
): Promise<void> => {
  const building = getOrCreateBuildingScene(buildingId)
  if (building.floorPlanes.size > 0) return

  building.isLoading = true
  try {
    await renderFloorsInBatches(building, floors, devices, baseScale)
  } finally {
    building.isLoading = false
  }
}

const setFloorSpaceColor = (
  buildingId: string,
  floorId: string,
  color: THREE.ColorRepresentation,
) => {
  const space = getScene(buildingId)?.floorSpaces.get(floorId)
  if (!space) return false

  ;(space.material as THREE.MeshBasicMaterial).color.set(color)
  space.children.forEach((child) => {
    if (child instanceof THREE.LineSegments) {
      ;(child.material as THREE.LineBasicMaterial).color.set(color)
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
  const marker = getScene(buildingId)?.deviceMarkers.get(floorId)?.get(deviceId)
  if (!marker) return false

  ;(marker.material as THREE.MeshBasicMaterial).color.set(color)
  return true
}

const disposeMaterial = (material: THREE.Material) => {
  const map = (material as THREE.MeshBasicMaterial).map
  map?.dispose()
  material.dispose()
}

const disposeObject = (object: THREE.Mesh | THREE.LineSegments) => {
  object.geometry.dispose()
  const materials = Array.isArray(object.material) ? object.material : [object.material]
  materials.forEach(disposeMaterial)
}

const disposeBuildingScene = (buildingId: string) => {
  const building = getScene(buildingId)
  if (!building) return

  const disposeAll = (objects: Iterable<THREE.Mesh>) => {
    for (const obj of objects) {
      building.scene.remove(obj)
      disposeObject(obj)
    }
  }

  disposeAll(building.floorPlanes.values())
  disposeAll(building.floorSpaces.values())
  building.floorSpaces.forEach((space) =>
    space.children.forEach((child) => {
      if (child instanceof THREE.LineSegments) disposeObject(child)
    }),
  )
  for (const markers of building.deviceMarkers.values()) disposeAll(markers.values())

  buildingScenes.delete(buildingId)
}

const disposeAllBuildingScenes = () => {
  for (const buildingId of buildingScenes.keys()) disposeBuildingScene(buildingId)
}
