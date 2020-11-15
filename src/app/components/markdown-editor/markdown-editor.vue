<style lang="sass">
.MarkdownEditor
  .markdown-body
    .warning
      background-color: #ff8
      padding: 20px
      border-radius: 6px
  .q-splitter__after
    // q-splitter使用における魔法の設定
    // 仕切りを｢%｣指定した場合、これを指定しないと正常にレイアウトされない。
    width: 0
</style>

<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.MarkdownEditor
  height: 100%
  overflow: hidden

.editor-container
  overflow: hidden

.result-container
  height: 100%
  overflow: hidden

  .result-html
    height: 100%
    padding: 2px 10px
    overflow: auto
    background-color: white
</style>

<template>
  <q-splitter v-model="splitterModel" class="MarkdownEditor splitter">
    <!-- Markdown入力エリア -->
    <template v-slot:before>
      <div class="layout vertical full-height">
        <div
          ref="editorContainer"
          class="editor-container flex-1"
          @mouseover="editorContainerOnStartScroll"
          @touchstart="editorContainerOnStartScroll"
        >
          <q-resize-observer @resize="onResize" />
        </div>
      </div>
    </template>
    <!-- Markdown出力エリア -->
    <template v-slot:after>
      <div class="layout vertical full-height">
        <div class="result-container">
          <div
            ref="resultHTML"
            class="result-html markdown-body"
            @mouseover="resultHTMLOnStartScroll"
            @touchstart="resultHTMLOnStartScroll"
            @wheel="resultHTMLOnStartScroll"
          />
        </div>
      </div>
    </template>
  </q-splitter>
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

import 'highlight.js/styles/github.css'
import * as monaco from 'monaco-editor'
import { Ref, defineComponent, onMounted, ref } from '@vue/composition-api'
import { Img } from '@/app/components/img/img.vue'
import MarkdownIt from 'markdown-it'
import { MarkdownItVueComponent } from '@/markdown-it'
import { RenderRule } from 'markdown-it/lib/renderer'
import cheatSheet from '@/demo/views/markdown/cheat-sheet.md'
import debounce from 'lodash/debounce'
import hljs from 'highlight.js'
import twemoji from 'twemoji'

interface MarkdownEditor extends MarkdownEditor.Props {}

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

namespace MarkdownEditor {
  export interface Props {
    size: string
    color: string
  }

