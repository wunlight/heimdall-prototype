import { db } from '@/db/database'
import { addEventLog } from '@/db/operations'
import type { Event } from '../types/entity.type'
import type { SimulationEventItem } from '../types/event.type'

type EventListener = (data: Event) => void

class MockWebSocketService {
  private listeners: EventListener[] = []
  private timer: number | null = null
  private maxStoredEvents: number = 50
  private isSimulating: boolean = false

  public onMessage(cb: EventListener): () => void {
    this.listeners.push(cb)
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== cb)
    }
  }

  private emit(event: Event): void {
    this.listeners.forEach((cb) => cb(event))
  }

  public async startSimulation(simulationItems: SimulationEventItem[]): Promise<void> {
    console.log([...simulationItems])
    if (this.isSimulating) return
    this.isSimulating = true

    try {
      for (const item of simulationItems) {
        console.log(item)
        if (!item.deviceId) continue

        const delayMs = Number(item.delay) || 0
        if (delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs))
        }

        const newEvent: Event = {
          id: item.eventId || `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          device_id: item.deviceId,
          type: item.targetStatus,
          created_at: new Date().toISOString(),
        }

        await addEventLog(newEvent)
        await this.trimEventsLimit()

        this.emit(newEvent)
      }
    } catch (e) {
      console.error('Failed to run simulation:', e)
    } finally {
      this.isSimulating = false
    }
  }

  public stopSimulation(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  private async trimEventsLimit(): Promise<void> {
    const count = await db.events.count()
    if (count > this.maxStoredEvents) {
      const allEvents = await db.events.orderBy('created_at').toArray()

      const excessCount = allEvents.length - this.maxStoredEvents
      if (excessCount > 0) {
        const idsToRemove = allEvents.slice(0, excessCount).map((e) => e.id)
        await db.events.bulkDelete(idsToRemove)
      }
    }
  }
}

export const mockWS = new MockWebSocketService()
