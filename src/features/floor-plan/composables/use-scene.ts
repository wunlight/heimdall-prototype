import type { Device, Floor } from '@/shared/types/entity.type'
import L from 'leaflet'

export interface FloorScene {
  layerGroup: L.LayerGroup
  overlay: L.ImageOverlay | null
  markers: Map<string, L.Marker>
  circles: Map<string, L.Circle>
  isLoading: boolean
}

const MAX_CACHE_SIZE = 5
const CIRCLE_RATIO = 0.2
const CIRCLE_COLOR = 'transparent'

const floorScenes = new Map<string, FloorScene>()
const canvasRenderer = L.canvas()

export function useFloorScene() {
  return {
    hasFloorScene,
    isFloorLoading,
    getOrCreateFloorScene,
    renderFloorScene,
    setDeviceMarkerColor,
    solveFloorBounds,
    disposeFloorScene,
    disposeAllFloorScenes,
  }
}

const getScene = (floorId: string) => floorScenes.get(floorId)

const hasFloorScene = (floorId: string) => getScene(floorId)?.overlay != null

const isFloorLoading = (floorId: string) => getScene(floorId)?.isLoading ?? false

const evictOldestScenes = (incomingId: string) => {
  if (floorScenes.has(incomingId)) return
  while (floorScenes.size >= MAX_CACHE_SIZE) {
    const oldestId = floorScenes.keys().next().value
    if (oldestId === undefined) break
    disposeFloorScene(oldestId)
  }
}

const getOrCreateFloorScene = (floorId: string): FloorScene => {
  const existing = getScene(floorId)
  if (existing) return existing

  evictOldestScenes(floorId)

  const created: FloorScene = {
    layerGroup: L.layerGroup(),
    overlay: null,
    markers: new Map(),
    circles: new Map(),
    isLoading: false,
  }
  floorScenes.set(floorId, created)
  return created
}

const solveLatLng = (device: Pick<Device, 'x' | 'y'>, floor: Floor): L.LatLngExpression => [
  device.y * floor.blueprint_height,
  device.x * floor.blueprint_width,
]

const solveRadius = (floor: Floor) =>
  Math.min(floor.blueprint_width, floor.blueprint_height) * CIRCLE_RATIO

const solveFloorBounds = (floor: Floor): L.LatLngBoundsExpression => [
  [0, 0],
  [floor.blueprint_height, floor.blueprint_width],
]

const addOverlay = (scene: FloorScene, floor: Floor) => {
  const overlay = L.imageOverlay(floor.blueprint_url, solveFloorBounds(floor))
  scene.overlay = overlay
  scene.layerGroup.addLayer(overlay)
}

const addDevice = (scene: FloorScene, device: Device, floor: Floor) => {
  const position = solveLatLng(device, floor)

  const marker = L.marker(position).bindTooltip(
    L.tooltip({ offset: [0, 0] }).setContent(`${device.type} | x:${device.x}, y:${device.y}`),
  )
  const circle = L.circle(position, {
    radius: solveRadius(floor),
    renderer: canvasRenderer,
    color: CIRCLE_COLOR,
  })

  scene.markers.set(device.id, marker)
  scene.circles.set(device.id, circle)
  scene.layerGroup.addLayer(marker).addLayer(circle)
}

const renderFloorScene = async (floor: Floor, devices: Device[]): Promise<void> => {
  const scene = getOrCreateFloorScene(floor.id)
  if (scene.overlay) return

  scene.isLoading = true
  try {
    addOverlay(scene, floor)
    for (const device of devices) addDevice(scene, device, floor)
  } finally {
    scene.isLoading = false
  }
}

const setDeviceMarkerColor = (floorId: string, deviceId: string, color: string) => {
  const circle = getScene(floorId)?.circles.get(deviceId)
  if (!circle) return

  circle.setStyle({ color })
}

const disposeFloorScene = (floorId: string) => {
  const scene = getScene(floorId)
  if (!scene) return

  scene.layerGroup.clearLayers()
  scene.overlay = null
  scene.markers.clear()
  scene.circles.clear()
  scene.isLoading = false

  floorScenes.delete(floorId)
}

const disposeAllFloorScenes = () => {
  for (const floorId of floorScenes.keys()) disposeFloorScene(floorId)
}
