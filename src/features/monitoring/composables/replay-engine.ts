import type { Event } from '@/features/monitoring/types/entity.type'
import { ref } from 'vue'

export function useReplayEngine(
  eventLogs: Event[],
  onTick: (activeEvents: Map<string, Event>) => void,
) {
  const isPlaying = ref(false)
  const playbackSpeed = ref(1)
  const currentTime = ref<number>(0)
  let animationFrameId: number | null = null

  const startReplay = (startTime: number, endTime: number) => {
    isPlaying.value = true
    currentTime.value = startTime
    let lastTimestamp = performance.now()

    const loop = (now: number) => {
      if (!isPlaying.value) return

      const delta = (now - lastTimestamp) * playbackSpeed.value
      lastTimestamp = now
      currentTime.value += delta

      if (currentTime.value >= endTime) {
        currentTime.value = endTime
        isPlaying.value = false
        return
      }

      const currentSnapshots = new Map<string, Event>()
      eventLogs
        .filter((e) => new Date(e.created_at).getTime() <= currentTime.value)
        .forEach((e) => currentSnapshots.set(e.device_id, e))

      onTick(currentSnapshots)
      animationFrameId = requestAnimationFrame(loop)
    }

    animationFrameId = requestAnimationFrame(loop)
  }

  const pauseReplay = () => {
    isPlaying.value = false
    if (animationFrameId) cancelAnimationFrame(animationFrameId)
  }

  return { isPlaying, currentTime, startReplay, pauseReplay, playbackSpeed }
}
