import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './app/app.vue'
import './main.css'
import installPrimevue from './plugins/primevue/index.ts'
import router from './router'

delete (L.Icon.Default.prototype as any)._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const app = createApp(App)

app.use(createPinia())
app.use(router)

installPrimevue(app)

app.mount('#app')
