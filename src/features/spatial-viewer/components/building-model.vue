<script setup lang="ts">
import type { Device, Floor } from '@/shared/types/entity.type'
import { onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import { useBuildingRenderer } from '../composables/building/renderer'
import { useBuildingScene } from '../composables/building/scene'
import { useCamera3DController } from '../composables/camera-control/3d-camera-controller'

type Props = {
  buildingId: string
  floors: Floor[]
  devicesByFloor: Map<string, Device[]>
}
const props = defineProps<Props>()

type Emit = {
  (event: 'controller-ready', controller: ReturnType<typeof useCamera3DController>): void
  (event: 'controller-disposed'): void
}
const emit = defineEmits<Emit>()

let camera3DController: ReturnType<typeof useCamera3DController> | null = null

const canvasContainer = useTemplateRef<HTMLDivElement>('canvas-container')

const { hasScene, isLoading, getOrCreateScene, renderBuilding } = useBuildingScene()
let rendererController: ReturnType<typeof useBuildingRenderer> | null = null

const isSceneLoading = ref(false)

const attachCachedScene = (buildingId: string) => {
  if (!rendererController) return
  const cached = getOrCreateScene(buildingId)
  rendererController.attachScene(cached.scene)
}

const loadAndAttachScene = async (
  buildingId: string,
  floors: Floor[],
  devicesByFloor: Map<string, Device[]>,
) => {
  if (!rendererController || floors.length === 0) return

  isSceneLoading.value = true

  if (hasScene(buildingId)) {
    attachCachedScene(buildingId)
    isSceneLoading.value = false
    return
  }

  if (isLoading(buildingId)) {
    const waitForLoad = setInterval(() => {
      if (!isLoading(buildingId)) {
        clearInterval(waitForLoad)
        attachCachedScene(buildingId)
        isSceneLoading.value = false
      }
    }, 100)
    return
  }

  await renderBuilding(buildingId, floors, devicesByFloor, 40)

  attachCachedScene(buildingId)
  isSceneLoading.value = false
}

onMounted(async () => {
  if (!canvasContainer.value) return

  rendererController = useBuildingRenderer(canvasContainer.value)
  if (rendererController) {
    camera3DController = useCamera3DController(
      rendererController.camera,
      rendererController.controls,
    )
    emit('controller-ready', camera3DController)
  }

  if (props.buildingId && props.floors.length > 0) {
    await loadAndAttachScene(props.buildingId, props.floors, props.devicesByFloor)
  }
})

onBeforeUnmount(() => {
  emit('controller-disposed')
  camera3DController?.dispose()
  camera3DController = null
})

watch(
  () => props.buildingId,
  async (newBuildingId, oldBuildingId) => {
    if (newBuildingId === oldBuildingId) return

    rendererController?.detachScene()

    if (newBuildingId && props.floors.length > 0) {
      await loadAndAttachScene(newBuildingId, props.floors, props.devicesByFloor)
    }
  },
  { immediate: false },
)

watch(
  () => props.floors,
  async (newFloors) => {
    if (props.buildingId && newFloors.length > 0 && !hasScene(props.buildingId)) {
      await loadAndAttachScene(props.buildingId, newFloors, props.devicesByFloor)
    }
  },
  { immediate: false, deep: true },
)
</script>

<template>
  <div class="relative size-full">
    <div ref="canvas-container" class="size-full pointer-events-auto" />
  </div>
</template>
