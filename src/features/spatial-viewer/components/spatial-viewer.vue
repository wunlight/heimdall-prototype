<script setup lang="ts">
import type { Building, Device, Floor } from '@/shared/types/entity.type.ts'
import { computed, onUnmounted, ref, useTemplateRef } from 'vue'
import { useBuildingCamera } from '../composables/camera-control/building-camera.ts'
import type { useFloorCamera } from '../composables/camera-control/floor-camera.ts'
import { useSpatialCommandQueue } from '../composables/use-spatial-command-queue.ts'
import { useSpatialOrchestrator } from '../composables/use-spatial-orchestrator.ts'
import type { BuildingCameraPayload, FloorCameraPayload } from '../types/camera.type.ts'
import type { SpatialCommand, SpatialViewMode } from '../types/spatial.type.ts'
import AmbientBackground from './ambient-background.vue'
import BuildingModel from './building-model.vue'
import FloorPlan from './floor-plan.vue'

type Props = {
  buildings: Building[]
  floors: Map<string, Floor[]>
  devices: Map<string, Device[]>
}
const props = defineProps<Props>()

const viewMode = defineModel<SpatialViewMode>('view-mode', { default: '3D' })
const selectedBuilding = defineModel<Building | null>('selected-building', { default: null })
const selectedFloor = defineModel<Floor | null>('selected-floor', { default: null })

const buildingModelRef = useTemplateRef('building-model-ref')

const buildingCameraController = ref<ReturnType<typeof useBuildingCamera> | null>(null)
const floorCameraController = ref<ReturnType<typeof useFloorCamera> | null>(null)

const handleBuildingCameraCommand = async (
  payload: BuildingCameraPayload,
  movement: 'ABSOLUTE' | 'RELATIVE',
  signal: AbortSignal,
): Promise<void> => {
  if (!buildingCameraController.value) {
    console.warn('Camera 3D controller not initialized')
    return
  }

  if (movement === 'ABSOLUTE') {
    await buildingCameraController.value.executeAbsolute(payload, signal)
  } else {
    await buildingCameraController.value.executeRelative(payload, signal)
  }
}

const handleFloorCameraCommand = async (
  payload: FloorCameraPayload,
  movement: 'ABSOLUTE' | 'RELATIVE',
  signal: AbortSignal,
): Promise<void> => {
  if (!floorCameraController.value) {
    console.warn('Camera 2D controller not initialized')
    return
  }

  if (movement === 'ABSOLUTE') {
    await floorCameraController.value.executeAbsolute(payload, signal)
  } else {
    await floorCameraController.value.executeRelative(payload, signal)
  }
}

const handleFloorColorCommand = async (
  buildingId: string,
  floorId: string,
  color: string,
): Promise<void> => {
  if (!buildingModelRef.value) {
    return
  }

  const success = buildingModelRef.value.setFloorSpaceColor(buildingId, floorId, color)

  if (!success) {
    throw new Error(`Unable to update floor color: ${buildingId}/${floorId}`)
  }
}

const handleDeviceColorCommand = async (
  buildingId: string,
  floorId: string,
  deviceId: string,
  color: string,
): Promise<void> => {
  if (!buildingModelRef.value) {
    return
  }

  const success = buildingModelRef.value.setDeviceMarkerColor(buildingId, floorId, deviceId, color)

  if (!success) {
    throw new Error(`Unable to update device color: ${buildingId}/${floorId}/${deviceId}`)
  }
}

