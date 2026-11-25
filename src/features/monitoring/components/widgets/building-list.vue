<script setup lang="ts">
import type { Building } from '@/shared/types/entity.type'

defineProps<{ buildings: Record<string, Building>; selectedId: string | null }>()
const emit = defineEmits<{ select: [id: string] }>()
</script>

<template>
  <div
    class="group p-1.5 max-h-full hover:w-64 bg-zinc-900 border border-zinc-700 rounded-lg transition-all duration-300 origin-top-left [interpolate-size:allow-keywords] overflow-y-auto pointer-events-auto"
  >
    <div class="hidden group-hover:flex flex-col gap-1.5">
      <Button
        v-for="item in buildings"
        :key="item.id"
        :label="item.name"
        :variant="item.id === selectedId ? '' : 'text'"
        @click="emit('select', item.id)"
        icon="icon-[tabler--building]"
        severity="contrast"
        class="shrink-0 justify-start!"
      />
    </div>
    <span class="icon-[tabler--building] block group-hover:hidden size-5" />
  </div>
</template>
