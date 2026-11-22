import { PRIORITY, type StatusAggregate, type StatusCounts } from '../types/entity-state.type'
import type { StatusType } from '../types/entity.type'

export const createAggregate = (): StatusAggregate => ({
  counts: { normal: 0, offline: 0, warning: 0, alarm: 0 },
})

export const worstStatus = (counts: StatusCounts): StatusType =>
  (Object.keys(PRIORITY) as StatusType[])
    .filter((s) => counts[s] > 0)
    .reduce((a, b) => (PRIORITY[b] > PRIORITY[a] ? b : a), 'normal' as StatusType)

export function applyTransition(
  agg: StatusAggregate,
  from: StatusType | undefined,
  to: StatusType,
) {
  if (from) agg.counts[from]--
  agg.counts[to]++
}
