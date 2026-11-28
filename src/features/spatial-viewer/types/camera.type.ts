export type CameraMovement = 'ABSOLUTE' | 'RELATIVE'

export interface Vector3 {
  x: number
  y: number
  z: number
}

export interface GeoCoordinate {
  lat: number
  lng: number
}

export interface BuildingCameraPayload {
  target?: Vector3
  azimuth?: number
  elevation?: number
  distance?: number
  duration?: number
}

export interface FloorCameraPayload {
  center?: GeoCoordinate
  zoom?: number
  duration?: number
}
