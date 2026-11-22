import { type Map as LMap } from 'leaflet'
import { ref } from 'vue'
import type { CameraState, FloorCameraPayload, WorldPoint2D } from '../types/camera.type'

const DEFAULT_CAMERA_2D = {
  center: { lat: 0, lng: 0 },
  zoom: 0,
  duration: 1000,
} as const

export function useFloorCamera(map: LMap | null) {
  const state = ref<CameraState>({
    center: copyPoint(DEFAULT_CAMERA_2D.center),
    zoom: DEFAULT_CAMERA_2D.zoom,
  })
  const isAnimating = ref(false)
  let activeController: AbortController | null = null

  function readState(): CameraState {
    if (!map) return { ...state.value }

    const center = map.getCenter()
    state.value = { center: { lat: center.lat, lng: center.lng }, zoom: map.getZoom() }
    return state.value
  }

  function applyState(next: CameraState, duration = 0): void {
    if (!map) return

    const latLng: [number, number] = [next.center.lat, next.center.lng]
    if (duration > 0) map.flyTo(latLng, next.zoom, { duration: duration / 1000 })
    else map.setView(latLng, next.zoom)

    state.value = { center: copyPoint(next.center), zoom: next.zoom }
  }

  function cancelAnimation(): void {
    if (!map) return
    map.stop()
    activeController?.abort()
    activeController = null
    isAnimating.value = false
  }

  function animateTo(to: CameraState, duration: number, external: AbortSignal): Promise<void> {
    if (!map) return Promise.resolve()
    if (external.aborted) return Promise.reject(abortError())

    cancelAnimation()

    if (duration <= 0) {
      applyState(to)
      return Promise.resolve()
    }

    const controller = new AbortController()
    activeController = controller
    isAnimating.value = true

    return new Promise<void>((resolve, reject) => {
      const finish = (error?: Error) => {
        map.off('moveend', onMoveEnd)
        external.removeEventListener('abort', onExternalAbort)
        if (activeController === controller) {
          activeController = null
          isAnimating.value = false
        }

        if (error) reject(error)
        resolve()
      }

      const onMoveEnd = () => {
        if (controller.signal.aborted) return
        applyState(to)
        finish()
      }

      const onExternalAbort = () => {
        map.stop()
        controller.abort()
        finish(abortError())
      }

      external.addEventListener('abort', onExternalAbort, { once: true })
      map.once('moveend', onMoveEnd)
      map.flyTo([to.center.lat, to.center.lng], to.zoom, { duration: duration / 1000 })
    })
  }

  function resolveAbsolute(payload: FloorCameraPayload): CameraState {
    return {
      center: copyPoint(payload.center ?? DEFAULT_CAMERA_2D.center),
      zoom: payload.zoom ?? DEFAULT_CAMERA_2D.zoom,
    }
  }

  function resolveRelative(payload: FloorCameraPayload): CameraState {
    const current = readState()
    const delta = payload.center

    return {
      center: delta
        ? { lat: current.center.lat + delta.lat, lng: current.center.lng + delta.lng }
        : copyPoint(current.center),
      zoom: current.zoom + (payload.zoom ?? 0),
    }
  }

  const execute =
    (resolve: (payload: FloorCameraPayload) => CameraState) =>
    async (payload: FloorCameraPayload, signal: AbortSignal): Promise<void> => {
      if (!map) {
        console.warn('Map instance not available')
        return
      }
      await animateTo(resolve(payload), payload.duration ?? DEFAULT_CAMERA_2D.duration, signal)
    }

  return {
    executeAbsolute: execute(resolveAbsolute),
    executeRelative: execute(resolveRelative),
    cancelAnimation,
    readCurrentState: readState,
    applyState,
    dispose: cancelAnimation,
    currentState: state,
    isAnimating,
  }
}

const abortError = () => new DOMException('Aborted', 'AbortError')

const copyPoint = (p: WorldPoint2D): WorldPoint2D => ({ lat: p.lat, lng: p.lng })
