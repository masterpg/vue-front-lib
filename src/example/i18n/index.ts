import { BaseI18n, LocaleData, setI18n } from '@/lib'

//========================================================================
//
//  Implementation
//
//========================================================================

class AppI18n extends BaseI18n {
  protected get supportLocales(): LocaleData[] {
    return [new LocaleData('ja-JP'), new LocaleData('en-US')]
  }

  protected get defaultLocale(): LocaleData {
    return this.supportLocales[0]
  }

  protected async importLanguage(language: string): Promise<any> {
    const msgs = await import(/* webpackChunkName: "lang-[request]" */ `@/example/lang/${language}`)
    return msgs.default
  }
}

let i18n: AppI18n

async function initI18n(): Promise<void> {
  i18n = new AppI18n()
  await i18n.load()
  setI18n(i18n)
}

//========================================================================
//
//  Exports
//
//========================================================================

export { i18n, initI18n }
