import { Selector } from 'testcafe'
import { Vue } from 'vue/types/vue'

interface VueSelector extends Selector {
  /**
   * Vueコンポーネントを検索します。
   *
   * 次のようなvueファイルが定義された場合の例を示します。
   *
   * my-page.vue
   * ```
   * <template>
   *   <div>
   *     <input :data-tid="tid('messageInput')">
   *   </div>
   * </template>
   *
   * <script lang="ts">
   * import { BaseComponent } from '@/lib'
   *
   * @Component
   * export default class MyPage extends BaseComponent {
   *   …
   * }
   * </script>
   * ```
   *
   * 例1: 引数に vueSelector = "my-page" or "MyPage" を指定した場合、
   * この値と一致するコンポーネントを検索します。
   *
   * 例2: 引数に vueSelector = "my-page" , tid = "messageInput" を指定した場合、
   * `vueSelector`で指定したコンポーネント配下にある`tid`の要素を検索します。
   *
   * @param vueSelector
   * @param tid
   */
  (vueSelector: string, tid?: string): VueSelector

  /**
   * ノードから指定されたフィールドの値を取得します。
   * @param fieldName
   * @param fn
   */
  getFieldValue(fieldName: string, fn?: (value: any) => any): Promise<any>

  find(cssSelector: string): VueSelector

  find(filterFn: (node: Element, idx: number, originNode: Element) => boolean, dependencies?: { [key: string]: any }): VueSelector

  /**
   * nodeからVueのデータを抽出します。
   * @param fn
   * @deprecated 引数のnodeによってはスタックオーバーフローが発生するため使用は非推奨
   */
  getVue(fn?: (params: { props: any; state: any; computed: any; ref: any }) => any): Promise<any>
}

