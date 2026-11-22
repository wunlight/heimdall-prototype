import type { Building, Device, Floor } from '../types/entity.type'

const WORLDS = [
  'Asgard',
  'Midgard',
  'Vanaheim',
  'Alfheim',
  'Jotunheim',
  'Svartalfheim',
  'Niflheim',
] as const

const DIMENSION = 256

const DEVICE_TYPES = [
  'SMOKE DETECTOR',
  'HEAT DETECTOR',
  'MANUAL CALL POINT',
  'GAS DETECTOR',
] as const

type DeviceType = (typeof DEVICE_TYPES)[number]

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const randDecimal = () => Number(Math.random().toFixed(4))
const randType = (): DeviceType => DEVICE_TYPES[randInt(0, DEVICE_TYPES.length - 1)]!

export function generateMockData() {
  const buildings: Building[] = []
  const floors: Floor[] = []
  const devices: Device[] = []

  WORLDS.forEach((world, bi) => {
    const bIdx = bi + 1
    const buildingId = `bldg_${bIdx}`
    buildings.push({ id: buildingId, name: world })

    const floorCount = randInt(1, 4)
    for (let f = 1; f <= floorCount; f++) {
      const floorId = `${buildingId}_flr_${f}`
      floors.push({
        id: floorId,
        building_id: buildingId,
        name: `Floor ${f}`,
        level: f,
        blueprint_url: `/blueprints/bldg_${bIdx}_flr_${f}.webp`,
        blueprint_width: DIMENSION,
        blueprint_height: DIMENSION,
      })

      const deviceCount = randInt(3, 12)
      for (let d = 1; d <= deviceCount; d++) {
        devices.push({
          id: `${floorId}_dev_${d}`,
          floor_id: floorId,
          type: randType(),
          x: randDecimal(),
          y: randDecimal(),
        })
      }
    }
  })

  return { buildings, floors, devices }
}
