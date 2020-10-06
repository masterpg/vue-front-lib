<style lang="sass">
.markdown-page-main .markdown-body
  .warning
    background-color: #ff8
    padding: 20px
    border-radius: 6px
</style>

<style lang="sass" scoped>
@import 'src/example/styles/app.variables'

.markdown-page-main
  height: 100%
  padding: 20px
  overflow: hidden

.divider
  width: 20px

.editor-container
  overflow: hidden
  border: 1px solid #e3e3e2

.result-container
  overflow: hidden

  .result-html
    padding: 2px 10px
    overflow: auto
    background-color: white
    border: 1px solid #e3e3e2
</style>

<template>
  <div class="markdown-page-main" @component-resize="m_onComponentResize">
    <div class="full-height layout horizontal">
      <!-- Markdown入力エリア -->
      <div
        ref="editorContainer"
        class="flex-1 editor-container"
        @mouseover="m_editorContainerOnStartScroll"
        @touchstart="m_editorContainerOnStartScroll"
      />
      <!-- 区切り -->
      <div class="divider" />
      <!-- Markdown結果エリア -->
      <div class="flex-1 result-container full-height">
        <div
          ref="resultHTML"
          class="result-html markdown-body full-height"
          @mouseover="m_resultHTMLOnStartScroll"
          @touchstart="m_resultHTMLOnStartScroll"
          @wheel="m_resultHTMLOnStartScroll"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
/**
 * markdown-it:
 * - GitHub: https://github.com/markdown-it/markdown-it
 * - API: https://markdown-it.github.io/markdown-it/
 * - Demo: https://markdown-it.github.io/
 *
 * Monaco Editor:
 * - GitHub: https://github.com/Microsoft/monaco-editor
 * - API: https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.istandalonecodeeditor.html
 * - Playground: https://microsoft.github.io/monaco-editor/playground.html
 */

import * as monaco from 'monaco-editor'
import { BaseComponent, CompImg, NoCache, Resizable } from '@/lib'
import { Component } from 'vue-property-decorator'
import MarkdownIt from 'markdown-it'
import MarkdownItAddr from 'markdown-it-abbr'
import MarkdownItContainer from 'markdown-it-container'
import MarkdownItDeflist from 'markdown-it-deflist'
import MarkdownItEmoji from 'markdown-it-emoji'
import MarkdownItFootnote from 'markdown-it-footnote'
import MarkdownItIns from 'markdown-it-ins'
import MarkdownItMark from 'markdown-it-mark'
import MarkdownItSub from 'markdown-it-sub'
import MarkdownItSup from 'markdown-it-sup'
import { MarkdownItVueComponent } from '@/example/markdown-it'
import cheatSheet from './cheat-sheet.md'
import debounce from 'lodash/debounce'
import hljs from 'highlight.js'
import { mixins } from 'vue-class-component'

/**
 * エディタエリアと結果エリアのスクロール情報を格納するデータクラスです。
 */
interface ScrollLineItem {
  // 行番号
  line: number
  // エディタ行のトップ位置
  editorTop: number
  // Markdown結果行のトップ位置
  resultTop: number
}

