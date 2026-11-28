export function resolveDeviceColor(status?: string): string {
  switch (status) {
    case 'ALARM':
      return '#EF4444'
    case 'TROUBLE':
      return '#EAB308'
    case 'NORMAL':
    default:
      return '#2B7FFF'
  }
}

export function resolveFloorColor(status?: string): string {
  switch (status) {
    case 'ALARM':
      return '#EF4444'
    case 'TROUBLE':
      return '#EAB308'
    case 'NORMAL':
    default:
      return '#62748E'
  }
}
