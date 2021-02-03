import { TextEncoder } from 'util'
import Vue from 'vue'
import VueCompositionApi from '@vue/composition-api'
import { clearProvidedDependency as clearProvidedDependency_app } from './helpers/app'
import { clearProvidedDependency as clearProvidedDependency_demo } from './helpers/demo'
// demoにはappの言語リソースが全て含まれるのでdemoのi18nをインポートしている
import { quasar } from '@/app/quasar'
import { setupConfig } from '@/app/config'
import { setupRouter as setupDemoRouter } from '@/app/router'
import { setupI18n } from '@/demo/i18n'
import { setupRouter } from '@/app/router'
import td from 'testdouble'

//
// Jestの設定
//
jest.setTimeout(5000)

//
// testdoubleの設定
//
require('testdouble-jest')(td, jest)
// 各テストファイルでtestdoubleをインポートしなくても使用できるようになる
window.td = td

//
// Composition API の設定
//
Vue.use(VueCompositionApi)

//
// Quasarの設定
//
quasar.setup()

//
// その他の設定
//
// ファイルアップロードで必要となる
// https://github.com/facebook/jest/issues/9983#issuecomment-696427273
window.TextEncoder = TextEncoder

beforeEach(async () => {
  setupConfig()
  setupRouter()
  setupDemoRouter()
  const i18n = setupI18n()
  await i18n.load()
})

afterEach(() => {
  clearProvidedDependency_app()
  clearProvidedDependency_demo()
  td.reset()
})