  export const clazz = defineComponent({
    name: 'MarkdownEditor',

    components: {
      Img: Img.clazz,
    },

    props: {
      size: { type: String, default: '26px' },
      color: { type: String, default: 'grey-6' },
    },

    setup(props: Readonly<Props>, ctx) {
      //----------------------------------------------------------------------
      //
      //  Lifecycle hooks
      //
      //----------------------------------------------------------------------

      onMounted(() => {
        init()
      })

      //----------------------------------------------------------------------
      //
      //  Variables
      //
      //----------------------------------------------------------------------

      const editorContainer = ref<HTMLElement>()
      const resultHTML = ref<HTMLDivElement>()

      let editor: monaco.editor.IStandaloneCodeEditor | null = null

      let md: MarkdownIt = {} as any

      const mdParserDefaults = ref({}) as Ref<MarkdownIt.Options>

      let scrollLineItems: ScrollLineItem[] | null = null

      let syncEditorScrollDisposable: monaco.IDisposable | null = null

      /**
       * Markdownのエディタエリアと結果エリアのどちらがアクティブかを示す変数
       */
      const activeArea: Ref<'editor' | 'result' | null> = ref(null)

      /**
       * 左右のペインを隔てるスプリッターの左ペインの幅(%)
       */
      const splitterModel = ref(50)

      //----------------------------------------------------------------------
      //
      //  Internal methods
      //
      //----------------------------------------------------------------------

      function init(): void {
        updateResult = debounce(updateResultFunc, 300, { maxWait: 500 })
        syncResultScroll = debounce(syncResultScrollFunc, 50, { maxWait: 50 })
        syncEditorScroll = debounce(syncEditorScrollFunc, 50, { maxWait: 50 })

        //
        // Monacoエディタの生成
        //

        editor = monaco.editor.create(editorContainer.value!, {
          value: cheatSheet,
          language: 'markdown',
          minimap: {
            enabled: false,
          },
          wordWrap: 'on',
          // lineNumbers: 'off',
        })

        editor.onDidChangeModelContent(e => {
          updateResult()
        })

        editorContainer.value!.firstChild!.addEventListener('wheel', editorContainerOnStartScroll)

        //
        // Markdownパーサーの設定
        //

        // https://markdown-it.github.io/markdown-it/#MarkdownIt.new
        mdParserDefaults.value = {
          html: false,
          xhtmlOut: false,
          breaks: true,
          langPrefix: 'language-',
          linkify: true,
          typographer: true,
        }

        mdParserDefaults.value.highlight = (str, lang) => {
          const esc = md.utils.escapeHtml

          try {
            if (lang && lang !== 'auto' && hljs.getLanguage(lang)) {
              return `<pre class="hljs language-${esc(lang.toLowerCase())}"><code>${hljs.highlight(lang, str, true).value}</code></pre>`
            } else if (lang === 'auto') {
              const result = hljs.highlightAuto(str)
              return `<pre class="hljs language-${esc(result.language!)}"><code>${result.value}</code></pre>`
            }
          } catch (err) {
            console.error(err)
          }

          return `<pre class="hljs"><code>${esc(str)}</code></pre>`
        }

        mdParserInit()
        updateResult()
      }

      /**
       * Markdownパーサーの初期化を行います。
       */
      function mdParserInit(): void {
        md = new MarkdownIt(mdParserDefaults.value)
          .use(require('markdown-it-abbr'))
          .use(require('markdown-it-container'), 'warning')
          .use(require('markdown-it-deflist'))
          .use(require('markdown-it-emoji'))
          .use(require('markdown-it-footnote'))
          .use(require('markdown-it-ins'))
          .use(require('markdown-it-mark'))
          .use(require('markdown-it-sub'))
          .use(require('markdown-it-sup'))
          .use(MarkdownItVueComponent, {
            components: { Img: Img.clazz },
          })

        // Beautify output of parser for html content
        // md.renderer.rules.table_open = function() {
        //   return '<table class="table table-striped">\n'
        // }

        // Replace emoji codes with images
        // md.renderer.rules.emoji = function(token, idx) {
        //   return twemoji.parse(token[idx].content)
        // }

        // エディタエリアのスクロールに結果エリアを同期させるため、
        // <p>, <h1>-<h6>要素の属性に行番号を付与する
        const injectLineNumbers: RenderRule = (tokens, idx, options, env, slf) => {
          if (tokens[idx].map && tokens[idx].level === 0) {
            const line = tokens[idx].map![0] + 1
            tokens[idx].attrJoin('class', 'line')
            tokens[idx].attrSet('data-line', String(line))
          }
          return slf.renderToken(tokens, idx, options)
        }

        md.renderer.rules.paragraph_open = injectLineNumbers
        md.renderer.rules.heading_open = injectLineNumbers
      }

      /**
       * 入力されたMarkdownテキストをパースして結果エリアへ出力します。
       */
      let updateResult!: () => void

      function updateResultFunc(): void {
        if (!editor) return

        const source = editor.getValue()
        resultHTML.value!.innerHTML = md.render(source)

        scrollLineItems = null
      }

      /**
       * エディタエリアまたは結果エリアをスクロールした際にスクロールを
       * 同期させるためのデータを作成します。
       */
      function buildScrollLineItems(): ScrollLineItem[] | null {
        if (!editor) return null

        const editorModel = editor.getModel()
        if (!editorModel) return null

        const result: ScrollLineItem[] = []

        // エディタエリアの行数分ループ
        for (let i = 0; i < editorModel.getLineCount(); i++) {
          const line = i + 1
          const lineItem: ScrollLineItem = { line, editorTop: -1, resultTop: -1 }
          result[i] = lineItem
          // エディタエリアのトップから指定行までの距離を取得
          lineItem.editorTop = editor.getTopForLineNumber(line)
        }

        // 結果エリアに出力された'.line'CSSクラスが付与された要素を取得しループ
        const resultLinesEl = Array.from<HTMLElement>(resultHTML.value!.querySelectorAll('.line'))
        for (const resultLineEl of resultLinesEl) {
          // 行要素から'data-line'属性の値(行番号)を取得
          const resultLineStr = resultLineEl.getAttribute('data-line')
          if (!resultLineStr) continue

          const resultLineIndex = parseInt(resultLineStr) - 1
          const lineItem = result[resultLineIndex]
          if (!lineItem) continue

          // 結果エリアのトップから行要素までの距離を取得
          const resultHTMLStyle = window.getComputedStyle(resultHTML.value!)
          const offsetTop = Math.round(parseFloat(resultHTMLStyle.paddingTop || '0')) + resultHTML.value!.offsetTop
          lineItem.resultTop = Math.round(resultLineEl.offsetTop - offsetTop)
        }

        // ｢先頭行｣と｢末尾行｣のMarkdown結果トップ位置を設定
        result[0].resultTop = 0
        result[result.length - 1].resultTop = resultHTML.value!.scrollHeight

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
      let syncResultScroll!: () => void

      function syncResultScrollFunc(): void {
        if (!editor) return

        if (!scrollLineItems) {
          scrollLineItems = buildScrollLineItems()
        }
        if (!scrollLineItems) return

        const scrollTop = editor.getScrollTop()
        for (let i = 0; i < scrollLineItems.length; i++) {
          const lastIndex = scrollLineItems.length - 1
          const currentLine = scrollLineItems[i]
          const nextLine = i === lastIndex ? null : scrollLineItems[i + 1]

          if (nextLine === null) {
            resultHTML.value!.scrollTop = scrollLineItems[lastIndex].resultTop
          } else if (currentLine.editorTop <= scrollTop && scrollTop < nextLine.editorTop) {
            resultHTML.value!.scrollTop = currentLine.resultTop
            break
          }
        }
      }

      /**
       * 結果エリアのスクロールにエディタエリアを同期させる処理を行います。
       */
      let syncEditorScroll!: () => void

      function syncEditorScrollFunc(): void {
        if (!editor) return

        if (!scrollLineItems) {
          scrollLineItems = buildScrollLineItems()
        }
        if (!scrollLineItems) return

        const scrollTop = resultHTML.value!.scrollTop
        for (let i = 0; i < scrollLineItems.length; i++) {
          const lastIndex = scrollLineItems.length - 1
          const currentLine = scrollLineItems[i]
          const nextLine = i === lastIndex ? null : scrollLineItems[i + 1]

          if (nextLine === null) {
            editor.setScrollTop(scrollLineItems[lastIndex].editorTop)
          } else if (currentLine.resultTop <= scrollTop && scrollTop < nextLine.resultTop) {
            editor.setScrollTop(currentLine.editorTop)
            break
          }
        }
      }

      function myParseInt(value: string): number {
        if (!value || value === '') {
          return 0
        }

        const parsedValue = parseInt(value, 10)
        if (isNaN(parsedValue)) {
          return 0
        }

        return parsedValue
      }

      //----------------------------------------------------------------------
      //
      //  Event handlers
      //
      //----------------------------------------------------------------------

      function onResize(size: { width: string; height: string }) {
        if (!editor) return

        updateResult()
        editor.layout({
          width: myParseInt(size.width),
          height: myParseInt(size.height),
        })
      }

      /**
       * エディタエリアのスクロールが開始される際のリスナです。
       */
      function editorContainerOnStartScroll() {
        if (activeArea.value === 'editor') return
        activeArea.value = 'editor'

        resultHTML.value!.removeEventListener('scroll', syncEditorScroll)
        if (!syncEditorScrollDisposable) {
          syncEditorScrollDisposable = editor!.onDidScrollChange(syncResultScroll)
        }
      }

      /**
       * 結果エリアのスクロールが開始される際のリスナです。
       */
      function resultHTMLOnStartScroll() {
        if (activeArea.value === 'result') return
        activeArea.value = 'result'

        if (syncEditorScrollDisposable) {
          syncEditorScrollDisposable.dispose()
          syncEditorScrollDisposable = null
        }
        resultHTML.value!.removeEventListener('scroll', syncEditorScroll)
        resultHTML.value!.addEventListener('scroll', syncEditorScroll)
      }

      //----------------------------------------------------------------------
      //
      //  Result
      //
      //----------------------------------------------------------------------

      return {
        editorContainer,
        resultHTML,
        splitterModel,
        onResize,
        editorContainerOnStartScroll,
        resultHTMLOnStartScroll,
      }
    },
  })
}

export default MarkdownEditor.clazz
export { MarkdownEditor }
</script>
