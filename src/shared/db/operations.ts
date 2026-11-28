import Dexie from 'dexie'
import type { Building, Device, DeviceEvent, Floor } from '../types/entity.type'
import { db } from './database'

export const buildingOps = {
  getAll: () => db.buildings.toArray(),
  get: (id: string) => db.buildings.get(id),
  upsert: (item: Building) => db.buildings.put(item),
  bulkUpsert: (items: Building[]) => db.buildings.bulkPut(items),
  update: (id: string, changes: Partial<Omit<Building, 'id'>>) => db.buildings.update(id, changes),
  remove: (id: string) => db.buildings.delete(id),
  clear: () => db.buildings.clear(),
}

export const floorOps = {
  getAll: () => db.floors.toArray(),
  get: (id: string) => db.floors.get(id),
  getByBuilding: (buildingId: string) =>
    db.floors.where('building_id').equals(buildingId).toArray(),
  upsert: (item: Floor) => db.floors.put(item),
  bulkUpsert: (items: Floor[]) => db.floors.bulkPut(items),
  update: (id: string, changes: Partial<Omit<Floor, 'id'>>) => db.floors.update(id, changes),
  remove: (id: string) => db.floors.delete(id),
  removeByBuilding: (buildingId: string) =>
    db.floors.where('building_id').equals(buildingId).delete(),
  clear: () => db.floors.clear(),
}

export const deviceOps = {
  getAll: () => db.devices.toArray(),
  get: (id: string) => db.devices.get(id),
  getByFloor: (floorId: string) => db.devices.where('floor_id').equals(floorId).toArray(),
  upsert: (item: Device) => db.devices.put(item),
  bulkUpsert: (items: Device[]) => db.devices.bulkPut(items),
  update: (id: string, changes: Partial<Omit<Device, 'id'>>) => db.devices.update(id, changes),
  remove: (id: string) => db.devices.delete(id),
  removeByFloor: (floorId: string) => db.devices.where('floor_id').equals(floorId).delete(),
  clear: () => db.devices.clear(),
}

export const eventOps = {
  getAll: () => db.events.orderBy('[created_at+seq]').toArray(),
  get: (id: string) => db.events.get(id),
  getByDevice: (deviceId: string) =>
    db.events
      .where('[device_id+created_at]')
      .between([deviceId, Dexie.minKey], [deviceId, Dexie.maxKey])
      .toArray(),
  getInRange: (from: number, to: number) =>
    db.events
      .where('[created_at+seq]')
      .between([from, Dexie.minKey], [to, Dexie.maxKey], true, true)
      .toArray(),
  upsert: (item: DeviceEvent) => db.events.put(item),
  bulkUpsert: (items: DeviceEvent[]) => db.events.bulkPut(items),
  update: (id: string, changes: Partial<Omit<DeviceEvent, 'id'>>) => db.events.update(id, changes),
  remove: (id: string) => db.events.delete(id),
  removeByDevice: (deviceId: string) =>
    db.events
      .where('[device_id+created_at]')
      .between([deviceId, Dexie.minKey], [deviceId, Dexie.maxKey])
      .delete(),
  clear: () => db.events.clear(),
}
