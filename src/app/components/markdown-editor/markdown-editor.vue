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

.preview-container
  height: 100%
  overflow: hidden

  .preview-html
    height: 100%
    padding: 2px 10px
    overflow: auto
    background-color: white

.control-bar
  height: 34px
  background-color: $grey-3
  border-bottom: 1px solid #e3e3e2
  padding: 0 4px
</style>

<template>
  <q-splitter v-model="splitterModel" class="MarkdownEditor splitter" :limits="[0, 100]">
    <!-- エディターエリア -->
    <template v-slot:before>
      <div class="layout vertical full-height">
        <div class="control-bar layout horizontal center">
          <div class="flex-1" />
          <q-btn v-show="viewType === 'editor'" icon="chevron_left" color="primary" size="sm" padding="xs" flat @click="splitButtonOnClick" />
          <q-btn v-show="viewType === 'editor'" icon="first_page" color="primary" size="sm" padding="xs" flat @click="previewButtonOnClick" />
        </div>
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
    <!-- プレビューエリア -->
    <template v-slot:after>
      <div class="layout vertical full-height">
        <div class="control-bar layout horizontal center">
          <q-btn v-show="viewType === 'split'" icon="chevron_left" color="primary" size="sm" padding="xs" flat @click="previewButtonOnClick" />
          <q-btn v-show="viewType === 'split'" icon="chevron_right" color="primary" size="sm" padding="xs" flat @click="editorButtonOnClick" />
          <q-btn v-show="viewType === 'preview'" icon="chevron_right" color="primary" size="sm" padding="xs" flat @click="splitButtonOnClick" />
          <q-btn v-show="viewType === 'preview'" icon="last_page" color="primary" size="sm" padding="xs" flat @click="editorButtonOnClick" />
        </div>
        <div class="preview-container">
          <div
            ref="previewHTML"
            class="preview-html markdown-body"
            @mouseover="previewHTMLOnStartScroll"
            @touchstart="previewHTMLOnStartScroll"
            @wheel="previewHTMLOnStartScroll"
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
import { Ref, computed, defineComponent, onMounted, ref } from '@vue/composition-api'
import { Img } from '@/app/components/img/img.vue'
import MarkdownIt from 'markdown-it'
import { MarkdownItVueComponent } from '@/markdown-it'
import { QSplitter } from 'quasar'
import { RenderRule } from 'markdown-it/lib/renderer'
import cheatSheet from '@/demo/views/markdown/cheat-sheet.md'
import debounce from 'lodash/debounce'
import hljs from 'highlight.js'
import twemoji from 'twemoji'

interface MarkdownEditor extends MarkdownEditor.Props {}

/**
 * エディタ領域とプレビュー領域のスクロール情報を格納するデータクラスです。
 */
interface ScrollLineItem {
  // 行番号
  line: number
  // エディタ行のトップ位置
  editorTop: number
  // プレビュー行のトップ位置
  previewTop: number
}

