import { Constructor } from 'web-base-lib'
import MarkdownIt from 'markdown-it'
import StateBlock from 'markdown-it/lib/rules_block/state_block'
import StateInline from 'markdown-it/lib/rules_inline/state_inline'
import Token from 'markdown-it/lib/token'
import Vue from 'vue'
import merge from 'deepmerge'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface VueComponentData {
  component: string
  props: { [name: string]: PropValueType }
  content: string
}

interface VueInlineComponentData extends VueComponentData {
  nextPos: number
  nextPosMax: number
}

type JSONType = { [name: string]: PropValueType }

type PrimitiveType = string | boolean | number | undefined

type PropValueType = PrimitiveType | JSONType

//========================================================================
//
//  Implementation
//
//========================================================================

/**
 * Vueコンポーネントのインスタンスを生成します。
 * @param token markdown-itのトークン
 * @param components Vueコンポーネントクラスのリスト
 */
function newVueComponent(token: Token, components: { [name: string]: Constructor }): Vue | undefined {
  // トークンからVueコンポーネントを生成するためのデータを取得
  const compData = (token.info as any) as VueComponentData

  // 生成するVueコンポーネントクラスを取得
  const component = components[compData.component]
  if (!component) return undefined

  // CSSクラスを取得
  // 設定されている値の例: 'class1 class2'
  const classes = compData.props.class
  delete compData.props.class

  // Vueコンポーネントのインスタンスを生成
  const CompClass = Vue.extend(component)
  const compInstance = new CompClass({
    propsData: compData.props,
  })
  compInstance.$mount()

  // Vueコンポーネントの要素にCSSクラスを付与
  if (typeof classes === 'string' && classes) {
    const classList = classes.split(' ').reduce((result, clazz) => {
      clazz = clazz.trim()
      if (clazz) result.push(clazz)
      return result
    }, [] as string[])
    compInstance.$el.classList.add(...classList)
  }

  return compInstance
}

/**
 * Vueコンポーネントを生成するためのデータを取得(ブロック入力用)
 * @param state
 * @param startLine
 * @param endLine
 */
function getVueBlockComponentData(state: StateBlock, startLine: number, endLine: number): VueComponentData | undefined {
  // startLineとendLineで指定された範囲の行入力値を取得
  const startPos = state.bMarks[startLine] + state.tShift[startLine]
  const endPos = state.eMarks[startLine]
  const block = state.src.slice(startPos, endPos)

  // '@vue.'で開始されていない場合はインライン入力と判断するため無視
  if (!block.trim().startsWith('@vue.')) {
    return undefined
  }

  // ')'で終了していない場合はインライン入力と判断するため無視
  if (!block.trim().endsWith(')')) {
    return undefined
  }

  // 入力値から @Vue.MyComp({ … }) のボディレベルの構造を取得
  const bodyData = getMarkdownItVueComponentBodyData(block)
  if (!bodyData) return undefined

  // Vueコンポーネント指定の他にまだ入力がある場合はインラインと判断するため無視
  const lefBlock = block.replace(bodyData.fullMatch, '').trim()
  if (lefBlock) return undefined

  // まだ次の行がある場合
  if (startLine + 1 != endLine) {
    const nextStartPos = state.bMarks[startLine + 1] + state.tShift[startLine + 1]
    const nextEndPos = state.eMarks[startLine + 1]
    const nextBlock = state.src.slice(nextStartPos, nextEndPos)
    // 次の行に入力がある場合はインライン入力と判断するため無視
    if (nextBlock) return undefined
  }

  // @Vue.MyComp({ … }) のプロパティ部分のデータを取得
  const propsData = getMarkdownItVueComponentPropsData(bodyData.props)

  return {
    component: bodyData.component,
    props: propsData,
    content: bodyData.fullMatch,
  }
}

/**
 * Vueコンポーネントを生成するためのデータを取得(インライン入力用)
 * @param state
 */