export const VueSelector = Selector((vueSelector: string, tid?: string) => {
  //--------------------------------------------------
  //  Functions
  //--------------------------------------------------

  /**
   * 引数の値をパスカルケースへ変換します。
   *
   * 次のライブラリのコードをコピー:
   * https://github.com/jonschlinkert/pascalcase/blob/master/index.js
   *
   * @param value
   */
  function pascalcase(value: string) {
    const titlecase = input => input[0].toLocaleUpperCase() + input.slice(1)

    if (value === null || value === void 0) return ''
    if (typeof value.toString !== 'function') return ''

    let input = value.toString().trim()
    if (input === '') return ''
    if (input.length === 1) return input.toLocaleUpperCase()

    let match = input.match(/[a-zA-Z0-9]+/g)
    if (match) {
      return match.map(m => titlecase(m)).join('')
    }

    return input
  }

  /**
   * セレクターに適切な値が設定されているか検証します。
   * @param selector
   */
  function validateSelector(selector: any) {
    if (selector !== void 0 && typeof selector !== 'string')
      throw new Error('If the selector parameter is passed it should be a string, but it was ' + eval('typeof selector'))
  }

  /**
   * Vueのバージョンが適切かを検証し、対象バージョンでない場合は例外をスローします。
   * @param vueInstance
   */
  function validateVueVersion(vueInstance) {
    const MAJOR_SUPPORTED_VUE_VERSION = 2
    const vueVersion = parseInt(findVueConstructor(vueInstance).version.split('.')[0], 10)

    if (vueVersion < MAJOR_SUPPORTED_VUE_VERSION) throw new Error('testcafe-vue-selectors supports Vue version 2.x and newer')
  }

  /**
   * Vueインスタンスからコンストラクタを取得します。
   * @param vueInstance
   */
  function findVueConstructor(vueInstance) {
    // NOTE: Testcafe does not support a ClientFunction containing polyfilled functions. See list in
    // https://github.com/babel/babel/blob/master/packages/babel-plugin-transform-runtime/src/definitions.js.
    // This is why, we use this hack.
    let Vue = eval('Object.getPrototypeOf(vueInstance)').constructor
    while (Vue.super) Vue = Vue.super
    return Vue
  }

  /**
   * ルートとなるVueインスタンスを検索します。
   */
  function findRootVueNode(): Vue | null {
    let instance = null
    const treeWalker = document.createTreeWalker(document, NodeFilter.SHOW_ELEMENT)

    while (!instance && treeWalker.nextNode()) {
      instance = (treeWalker as any).currentNode.__vue__
    }

    return instance
  }

  /**
   * 指定されたセレクタをコンポーネントタグ名の配列に変換します。
   * 例: 引数に"MyPage ref:messageInput"が指定された場合、
   *     ["MyPage", "messageInput"]が返されます。
   * @param selector
   */
  function toComponentTagNames(selector: string): string[] {
    return selector
      .split(' ')
      .filter(el => !!el)
      .map(el => el.trim())
  }

  /**
   * 指定されたインスタンスからコンポーネントのタグ名を取得します。
   * 例: "my-page", "MyPage" などが返されます。
   * @param instance
   */
  function getComponentTag(instance): string {
    return instance.$options.name || instance.$options._componentTag || instance.$options.__file || ''
  }

  /**
   * 指定されたセレクタがref参照か否かを判定します。
   * @param selector
   */
  function isRef(selector: string): boolean {
    return selector.indexOf('ref:') !== -1
  }

  /**
   * 指定されたセレクタからref参照の名前を取得します。
   * 例: 引数に"ref:messageInput"が指定された場合、"messageInput"が返されます。
   * @param selector
   */
  function getRef(selector) {
    if (selector.indexOf('ref:') === 0 && selector.split('ref:')[1]) return selector.split('ref:')[1]
    throw new Error('"If the ref is passed as selector it should be in the format \'ref:ref-selector\'"')
  }

  /**
   * 指定されたノードからref参照が示す要素を取得します。
   * @param node
   */
  function getRefOfNode(node) {
    if (node.$vnode && node.$vnode.data) return node.$vnode.data.ref
    return null
  }

  /**
   * 指定されたselectorsで取得するノードをフィルタします。
   * @param root
   * @param selectors Vueコンポーネントのタグまたはrefの値の配列。
   *   例: ['my-page', 'refContainer']
   */
  function filterNodes(root: Vue, selectors: string[]): Vue[] {
    const foundComponents: Vue[] = []

    // nodeがVueコンポーネントか、refで指定されたノードかをチェック
    function checkVueComponentOrRefNode(node, selector): boolean {
      if (isRef(selector)) {
        const ref = getRef(selector)
        return ref === getRefOfNode(node)
      }
      return pascalcase(selector) === pascalcase(getComponentTag(node))
    }

    function walkVueComponentNodes(node: Vue, selectorIdx: number) {
      if (checkVueComponentOrRefNode(node, selectors[selectorIdx])) {
        if (selectorIdx === selectors.length - 1) {
          foundComponents.push(node)
          return
        }
        selectorIdx++
      }

      for (let i = 0; i < node.$children.length; i++) {
        const childNode = node.$children[i]
        walkVueComponentNodes(childNode, selectorIdx)
      }
    }

    walkVueComponentNodes(root, 0)

    return foundComponents
  }

  //--------------------------------------------------
  //  Procedure
  //--------------------------------------------------

  // Vueセレクターに適切な値が設定されているか検証
  validateSelector(vueSelector)

  // ルートとなるVueインスタンスを取得
  const rootVueInstance = findRootVueNode()
  if (!rootVueInstance) throw new Error('The root Vue instance was not found.')

  // ルートインスタンスからVueのバージョンが適切かを検証
  validateVueVersion(rootVueInstance)

  // 引数に値が設定されている場合、ルートインスタンスの要素を返す
  if (!vueSelector) return rootVueInstance.$el

  // Vueセレクタをコンポーネントタグ名の配列に変換
  const componentTags = toComponentTagNames(vueSelector)

  // ルートインスタンス配下からVueセレクタと一致する要素を検索
  const vueNodes = filterNodes(rootVueInstance, componentTags)

  // 引数のtidが指定されていなかった場合、検索されたVueノード一覧を返す
  if (!tid) {
    return vueNodes.map(vueNode => vueNode.$el as Node)
  }

  // ■ 以下tidが指定されなかった場合の処理

  // Vueセレクタと一致する要素が検索されなかった場合
  if (!vueNodes.length) {
    throw new Error(`No nodes matching "${vueSelector}" were found.`)
  }

  // Vueセレクタと一致した要素をtidのコンテナノードとみなし、
  // コンテナノード配下にtidと一致するノードを検索する
  const containerVueNode = vueNodes[0]
  const tidValue = `${containerVueNode.$vnode.tag}-${tid}`
  const tidSelector = `[data-tid="${tidValue}"]`
  // tidSelectorの例: [data-tid="vue-component-87-MyPage-messageInput"]
  const tidNode = document.querySelector(tidSelector) as Node

  return tidNode
}).addCustomMethods({
  getFieldValue: (node: Element, fieldName: string, fn: (value: any) => any) => {
    let value = undefined
    const vueNode = (node as any).__vue__
    if (vueNode) value = vueNode[fieldName]
    if (!value) value = node[fieldName]
    if (typeof fn === 'function') return fn(value)
    return value
  },

  getVue: (node: Element, fn?: (params: { props: any; state: any; computed: any; ref: any }) => any) => {
    /**
     * TestCafeでDOMエレメントを返すとエラーになってしまうため、
     * 返してはならないプロパティをobjから間引きます。
     * @param obj
     */
    function thinObject(obj?) {
      // objがDOMエレメントの場合はundefinedとして返す
      if (!obj || obj instanceof Node) return undefined
      // objが空またはオブジェクト以外(例えばプリミティブな値)の場合、objをそのまま返す
      if (!obj || typeof obj !== 'object') return obj

      /**
       * プロパティが間引き対象か否かを判定します。
       * 間引き処理を行う際にどうしても循環参照が発生するため、
       * 循環参照のもととなるプロパティも間引きの対象とします。
       * @param objOrProto
       * @param propertyName
       */
      const isThinProperty = (objOrProto: any, propertyName: string) => {
        if (propertyName === 'constructor') return true
        if (/^__.*__$/.test(propertyName)) return true
        if (/^\$.*/.test(propertyName)) return true
        if (/^_.*/.test(propertyName)) return true
        const desc = Object.getOwnPropertyDescriptor(objOrProto, propertyName)
        const isProperty = desc && typeof desc.value !== 'function'
        if (!isProperty) return true
        if (obj[propertyName] instanceof Node) return true
        return false
      }

      /**
       * 指定されたオブジェクトまたはプロトタイプから
       * 対象外のプロパティを間引いたオブジェクトを作成します。
       * @param objOrProto
       */
      const createThinnedObject = (objOrProto: any) => {
        const result: { [name: string]: any } = {}
        for (const name of Object.getOwnPropertyNames(objOrProto)) {
          if (isThinProperty(objOrProto, name)) continue
          let value = obj[name]
          if (Array.isArray(value)) {
            const array: any[] = []
            for (const item of value) {
              if (typeof item === 'object') {
                array.push(thinObject(item))
              } else {
                array.push(item)
              }
            }
            value = array
          } else if (typeof value === 'object') {
            value = thinObject(value)
          }
          result[name] = value
        }
        return result
      }

      // オブジェクトから間引きオブジェクトを作成
      const thinnedFromObj = createThinnedObject(obj)

      // プロトタイプから間引きオブジェクトを作成
      let thinnedFromProto: { [name: string]: any } = {}
      const isContinue = (proto: any) => {
        const className = proto && proto.constructor ? proto.constructor.name : ''
        return proto && className !== 'Object'
      }
      let proto = Object.getPrototypeOf(obj)
      while (isContinue(proto)) {
        thinnedFromProto = Object.assign(thinnedFromProto, createThinnedObject(proto))
        proto = Object.getPrototypeOf(proto)
      }

      return Object.assign(thinnedFromObj, thinnedFromProto)
    }

    /**
     * インスタンスから指定されたプロパティを集めたオブジェクトを作成し、取得します。
     * @param instance
     * @param props
     */
    function getData(instance, props): {} {
      const result = {}

      Object.keys(props).forEach(key => {
        result[key] = thinObject(instance[key])
      })

      return result
    }

    /**
     * Vueのプロパティをオブジェクトにまとめ、取得します。
     * @param instance
     */
    function getProps(instance): {} {
      return getData(instance, instance.$options.props || {})
    }

    /**
     * Vueのステート(Vueのインスタンス変数、Vueのインスタンス変数にバインドされたVuexプロパティ)を
     * オブジェクトにまとめ、取得します。
     * @param instance
     */
    function getState(instance): {} {
      const props = instance._props || instance.$options.props
      const getters = instance.$options.vuex && instance.$options.vuex.getters
      const result = {}

      Object.keys(instance._data)
        .filter(key => !(props && key in props) && !(getters && key in getters))
        .forEach(key => {
          result[key] = thinObject(instance._data[key])
        })

      return result
    }

    /**
     * Vueの算出プロパティをオブジェクトにまとめ、取得します。
     * @param instance
     */
    function getComputed(instance): {} {
      return getData(instance, instance.$options.computed || {})
    }

    /**
     * Vueインスタンスにつけられているref名を取得します。
     * @param instance
     */
    function getComponentReference(instance): string | undefined {
      return instance.$vnode && instance.$vnode.data && instance.$vnode.data.ref
    }

    const nodeVue = (node as any).__vue__
    if (!nodeVue) return null

    const props = getProps(nodeVue)
    const state = getState(nodeVue)
    const computed = getComputed(nodeVue)
    const ref = getComponentReference(nodeVue)

    if (typeof fn === 'function') return fn({ props, state, computed, ref })

    return { props, state, computed, ref }
  },
}) as VueSelector
