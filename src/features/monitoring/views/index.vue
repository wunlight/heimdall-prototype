<script setup lang="ts">
import { ref } from 'vue'
import BuildingList from '../components/building-list.vue'
import FloorList from '../components/floor-list.vue'
import MonitoringLayout from '../layouts/monitoring-layout.vue'
import { useBuildingStore } from '../stores/building.store.ts'

const buildingStore = useBuildingStore()

const viewMode = ref<'3D' | '2D'>('3D')
</script>

<template>
  <MonitoringLayout>
    <template #default="{ isLoading }">
      <template v-if="!isLoading">
        <div v-if="buildingStore.selectedBuilding" class="relative isolate z-0 size-full">
          <template v-if="viewMode === '2D'">
            <FloorList
              v-if="buildingStore.floors.length"
              :floors="buildingStore.floors"
              :selected-floor="buildingStore.selectedFloor"
              @item-click="(item) => buildingStore.selectFloor(item)"
            />
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
