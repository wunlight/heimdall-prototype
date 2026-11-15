<script setup lang="ts">
import type { Device } from '@/shared/types/entity.type'
import { LCircle, LImageOverlay, LMap, LMarker, LTooltip } from '@vue-leaflet/vue-leaflet'
import { CRS, type LatLngBoundsExpression, type Map as LfMap, type PointExpression } from 'leaflet'
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

let cameraController: ReturnType<typeof useFloorCamera> | null = null

const mapInstance = ref<LfMap | null>(null)
const crs = CRS.Simple
const center = ref<PointExpression>([0, 0])
const zoom = ref<number>(0)
const minZoom = -5
const maxZoom = 5
const imageSize = ref({ height: 0, width: 0 })

const deviceColors = ref(new Map())

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
    const circleColor = deviceColors.value.get(device.id) || 'transparent'
    return {
      ...device,
      latLng: [y, x] as [number, number],
      circleColor,
    }
  })
})

const onMapReady = (instance: LfMap) => {
  mapInstance.value = instance
  cameraController = useFloorCamera(instance)
  emit('controller-ready', cameraController)
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

const setDeviceMarkerColor = (deviceId: string, color: string): boolean => {
  const newColors = new Map(deviceColors.value)
  newColors.set(deviceId, color)
  deviceColors.value = newColors
  return true
}

onBeforeUnmount(() => {
  emit('controller-disposed')
  cameraController?.dispose()
  cameraController = null
})

watch(
  () => props.blueprintUrl,
  () => {
    imageSize.value = { height: 0, width: 0 }
  },
)

defineExpose({
  setDeviceMarkerColor,
})
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

    <template v-for="device in deviceMarkers" :key="device.id">
      <LCircle
        :lat-lng="device.latLng"
        :radius="100"
        :color="device.circleColor"
        :fill-color="device.circleColor"
        :fill-opacity="device.circleColor !== 'transparent' ? 0.3 : 0"
        :weight="device.circleColor !== 'transparent' ? 2 : 0"
      />

      <LMarker :lat-lng="device.latLng">
        <LTooltip>{{ device.type }} - {{ device.status }}</LTooltip>
      </LMarker>
    </template>
  </LMap>
</template>
