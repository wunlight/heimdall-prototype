<script setup lang="ts">
import { computed, ref } from 'vue'
import BuildingList from '../components/building-list.vue'
import BuildingModel from '../components/building-model.vue'
import FloorList from '../components/floor-list.vue'
import ImageOverlayMap from '../components/image-overlay-map.vue'
import MonitoringLayout from '../layouts/monitoring-layout.vue'
import { useBuildingStore } from '../stores/building.store.ts'

const buildingStore = useBuildingStore()

const viewMode = ref<'3D' | '2D'>('3D')

const currentFloors = computed(() => {
  if (!buildingStore.selectedBuilding) return []
  return buildingStore.getFloorsByBuildingId(buildingStore.selectedBuilding.id)
})

const currentDevices = computed(() => {
  if (!buildingStore.selectedFloor) return []
  return buildingStore.getDevicesByFloorId(buildingStore.selectedFloor.id)
})
</script>

<template>
  <MonitoringLayout>
    <template #default="{ isLoading }">
      <template v-if="!isLoading">
        <div v-if="buildingStore.selectedBuilding" class="relative isolate z-0 size-full">
          <template v-if="viewMode === '3D'">
            <div class="absolute inset-0 z-0">
              <BuildingModel
                v-if="buildingStore.selectedBuilding"
                :building-id="buildingStore.selectedBuilding.id"
                :floors="currentFloors"
              />
            </div>
          </template>

          <template v-else-if="viewMode === '2D'">
            <div class="absolute inset-0 z-0">
              <ImageOverlayMap
                v-if="buildingStore.selectedFloor"
                :image-url="buildingStore.selectedFloor.blueprint_url"
                :devices="currentDevices"
              />
            </div>
            <div class="absolute right-3 top-1/2 -translate-y-1/2 z-1">
              <FloorList
                v-if="currentFloors.length"
                :key="buildingStore.selectedBuilding.id"
                :floors="currentFloors"
                :selected-floor="buildingStore.selectedFloor"
                @item-click="(item) => buildingStore.selectFloor(item)"
              />
            </div>
          </template>
        </div>

        <div class="absolute left-2 top-2 z-1 h-56 w-64 overflow-hidden">
          <BuildingList
            v-if="buildingStore.buildings.length"
            :buildings="buildingStore.buildings"
            :selected-building="buildingStore.selectedBuilding"
            @item-click="(item) => buildingStore.selectBuilding(item)"
          />
        </div>

        <div class="absolute right-2 top-2 z-1">
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
      </template>
    </template>
  </MonitoringLayout>
</template>
