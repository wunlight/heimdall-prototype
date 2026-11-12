<script setup lang="ts">
import type { Device } from '@/shared/types/entity.type'
import { LImageOverlay, LMap, LMarker, LTooltip } from '@vue-leaflet/vue-leaflet'
import { CRS, Map, type LatLngBoundsExpression, type PointExpression } from 'leaflet'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useFloorCamera } from '../composables/camera-control/floor-camera'

type Props = {
  blueprintUrl: string
  devices: Device[]
}
const props = defineProps<Props>()

type Emit = {
  (event: 'controller-ready', controller: ReturnType<typeof useFloorCamera>): void
  (event: 'controller-disposed'): void
}
const emit = defineEmits<Emit>()

let camera2DController: ReturnType<typeof useFloorCamera> | null = null

const mapInstance = ref<Map | null>(null)
const crs = CRS.Simple
const center = ref<PointExpression>([0, 0])
const zoom = ref<number>(0)
const minZoom = -5
const maxZoom = 5
const imageSize = ref({ height: 0, width: 0 })

const bounds = computed<LatLngBoundsExpression>(() => [
  [imageSize.value.height, 0],
  [0, imageSize.value.width],
])

const deviceMarkers = computed(() => {
  const { width, height } = imageSize.value
  if (width === 0 || height === 0) return []

  return props.devices.map((device) => {
    const x = device.x * width
    const y = (1 - device.y) * height

    return {
      ...device,
      latLng: [y, x] as [number, number],
    }
  })
})

const onMapReady = (instance: Map) => {
  mapInstance.value = instance
  camera2DController = useFloorCamera(instance)
  emit('controller-ready', camera2DController)
}

const onImageLoad = (event: any) => {
  const imgElement = event.target.getElement ? event.target.getElement() : event.target
  if (imgElement) {
    const width = imgElement.naturalWidth || imgElement.width
    const height = imgElement.naturalHeight || imgElement.height

    imageSize.value = { height, width }

    if (mapInstance.value && height > 0 && width > 0) {
      mapInstance.value.fitBounds([
        [height, 0],
        [0, width],
      ])
    }
  }
}

onBeforeUnmount(() => {
  emit('controller-disposed')
  camera2DController?.dispose()
  camera2DController = null
})

watch(
  () => props.blueprintUrl,
  () => {
    imageSize.value = { height: 0, width: 0 }
  },
)
</script>

<template>
  <LMap
    :crs
    :center
    :zoom
    :min-zoom
    :max-zoom
    :options="{ zoomControl: false, attributionControl: false }"
    class="bg-transparent!"
    @ready="onMapReady"
  >
    <LImageOverlay :url="blueprintUrl" :bounds @load="onImageLoad" />
    <LMarker v-for="device in deviceMarkers" :key="device.id" :lat-lng="device.latLng">
      <LTooltip>{{ device.type }} - {{ device.status }}</LTooltip>
    </LMarker>
  </LMap>
</template>
