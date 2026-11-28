import type { StatusType } from './entity.type'

export type StatusCounts = Record<StatusType, number>

export interface StatusAggregate {
  counts: StatusCounts
}

export const PRIORITY: Record<StatusType, number> = { normal: 0, offline: 1, warning: 2, alarm: 3 }