function getVueInlineComponentData(state: StateInline): VueInlineComponentData | undefined {
  // stateで指定された範囲の行入力値を取得
  const block = state.src.substring(state.pos, state.posMax)

  // 入力値から @Vue.MyComp({ … }) のボディレベルの構造を取得
  const bodyData = getMarkdownItVueComponentBodyData(block)
  if (!bodyData) return undefined

  // @Vue.MyComp({…}) のプロパティ部分のデータを取得
  const propsData = getMarkdownItVueComponentPropsData(bodyData.props)

  // Vueコンポーネントの後にある次の入力値の開始/終了位置を取得
  const nextPos = state.pos + bodyData.index + bodyData.fullMatch.length
  const nextPosMax = state.src.length

  return {
    component: bodyData.component,
    props: propsData,
    nextPos,
    nextPosMax,
    content: bodyData.fullMatch,
  }
}

/**
 * 指定された入力値から @Vue.MyComp({…}) のボディレベルの構造を取得します。
 * NOTE: 単体テストのためexportしています。
 * @param block
 */
function getMarkdownItVueComponentBodyData(block: string): { fullMatch: string; component: string; props: string; index: number } | undefined {
  const re = /@vue.(\w+)\((?:{\s*(.*?)\s*})?\)/

  const execArr = re.exec(block)
  if (!execArr) return undefined

  const fullMatch = execArr[0]
  const component = execArr[1]
  const props = execArr[2]
  const index = execArr.index

  return { fullMatch, component, props, index }
}

/**
 * 指定された値を解析してプロパティに変換します。
 * NOTE: 単体テストのためexportしています。
 * @param rawProps
 *   例: `person: "{ "name": "Taro", "age": 18 }", flag: true`
 */
function getMarkdownItVueComponentPropsData(rawProps: string): { [name: string]: PropValueType } {
  let result: { [name: string]: PropValueType } = {}

  // 以下でJSONとプリミティブのプロパティを取得
  // 実行順は重要で、JSONプロパティ取得を先に実行する必要がある

  // JSONプロパティを取得
  const jsonPropsData = spliceJSONProps(rawProps)
  result = merge(result, jsonPropsData.props)

  // プリミティブプロパティを取得
  const primitivePropsData = splicePrimitiveProps(jsonPropsData.rawProps)
  result = merge(result, primitivePropsData.props)

  return result
}

/**
 * 指定された値からJSON入力を抽出し、プロパティに変換します。
 * またJSON入力の部分は`rawProps`から取り除いて返します。
 * @param rawProps
 *   例: `person: "{ "name": "Taro", "age": 18 }", arr: ["aaa", "bbb"], flag: true`
 */
function spliceJSONProps(rawProps: string): { rawProps: string; props: { [prop: string]: JSONType | undefined } } {
  const re = /([\w]+)\s*:\s*(?:("\s*{.*?}\s*")|("\s*\[.*?\]\s*"))\s*,?\s*/

  const result: { rawProps: string; props: { [prop: string]: JSONType | undefined } } = { rawProps, props: {} }

  let execArr: RegExpExecArray | null = null
  while ((execArr = re.exec(result.rawProps))) {
    const [fullMatch, name, object, array] = execArr
    if (name) {
      if (object) {
        result.props[name] = toJSONValue(object)
      } else if (array) {
        result.props[name] = toJSONValue(array)
      }
    }
    result.rawProps = result.rawProps.replace(fullMatch, '')
  }

  return result
}

/**
 * 指定された値からプリミティブ入力を抽出し、プロパティに変換します。
 * この関数を実行する前提として、JSON入力は取り除いておく必要があります。
 * @param rawProps
 *   例: `str: "aaa", flag: true, num: 20`
 */
function splicePrimitiveProps(rawProps: string): { rawProps: string; props: { [prop: string]: PrimitiveType } } {
  const re = /([\w]+)\s*:\s*(.+?)\s*,\s*|([\w]+)\s*:\s*(.+?)\s*$/

  const result: { rawProps: string; props: { [prop: string]: PrimitiveType } } = { rawProps, props: {} }

  let execArr: RegExpExecArray | null = null
  while ((execArr = re.exec(result.rawProps))) {
    const [fullMatch, name1, value1, name2, value2] = execArr
    if (name1) {
      result.props[name1] = toPrimitiveValue(value1)
    } else if (name2) {
      result.props[name2] = toPrimitiveValue(value2)
    }
    result.rawProps = result.rawProps.replace(fullMatch, '')
  }

  return result
}

