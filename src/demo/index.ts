import '@/app/styles/app.sass'

import AppPage from '@/demo/index.vue'
import Vue from 'vue'
import VueCompositionApi from '@vue/composition-api'
import { createI18n } from '@/demo/i18n'
import { quasar } from '@/app/quasar'
import router from '@/demo/router'

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
