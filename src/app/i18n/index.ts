import Vue from 'vue'
import VueI18n from 'vue-i18n'
import axios from 'axios'
import { dateTimeFormats } from '@/app/i18n/date-time-formats'

Vue.use(VueI18n)

//========================================================================
//
//  Interfaces
//
//========================================================================

interface AppI18n extends VueI18n {
  /**
   * 対応する言語メッセージファイルをロードします。
   * @param locale ロケール('ja', 'en-US'等)を指定。
   */
  load(locale?: VueI18n.Locale): Promise<void>
}

interface AppI18nFuncs {
  i18n: AppI18n
  t: VueI18n['t']
  tc: VueI18n['tc']
  te: VueI18n['te']
  d: (value: number | Date, key?: VueI18n.Path, locale?: VueI18n.Locale) => VueI18n.DateTimeFormatResult
  n: VueI18n['n']
}

class LocaleData {
  constructor(locale: VueI18n.Locale)
  constructor(language: string, country: string)
  constructor(locale_or_language: VueI18n.Locale | string, country?: string) {
    if (country) {
      this.language = locale_or_language.toLowerCase()
      this.country = country.toUpperCase()
    } else {
      const array = locale_or_language.split('-')
      this.language = array[0].toLowerCase()
      this.country = array[1].toUpperCase()
    }
    this.locale = `${this.language}-${this.country}`
  }

  language: string

  country: string

  locale: VueI18n.Locale
}

/**
 * アプリケーションでサポートされるロケールです。
 * 配列の並びは重要で、言語(例えば'en')を使用する国('US', 'UK', 'CA', …)が複数ある場合、
 * この言語の配列的に先頭にあるロケールが、言語に対するデフォルトの国となります。
 *
 * @example
 * // この場合、言語'en'に対するデフォルトの国は’US’になります。
 * const SUPPORT_LOCALES = [
 *   new LocaleData('en-US'),
 *   new LocaleData('en-UK'),
 *   new LocaleData('en-CA'),
 * ]
 */
const SUPPORT_LOCALES = [new LocaleData('ja-JP'), new LocaleData('en-US')]

//========================================================================
//
//  Implementation
//
//========================================================================

class AppI18nImpl extends VueI18n implements AppI18n {
  //----------------------------------------------------------------------
  //
  //  Constructor
  //
  //----------------------------------------------------------------------

