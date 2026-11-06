import type { StatusType } from '@/shared/types/entity.type'

export interface SimulationEventItem {
  id: string
  deviceId: string | null
  eventId: string | null
  targetStatus: StatusType
  delay: number
}
