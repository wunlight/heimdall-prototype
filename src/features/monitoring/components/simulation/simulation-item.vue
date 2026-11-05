<script setup lang="ts">
import { STATUS_TYPES } from '../../constants/status-type'
import type { DeviceOption } from '../../services/simulation.service'
import type { SimulationEventItem } from '../../types/event.type'

type Props = {
  data: SimulationEventItem
  deviceOptions: DeviceOption[]
  idx: number
}
const props = defineProps<Props>()

type Emit = {
  (e: 'update:data', data: SimulationEventItem): void
  (e: 'moveUp', idx: number): void
  (e: 'moveDown', idx: number): void
  (e: 'remove', idx: number): void
}
const emit = defineEmits<Emit>()

const updateField = (field: keyof SimulationEventItem, value: any) => {
  emit('update:data', {
    ...props.data,
    [field]: value,
  })
}
</script>

<template>
  <Panel :pt="{ header: 'hidden!', content: 'p-2!' }">
    <div class="flex items-center gap-2">
      <p class="px-2">{{ idx + 1 }}.</p>
      <Select
        :model-value="data.deviceId"
        placeholder="Select Device"
        :options="deviceOptions"
        option-label="label"
        option-value="value"
        class="w-36!"
        @update:model-value="updateField('deviceId', $event)"
      />
      <Select
        :model-value="data.targetStatus"
        placeholder="Select Event"
        :options="STATUS_TYPES.map((status) => ({ label: status, value: status }))"
        option-label="label"
        option-value="value"
        class="w-36!"
        @update:model-value="updateField('targetStatus', $event)"
      />
      <InputNumber
        :model-value="data.delay"
        placeholder="Delay"
        :pt="{ pcInputText: { root: 'w-24!' } }"
        @update:model-value="updateField('delay', $event)"
      />
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
