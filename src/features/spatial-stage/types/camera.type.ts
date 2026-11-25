import type { useBuildingCamera } from '@/features/building-model/composables/use-camera'
import type { useFloorCamera } from '@/features/floor-plan/composables/use-camera'

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

export type CameraInstance =
  | { mode: '3d'; camera: ReturnType<typeof useBuildingCamera> }
  | { mode: '2d'; camera: ReturnType<typeof useFloorCamera> }
