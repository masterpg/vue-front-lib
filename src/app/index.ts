import 'animate.css/animate.css'
import '@/app/styles/app.sass'

import AppPage from '@/app/index.vue'
import Vue from 'vue'
import VueCompositionApi from '@vue/composition-api'
import { quasar } from '@/app/quasar'
import { setupConfig } from '@/app/config'
import { setupI18n } from '@/app/i18n'
import { setupRouter } from '@/app/router'

// Vueの設定
Vue.config.productionTip = false
Vue.use(VueCompositionApi)

// Quasarの設定
quasar.setup()
quasar.setupExtras()

async function init() {
  setupConfig()
  const router = setupRouter()
  const i18n = setupI18n()
  await i18n.load()

  new Vue({
    router,
    i18n,
    render: h => h(AppPage),
  }).$mount('#app')
}
init()
