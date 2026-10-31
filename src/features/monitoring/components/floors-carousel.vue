<script setup lang="ts">
import type { Floor } from '@/types/entity.type'
import { onMounted, ref } from 'vue'
import IoMap from './io-map.vue'

type Props = {
  floors: Floor[]
}

const props = defineProps<Props>()

const activeFloor = ref<null | Floor>(null)

onMounted(() => {
  if (props.floors.length) {
    activeFloor.value = props.floors[0]!
  }
})
</script>

<template>
  <div class="relative isolate size-full">
    <IoMap v-if="activeFloor" :floor="activeFloor" class="relative z-0 pointer-events-auto" />

    <div class="absolute right-3 top-1/2 -translate-y-1/2">
      <Card class="">
        <template #content></template>
      </Card>
    </div>
  </div>
</template>
