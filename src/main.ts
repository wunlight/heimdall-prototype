import './main.css'

import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import installPrimevue from './plugins/primevue/index.ts'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

installPrimevue(app)

app.mount('#app')
