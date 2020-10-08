<style lang="sass">
.markdown-it-page-main .markdown-body
  .warning
    background-color: #ff8
    padding: 20px
    border-radius: 6px
</style>

<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.markdown-it-page-main
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
  <div class="markdown-it-page-main layout vertical">
    <!-- Markdown設定エリア -->
    <div class="layout horizontal">
      <q-checkbox v-model="defaults.html" label="html" :disable="defaults._strict">
        <q-tooltip anchor="top middle" self="bottom middle" :offset="[0, 0]">
          enable html tags in source text
        </q-tooltip>
      </q-checkbox>
      <q-checkbox v-model="defaults.xhtmlOut" label="xhtmlOut" :disable="defaults._strict">
        <q-tooltip anchor="top middle" self="bottom middle" :offset="[0, 0]">
          produce xtml output (add / to single tags (&lt;br /&gt; instead of &lt;br /&gt;)
        </q-tooltip>
      </q-checkbox>
      <q-checkbox v-model="defaults.breaks" label="breaks" :disable="defaults._strict">
        <q-tooltip anchor="top middle" self="bottom middle" :offset="[0, 0]">
          newlines in paragraphs are rendered as &lt;br&gt;
        </q-tooltip>
      </q-checkbox>
      <q-checkbox v-model="defaults.linkify" label="linkify" :disable="defaults._strict">
        <q-tooltip anchor="top middle" self="bottom middle" :offset="[0, 0]">
          autoconvert link-like texts to links
        </q-tooltip>
      </q-checkbox>
      <q-checkbox v-model="defaults.typographer" label="typographer" :disable="defaults._strict">
        <q-tooltip anchor="top middle" self="bottom middle" :offset="[0, 0]">
          do typographic replacements, (c) → © and so on
        </q-tooltip>
      </q-checkbox>
      <q-checkbox v-model="defaults._highlight" label="highlight" :disable="defaults._strict">
        <q-tooltip anchor="top middle" self="bottom middle" :offset="[0, 0]">
          enable output highlight for fenced blocks
        </q-tooltip>
      </q-checkbox>
      <q-checkbox v-model="defaults._strict" label="CommonMark strict">
        <q-tooltip anchor="top middle" self="bottom middle" :offset="[0, 0]">
          force strict CommonMark mode - output will be equal to reference parser
        </q-tooltip>
      </q-checkbox>
    </div>
    <!-- Markdown入力/出力エリア -->
    <div class="flex-1 input-output-container layout horizontal ">
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
          @mouseover="m_textareaOnStartScroll"
          @touchstart="m_textareaOnStartScroll"
          @wheel="m_textareaOnStartScroll"
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
          @mouseover="m_resultHTMLOnStartScroll"
          @touchstart="m_resultHTMLOnStartScroll"
          @wheel="m_resultHTMLOnStartScroll"
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

import { BaseComponent, NoCache, Resizable } from '@/app/base'
import { Component, Watch } from 'vue-property-decorator'
import { CompImg } from '@/app/components'
import MarkdownIt from 'markdown-it'
import anime from 'animejs'
import cheatSheet from '@/app/views/components/markdown-it/cheat-sheet.md'
import hljs from 'highlight.js'
import { mixins } from 'vue-class-component'
const debounce = require('lodash/debounce')

interface MarkdownItOptions extends MarkdownIt.Options {
  _highlight: boolean
  _strict: boolean
  _view: 'html' | 'src' | 'debug'
}

@Component({ components: { CompImg } })
export default class MarkdownItPage extends mixins(BaseComponent, Resizable) {
  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  created() {
    this.updateResult = debounce(this.updateResultFunc, 300, { maxWait: 500 })
    this.syncResultScroll = debounce(this.syncResultScrollFunc, 50, { maxWait: 50 })
    this.syncSrcScroll = debounce(this.syncSrcScrollFunc, 50, { maxWait: 50 })

    this.defaults = {
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

    this.defaults.highlight = (str, lang) => {
      const esc = this.mdHtml.utils.escapeHtml

      try {
        if (!this.defaults._highlight) {
          throw 'highlighting disabled'
        }

        if (lang && lang !== 'auto' && hljs.getLanguage(lang)) {
          return `<pre class="hljs language-${esc(lang.toLowerCase())}"><code>${hljs.highlight(lang, str, true).value}</code></pre>`
        } else if (lang === 'auto') {
          const result = hljs.highlightAuto(str)

          /*eslint-disable no-console*/
          console.log(`highlight language: ${result.language}, relevance: ${result.relevance}`)

          return `<pre class="hljs language-${esc(result.language)}"><code>${result.value}</code></pre>`
        }
      } catch (__) {
        /**/
      }

      return `<pre class="hljs"><code>${esc(str)}</code></pre>`
    }

    this.mdInit()
  }

  mounted() {
    this.m_textarea.value = cheatSheet
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private mdHtml: MarkdownIt = {} as any

  private mdSrc: MarkdownIt = {} as any

  private scrollDict: number[] | null = null

  private defaults: MarkdownItOptions = {} as any

  @Watch('defaults.html')
  private m_htmlOnChange(newValue: string, oldValue: string): void {
    this.m_defaultsOnChange('html')
  }

  @Watch('defaults.xhtmlOut')
  private m_xhtmlOutOnChange(newValue: string, oldValue: string): void {
    this.m_defaultsOnChange('xhtmlOut')
  }

  @Watch('defaults.breaks')
  private m_breaksOnChange(newValue: string, oldValue: string): void {
    this.m_defaultsOnChange('breaks')
  }

  @Watch('defaults.linkify')
  private m_linkifyOnChange(newValue: string, oldValue: string): void {
    this.m_defaultsOnChange('linkify')
  }

  @Watch('defaults.typographer')
  private m_typographerOnChange(newValue: string, oldValue: string): void {
    this.m_defaultsOnChange('typographer')
  }

  @Watch('defaults._highlight')
  private m_highlightOnChange(newValue: string, oldValue: string): void {
    this.m_defaultsOnChange('_highlight')
  }

  @Watch('defaults._view')
  private m_viewOnChange(newValue: string, oldValue: string): void {
    this.updateResult()
  }

  @Watch('defaults._strict')
  private m_strictOnChange(newValue: string, oldValue: string): void {
    this.m_defaultsOnChange('_strict')
  }

  private m_activeArea: 'editor' | 'result' | null = null

  private m_textareaAnime: anime.AnimeInstance | null = null

  private m_resultHTMLAnime: anime.AnimeInstance | null = null

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

  @NoCache
  get m_textarea(): HTMLTextAreaElement {
    return this.$refs.textarea as HTMLTextAreaElement
  }

  @NoCache
  get m_resultHTML(): HTMLDivElement {
    return this.$refs.resultHTML as HTMLDivElement
  }

  @NoCache
  get m_resultSrc(): HTMLPreElement {
    return this.$refs.resultSrc as HTMLPreElement
  }

  @NoCache
  get m_resultDebug(): HTMLPreElement {
    return this.$refs.resultDebug as HTMLPreElement
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  private mdInit() {
    if (this.defaults._strict) {
      this.mdHtml = new MarkdownIt('commonmark')
      this.mdSrc = new MarkdownIt('commonmark')
    } else {
      this.mdHtml = new MarkdownIt(this.defaults)
        .use(require('markdown-it-abbr'))
        .use(require('markdown-it-container'), 'warning')
        .use(require('markdown-it-deflist'))
        .use(require('markdown-it-emoji'))
        .use(require('markdown-it-footnote'))
        .use(require('markdown-it-ins'))
        .use(require('markdown-it-mark'))
        .use(require('markdown-it-sub'))
        .use(require('markdown-it-sup'))
      this.mdSrc = new MarkdownIt(this.defaults)
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
    this.mdHtml.renderer.rules.table_open = function() {
      return '<table class="table table-striped">\n'
    }
    // Replace emoji codes with images
    this.mdHtml.renderer.rules.emoji = function(token, idx) {
      return (window as any).twemoji.parse(token[idx].content)
    }

    //
    // Inject line numbers for sync scroll. Notes:
    //
    // - We track only headings and paragraphs on first level. That's enough.
    // - Footnotes content causes jumps. Level limit filter it automatically.
    const injectLineNumbers: MarkdownIt.TokenRender = (tokens, idx, options, env, slf) => {
      if (tokens[idx].map && tokens[idx].level === 0) {
        const line = tokens[idx].map[0]
        tokens[idx].attrJoin('class', 'line')
        tokens[idx].attrSet('data-line', String(line))
      }
      return slf.renderToken(tokens, idx, options)
    }

    this.mdHtml.renderer.rules.paragraph_open = this.mdHtml.renderer.rules.heading_open = injectLineNumbers
  }

  private updateResult!: () => void

  private updateResultFunc(): void {
    const source = this.m_textarea.value

    // Update only active view to avoid slowdowns
    // (debug & src view with highlighting are a bit slow)
    switch (this.defaults._view) {
      case 'src': {
        const content = this.mdSrc.render(source)
        this.m_resultSrc.innerHTML = hljs.highlight('html', content).value
        break
      }
      case 'debug': {
        const content = JSON.stringify(this.mdSrc.parse(source, { references: {} }), null, 2)
        this.m_resultDebug.innerHTML = hljs.highlight('html', content).value
        break
      }
      default: {
        this.m_resultHTML.innerHTML = this.mdHtml.render(source)
      }
    }

    // reset lines mapping cache on content update
    this.scrollDict = null
  }

  // Build offsets for each line (lines can be wrapped)
  // That's a bit dirty to process each line everytime, but ok for demo.
  // Optimizations are required only for big texts.
  private buildScrollDict(): number[] {
    const textareaStyle = window.getComputedStyle(this.m_textarea)
    const sourceLikeDiv = document.createElement('div')
    sourceLikeDiv.style.position = 'absolute'
    sourceLikeDiv.style.visibility = 'hidden'
    sourceLikeDiv.style.height = 'auto'
    sourceLikeDiv.style.width = `${this.m_textarea.clientWidth}px`
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
    this.m_textarea.value.split('\n').forEach((str, index) => {
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

    this.m_resultHTML.querySelectorAll('.line').forEach(el => {
      const lineEl = el as HTMLElement
      const srcLineIndex = lineEl.getAttribute('data-line')
      if (!srcLineIndex) return

      const displayLineIndex = lineHeightDict[parseInt(srcLineIndex)]
      if (displayLineIndex !== 0) {
        nonEmptyList.push(displayLineIndex)
      }

      _scrollDict[displayLineIndex] = Math.round(lineEl.offsetTop - this.m_resultHTML.offsetTop)
    })

    nonEmptyList.push(linesCount)
    _scrollDict[linesCount] = this.m_resultHTML.scrollHeight

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

  private syncResultScroll!: () => void

  private syncResultScrollFunc(e): void {
    const textareaStyle = window.getComputedStyle(this.m_textarea)
    const lineHeight = parseFloat(textareaStyle.lineHeight || '0')

    const lineNo = Math.floor(this.m_textarea.scrollTop / lineHeight)
    if (!this.scrollDict) {
      this.scrollDict = this.buildScrollDict()
    }
    const posTo = this.scrollDict[lineNo]

    this.m_resultHTML.scrollTop = posTo
    // this.m_resultHTMLAnime && this.m_resultHTMLAnime.pause()
    // this.m_resultHTMLAnime = anime({
    //   targets: this.m_resultHTML,
    //   scrollTop: posTo,
    //   duration: 50,
    //   easing: 'linear',
    // })
  }

  private syncSrcScroll!: () => void

  private syncSrcScrollFunc(e): void {
    const textareaStyle = window.getComputedStyle(this.m_textarea)
    const scrollTop = this.m_resultHTML.scrollTop
    const lineHeight = parseFloat(textareaStyle.lineHeight || '0')

    if (!this.scrollDict) {
      this.scrollDict = this.buildScrollDict()
    }

    const lines = Object.keys(this.scrollDict)

    if (lines.length < 1) {
      return
    }

    let line = lines[0]

    for (let i = 1; i < lines.length; i++) {
      if (this.scrollDict[i] < scrollTop) {
        line = lines[i]
        continue
      }
      break
    }

    this.m_textarea.scrollTop = lineHeight * parseInt(line)
    // this.m_textareaAnime && this.m_textareaAnime.pause()
    // this.m_textareaAnime = anime({
    //   targets: this.m_textarea,
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

  private m_defaultsOnChange(prop: keyof MarkdownItOptions): void {
    this.mdInit()
    this.updateResult()
  }

  private m_textareaOnStartScroll() {
    if (this.m_activeArea === 'editor') return
    this.m_activeArea = 'editor'

    this.m_resultHTML.removeEventListener('scroll', this.syncSrcScroll)
    this.m_textarea.removeEventListener('scroll', this.syncResultScroll)
    this.m_textarea.addEventListener('scroll', this.syncResultScroll)
  }

  private m_resultHTMLOnStartScroll() {
    if (this.m_activeArea === 'result') return
    this.m_activeArea = 'result'

    this.m_textarea.removeEventListener('scroll', this.syncResultScroll)
    this.m_resultHTML.removeEventListener('scroll', this.syncSrcScroll)
    this.m_resultHTML.addEventListener('scroll', this.syncSrcScroll)
  }
}
</script>
