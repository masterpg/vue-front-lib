import Vue from 'vue'
import VueCompositionApi from '@vue/composition-api'
import { clearProvidedDependency } from './helpers/app'
import { createI18n } from '@/app/i18n'
import { quasar } from '@/app/quasar'
import td from 'testdouble'
import * as firebase from '@firebase/testing'

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

beforeEach(async () => {
  const i18n = createI18n()
  await i18n.load()
})

afterEach(function() {
  clearProvidedDependency()
  td.reset()
})
