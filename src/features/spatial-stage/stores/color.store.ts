import { defineStore } from 'pinia'

export const useColorStore = defineStore('spatial-color', {
  state: () => ({
    colors: {} as Record<string, string>,
  }),

  getters: {
    deviceColor: (state) => (deviceId: string) => state.colors[deviceId],
  },

  actions: {
    setDeviceColor(deviceId: string, color: string) {
      this.colors[deviceId] = color
    },

    setManyDeviceColors(entries: Record<string, string>) {
      Object.assign(this.colors, entries)
    },

    reset() {
      this.colors = {}
    },
  },
})
