import { CompTreeNodeData, CompTreeViewLazyLoadDoneFunc } from '@/example/components/tree-view/types'
import CompTreeNode from '@/example/components/tree-view/comp-tree-node.vue'
import CompTreeView from '@/example/components/tree-view/comp-tree-view.vue'
import Vue from 'vue'

export namespace CompTreeViewUtils {
  /**
   * ノードを作成します。
   * @param nodeData
   */
  export function newNode<N extends CompTreeNode = CompTreeNode>(nodeData: CompTreeNodeData): N {
    // プログラム的にコンポーネントのインスタンスを生成
    // https://css-tricks.com/creating-vue-js-component-instances-programmatically/
    const NodeClass = Vue.extend(nodeData.nodeClass || CompTreeNode)
    const node = new NodeClass() as any
    node.init(nodeData)
    node.$mount()
    return node
  }

  /**
   * 指定されたノードの子孫を配列で取得します。
   * @param node
   */
  export function getDescendants<N extends CompTreeNode = CompTreeNode>(node: CompTreeNode): N[] {
    const getChildren = (node: N) => {
      const result: N[] = []
      for (const child of (node as any).children) {
        result.push(child)
        result.push(...getChildren(child))
      }
      return result
    }

    const result: N[] = []
    for (const child of (node as any).children) {
      result.push(child)
      result.push(...getChildren(child))
    }
    return result
  }

  /**
   * 指定されたノードの子孫をマップで取得します。
   * @param node
   */
  export function getDescendantDict<N extends CompTreeNode = CompTreeNode>(node: CompTreeNode): { [value: string]: N } {
    const getChildren = (node: N, result: { [value: string]: N }) => {
      for (const child of (node as any).children) {
        result[child.value] = child
        getChildren(child, result)
      }
      return result
    }

    const result: { [value: string]: N } = {}
    for (const child of (node as any).children) {
      result[child.value] = child
      getChildren(child, result)
    }
    return result
  }

  /**
   * ノードが追加された旨を通知するイベントを発火します。
   * @param node
   */
  export function dispatchNodeAdd(node: CompTreeNode): void {
    node.$el.dispatchEvent(
      new CustomEvent('node-add', {
        bubbles: true,
        cancelable: true,
        composed: true,
      })
    )
  }

  /**
   * ノードが削除される直前を通知するイベントを発火します。
   * @param parent
   * @param child
   */
  export function dispatchBeforeNodeRemove(parent: CompTreeView | CompTreeNode, child: CompTreeNode): void {
    parent.$el.dispatchEvent(
      new CustomEvent('before-node-remove', {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: { node: child },
      })
    )
  }

  /**
   * ノードが削除された旨を通知するイベントを発火します。
   * @param parent
   * @param child
   */
  export function dispatchNodeRemove(parent: CompTreeView | CompTreeNode, child: CompTreeNode): void {
    parent.$el.dispatchEvent(
      new CustomEvent('node-remove', {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: { node: child },
      })
    )
  }

  /**
   * ノードの選択が変更された旨を通知するイベントを発火します。
   * @param target
   * @param silent
   */
  export function dispatchSelectChange(target: CompTreeNode, silent: boolean): void {
    target.$el.dispatchEvent(
      new CustomEvent('select-change', {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: { silent },
      })
    )
  }

  /**
   * ノードの選択された旨を通知するイベントを発火します。
   * @param target
   * @param silent
   */
  export function dispatchSelect(target: CompTreeNode, silent: boolean): void {
    target.$el.dispatchEvent(
      new CustomEvent('select', {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: { silent },
      })
    )
  }

  export interface NodePropertyChangeDetail {
    property: 'value' | 'label'
    oldValue: any
    newValue: any
  }

  /**
   * ノードのプロパティが変更された旨を通知するイベントを発火します。
   * @param target
   * @param detail
   */
  export function dispatchNodePropertyChange(target: CompTreeNode, detail: NodePropertyChangeDetail): void {
    target.$el.dispatchEvent(
      new CustomEvent('node-property-change', {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail,
      })
    )
  }

