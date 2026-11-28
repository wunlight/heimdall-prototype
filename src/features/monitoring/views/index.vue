<script setup lang="ts">
import DevicesTable from '@/features/monitoring/components/widgets/devices-table.vue'
import ControlGuide from '@/features/spatial-stage/components/control-guide.vue'
import SpatialStage from '@/features/spatial-stage/components/spatial-stage.vue'
import { createCameraRegistry } from '@/features/spatial-stage/composables/create-camera-registry'
import { useSpatialGateway } from '@/features/spatial-stage/composables/use-spatial-gateway'
import type { SpatialViewMode } from '@/features/spatial-stage/types/state.type'
import { toCameraTarget } from '@/features/spatial-stage/utils/device-target'
import { useEntityStore } from '@/shared/stores/entity.store'
import type { Device, Floor } from '@/shared/types/entity.type'
import { computed, onMounted, ref, watch } from 'vue'
import BuildingList from '../components/widgets/building-list.vue'
import FloorList from '../components/widgets/floor-list.vue'

const entity = useEntityStore()
const cameraRegistry = createCameraRegistry()
const gateway = useSpatialGateway(cameraRegistry)

const selectedDevice = ref<Device | null>(null)

const floors = computed(() =>
  Object.values(entity.floors).filter((f) => f.building_id === gateway.state.buildingId),
)

const floorsOf = (bId: string) => Object.values(entity.floors).filter((f) => f.building_id === bId)

const devices = computed(() => {
  const floorIds = new Set(floors.value.map((f) => f.id))
  return Object.values(entity.devices).filter((d) => floorIds.has(d.floor_id))
})

const visibleDevices = computed(() => {
  const floorIds =
    gateway.state.viewMode === '2d'
      ? new Set(gateway.state.floorId ? [gateway.state.floorId] : [])
      : new Set(floors.value.map((f) => f.id))

  return Object.values(entity.devices)
    .filter((d) => floorIds.has(d.floor_id))
    .flatMap((device) => {
      const floor = entity.floors[device.floor_id]
      if (!floor) return []
      return [
        {
          ...device,
          buildingName: entity.buildings[floor.building_id]?.name ?? '-',
          floorName: floor.name,
        },
      ]
    })
})

const changeViewMode = (mode: SpatialViewMode) => {
  gateway.switchView(mode)
  const next = mode === '2d' ? floors.value[0] : undefined
  if (next) gateway.selectFloor(next.id)
}

const selectBuilding = (bId: string) => {
  gateway.selectBuilding(bId)
  if (gateway.state.viewMode === '2d') {
    const next: Floor | undefined = floorsOf(bId)[0]
    if (next) gateway.selectFloor(next.id)
  }
}

onMounted(() => {
  const defaultFloor = Object.values(entity.floors)[0]
  if (defaultFloor) selectBuilding(defaultFloor.building_id)
})

watch(selectedDevice, (newDevice) => {
  if (!newDevice) return

  const floor = entity.floors[newDevice.floor_id]
  if (!floor) return

  if (gateway.state.buildingId !== floor.building_id) gateway.selectBuilding(floor.building_id)
  if (gateway.state.viewMode === '2d' && gateway.state.floorId !== floor.id)
    gateway.selectFloor(floor.id)

  gateway.moveCamera(toCameraTarget(gateway.state.viewMode, newDevice, floor))
  selectedDevice.value = null
})
</script>

<template>
  <div class="relative h-dvh overflow-hidden">
    <SpatialStage
      :view-mode="gateway.state.viewMode"
      :building-id="gateway.state.buildingId"
      :floor-id="gateway.state.floorId"
      :floors="floors"
      :devices="devices"
      @camera-ready="cameraRegistry.register"
      @camera-disposed="cameraRegistry.unregister"
      @scene-ready="gateway.onSceneReady"
      class="relative isolate z-0"
    />

    <div
      class="absolute isolate inset-3 z-1 grid grid-cols-10 grid-rows-6 gap-1.5 pointer-events-none"
    >
      <div class="col-span-3 row-span-2 flex items-start gap-1.5 h-full overflow-hidden">
        <BuildingList
          :buildings="entity.buildings"
          :selected-id="gateway.state.buildingId"
          @select="selectBuilding"
        />
        <div
          class="flex gap-1 p-1 size-fit bg-zinc-900 border border-zinc-700 rounded-lg pointer-events-auto"
        >
          <Button
            :variant="gateway.state.viewMode === '3d' ? '' : 'text'"
            @click="changeViewMode('3d')"
            label="3D"
            severity="contrast"
            size="small"
            class="h-6!"
          />
          <Button
            :variant="gateway.state.viewMode === '2d' ? '' : 'text'"
            @click="changeViewMode('2d')"
            label="2D"
            severity="contrast"
            size="small"
            class="h-6!"
          />
        </div>
      </div>

      <div class="col-span-5" />

      <div
        v-if="gateway.state.viewMode === '2d' && floors.length > 0"
        class="col-span-2 row-span-2 flex items-start justify-end"
      >
        <FloorList
          :floors="floors"
          :selected-id="gateway.state.floorId"
          @select="gateway.selectFloor"
        />
      </div>

      <div class="row-span-2 col-span-full" />

      <div class="col-span-5 row-span-2 flex items-end overflow-hidden">
        <div
          class="group flex flex-col p-1.5 hover:p-0 size-fit hover:size-full bg-zinc-900 border border-zinc-700 rounded-lg transition-all duration-300 origin-bottom-left [interpolate-size:allow-keywords] overflow-hidden pointer-events-auto"
        >
          <DevicesTable
            v-model:selected="selectedDevice"
            :devices="visibleDevices"
            class="hidden! group-hover:block!"
          />
          <span class="icon-[tabler--alarm-smoke] block group-hover:hidden size-5" />
        </div>
      </div>
    </div>
    <ControlGuide class="absolute right-3 bottom-3 z-1" />
  </div>
</template>
