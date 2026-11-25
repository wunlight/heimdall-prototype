import type { CameraTarget } from './camera.type'
import type { SpatialViewMode } from './state.type'

export type SpatialIntent =
  | { kind: 'SELECT_BUILDING'; buildingId: string | null }
  | { kind: 'SELECT_FLOOR'; floorId: string | null }
  | { kind: 'SWITCH_VIEW'; mode: SpatialViewMode }
  | { kind: 'MOVE_CAMERA'; target: CameraTarget }

export type SpatialCommand = SpatialIntent & { generation: number }
