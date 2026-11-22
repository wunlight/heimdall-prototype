import { reactive, toRefs } from 'vue'
import type { AppTask } from '../types/app-task.type'

interface State {
  loading: boolean
  progress: number
  progressMessage: string
  error: boolean
  errorMessage: string
}

export function useAppTask() {
  const state = reactive<State>({
    loading: false,
    progress: 0,
    progressMessage: '',
    error: false,
    errorMessage: '',
  })

  const initialize = async (tasks: AppTask[]) => {
    const total = tasks.reduce((sum, t) => sum + (t.weight ?? 1), 0)
    let done = 0

    state.loading = true
    state.error = false
    state.errorMessage = ''
    state.progress = 0

    try {
      for (const task of tasks) {
        state.progressMessage = task.name
        await task.action((msg) => {
          state.progressMessage = msg
        })
        done += task.weight ?? 1
        state.progress = Math.round((done / total) * 100)
      }
    } catch (e) {
      state.error = true
      state.errorMessage = e instanceof Error ? e.message : String(e)
    } finally {
      state.loading = false
    }
  }

  return {
    ...toRefs(state),
    initialize,
  }
}
