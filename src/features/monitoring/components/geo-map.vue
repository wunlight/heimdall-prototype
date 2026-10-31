<script setup lang="ts">
import { useBuildingStore } from '@/stores/building.store'
import { LMap, LMarker, LTileLayer, LTooltip } from '@vue-leaflet/vue-leaflet'
import type { PointExpression } from 'leaflet'
import { ref } from 'vue'

const buildingStore = useBuildingStore()

const center = ref<PointExpression>([-6.2088, 106.8456])
const zoom = ref<number>(16)
</script>

<template>
  <LMap
    :center="center"
    :zoom="zoom"
    :options="{ attributionControl: false, zoomControl: false }"
    style="background-color: var(--color-zinc-950)"
  >
    <LTileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" name="geo-map" />
    <LMarker
      v-for="item in buildingStore.buildings"
      :key="item.id"
      :lat-lng="[item.lat, item.lng]"
      @click="buildingStore.selectBuilding(item)"
    >
      <LTooltip>
        {{ item.name }}
      </LTooltip>
    </LMarker>
  </LMap>
</template>
