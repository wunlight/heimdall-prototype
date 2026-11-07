import type { Camera2DPayload, GeoCoordinate } from '../types/camera.type'
import type { Map } from 'leaflet'
import { ref } from 'vue'

/**
 * Default values untuk Camera 2D
 */
const DEFAULT_2D_VALUES = {
  center: { lat: 0, lng: 0 },
  zoom: 15,
  duration: 1000,
}

export interface Camera2DState {
  center: GeoCoordinate
  zoom: number
}

/**
 * Camera 2D Controller untuk Leaflet atau map library lainnya
 * NOTE: Ini adalah interface - implementasi aktual bergantung pada map library yang digunakan
 */
export function useCamera2DController(
  mapInstance: Map | null, // Leaflet Map instance atau map library lainnya
) {
  const currentState = ref<Camera2DState>({
    center: { ...DEFAULT_2D_VALUES.center },
    zoom: DEFAULT_2D_VALUES.zoom,
  })

  const isAnimating = ref(false)
  let currentAbortController: AbortController | null = null

  /**
   * Get current camera state dari map instance
   */
  function readCurrentState(): Camera2DState {
    if (!mapInstance) {
      return { ...currentState.value }
    }

    // Untuk Leaflet:
    // const center = mapInstance.getCenter()
    // const zoom = mapInstance.getZoom()

    // Placeholder - implement sesuai map library
    const state = {
      center: { ...currentState.value.center },
      zoom: currentState.value.zoom,
    }

    currentState.value = state
    return state
  }

  /**
   * Apply state ke map
   */
  function applyState(state: Camera2DState, duration: number = 0) {
    if (!mapInstance) return

    // Untuk Leaflet:
    // if (duration > 0) {
    //   mapInstance.flyTo([state.center.lat, state.center.lng], state.zoom, { duration: duration / 1000 })
    // } else {
    //   mapInstance.setView([state.center.lat, state.center.lng], state.zoom)
    // }

    // Placeholder - implement sesuai map library
    currentState.value = { ...state }
  }

  /**
   * Smooth animation dari current state ke target state dengan abort support
   */
  function animateToState(
    targetState: Camera2DState,
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

      // Untuk Leaflet dengan flyTo dan abort support:
      // const onMoveEnd = () => {
      //   if (!signal.aborted) {
      //     isAnimating.value = false
      //     currentState.value = { ...targetState }
      //     signal.removeEventListener('abort', onAbort)
      //     resolve()
      //   }
      // }
      //
      // const onAbort = () => {
      //   mapInstance.stop()
      //   mapInstance.off('moveend', onMoveEnd)
      //   isAnimating.value = false
      //   reject(new DOMException('Aborted', 'AbortError'))
      // }
      //
      // signal.addEventListener('abort', onAbort, { once: true })
      // mapInstance.flyTo([targetState.center.lat, targetState.center.lng], targetState.zoom, {
      //   duration: duration / 1000,
      // })
      // mapInstance.once('moveend', onMoveEnd)

      // Placeholder - implement sesuai map library dengan abort support
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
    })
  }

  /**
   * Handle ABSOLUTE movement
   * Nilai payload adalah kondisi kamera tujuan yang eksplisit
   */
  async function executeAbsolute(payload: Camera2DPayload, signal: AbortSignal): Promise<void> {
    if (!mapInstance) {
      console.warn('Map instance not available')
      return
    }

    // Build target state dengan default values untuk nilai yang tidak diberikan
    const targetState: Camera2DState = {
      center: payload.center || { ...DEFAULT_2D_VALUES.center },
      zoom: payload.zoom !== undefined ? payload.zoom : DEFAULT_2D_VALUES.zoom,
    }

    const duration = payload.duration !== undefined ? payload.duration : DEFAULT_2D_VALUES.duration

    await animateToState(targetState, duration, signal)
  }

  /**
   * Handle RELATIVE movement
   * Nilai payload adalah perubahan terhadap kondisi kamera saat command dieksekusi
   */
  async function executeRelative(payload: Camera2DPayload, signal: AbortSignal): Promise<void> {
    if (!mapInstance) {
      console.warn('Map instance not available')
      return
    }

    // CRITICAL: Baca kondisi kamera terbaru ketika command mulai dieksekusi
    const currentState = readCurrentState()

    // Apply delta ke current state
    const targetState: Camera2DState = {
      center: payload.center
        ? {
            lat: currentState.center.lat + payload.center.lat,
            lng: currentState.center.lng + payload.center.lng,
          }
        : { ...currentState.center },
      zoom: payload.zoom !== undefined ? currentState.zoom + payload.zoom : currentState.zoom,
    }

    const duration = payload.duration !== undefined ? payload.duration : DEFAULT_2D_VALUES.duration

    await animateToState(targetState, duration, signal)
  }

  /**
   * Cancel current animation
   */
  function cancelAnimation() {
    if (!mapInstance) return

    // Untuk Leaflet:
    // mapInstance.stop()

    if (currentAbortController) {
      currentAbortController.abort()
      currentAbortController = null
    }

    isAnimating.value = false
  }

  /**
   * Dispose controller
   */
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
