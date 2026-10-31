<script setup lang="ts">
import { useBuildingStore } from '@/stores/building.store.ts'
import { onMounted, ref } from 'vue'
import BuildingModel from '../components/building-model.vue'
import GeoMap from '../components/geo-map.vue'
import GridBackground from '../components/grid-background.vue'
import { useAppInit } from '../composables/use-app-init.ts'
import { databaseSeeding } from '../services/task.service.ts'
import type { LoadingTask } from '../types/task.type.ts'

const buildingStore = useBuildingStore()

const loadTasks: LoadingTask[] = [
  {
    name: 'Database Seeding',
    action: databaseSeeding,
  },
]

const { isLoading, isError, initProgress, initProgressMsg, initErrorMsg, handleAppInitialization } =
  useAppInit(loadTasks)

const viewMode = ref('3D')

onMounted(async () => {
  handleAppInitialization()
  buildingStore.loadBuildings()
})
</script>

<template>
  <div class="relative h-svh w-full pointer-events-none overflow-hidden">
    <!-- BACKGROUND -->
    <GridBackground class="absolute isolate inset-0 z-0" />

    <div class="absolute inset-0 z-1">
      <!-- LEAFLET - GEO MAP -->
      <template v-if="!buildingStore.activeBuilding">
        <GeoMap class="pointer-events-auto" />
      </template>

      <!-- THREE - BUILDING MODEL -->
      <template v-else-if="buildingStore.floors.length">
        <BuildingModel :floors="buildingStore.floors" class="pointer-events-auto" />
      </template>
    </div>

    <!-- LOADING & ERROR -->
    <div class="absolute inset-0 z-2 flex flex-col items-center justify-center gap-4">
      <template v-if="isLoading">
        <p class="text-sm text-slate-500">{{ initProgressMsg }}</p>
        <ProgressBar :value="initProgress" class="w-96 rounded-full!" />
      </template>
      <template v-else-if="isError">
        <p class="text-sm text-slate-500">{{ initErrorMsg }}</p>
      </template>
    </div>

    <!-- MAIN COMPONENTS -->
    <div class="absolute isolate inset-0 z-3">
      <div
        v-if="!!buildingStore.activeBuilding"
        class="absolute left-3 top-3 z-1 flex flex-col gap-3"
      >
        <SelectButton
          v-model="viewMode"
          :options="['3D', '2D']"
          :allow-empty="false"
          :pt="{
            root: 'w-fit bg-zinc-900 pointer-events-auto',
            pcToggleButton: { root: 'bg-transparent! border-0!' },
          }"
        />
      </div>
      <div class="absolute right-3 top-3 z-1 flex flex-col gap-3">
        <Card :pt="{ root: 'w-64 pointer-events-auto', body: 'p-1.5!' }">
          <template #content>
            <div class="flex flex-col gap-2">
              <Button
                v-for="item in buildingStore.buildings"
                :key="item.id"
                :label="item.name"
                icon="icon-[tabler--building]"
                severity="secondary"
                fluid
                class="justify-start!"
                @click="buildingStore.selectBuilding(item)"
              />
            </div>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>
