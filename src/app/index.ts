import 'animate.css/animate.css'
import '@/app/styles/app.sass'

import { i18n, initI18n } from '@/app/i18n'
import { initAPI, initLogic, initStore } from '@/app/logic'
import { initRouter, router } from '@/app/router'
import AppPage from '@/app/index.vue'
import Component from 'vue-class-component'
import Vue from 'vue'
import { initConfig } from '@/app/config'
import { initSW } from '@/app/sw'
import { quasar } from '@/app/quasar'

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
