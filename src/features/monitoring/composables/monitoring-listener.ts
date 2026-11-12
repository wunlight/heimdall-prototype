import type { Event } from '@/shared/types/entity.type'
import { onMounted, onUnmounted } from 'vue'
import { mockWS } from '../services/mock-ws.service'

export function useMonitoringListener(processEvent: (event: Event) => Promise<void>) {
  let unsubscribe: (() => void) | undefined

  onMounted(() => {
    unsubscribe = mockWS.onMessage((event) => {
      void processEvent(event).catch((error) => {
        console.error('Failed to process monitoring event:', error)
      })
    })
  })

  onUnmounted(() => {
    unsubscribe?.()
  })
}
