import type { Device, Floor } from '@/shared/types/entity.type'
import type { CameraTarget } from '../types/camera.type'

export const toCameraTarget = (mode: '2d' | '3d', device: Device, floor: Floor): CameraTarget => {
  const u = device.x
  const v = device.y

  if (mode === '2d') {
    return {
      mode: '2d',
      target: { lat: v * floor.blueprint_height, lng: u * floor.blueprint_width },
      zoom: 1,
    }
  }

  return {
    mode: '3d',
    target: {
      x: (u - 0.5) * 40,
      y: (floor.level - 1) * 16 + 0.5,
      z: (1 - v - 0.5) * 40 * (floor.blueprint_height / floor.blueprint_width),
    },
    distance: 30,
  }
}