const { executeCommand: executeOrchestratedCommand } = useSpatialOrchestrator(
  viewMode,
  handleBuildingCameraCommand,
  handleFloorCameraCommand,
  handleFloorColorCommand,
  handleDeviceColorCommand,
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
      const building = props.buildings.find((b) => b.id === context.buildingId)
      if (building && selectedBuilding.value?.id !== building.id) {
        selectedBuilding.value = building
        console.log('Context: Selected building for 3D view:', building.id)
      }
    }
  }

  if (command.type === 'SWITCH_VIEW' && command.target === '2D') {
    if (context.buildingId && context.floorId) {
      const building = props.buildings.find((b) => b.id === context.buildingId)
      if (building) {
        if (selectedBuilding.value?.id !== building.id) {
          selectedBuilding.value = building
        }

        const floors = props.floors.get(context.buildingId) ?? []
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

  if (command.type === 'BUILDING_CAMERA') {
    if (context.buildingId) {
      const building = props.buildings.find((b) => b.id === context.buildingId)
      if (building && selectedBuilding.value?.id !== building.id) {
        selectedBuilding.value = building
        console.log('Context: Selected building for Camera 3D:', building.id)
      }
    }
  }

  if (command.type === 'FLOOR_CAMERA') {
    if (context.buildingId && context.floorId) {
      const building = props.buildings.find((b) => b.id === context.buildingId)
      if (building && selectedBuilding.value?.id !== building.id) {
        selectedBuilding.value = building
        console.log('Context: Selected building for Camera 2D:', building.id)
      }

      const floors = props.floors.get(context.buildingId) ?? []
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

const currentFloors = computed(() => {
  if (!selectedBuilding.value) return []
  return props.floors.get(selectedBuilding.value.id) ?? []
})

const currentDevices = computed(() => {
  if (!selectedFloor.value) return []
  return props.devices.get(selectedFloor.value.id) ?? []
})

const currentDevicesByFloor = computed(() => {
  if (!selectedBuilding.value) return new Map<string, Device[]>()
  const floors = props.floors.get(selectedBuilding.value.id) ?? []
  return new Map(floors.map((floor) => [floor.id, props.devices.get(floor.id) ?? []]))
})

const currentBuildingStatus = computed(() => {
  if (selectedBuilding.value) {
    const floors = props.floors.get(selectedBuilding.value.id) ?? []
    if (floors.length === 0) return 'NORMAL'

    for (const floor of floors) {
      const devices = props.devices.get(floor.id) ?? []

      for (const device of devices) {
        if (device.status === 'ALARM') {
          return 'ALARM'
        }
        if (device.status === 'TROUBLE') {
          return 'TROUBLE'
        }
      }
    }
  }
  return 'NORMAL'
})

function registerBuildingCameraControl(controller: ReturnType<typeof useBuildingCamera>) {
  buildingCameraController.value = controller
  console.log('building camera controller registered')
}

function unregisterBuildingCameraControl() {
  buildingCameraController.value = null
  console.log('building camera controller unregistered')
}

function registerFloorCameraControl(controller: ReturnType<typeof useFloorCamera>) {
  floorCameraController.value = controller
  console.log('floor camera controller registered')
}

function unregisterFloorCameraControl() {
  floorCameraController.value = null
  console.log('floor camera controller unregistered')
}

onUnmounted(() => {
  clearQueue()
  buildingCameraController.value?.dispose()
  floorCameraController.value?.dispose()
})

defineExpose({
  executeSpatialCommand,
  clearCommandQueue,
  getCommandQueueState,
})
</script>

<template>
  <div class="size-full">
    <AmbientBackground class="absolute isolate inset-0 z-0" :state="currentBuildingStatus" />

    <div class="absolute isolate inset-0 z-1">
      <template v-if="viewMode === '3D' && selectedBuilding">
        <BuildingModel
          ref="building-model-ref"
          :building-id="selectedBuilding.id"
          :floors="currentFloors"
          :devices-by-floor="currentDevicesByFloor"
          @controller-ready="registerBuildingCameraControl"
          @controller-disposed="unregisterBuildingCameraControl"
        />
      </template>
      <template v-else-if="viewMode === '2D' && selectedFloor">
        <FloorPlan
          :blueprint-url="selectedFloor.blueprint_url"
          :devices="currentDevices"
          class="pointer-events-auto"
          @controller-ready="registerFloorCameraControl"
          @controller-disposed="unregisterFloorCameraControl"
        />
      </template>
    </div>
  </div>
</template>
