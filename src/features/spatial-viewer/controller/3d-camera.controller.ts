import type { Camera3DCommand } from '../types/spatial.type'

export interface Camera3DAdapter {
  getState(): {
    azimuth: number
    elevation: number
    distance: number
    target: { x: number; y: number; z: number }
  }

  animateTo(
    target: {
      azimuth: number
      elevation: number
      distance: number
      target: { x: number; y: number; z: number }
    },
    duration: number,
    signal: AbortSignal,
  ): Promise<void>
}

export class Camera3DController {
  constructor(private readonly adapter: Camera3DAdapter) {}

  async execute(command: Camera3DCommand, signal: AbortSignal): Promise<void> {
    const current = this.adapter.getState()
    const payload = command.payload

    const destination = {
      azimuth:
        command.movement === 'ABSOLUTE'
          ? (payload.azimuth ?? current.azimuth)
          : current.azimuth + (payload.azimuth ?? 0),

      elevation:
        command.movement === 'ABSOLUTE'
          ? (payload.elevation ?? current.elevation)
          : current.elevation + (payload.elevation ?? 0),

      distance:
        command.movement === 'ABSOLUTE'
          ? (payload.distance ?? current.distance)
          : current.distance + (payload.distance ?? 0),

      target: payload.target
        ? command.movement === 'ABSOLUTE'
          ? payload.target
          : {
              x: current.target.x + payload.target.x,
              y: current.target.y + payload.target.y,
              z: current.target.z + payload.target.z,
            }
        : current.target,
    }

    await this.adapter.animateTo(destination, 1000, signal)
  }
}
