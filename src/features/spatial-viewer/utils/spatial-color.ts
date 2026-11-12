import type { StatusType } from '@/shared/types/entity.type'

const SPATIAL_STATUS_COLORS: Record<StatusType, string> = {
  NORMAL: '#62748E',
  TROUBLE: '#EAB308',
  ALARM: '#EF4444',
}

export function resolveSpatialColor(status?: string | null): string {
  if (!status || !(status in SPATIAL_STATUS_COLORS)) {
    return SPATIAL_STATUS_COLORS.NORMAL!
  }
  return SPATIAL_STATUS_COLORS[status as StatusType]!
}
