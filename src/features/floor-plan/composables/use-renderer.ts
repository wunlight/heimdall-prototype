import L from 'leaflet'
import { shallowRef } from 'vue'

export function useFloorRenderer(container: HTMLDivElement) {
  const map = L.map(container, {
    crs: L.CRS.Simple,
    center: [0, 0],
    zoom: 0,
    minZoom: -3,
    maxZoom: 3,
    zoomControl: false,
    attributionControl: false,
  })

  const activeScene = shallowRef<L.LayerGroup | null>(null)

  const detachScene = () => {
    if (!activeScene.value) {
      console.warn('No active scene to detach')
      return
    }

    if (map.hasLayer(activeScene.value)) {
      map.removeLayer(activeScene.value)
    }

    activeScene.value = null
  }

  const attachScene = (scene: L.LayerGroup, bounds?: L.LatLngBoundsExpression) => {
    detachScene()

    scene.addTo(map)
    activeScene.value = scene

    if (bounds) {
      map.fitBounds(bounds)
    }
  }

  const dispose = () => {
    detachScene()
    map.remove()
  }

  return {
    map,
    attachScene,
    detachScene,
    dispose,
  }
}
