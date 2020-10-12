import '@/app/styles/app.sass'

import DemoPage from '@/demo/index.vue'
import Vue from 'vue'
import VueCompositionApi from '@vue/composition-api'
import { createI18n } from '@/app/i18n'
import { quasar } from '@/app/quasar'
import router from '@/app/router'

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
    render: h => h(DemoPage),
  }).$mount('#app')
}
init()
