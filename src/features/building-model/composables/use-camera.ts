import type { CameraTarget3d } from '@/features/spatial-stage/types/camera.type'
import * as THREE from 'three'
import type { OrbitControls } from 'three/examples/jsm/Addons.js'
import { ref } from 'vue'
import { DEFAULT_CAMERA_3D, LOCKED_POLAR_ANGLE } from '../constants/camera'
import type { OrbitState, WorldPoint3D } from '../types/camera.type'

export function useBuildingCamera(
  camera: THREE.PerspectiveCamera | null,
  controls: OrbitControls | null,
) {
  const state = ref<OrbitState>({
    target: copyPoint(DEFAULT_CAMERA_3D.target),
    azimuth: 0,
    distance: DEFAULT_CAMERA_3D.distance,
  })
  const isAnimating = ref(false)
  let activeController: AbortController | null = null

  const rig = () => (camera && controls ? { camera, controls } : null)

  function readState(): OrbitState {
    const r = rig()
    if (!r) return { ...state.value }

    const offset = r.camera.position.clone().sub(r.controls.target)
    state.value = {
      target: copyPoint(r.controls.target),
      azimuth: new THREE.Spherical().setFromVector3(offset).theta,
      distance: offset.length(),
    }
    return state.value
  }

  function applyState(next: OrbitState): void {
    const r = rig()
    if (!r) return

    const distance = Math.max(0.01, next.distance)
    const target = new THREE.Vector3(next.target.x, next.target.y, next.target.z)
    const offset = new THREE.Vector3().setFromSpherical(
      new THREE.Spherical(distance, LOCKED_POLAR_ANGLE, next.azimuth),
    )

    r.controls.target.copy(target)
    r.camera.position.copy(target).add(offset)
    r.controls.update()

    state.value = { target: copyPoint(target), azimuth: next.azimuth, distance }
  }

  function cancelAnimation(): void {
    activeController?.abort()
  }

  function animateTo(to: OrbitState, duration: number, external: AbortSignal): Promise<void> {
    if (!rig()) return Promise.resolve()
    if (external.aborted) return Promise.reject(abortError())

    cancelAnimation()

    const from = readState()

    if (duration <= 0) {
      applyState(to)
      return Promise.resolve()
    }

    const controller = new AbortController()
    activeController = controller
    isAnimating.value = true

    return new Promise<void>((resolve, reject) => {
      const start = performance.now()
      const azimuthDelta = shortestDelta(from.azimuth, to.azimuth)
      let frame = 0

      const finish = (error?: Error) => {
        cancelAnimationFrame(frame)
        external.removeEventListener('abort', onExternalAbort)
        if (activeController === controller) {
          activeController = null
          isAnimating.value = false
        }

        if (error) reject(error)
        resolve()
      }

      const onExternalAbort = () => controller.abort()

      controller.signal.addEventListener('abort', () => finish(abortError()), { once: true })
      external.addEventListener('abort', onExternalAbort, { once: true })

      const tick = (now: number) => {
        const t = Math.min((now - start) / duration, 1)
        const e = easeInOutQuad(t)

        applyState(
          t >= 1
            ? to
            : {
                target: {
                  x: lerp(from.target.x, to.target.x, e),
                  y: lerp(from.target.y, to.target.y, e),
                  z: lerp(from.target.z, to.target.z, e),
                },
                azimuth: from.azimuth + azimuthDelta * e,
                distance: lerp(from.distance, to.distance, e),
              },
        )

        if (t >= 1) finish()
        else frame = requestAnimationFrame(tick)
      }

      frame = requestAnimationFrame(tick)
    })
  }

  function resolveAbsolute(payload: CameraTarget3d): OrbitState {
    const current = readState()
    const target = copyPoint(payload.target ?? DEFAULT_CAMERA_3D.target)
    const desiredAzimuth =
      payload.azimuth ?? Math.atan2(target.x - current.target.x, target.z - current.target.z)

    return {
      target,
      azimuth: current.azimuth + shortestDelta(current.azimuth, desiredAzimuth),
      distance: payload.distance ?? DEFAULT_CAMERA_3D.distance,
    }
  }

  function resolveRelative(payload: CameraTarget3d): OrbitState {
    const current = readState()
    const delta = payload.target

    return {
      target: delta
        ? {
            x: current.target.x + delta.x,
            y: current.target.y + delta.y,
            z: current.target.z + delta.z,
          }
        : current.target,
      azimuth: current.azimuth + (payload.azimuth ?? 0),
      distance: current.distance + (payload.distance ?? 0),
    }
  }

  const execute =
    (resolve: (payload: CameraTarget3d) => OrbitState) =>
    async (payload: CameraTarget3d, signal: AbortSignal): Promise<void> => {
      if (!rig()) {
        console.warn('Camera or controls not available')
        return
      }
      await animateTo(resolve(payload), payload.duration ?? DEFAULT_CAMERA_3D.duration, signal)
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

const copyPoint = (p: WorldPoint3D): WorldPoint3D => ({ x: p.x, y: p.y, z: p.z })

const abortError = () => new DOMException('Aborted', 'AbortError')

const shortestDelta = (from: number, to: number) =>
  Math.atan2(Math.sin(to - from), Math.cos(to - from))

const easeInOutQuad = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
