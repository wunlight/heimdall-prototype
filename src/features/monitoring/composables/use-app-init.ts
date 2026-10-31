import { ref } from 'vue'
import type { LoadingTask } from '../types/task.type'

export function useAppInit(loadTasks: LoadingTask[]) {
  const isLoading = ref(false)
  const isError = ref(false)
  const initProgress = ref(0)
  const initProgressMsg = ref('Initializing system')
  const initErrorMsg = ref('')

  const handleAppInitialization = async () => {
    isLoading.value = true
    const totalTasks = loadTasks.length

    try {
      for (let i = 0; i < totalTasks; i++) {
        const task = loadTasks[i]

        initProgress.value = Math.round((i / totalTasks) * 100)

        await task!.action((msg) => {
          initProgressMsg.value = msg
        })
      }

      initProgress.value = 100
      initProgressMsg.value = 'Setup completed!'
      await new Promise((resolve) => setTimeout(resolve, 500))
    } catch (e) {
      isError.value = true
      console.error('Initialization failed: ', e)
      initErrorMsg.value = 'System initialization failed. Please refresh.'
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading,
    isError,
    initProgress,
    initProgressMsg,
    initErrorMsg,
    handleAppInitialization,
  }
}
