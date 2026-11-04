import type { StatusType } from '@/features/monitoring/types/entity.type'

export interface SimulationEventItem {
  id: string
  deviceId: string | null
  eventId: string | null
  targetStatus: StatusType
}
