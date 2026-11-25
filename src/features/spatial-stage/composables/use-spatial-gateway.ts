import type { CameraTarget } from '../types/camera.type'
import type { SpatialCommand } from '../types/command.type'
import type { SpatialViewMode } from '../types/state.type'
import { useSpatialQueue } from './use-spatial-queue'

interface SpatialRunners {
  scene: (cmd: SpatialCommand) => Promise<void>
  camera: (cmd: SpatialCommand & { kind: 'MOVE_CAMERA' }) => Promise<void>
}

export function useSpatialGateway(runners: SpatialRunners) {
  const queue = useSpatialQueue((cmd) =>
    cmd.kind === 'MOVE_CAMERA' ? runners.camera(cmd) : runners.scene(cmd),
  )

  const selectBuilding = (buildingId: string | null) =>
    queue.dispatch({ kind: 'SELECT_BUILDING', buildingId })

  const selectFloor = (floorId: string | null) => queue.dispatch({ kind: 'SELECT_FLOOR', floorId })

  const switchView = (mode: SpatialViewMode) => queue.dispatch({ kind: 'SWITCH_VIEW', mode })

  const moveCamera = (target: CameraTarget) => queue.dispatch({ kind: 'MOVE_CAMERA', target })

  return {
    selectBuilding,
    selectFloor,
    switchView,
    moveCamera,
    generation: queue.generation,
    isStale: queue.isStale,
  }
}
