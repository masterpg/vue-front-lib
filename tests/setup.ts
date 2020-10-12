import * as firebase from 'firebase'
import { TextEncoder } from 'util'
import Vue from 'vue'
import VueCompositionApi from '@vue/composition-api'
import { clearProvidedDependency as clearProvidedDependency_app } from './helpers/app'
import { clearProvidedDependency as clearProvidedDependency_demo } from './helpers/demo'
import { createI18n } from '@/app/i18n'
import { quasar } from '@/app/quasar'
import td from 'testdouble'

//
// Jestの設定
//
jest.setTimeout(25000)

//
// testdoubleの設定
//
// 各テストファイルでtestdoubleをインポートしなくても使用できるようになる
window.td = td

//
// Composition API の設定
//
Vue.use(VueCompositionApi)
require('testdouble-jest')(td, jest)

//
// Quasarの設定
//
quasar.setup()

//
// Firebaseの設定
//
window.firebase = firebase

//
// その他の設定
//
// ファイルアップロードで必要となる
// https://github.com/facebook/jest/issues/9983#issuecomment-696427273
window.TextEncoder = TextEncoder

beforeEach(async () => {
  const i18n = createI18n()
  await i18n.load()
})

afterEach(function() {
  clearProvidedDependency_app()
  clearProvidedDependency_demo()
  td.reset()
})
