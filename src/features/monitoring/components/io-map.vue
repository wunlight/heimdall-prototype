<script setup lang="ts">
import type { Floor } from '@/types/entity.type'
import { LImageOverlay, LMap } from '@vue-leaflet/vue-leaflet'
import { CRS, type LatLngBoundsExpression, type PointExpression } from 'leaflet'
import { computed, ref } from 'vue'

type Props = {
  floor: Floor
}

defineProps<Props>()

const center = ref<PointExpression>([0, 0])
const zoom = ref<number>(0)

const imageSize = ref({ height: 256, width: 256 })

const bounds = computed<LatLngBoundsExpression>(() => [
  [0, 0],
  [imageSize.value.height, imageSize.value.width],
])
</script>

<template>
  <LMap
    :center="center"
    :zoom="zoom"
    :crs="CRS.Simple"
    :options="{ attributionControl: false, zoomControl: false }"
    style="background-color: var(--color-zinc-950)"
  >
    <LImageOverlay :url="floor.blueprint_url" :bounds="bounds" name="io-map" />
  </LMap>
</template>
