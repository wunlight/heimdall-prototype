<script setup lang="ts">
import { LImageOverlay, LMap } from '@vue-leaflet/vue-leaflet'
import { CRS, type LatLngBoundsExpression, type Map, type PointExpression } from 'leaflet'
import { computed, onMounted, ref, watch } from 'vue'
import { getBlueprintBlobUrl } from '../services/blueprint-cache.service'

type Props = {
  imageUrl: string
  floorId?: string
}
const props = defineProps<Props>()

const MIN_ZOOM = -5
const MAX_ZOOM = 5

let activeImage: HTMLImageElement | null = null

const mapInstance = ref<null | Map>()
const center = ref<PointExpression>([0, 0])
const zoom = ref<number>(0)
const imageSize = ref({ width: 0, height: 0 })
const cachedImageUrl = ref<string>('')
const isLoading = ref(true)

const bounds = computed<LatLngBoundsExpression>(() => {
  return [
    [imageSize.value.height, 0],
    [0, imageSize.value.width],
  ]
})

const setImageSize = (image: string): Promise<void> => {
  return new Promise((resolve) => {
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
      resolve()
    }

    img.onerror = () => {
      console.error(`Failed to load image: ${image}`)
      resolve()
    }
  })
}

const loadCachedImage = async (floorId: string | undefined, publicUrl: string) => {
  isLoading.value = true

  try {
    if (floorId) {
      const cachedUrl = await getBlueprintBlobUrl(floorId, publicUrl)
      cachedImageUrl.value = cachedUrl
      await setImageSize(cachedUrl)
    } else {
      cachedImageUrl.value = publicUrl
      await setImageSize(publicUrl)
    }
  } finally {
    isLoading.value = false
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
  loadCachedImage(props.floorId, props.imageUrl)
})

watch(
  () => props.imageUrl,
  (newUrl) => {
    if (newUrl) {
      loadCachedImage(props.floorId, newUrl)
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
  <div class="relative size-full">
    <!-- Loading indicator -->
    <div
      v-if="isLoading"
      class="absolute inset-0 z-10 flex items-center justify-center bg-black/70"
    >
      <ProgressSpinner stroke-width="4" class="w-10 h-10" />
    </div>

    <!-- Map -->
    <LMap
      v-show="!isLoading"
      :center="center"
      :zoom="zoom"
      :min-zoom="MIN_ZOOM"
      :max-zoom="MAX_ZOOM"
      :crs="CRS.Simple"
      :options="{ attributionControl: false, zoomControl: false }"
      class="bg-transparent! pointer-events-auto"
      @ready="handleMapReady"
    >
      <LImageOverlay :url="cachedImageUrl" :bounds="bounds" />
    </LMap>
  </div>
</template>
