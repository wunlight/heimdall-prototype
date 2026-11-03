<script setup lang="ts">
import { ref } from 'vue'

const isShow = ref<boolean>(false)

const show = () => (isShow.value = true)
const hide = () => (isShow.value = false)
</script>

<template>
  <slot name="trigger" :show="show" />

  <Dialog v-model:visible="isShow" header="Event Simulation" modal>
    <div class="flex flex-col gap-2 max-h-64 overflow-x-hidden overflow-y-auto">
      <Panel v-for="i in 10" :pt="{ header: 'hidden!', content: 'p-2!' }">
        <div class="flex items-center gap-4">
          <p>1.</p>
          <Select placeholder="Select Device" />
          <Select placeholder="Select Event" />
          <Button icon="icon-[tabler--arrow-up]" severity="contrast" outlined />
          <Button icon="icon-[tabler--arrow-down]" severity="contrast" outlined />
        </div>
      </Panel>
    </div>

    <Divider />
    <Button label="Add Event" icon="icon-[tabler--plus]" outlined fluid />
    <Divider />

    <div class="flex justify-end gap-4">
      <Button label="Simulate" icon="icon-[tabler--flask-2-filled]" />
    </div>
  </Dialog>
</template>
