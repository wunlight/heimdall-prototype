import type { Building, Device, Event, Floor } from '@/features/monitoring/types/entity.type'
import { Dexie, type Table } from 'dexie'

export class HeimdallDB extends Dexie {
  buildings!: Table<Building, string>
  floors!: Table<Floor, string>
  devices!: Table<Device, string>
  events!: Table<Event, string>

  constructor() {
    super('HeimdallDB')

    this.version(1).stores({
      buildings: 'id, name',
      floors: 'id, building_id, level',
      devices: 'id, floor_id, status, type',
      events: 'id, device_id, type, created_at',
    })
  }
}

export const db = new HeimdallDB()
