<script setup lang="ts">
import { useColorStore } from '@/features/spatial-stage/stores/color.store'
import type { Device, Floor } from '@/shared/types/entity.type'
import { nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import { useFloorCamera } from '../composables/use-camera'
import { useFloorRenderer } from '../composables/use-renderer'
import { useFloorScene } from '../composables/use-scene'

const props = defineProps<{
  floor: Floor | null
  devices: Device[]
}>()

const emit = defineEmits<{
  'camera-ready': [camera: ReturnType<typeof useFloorCamera>]
  'camera-disposed': []
  'scene-ready': [floorId: string]
}>()

const colorStore = useColorStore()

const canvasRef = useTemplateRef<HTMLDivElement>('canvas')
const isReady = ref(false)
const isRendering = ref(false)

let renderer: ReturnType<typeof useFloorRenderer> | null = null
let camera: ReturnType<typeof useFloorCamera> | null = null

const scenes = useFloorScene()

const waitUntilSceneReady = (floorId: string) =>
  new Promise<void>((resolve) => {
    const timer = setInterval(() => {
      if (scenes.isFloorLoading(floorId)) return
      clearInterval(timer)
      resolve()
    }, 150)
  })

const attachFloor = (floor: Floor) => {
  renderer?.attachScene(
    scenes.getOrCreateFloorScene(floor.id).layerGroup,
    scenes.solveFloorBounds(floor),
  )
}

const showFloor = async (floor: Floor) => {
  if (!renderer || isRendering.value) return

  isRendering.value = true
  try {
    if (scenes.isFloorLoading(floor.id)) {
      await waitUntilSceneReady(floor.id)
    } else if (!scenes.hasFloorScene(floor.id)) {
      await scenes.renderFloorScene(floor, props.devices, colorStore.deviceColor)
    }
    attachFloor(floor)
    emit('scene-ready', floor.id)
  } finally {
    isRendering.value = false
  }
}

const initialize = () => {
  if (!canvasRef.value) {
    console.warn('Floor canvas not available')
    return
  }
  renderer = useFloorRenderer(canvasRef.value)
  if (!renderer) return

  camera = useFloorCamera(renderer.map)
  emit('camera-ready', camera)
  isReady.value = true
}

onMounted(async () => {
  await nextTick()
  initialize()
  if (props.floor) void showFloor(props.floor)
})

onBeforeUnmount(() => {
  emit('camera-disposed')
  camera?.dispose()
  camera = null
  renderer?.dispose()
  renderer = null
  isReady.value = false
})

watch(
  () => props.floor,
  (newFloor) => {
    if (!isReady.value) return
    renderer?.detachScene()
    if (newFloor) void showFloor(newFloor)
  },
)
</script>

<template>
  <div ref="canvas" class="size-full bg-transparent! pointer-events-auto" />
</template>
