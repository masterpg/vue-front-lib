import 'animate.css/animate.css'
import '@/example/index.sass'

import '@/example/quasar'
import '@/example/quasar.extras'
import { i18n, initI18n } from '@/example/i18n'
import { initRouter, router } from '@/example/router'
import AppPage from '@/example/index.vue'
import Component from 'vue-class-component'
import Vue from 'vue'
import { initAPI } from '@/example/logic/api'
import { initConfig } from '@/example/config'
import { initLogic } from '@/example/logic'
import { initSW } from '@/example/sw'
import { initStore } from '@/example/logic/store'

Component.registerHooks(['beforeRouteEnter', 'beforeRouteLeave', 'beforeRouteUpdate'])

async function init() {
  initConfig()
  initSW()
  initRouter()
  initAPI()
  initStore()
  initLogic()
  await initI18n()

  new Vue({
    el: '#app',
    render: h => h(AppPage),
    router,
    i18n,
  })
}
init()
