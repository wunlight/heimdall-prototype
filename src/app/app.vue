<script setup lang="ts">
import { onMounted } from 'vue'
import AppErrorScreen from './app-error-screen.vue'
import AppLoadingScreen from './app-loading-screen.vue'
import { useAppSetup } from './setup/index.ts'
import { INITIAL_TASKS } from './setup/initial-tasks.ts'

const { isLoading, hasError, progress, progressMessage, errorMessage, initialize } =
  useAppSetup(INITIAL_TASKS)

onMounted(async () => {
  await initialize()
})
</script>

<template>
  <AppLoadingScreen v-if="isLoading" :progress="progress" :message="progressMessage" />

  <AppErrorScreen v-else-if="hasError" :message="errorMessage" />

  <RouterView v-else />
</template>
