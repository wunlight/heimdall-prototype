import { defineStore } from 'pinia'
import type { Building, Device, Floor } from '../types/entity.type'

interface State {
  buildings: Record<string, Building>
  floors: Record<string, Floor>
  devices: Record<string, Device>
}

export const useEntityStore = defineStore('entity', {
  state: (): State => ({
    buildings: {},
    floors: {},
    devices: {},
  }),

  actions: {
    async hydrate(bData: Building[], fData: Floor[], dData: Device[]) {
      this.buildings = toMap(bData)
      this.floors = toMap(fData)
      this.devices = toMap(dData)
    },
  },
})

const toMap = <T extends { id: string }>(list: T[]) =>
  Object.fromEntries(list.map((x) => [x.id, x])) as Record<string, T>
