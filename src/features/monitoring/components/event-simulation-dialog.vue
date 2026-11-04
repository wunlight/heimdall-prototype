<script setup lang="ts">
import { ref } from 'vue'
import type { SimulationEventItem } from '../types/event.type.ts'
import EventSimulationItem from './simulation/event-simulation-item.vue'

const isShow = ref<boolean>(false)

const createDefaultEvent = (): SimulationEventItem => ({
  id: String(Date.now() + Math.random()),
  deviceId: null,
  eventId: null,
  targetStatus: 'ALARM',
})

const simulationEvents = ref<SimulationEventItem[]>([createDefaultEvent()])

const show = () => {
  simulationEvents.value = [createDefaultEvent()]
  isShow.value = true
}

const hide = () => {
  isShow.value = false
  simulationEvents.value = []
}

const addEventRow = () => {
  simulationEvents.value.push({
    id: String(Date.now() + Math.random()),
    deviceId: null,
    eventId: null,
    targetStatus: 'NORMAL',
  })
}

const removeEventRow = (index: number) => {
  simulationEvents.value.splice(index, 1)
}

const moveUp = (index: number) => {
  if (index > 0) {
    const temp = simulationEvents.value[index]
    simulationEvents.value[index] = simulationEvents.value[index - 1]!
    simulationEvents.value[index - 1] = temp!
  }
}

const moveDown = (index: number) => {
  if (index < simulationEvents.value.length - 1) {
    const temp = simulationEvents.value[index]
    simulationEvents.value[index] = simulationEvents.value[index + 1]!
    simulationEvents.value[index + 1] = temp!
  }
}

const handleSimulate = () => {
  console.log('Data Simulasi:', simulationEvents.value)
  hide()
}
</script>

<template>
  <slot name="trigger" :show="show" />

  <Dialog v-model:visible="isShow" header="Event Simulation" modal @hide="hide">
    <div class="flex flex-col gap-2 max-h-64 min-w-124 overflow-x-hidden overflow-y-auto">
      <EventSimulationItem
        v-for="(item, idx) in simulationEvents"
        :key="item.id"
        :data="item"
        :idx="idx"
        @move-up="moveUp"
        @move-down="moveDown"
        @remove="removeEventRow"
      />
    </div>

    <Divider />
    <Button label="Add Event" icon="icon-[tabler--plus]" outlined fluid @click="addEventRow" />
    <Divider />

    <div class="flex justify-end gap-4">
      <Button label="Simulate" icon="icon-[tabler--flask-2-filled]" />
    </div>
  </Dialog>
</template>
