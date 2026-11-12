import type { BuildingCameraPayload, CameraMovement, FloorCameraPayload } from './camera.type'

export type SpatialViewMode = '3D' | '2D'

export type SpatialCommandSource = 'WEBSOCKET' | 'REPLAY' | 'SYSTEM'

export interface SpatialContext {
  buildingId?: string
  floorId?: string
  deviceId?: string
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

export interface BuildingCameraCommand extends BaseSpatialCommand {
  type: 'BUILDING_CAMERA'
  movement: CameraMovement
  payload: BuildingCameraPayload
}

export interface FloorCameraCommand extends BaseSpatialCommand {
  type: 'FLOOR_CAMERA'
  movement: CameraMovement
  payload: FloorCameraPayload
}

export type CameraCommand = BuildingCameraCommand | FloorCameraCommand

export interface FloorColorCommand extends BaseSpatialCommand {
  type: 'FLOOR_COLOR'
  payload: { color: string }
}

export interface DeviceColorCommand extends BaseSpatialCommand {
  type: 'DEVICE_COLOR'
  payload: { color: string }
}

export type ColorCommand = FloorColorCommand | DeviceColorCommand

export type SpatialCommand = SwitchViewCommand | CameraCommand | ColorCommand