function toJSONValue(rawValue: string): JSONType | undefined {
  if (!rawValue) return undefined

  // 前後の空白を除去
  rawValue = rawValue.trim()
  // 前後の｢"｣を除去
  const value = rawValue.substr(1, rawValue.length - 2)

  try {
    return JSON.parse(value)
  } catch {
    return undefined
  }
}

function toPrimitiveValue(rawValue: string): PrimitiveType {
  // undefined判定
  if (rawValue === void 0) return undefined

  // 前後の空白を除去
  rawValue = rawValue.trim()

  if (rawValue.startsWith('"') && rawValue.endsWith('"')) {
    return rawValue.substr(1, rawValue.length - 2)
  } else if (rawValue === 'true' || rawValue === 'false') {
    return rawValue === 'true'
  } else if (!isNaN(rawValue as any)) {
    return Number(rawValue)
  }

  return undefined
}

function isInlineElement(el: HTMLElement): boolean {
  const inlines = [
    'a',
    'abbr',
    'acronym',
    'audio',
    'b',
    'bdi',
    'bdo',
    'big',
    'br',
    'button',
    'canvas',
    'cite',
    'code',
    'data',
    'datalist',
    'del',
    'dfn',
    'em',
    'embed',
    'i',
    'iframe',
    'img',
    'input',
    'ins',
    'kbd',
    'label',
    'map',
    'mark',
    'meter',
    'noscript',
    'object',
    'output',
    'picture',
    'progress',
    'q',
    'ruby',
    's',
    'samp',
    'script',
    'select',
    'slot',
    'small',
    'span',
    'strong',
    'sub',
    'sup',
    'svg',
    'template',
    'textarea',
    'time',
    'u',
    'tt',
    'var',
    'video',
    'wbr',
  ]

  const display = el.style.display || ''

  if (display === 'block') return false
  if (display.startsWith('inline')) return true
  if (inlines.includes(el.tagName.toLowerCase())) return true

  return false
}

function MarkdownItVueComponent(md: MarkdownIt, options: MarkdownIt.Options) {
  //--------------------------------------------------
  //  Block
  //--------------------------------------------------

  md.block.ruler.before(
    'blockquote',
    'vueBlock',
    // @ts-ignore
    (state, startLine, endLine, silent) => {
      const compData = getVueBlockComponentData(state, startLine, endLine)
      if (!compData) return false

      if (!silent) {
        // 'div'を指定しているが最終的に置き換えられるため'div'でなくてもよい
        const token = state.push('vueBlock', 'div', 0)
        token.block = true
        token.info = {
          component: compData.component,
          props: compData.props,
        } as VueComponentData
        token.content = compData.content

        // 次のブロックの開始位置を指定
        state.line = startLine + 1
      }

      return true
    }
  )

  md.renderer.rules['vueBlock'] = (tokens, idx) => {
    const token = tokens[idx]
    const compInstance = newVueComponent(token, options['components'])
    if (!compInstance) {
      return `<p>${token.content}</p>\n`
    }

    return `${compInstance.$el.outerHTML}\n`
  }

  //--------------------------------------------------
  //  Inline
  //--------------------------------------------------

  md.inline.ruler.before('autolink', 'vueInline', (state, silent) => {
    const compData = getVueInlineComponentData(state)
    if (!compData) return false

    if (!silent) {
      // 'span'を指定しているが最終的に置き換えられるため'span'でなくてもよい
      const token = state.push('vueInline', 'span', 0)
      token.info = {
        component: compData.component,
        props: compData.props,
      } as VueComponentData
      token.content = compData.content
    }

    // 次のインラインの開始/終了位置を指定
    state.pos = compData.nextPos
    state.posMax = compData.nextPosMax
    return true
  })

  md.renderer.rules['vueInline'] = (tokens, idx) => {
    const token = tokens[idx]
    const compInstance = newVueComponent(token, options['components'])
    if (!compInstance) {
      return token.content
    }

    if (isInlineElement(compInstance.$el as HTMLElement)) {
      return compInstance.$el.outerHTML
    } else {
      return token.content
    }
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { MarkdownItVueComponent, getMarkdownItVueComponentBodyData, getMarkdownItVueComponentPropsData }
