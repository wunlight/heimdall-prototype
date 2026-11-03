<script setup lang="ts">
import type { Floor } from '@/types/entity.type'
import { onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue'
import { useBuildingRenderer } from '../composables/building/renderer'
import { useBuildingScene } from '../composables/building/scene'

type Props = {
  buildingId: string
  floors: Floor[]
}
const props = defineProps<Props>()

const canvasContainer = useTemplateRef<HTMLDivElement>('canvas-container')

const { getOrCreateScene, hasScene, isLoading, getProgress, loadFloorsToScene } = useBuildingScene()

let rendererController: ReturnType<typeof useBuildingRenderer> | null = null

const isSceneLoading = ref(false)
const loadingProgress = ref(0)

const attachCachedScene = (buildingId: string) => {
  if (!rendererController) return

  const cached = getOrCreateScene(buildingId)
  rendererController.attachScene(cached.scene, cached.floorAreas)
}

const loadAndAttachScene = async (buildingId: string, floors: Floor[]) => {
  if (!rendererController || floors.length === 0) return

  isSceneLoading.value = true
  loadingProgress.value = 0

  if (hasScene(buildingId)) {
    attachCachedScene(buildingId)
    isSceneLoading.value = false
    return
  }

  if (isLoading(buildingId)) {
    const checkProgress = () => {
      const progress = getProgress(buildingId)
      loadingProgress.value = progress
      if (isLoading(buildingId)) {
        requestAnimationFrame(checkProgress)
      } else {
        attachCachedScene(buildingId)
        isSceneLoading.value = false
      }
    }
    checkProgress()
    return
  }

  await loadFloorsToScene(buildingId, floors)
  attachCachedScene(buildingId)
  isSceneLoading.value = false
}

onMounted(async () => {
  if (!canvasContainer.value) return

  rendererController = useBuildingRenderer(canvasContainer.value)

  if (props.buildingId && props.floors.length > 0) {
    await loadAndAttachScene(props.buildingId, props.floors)
  }
})

onUnmounted(() => {
  rendererController?.dispose()
  rendererController = null
})

watch(
  () => props.buildingId,
  async (newBuildingId, oldBuildingId) => {
    if (newBuildingId === oldBuildingId) return

    rendererController?.detachScene()

    if (newBuildingId && props.floors.length > 0) {
      await loadAndAttachScene(newBuildingId, props.floors)
    }
  },
  { immediate: false },
)

watch(
  () => props.floors,
  async (newFloors) => {
    if (props.buildingId && newFloors.length > 0 && !hasScene(props.buildingId)) {
      await loadAndAttachScene(props.buildingId, newFloors)
    }
  },
  { immediate: false, deep: true },
)
</script>

<template>
  <div class="relative size-full pointer-events-auto">
    <div ref="canvas-container" class="size-full" />

    <div
      v-if="isSceneLoading"
      class="absolute inset-0 flex flex-col items-center justify-center bg-black/50 gap-2"
    >
      <p class="text-sm text-slate-300">Loading building model...</p>
      <ProgressBar :value="loadingProgress" class="w-96 rounded-full!" />
    </div>
  </div>
</template>
