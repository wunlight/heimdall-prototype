<script setup lang="ts">
import type { Floor } from '@/types/entity.type'

type Props = {
  floors: Floor[]
  selectedFloor: null | Floor
}
defineProps<Props>()

type Emit = {
  (e: 'item-click', floor: Floor): void
}
const emit = defineEmits<Emit>()
</script>

<template>
  <div class="absolute right-3 top-1/2 -translate-y-1/2 z-1">
    <div
      class="group/floor-list flex flex-col gap-2 p-2 max-h-32 w-12 hover:w-48 bg-surface-900 rounded-md transform-all duration-200 pointer-events-auto"
    >
      <Button
        v-for="item in floors"
        :key="item.id"
        :label="item.name"
        icon="icon-[tabler--layout-board]"
        :severity="selectedFloor?.id === item.id ? 'contrast' : 'secondary'"
        @click="emit('item-click', item)"
        :pt="{
          root: 'flex! justify-start! py-0.5!',
          label: 'hidden group-hover/floor-list:block',
          icon: 'hidden group-hover/floor-list:block',
        }"
      />
    </div>
  </div>
</template>
