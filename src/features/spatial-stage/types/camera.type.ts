export interface WorldPoint3d {
  x: number
  y: number
  z: number
}

export interface WorldPoint2d {
  lat: number
  lng: number
}

export interface CameraTarget3d {
  mode: '3d'
  target?: WorldPoint3d
  azimuth?: number
  distance?: number
  duration?: number
}

export interface CameraTarget2d {
  mode: '2d'
  target?: WorldPoint2d
  zoom?: number
  duration?: number
}

export type CameraTarget = CameraTarget3d | CameraTarget2d
