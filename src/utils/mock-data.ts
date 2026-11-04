import type {
  Building,
  Device,
  Event,
  Floor,
  StatusType,
} from '@/features/monitoring/types/entity.type'

export function generateMockData(numBuildings = 2, floorsPerBuilding = 3, devicesPerFloor = 4) {
  const buildings: Building[] = []
  const floors: Floor[] = []
  const devices: Device[] = []
  const events: Event[] = []

  const baseLat = -6.2088
  const baseLng = 106.8456
  const deviceTypes = ['SMOKE_DETECTOR', 'HEAT_DETECTOR', 'MANUAL_CALL_POINT', 'GAS_DETECTOR']

  for (let b = 1; b <= numBuildings; b++) {
    const bId = `bldg-${b}`
    buildings.push({
      id: bId,
      name: `Gedung Utama ${String.fromCharCode(64 + b)}`,
      lat: Number((baseLat + b * 0.002).toFixed(6)),
      lng: Number((baseLng + b * 0.002).toFixed(6)),
    })

    for (let f = 1; f <= floorsPerBuilding; f++) {
      const fId = `flr-${b}-${f}`
      floors.push({
        id: fId,
        building_id: bId,
        name: `Lantai ${f}`,
        level: f - 1,
        blueprint_url: `bldg_${b}_flr_${f}.webp`,
      })

      for (let d = 1; d <= devicesPerFloor; d++) {
        const dId = `dev-${b}-${f}-${d}`
        const statuses: StatusType[] = ['NORMAL', 'NORMAL', 'NORMAL', 'TROUBLE', 'ALARM']
        const initialStatus = statuses[Math.floor(Math.random() * statuses.length)]

        const xPos = Number((0.2 + (d % 2) * 0.5).toFixed(2))
        const yPos = Number((0.2 + Math.floor((d - 1) / 2) * 0.5).toFixed(2))

        devices.push({
          id: dId,
          floor_id: fId,
          type: deviceTypes[Math.floor(Math.random() * deviceTypes.length)]!,
          status: initialStatus!,
          x: xPos,
          y: yPos,
        })

        const now = Date.now()
        for (let e = 1; e <= 3; e++) {
          const timestamp = new Date(now - (3 - e) * 600000).toISOString()
          events.push({
            id: `evt-${dId}-${e}`,
            device_id: dId,
            type: statuses[Math.floor(Math.random() * statuses.length)]!,
            created_at: timestamp,
          })
        }
      }
    }
  }

  return { buildings, floors, devices, events }
}
