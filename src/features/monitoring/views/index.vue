<script setup lang="ts">
import { ref } from 'vue'
import BuildingList from '../components/building-list.vue'
import MonitoringLayout from '../layouts/monitoring-layout.vue'
import { useBuildingStore } from '../stores/building.store.ts'

const buildingStore = useBuildingStore()

const viewMode = ref<'3D' | '2D'>('3D')
</script>

<template>
  <MonitoringLayout>
    <template #default="{ isLoading }">
      <template v-if="!isLoading">
        <div class="absolute inset-0 z-0">
          <div
            v-if="buildingStore.selectedBuilding"
            class="grid place-content-center size-full pointer-events-auto"
          >
            <!--  -->
          </div>
        </div>

        <div class="absolute left-2 top-2 z-1 h-56 w-64 overflow-hidden">
          <BuildingList />
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
