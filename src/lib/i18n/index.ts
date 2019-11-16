import Vue from 'vue'
import VueI18n from 'vue-i18n'
import axios from 'axios'
import { dateTimeFormats } from './date-time-formats'

Vue.use(VueI18n)

/**
 * 以下のソースコードをコピーして一部改変:
 * node_modules/vue-i18n/dist/vue-i18n.esm.js
 *
 * 改変理由:
 * comp-tree-viewはコンポーネントのインスタンス化をテンプレートに記述するのではなく
 * プログラムでnewしている。プログラムでnewした場合、$i18nのようにインジェクション
 * されないライブラリが存在する。この対応として$i18nがインジェクションされていない場合、
 * 以下のようにアプリケーションがインスタンス化したi18nを使用するよう改変している。
 */
Vue.prototype.$t = function(key) {
  const values: any[] = []
  let len = arguments.length - 1
  // eslint-disable-next-line prefer-rest-params
  while (len-- > 0) values[len] = arguments[len + 1]

  const currentI18n = this.$i18n || i18n
  // eslint-disable-next-line prefer-spread
  return currentI18n._t.apply(currentI18n, [key, currentI18n.locale, currentI18n._getMessages(), this].concat(values))
}

//========================================================================
//
//  Exports
//
//========================================================================

export let i18n: BaseI18n

export function setI18n(value: BaseI18n): void {
  i18n = value
}

export class LocaleData {
  constructor(locale: VueI18n.Locale)

  constructor(language: string, country: string)

  constructor(localeOrLanguage: VueI18n.Locale | string, country?: string) {
    if (country) {
      this.language = localeOrLanguage.toLowerCase()
      this.country = country.toUpperCase()
    } else {
      const array = localeOrLanguage.split('-')
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
 * 本プロジェクト用にVueI18nを拡張したクラスです。
 */
export abstract class BaseI18n extends VueI18n {
  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  constructor() {
    // スーパークラスのコンスタント呼び出し
    super({
      dateTimeFormats,
    })

    this.m_loadedLanguages = []
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private m_localeData!: LocaleData

  private m_loadedLanguages: string[]

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  /**
   * アプリケーションがサポートするロケール(言語+国)の配列です。
   * 国はその言語のデフォルトとなる国を指定します。
   * 例: ['ja-JP', 'en-US', 'de-DE']
   */
  protected abstract readonly supportLocales: LocaleData[]

  /**
   * デフォルトのロケール(言語+国)です。
   * 例: 'ja-JP'
   */
  protected abstract readonly defaultLocale: LocaleData

  /**
   *
   * @param language
   */
  protected abstract importLanguage(language: string): Promise<any>

  /**
   * 言語リソースを読み込みます。
   */
  async load(): Promise<void> {
    // ロケールデータを取得(ブラウザから)
    const localeData = this.m_getLocaleDataFromBrowser()
    const newLanguage = localeData.language

    // 現在の言語とロケールデータの言語が異なる場合、ロケールデータの言語をロード
    const currentLanguage = this.m_localeData ? this.m_localeData.language : ''
    if (currentLanguage !== newLanguage) {
      if (this.m_loadedLanguages.indexOf(newLanguage) === -1) {
        this.setLocaleMessage(newLanguage, await this.importLanguage(newLanguage))
        // const msgs = await import(/* webpackChunkName: "lang-[request]" */ `./lang/${newLanguage}`)
        // this.setLocaleMessage(newLanguage, msgs.default)
      }
    }

    // ロケールデータの設定
    this.m_setLocaleData(localeData)
  }

  d(value: number | Date, key?: VueI18n.Path, locale?: VueI18n.Locale): VueI18n.DateTimeFormatResult
  d(value: number | Date, args?: { [key: string]: string }): VueI18n.DateTimeFormatResult
  d(arg1: number | Date, arg2?: any, arg3?: any): VueI18n.DateTimeFormatResult {
    let locale: VueI18n.Locale
    // 引数にロケールが指定された場合
    if (arg3 && typeof arg3 === 'string') {
      // 指定されたロケールからロケールデータを作成
      const localeData = this.m_toLocaleData(arg3)
      // "en-US"や"ja-JP"などを設定
      locale = localeData.locale
    }
    // 上記以外の場合
    else {
      // ブラウザから取得されたロケールを設定
      locale = this.m_localeData.locale
    }
    return super.d(arg1, arg2, locale)
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  /**
   * ロケールデータを取得します。
   */
  private m_getLocaleDataFromBrowser(): LocaleData {
    // ブラウザから言語+国を取得("en"や"en-US"などを取得)
    const locale =
      (window.navigator.languages && window.navigator.languages[0]) ||
      window.navigator.language ||
      (window.navigator as any).userLanguage ||
      (window.navigator as any).browserLanguage
    // 取得した言語+国からロケールデータを作成
    return this.m_toLocaleData(locale)
  }

  /**
   * ロケールデータの設定を行います。
   * @param localeData
   */
  private m_setLocaleData(localeData: LocaleData): void {
    this.locale = localeData.language
    axios.defaults.headers.common['Accept-Language'] = localeData.language
    document.querySelector('html')!.setAttribute('lang', localeData.language)

    this.m_localeData = localeData

    this.m_loadedLanguages = this.m_loadedLanguages || []
    if (this.m_loadedLanguages.indexOf(localeData.language) === -1) {
      this.m_loadedLanguages.push(localeData.language)
    }
  }

  /**
   * ロケール文字列をロケールデータ(`LocaleData`)に変換します。
   * @param locale
   */
  private m_toLocaleData(locale: VueI18n.Locale): LocaleData {
    // 言語+国("en-US"など)を分割
    const { language, country } = this.m_splitLocale(locale)

    let result: LocaleData

    // 言語がサポートされている場合
    if (this.m_isLanguageSupported(language)) {
      if (country) {
        result = new LocaleData(language, country)
      } else {
        result = new LocaleData(language, this.m_getDefaultLanguageCountry(language)!)
      }
    }
    // 言語がサポートされていない場合
    else {
      result = this.defaultLocale
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
   * 指定された言語がサポートされるかを取得します。
   * @param language
   */
  private m_isLanguageSupported(language: string): boolean {
    for (const localeData of this.supportLocales) {
      if (localeData.language.toLowerCase() === language.toLowerCase()) {
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
    for (const localeData of this.supportLocales) {
      if (localeData.language === language) {
        return localeData.country
      }
    }
    return undefined
  }
}
