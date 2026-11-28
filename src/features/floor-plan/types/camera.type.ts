export interface WorldPoint2D {
  lat: number
  lng: number
}

export interface CameraState {
  center: WorldPoint2D
  zoom: number
}

export interface FloorCameraPayload {
  center?: WorldPoint2D
  zoom?: number
  duration?: number
}
