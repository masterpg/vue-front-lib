import '@quasar/extras/roboto-font/roboto-font.css'
import '@quasar/extras/material-icons/material-icons.css'
import '@quasar/extras/fontawesome-v5/fontawesome-v5.css'

import '@/app/styles/app.sass'

import { QBtn, QCard, QCardActions, QCardSection, Quasar } from 'quasar'
import { i18n, initI18n } from '@/app/i18n'
import PlaygroundPage from '@/app/playground.vue'
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

async function init() {
  await initI18n()

  new Vue({
    el: '#app',
    render: h => h(PlaygroundPage),
    i18n,
  })
}
init()
