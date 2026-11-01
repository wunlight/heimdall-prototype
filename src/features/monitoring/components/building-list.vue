<script setup lang="ts">
import type { Building } from '@/types/entity.type.ts'
import { onMounted } from 'vue'

type Props = {
  buildings: Building[]
  selectedBuilding: null | Building
}
const props = defineProps<Props>()

type Emit = {
  (e: 'item-click', building: Building): void
}
const emit = defineEmits<Emit>()

onMounted(() => {
  if (props.buildings.length) {
    emit('item-click', props.buildings[0]!)
  }
})
</script>

<template>
  <Card
    :pt="{
      root: 'max-h-full rounded-md! pointer-events-auto',
      body: 'p-2! min-h-0',
      content: 'flex flex-col gap-2 min-h-0 overflow-y-auto',
    }"
  >
    <template #content>
      <Button
        v-for="item in buildings"
        :key="item.id"
        :label="item.name"
        icon="icon-[tabler--building]"
        :severity="selectedBuilding?.id === item.id ? 'contrast' : 'secondary'"
        class="shrink-0 justify-start!"
        @click="emit('item-click', item)"
      />
    </template>
  </Card>
</template>
