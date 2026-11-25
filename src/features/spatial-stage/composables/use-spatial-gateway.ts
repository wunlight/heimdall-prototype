import { readonly, ref } from 'vue'
import type { CameraTarget } from '../types/camera.type'
import type { SpatialCommand, SpatialIntent } from '../types/command.type'
import type { SpatialViewMode } from '../types/state.type'
import type { createCameraRegistry } from './create-camera-registry'
import { useSpatialQueue } from './use-spatial-queue'

export function useSpatialGateway(cameraRegistry: ReturnType<typeof createCameraRegistry>) {
  const viewMode = ref<SpatialViewMode>('3d')
  const buildingId = ref<string | null>(null)
  const floorId = ref<string | null>(null)

  const runScene = async (cmd: SpatialCommand) => {
    switch (cmd.kind) {
      case 'SWITCH_VIEW':
        viewMode.value = cmd.mode
        break
      case 'SELECT_BUILDING':
        buildingId.value = cmd.buildingId
        floorId.value = null
        break
      case 'SELECT_FLOOR':
        floorId.value = cmd.floorId
        break
    }
  }

  const runCamera = async (cmd: SpatialCommand & { kind: 'MOVE_CAMERA' }) => {
    const { target } = cmd
    const signal = new AbortController().signal

    if (target.mode === '3d')
      return cameraRegistry.get('3d')?.executeAbsolute(target, signal) ?? Promise.resolve()

    return cameraRegistry.get('2d')?.executeAbsolute(target, signal) ?? Promise.resolve()
  }

  const queue = useSpatialQueue((cmd) =>
    cmd.kind === 'MOVE_CAMERA' ? runCamera(cmd) : runScene(cmd),
  )

  const dispatch = (intent: SpatialIntent) => queue.dispatch(intent)

  return {
    state: readonly({ viewMode, buildingId, floorId }),
    switchView: (mode: SpatialViewMode) => dispatch({ kind: 'SWITCH_VIEW', mode }),
    selectBuilding: (id: string | null) => dispatch({ kind: 'SELECT_BUILDING', buildingId: id }),
    selectFloor: (id: string | null) => dispatch({ kind: 'SELECT_FLOOR', floorId: id }),
    moveCamera: (target: CameraTarget) => dispatch({ kind: 'MOVE_CAMERA', target }),
    generation: queue.generation,
  }
}
