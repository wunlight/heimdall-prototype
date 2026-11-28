export type StatusType = 'normal' | 'offline' | 'warning' | 'alarm'

export interface Building {
  id: string
  name: string
}

export interface Floor {
  id: string
  building_id: string
  name: string
  level: number
  blueprint_url: string
  blueprint_height: number
  blueprint_width: number
}

export interface Device {
  id: string
  floor_id: string
  type: string
  x: number
  y: number
}

export interface DeviceEvent {
  id: string
  device_id: string
  type: StatusType
  created_at: number
  seq: number
}
