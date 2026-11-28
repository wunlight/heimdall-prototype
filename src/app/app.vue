<script setup lang="ts">
import { onMounted } from 'vue'
import AppError from './app-error.vue'
import AppLoading from './app-loading.vue'
import { useAppTask } from './task/composables/use-app-task.ts'
import { INITIAL_TASKS } from './task/constants/task.ts'

const { loading, progress, progressMessage, error, errorMessage, initialize } = useAppTask()

onMounted(() => initialize(INITIAL_TASKS))
</script>

<template>
  <AppLoading v-if="loading" :progress="progress" :message="progressMessage" />
  <AppError v-else-if="error" :message="errorMessage" />
  <RouterView v-else />
</template>
