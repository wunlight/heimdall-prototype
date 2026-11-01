<script setup lang="ts">
import { LImageOverlay, LMap } from '@vue-leaflet/vue-leaflet'
import { CRS, type LatLngBoundsExpression, type Map, type PointExpression } from 'leaflet'
import { computed, onMounted, ref, watch } from 'vue'

type Props = {
  imageUrl: string
}
const props = defineProps<Props>()

const MIN_ZOOM = -5
const MAX_ZOOM = 5

let activeImage: HTMLImageElement | null = null

const mapInstance = ref<null | Map>()
const center = ref<PointExpression>([0, 0])
const zoom = ref<number>(0)
const imageSize = ref({ width: 0, height: 0 })

const bounds = computed<LatLngBoundsExpression>(() => {
  return [
    [imageSize.value.height, 0],
    [0, imageSize.value.width],
  ]
})

const setImageSize = (image: string) => {
  if (activeImage) {
    activeImage.onload = null
    activeImage = null
  }

  imageSize.value = { width: 0, height: 0 }

  const img = new Image()
  img.decoding = 'async'
  img.src = image
  activeImage = img

  img.onload = () => {
    if (activeImage === img) {
      imageSize.value = {
        height: img.naturalHeight,
        width: img.naturalWidth,
      }
    }
  }
}

const fitBounds = () => {
  const { height, width } = imageSize.value
  if (mapInstance.value && height > 0 && width > 0) {
    mapInstance.value.fitBounds([
      [height, 0],
      [0, width],
    ])
  }
}

const handleMapReady = (instance: Map) => {
  mapInstance.value = instance
  fitBounds()
}

onMounted(() => {
  setImageSize(props.imageUrl)
})

watch(
  () => props.imageUrl,
  (newUrl) => {
    if (newUrl) {
      setImageSize(newUrl)
    }
  },
  { immediate: true },
)

watch(
  imageSize,
  () => {
    fitBounds()
  },
  { deep: true },
)
</script>

<template>
  <LMap
    :center="center"
    :zoom="zoom"
    :min-zoom="MIN_ZOOM"
    :max-zoom="MAX_ZOOM"
    :crs="CRS.Simple"
    :options="{ attributionControl: false, zoomControl: false }"
    class="bg-transparent! pointer-events-auto"
    @ready="handleMapReady"
  >
    <LImageOverlay :url="imageUrl" :bounds="bounds" />
  </LMap>
</template>
