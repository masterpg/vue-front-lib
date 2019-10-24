import 'animate.css/animate.css'
import '@/index.sass'

import './quasar'
import { i18n, initI18n } from '@/base/i18n'
import AppPage from '@/index.vue'
import Component from 'vue-class-component'
import Vue from 'vue'
import { currency } from '@/currency'
import { initAPI } from '@/api'
import { initConfig } from '@/base/config'
import { initLogic } from '@/logic'
import { initServiceWorker } from '@/base/service-worker'
import { initStore } from '@/store'
import { initUtils } from '@/base/utils'
import { vueRouter } from '@/base/router'

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
    router: vueRouter,
    render: h => h(AppPage),
    i18n,
  })
}
init()
