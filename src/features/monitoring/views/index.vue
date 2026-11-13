<script setup lang="ts">
import SpatialViewer from '@/features/spatial-viewer/components/spatial-viewer.vue'
import type { SpatialCommand, SpatialViewMode } from '@/features/spatial-viewer/types/spatial.type'
import type { Building, Floor } from '@/shared/types/entity.type'
import { onMounted, onUnmounted, ref, useTemplateRef } from 'vue'
import SimulationDialog from '../components/simulation-dialog.vue'
import { useEventProcessor } from '../composables/event-processor.ts'
import { mockWS } from '../services/mock-ws.service.ts'
import { useSpatialCache } from '../stores/spatial.cache'

const store = useSpatialCache()

const spatialViewerRef = useTemplateRef('spatial-viewer')

const viewMode = ref<SpatialViewMode>('3D')
const selectedBuilding = ref<Building | null>(null)
const selectedFloor = ref<Floor | null>(null)

function selectBuilding(building: Building) {
  selectedBuilding.value = building

  const floors = store.getFloorsByBuildingId(building.id)
  if (viewMode.value === '2D') {
    selectedFloor.value = floors[0] ?? null
  } else {
    selectedFloor.value =
      floors.find((floor) => floor.id === selectedFloor.value?.id) ?? floors[0] ?? null
  }
}

function createCommandId(): string {
  return `monitoring-${Date.now()}-${crypto.randomUUID()}`
}

async function dispatchSpatialCommand(command: SpatialCommand): Promise<void> {
  const viewer = spatialViewerRef.value
  if (!viewer) {
    throw new Error('SpatialViewer is not initialized')
  }
  await viewer.executeSpatialCommand(command)
}

const processor = useEventProcessor({
  devices: store.cachedDevices,
  floors: store.cachedFloors,
  dispatchDeviceColor: async (buildingId, floorId, deviceId, color) => {
    await dispatchSpatialCommand({
      id: createCommandId(),
      timestamp: Date.now(),
      source: 'WEBSOCKET',
      type: 'DEVICE_COLOR',
      context: {
        buildingId,
        floorId,
        deviceId,
      },
      payload: { color },
    })
  },
  dispatchFloorColor: async (buildingId, floorId, color) => {
    await dispatchSpatialCommand({
      id: createCommandId(),
      timestamp: Date.now(),
      source: 'WEBSOCKET',
      type: 'FLOOR_COLOR',
      context: {
        buildingId,
        floorId,
      },
      payload: { color },
    })
  },
  dispatchDeviceCamera: async (buildingId, floorId, deviceId, worldTarget) => {
    await dispatchSpatialCommand({
      id: createCommandId(),
      timestamp: Date.now(),
      source: 'WEBSOCKET',
      type: 'BUILDING_CAMERA',
      movement: 'ABSOLUTE',
      context: { buildingId, floorId, deviceId },
      payload: {
        target: worldTarget,
        distance: 48,
        duration: 1000,
      },
    })
  },
})

let unsubscribe: (() => void) | undefined
let eventProcessing = Promise.resolve()

function handleIncomingEvent(event: Parameters<typeof processor.processEvent>[0]) {
  eventProcessing = eventProcessing
    .then(() => processor.processEvent(event))
    .catch((error) => {
      console.error('Failed to process monitoring event:', error)
    })
}

onMounted(() => {
  if (store.buildings.length > 0) selectBuilding(store.buildings[0]!)
  unsubscribe = mockWS.onMessage(handleIncomingEvent)
})

onUnmounted(() => {
  unsubscribe?.()
})
</script>

<template>
  <div class="relative h-svh overflow-hidden pointer-events-none">
    <SpatialViewer
      ref="spatial-viewer"
      :buildings="store.buildings"
      :floors="store.cachedFloors"
      :devices="store.cachedDevices"
      v-model:view-mode="viewMode"
      v-model:selected-building="selectedBuilding"
      v-model:selected-floor="selectedFloor"
      class="relative z-0"
    />

    <div class="absolute left-3 top-3 z-1">
      <div
        class="flex flex-col gap-2 p-2 max-h-56 w-64 bg-surface-900 rounded-md overflow-y-auto pointer-events-auto"
      >
        <Button
          v-for="item in store.buildings"
          :key="item.id"
          :label="item.name"
          icon="icon-[tabler--building]"
          :severity="selectedBuilding?.id === item.id ? 'contrast' : 'secondary'"
          class="shrink-0 justify-start!"
          @click="selectBuilding(item)"
        />
      </div>
    </div>

    <div class="absolute right-3 top-3 z-1">
      <div class="flex gap-1 p-1 h-fit bg-surface-900 rounded-md pointer-events-auto">
        <Button
          label="3D"
          icon="icon-[tabler--cube] text-base!"
          severity="contrast"
          size="small"
          class="shrink-0!"
          :text="viewMode !== '3D'"
          @click="viewMode = '3D'"
        />
        <Button
          label="2D"
          icon="icon-[tabler--align-box-center-middle] text-base!"
          severity="contrast"
          size="small"
          class="shrink-0!"
          :text="viewMode !== '2D'"
          @click="viewMode = '2D'"
        />
      </div>
    </div>

    <div class="absolute right-3 top-1/2 -translate-y-1/2 z-1">
      <div
        v-if="viewMode === '2D' && selectedBuilding"
        class="group/floor-list flex flex-col gap-2 p-2 max-h-56 w-12 hover:w-48 bg-surface-900 rounded-md transform-all duration-200 hover:overflow-y-auto pointer-events-auto"
      >
        <Button
          v-for="item in store.getFloorsByBuildingId(selectedBuilding.id)"
          :key="item.id"
          :label="item.name"
          icon="icon-[tabler--layout-board]"
          :severity="selectedFloor?.id === item.id ? 'contrast' : 'secondary'"
          @click="selectedFloor = item"
          :pt="{
            root: 'shrink-0! flex! justify-start! py-0.5!',
            label: 'hidden group-hover/floor-list:block',
            icon: 'hidden group-hover/floor-list:block',
          }"
        />
      </div>
    </div>

    <div class="absolute right-3 bottom-3 z-1">
      <SimulationDialog>
        <template #trigger="{ show }">
          <Button icon="icon-[tabler--flask]" class="pointer-events-auto" @click="show" />
        </template>
      </SimulationDialog>
    </div>
  </div>
</template>
