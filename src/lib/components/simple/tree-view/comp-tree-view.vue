<style lang="sass" scoped>
@import '../../../styles/lib.variables'

.child-container
  color: var(--comp-tree-view-color, $app-link-color)
  font-size: var(--comp-tree-view-font-size, 14px)
  font-weight: var(--comp-tree-font-weight, $app-link-font-weight)
  padding: var(--comp-tree-padding, 10px)
</style>

<template>
  <div
    ref="childContainer"
    class="child-container"
    :style="{ minWidth: m_minWidth + 'px' }"
    @opened-changed="m_allNodesOnOpenedChanged"
    @node-added="m_nodeAdded"
    @node-before-removed="m_nodeBeforeRemoved"
    @node-removed="m_nodeRemoved"
    @selected-changed="m_allNodesOnSelectedChanged"
    @node-property-changed="m_allNodesOnNodePropertyChanged"
    @lazy-load="m_allNodesOnLazyLoad"
  ></div>
</template>

<script lang="ts">
import { ChildrenSortFunc, CompTreeNodeData, CompTreeNodeParent, CompTreeViewLazyLoadDoneFunc, CompTreeViewLazyLoadEvent } from './types'
import { BaseComponent } from '../../../base/component'
import CompTreeNode from './comp-tree-node.vue'
import { CompTreeViewUtils } from './comp-tree-view-utils'
import { Component } from 'vue-property-decorator'
import { NoCache } from '../../../base/decorators'
import Vue from 'vue'

/**
 * ツリーコンポーネントです。
 *
 * Custom property | Description | Default
 * ----------------|-------------|----------
 * `--comp-tree-distance` | ノードとノードの縦の間隔です | `6px`
 * `--comp-tree-indent` | ノードの左インデントです | `16px`
 * `--comp-tree-view-font-size` | ノードのフォントサイズです | `14px`
 * `--comp-tree-font-weight` | ノードのフォントの太さです | $link-font-weight
 * `--comp-tree-line-height` | ノードの行の高さです | `26px`
 * `--comp-tree-view-color` | ノードの文字色です | $link-color
 * `--comp-tree-selected-color` | ノード選択時の文字色です | `pink-5`
 * `--comp-tree-unselectable-color` | 非選択ノードの文字色です | `grey-9`
 * `--comp-tree-padding` | ツリービューのpaddingです | `10px`
 */
@Component
export default class CompTreeView<NODE_DATA extends CompTreeNodeData = any> extends BaseComponent implements CompTreeNodeParent {
  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  private m_children: CompTreeNode[] = []

  /**
   * ツリービューのトップレベルのノードです。
   */
  get children(): CompTreeNode[] {
    return this.m_children
  }

  private m_selectedNode: CompTreeNode | null = null

  /**
   * 選択ノードです。
   */
  get selectedNode(): CompTreeNode | undefined {
    return this.m_selectedNode ? this.m_selectedNode : undefined
  }

  set selectedNode(node: CompTreeNode | undefined) {
    const prevSelectedNode = this.selectedNode
    if (node) {
      if (prevSelectedNode && prevSelectedNode !== node) {
        prevSelectedNode.selected = false
      }
      node.selected = true
      this.m_selectedNode = node
    } else {
      if (prevSelectedNode) {
        prevSelectedNode.selected = false
      }
      this.m_selectedNode = null
    }
  }

  private m_sortFunc: ChildrenSortFunc | null = null

  /**
   * 子ノードの並びを決めるソート関数です。
   */
  get sortFunc(): ChildrenSortFunc | null {
    return this.m_sortFunc
  }

  /**
   * このプロパティはツリービューが内部的に使用するものであり、
   * ツリービューの利用者が使用することを想定していません。
   */
  readonly isTreeView = true

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  /**
   * ツリービューが管理する全ノードのマップです。
   * key: ノードを特定するための値, value: ノード
   */
  private m_allNodeDict: { [key: string]: CompTreeNode } = {}

  /**
   * ツリービューの最小幅です。
   */
  private get m_minWidth(): number {
    let result = 0
    for (const child of this.children) {
      if (result < child.minWidth) {
        result = child.minWidth
      }
    }
    return result + CompTreeViewUtils.getElementFrameWidth(this.m_childContainer)
  }

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

