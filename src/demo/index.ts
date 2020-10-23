import '@/app/styles/app.sass'

import DemoPage from '@/demo/index.vue'
import Vue from 'vue'
import VueCompositionApi from '@vue/composition-api'
import { quasar } from '@/app/quasar'
import router from '@/demo/router'
import { setupConfig } from '@/app/config'
import { setupI18n } from '@/demo/i18n'

// Vueの設定
Vue.config.productionTip = false
Vue.use(VueCompositionApi)

// Quasarの設定
quasar.setup()
quasar.setupExtras()

async function init() {
  setupConfig()
  const i18n = setupI18n()
  await i18n.load()

  new Vue({
    router,
    i18n,
    render: h => h(DemoPage),
  }).$mount('#app')
}
init()
