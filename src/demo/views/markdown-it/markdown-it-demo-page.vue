<style lang="sass">
.MarkdownItDemoPage .markdown-body
  .warning
    background-color: #ff8
    padding: 20px
    border-radius: 6px
</style>

<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.MarkdownItDemoPage
  height: 100%
  padding: 20px

.input-output-container
  .divider
    width: 20px

  .view-tabs
    height: 40px
    color: $app-link-color

  .input-container
    .source
      width: 100%
      font-family: Menlo, Monaco, Consolas, "Courier New", monospace
      font-size: 13px
      padding: 2px

  .output-container
    overflow: hidden

    .result-html
      padding: 2px 10px
      overflow: auto
      background-color: #fff
      border: 1px solid #ccc
      border-radius: 4px

    .result-src, .result-debug
      margin: 0
      overflow: auto
      background-color: #f8f8f8
      border: 1px solid #ccc
      border-radius: 4px
</style>

<template>
  <div class="MarkdownItDemoPage layout vertical">
    <!-- Markdown設定エリア -->
    <div class="layout horizontal">
      <q-checkbox v-model="defaults.html" label="html" :disable="defaults._strict">
        <q-tooltip anchor="top middle" self="bottom middle" :offset="[0, 0]">enable html tags in source text</q-tooltip>
      </q-checkbox>
      <q-checkbox v-model="defaults.xhtmlOut" label="xhtmlOut" :disable="defaults._strict">
        <q-tooltip anchor="top middle" self="bottom middle" :offset="[0, 0]">
          produce xtml output (add / to single tags (&lt;br /&gt; instead of &lt;br /&gt;)
        </q-tooltip>
      </q-checkbox>
      <q-checkbox v-model="defaults.breaks" label="breaks" :disable="defaults._strict">
        <q-tooltip anchor="top middle" self="bottom middle" :offset="[0, 0]">newlines in paragraphs are rendered as &lt;br&gt;</q-tooltip>
      </q-checkbox>
      <q-checkbox v-model="defaults.linkify" label="linkify" :disable="defaults._strict">
        <q-tooltip anchor="top middle" self="bottom middle" :offset="[0, 0]">autoconvert link-like texts to links</q-tooltip>
      </q-checkbox>
      <q-checkbox v-model="defaults.typographer" label="typographer" :disable="defaults._strict">
        <q-tooltip anchor="top middle" self="bottom middle" :offset="[0, 0]">do typographic replacements, (c) → © and so on</q-tooltip>
      </q-checkbox>
      <q-checkbox v-model="defaults._highlight" label="highlight" :disable="defaults._strict">
        <q-tooltip anchor="top middle" self="bottom middle" :offset="[0, 0]">enable output highlight for fenced blocks</q-tooltip>
      </q-checkbox>
      <q-checkbox v-model="defaults._strict" label="CommonMark strict">
        <q-tooltip anchor="top middle" self="bottom middle" :offset="[0, 0]">
          force strict CommonMark mode - output will be equal to reference parser
        </q-tooltip>
      </q-checkbox>
    </div>
    <!-- Markdown入力/出力エリア -->
    <div class="flex-1 input-output-container layout horizontal">
      <!-- Markdown入力エリア -->
      <div class="flex-1 input-container layout vertical">
        <div class="view-tabs"></div>
        <textarea
          ref="textarea"
          class="source flex-1"
          @keyup="updateResult"
          @paste="updateResult"
          @cut="updateResult"
          @mouseup="updateResult"
          @mouseover="textareaOnStartScroll"
          @touchstart="textareaOnStartScroll"
          @wheel="textareaOnStartScroll"
        ></textarea>
      </div>
      <!-- 区切り -->
      <div class="divider" />
      <!-- Markdown出力エリア -->
      <div class="flex-1 output-container layout vertical">
        <!-- 出力タイプ切り替え選択 -->
        <q-tabs v-model="defaults._view" dense align="right" no-caps class="view-tabs" :breakpoint="0">
          <q-tab name="html" label="html" />
          <q-tab name="src" label="src" />
          <q-tab name="debug" label="debug" />
        </q-tabs>
        <!-- パース結果出力 -->
        <div
          v-show="defaults._view === 'html'"
          ref="resultHTML"
          class="result-html markdown-body flex-1"
          @mouseover="resultHTMLOnStartScroll"
          @touchstart="resultHTMLOnStartScroll"
          @wheel="resultHTMLOnStartScroll"
        ></div>
        <!-- HTMLソース出力 -->
        <pre v-show="defaults._view === 'src'" ref="resultSrc" class="hljs result-src flex-1"></pre>
        <!-- JSON出力 -->
        <pre v-show="defaults._view === 'debug'" ref="resultDebug" class="hljs result-debug flex-1"></pre>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
//
// 本ページは以下のソースを参考にして作成されています:
// https://github.com/markdown-it/markdown-it/tree/master/support/demo_template
//

import 'highlight.js/styles/github.css'
import { Ref, defineComponent, onMounted, ref, watch } from '@vue/composition-api'
import MarkdownIt from 'markdown-it'
import { RenderRule } from 'markdown-it/lib/renderer'
import anime from 'animejs'
import cheatSheet from '@/demo/views/markdown-it/cheat-sheet.md'
import debounce from 'lodash/debounce'
import hljs from 'highlight.js'
import twemoji from 'twemoji'

interface MarkdownItOptions extends MarkdownIt.Options {
  _highlight: boolean
  _strict: boolean
  _view: 'html' | 'src' | 'debug'
}

namespace MarkdownItDemoPage {
  export const clazz = defineComponent({
    name: 'MarkdownItDemoPage',

    setup(props, ctx) {
      //----------------------------------------------------------------------
      //
      //  Lifecycle hooks
      //
      //----------------------------------------------------------------------

      onMounted(() => {
        textarea.value!.value = cheatSheet
      })

      //----------------------------------------------------------------------
      //
      //  Variables
      //
      //----------------------------------------------------------------------

      const textarea = ref<HTMLTextAreaElement>()
      const resultHTML = ref<HTMLDivElement>()
      const resultSrc = ref<HTMLPreElement>()
      const resultDebug = ref<HTMLDivElement>()

      let mdHtml: MarkdownIt = {} as any

      let mdSrc: MarkdownIt = {} as any

      let scrollDict: number[] | null = null

      const defaults = ref({}) as Ref<MarkdownItOptions>

      const activeArea: Ref<'editor' | 'result' | null> = ref(null)

      // let textareaAnime: anime.AnimeInstance | null = null
      // let resultHTMLAnime: anime.AnimeInstance | null = null

      //----------------------------------------------------------------------
      //
      //  Internal methods
      //
      //----------------------------------------------------------------------

      function init() {
        updateResult = debounce(updateResultFunc, 300, { maxWait: 500 })
        syncResultScroll = debounce(syncResultScrollFunc, 50, { maxWait: 50 })
        syncSrcScroll = debounce(syncSrcScrollFunc, 50, { maxWait: 50 })

        defaults.value = {
          html: false, // Enable HTML tags in source
          xhtmlOut: false, // Use '/' to close single tags (<br />)
          breaks: false, // Convert '\n' in paragraphs into <br>
          langPrefix: 'language-', // CSS language prefix for fenced blocks
          linkify: true, // autoconvert URL-like texts to links
          typographer: true, // Enable smartypants and other sweet transforms

          // options below are for demo only
          _highlight: true,
          _strict: false,
          _view: 'html', // html / src / debug
        }

        defaults.value.highlight = (str, lang) => {
          const esc = mdHtml.utils.escapeHtml

          try {
            if (!defaults.value._highlight) {
              throw 'highlighting disabled'
            }

            if (lang && lang !== 'auto' && hljs.getLanguage(lang)) {
              return `<pre class="hljs language-${esc(lang.toLowerCase())}"><code>${hljs.highlight(lang, str, true).value}</code></pre>`
            } else if (lang === 'auto') {
              const result = hljs.highlightAuto(str)

              /*eslint-disable no-console*/
              console.log(`highlight language: ${result.language}, relevance: ${result.relevance}`)

              return `<pre class="hljs language-${esc(result.language!)}"><code>${result.value}</code></pre>`
            }
          } catch (__) {
            /**/
          }

          return `<pre class="hljs"><code>${esc(str)}</code></pre>`
        }

        mdInit()
      }

      function mdInit() {
        if (defaults.value._strict) {
          mdHtml = new MarkdownIt('commonmark')
          mdSrc = new MarkdownIt('commonmark')
        } else {
          mdHtml = new MarkdownIt(defaults.value)
            .use(require('markdown-it-abbr'))
            .use(require('markdown-it-container'), 'warning')
            .use(require('markdown-it-deflist'))
            .use(require('markdown-it-emoji'))
            .use(require('markdown-it-footnote'))
            .use(require('markdown-it-ins'))
            .use(require('markdown-it-mark'))
            .use(require('markdown-it-sub'))
            .use(require('markdown-it-sup'))
          mdSrc = new MarkdownIt(defaults.value)
            .use(require('markdown-it-abbr'))
            .use(require('markdown-it-container'), 'warning')
            .use(require('markdown-it-deflist'))
            .use(require('markdown-it-emoji'))
            .use(require('markdown-it-footnote'))
            .use(require('markdown-it-ins'))
            .use(require('markdown-it-mark'))
            .use(require('markdown-it-sub'))
            .use(require('markdown-it-sup'))
        }

        // Beautify output of parser for html content
        mdHtml.renderer.rules.table_open = () => {
          return '<table class="table table-striped">\n'
        }

        // Replace emoji codes with images
        mdHtml.renderer.rules.emoji = (token, idx) => {
          return twemoji.parse(token[idx].content)
        }

        //
        // Inject line numbers for sync scroll. Notes:
        //
        // - We track only headings and paragraphs on first level. That's enough.
        // - Footnotes content causes jumps. Level limit filter it automatically.
        const injectLineNumbers: RenderRule = (tokens, idx, options, env, slf) => {
          if (tokens[idx].map && tokens[idx].level === 0) {
            const line = tokens[idx].map![0]
            tokens[idx].attrJoin('class', 'line')
            tokens[idx].attrSet('data-line', String(line))
          }
          return slf.renderToken(tokens, idx, options)
        }

        mdHtml.renderer.rules.paragraph_open = mdHtml.renderer.rules.heading_open = injectLineNumbers
      }

      let updateResult!: () => void

      function updateResultFunc(): void {
        const source = textarea.value!.value

        // Update only active view to avoid slowdowns
        // (debug & src view with highlighting are a bit slow)
        switch (defaults.value._view) {
          case 'src': {
            const content = mdSrc.render(source)
            resultSrc.value!.innerHTML = hljs.highlight('html', content).value
            break
          }
          case 'debug': {
            const content = JSON.stringify(mdSrc.parse(source, { references: {} }), null, 2)
            resultDebug.value!.innerHTML = hljs.highlight('html', content).value
            break
          }
          default: {
            resultHTML.value!.innerHTML = mdHtml.render(source)
          }
        }

        // reset lines mapping cache on content update
        scrollDict = null
      }

      // Build offsets for each line (lines can be wrapped)
      // That's a bit dirty to process each line everytime, but ok for demo.
      // Optimizations are required only for big texts.
      function buildScrollDict(): number[] {
        const textareaStyle = window.getComputedStyle(textarea.value!)
        const sourceLikeDiv = document.createElement('div')
        sourceLikeDiv.style.position = 'absolute'
        sourceLikeDiv.style.visibility = 'hidden'
        sourceLikeDiv.style.height = 'auto'
        sourceLikeDiv.style.width = `${textarea.value!.clientWidth}px`
        sourceLikeDiv.style.fontSize = textareaStyle.fontSize
        sourceLikeDiv.style.fontFamily = textareaStyle.fontFamily
        sourceLikeDiv.style.lineHeight = textareaStyle.lineHeight
        sourceLikeDiv.style.whiteSpace = textareaStyle.whiteSpace
        document.body.appendChild(sourceLikeDiv)

        // lineHeightDict:
        //   エディタの行インデックスと折返しを加味した表示行インデックスのマップ
        //   index: エディタの行インデックス
        //   value: エディタの表示行インデックス(折返しを加味した行インデックス)
        const lineHeightDict: number[] = []

        let acc = 0
        textarea.value!.value.split('\n').forEach((str, index) => {
          lineHeightDict.push(acc)

          if (str.length === 0) {
            acc++
            return
          }

          sourceLikeDiv.textContent = str
          const sourceLikeDivStyle = window.getComputedStyle(sourceLikeDiv)
          const h = parseFloat(sourceLikeDivStyle.height || '0')
          const lh = parseFloat(sourceLikeDivStyle.lineHeight || '0')
          acc += Math.round(h / lh)
        })
        sourceLikeDiv.remove()
        lineHeightDict.push(acc)

        // エディタの表示行インデックスの最大値
        const linesCount = acc

        // _scrollDict:
        //   index: エディタの表示行インデックス(折返しを加味した行インデックス)
        //   value: レンダリングエリアのスクロールトップ位置
        //   maxIndex: エディタの表示行インデックスの最大値
        const _scrollDict: number[] = []

        for (let i = 0; i < linesCount; i++) {
          _scrollDict.push(-1)
        }
        _scrollDict[0] = 0

        // nonEmptyList:
        //   lineHeightDictにエディタの表示行インデックスが設定されているものを抽出した配列
        //   index: 連番インデックス
        //   value: エディタの表示行インデックス(折返しを加味した行インデックス)
        const nonEmptyList = [0]

        resultHTML.value!.querySelectorAll('.line').forEach(el => {
          const lineEl = el as HTMLElement
          const srcLineIndex = lineEl.getAttribute('data-line')
          if (!srcLineIndex) return

          const displayLineIndex = lineHeightDict[parseInt(srcLineIndex)]
          if (displayLineIndex !== 0) {
            nonEmptyList.push(displayLineIndex)
          }

          _scrollDict[displayLineIndex] = Math.round(lineEl.offsetTop - resultHTML.value!.offsetTop)
        })

        nonEmptyList.push(linesCount)
        _scrollDict[linesCount] = resultHTML.value!.scrollHeight

        let pos = 0
        for (let i = 1; i < linesCount; i++) {
          if (_scrollDict[i] !== -1) {
            // console.log(`_scrollDict[${i}]: ${_scrollDict[i]}, pos: ${pos}`)
            pos++
            continue
          }

          const _scrollDict_indexA = nonEmptyList[pos]
          const _scrollDict_indexB = nonEmptyList[pos + 1]
          const valueA = _scrollDict[_scrollDict_indexB] * (i - _scrollDict_indexA)
          const valueB = _scrollDict[_scrollDict_indexA] * (_scrollDict_indexB - i)
          const valueC = _scrollDict_indexB - _scrollDict_indexA
          const scrollDictNewValue = Math.round((valueA + valueB) / valueC)

          // console.log(
          //   `_scrollDict[${i}]: ${_scrollDict[i]} -> ${scrollDictNewValue}, pos: ${pos}, _scrollDict_indexA: ${_scrollDict_indexA}, _scrollDict_indexB: ${_scrollDict_indexB}`
          // )

          _scrollDict[i] = scrollDictNewValue
        }

        return _scrollDict
      }

      let syncResultScroll!: () => void

      function syncResultScrollFunc(): void {
        const textareaStyle = window.getComputedStyle(textarea.value!)
        const lineHeight = parseFloat(textareaStyle.lineHeight || '0')

        const lineNo = Math.floor(textarea.value!.scrollTop / lineHeight)
        if (!scrollDict) {
          scrollDict = buildScrollDict()
        }
        const posTo = scrollDict[lineNo]

        resultHTML.value!.scrollTop = posTo
        // resultHTMLAnime && resultHTMLAnime.pause()
        // resultHTMLAnime = anime({
        //   targets: resultHTML.value!,
        //   scrollTop: posTo,
        //   duration: 50,
        //   easing: 'linear',
        // })
      }

      let syncSrcScroll!: () => void

      function syncSrcScrollFunc(): void {
        const textareaStyle = window.getComputedStyle(textarea.value!)
        const scrollTop = resultHTML.value!.scrollTop
        const lineHeight = parseFloat(textareaStyle.lineHeight || '0')

        if (!scrollDict) {
          scrollDict = buildScrollDict()
        }

        const lines = Object.keys(scrollDict)

        if (lines.length < 1) {
          return
        }

        let line = lines[0]

        for (let i = 1; i < lines.length; i++) {
          if (scrollDict[i] < scrollTop) {
            line = lines[i]
            continue
          }
          break
        }

        textarea.value!.scrollTop = lineHeight * parseInt(line)
        // textareaAnime && textareaAnime.pause()
        // textareaAnime = anime({
        //   targets: textarea.value!,
        //   scrollTop: lineHeight * parseInt(line),
        //   duration: 50,
        //   easing: 'linear',
        // })
      }

      //----------------------------------------------------------------------
      //
      //  Event listeners
      //
      //----------------------------------------------------------------------

      watch(
        () => defaults.value.html,
        () => defaultsOnChange('html')
      )

      watch(
        () => defaults.value.xhtmlOut,
        () => defaultsOnChange('xhtmlOut')
      )

      watch(
        () => defaults.value.breaks,
        () => defaultsOnChange('breaks')
      )

      watch(
        () => defaults.value.linkify,
        () => defaultsOnChange('linkify')
      )

      watch(
        () => defaults.value.typographer,
        () => defaultsOnChange('typographer')
      )

      watch(
        () => defaults.value._highlight,
        () => defaultsOnChange('_highlight')
      )

      watch(
        () => defaults.value._view,
        () => defaultsOnChange('_view')
      )

      watch(
        () => defaults.value._strict,
        () => defaultsOnChange('_strict')
      )

      function defaultsOnChange(prop: keyof MarkdownItOptions): void {
        mdInit()
        updateResult()
      }

      function textareaOnStartScroll() {
        if (activeArea.value === 'editor') return
        activeArea.value = 'editor'

        resultHTML.value!.removeEventListener('scroll', syncSrcScroll)
        textarea.value!.removeEventListener('scroll', syncResultScroll)
        textarea.value!.addEventListener('scroll', syncResultScroll)
      }

      function resultHTMLOnStartScroll() {
        if (activeArea.value === 'result') return
        activeArea.value = 'result'

        textarea.value!.removeEventListener('scroll', syncResultScroll)
        resultHTML.value!.removeEventListener('scroll', syncSrcScroll)
        resultHTML.value!.addEventListener('scroll', syncSrcScroll)
      }

      //----------------------------------------------------------------------
      //
      //  Result
      //
      //----------------------------------------------------------------------

      init()

      return {
        textarea,
        resultHTML,
        resultSrc,
        resultDebug,
        defaults,
        updateResult,
        defaultsOnChange,
        textareaOnStartScroll,
        resultHTMLOnStartScroll,
      }
    },
  })
}

export default MarkdownItDemoPage.clazz
</script>
