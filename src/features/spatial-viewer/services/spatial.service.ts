import { getFloorsByBuildingId } from '@/db/operations'

export const loadFloorsByBuildingId = async (id: string) => {
  return await getFloorsByBuildingId(id)
}
