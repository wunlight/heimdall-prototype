export interface WorldPoint3D {
  x: number
  y: number
  z: number
}

export interface OrbitState {
  target: WorldPoint3D
  azimuth: number
  distance: number
}

export interface BuildingCameraPayload {
  target?: WorldPoint3D
  azimuth?: number
  distance?: number
  duration?: number
}
