import { db } from '@/db/database'
import { addEventLog } from '@/db/operations'
import type { Event } from '../../../shared/types/entity.type'
import type { SimulationEventItem } from '../types/event.type'

type EventListener = (data: Event) => void

class MockWebSocketService {
  private listeners = new Set<EventListener>()
  private maxStoredEvents = 50
  private abortController: AbortController | null = null

  public onMessage(listener: EventListener): () => void {
    this.listeners.add(listener)

    return () => {
      this.listeners.delete(listener)
    }
  }

  private emit(event: Event): void {
    this.listeners.forEach((listener) => listener(event))
  }

  public async startSimulation(simulationItems: SimulationEventItem[]): Promise<void> {
    if (this.abortController) return

    const controller = new AbortController()
    this.abortController = controller

    try {
      for (const item of simulationItems) {
        if (controller.signal.aborted) break
        if (!item.deviceId) continue

        const delayMs = Number(item.delay) || 0

        if (delayMs > 0) {
          await new Promise<void>((resolve) => {
            const timeout = setTimeout(resolve, delayMs)

            controller.signal.addEventListener(
              'abort',
              () => {
                clearTimeout(timeout)
                resolve()
              },
              { once: true },
            )
          })
        }

        if (controller.signal.aborted) break

        const newEvent: Event = {
          id: item.eventId || `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          device_id: item.deviceId,
          type: item.targetStatus,
          created_at: new Date().toISOString(),
        }

        await addEventLog(newEvent)
        await this.trimEventsLimit()

        if (controller.signal.aborted) break

        this.emit(newEvent)
      }
    } catch (error) {
      console.error('Failed to run simulation:', error)
    } finally {
      if (this.abortController === controller) {
        this.abortController = null
      }
    }
  }

  public stopSimulation(): void {
    this.abortController?.abort()
    this.abortController = null
  }

  private async trimEventsLimit(): Promise<void> {
    const count = await db.events.count()

    if (count <= this.maxStoredEvents) return

    const allEvents = await db.events.orderBy('created_at').toArray()
    const excessCount = allEvents.length - this.maxStoredEvents

    if (excessCount > 0) {
      const idsToRemove = allEvents.slice(0, excessCount).map((event) => event.id)

      await db.events.bulkDelete(idsToRemove)
    }
  }
}

export const mockWS = new MockWebSocketService()
