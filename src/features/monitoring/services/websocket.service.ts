import type { Device, Event, StatusType } from '@/features/monitoring/types/entity.type'

type Listener = (data: Event) => void

export class MockWebSocket {
  private listeners: Map<string, Listener[]> = new Map()
  private timer: number | null = null
  private scenarioQueue: Event[] = []
  private scenarioIndex: number = 0

  on(event: string, fn: Listener) {
    if (!this.listeners.has(event)) this.listeners.set(event, [])
    this.listeners.get(event)!.push(fn)
  }

  emit(event: string, data: Event) {
    this.listeners.get(event)?.forEach((fn) => fn(data))
  }

  loadScenario(events: Event[]) {
    this.scenarioQueue = [...events]
    this.scenarioIndex = 0
  }

  /**
   * Memulai simulasi.
   * @param mode 'scenario' untuk menjalankan urutan yang telah disusun, 'random' untuk acak.
   * @param devices Daftar perangkat (dibutuhkan jika mode 'random').
   * @param intervalMs Jeda waktu antar event dalam milidetik.
   */
  startSimulation(
    mode: 'scenario' | 'random' = 'random',
    devices: Device[] = [],
    intervalMs: number = 5000,
  ) {
    this.stopSimulation()

    this.timer = window.setInterval(() => {
      let payload: Event | null = null

      if (mode === 'scenario' && this.scenarioQueue.length > 0) {
        if (this.scenarioIndex < this.scenarioQueue.length) {
          payload = this.scenarioQueue[this.scenarioIndex] ?? null
          this.scenarioIndex++
        } else {
          this.scenarioIndex = 0
          payload = this.scenarioQueue[this.scenarioIndex] ?? null
          this.scenarioIndex++
        }
      } else if (mode === 'random' && devices.length > 0) {
        const randomDevice = devices[Math.floor(Math.random() * devices.length)]
        const statuses: StatusType[] = ['NORMAL', 'TROUBLE', 'ALARM']
        const nextStatus = statuses[Math.floor(Math.random() * statuses.length)]!

        payload = {
          id: `evt-${Date.now()}`,
          device_id: randomDevice!.id,
          type: nextStatus,
          created_at: new Date().toISOString(),
        }
      }

      if (payload) {
        this.emit('message', payload)
      }
    }, intervalMs)
  }

  stopSimulation() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }
}

export const mockWS = new MockWebSocket()