  /**
   * ノードの遅延ローディングが開始された旨を通知するイベントを発火します。
   * @param target
   * @param done
   */
  export function dispatchLazyLoad(target: CompTreeNode, done: CompTreeViewLazyLoadDoneFunc): void {
    target.$el.dispatchEvent(
      new CustomEvent('lazy-load', {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: { done },
      })
    )
  }

  /**
   * 文字列を浮動小数点数へ変換します。
   * @param value
   */
  export function toFloat(value?: string): number {
    const result = parseFloat(value || '0')
    return isNaN(result) ? 0 : result
  }

  /**
   * 指定されたスタイルの幅を取得します。
   * @param style
   */
  export function getElementWidth(style: CSSStyleDeclaration): number

  /**
   * 指定された要素の幅を取得します。
   * @param element
   */
  export function getElementWidth(element: Element): number

  export function getElementWidth(elementOrStyle: Element | CSSStyleDeclaration): number {
    if (!elementOrStyle) return 0
    let result = 0
    let style: CSSStyleDeclaration
    if (elementOrStyle instanceof Element) {
      style = getComputedStyle(elementOrStyle)
    } else {
      style = elementOrStyle as CSSStyleDeclaration
    }
    result += toFloat(style.getPropertyValue('width'))
    result += getElementFrameWidth(style)
    return result
  }

  /**
   * 指定されたスタイルの枠の幅を取得します。
   * @param style
   */
  export function getElementFrameWidth(style: CSSStyleDeclaration): number

  /**
   * 指定された要素の枠の幅を取得します。
   * @param element
   */
  export function getElementFrameWidth(element: Element): number

  export function getElementFrameWidth(elementOrStyle: Element | CSSStyleDeclaration): number {
    if (!elementOrStyle) return 0
    let result = 0
    let style: CSSStyleDeclaration
    if (elementOrStyle instanceof Element) {
      style = getComputedStyle(elementOrStyle)
    } else {
      style = elementOrStyle as CSSStyleDeclaration
    }
    result += toFloat(style.getPropertyValue('border-left-width'))
    result += toFloat(style.getPropertyValue('border-right-width'))
    result += toFloat(style.getPropertyValue('margin-left'))
    result += toFloat(style.getPropertyValue('margin-right'))
    result += toFloat(style.getPropertyValue('padding-left'))
    result += toFloat(style.getPropertyValue('padding-right'))
    return result
  }

  /**
   * 指定された要素の高さを取得します。
   * @param element
   */
  export function getElementHeight(element: Element): number

  /**
   * 指定されたスタイルの高さを取得します。
   * @param style
   */
  export function getElementHeight(style: CSSStyleDeclaration): number

  export function getElementHeight(elementOrStyle: Element | CSSStyleDeclaration): number {
    if (!elementOrStyle) return 0
    let result = 0
    let style: CSSStyleDeclaration
    if (elementOrStyle instanceof Element) {
      style = getComputedStyle(elementOrStyle)
    } else {
      style = elementOrStyle as CSSStyleDeclaration
    }
    result += toFloat(style.getPropertyValue('height'))
    result += getElementFrameHeight(style)
    return result
  }

  /**
   * 指定された要素の枠の高さを取得します。
   * @param element
   */
  export function getElementFrameHeight(element: Element): number

  /**
   * 指定されたスタイルの枠の高さを取得します。
   * @param style
   */
  export function getElementFrameHeight(style: CSSStyleDeclaration): number

  export function getElementFrameHeight(elementOrStyle: Element | CSSStyleDeclaration): number {
    if (!elementOrStyle) return 0
    let result = 0
    let style: CSSStyleDeclaration
    if (elementOrStyle instanceof Element) {
      style = getComputedStyle(elementOrStyle)
    } else {
      style = elementOrStyle as CSSStyleDeclaration
    }
    result += toFloat(style.getPropertyValue('border-left-height'))
    result += toFloat(style.getPropertyValue('border-right-height'))
    result += toFloat(style.getPropertyValue('margin-top'))
    result += toFloat(style.getPropertyValue('margin-bottom'))
    result += toFloat(style.getPropertyValue('padding-top'))
    result += toFloat(style.getPropertyValue('padding-bottom'))
    return result
  }
}
