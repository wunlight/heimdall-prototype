import { ref } from 'vue'
import type { AppTask } from '../types/task.type'

export function useAppSetup(tasks: AppTask[]) {
  const isLoading = ref<boolean>(false)
  const hasError = ref<boolean>(false)
  const progress = ref<number>(0)
  const progressMessage = ref<string>('Initializing system')
  const errorMessage = ref<string>('')

  const initialize = async () => {
    isLoading.value = true
    const totalTasks = tasks.length

    try {
      for (let i = 0; i < totalTasks; i++) {
        const task = tasks[i]

        progress.value = Math.round((i / totalTasks) * 100)

        await task!.action((msg) => {
          progressMessage.value = msg
        })
      }

      progress.value = 100
      progressMessage.value = 'Setup completed!'
      await new Promise((resolve) => setTimeout(resolve, 500))
    } catch (e) {
      hasError.value = true
      console.error('Initialization failed: ', e)
      errorMessage.value = 'System initialization failed. Please refresh.'
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading,
    hasError,
    progress,
    progressMessage,
    errorMessage,
    initialize,
  }
}
