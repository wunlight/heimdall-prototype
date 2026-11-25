<script setup lang="ts">
import SpatialStage from '@/features/spatial-stage/components/spatial-stage.vue'
import { createCameraRegistry } from '@/features/spatial-stage/composables/create-camera-registry'
import { useSpatialGateway } from '@/features/spatial-stage/composables/use-spatial-gateway'
import { useEntityStore } from '@/shared/stores/entity.store'
import { computed } from 'vue'

const entity = useEntityStore()
const cameraRegistry = createCameraRegistry()

const gateway = useSpatialGateway(cameraRegistry)

const floors = computed(() =>
  Object.values(entity.floors).filter((f) => f.building_id === gateway.state.buildingId),
)
const devices = computed(() => {
  const floorIds = new Set(floors.value.map((f) => f.id))
  return Object.values(entity.devices).filter((d) => floorIds.has(d.floor_id))
})

// const visibleDevices = computed(() => {
//   const floorIds =
//     viewMode.value === '2d'
//       ? new Set(floorId.value ? [floorId.value] : [])
//       : new Set(floors.value.map((f) => f.id))

//   return Object.values(entity.devices)
//     .filter((d) => floorIds.has(d.floor_id))
//     .flatMap((device) => {
//       const floor = entity.floors[device.floor_id]
//       if (!floor) return []
//       return [
//         {
//           ...device,
//           status: 'normal',
//           buildingName: buildingNameOf(floor.building_id),
//           floorName: floor.name,
//         },
//       ]
//     })
// })

// const devicesByFloor = computed(() => {
//   const floorIds = new Set(floors.value.map((f) => f.id))
//   return Object.values(entity.devices).filter((d) => floorIds.has(d.floor_id))
// })

// const buildingNameOf = (bId: string) => entity.buildings[bId]?.name ?? '-'

// const floorsOf = (id: string) => Object.values(entity.floors).filter((f) => f.building_id === id)

// const resetFloor = (candidates: Floor[]) => {
//   floorId.value = candidates[0]?.id ?? null
// }

// const changeViewMode = (mode: SpatialViewMode) => {
//   viewMode.value = mode
//   resetFloor(mode === '2d' ? floors.value : [])
// }

// const selectBuilding = (bId: string) => {
//   buildingId.value = bId
//   resetFloor(viewMode.value === '2d' ? floorsOf(bId) : [])
// }
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
      class="relative isolate z-0"
    />

    <!-- <div
      class="absolute isolate inset-3 z-1 grid grid-cols-10 grid-rows-6 gap-1.5 pointer-events-none"
    >
      <div class="col-span-3 row-span-2 flex items-start gap-1.5 h-full overflow-hidden">
        <div
          class="group p-1.5 max-h-full hover:w-64 bg-zinc-900 border border-zinc-700 rounded-lg transition-all duration-300 origin-top-left [interpolate-size:allow-keywords] overflow-y-auto pointer-events-auto"
        >
          <div class="hidden group-hover:flex flex-col gap-1.5">
            <Button
              v-for="item in entity.buildings"
              :key="item.id"
              :label="item.name"
              :variant="buildingId === item.id ? '' : 'text'"
              @click="selectBuilding(item.id)"
              icon="icon-[tabler--building]"
              severity="contrast"
              class="shrink-0 justify-start!"
            />
          </div>
          <span class="icon-[tabler--building] block group-hover:hidden size-5" />
        </div>
        <div
          class="flex gap-1 p-1 size-fit bg-zinc-900 border border-zinc-700 rounded-lg pointer-events-auto"
        >
          <Button
            :variant="viewMode === '3d' ? '' : 'text'"
            @click="changeViewMode('3d')"
            label="3D"
            severity="contrast"
            size="small"
            class="h-6!"
          />
          <Button
            :variant="viewMode === '2d' ? '' : 'text'"
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
        v-if="viewMode === '2d' && floors.length > 0"
        class="col-span-2 row-span-2 flex items-start justify-end"
      >
        <div
          class="group flex flex-col gap-1.5 p-1.5 max-h-full w-12 hover:w-64 bg-zinc-900 border border-zinc-700 rounded-lg transition-all duration-300 overflow-x-hidden overflow-y-auto pointer-events-auto"
        >
          <div
            v-for="item in floors"
            :key="item.id"
            :class="
              floorId === item.id
                ? 'text-zinc-900 bg-white hover:bg-zinc-200'
                : 'bg-zinc-800 hover:bg-zinc-700'
            "
            @click="floorId = item.id"
            class="flex items-center shrink-0 group-hover:px-3 h-1.5 group-hover:h-9 w-9 group-hover:w-auto rounded-lg cursor-pointer"
          >
            <p class="hidden group-hover:block">{{ item.name }}</p>
          </div>
        </div>
      </div>

      <div class="row-span-2 col-span-full" />

      <div class="col-span-5 row-span-2 flex items-end overflow-hidden">
        <div
          class="group flex flex-col p-1.5 hover:p-0 size-fit hover:size-full bg-zinc-900 border border-zinc-700 rounded-lg transition-all duration-300 origin-bottom-left [interpolate-size:allow-keywords] overflow-hidden pointer-events-auto"
        >
          <DevicesTable :devices="visibleDevices" class="hidden! group-hover:block!" />
          <span class="icon-[tabler--alarm-smoke] block group-hover:hidden size-5" />
        </div>
      </div>
    </div> -->
  </div>
</template>
