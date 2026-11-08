<script setup lang="ts">
import SpatialViewer from '@/features/spatial-viewer/components/spatial-viewer.vue'
import type { SpatialCommand } from '@/features/spatial-viewer/types/spatial.type'
import { ref } from 'vue'

const spatialViewerRef = ref<InstanceType<typeof SpatialViewer> | null>(null)
const isRunning = ref(false)

function createDemoCommands(): SpatialCommand[] {
  const timestamp = Date.now()

  return [
    {
      id: 'demo-3d-initial-position',
      timestamp,
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
      id: 'demo-3d-relative-orbit',
      timestamp: timestamp + 1,
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
      id: 'demo-3d-absolute-reposition',
      timestamp: timestamp + 2,
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
      id: 'demo-view-switch-to-2d',
      timestamp: timestamp + 3,
      source: 'SYSTEM',
      type: 'SWITCH_VIEW',
      target: '2D',
      context: {
        buildingId: 'bldg-2',
        floorId: 'flr-2-3',
      },
    },
    {
      id: 'demo-2d-center-position',
      timestamp: timestamp + 4,
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
}

async function executeCameraDemo() {
  const viewer = spatialViewerRef.value

  if (!viewer || isRunning.value) return

  isRunning.value = true

  const commands = createDemoCommands()

  console.group('[SPATIAL DEMO] Camera Movement')

  try {
    for (const command of commands) {
      const accepted = await viewer.executeSpatialCommand(command)

      console.info(`[${command.type}] ${command.id}:`, accepted ? 'ACCEPTED' : 'REJECTED')

      if (!accepted) {
        console.warn('Demo sequence interrupted.')
        break
      }
    }
  } catch (error) {
    console.error('Camera demo execution failed:', error)
  } finally {
    isRunning.value = false
    console.groupEnd()
  }
}
</script>

<template>
  <div class="relative h-svh overflow-hidden pointer-events-none">
    <SpatialViewer ref="spatialViewerRef" class="relative z-0" />

    <div class="absolute right-4 bottom-4 z-50 flex gap-2 pointer-events-auto">
      <Button
        :label="isRunning ? 'Running Demo...' : 'Run Camera Demo'"
        :disabled="isRunning"
        @click="executeCameraDemo"
      />
    </div>
  </div>
</template>
