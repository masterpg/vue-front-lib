import '@/styles/app.sass'

import AppPage from '@/index.vue'
import Vue from 'vue'
import VueCompositionApi from '@vue/composition-api'
import { createI18n } from '@/i18n'
import { quasar } from '@/quasar'
import router from '@/router'

// Vueの設定
Vue.config.productionTip = false
Vue.use(VueCompositionApi)

// Quasarの設定
quasar.setup()
quasar.setupExtras()

async function init() {
  const i18n = createI18n()
  await i18n.load()

  new Vue({
    router,
    i18n,
    render: h => h(AppPage),
  }).$mount('#app')
}
init()
