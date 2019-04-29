import 'animate.css/animate.css'
import '@/styles/polymer/polymer-styles.js'
import '@/index.css'

import {i18n, initI18n} from '@/base/i18n'
import AppView from '@/index.vue'
import Vue from 'vue'
import {currency} from '@/currency'
import {initAPI} from '@/api'
import {initConfig} from '@/base/config'
import {initLogic} from '@/logic'
import {initServiceWorker} from '@/base/service-worker'
import {initStore} from '@/store'
import {initUtils} from '@/base/utils'
import {router} from '@/base/router'

// TODO JetBrainsIDE使用時の開発補助コード
// import '@/pages/abc/index.vue'
// import '@/pages/shopping/index.vue'

async function init() {
  initUtils()
  initConfig()
  initServiceWorker()
  initAPI()
  initStore()
  initLogic()
  await initI18n()

  Vue.filter('currency', currency)

  new Vue({
    el: '#app',
    router,
    render: h => h(AppView),
    i18n,
  })
}
init()
