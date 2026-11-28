import { ref } from 'vue'
import type { SpatialCommand, SpatialIntent } from '../types/command.type'

type Runner = (cmd: SpatialCommand) => Promise<void>

export function useSpatialQueue(run: Runner) {
  const generation = ref(0)
  const disposed = ref(false)
  const pending: SpatialCommand[] = []
  let draining = false

  const isStale = (cmd: SpatialCommand) => cmd.generation !== generation.value

  const drain = async () => {
    if (draining) return
    draining = true

    try {
      while (pending.length) {
        const next = pending.shift()
        if (next) {
          if (isStale(next)) continue
          await run(next).catch((e) => console.warn('Spatial command failed: ', e))
        }
      }
    } finally {
      draining = false
    }
  }

  const invalidate = () => {
    generation.value++
    for (let i = pending.length - 1; i >= 0; i--) {
      if (pending[i]?.kind === 'MOVE_CAMERA') pending.splice(i, 1)
    }
  }

  const dispatch = (intent: SpatialIntent) => {
    if (disposed.value) return
    if (intent.kind !== 'MOVE_CAMERA') invalidate()
    pending.push({ ...intent, generation: generation.value })
    void drain()
  }

  const clear = () => {
    disposed.value = true
    generation.value++
    pending.length = 0
  }

  return {
    generation,
    isStale,
    dispatch,
    clear,
  }
}
