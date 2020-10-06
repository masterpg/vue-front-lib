import 'animate.css/animate.css'
import '@/example/styles/app.sass'

import { i18n, initI18n } from '@/example/i18n'
import { initAPI, initLogic, initStore } from '@/example/logic'
import { initRouter, router } from '@/example/router'
import AppPage from '@/example/index.vue'
import Component from 'vue-class-component'
import Vue from 'vue'
import { initConfig } from '@/example/config'
import { initSW } from '@/example/sw'
import { quasar } from '@/example/quasar'

quasar.setup()
quasar.setupExtras()

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
