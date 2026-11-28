import type { useBuildingCamera } from '@/features/building-model/composables/use-camera'
import type { useFloorCamera } from '@/features/floor-plan/composables/use-camera'
import type { CameraInstance } from '../types/camera.type'
import type { SpatialViewMode } from '../types/state.type'

export interface CameraByMode {
  '3d': ReturnType<typeof useBuildingCamera>
  '2d': ReturnType<typeof useFloorCamera>
}

export function createCameraRegistry() {
  const cameras: { [M in SpatialViewMode]?: CameraByMode[M] } = {}

  return {
    register(instance: CameraInstance) {
      Object.assign(cameras, { [instance.mode]: instance.camera })
    },
    unregister(mode: SpatialViewMode) {
      delete cameras[mode]
    },
    get<M extends SpatialViewMode>(mode: M): CameraByMode[M] | undefined {
      return cameras[mode]
    },
  }
}
