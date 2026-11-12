import type { Map } from 'leaflet'
import { ref } from 'vue'
import type { Camera2DPayload, GeoCoordinate } from '../../types/camera.type'

export interface FloorPlanCameraState {
  center: GeoCoordinate
  zoom: number
}

const DEFAULT_VALUES = {
  center: { lat: 0, lng: 0 },
  zoom: 0,
  duration: 1000,
}

export function useFloorPlanCamera(mapInstance: Map | null) {
  const currentState = ref<FloorPlanCameraState>({
    center: { ...DEFAULT_VALUES.center },
    zoom: DEFAULT_VALUES.zoom,
  })

  const isAnimating = ref(false)
  let currentAbortController: AbortController | null = null

  function readCurrentState(): FloorPlanCameraState {
    if (!mapInstance) {
      return { ...currentState.value }
    }

    const state = {
      center: { ...currentState.value.center },
      zoom: currentState.value.zoom,
    }

    currentState.value = state
    return state
  }

  function applyState(state: FloorPlanCameraState, duration: number = 0) {
    if (!mapInstance) return

    if (duration > 0) {
      mapInstance.flyTo([state.center.lat, state.center.lng], state.zoom, {
        duration: duration / 1000,
      })
    } else {
      mapInstance.setView([state.center.lat, state.center.lng], state.zoom)
    }

    currentState.value = { ...state }
  }

  function animateToState(
    targetState: FloorPlanCameraState,
    duration: number,
    signal: AbortSignal,
  ): Promise<void> {
    if (!mapInstance) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      if (signal.aborted) {
        reject(new DOMException('Aborted', 'AbortError'))
        return
      }

      isAnimating.value = true

      const timeout = setTimeout(() => {
        if (!signal.aborted) {
          applyState(targetState, 0)
          isAnimating.value = false
          signal.removeEventListener('abort', onAbort)
          resolve()
        }
      }, duration)

      const onAbort = () => {
        clearTimeout(timeout)
        isAnimating.value = false
        reject(new DOMException('Aborted', 'AbortError'))
      }

      signal.addEventListener('abort', onAbort, { once: true })

      const onMoveEnd = () => {
        if (!signal.aborted) {
          isAnimating.value = false
          currentState.value = { ...targetState }
          signal.removeEventListener('abort', onAbort)
          resolve()
        }
      }

      mapInstance.flyTo([targetState.center.lat, targetState.center.lng], targetState.zoom, {
        duration: duration / 1000,
      })

      mapInstance.once('moveend', onMoveEnd)
    })
  }

  async function executeAbsolute(payload: Camera2DPayload, signal: AbortSignal): Promise<void> {
    if (!mapInstance) {
      console.warn('Map instance not available')
      return
    }

    const targetState: FloorPlanCameraState = {
      center: payload.center || { ...DEFAULT_VALUES.center },
      zoom: payload.zoom !== undefined ? payload.zoom : DEFAULT_VALUES.zoom,
    }

    const duration = payload.duration !== undefined ? payload.duration : DEFAULT_VALUES.duration

    await animateToState(targetState, duration, signal)
  }

  async function executeRelative(payload: Camera2DPayload, signal: AbortSignal): Promise<void> {
    if (!mapInstance) {
      console.warn('Map instance not available')
      return
    }

    const currentState = readCurrentState()

    const targetState: FloorPlanCameraState = {
      center: payload.center
        ? {
            lat: currentState.center.lat + payload.center.lat,
            lng: currentState.center.lng + payload.center.lng,
          }
        : { ...currentState.center },
      zoom: payload.zoom !== undefined ? currentState.zoom + payload.zoom : currentState.zoom,
    }

    const duration = payload.duration !== undefined ? payload.duration : DEFAULT_VALUES.duration

    await animateToState(targetState, duration, signal)
  }

  function cancelAnimation() {
    if (!mapInstance) return

    mapInstance.stop()

    if (currentAbortController) {
      currentAbortController.abort()
      currentAbortController = null
    }

    isAnimating.value = false
  }

  function dispose() {
    cancelAnimation()
  }

  return {
    executeAbsolute,
    executeRelative,
    cancelAnimation,
    readCurrentState,
    applyState,
    dispose,
    currentState,
    isAnimating,
  }
}
