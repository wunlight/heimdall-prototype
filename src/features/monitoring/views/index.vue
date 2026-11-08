<script setup lang="ts">
import SpatialViewer from '@/features/spatial-viewer/components/spatial-viewer.vue'
import type { SpatialCommand } from '@/features/spatial-viewer/types/spatial.type'
import { ref } from 'vue'

const spatialViewerRef = ref<InstanceType<typeof SpatialViewer> | null>(null)

const testCommands: SpatialCommand[] = [
  {
    id: 'test-3d-001',
    timestamp: Date.now(),
    source: 'SYSTEM',
    type: 'CAMERA_3D',
    movement: 'ABSOLUTE',
    payload: {
      target: { x: 0, y: 0, z: 0 },
      azimuth: 45,
      elevation: 30,
      distance: 50,
      duration: 1000,
    },
  },
  {
    id: 'test-3d-002',
    timestamp: Date.now() + 1,
    source: 'SYSTEM',
    type: 'CAMERA_3D',
    movement: 'RELATIVE',
    payload: {
      azimuth: 30,
      elevation: 10,
      duration: 1000,
    },
  },
  {
    id: 'test-3d-003',
    timestamp: Date.now() + 2,
    source: 'SYSTEM',
    type: 'CAMERA_3D',
    movement: 'ABSOLUTE',
    payload: {
      target: { x: 10, y: 0, z: 10 },
      azimuth: 90,
      elevation: 45,
      distance: 30,
      duration: 1000,
    },
  },
  {
    id: 'test-view-001',
    timestamp: Date.now() + 3,
    source: 'SYSTEM',
    type: 'SWITCH_VIEW',
    target: '2D',
    context: {
      buildingId: 'bldg-2',
      floorId: 'flr-2-3',
    },
  },
  {
    id: 'test-2d-001',
    timestamp: Date.now() + 4,
    source: 'SYSTEM',
    type: 'CAMERA_2D',
    movement: 'ABSOLUTE',
    payload: {
      center: {
        lat: -6.2,
        lng: 106.8,
      },
      zoom: 3,
      duration: 1000,
    },
  },
]

async function executeTestQueue() {
  const viewer = spatialViewerRef.value
  if (!viewer) return
  console.log('executing...')

  for (const command of testCommands) {
    const accepted = await viewer.executeSpatialCommand(command)
    console.log(`[TEST QUEUE] ${command.id}:`, accepted ? 'ACCEPTED' : 'REJECTED')
  }
}
</script>

<template>
  <div class="relative h-svh overflow-hidden pointer-events-none">
    <SpatialViewer ref="spatialViewerRef" class="relative z-0" />

    <div class="absolute right-4 bottom-4 z-50 flex gap-2 pointer-events-auto">
      <Button label="Test Camera" @click="executeTestQueue" />
    </div>
  </div>
</template>
