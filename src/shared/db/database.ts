import { Dexie, type Table } from 'dexie'
import type { Building, Device, DeviceEvent, Floor } from '../types/entity.type'

export class HeimdallDB extends Dexie {
  buildings!: Table<Building, string>
  floors!: Table<Floor, string>
  devices!: Table<Device, string>
  events!: Table<DeviceEvent, string>

  constructor() {
    super('HeimdallDB')

    this.version(2).stores({
      buildings: 'id',
      floors: 'id, building_id',
      devices: 'id, floor_id',
      events: 'id, [created_at+seq], [device_id+created_at]',
    })
  }
}

export const db = new HeimdallDB()
