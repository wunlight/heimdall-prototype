<script setup lang="ts">
import type { Building, Floor } from '@/features/monitoring/types/entity.type.ts'
import { computed, onMounted, ref } from 'vue'
import { useSpatialStore } from '../stores/spatial.store.ts'
import AmbientBackground from './ambient-background.vue'
import BuildingModel from './building-model.vue'
import FloorPlan from './floor-plan.vue'

type ViewMode = '3D' | '2D'

const store = useSpatialStore()

const viewMode = ref<ViewMode>('3D')
const selectedBuilding = ref<Building | null>(null)
const selectedFloor = ref<Floor | null>(null)

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

onMounted(() => {
  if (store.buildings.length > 0) {
    selectedBuilding.value = store.buildings[0]!
  }
})
</script>

<template>
  <div class="size-full">
    <AmbientBackground class="relative isolate z-0 size-full" :state="currentBuildingStatus" />

    <div class="absolute isolate inset-0 z-1">
      <template v-if="viewMode === '3D' && selectedBuilding">
        <BuildingModel :building-id="selectedBuilding.id" :floors="currentFloors" />
      </template>
      <template v-else-if="viewMode === '2D' && selectedFloor">
        <FloorPlan
          :blueprint-url="selectedFloor.blueprint_url"
          :devices="currentDevices"
          class="pointer-events-auto"
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
          @click="selectedBuilding = item"
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
