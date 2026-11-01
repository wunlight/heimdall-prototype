<script setup lang="ts">
import type { Floor } from '@/types/entity.type'
import { onMounted, onUnmounted, useTemplateRef, watch } from 'vue'
import { useBuildingScene } from '../composables/building-scene'

type Props = {
  floors: Floor[]
}
const props = defineProps<Props>()

const FLOOR_HEIGHT = 10

let disposeBuildingFn: (() => void) | null = null

const buildingContainer = useTemplateRef('building-container')

const initScene = () => {
  if (!buildingContainer.value || props.floors.length === 0) return

  if (disposeBuildingFn) {
    disposeBuildingFn()
    disposeBuildingFn = null
  }

  const { loadFloor, disposeBuilding } = useBuildingScene(buildingContainer.value)
  disposeBuildingFn = disposeBuilding

  props.floors.forEach((item, idx) => {
    const yPos = idx * FLOOR_HEIGHT
    loadFloor(item, yPos, 40, FLOOR_HEIGHT, undefined)
  })
}

onMounted(() => {
  initScene()
})

onUnmounted(() => {
  disposeBuildingFn?.()
})

watch(
  () => props.floors,
  (newFloors) => {
    if (newFloors.length > 0) {
      initScene()
    }
  },
  { immediate: true, deep: true },
)
</script>

<template>
  <div ref="building-container" class="size-full pointer-events-auto" />
</template>
