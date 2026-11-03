<script setup lang="ts">
import type { StatusType } from '@/types/entity.type'
import { computed } from 'vue'

type Props = {
  state?: StatusType
}

const props = withDefaults(defineProps<Props>(), {
  state: 'NORMAL',
})

const stateConfig = computed(() => {
  switch (props.state) {
    case 'ALARM':
      return {
        glowBg: 'bg-red-600/40',
        pingBg: 'bg-red-600/20',
        pingBorder: 'border-red-500/60',
        pingShadow: 'shadow-[0_0_50px_rgba(239,68,68,0.6)]',
        pulseSpeed: 'animate-pulse',
        pingSpeed: 'animate-ping animate-duration-[1s]',
      }
    case 'TROUBLE':
      return {
        glowBg: 'bg-amber-500/40',
        pingBg: 'bg-amber-400/20',
        pingBorder: 'border-amber-400/60',
        pingShadow: 'shadow-[0_0_50px_rgba(245,158,11,0.6)]',
        pulseSpeed: 'animate-pulse',
        pingSpeed: 'animate-ping animate-duration-[2s]',
      }
    case 'NORMAL':
      return {
        glowBg: 'bg-blue-600/40',
        pingBg: 'bg-blue-500/20',
        pingBorder: 'border-blue-500/60',
        pingShadow: 'shadow-[0_0_50px_rgba(148,163,184,0.4)]',
        pulseSpeed: 'animate-pulse animate-duration-[4s]',
        pingSpeed: 'animate-ping animate-duration-[4s]',
      }
  }
})
</script>

<template>
  <div class="bg-surface-950">
    <div class="absolute inset-0 z-0">
      <div
        class="absolute left-1/2 top-1/2 -translate-1/2 aspect-square h-[95%] rounded-full blur-[100px] transition-colors duration-500"
        :class="[stateConfig.glowBg, stateConfig.pulseSpeed]"
      />
      <div
        class="absolute left-1/2 top-1/2 -translate-1/2 aspect-square h-[95%] rounded-full border-4 transition-colors duration-500"
        :class="[
          stateConfig.pingBg,
          stateConfig.pingBorder,
          stateConfig.pingShadow,
          stateConfig.pingSpeed,
        ]"
      />
    </div>
    <div class="absolute inset-0 z-1 grid grid-cols-8 grid-rows-5 gap-0.5 h-full">
      <div v-for="i in 40" :key="i" class="size-full bg-surface-950" />
    </div>
  </div>
</template>
