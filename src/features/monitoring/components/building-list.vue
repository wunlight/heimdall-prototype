<script setup lang="ts">
import { onMounted } from 'vue'
import { useBuildingStore } from '../stores/building.store.ts'

const store = useBuildingStore()

onMounted(() => {
  if (store.buildings.length) {
    store.selectBuilding(store.buildings[0]!)
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
        v-for="item in store.buildings"
        :key="item.id"
        :label="item.name"
        icon="icon-[tabler--building]"
        :severity="store.selectedBuilding?.id === item.id ? 'contrast' : 'secondary'"
        class="shrink-0 justify-start!"
        @click="store.selectBuilding(item)"
      />
    </template>
  </Card>
</template>
