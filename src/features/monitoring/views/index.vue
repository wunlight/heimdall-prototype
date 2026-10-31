<script setup lang="ts">
import { onMounted, ref } from 'vue'
import GridBackground from '../components/grid-background.vue'
import { useAppInit } from '../composables/use-app-init.ts'
import { databaseSeeding } from '../services/task.service.ts'
import type { LoadingTask } from '../types/task.type.ts'

const loadTasks: LoadingTask[] = [
  {
    name: 'Database Seeding',
    action: databaseSeeding,
  },
]

const { isLoading, isError, initProgress, initProgressMsg, initErrorMsg, handleAppInitialization } =
  useAppInit(loadTasks)

const viewMode = ref('3D')

onMounted(() => {
  handleAppInitialization()
})
</script>

<template>
  <div class="relative h-svh w-full pointer-events-none overflow-hidden">
    <!-- BACKGROUND -->
    <GridBackground class="absolute isolate inset-0 z-0" />

    <!-- LOADING & ERROR -->
    <div class="absolute inset-0 z-1 flex flex-col items-center justify-center gap-4">
      <template v-if="isLoading">
        <p class="text-sm text-slate-500">{{ initProgressMsg }}</p>
        <ProgressBar :value="initProgress" class="w-96 rounded-full!" />
      </template>
      <template v-else-if="isError">
        <p class="text-sm text-slate-500">{{ initErrorMsg }}</p>
      </template>
    </div>

    <!-- MAIN COMPONENTS -->
    <div class="absolute isolate inset-0 z-2">
      <div class="absolute top-3 left-3 z-1">
        <SelectButton
          v-model="viewMode"
          :options="['3D', '2D']"
          :allow-empty="false"
          :pt="{
            root: 'bg-zinc-900 pointer-events-auto',
            pcToggleButton: { root: 'bg-transparent! border-0!' },
          }"
        />
      </div>
    </div>
  </div>
</template>
