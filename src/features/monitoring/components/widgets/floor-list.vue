<script setup lang="ts">
import type { Floor } from '@/shared/types/entity.type'

defineProps<{ floors: Floor[]; selectedId: string | null }>()
const emit = defineEmits<{ select: [id: string] }>()
</script>

<template>
  <div
    class="group flex flex-col gap-1.5 p-1.5 max-h-full w-12 hover:w-64 bg-zinc-900 border border-zinc-700 rounded-lg transition-all duration-300 overflow-x-hidden overflow-y-auto pointer-events-auto"
  >
    <div
      v-for="item in floors"
      :key="item.id"
      :class="
        item.id === selectedId
          ? 'text-zinc-900 bg-white hover:bg-zinc-200'
          : 'bg-zinc-800 hover:bg-zinc-700'
      "
      @click="emit('select', item.id)"
      class="flex items-center shrink-0 group-hover:px-3 h-1.5 group-hover:h-9 w-9 group-hover:w-auto rounded-lg cursor-pointer"
    >
      <p class="hidden group-hover:block">{{ item.name }}</p>
    </div>
  </div>
</template>
