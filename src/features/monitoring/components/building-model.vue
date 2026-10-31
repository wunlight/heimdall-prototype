<script setup lang="ts">
import type { Floor } from '@/types/entity.type'
import { nextTick, onMounted, onUnmounted, useTemplateRef, watch } from 'vue'
import { disposeBuildingScene, useBuildingScene } from '../composables/use-building-scene'

type Props = {
  floors: null | Floor[]
}

const props = withDefaults(defineProps<Props>(), {
  floors: null,
})

const FLOOR_HEIGHT = 10

const canvasContainer = useTemplateRef('canvas-container')
let sceneInstance: ReturnType<typeof useBuildingScene> | null = null

const loadModel = async (floors: Floor[]) => {
  await nextTick()
  if (!canvasContainer.value) return

  if (!sceneInstance) {
    sceneInstance = useBuildingScene(canvasContainer.value)
  }

  sceneInstance.clearFloors()

  floors.forEach(async (item, idx) => {
    const yPos = idx * FLOOR_HEIGHT
    const { depth, width } = await sceneInstance!.loadFloorLayer(item.blueprint_url, yPos)

    sceneInstance!.loadFloorArea(yPos, item.id, item.name, width, FLOOR_HEIGHT, depth)
  })
}

onMounted(() => {
  if (props.floors?.length) {
    loadModel(props.floors)
  }
})

watch(
  () => props.floors,
  (newFloors) => {
    if (newFloors?.length) {
      loadModel(newFloors)
    }
  },
)

onUnmounted(() => {
  disposeBuildingScene()
  sceneInstance = null
})
</script>

<template>
  <div ref="canvas-container" class="size-full" />
</template>
