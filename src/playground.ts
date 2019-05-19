import '@quasar/extras/roboto-font/roboto-font.css'
import '@quasar/extras/material-icons/material-icons.css'

import '@/styles/quasar.styl'
import '@/index.css'

import { QBtn, QCard, QCardActions, QCardSection, Quasar } from 'quasar'
import { i18n, initI18n } from '@/base/i18n'
import PlaygroundView from '@/playground.vue'
import Vue from 'vue'

Vue.use(Quasar, {
  config: {},
  components: {
    QBtn,
    QCard,
    QCardActions,
    QCardSection,
  },
  directives: {},
  plugins: {},
})

Vue.use(Quasar, {
  config: {},
})

async function init() {
  await initI18n()

  new Vue({
    el: '#app',
    render: h => h(PlaygroundView),
    i18n,
  })
}
init()
