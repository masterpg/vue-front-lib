import '@quasar/extras/roboto-font/roboto-font.css'
import '@quasar/extras/material-icons/material-icons.css'
import '@quasar/extras/fontawesome-v5/fontawesome-v5.css'
import 'animate.css/animate.css'

import '@/index.styl'

// TODO JetBrainsIDE使用時の開発補助コード
// import '@/views/abc-page/index.vue'
// import '@/views/error404-page/index.vue'
// import '@/views/shop-page/index.vue'
// import '@/views/demo/comp-tree-view-page/index.vue'

import {
  ClosePopup,
  Dialog,
  Loading,
  Notify,
  QAvatar,
  QBar,
  QBtn,
  QBtnToggle,
  QCard,
  QCardActions,
  QCardSection,
  QCheckbox,
  QDialog,
  QDrawer,
  QExpansionItem,
  QForm,
  QHeader,
  QIcon,
  QImg,
  QInput,
  QItem,
  QItemLabel,
  QItemSection,
  QLayout,
  QLinearProgress,
  QList,
  QMenu,
  QPage,
  QPageContainer,
  QScrollArea,
  QSeparator,
  QSpace,
  QSplitter,
  QToolbar,
  QToolbarTitle,
  QTooltip,
  Quasar,
  Ripple,
} from 'quasar'
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

Vue.use(Quasar, {
  components: {
    QAvatar,
    QBar,
    QBtn,
    QBtnToggle,
    QCard,
    QCardActions,
    QCardSection,
    QCheckbox,
    QDialog,
    QDrawer,
    QExpansionItem,
    QForm,
    QHeader,
    QIcon,
    QImg,
    QInput,
    QItem,
    QItemLabel,
    QItemSection,
    QLayout,
    QLinearProgress,
    QList,
    QMenu,
    QPage,
    QPageContainer,
    QScrollArea,
    QSeparator,
    QSpace,
    QSplitter,
    QToolbar,
    QToolbarTitle,
    QTooltip,
  },
  config: {
    notify: {},
    loading: {},
  },
  directives: {
    ClosePopup,
    Ripple,
  },
  plugins: {
    Dialog,
    Loading,
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
    render: h => h(AppPage),
    i18n,
  })
}
init()
