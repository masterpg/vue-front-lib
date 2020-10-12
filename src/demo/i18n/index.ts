import { AppI18n, AppI18nImpl, useI18n } from '@/app/i18n'
import VueI18n from 'vue-i18n'

//========================================================================
//
//  Implementation
//
//========================================================================

class DemoI18nImpl extends AppI18nImpl {
  protected async loadLanguageFile(language: string): Promise<VueI18n.LocaleMessageObject> {
    return (await import(/* webpackChunkName: "lang-demo-[request]" */ `@/demo/i18n/lang/${language}`)).default
  }
}

function createI18n(): AppI18n {
  const i18n = new DemoI18nImpl()
  useI18n(i18n)
  return i18n
}

//========================================================================
//
//  Exports
//
//========================================================================

export { AppI18n, createI18n, useI18n }
