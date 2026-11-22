<script setup lang="ts">
type Props = {
  message: string
}
defineProps<Props>()
</script>

<template>
  <div
    class="flex flex-col items-center justify-center h-svh w-full bg-zinc-950 overflow-hidden pointer-events-none"
  >
    <p class="text-sm text-slate-500">{{ message }}</p>
  </div>
</template>
