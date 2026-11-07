import { ref } from 'vue'
import type { Camera2DPayload, Camera3DPayload } from '../types/camera.type'
import type { CameraCommand, SpatialCommand } from '../types/spatial.type'

interface QueueItem {
  command: SpatialCommand
  status: 'PENDING' | 'EXECUTING' | 'COMPLETED' | 'CANCELLED' | 'FAILED'
  enqueueTime: number
  startTime?: number
  endTime?: number
  abortController?: AbortController
}

export function useSpatialCommandQueue() {
  const queue = ref<QueueItem[]>([])
  const currentCommand = ref<QueueItem | null>(null)
  const isProcessing = ref(false)

  function isValidCamera3DPayload(payload: Camera3DPayload): boolean {
    if (payload.target && !isValidVector3(payload.target)) {
      return false
    }

    if (payload.azimuth !== undefined && !Number.isFinite(payload.azimuth)) {
      return false
    }

    if (payload.elevation !== undefined && !Number.isFinite(payload.elevation)) {
      return false
    }

    if (
      payload.distance !== undefined &&
      (!Number.isFinite(payload.distance) || payload.distance <= 0)
    ) {
      return false
    }

    return true
  }

  function isValidCamera2DPayload(payload: Camera2DPayload): boolean {
    if (payload.center && !isValidGeoCoordinate(payload.center)) {
      return false
    }

    if (payload.zoom !== undefined && (!Number.isFinite(payload.zoom) || payload.zoom <= 0)) {
      return false
    }

    return true
  }

  function assertNever(value: never): never {
    throw new Error(`Unhandled command: ${JSON.stringify(value)}`)
  }

  function validateCommand(command: SpatialCommand): boolean {
    switch (command.type) {
      case 'CAMERA_3D':
        return isValidCamera3DPayload(command.payload)

      case 'CAMERA_2D':
        return isValidCamera2DPayload(command.payload)

      case 'SWITCH_VIEW':
        return true

      default:
        return assertNever(command)
    }
  }

  function isValidVector3(vec: any): boolean {
    return (
      vec &&
      typeof vec.x === 'number' &&
      typeof vec.y === 'number' &&
      typeof vec.z === 'number' &&
      !isNaN(vec.x) &&
      !isNaN(vec.y) &&
      !isNaN(vec.z)
    )
  }

  function isValidGeoCoordinate(coord: any): boolean {
    return (
      coord &&
      typeof coord.lat === 'number' &&
      typeof coord.lng === 'number' &&
      !isNaN(coord.lat) &&
      !isNaN(coord.lng) &&
      coord.lat >= -90 &&
      coord.lat <= 90 &&
      coord.lng >= -180 &&
      coord.lng <= 180
    )
  }

  function isSameContextAndMode(cmd1: SpatialCommand, cmd2: SpatialCommand): boolean {
    if (cmd1.type !== cmd2.type) return false

    const ctx1 = cmd1.context
    const ctx2 = cmd2.context

    if (!ctx1 && !ctx2) return true
    if (!ctx1 || !ctx2) return false

    return ctx1.buildingId === ctx2.buildingId && ctx1.floorId === ctx2.floorId
  }

  function isCoalescingBoundary(command: SpatialCommand): boolean {
    if (command.type === 'SWITCH_VIEW') return true
    if (command.type === 'CAMERA_3D' || command.type === 'CAMERA_2D') {
      const cameraCmd = command as CameraCommand
      return cameraCmd.movement === 'RELATIVE'
    }
    return false
  }

  function findLastAbsoluteSegment(): { start: number; end: number } | null {
    const pendingIndices: number[] = []
    queue.value.forEach((item, index) => {
      if (item.status === 'PENDING') {
        pendingIndices.push(index)
      }
    })

    if (pendingIndices.length === 0) {
      return null
    }

    let segmentEnd = pendingIndices[pendingIndices.length - 1]!
    let segmentStart = segmentEnd

    for (let i = pendingIndices.length - 1; i >= 0; i--) {
      const queueIndex = pendingIndices[i]!
      const item = queue.value[queueIndex]!

      if (isCoalescingBoundary(item.command)) {
        if (i < pendingIndices.length - 1) {
          segmentStart = pendingIndices[i + 1]!
          return { start: segmentStart, end: segmentEnd }
        } else {
          return null
        }
      }

      segmentStart = queueIndex
    }

    return { start: segmentStart, end: segmentEnd }
  }

  function enqueueCommand(command: SpatialCommand): boolean {
    if (!validateCommand(command)) {
      console.error('Invalid command:', command)
      return false
    }

    const queueItem: QueueItem = {
      command,
      status: 'PENDING',
      enqueueTime: Date.now(),
      abortController: new AbortController(),
    }

    if (command.type === 'CAMERA_3D' || command.type === 'CAMERA_2D') {
      const cameraCmd = command as CameraCommand

      if (cameraCmd.movement === 'ABSOLUTE') {
        if (
          currentCommand.value &&
          currentCommand.value.status === 'EXECUTING' &&
          currentCommand.value.command.type === command.type
        ) {
          const currentCameraCmd = currentCommand.value.command as CameraCommand
          if (
            currentCameraCmd.movement === 'ABSOLUTE' &&
            isSameContextAndMode(currentCommand.value.command, command)
          ) {
            console.log('Aborting current absolute animation:', currentCommand.value.command.id)
            currentCommand.value.abortController?.abort()
          }
        }

        const segment = findLastAbsoluteSegment()

        if (segment) {
          for (let i = segment.start; i <= segment.end; i++) {
            const item = queue.value[i]
            if (!item || item.status !== 'PENDING') continue

            if (item.command.type === command.type && isSameContextAndMode(item.command, command)) {
              const itemCameraCmd = item.command as CameraCommand
              if (itemCameraCmd.movement === 'ABSOLUTE') {
                console.log('Coalescing: Cancelling queued absolute command:', item.command.id)
                item.status = 'CANCELLED'
                item.endTime = Date.now()
                item.abortController?.abort()
              }
            }
          }

          queue.value = queue.value.filter((item) => item.status !== 'CANCELLED')
        }
      }
    }

    queue.value.push(queueItem)
    console.log('Command enqueued:', command.id, command.type, command)

    if (!isProcessing.value) {
      processQueue()
    }

    return true
  }

  async function processQueue() {
    if (isProcessing.value) return
    if (queue.value.length === 0) return

    isProcessing.value = true

    try {
      while (queue.value.length > 0) {
        const item = queue.value.find((i) => i.status === 'PENDING')
        if (!item) break

        item.status = 'EXECUTING'
        item.startTime = Date.now()
        currentCommand.value = item

        console.log('Executing command:', item.command.id, item.command.type)

        try {
          await executeCommand(item.command, item.abortController!.signal)

          if (item.abortController!.signal.aborted) {
            console.log('Command was cancelled during execution:', item.command.id)
            item.status = 'CANCELLED'
          } else {
            item.status = 'COMPLETED'
          }
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            console.log('Command aborted:', item.command.id)
            item.status = 'CANCELLED'
          } else {
            console.error('Command execution failed:', error)
            item.status = 'FAILED'
          }
        } finally {
          item.endTime = Date.now()
          currentCommand.value = null

          queue.value = queue.value.filter((i) => i.command.id !== item.command.id)
        }
      }
    } finally {
      isProcessing.value = false
    }
  }

  let commandExecutor: ((command: SpatialCommand, signal: AbortSignal) => Promise<void>) | null =
    null

  function setCommandExecutor(
    executor: (command: SpatialCommand, signal: AbortSignal) => Promise<void>,
  ) {
    commandExecutor = executor
  }

  async function executeCommand(command: SpatialCommand, signal: AbortSignal): Promise<void> {
    if (!commandExecutor) {
      console.error('No command executor registered')
      throw new Error('No command executor registered')
    }
    await commandExecutor(command, signal)
  }

  function clearQueue() {
    if (currentCommand.value && currentCommand.value.status === 'EXECUTING') {
      currentCommand.value.abortController?.abort()
    }

    queue.value.forEach((item) => {
      if (item.status === 'PENDING') {
        item.status = 'CANCELLED'
        item.endTime = Date.now()
        item.abortController?.abort()
      }
    })

    queue.value = queue.value.filter((item) => item.status === 'EXECUTING')
  }

  function getQueueState() {
    return {
      queueLength: queue.value.length,
      currentCommand: currentCommand.value?.command,
      currentStatus: currentCommand.value?.status,
      pendingCommands: queue.value.filter((i) => i.status === 'PENDING').map((i) => i.command),
      isProcessing: isProcessing.value,
    }
  }

  return {
    enqueueCommand,
    clearQueue,
    getQueueState,
    setCommandExecutor,
    queue,
    currentCommand,
    isProcessing,
  }
}
