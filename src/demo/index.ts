import 'animate.css/animate.css'
import '@/app/styles/app.sass'

import DemoMainPage from '@/demo/views/main'
import Vue from 'vue'
import VueCompositionApi from '@vue/composition-api'
import firebase from 'firebase/app'
import { quasar } from '@/app/quasar'
import { useConfig } from '@/app/config'
import { useI18n } from '@/demo/i18n'
import { useRouter } from '@/demo/router'

// Vueの設定
Vue.config.productionTip = false
Vue.use(VueCompositionApi)

// Quasarの設定
quasar.setup()
quasar.setupExtras()

async function init() {
  const config = useConfig()
  firebase.initializeApp(config.firebase)
  const router = useRouter()
  const { i18n } = useI18n()
  await i18n.load()

  new Vue({
    router,
    i18n,
    render: h => h(DemoMainPage),
  }).$mount('#app')
}
init()
