<script setup lang="ts">
import type { Floor } from '@/types/entity.type'
import { onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue'
import { useBuildingRenderer } from '../composables/building-renderer'
import { useBuildingSceneCache } from '../composables/building-scene-cache'

type Props = {
  buildingId: string
  floors: Floor[]
}
const props = defineProps<Props>()

const buildingContainer = useTemplateRef<HTMLDivElement>('building-container')

const {
  getOrCreateScene,
  hasScene,
  isLoading,
  getProgress,
  getLoadedCount,
  getTotalCount,
  loadFloorsToScene,
} = useBuildingSceneCache()

let rendererController: ReturnType<typeof useBuildingRenderer> | null = null
let currentBuildingId: string | null = null

const isSceneLoading = ref(false)
const loadingProgress = ref(0)
const loadingStatus = ref('')

const attachCachedScene = (buildingId: string) => {
  if (!rendererController) return

  const cached = getOrCreateScene(buildingId)
  rendererController.attachScene(cached.scene, cached.floorAreas)
  currentBuildingId = buildingId
}

const loadAndAttachScene = async (buildingId: string, floors: Floor[]) => {
  if (!rendererController || floors.length === 0) return

  isSceneLoading.value = true
  loadingProgress.value = 0
  loadingStatus.value = 'Initializing...'

  // If scene already cached, attach immediately
  if (hasScene(buildingId)) {
    attachCachedScene(buildingId)
    isSceneLoading.value = false
    return
  }

  // If another loading is in progress, poll for progress
  if (isLoading(buildingId)) {
    const checkProgress = () => {
      const progress = getProgress(buildingId)
      const loaded = getLoadedCount(buildingId)
      const total = getTotalCount(buildingId)
      loadingProgress.value = progress
      loadingStatus.value = `Loading floor ${loaded}/${total}...`
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

  // Load new scene
  await loadFloorsToScene(buildingId, floors, 40, '#62748e', (loaded, total, floorName) => {
    loadingProgress.value = (loaded / total) * 100
    loadingStatus.value = `Loading ${floorName}... (${loaded}/${total})`
  })
  attachCachedScene(buildingId)
  isSceneLoading.value = false
}

// Handle building change without re-creating renderer
watch(
  () => props.buildingId,
  async (newBuildingId, oldBuildingId) => {
    if (newBuildingId === oldBuildingId) return

    // Detach current scene but keep renderer alive
    rendererController?.detachScene()
    currentBuildingId = null

    if (newBuildingId && props.floors.length > 0) {
      await loadAndAttachScene(newBuildingId, props.floors)
    }
  },
  { immediate: false },
)

// Handle floors update
watch(
  () => props.floors,
  async (newFloors) => {
    if (props.buildingId && newFloors.length > 0 && !hasScene(props.buildingId)) {
      await loadAndAttachScene(props.buildingId, newFloors)
    }
  },
  { immediate: false, deep: true },
)

// Initialize renderer once on mount
onMounted(async () => {
  if (!buildingContainer.value) return

  // Create WebGL renderer once
  rendererController = useBuildingRenderer(buildingContainer.value)

  if (props.buildingId && props.floors.length > 0) {
    await loadAndAttachScene(props.buildingId, props.floors)
  }
})

// Cleanup on unmount
onUnmounted(() => {
  rendererController?.dispose()
  rendererController = null
  currentBuildingId = null
})
</script>

<template>
  <div class="relative size-full pointer-events-auto">
    <div ref="building-container" class="relative z-0 size-full" />

    <div
      v-if="isSceneLoading"
      class="absolute inset-0 z-1 flex flex-col items-center justify-center bg-black/70 gap-3"
    >
      <ProgressSpinner stroke-width="4" class="w-12 h-12" />
      <p class="text-sm text-slate-300">{{ loadingStatus }}</p>
      <ProgressBar :value="loadingProgress" :show-value="false" class="w-64 h-1.5 rounded-full!" />
    </div>
  </div>
</template>
