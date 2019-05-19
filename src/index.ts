import 'animate.css/animate.css'

import '@/styles/quasar.styl'
import '@/index.css'

// TODO JetBrainsIDE使用時の開発補助コード
import '@/pages/abc/index.vue'
import '@/pages/error404/index.vue'
import '@/pages/shopping/index.vue'

import {
  Notify,
  QAvatar,
  QBtn,
  QCard,
  QCardActions,
  QCardSection,
  QCheckbox,
  QDrawer,
  QHeader,
  QIcon,
  QImg,
  QInput,
  QItem,
  QItemLabel,
  QItemSection,
  QLayout,
  QList,
  QPage,
  QPageContainer,
  QScrollArea,
  QToolbar,
  QToolbarTitle,
  Quasar,
  Ripple,
} from 'quasar'
import { i18n, initI18n } from '@/base/i18n'
import AppView from '@/index.vue'
import Vue from 'vue'
import { currency } from '@/currency'
import { initAPI } from '@/api'
import { initConfig } from '@/base/config'
import { initLogic } from '@/logic'
import { initServiceWorker } from '@/base/service-worker'
import { initStore } from '@/store'
import { initUtils } from '@/base/utils'
import { vueRouter } from '@/base/router'

Vue.use(Quasar, {
  components: {
    QAvatar,
    QBtn,
    QCard,
    QCardActions,
    QCardSection,
    QCheckbox,
    QDrawer,
    QHeader,
    QIcon,
    QImg,
    QInput,
    QItem,
    QItemLabel,
    QItemSection,
    QLayout,
    QList,
    QPage,
    QPageContainer,
    QScrollArea,
    QToolbar,
    QToolbarTitle,
  },
  config: {
    notify: {},
  },
  directives: { Ripple },
  plugins: {
    Notify,
  },
})

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
    render: h => h(AppView),
    i18n,
  })
}
init()
