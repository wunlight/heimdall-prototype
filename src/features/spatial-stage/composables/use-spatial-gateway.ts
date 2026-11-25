import { readonly, ref } from 'vue'
import type { CameraTarget } from '../types/camera.type'
import type { SpatialCommand, SpatialIntent } from '../types/command.type'
import type { SpatialViewMode } from '../types/state.type'
import type { createCameraRegistry } from './create-camera-registry'
import { useSpatialQueue } from './use-spatial-queue'

type SceneWaiter = {
  mode: SpatialViewMode
  id: string
  generation: number
  resolve: () => void
  reject: (reason: Error) => void
}

export function useSpatialGateway(cameraRegistry: ReturnType<typeof createCameraRegistry>) {
  const viewMode = ref<SpatialViewMode>('3d')
  const buildingId = ref<string | null>(null)
  const floorId = ref<string | null>(null)

  let waiters: SceneWaiter[] = []

  const waitForScene = (mode: SpatialViewMode, id: string, generation: number) =>
    new Promise<void>((resolve, reject) => {
      waiters.push({ mode, id, generation, resolve, reject })
    })

  const onSceneReady = (mode: SpatialViewMode, id: string) => {
    const matched = waiters.filter((w) => w.mode === mode && w.id === id)
    waiters = waiters.filter((w) => !(w.mode === mode && w.id === id))
    matched.forEach((w) => w.resolve())
  }

  const cancelStaleWaiters = (current: number) => {
    const stale = waiters.filter((w) => w.generation !== current)
    waiters = waiters.filter((w) => w.generation === current)
    stale.forEach((w) => w.reject(new DOMException('Stale scene command', 'AbortError')))
  }

  const runScene = async (cmd: SpatialCommand) => {
    switch (cmd.kind) {
      case 'SWITCH_VIEW':
        viewMode.value = cmd.mode
        break
      case 'SELECT_BUILDING':
        if (cmd.buildingId) await waitForScene('3d', cmd.buildingId, cmd.generation)
        buildingId.value = cmd.buildingId
        floorId.value = null
        break
      case 'SELECT_FLOOR':
        if (cmd.floorId) await waitForScene('2d', cmd.floorId, cmd.generation)
        floorId.value = cmd.floorId
        break
    }
  }

  const runCamera = async (cmd: SpatialCommand & { kind: 'MOVE_CAMERA' }) => {
    const { target } = cmd
    const signal = new AbortController().signal
    const camera = target.mode === '3d' ? cameraRegistry.get('3d') : cameraRegistry.get('2d')
    return camera?.executeAbsolute(target as never, signal) ?? Promise.resolve()
  }

  const queue = useSpatialQueue(async (cmd) => {
    cancelStaleWaiters(queue.generation.value)
    return cmd.kind === 'MOVE_CAMERA' ? runCamera(cmd) : runScene(cmd)
  })

  const dispatch = (intent: SpatialIntent) => queue.dispatch(intent)

  const dispose = () => {
    cancelStaleWaiters(-1)
    queue.clear()
  }

  return {
    state: readonly({ viewMode, buildingId, floorId }),
    generation: queue.generation,
    onSceneReady,
    switchView: (mode: SpatialViewMode) => dispatch({ kind: 'SWITCH_VIEW', mode }),
    selectBuilding: (id: string | null) => dispatch({ kind: 'SELECT_BUILDING', buildingId: id }),
    selectFloor: (id: string | null) => dispatch({ kind: 'SELECT_FLOOR', floorId: id }),
    moveCamera: (target: CameraTarget) => dispatch({ kind: 'MOVE_CAMERA', target }),
    dispose,
  }
}