  constructor() {
    super({
      silentFallbackWarn: true,
      dateTimeFormats,
    })
    this.m_setupDefaultLocale()
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  m_localeData: LocaleData = null as any

  m_loadedLanguages: string[] = []

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  async load(locale?: VueI18n.Locale): Promise<void> {
    let localeData: LocaleData
    if (locale && typeof locale === 'string') {
      // 指定されたロケールからロケールデータを作成
      localeData = this.m_toLocaleData(locale)
    } else {
      // ロケールデータを取得(ブラウザから)
      localeData = this.m_getLocaleDataFromBrowser()
    }

    // 対応する言語メッセージファイルがロードされていない場合、ロードを行う
    const language = localeData.language
    if (this.m_loadedLanguages.indexOf(language) === -1) {
      this.setLocaleMessage(language, await this.loadLanguageFile(language))
    }

    // ロケールデータの設定
    this.m_setLocaleData(localeData)
  }

  d(value: number | Date, key_or_args?: VueI18n.Path | { [key: string]: string }, locale?: VueI18n.Locale): VueI18n.DateTimeFormatResult {
    if (typeof key_or_args === 'string') {
      const key = key_or_args
      // 引数にロケールが指定された場合
      if (locale) {
        // 指定されたロケールからロケールデータを作成
        const localeData = this.m_toLocaleData(locale)
        // 'en-US'や'ja-JP'などを設定
        locale = localeData.locale
      }
      // 上記以外の場合
      else {
        // 現在のロケールを設定
        locale = this.m_localeData.locale
      }
      return super.d(value, key, locale)
    } else if (typeof key_or_args === 'object') {
      const args = key_or_args
      return super.d(value, args)
    } else {
      return super.d(value)
    }
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  /**
   * 指定された言語に対応する言語メッセージファイルをロードします。
   * @param language ロードする言語('en', 'ja', …)を指定します。
   */
  protected async loadLanguageFile(language: string): Promise<VueI18n.LocaleMessageObject> {
    return (await import(/* webpackChunkName: "lang-[request]" */ `@/app/i18n/lang/${language}`)).default
  }

  /**
   * デフォルトのロケールを設定します。
   */
  private m_setupDefaultLocale() {
    const localeData = this.m_getLocaleDataFromBrowser()
    this.m_setLocaleData(localeData)
  }

  /**
   *  アプリケーションにロケールデータの設定を行います。
   * @param localeData
   */
  private m_setLocaleData(localeData: LocaleData): void {
    this.locale = localeData.language
    axios.defaults.headers.common['Accept-Language'] = localeData.language
    document.querySelector('html')!.setAttribute('lang', localeData.language)
    this.m_localeData = localeData
  }

  /**
   * ロケールデータを取得します。
   */
  private m_getLocaleDataFromBrowser(): LocaleData {
    // ブラウザから言語+国を取得('en'や'en-US'などを取得)
    const locale =
      (window.navigator.languages && window.navigator.languages[0]) ||
      window.navigator.language ||
      (window.navigator as any).userLanguage ||
      (window.navigator as any).browserLanguage
    // 取得した言語+国からロケールデータを作成
    return this.m_toLocaleData(locale)
  }

  /**
   * ロケール文字列('ja'や'en-US')をロケールデータ`LocaleData`に変換します。
   * @param locale
   */
  private m_toLocaleData(locale: VueI18n.Locale): LocaleData {
    // 言語+国('en-US'など)を分割
    const { language, country } = this.m_splitLocale(locale)

    let result: LocaleData

    // 指定された言語がサポートされている場合
    if (this.m_isLanguageSupported(language)) {
      // 国が指定されていた場合
      if (country) {
        result = new LocaleData(language, country)
      }
      // 国が指定されていなかった場合
      else {
        result = new LocaleData(language, this.m_getDefaultLanguageCountry(language)!)
      }
    }
    // 指定された言語がサポートされていない場合
    else {
      result = this.m_getLocaleDataFromBrowser()
    }

    return result
  }

  /**
   * ロケール(言語+国)を言語と国に分割します。
   * @param locale
   */
  private m_splitLocale(locale: string): { language: string; country?: string } {
    const array = locale.split('-')
    const language = array[0].toLowerCase()
    const country = array.length >= 2 ? array[1].toUpperCase() : undefined
    return { language, country }
  }

  /**
   * 指定された言語がサポートされるのかを取得します。
   * @param language
   */
  private m_isLanguageSupported(language: string): boolean {
    for (const localeData of SUPPORT_LOCALES) {
      if (localeData.language === language.toLowerCase()) {
        return true
      }
    }
    return false
  }

  /**
   * 指定された言語に対するデフォルトの国を取得します。
   * @param language
   */
  private m_getDefaultLanguageCountry(language: string): string | undefined {
    for (const localeData of SUPPORT_LOCALES) {
      if (localeData.language === language) {
        return localeData.country
      }
    }
    return undefined
  }
}

function useI18n(value?: AppI18n): AppI18nFuncs {
  ;(useI18n as any).i18n = value ?? (useI18n as any).i18n
  const i18n = (useI18n as any).i18n

  if (!i18n) {
    throw new Error(`An instance of VueI18n has not been created.`)
  }

  const t: AppI18nFuncs['t'] = (key: VueI18n.Path, ...values: any) => {
    return i18n.t(key, ...values)
  }

  const tc: AppI18nFuncs['tc'] = (key: VueI18n.Path, choice?: number, ...values: any) => {
    return i18n.tc(key, choice, ...values)
  }

  const te: AppI18nFuncs['te'] = (key: VueI18n.Path, locale?: VueI18n.Locale) => {
    return i18n.te(key, locale)
  }

  const d: AppI18nFuncs['d'] = (value: number | Date, ...args: any) => {
    return i18n.d(value, ...args)
  }

  const n: AppI18nFuncs['n'] = (value: number, ...args: any) => {
    return i18n.n(value, ...args)
  }

  return { i18n, t, tc, te, d, n }
}

function setupI18n(): AppI18n {
  const i18n = new AppI18nImpl()
  useI18n(i18n)
  return i18n
}

//========================================================================
//
//  Export
//
//========================================================================

export { AppI18n, AppI18nImpl, setupI18n, useI18n }
