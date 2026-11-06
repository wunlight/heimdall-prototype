<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { mockWS } from '../services/mock-ws.service.ts'
import type { DeviceOption } from '../services/simulation.service.ts'
import { simulationService } from '../services/simulation.service.ts'
import type { SimulationEventItem } from '../types/event.type.ts'
import SimulationItem from './simulation-item.vue'

const isShow = ref<boolean>(false)
const deviceOptions = ref<DeviceOption[]>([])

const createDefaultEvent = (): SimulationEventItem => ({
  id: String(Date.now() + Math.random()),
  deviceId: null,
  eventId: null,
  targetStatus: 'ALARM',
  delay: 0,
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
    delay: 1000,
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

const handleSimulation = async () => {
  const payloadToSimulate = [...simulationEvents.value]
  console.log('Data Simulasi:', payloadToSimulate)
  hide()
  await mockWS.startSimulation(payloadToSimulate)
}

onMounted(async () => {
  deviceOptions.value = await simulationService.getDeviceOptions()
})
</script>

<template>
  <slot name="trigger" :show="show" />

  <Dialog v-model:visible="isShow" header="Event Simulation" modal @hide="hide">
    <div class="flex flex-col gap-2 max-h-64 min-w-124 overflow-x-hidden overflow-y-auto">
      <SimulationItem
        v-for="(item, idx) in simulationEvents"
        :key="item.id"
        v-model:data="simulationEvents[idx]!"
        :device-options="deviceOptions"
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
      <Button label="Simulate" icon="icon-[tabler--flask-2-filled]" @click="handleSimulation" />
    </div>
  </Dialog>
</template>
