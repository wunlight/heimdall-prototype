<script setup lang="ts">
import type { Floor } from '@/types/entity.type'
import { onMounted, useTemplateRef, watch } from 'vue'
import { useBuildingScene } from '../composables/use-building-scene'

type Props = {
  floors: null | Floor[]
}

const props = withDefaults(defineProps<Props>(), {
  floors: null,
})

const FLOOR_HEIGHT = 10

const canvasContainer = useTemplateRef('canvas-container')

const loadModel = (floors: Floor[]) => {
  if (!canvasContainer.value) return

  const { loadFloorArea, loadFloorLayer } = useBuildingScene(canvasContainer.value)

  floors.forEach(async (item, idx) => {
    const yPos = idx * FLOOR_HEIGHT
    const { depth, width } = await loadFloorLayer(item.blueprint_url, yPos)

    loadFloorArea(yPos, item.id, item.name, width, FLOOR_HEIGHT, depth)
  })
}

onMounted(() => {
  if (props.floors) {
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
</script>

<template>
  <div ref="canvas-container" />
</template>