@Component({ components: {} })
export default class MarkdownPage extends mixins(BaseComponent, Resizable) {
  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  mounted() {
    this.m_updateResult = debounce(this.m_updateResultFunc, 300, { maxWait: 500 })
    this.m_syncResultScroll = debounce(this.m_syncResultScrollFunc, 50, { maxWait: 50 })
    this.m_syncEditorScroll = debounce(this.m_syncEditorScrollFunc, 50, { maxWait: 50 })

    //
    // Monacoエディタの生成
    //

    this.m_editor = monaco.editor.create(this.m_editorContainer, {
      value: cheatSheet,
      language: 'markdown',
      minimap: {
        enabled: false,
      },
      wordWrap: 'on',
      // lineNumbers: 'off',
    })

    this.m_editor.onDidChangeModelContent(e => {
      this.m_updateResult()
    })

    this.m_editorContainer.firstChild!.addEventListener('wheel', this.m_editorContainerOnStartScroll)

    //
    // Markdownパーサーの設定
    //

    // https://markdown-it.github.io/markdown-it/#MarkdownIt.new
    this.m_mdParserDefaults = {
      html: false,
      xhtmlOut: false,
      breaks: true,
      langPrefix: 'language-',
      linkify: true,
      typographer: true,
    }

    this.m_mdParserDefaults.highlight = (str, lang) => {
      const esc = this.m_md.utils.escapeHtml

      try {
        if (lang && lang !== 'auto' && hljs.getLanguage(lang)) {
          return `<pre class="hljs language-${esc(lang.toLowerCase())}"><code>${hljs.highlight(lang, str, true).value}</code></pre>`
        } else if (lang === 'auto') {
          const result = hljs.highlightAuto(str)
          return `<pre class="hljs language-${esc(result.language)}"><code>${result.value}</code></pre>`
        }
      } catch (err) {
        console.error(err)
      }

      return `<pre class="hljs"><code>${esc(str)}</code></pre>`
    }

    this.m_mdParserInit()
    this.m_updateResult()
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private m_editor: monaco.editor.IStandaloneCodeEditor | null = null

  private m_md: MarkdownIt = {} as any

  private m_mdParserDefaults: MarkdownIt.Options = {} as any

  private m_scrollLineItems: ScrollLineItem[] | null = null

  private m_syncEditorScrollDisposable: monaco.IDisposable | null = null

  /**
   * Markdownのエディタエリアと結果エリアのどちらがアクティブかを示す変数
   */
  private m_activeArea: 'editor' | 'result' | null = null

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

  @NoCache
  get m_editorContainer(): HTMLElement {
    return this.$refs.editorContainer as HTMLElement
  }

  @NoCache
  get m_resultHTML(): HTMLDivElement {
    return this.$refs.resultHTML as HTMLDivElement
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  /**
   * Markdownパーサーの初期化を行います。
   */
  private m_mdParserInit() {
    this.m_md = new MarkdownIt(this.m_mdParserDefaults)
      .use(MarkdownItAddr)
      .use(MarkdownItContainer, 'warning')
      .use(MarkdownItDeflist)
      .use(MarkdownItEmoji)
      .use(MarkdownItFootnote)
      .use(MarkdownItIns)
      .use(MarkdownItMark)
      .use(MarkdownItSub)
      .use(MarkdownItSup)
      .use(MarkdownItVueComponent, {
        components: { CompImg },
      })

    // Beautify output of parser for html content
    // this.m_md.renderer.rules.table_open = function() {
    //   return '<table class="table table-striped">\n'
    // }

    // Replace emoji codes with images
    // this.m_md.renderer.rules.emoji = function(token, idx) {
    //   return (window as any).twemoji.parse(token[idx].content)
    // }

    // エディタエリアのスクロールに結果エリアを同期させるため、
    // <p>, <h1>-<h6>要素の属性に行番号を付与する
    const injectLineNumbers: MarkdownIt.TokenRender = (tokens, idx, options, env, slf) => {
      if (tokens[idx].map && tokens[idx].level === 0) {
        const line = tokens[idx].map[0] + 1
        tokens[idx].attrJoin('class', 'line')
        tokens[idx].attrSet('data-line', String(line))
      }
      return slf.renderToken(tokens, idx, options)
    }

    this.m_md.renderer.rules.paragraph_open = injectLineNumbers
    this.m_md.renderer.rules.heading_open = injectLineNumbers
  }

  /**
   * 入力されたMarkdownテキストをパースして結果エリアへ出力します。
   */
  private m_updateResult!: () => void

  private m_updateResultFunc(): void {
    if (!this.m_editor) return

    const source = this.m_editor!.getValue()
    this.m_resultHTML.innerHTML = this.m_md.render(source)
    // this.m_resultHTML.innerHTML = this.m_md.renderInline('__markdown-it__ rulezz!')

    this.m_scrollLineItems = null
  }

  /**
   * エディタエリアまたは結果エリアをスクロールした際にスクロールを
   * 同期させるためのデータを作成します。
   */
  private buildScrollLineItems(): ScrollLineItem[] | null {
    if (!this.m_editor) return null

    const editorModel = this.m_editor.getModel()
    if (!editorModel) return null

    const result: ScrollLineItem[] = []

    // エディタエリアの行数分ループ
    for (let i = 0; i < editorModel.getLineCount(); i++) {
      const line = i + 1
      const lineItem: ScrollLineItem = { line, editorTop: -1, resultTop: -1 }
      result[i] = lineItem
      // エディタエリアのトップから指定行までの距離を取得
      lineItem.editorTop = this.m_editor.getTopForLineNumber(line)
    }

    // 結果エリアに出力された'.line'CSSクラスが付与された要素を取得しループ
    const resultLinesEl = Array.from<HTMLElement>(this.m_resultHTML.querySelectorAll('.line'))
    for (const resultLineEl of resultLinesEl) {
      // 行要素から'data-line'属性の値(行番号)を取得
      const resultLineStr = resultLineEl.getAttribute('data-line')
      if (!resultLineStr) continue

      const resultLineIndex = parseInt(resultLineStr) - 1
      const lineItem = result[resultLineIndex]
      if (!lineItem) continue

      // 結果エリアのトップから行要素までの距離を取得
      const resultHTMLStyle = window.getComputedStyle(this.m_resultHTML)
      const offsetTop = Math.round(parseFloat(resultHTMLStyle.paddingTop || '0')) + this.m_resultHTML.offsetTop
      lineItem.resultTop = Math.round(resultLineEl.offsetTop - offsetTop)
    }

    // ｢先頭行｣と｢末尾行｣のMarkdown結果トップ位置を設定
    result[0].resultTop = 0
    result[result.length - 1].resultTop = this.m_resultHTML.scrollHeight

    // 指定行インデックスより前にあるスクロールアイテムで、
    // 結果エリアのトップ位置が設定されているものを取得する関数
    const getPrevScrollItem = (currentIndex: number) => {
      for (let i = currentIndex - 1; i >= 0; i--) {
        const resultTop = result[i].resultTop
        if (resultTop !== -1) return result[i]
      }
      throw new Error('Unreachable code reached.')
    }

    // 指定行インデックスより後にあるスクロールアイテムで、
    // 結果トップエリアの位置が設定されているものを取得する関数
    const getFollowScrollItem = (currentIndex: number) => {
      for (let i = currentIndex + 1; i < result.length; i++) {
        const resultTop = result[i].resultTop
        if (resultTop !== -1) return result[i]
      }
      throw new Error('Unreachable code reached.')
    }

    // 結果エリアのトップ位置が設定されていないスクロールアイテムの補正値を設定
    for (let i = 0; i < editorModel.getLineCount(); i++) {
      const lineItem = result[i]
      if (lineItem.resultTop === -1) {
        const prev = getPrevScrollItem(i)
        const follow = getFollowScrollItem(i)
        const distance = follow.resultTop - prev.resultTop // スクロールアイテム間の距離
        const numer = lineItem.line - prev.line // 分子
        const denom = follow.line - prev.line // 分母
        lineItem.resultTop = Math.round(prev.resultTop + (distance / denom) * numer)
      }
    }

    return result
  }

  /**
   * エディタエリアのスクロールに結果エリアを同期させる処理を行います。
   */
  private m_syncResultScroll!: () => void

  private m_syncResultScrollFunc(): void {
    if (!this.m_editor) return

    if (!this.m_scrollLineItems) {
      this.m_scrollLineItems = this.buildScrollLineItems()
    }
    if (!this.m_scrollLineItems) return

    const scrollTop = this.m_editor.getScrollTop()
    for (let i = 0; i < this.m_scrollLineItems.length; i++) {
      const lastIndex = this.m_scrollLineItems.length - 1
      const currentLine = this.m_scrollLineItems[i]
      const nextLine = i === lastIndex ? null : this.m_scrollLineItems[i + 1]

      if (nextLine === null) {
        this.m_resultHTML.scrollTop = this.m_scrollLineItems[lastIndex].resultTop
      } else if (currentLine.editorTop <= scrollTop && scrollTop < nextLine.editorTop) {
        this.m_resultHTML.scrollTop = currentLine.resultTop
        break
      }
    }
  }

  /**
   * 結果エリアのスクロールにエディタエリアを同期させる処理を行います。
   */
  private m_syncEditorScroll!: () => void

  private m_syncEditorScrollFunc(): void {
    if (!this.m_editor) return

    if (!this.m_scrollLineItems) {
      this.m_scrollLineItems = this.buildScrollLineItems()
    }
    if (!this.m_scrollLineItems) return

    const scrollTop = this.m_resultHTML.scrollTop
    for (let i = 0; i < this.m_scrollLineItems.length; i++) {
      const lastIndex = this.m_scrollLineItems.length - 1
      const currentLine = this.m_scrollLineItems[i]
      const nextLine = i === lastIndex ? null : this.m_scrollLineItems[i + 1]

      if (nextLine === null) {
        this.m_editor.setScrollTop(this.m_scrollLineItems[lastIndex].editorTop)
      } else if (currentLine.resultTop <= scrollTop && scrollTop < nextLine.resultTop) {
        this.m_editor.setScrollTop(currentLine.editorTop)
        break
      }
    }
  }

  //----------------------------------------------------------------------
  //
  //  Event handlers
  //
  //----------------------------------------------------------------------

  private m_onComponentResize(e) {
    if (!this.m_editor) return
    this.m_editor.layout({
      width: this.m_editorContainer.clientWidth,
      height: this.m_editorContainer.clientHeight,
    })
  }

  /**
   * エディタエリアのスクロールが開始される際のリスナです。
   */
  private m_editorContainerOnStartScroll() {
    if (this.m_activeArea === 'editor') return
    this.m_activeArea = 'editor'

    this.m_resultHTML.removeEventListener('scroll', this.m_syncEditorScroll)
    if (!this.m_syncEditorScrollDisposable) {
      this.m_syncEditorScrollDisposable = this.m_editor!.onDidScrollChange(this.m_syncResultScroll)
    }
  }

  /**
   * 結果エリアのスクロールが開始される際のリスナです。
   */
  private m_resultHTMLOnStartScroll() {
    if (this.m_activeArea === 'result') return
    this.m_activeArea = 'result'

    if (this.m_syncEditorScrollDisposable) {
      this.m_syncEditorScrollDisposable.dispose()
      this.m_syncEditorScrollDisposable = null
    }
    this.m_resultHTML.removeEventListener('scroll', this.m_syncEditorScroll)
    this.m_resultHTML.addEventListener('scroll', this.m_syncEditorScroll)
  }
}
</script>
