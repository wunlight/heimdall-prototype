<script setup lang="ts">
import type { Device, StatusType } from '@/shared/types/entity.type'

defineProps<{
  devices: Device[]
}>()

const selected = defineModel<Device | null>('selected', { default: null })

const statusSeverity = (status: StatusType) => {
  switch (status) {
    case 'alarm':
      return 'danger'
    case 'normal':
      return 'success'
    case 'offline':
      return 'secondary'
    case 'warning':
      return 'warn'
  }
}
</script>

<template>
  <DataTable
    v-model:selection="selected"
    :value="devices"
    striped-rows
    selection-mode="single"
    data-key="id"
    scrollable
    scroll-height="flex"
  >
    <Column header="Status" class="w-1">
      <template #body="{ data }">
        <Tag :value="data.status" :severity="statusSeverity(data.status)" class="uppercase" />
      </template>
    </Column>
    <Column field="type" header="Type" />
    <Column field="floorName" header="Floor" />
    <Column field="buildingName" header="Building" />
  </DataTable>
</template>
