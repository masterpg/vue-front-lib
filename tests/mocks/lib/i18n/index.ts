import { BaseI18n, LocaleData, setI18n } from '@/lib'

//========================================================================
//
//  Internal
//
//========================================================================

class MockI18n extends BaseI18n {
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

//========================================================================
//
//  Exports
//
//========================================================================

export let i18n: MockI18n

export async function initLibTestI18n(): Promise<void> {
  i18n = new MockI18n()
  await i18n.load()
  setI18n(i18n)
}
