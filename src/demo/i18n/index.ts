import { AppI18n, AppI18nFuncs, AppI18nImpl, useI18n as _useI18n } from '@/app/i18n'
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

namespace DemoI18n {
  let instance: AppI18n

  export function getInstance(): AppI18n {
    instance = instance ?? newInstance()
    return instance
  }

  function newInstance(): AppI18n {
    return new DemoI18nImpl()
  }
}

function useI18n(): AppI18nFuncs {
  return _useI18n(DemoI18n.getInstance())
}

//========================================================================
//
//  Exports
//
//========================================================================

export { useI18n }
