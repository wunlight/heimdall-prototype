import type { Camera3DPayload, Vector3 } from '../types/camera.type'
import type { PerspectiveCamera } from 'three'
import type { OrbitControls } from 'three/examples/jsm/Addons.js'
import { ref } from 'vue'

/**
 * Default values untuk Camera 3D
 */
const DEFAULT_3D_VALUES = {
  target: { x: 0, y: 0, z: 0 },
  azimuth: 0, // radians
  elevation: Math.PI / 3, // 60 degrees
  distance: 100,
  duration: 1000,
}

export interface Camera3DState {
  target: Vector3
  azimuth: number
  elevation: number
  distance: number
}

export function useCamera3DController(
  camera: PerspectiveCamera | null,
  controls: OrbitControls | null,
) {
  const currentState = ref<Camera3DState>({
    target: { ...DEFAULT_3D_VALUES.target },
    azimuth: DEFAULT_3D_VALUES.azimuth,
    elevation: DEFAULT_3D_VALUES.elevation,
    distance: DEFAULT_3D_VALUES.distance,
  })

  const isAnimating = ref(false)
  let animationFrame: number | null = null

  /**
   * Get current camera state dari Three.js camera dan controls
   */
  function readCurrentState(): Camera3DState {
    if (!camera || !controls) {
      return { ...currentState.value }
    }

    const target = controls.target.clone()
    const cameraPos = camera.position.clone()
    const diff = cameraPos.sub(target)

    const distance = diff.length()
    const azimuth = Math.atan2(diff.x, diff.z)
    const elevation = Math.acos(diff.y / distance)

    const state = {
      target: { x: target.x, y: target.y, z: target.z },
      azimuth,
      elevation,
      distance,
    }

    currentState.value = state
    return state
  }

  /**
   * Apply state ke camera
   */
  function applyState(state: Camera3DState) {
    if (!camera || !controls) return

    // Set target
    controls.target.set(state.target.x, state.target.y, state.target.z)

    // Calculate camera position dari spherical coordinates
    const x = state.distance * Math.sin(state.elevation) * Math.sin(state.azimuth)
    const y = state.distance * Math.cos(state.elevation)
    const z = state.distance * Math.sin(state.elevation) * Math.cos(state.azimuth)

    camera.position.set(state.target.x + x, state.target.y + y, state.target.z + z)

    controls.update()
    currentState.value = { ...state }
  }

  /**
   * Smooth animation dari current state ke target state dengan abort support
   */
  function animateToState(
    targetState: Camera3DState,
    duration: number,
    signal: AbortSignal,
  ): Promise<void> {
    if (!camera || !controls) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      if (signal.aborted) {
        reject(new DOMException('Aborted', 'AbortError'))
        return
      }

      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame)
      }

      isAnimating.value = true
      const startState = readCurrentState()
      const startTime = performance.now()

      const onAbort = () => {
        if (animationFrame !== null) {
          cancelAnimationFrame(animationFrame)
          animationFrame = null
        }
        isAnimating.value = false
        reject(new DOMException('Aborted', 'AbortError'))
      }

      signal.addEventListener('abort', onAbort, { once: true })

      const animate = (currentTime: number) => {
        // Check if aborted
        if (signal.aborted) {
          animationFrame = null
          isAnimating.value = false
          return
        }

        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)

        // Easing function (ease-in-out)
        const eased =
          progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2

        // Interpolate state
        const interpolatedState: Camera3DState = {
          target: {
            x: startState.target.x + (targetState.target.x - startState.target.x) * eased,
            y: startState.target.y + (targetState.target.y - startState.target.y) * eased,
            z: startState.target.z + (targetState.target.z - startState.target.z) * eased,
          },
          azimuth: startState.azimuth + (targetState.azimuth - startState.azimuth) * eased,
          elevation: startState.elevation + (targetState.elevation - startState.elevation) * eased,
          distance: startState.distance + (targetState.distance - startState.distance) * eased,
        }

        applyState(interpolatedState)

        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate)
        } else {
          animationFrame = null
          isAnimating.value = false
          signal.removeEventListener('abort', onAbort)
          resolve()
        }
      }

      animationFrame = requestAnimationFrame(animate)
    })
  }

  /**
   * Handle ABSOLUTE movement
   * Nilai payload adalah kondisi kamera tujuan yang eksplisit
   */
  async function executeAbsolute(payload: Camera3DPayload, signal: AbortSignal): Promise<void> {
    if (!camera || !controls) {
      console.warn('Camera or controls not available')
      return
    }

    // Build target state dengan default values untuk nilai yang tidak diberikan
    const targetState: Camera3DState = {
      target: payload.target || { ...DEFAULT_3D_VALUES.target },
      azimuth: payload.azimuth !== undefined ? payload.azimuth : DEFAULT_3D_VALUES.azimuth,
      elevation: payload.elevation !== undefined ? payload.elevation : DEFAULT_3D_VALUES.elevation,
      distance: payload.distance !== undefined ? payload.distance : DEFAULT_3D_VALUES.distance,
    }

    const duration = payload.duration !== undefined ? payload.duration : DEFAULT_3D_VALUES.duration

    await animateToState(targetState, duration, signal)
  }

  /**
   * Handle RELATIVE movement
   * Nilai payload adalah perubahan terhadap kondisi kamera saat command dieksekusi
   */
  async function executeRelative(payload: Camera3DPayload, signal: AbortSignal): Promise<void> {
    if (!camera || !controls) {
      console.warn('Camera or controls not available')
      return
    }

    // CRITICAL: Baca kondisi kamera terbaru ketika command mulai dieksekusi
    const currentState = readCurrentState()

    // Apply delta ke current state
    const targetState: Camera3DState = {
      target: payload.target
        ? {
            x: currentState.target.x + payload.target.x,
            y: currentState.target.y + payload.target.y,
            z: currentState.target.z + payload.target.z,
          }
        : { ...currentState.target },
      azimuth:
        payload.azimuth !== undefined
          ? currentState.azimuth + payload.azimuth
          : currentState.azimuth,
      elevation:
        payload.elevation !== undefined
          ? currentState.elevation + payload.elevation
          : currentState.elevation,
      distance:
        payload.distance !== undefined
          ? currentState.distance + payload.distance
          : currentState.distance,
    }

    const duration = payload.duration !== undefined ? payload.duration : DEFAULT_3D_VALUES.duration

    await animateToState(targetState, duration, signal)
  }

  /**
   * Cancel current animation
   */
  function cancelAnimation() {
    if (animationFrame !== null) {
      cancelAnimationFrame(animationFrame)
      animationFrame = null
      isAnimating.value = false
    }
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
