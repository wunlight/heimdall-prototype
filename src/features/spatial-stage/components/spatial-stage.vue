<script setup lang="ts">
import BuildingModel from '@/features/building-model/components/building-model.vue'
import FloorPlan from '@/features/floor-plan/components/floor-plan.vue'
import type { Device, Floor } from '@/shared/types/entity.type.ts'
import { computed } from 'vue'
import type { CameraInstance } from '../types/camera.type.ts'
import type { SpatialViewMode } from '../types/state.type.ts'
import AmbientBg from './ambient-bg.vue'

const props = defineProps<{
  viewMode: SpatialViewMode
  buildingId: string | null
  floorId: string | null
  floors: Floor[]
  devices: Device[]
}>()

const emit = defineEmits<{
  'camera-ready': [instance: CameraInstance]
  'camera-disposed': [mode: SpatialViewMode]
  'scene-ready': [mode: SpatialViewMode, id: string]
}>()

const devicesByFloor = computed(() => {
  const map = new Map<string, Device[]>()
  for (const device of props.devices) {
    const list = map.get(device.floor_id)
    if (list) list.push(device)
    else map.set(device.floor_id, [device])
  }
  return map
})

const activeFloor = computed(() => props.floors.find((f) => f.id === props.floorId) ?? null)
const activeFloorDevices = computed(() =>
  activeFloor.value ? (devicesByFloor.value.get(activeFloor.value.id) ?? []) : [],
)
</script>

<template>
  <div class="size-full">
    <AmbientBg class="relative isolate z-0 size-full pointer-events-none" />

    <div class="absolute isolate inset-0 z-1">
      <BuildingModel
        v-if="viewMode === '3d'"
        :building-id="buildingId"
        :floors="floors"
        :devices="devicesByFloor"
        @camera-ready="(camera) => emit('camera-ready', { mode: '3d', camera })"
        @camera-disposed="emit('camera-disposed', '3d')"
        @scene-ready="(id) => emit('scene-ready', '3d', id)"
      />
      <FloorPlan
        v-else-if="viewMode === '2d'"
        :floor="activeFloor"
        :devices="activeFloorDevices"
        @camera-ready="(camera) => emit('camera-ready', { mode: '2d', camera })"
        @camera-disposed="emit('camera-disposed', '2d')"
        @scene-ready="(id) => emit('scene-ready', '2d', id)"
      />
    </div>
  </div>
</template>
