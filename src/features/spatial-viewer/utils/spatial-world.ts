import type { Device, Floor } from '@/shared/types/entity.type'
import type { GeoCoordinate, Vector3 } from '../types/camera.type'

export function calculate3DWorldTarget(device: Device, floor: Floor, floorIndex: number): Vector3 {
  const aspectRatio = floor.blueprint_width / floor.blueprint_height

  const planeWidth = 40
  const planeDepth = planeWidth / aspectRatio

  return {
    x: (device.x - 0.5) * planeWidth,
    y: floorIndex * 16,
    z: (device.y - 0.5) * planeDepth,
  }
}

export function calculate2DWorldTarget(device: Device, floor: Floor): GeoCoordinate {
  return {
    lat: (1 - device.y) * floor.blueprint_height,
    lng: device.x * floor.blueprint_width,
  }
}
