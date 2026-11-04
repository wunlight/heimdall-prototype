<script setup lang="ts">
import type { StatusType } from '@/features/monitoring/types/entity.type.ts'
import { onMounted } from 'vue'
import GridBackground from '../components/grid-background.vue'
import { useAppSetup } from '../composables/app-setup.ts'
import { INITIAL_TASKS } from '../constants/app.task.ts'

type Props = {
  buildingStatus: StatusType
}
defineProps<Props>()

const { isLoading, hasError, progress, progressMessage, errorMessage, initialize } =
  useAppSetup(INITIAL_TASKS)

onMounted(async () => {
  initialize()
})
</script>

<template>
  <div class="relative h-svh w-full pointer-events-none overflow-hidden">
    <GridBackground class="relative isolate z-0 size-full" :state="buildingStatus" />

    <div class="absolute isolate inset-0 z-1 flex flex-col items-center justify-center gap-4">
      <template v-if="isLoading">
        <p class="text-sm text-slate-500">{{ progressMessage }}</p>
        <ProgressBar :value="progress" class="w-96 rounded-full!" />
      </template>
      <template v-else-if="hasError">
        <p class="text-sm text-slate-500">{{ errorMessage }}</p>
      </template>
    </div>

    <div class="absolute isolate inset-0 z-2 size-full">
      <slot :is-loading="isLoading" />
    </div>
  </div>
</template>
