import '@/styles/polymer/polymer-styles.js'
import '@/index.css'

import {i18n, initI18n} from '@/base/i18n'
import PlaygroundView from '@/playground.vue'
import Vue from 'vue'

async function init() {
  await initI18n()

  new Vue({
    el: '#app',
    render: h => h(PlaygroundView),
    i18n,
  })
}
init()
