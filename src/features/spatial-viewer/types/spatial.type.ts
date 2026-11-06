import type { Camera2DPayload, Camera3DPayload, CameraMovement } from './camera.type'

export type SpatialViewMode = '3D' | '2D'

export type SpatialCommandSource = 'WEBSOCKET' | 'REPLAY' | 'SYSTEM'

export interface SpatialContext {
  buildingId?: string
  floorId?: string
}

export interface BaseSpatialCommand {
  id: string
  timestamp: number
  source: 'WEBSOCKET' | 'REPLAY' | 'SYSTEM'
  context?: SpatialContext
}

export interface SwitchViewCommand extends BaseSpatialCommand {
  type: 'SWITCH_VIEW'
  target: SpatialViewMode
}

export interface Camera3DCommand extends BaseSpatialCommand {
  type: 'CAMERA_3D'
  movement: CameraMovement
  payload: Camera3DPayload
}

export interface Camera2DCommand extends BaseSpatialCommand {
  type: 'CAMERA_2D'
  movement: CameraMovement
  payload: Camera2DPayload
}

export type CameraCommand = Camera3DCommand | Camera2DCommand

export type SpatialCommand = SwitchViewCommand | CameraCommand
