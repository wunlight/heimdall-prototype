<script setup lang="ts">
import { STATUS_TYPES } from '../../constants/status-type'
import type { SimulationEventItem } from '../../types/event.type'

type Props = {
  data: SimulationEventItem
  idx: number
}
defineProps<Props>()

type Emit = {
  (e: 'moveUp', idx: number): void
  (e: 'moveDown', idx: number): void
  (e: 'remove', idx: number): void
}
const emit = defineEmits<Emit>()
</script>

<template>
  <Panel :pt="{ header: 'hidden!', content: 'p-2!' }">
    <div class="flex items-center gap-2">
      <p class="px-2">{{ idx + 1 }}.</p>
      <Select placeholder="Select Device" />
      <Select placeholder="Select Event" :options="[...STATUS_TYPES]" class="w-36!" />
      <Button
        icon="icon-[tabler--arrow-up]"
        severity="contrast"
        outlined
        class="aspect-square!"
        @click="emit('moveUp', idx)"
      />
      <Button
        icon="icon-[tabler--arrow-down]"
        severity="contrast"
        outlined
        class="aspect-square!"
        @click="emit('moveDown', idx)"
      />
      <Button
        icon="icon-[tabler--trash]"
        severity="danger"
        outlined
        class="aspect-square!"
        @click="emit('remove', idx)"
      />
    </div>
  </Panel>
</template>
