import 'animate.css/animate.css'
import '@/app/styles/app.sass'

import { AppMainArticleTreeNodeData } from '@/app/views/main/app-main-article-tree-node.vue'
import AppMainPage from '@/app/views/main'
import { TreeNodeData } from '@/app/components/tree-view'
import Vue from 'vue'
import VueCompositionApi from '@vue/composition-api'
import firebase from 'firebase/app'
import { quasar } from '@/app/quasar'
import { useConfig } from '@/app/config'
import { useI18n } from '@/app/i18n'
import { useRouter } from '@/app/router'

// モバイル端末でビューポートのサイズが正しく取得されない問題の対応
// ※フルスクリーンアプリの場合、ビューポートのサイズを誤認してしまい、
//   フルスクリーンを想定したページが画面からはみ出たりする。
require('viewport-units-buggyfill').init({ force: true })

// Vueの設定
Vue.config.productionTip = false
Vue.use(VueCompositionApi)

// Quasarの設定
quasar.setup()
quasar.setupExtras()

async function init() {
  const config = useConfig()
  firebase.initializeApp(config.firebase)
  const router = useRouter()
  const { i18n } = useI18n()
  await i18n.load()

  new Vue({
    router,
    i18n,
    render: h => h(AppMainPage),
  }).$mount('#app')
}
init()

// type Func<T extends TreeNodeData = TreeNodeData> = (data: T) => void
//
// const func: Func<AppMainArticleTreeNodeData> = data => {
//   console.log(data.id)
// }

type Func<T extends TreeNodeData = TreeNodeData> = (data: T) => void

const func: Func = ((data: AppMainArticleTreeNodeData) => {
  console.log(data.id)
}) as Func

// const func: Func = (data => {
//   console.log(data.id)
// }) as Func<AppMainArticleTreeNodeData>

// const func: Func<AppMainArticleTreeNodeData> = data => {
//   console.log(data.id)
// }
