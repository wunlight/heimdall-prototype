<script setup lang="ts">
import type { Building, Floor } from '@/shared/types/entity.type.ts'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useCamera2DController } from '../composables/use-camera-2d-controller.ts'
import { useCamera3DController } from '../composables/use-camera-3d-controller.ts'
import { useSpatialCommandQueue } from '../composables/use-spatial-command-queue.ts'
import { useSpatialOrchestrator } from '../composables/use-spatial-orchestrator.ts'
import { useSpatialStore } from '../stores/spatial.store.ts'
import type { Camera2DPayload, Camera3DPayload } from '../types/camera.type.ts'
import type { SpatialCommand, SpatialViewMode } from '../types/spatial.type.ts'
import AmbientBackground from './ambient-background.vue'
import BuildingModel from './building-model.vue'
import FloorPlan from './floor-plan.vue'

const store = useSpatialStore()

const viewMode = ref<SpatialViewMode>('3D')
const selectedBuilding = ref<Building | null>(null)
const selectedFloor = ref<Floor | null>(null)

const camera3DController = ref<ReturnType<typeof useCamera3DController> | null>(null)
const camera2DController = ref<ReturnType<typeof useCamera2DController> | null>(null)

const handleCamera3DCommand = async (
  payload: Camera3DPayload,
  movement: 'ABSOLUTE' | 'RELATIVE',
  signal: AbortSignal,
): Promise<void> => {
  if (!camera3DController.value) {
    console.warn('Camera 3D controller not initialized')
    return
  }

  if (movement === 'ABSOLUTE') {
    await camera3DController.value.executeAbsolute(payload, signal)
  } else {
    await camera3DController.value.executeRelative(payload, signal)
  }
}

const handleCamera2DCommand = async (
  payload: Camera2DPayload,
  movement: 'ABSOLUTE' | 'RELATIVE',
  signal: AbortSignal,
): Promise<void> => {
  if (!camera2DController.value) {
    console.warn('Camera 2D controller not initialized')
    return
  }

  if (movement === 'ABSOLUTE') {
    await camera2DController.value.executeAbsolute(payload, signal)
  } else {
    await camera2DController.value.executeRelative(payload, signal)
  }
}

const { executeCommand: executeOrchestratedCommand } = useSpatialOrchestrator(
  viewMode,
  handleCamera3DCommand,
  handleCamera2DCommand,
)

const { enqueueCommand, clearQueue, getQueueState, setCommandExecutor } = useSpatialCommandQueue()

setCommandExecutor(executeOrchestratedCommand)

const executeSpatialCommand = async (command: SpatialCommand): Promise<boolean> => {
  handleCommandContext(command)
  return await enqueueCommand(command)
}

function handleCommandContext(command: SpatialCommand) {
  const context = command.context
  if (!context) return

  if (command.type === 'SWITCH_VIEW' && command.target === '3D') {
    if (context.buildingId) {
      const building = store.buildings.find((b) => b.id === context.buildingId)
      if (building && selectedBuilding.value?.id !== building.id) {
        selectedBuilding.value = building
        console.log('Context: Selected building for 3D view:', building.id)
      }
    }
  }

  if (command.type === 'SWITCH_VIEW' && command.target === '2D') {
    if (context.buildingId && context.floorId) {
      const building = store.buildings.find((b) => b.id === context.buildingId)
      if (building) {
        if (selectedBuilding.value?.id !== building.id) {
          selectedBuilding.value = building
        }

        const floors = store.getFloorsByBuildingId(context.buildingId)
        const floor = floors.find((f) => f.id === context.floorId)
        if (floor) {
          selectedFloor.value = floor
          console.log('Context: Selected building and floor for 2D view:', building.id, floor.id)
        } else {
          console.warn('Context: Floor not found:', context.floorId)
        }
      } else {
        console.warn('Context: Building not found:', context.buildingId)
      }
    } else {
      console.warn('Context: 2D view requires both buildingId and floorId')
    }
  }

  if (command.type === 'CAMERA_3D') {
    if (context.buildingId) {
      const building = store.buildings.find((b) => b.id === context.buildingId)
      if (building && selectedBuilding.value?.id !== building.id) {
        selectedBuilding.value = building
        console.log('Context: Selected building for Camera 3D:', building.id)
      }
    }
  }

  if (command.type === 'CAMERA_2D') {
    if (context.buildingId && context.floorId) {
      const building = store.buildings.find((b) => b.id === context.buildingId)
      if (building && selectedBuilding.value?.id !== building.id) {
        selectedBuilding.value = building
        console.log('Context: Selected building for Camera 2D:', building.id)
      }

      const floors = store.getFloorsByBuildingId(context.buildingId)
      const floor = floors.find((f) => f.id === context.floorId)
      if (floor && selectedFloor.value?.id !== floor.id) {
        selectedFloor.value = floor
        console.log('Context: Selected floor for Camera 2D:', floor.id)
      }
    } else {
      console.warn('Context: Camera 2D requires both buildingId and floorId')
    }
  }
}

