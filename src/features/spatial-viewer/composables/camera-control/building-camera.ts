import * as THREE from 'three'
import type { OrbitControls } from 'three/examples/jsm/Addons.js'
import { ref } from 'vue'
import type { BuildingCameraPayload, Vector3 } from '../../types/camera.type'

const LOCKED_ELEVATION = Math.PI / 3

const DEFAULT_3D_VALUES = {
  target: { x: 0, y: 0, z: 0 },
  distance: 100,
  duration: 1000,
}

export interface BuildingCameraState {
  target: Vector3
  azimuth: number
  elevation: number
  distance: number
}

export function useBuildingCamera(
  camera: THREE.PerspectiveCamera | null,
  controls: OrbitControls | null,
) {
  const currentState = ref<BuildingCameraState>({
    target: { ...DEFAULT_3D_VALUES.target },
    azimuth: 0,
    elevation: LOCKED_ELEVATION,
    distance: DEFAULT_3D_VALUES.distance,
  })

  const isAnimating = ref(false)

  let _animationFrame: number | null = null
  let activeAnimationController: AbortController | null = null

  function getShortestAngleDelta(from: number, to: number): number {
    return Math.atan2(Math.sin(to - from), Math.cos(to - from))
  }

  function getNearestAzimuth(currentAzimuth: number, desiredAzimuth: number): number {
    return currentAzimuth + getShortestAngleDelta(currentAzimuth, desiredAzimuth)
  }

  function readCurrentState(): BuildingCameraState {
    if (!camera || !controls) {
      return { ...currentState.value }
    }

    const offset = camera.position.clone().sub(controls.target)

    const distance = offset.length()

    const spherical = new THREE.Spherical().setFromVector3(offset)

    const state: BuildingCameraState = {
      target: {
        x: controls.target.x,
        y: controls.target.y,
        z: controls.target.z,
      },
      azimuth: spherical.theta,
      elevation: LOCKED_ELEVATION,
      distance,
    }

    currentState.value = state

    return state
  }

  function applyState(state: BuildingCameraState): void {
    if (!camera || !controls) return

    const distance = Math.max(0.01, state.distance)

    const target = new THREE.Vector3(state.target.x, state.target.y, state.target.z)
    const spherical = new THREE.Spherical(distance, LOCKED_ELEVATION, state.azimuth)
    const offset = new THREE.Vector3().setFromSpherical(spherical)

    controls.target.copy(target)

    const cameraPosition = target.clone().add(offset)

    camera.position.copy(cameraPosition)

    controls.update()

    currentState.value = {
      target: {
        x: target.x,
        y: target.y,
        z: target.z,
      },
      azimuth: state.azimuth,
      elevation: LOCKED_ELEVATION,
      distance,
    }
  }

  function animateToState(
    targetState: BuildingCameraState,
    duration: number,
    externalSignal: AbortSignal,
  ): Promise<void> {
    if (!camera || !controls) {
      return Promise.resolve()
    }

    if (externalSignal.aborted) {
      return Promise.reject(new DOMException('Aborted', 'AbortError'))
    }

    cancelAnimation()

    const animationController = new AbortController()
    const signal = animationController.signal

    activeAnimationController = animationController

    return new Promise((resolve, reject) => {
      const startState = readCurrentState()
      const startTime = performance.now()

      let frameId: number | null = null
      let settled = false

      const cleanup = () => {
        if (frameId !== null) {
          cancelAnimationFrame(frameId)
          frameId = null
        }

        externalSignal.removeEventListener('abort', onExternalAbort)

        signal.removeEventListener('abort', onAbort)

        if (activeAnimationController === animationController) {
          activeAnimationController = null
          _animationFrame = null
          isAnimating.value = false
        }
      }

      const finish = () => {
        if (settled) return

        settled = true
        cleanup()
        resolve()
      }

      const onAbort = () => {
        if (settled) return

        settled = true
        cleanup()

        reject(new DOMException('Aborted', 'AbortError'))
      }

      const onExternalAbort = () => {
        animationController.abort()
      }

      signal.addEventListener('abort', onAbort, {
        once: true,
      })

      externalSignal.addEventListener('abort', onExternalAbort, { once: true })

      isAnimating.value = true

      if (duration <= 0) {
        applyState(targetState)
        finish()
        return
      }

      const azimuthDelta = getShortestAngleDelta(startState.azimuth, targetState.azimuth)

      const animate = (currentTime: number) => {
        if (signal.aborted || settled) return

        const elapsed = currentTime - startTime

        const progress = Math.min(elapsed / duration, 1)

        const eased =
          progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2

        const interpolatedState: BuildingCameraState = {
          target: {
            x: startState.target.x + (targetState.target.x - startState.target.x) * eased,

            y: startState.target.y + (targetState.target.y - startState.target.y) * eased,

            z: startState.target.z + (targetState.target.z - startState.target.z) * eased,
          },

          azimuth: startState.azimuth + azimuthDelta * eased,

          elevation: LOCKED_ELEVATION,

          distance: startState.distance + (targetState.distance - startState.distance) * eased,
        }

        applyState(interpolatedState)

        if (progress < 1) {
          frameId = requestAnimationFrame(animate)
          _animationFrame = frameId
        } else {
          applyState(targetState)
          finish()
        }
      }

      frameId = requestAnimationFrame(animate)
      _animationFrame = frameId
    })
  }

  function resolveAbsoluteState(payload: BuildingCameraPayload): BuildingCameraState {
    const actualState = readCurrentState()

    const target = payload.target ? { ...payload.target } : { ...DEFAULT_3D_VALUES.target }

    return {
      target,
      azimuth:
        payload.azimuth !== undefined
          ? getNearestAzimuth(actualState.azimuth, payload.azimuth)
          : getNearestAzimuth(
              actualState.azimuth,
              Math.atan2(target.x - actualState.target.x, target.z - actualState.target.z),
            ),
      elevation: LOCKED_ELEVATION,
      distance: payload.distance !== undefined ? payload.distance : DEFAULT_3D_VALUES.distance,
    }
  }

  async function executeAbsolute(
    payload: BuildingCameraPayload,
    signal: AbortSignal,
  ): Promise<void> {
    if (!camera || !controls) {
      console.warn('Camera or controls not available')
      return
    }

    const targetState = resolveAbsoluteState(payload)

    const duration = payload.duration !== undefined ? payload.duration : DEFAULT_3D_VALUES.duration

    await animateToState(targetState, duration, signal)
  }

  function resolveRelativeState(payload: BuildingCameraPayload): BuildingCameraState {
    const actualState = readCurrentState()

    return {
      target: payload.target
        ? {
            x: actualState.target.x + payload.target.x,
            y: actualState.target.y + payload.target.y,
            z: actualState.target.z + payload.target.z,
          }
        : actualState.target,

      azimuth:
        payload.azimuth !== undefined ? actualState.azimuth + payload.azimuth : actualState.azimuth,

      elevation: LOCKED_ELEVATION,

      distance:
        payload.distance !== undefined
          ? actualState.distance + payload.distance
          : actualState.distance,
    }
  }

  async function executeRelative(
    payload: BuildingCameraPayload,
    signal: AbortSignal,
  ): Promise<void> {
    if (!camera || !controls) {
      console.warn('Camera or controls not available')
      return
    }

    const targetState = resolveRelativeState(payload)

    const duration = payload.duration !== undefined ? payload.duration : DEFAULT_3D_VALUES.duration

    await animateToState(targetState, duration, signal)
  }

  function cancelAnimation(): void {
    activeAnimationController?.abort()
  }

  function dispose(): void {
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
