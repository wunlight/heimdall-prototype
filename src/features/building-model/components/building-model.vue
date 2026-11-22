<script setup lang="ts">
import type { Device, Floor } from '@/shared/types/entity.type'
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import { useBuildingCamera } from '../composables/use-camera'
import { useBuildingRenderer } from '../composables/use-renderer'
import { useBuildingScene } from '../composables/use-scene'

const props = defineProps<{
  buildingId: string | null
  floors: Floor[]
  devices: Device[]
}>()

const emit = defineEmits<{
  'camera-ready': [camera: ReturnType<typeof useBuildingCamera>]
  'camera-disposed': []
}>()

const canvasRef = useTemplateRef<HTMLDivElement>('canvas')
const isRendering = ref(false)

let renderer: ReturnType<typeof useBuildingRenderer> | null = null
let camera: ReturnType<typeof useBuildingCamera> | null = null

const scenes = useBuildingScene()

const devicesByFloor = computed(() => {
  const map = new Map<string, Device[]>()
  for (const device of props.devices) {
    const list = map.get(device.floor_id) ?? []
    list.push(device)
    map.set(device.floor_id, list)
  }
  return map
})

const waitUntilSceneReady = (buildingId: string) =>
  new Promise<void>((resolve) => {
    const timer = setInterval(() => {
      if (scenes.isBuildingLoading(buildingId)) return
      clearInterval(timer)
      resolve()
    }, 150)
  })

const attachBuilding = (buildingId: string) => {
  renderer?.attachScene(scenes.getOrCreateBuildingScene(buildingId).scene)
}

const showBuilding = async (buildingId: string, floors: Floor[]) => {
  if (!renderer || floors.length === 0 || isRendering.value) return

  isRendering.value = true
  try {
    if (scenes.isBuildingLoading(buildingId)) {
      await waitUntilSceneReady(buildingId)
    } else if (!scenes.hasBuildingScene(buildingId)) {
      await scenes.renderBuildingScene(buildingId, floors, devicesByFloor.value)
    }
    attachBuilding(buildingId)
  } finally {
    isRendering.value = false
  }
}

onMounted(() => {
  if (!canvasRef.value) {
    console.warn('Scene canvas not available')
    return
  }
  renderer = useBuildingRenderer(canvasRef.value)
  if (!renderer) return

  camera = useBuildingCamera(renderer.camera, renderer.controls)
  emit('camera-ready', camera)
})

onBeforeUnmount(() => {
  emit('camera-disposed')
  camera?.dispose()
  camera = null
})

watch(
  () => props.buildingId,
  (buildingId) => {
    renderer?.detachScene()
    if (buildingId) void showBuilding(buildingId, props.floors)
  },
)

watch(
  () => props.floors,
  (floors) => {
    if (props.buildingId && floors.length > 0 && !scenes.hasBuildingScene(props.buildingId)) {
      void showBuilding(props.buildingId, floors)
    }
  },
)
</script>

<template>
  <div ref="canvas" class="size-full pointer-events-auto" />
</template>