const clearCommandQueue = () => {
  clearQueue()
}

const getCommandQueueState = () => {
  return getQueueState()
}

defineExpose({
  executeSpatialCommand,
  clearCommandQueue,
  getCommandQueueState,
})

const currentFloors = computed(() => {
  if (!selectedBuilding.value) return []
  return store.getFloorsByBuildingId(selectedBuilding.value.id)
})

const currentDevices = computed(() => {
  if (!selectedFloor.value) return []
  return store.getDevicesByFloorId(selectedFloor.value.id)
})

const currentBuildingStatus = computed(() => {
  if (!selectedBuilding.value) return 'NORMAL'
  return store.getBuildingStatus(selectedBuilding.value.id)
})

function registerCamera3DController(controller: ReturnType<typeof useCamera3DController>) {
  camera3DController.value = controller
  console.log('3D camera controller registered')
}

function unregisterCamera3DController() {
  camera3DController.value = null
  console.log('3D camera controller unregistered')
}

function registerCamera2DController(controller: ReturnType<typeof useCamera2DController>) {
  camera2DController.value = controller
  console.log('2D camera controller registered')
}

function unregisterCamera2DController() {
  camera2DController.value = null
  console.log('2D camera controller unregistered')
}

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

onMounted(() => {
  if (store.buildings.length > 0) {
    selectedBuilding.value = store.buildings[0]!
  }
})

onUnmounted(() => {
  clearQueue()
  camera3DController.value?.dispose()
  camera2DController.value?.dispose()
})
</script>

<template>
  <div class="size-full">
    <AmbientBackground class="relative isolate z-0 size-full" :state="currentBuildingStatus" />

    <div class="absolute isolate inset-0 z-1">
      <template v-if="viewMode === '3D' && selectedBuilding">
        <BuildingModel
          :building-id="selectedBuilding.id"
          :floors="currentFloors"
          @controller-ready="registerCamera3DController"
          @controller-disposed="unregisterCamera3DController"
        />
      </template>
      <template v-else-if="viewMode === '2D' && selectedFloor">
        <FloorPlan
          :blueprint-url="selectedFloor.blueprint_url"
          :devices="currentDevices"
          class="pointer-events-auto"
          @controller-ready="registerCamera2DController"
          @controller-disposed="unregisterCamera2DController"
        />
      </template>
    </div>

    <div class="absolute left-2 top-2 z-2">
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

    <div class="absolute right-2 top-2 z-2">
      <div class="flex gap-1 p-1 bg-surface-900 rounded-md pointer-events-auto">
        <Button
          label="3D"
          icon="icon-[tabler--cube] text-base!"
          severity="contrast"
          :text="viewMode !== '3D'"
          size="small"
          @click="viewMode = '3D'"
        />
        <Button
          label="2D"
          icon="icon-[tabler--align-box-center-middle] text-base!"
          severity="contrast"
          :text="viewMode !== '2D'"
          size="small"
          @click="viewMode = '2D'"
        />
      </div>
    </div>

    <div
      v-if="viewMode === '2D' && selectedBuilding"
      class="absolute right-2 top-1/2 -translate-y-1/2 z-2"
    >
      <div
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
  </div>
</template>