  @NoCache
  get m_childContainer(): HTMLElement {
    return this.$refs.childContainer as HTMLElement
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  /**
   * 指定されたノードデータからノードツリーを構築します。
   * @param nodeDataList ノードツリーを構築するためのデータ
   * @param options
   * <ul>
   *   <li>sortFunc: 子ノードの並びを決めるソート関数</li>
   *   <li>insertIndex: ノード挿入位置。ノードに`sortFunc`が設定されている場合、この値は無視されます。</li>
   * </ul>
   */
  buildTree(nodeDataList: NODE_DATA[], options?: { sortFunc?: ChildrenSortFunc; insertIndex?: number | null }): void {
    let { sortFunc, insertIndex } = options || { sortFunc: undefined, insertIndex: undefined }
    this.m_sortFunc = sortFunc || null

    nodeDataList.forEach(nodeData => {
      this.m_addNodeByData(nodeData, { insertIndex })
      if (!(insertIndex === undefined || insertIndex === null)) {
        insertIndex++
      }
    })
  }

  /**
   * ノードを追加します。
   * @param node ノード、またはノードを構築するためのデータ
   * @param options
   * <ul>
   *   <li>parent: 親ノードを特定するための値。指定されない場合、ツリービューの子として追加されます。</li>
   *   <li>insertIndex: ノード挿入位置。ノードに`sortFunc`が設定されている場合、この値は無視されます。</li>
   * </ul>
   */
  addNode(node: NODE_DATA | CompTreeNode, options?: { parent?: string; insertIndex?: number | null }): CompTreeNode {
    options = options || {}

    let result!: CompTreeNode
    const childType = node instanceof Vue ? 'Node' : 'Data'

    // 親が指定されている場合
    // (親を特定する値が空文字の場合があるのでtypeofを使用している)
    if (typeof options.parent === 'string') {
      const parentNode = this.getNode(options.parent)
      if (!parentNode) {
        throw new Error(`The parent node '${options.parent}' does not exist.`)
      }
      result = parentNode.addChild(node, options)
    }
    // 親が指定されていない場合
    else {
      // 引数のノードがノードコンポーネントで指定された場合
      if (childType === 'Node') {
        result = this.m_addNodeByNode(node as CompTreeNode, options)
      }
      // 引数のノードがノードデータで指定された場合
      else if (childType === 'Data') {
        result = this.m_addNodeByData(node as NODE_DATA, options)
      }
    }

    return result
  }

  /**
   * ノードを削除します。
   * @param value ノードを特定するための値
   */
  removeNode<Node extends CompTreeNode = CompTreeNode>(value: string): Node | undefined {
    const node = this.getNode<Node>(value)
    if (!node) return

    // 親がツリービューの場合
    // (node.parentが空の場合、親はツリービュー)
    if (!node.parent) {
      this.m_removeChildFromContainer(node)
      CompTreeViewUtils.dispatchNodeRemoved(this, node)
    }
    // 親がノードの場合
    else {
      node.parent.removeChild(node)
    }

    return node
  }

  /**
   * 全てのノードを削除します。
   */
  removeAllNodes(): void {
    for (const node of Object.values(this.m_allNodeDict)) {
      this.removeNode(node.value)
    }
  }

  /**
   * ノードを特定するためのvalueと一致するノードを取得します。
   * @param value ノードを特定するための値
   */
  getNode<Node extends CompTreeNode = CompTreeNode>(value: string): Node | undefined {
    return this.m_allNodeDict[value] as Node | undefined
  }

  /**
   * ツリービューの全ノードをツリー構造から平坦化した配列形式で取得します。
   */
  getAllNodes<Node extends CompTreeNode = CompTreeNode>(): Node[] {
    const result: CompTreeNode[] = []
    for (const child of this.m_children) {
      result.push(child)
      result.push(...CompTreeViewUtils.getDescendants(child))
    }
    return result as Node[]
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  private m_addNodeByData(nodeData: NODE_DATA, options?: { insertIndex?: number | null }): CompTreeNode {
    options = options || {}

    if (this.getNode(nodeData.value)) {
      throw new Error(`The node '${nodeData.value}' already exists.`)
    }

    // ノードの作成
    const node = CompTreeViewUtils.newNode(nodeData)

    // ノード挿入位置を決定
    const insertIndex = this.m_getInsertIndex(node, options)

    // コンテナにノードを追加
    this.m_insertChildIntoContainer(node, insertIndex)

    // 子ノードの設定
    const len = nodeData.children ? nodeData.children.length : 0
    for (let i = 0; i < len; i++) {
      node.addChild(nodeData.children![i], { insertIndex: i })
    }

    // ノードが追加されたことを通知するイベントを発火
    CompTreeViewUtils.dispatchNodeAdded(node)

    return node
  }

  private m_addNodeByNode(node: CompTreeNode, options?: { insertIndex?: number | null }): CompTreeNode {
    options = options || {}

    // 追加ノードの親が自身のツリービューの場合
    // ※自身のツリービューの子として追加ノードが既に存在する場合
    if (!node.parent && node.treeView === this) {
      const newInsertIndex = this.m_getInsertIndex(node, options)
      const currentIndex = this.children.indexOf(node)
      // 現在の位置と新しい挿入位置が同じ場合
      if (currentIndex === newInsertIndex) {
        CompTreeViewUtils.dispatchNodeAdded(node)
        for (const descendant of CompTreeViewUtils.getDescendants(node)) {
          CompTreeViewUtils.dispatchNodeAdded(descendant)
        }
        return node
      }
    }

    //
    // 前の親から追加ノードを削除
    //
    if (node.parent) {
      // 親ノードから追加ノードを削除
      node.parent.removeChild(node)
    } else {
      // 親ノードがない場合ツリービューが親となるので、ツリービューから自ノードを削除
      node.treeView && node.treeView.removeNode(node.value)
    }

    // ノード挿入位置を決定
    const insertIndex = this.m_getInsertIndex(node, options)

    // コンテナにノードを追加
    this.m_insertChildIntoContainer(node, insertIndex)

    // 子ノードの設定
    for (let i = 0; i < node.children.length; i++) {
      const childNode = node.children[i]
      node.addChild(childNode, { insertIndex: i })
    }

    // ノードが追加されたことを通知するイベントを発火
    CompTreeViewUtils.dispatchNodeAdded(node)

    return node
  }

  m_getInsertIndex(newNode: CompTreeNode, options?: { insertIndex?: number | null }): number {
    options = options || {}

    // ソート関数が指定されている場合
    if (typeof this.sortFunc === 'function') {
      const children: CompTreeNode[] = []
      if (this.children.includes(newNode)) {
        children.push(...this.children)
      } else {
        children.push(...this.children, newNode)
      }
      children.sort(this.sortFunc)
      return children.indexOf(newNode)
    }
    // 挿入位置が指定された場合
    else if (typeof options.insertIndex === 'number') {
      return options.insertIndex
    }
    // 何も指定されていなかった場合
    else {
      return this.children.length
    }
  }

  /**
   * ノードが発火する標準のイベントとは別に、独自イベント用のリスナを登録します。
   * @param eventName
   */
  m_addExtraNodeEventListener(eventName: string): void {
    this.m_childContainer.removeEventListener(eventName, this.m_allNodesOnExtraNodeEvent)
    this.m_childContainer.addEventListener(eventName, this.m_allNodesOnExtraNodeEvent)
  }

  /**
   * コンテナへノードを挿入します。
   * @param node 追加するノード
   * @param insertIndex ノード挿入位置
   */
  private m_insertChildIntoContainer(node: CompTreeNode, insertIndex: number): void {
    const childrenLength = this.m_childContainer.children.length

    // 挿入位置が大きすぎないかを検証
    if (childrenLength < insertIndex) {
      throw new Error('insertIndex is too big.')
    }

    // コンテナにノードを追加
    if (childrenLength === insertIndex) {
      this.m_childContainer.appendChild(node.$el)
    } else {
      const afterNode = this.m_childContainer.children[insertIndex]
      this.m_childContainer.insertBefore(node.$el, afterNode)
    }

    this.m_children.splice(insertIndex, 0, node)

    // ルートノードにツリービューを設定
    node.treeView = this

    // 最年長ノードフラグを再設定
    this.m_restIsEldest()
  }

  /**
   * コンテナからノードを削除します。
   * @node 削除するノード
   */
  private m_removeChildFromContainer(node: CompTreeNode): void {
    // ツリービューまたはツリービューの親がアンマウントされると、
    // ツリービュー内の要素を取得できない場合がある。このような状況を考慮し、
    // 要素の存在チェックをしてから指定されたノードの削除を行っている。
    this.m_childContainer && this.m_childContainer.removeChild(node.$el)

    const index = this.m_children.indexOf(node)
    if (index >= 0) {
      this.m_children.splice(index, 1)
    }

    // ルートノードのツリービューをクリア
    node.treeView = null

    // 最年長ノードフラグを再設定
    this.m_restIsEldest()
  }

  /**
   * 最年長ノードフラグを再設定します。
   */
  private m_restIsEldest(): void {
    this.m_children.forEach((node, index) => {
      node.isEldest = index === 0
    })
  }

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------

  /**
   * ツリービューにノードが追加された際のリスナです。
   * @param e
   */
  private m_nodeAdded(e) {
    e.stopImmediatePropagation()

    const node = e.target.__vue__ as CompTreeNode
    this.m_allNodeDict[node.value] = node

    // ノードが発火する独自イベントの設定
    for (const eventName of node.extraEventNames) {
      this.m_addExtraNodeEventListener(eventName)
    }

    if (node.selected) {
      this.selectedNode = node
    }
  }

  /**
   * ツリービューからノードが削除される直前のリスナです。
   * @param e
   */
  private m_nodeBeforeRemoved(e) {
    e.stopImmediatePropagation()

    const node = e.detail.node as CompTreeNode

    const nodeDescendants = [node, ...node.getDescendants()]
    for (const iNode of nodeDescendants) {
      if (this.selectedNode === iNode) {
        this.selectedNode = undefined
        break
      }
    }
  }

  /**
   * ツリービューからノードが削除された際のリスナです。
   * @param e
   */
  private m_nodeRemoved(e) {
    e.stopImmediatePropagation()

    const node = e.detail.node as CompTreeNode
    for (const descendant of CompTreeViewUtils.getDescendants(node)) {
      delete this.m_allNodeDict[descendant.value]
    }
    delete this.m_allNodeDict[node.value]
  }

  /**
   * ノードでnode-property-changedイベントが発火した際のリスナです。
   * @param e
   */
  private m_allNodesOnNodePropertyChanged(e) {
    e.stopImmediatePropagation()

    const node = e.target.__vue__ as CompTreeNode
    const detail = e.detail as CompTreeViewUtils.NodePropertyChangeDetail

    if (detail.property === 'value') {
      delete this.m_allNodeDict[detail.oldValue]
      this.m_allNodeDict[detail.newValue] = node
    }
  }

  /**
   * ノードでnode-loadingイベントが発火した際のリスナです。
   * @param e
   */
  private m_allNodesOnLazyLoad(e) {
    e.stopImmediatePropagation()

    const node = e.target.__vue__ as CompTreeNode
    const done = e.detail.done as CompTreeViewLazyLoadDoneFunc

    this.$emit('lazy-load', { node, done } as CompTreeViewLazyLoadEvent)
  }

  /**
   * ノードでopened-changedイベントが発火した際のリスナです。
   * @param e
   */
  private m_allNodesOnOpenedChanged(e) {
    e.stopImmediatePropagation()

    const node = e.target.__vue__ as CompTreeNode
    this.$emit('opened-changed', node)
  }

  /**
   * ノードでselected-changedイベントが発火した際のリスナです。
   * @param e
   */
  private m_allNodesOnSelectedChanged(e) {
    e.stopImmediatePropagation()

    const node = e.target.__vue__ as CompTreeNode

    // ノードが選択された場合
    if (node.selected) {
      this.selectedNode = node
      this.$emit('selected', node)
    }
    // ノードの選択が解除された場合
    else {
      if (this.selectedNode === node) {
        this.selectedNode = undefined
      }
      this.$emit('unselected', node)
    }
  }

  /**
   * ノードが発火する標準のイベントとは別に、独自イベントが発火した際のリスナです。
   * @param e
   */
  private m_allNodesOnExtraNodeEvent(e) {
    e.stopImmediatePropagation()

    const node = e.target.__vue__ as CompTreeNode
    this.$emit(e.type, node)
  }
}
</script>
