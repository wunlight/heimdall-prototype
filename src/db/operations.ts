import type {
  Building,
  Device,
  Event,
  Floor,
  StatusType,
} from '@/features/monitoring/types/entity.type'
import { db } from './database'

// BUILDING OPERATIONS
export const getAllBuildings = async (): Promise<Building[]> => {
  return await db.buildings.toArray()
}

export const getBuildingById = async (id: string): Promise<Building | undefined> => {
  return await db.buildings.get(id)
}

export const saveBuilding = async (building: Building): Promise<string> => {
  return await db.buildings.put(building)
}

export const bulkSaveBuildings = async (buildings: Building[]): Promise<string> => {
  return await db.buildings.bulkPut(buildings)
}
// BUILDING OPERATIONS

// FLOOR OPERATIONS
export const getFloorsByBuildingId = async (buildingId: string): Promise<Floor[]> => {
  return await db.floors.where('building_id').equals(buildingId).sortBy('level')
}

export const getFloorById = async (id: string): Promise<Floor | undefined> => {
  return await db.floors.get(id)
}

export const saveFloor = async (floor: Floor): Promise<string> => {
  return await db.floors.put(floor)
}

export const bulkSaveFloors = async (floors: Floor[]): Promise<string> => {
  return await db.floors.bulkPut(floors)
}
// FLOOR OPERATIONS

// DEVICE OPERATIONS
export const getDevicesByFloorId = async (floorId: string): Promise<Device[]> => {
  return await db.devices.where('floor_id').equals(floorId).toArray()
}

export const getDevicesByStatus = async (status: StatusType): Promise<Device[]> => {
  return await db.devices.where('status').equals(status).toArray()
}

export const updateDeviceStatus = async (deviceId: string, status: StatusType): Promise<number> => {
  return await db.devices.update(deviceId, { status })
}

export const saveDevice = async (device: Device): Promise<string> => {
  return await db.devices.put(device)
}

export const bulkSaveDevices = async (devices: Device[]): Promise<string> => {
  return await db.devices.bulkPut(devices)
}
// DEVICE OPERATIONS

// EVENT OPERATIONS
export const addEventLog = async (event: Event): Promise<string> => {
  return await db.transaction('rw', [db.events, db.devices], async () => {
    await db.devices.update(event.device_id, { status: event.type })
    return await db.events.put(event)
  })
}

export const getEventsByDeviceId = async (deviceId: string): Promise<Event[]> => {
  return await db.events.where('device_id').equals(deviceId).sortBy('created_at')
}

export const getEventsInTimeRange = async (
  startTime: string,
  endTime: string,
): Promise<Event[]> => {
  return await db.events
    .where('created_at')
    .between(startTime, endTime, true, true)
    .sortBy('created_at')
}

export const bulkSaveEvents = async (events: Event[]): Promise<string> => {
  return await db.events.bulkPut(events)
}
// EVENT OPERATIONS

// BLUEPRINT OPERATIONS
export async function getCachedBlueprintUrl(floorId: string, publicUrl: string): Promise<string> {
  try {
    const cached = await db.blueprints.get(floorId)
    if (cached) {
      return URL.createObjectURL(cached.blob)
    }

    const res = await fetch(publicUrl)
    if (!res.ok) throw new Error(`Gagal memuat blueprint dari ${publicUrl}`)

    const blob = await res.blob()

    await db.blueprints.put({
      floor_id: floorId,
      blob,
    })

    return URL.createObjectURL(blob)
  } catch (e) {
    console.warn(`Failed to cache blueprint for floor ${floorId}, fallback to public URL`, e)
    return publicUrl
  }
}

export async function saveBlueprintToCache(floorId: string, blob: Blob): Promise<void> {
  await db.blueprints.put({
    floor_id: floorId,
    blob,
  })
}

export async function removeBlueprintCache(floorId: string): Promise<void> {
  await db.blueprints.delete(floorId)
}

export async function clearAllBlueprintsCache(): Promise<void> {
  await db.blueprints.clear()
}
// BLUEPRINT OPERATIONS

export const seedDatabase = async (initialData: {
  buildings: Building[]
  floors: Floor[]
  devices: Device[]
  events: Event[]
}): Promise<void> => {
  await db.transaction('rw', [db.buildings, db.floors, db.devices, db.events], async () => {
    await db.buildings.clear()
    await db.floors.clear()
    await db.devices.clear()
    await db.events.clear()

    await db.buildings.bulkAdd(initialData.buildings)
    await db.floors.bulkAdd(initialData.floors)
    await db.devices.bulkAdd(initialData.devices)
    await db.events.bulkAdd(initialData.events)
  })
}

export const clearAllData = async (): Promise<void> => {
  await Promise.all([
    db.buildings.clear(),
    db.floors.clear(),
    db.devices.clear(),
    db.events.clear(),
  ])
}