type ViewType = 'editor' | 'preview' | 'split'

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

      /**
       * エディター要素、プレビュー要素の最小幅の定数です。
       * ※厳密な最小幅ではなく補正値を含んだ値です。
       */
      const VIEW_MIN_WITH = 20

      const editorContainer = ref<HTMLElement>()
      const previewHTML = ref<HTMLDivElement>()

      let editor: monaco.editor.IStandaloneCodeEditor | null = null

      let md: MarkdownIt = {} as any

      const mdParserDefaults = ref({}) as Ref<MarkdownIt.Options>

      let scrollLineItems: ScrollLineItem[] | null = null

      let syncPreviewScrollToEditorDisposable: monaco.IDisposable | null = null

      /**
       * エディタ領域とプレビュー領域のどちらがアクティブかを示す変数
       */
      const activeArea: Ref<'editor' | 'preview' | null> = ref(null)

      /**
       * 左右のペインを隔てるスプリッターの左ペインの幅(%)
       */
      const splitterModel = ref(50)

      /**
       * ビューのタイプ (プレビュー, スプリット, エディター)
       */
      const viewType = computed<ViewType>(() => {
        if (splitterModel.value === 0) {
          return 'preview'
        } else if (splitterModel.value === 100) {
          return 'editor'
        } else {
          return 'split'
        }
      })

      //----------------------------------------------------------------------
      //
      //  Internal methods
      //
      //----------------------------------------------------------------------

      function init(): void {
        updateResult = debounce(updateResultFunc, 300, { maxWait: 500 })
        syncEditorScrollToPreview = debounce(syncEditorScrollToPreviewFunc, 50, { maxWait: 50 })
        syncPreviewScrollToEditor = debounce(syncPreviewScrollToEditorFunc, 50, { maxWait: 50 })

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

        // エディタ領域のスクロールにプレビュー領域を同期させるため、
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
       * 入力されたMarkdownテキストをパースしてプレビュー領域へ出力します。
       */
      let updateResult!: () => void

      function updateResultFunc(): void {
        if (!editor) return

        const source = editor.getValue()
        previewHTML.value!.innerHTML = md.render(source)

        scrollLineItems = null
      }

      /**
       * エディタ領域またはプレビュー領域をスクロールした際にスクロールを
       * 同期させるためのデータを作成します。
       */
      function buildScrollLineItems(): ScrollLineItem[] | null {
        if (!editor) return null

        const editorModel = editor.getModel()
        if (!editorModel) return null

        const result: ScrollLineItem[] = []

        // エディタ領域の行数分ループ
        for (let i = 0; i < editorModel.getLineCount(); i++) {
          const line = i + 1
          const lineItem: ScrollLineItem = { line, editorTop: -1, previewTop: -1 }
          result[i] = lineItem
          // エディタ領域のトップから指定行までの距離を取得
          lineItem.editorTop = editor.getTopForLineNumber(line)
        }

        // プレビュー領域に出力された'.line'CSSクラスが付与された要素を取得しループ
        const resultLinesEl = Array.from<HTMLElement>(previewHTML.value!.querySelectorAll('.line'))
        for (const resultLineEl of resultLinesEl) {
          // 行要素から'data-line'属性の値(行番号)を取得
          const resultLineStr = resultLineEl.getAttribute('data-line')
          if (!resultLineStr) continue

          const resultLineIndex = parseInt(resultLineStr) - 1
          const lineItem = result[resultLineIndex]
          if (!lineItem) continue

          // プレビュー領域のトップから行要素までの距離を取得
          const resultHTMLStyle = window.getComputedStyle(previewHTML.value!)
          const offsetTop = Math.round(parseFloat(resultHTMLStyle.paddingTop || '0')) + previewHTML.value!.offsetTop
          lineItem.previewTop = Math.round(resultLineEl.offsetTop - offsetTop)
        }

        // ｢先頭行｣と｢末尾行｣のMarkdown結果トップ位置を設定
        result[0].previewTop = 0
        result[result.length - 1].previewTop = previewHTML.value!.scrollHeight

        // 指定行インデックスより前にあるスクロールアイテムで、
        // プレビュー領域のトップ位置が設定されているものを取得する関数
        const getPrevScrollItem = (currentIndex: number) => {
          for (let i = currentIndex - 1; i >= 0; i--) {
            const previewTop = result[i].previewTop
            if (previewTop !== -1) return result[i]
          }
          throw new Error('Unreachable code reached.')
        }

        // 指定行インデックスより後にあるスクロールアイテムで、
        // 結果トップエリアの位置が設定されているものを取得する関数
        const getFollowScrollItem = (currentIndex: number) => {
          for (let i = currentIndex + 1; i < result.length; i++) {
            const previewTop = result[i].previewTop
            if (previewTop !== -1) return result[i]
          }
          throw new Error('Unreachable code reached.')
        }

        // プレビュー領域のトップ位置が設定されていないスクロールアイテムの補正値を設定
        for (let i = 0; i < editorModel.getLineCount(); i++) {
          const lineItem = result[i]
          if (lineItem.previewTop === -1) {
            const prev = getPrevScrollItem(i)
            const follow = getFollowScrollItem(i)
            const distance = follow.previewTop - prev.previewTop // スクロールアイテム間の距離
            const numer = lineItem.line - prev.line // 分子
            const denom = follow.line - prev.line // 分母
            lineItem.previewTop = Math.round(prev.previewTop + (distance / denom) * numer)
          }
        }

        return result
      }

      /**
       * エディター領域のスクロールとプレビュー領域を同期させるための処理を行います。
       * ※この関数はパフォーマンスを重視しており、スクロールイベントに紐付けられます。
       */
      let syncEditorScrollToPreview!: () => void

      function syncEditorScrollToPreviewFunc(): void {
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
            previewHTML.value!.scrollTop = scrollLineItems[lastIndex].previewTop
          } else if (currentLine.editorTop <= scrollTop && scrollTop < nextLine.editorTop) {
            previewHTML.value!.scrollTop = currentLine.previewTop
            break
          }
        }
      }

      /**
       * エディター領域のスクロールとプレビュー領域を同期させるための処理を行います。
       */
      function updateEditorScrollToPreview(): void {
        updateResult()
        scrollLineItems = null
        syncEditorScrollToPreviewFunc()
      }

      /**
       * プレビュー領域のスクロールとエディター領域を同期させるための処理を行います。
       * ※この関数はパフォーマンスを重視しており、スクロールイベントに紐付けられます。
       */
      let syncPreviewScrollToEditor!: () => void

      function syncPreviewScrollToEditorFunc(): void {
        if (!editor) return

        if (!scrollLineItems) {
          scrollLineItems = buildScrollLineItems()
        }
        if (!scrollLineItems) return

        const scrollTop = previewHTML.value!.scrollTop
        for (let i = 0; i < scrollLineItems.length; i++) {
          const lastIndex = scrollLineItems.length - 1
          const currentLine = scrollLineItems[i]
          const nextLine = i === lastIndex ? null : scrollLineItems[i + 1]

          if (nextLine === null) {
            editor.setScrollTop(scrollLineItems[lastIndex].editorTop)
          } else if (currentLine.previewTop <= scrollTop && scrollTop < nextLine.previewTop) {
            editor.setScrollTop(currentLine.editorTop)
            break
          }
        }
      }

      /**
       * プレビュー領域のスクロールとエディター領域を同期させるための処理を行います。
       */
      function updatePreviewScrollToEditor(): void {
        updateResult()
        scrollLineItems = null
        syncPreviewScrollToEditorFunc()
      }

      /**
       * エディター領域のスクロールにプレビュー領域を同期させるためのイベントリスナーを登録します。
       */
      function addEditorScrollLister(): void {
        if (!syncPreviewScrollToEditorDisposable) {
          syncPreviewScrollToEditorDisposable = editor!.onDidScrollChange(syncEditorScrollToPreview)
        }
      }

      /**
       * エディター領域のスクロールにプレビュー領域を同期させるためのイベントリスナーを解除します。
       */
      function removeEditorScrollLister(): void {
        if (syncPreviewScrollToEditorDisposable) {
          syncPreviewScrollToEditorDisposable.dispose()
          syncPreviewScrollToEditorDisposable = null
        }
      }

      /**
       * プレビュー領域のスクロールにエディター領域を同期させるためのイベントリスナーを登録します。
       */
      function addPreviewScrollLister(): void {
        removeEditorScrollLister()
        previewHTML.value!.addEventListener('scroll', syncPreviewScrollToEditor)
      }

      /**
       * プレビュー領域のスクロールにエディター領域を同期させるためのイベントリスナーを解除します。
       */
      function removePreviewScrollLister(): void {
        previewHTML.value!.removeEventListener('scroll', syncPreviewScrollToEditor)
      }

      /**
       * 指定された関数をインターバルごとに実行します。
       * 指定された関数が`true`を返す、または規定回数実行されると終了します。
       * @param fn インターバルごとに実行される関数を指定します。
       */
      function updateInterval(fn: () => boolean | void): void {
        let count = 0
        const intervalId = setInterval(() => {
          count++
          if (count >= 100) {
            clearInterval(intervalId)
            return
          }

          const result = fn()
          if (result === true) {
            clearInterval(intervalId)
          }
        }, 10)
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
       * エディタ領域のスクロールが開始される際のリスナです。
       */
      function editorContainerOnStartScroll() {
        if (activeArea.value === 'editor') return
        activeArea.value = 'editor'

        removePreviewScrollLister()
        addEditorScrollLister()
      }

      /**
       * プレビュー領域のスクロールが開始される際のリスナです。
       */
      function previewHTMLOnStartScroll() {
        if (activeArea.value === 'preview') return
        activeArea.value = 'preview'

        removeEditorScrollLister()
        addPreviewScrollLister()
      }

      //--------------------------------------------------
      //  ビュータイプの切り替え
      //--------------------------------------------------

      /**
       * プレビューボタンがクリックされた際のリスナーです。
       */
      function editorButtonOnClick() {
        // プレビュー領域のスクロールとエディター領域を同期させるリスナーを解除
        removePreviewScrollLister()

        splitterModel.value = 100
        editor!.focus()
      }

      /**
       * エディターボタンがクリックされた際のリスナーです。
       */
      function previewButtonOnClick() {
        // エディター領域のスクロールとプレビュー領域を同期させるリスナーを解除
        removeEditorScrollLister()

        splitterModel.value = 0

        updateInterval(() => {
          const width = editor!.getLayoutInfo().width
          if (width > VIEW_MIN_WITH) return false

          updateEditorScrollToPreview()
          return true
        })
      }

      /**
       * スプリットボタンがクリックされた際のハンドラです。
       */
      function splitButtonOnClick() {
        const oldViewType = viewType.value

        // エディター領域とプレビュー領域のスクロール同期リスナーを解除
        // ※スプリッターの値を変えることで左右の領域の幅が変わる。
        //   これが起因してスクロール位置が変化するので、この後の処理に影響が出てしまう。
        //   このためリスナーを解除する必要がある。
        removeEditorScrollLister()
        removePreviewScrollLister()

        // スプリッターを50:50に設定
        splitterModel.value = 50
        editor!.focus()

        updateInterval(() => {
          // 前のビュータイプがエディターだった場合、
          // エディター領域のスクロール位置をプレビュー領域に同期させる
          if (oldViewType === 'editor') {
            const style = getComputedStyle(previewHTML.value!)
            const width = myParseInt(style.width) - myParseInt(style.paddingLeft) - myParseInt(style.paddingRight)
            if (width <= VIEW_MIN_WITH) return false

            updateEditorScrollToPreview()
            return true
          }
          // 前のビュータイプがプレビューだった場合、
          // プレビュー領域のスクロール位置をエディター領域に同期させる
          else if (oldViewType === 'preview') {
            const width = editor!.getLayoutInfo().width
            if (width <= VIEW_MIN_WITH) return false

            updatePreviewScrollToEditor()
            return true
          }
        })
      }

      //----------------------------------------------------------------------
      //
      //  Result
      //
      //----------------------------------------------------------------------

      return {
        editorContainer,
        previewHTML,
        splitterModel,
        viewType,
        onResize,
        editorContainerOnStartScroll,
        previewHTMLOnStartScroll,
        editorButtonOnClick,
        previewButtonOnClick,
        splitButtonOnClick,
      }
    },
  })
}

export default MarkdownEditor.clazz
export { MarkdownEditor }
</script>
