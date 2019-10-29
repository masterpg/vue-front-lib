import 'animate.css/animate.css'
import '@/index.sass'

import './quasar'
import { i18n, initConfig, initI18n, initServiceWorker, initUtils, router } from '@/base'
import AppPage from '@/index.vue'
import Component from 'vue-class-component'
import Vue from 'vue'
import { currency } from '@/currency'
import { initAPI } from '@/api'
import { initLogic } from '@/logic'
import { initStore } from '@/store'

Component.registerHooks(['beforeRouteEnter', 'beforeRouteLeave', 'beforeRouteUpdate'])

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
    render: h => h(AppPage),
    i18n,
  })
}
init()
