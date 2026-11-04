import type { STATUS_TYPES } from '../constants/status-type'

export type StatusType = (typeof STATUS_TYPES)[number]

export interface Building {
  id: string
  name: string
  lat: number
  lng: number
}

export interface Floor {
  id: string
  building_id: string
  name: string
  level: number
  blueprint_url: string
}

export interface Device {
  id: string
  floor_id: string
  type: string
  status: StatusType
  x: number
  y: number
}

export interface Event {
  id: string
  device_id: string
  type: StatusType
  created_at: string
}

export interface BlueprintCache {
  floor_id: string
  blob: Blob
}
