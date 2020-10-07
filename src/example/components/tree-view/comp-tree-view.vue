<style lang="sass" scoped>
@import 'src/example/styles/app.variables'

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
    @open-change="m_allNodesOnOpenChange"
    @node-add="m_onNodeAdd"
    @before-node-remove="m_onBeforeNodeRemove"
    @node-remove="m_onNodeRemove"
    @select-change="m_allNodesOnSelectChange"
    @select="m_allNodesOnSelectDebounce"
    @node-property-change="m_allNodesOnNodePropertyChange"
    @lazy-load="m_allNodesOnLazyLoad"
  ></div>
</template>

<script lang="ts">
import { BaseComponent, NoCache } from '@/example/base'
import {
  ChildrenSortFunc,
  CompTreeNodeData,
  CompTreeNodeParent,
  CompTreeViewEvent,
  CompTreeViewLazyLoadDoneFunc,
  CompTreeViewLazyLoadEvent,
} from '@/example/components/tree-view/types'
import CompTreeNode from '@/example/components/tree-view/comp-tree-node.vue'
import { CompTreeViewUtils } from '@/example/components/tree-view/comp-tree-view-utils'
import { Component } from 'vue-property-decorator'
import Vue from 'vue'
import debounce from 'lodash/debounce'

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
export default class CompTreeView<FAMILY_NODE extends CompTreeNode = CompTreeNode> extends BaseComponent implements CompTreeNodeParent {
  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  created() {
    this.m_allNodesOnSelectDebounce = debounce(this.m_allNodesOnSelect, 0)
  }

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  private m_children: FAMILY_NODE[] = []

  /**
   * ツリービューのトップレベルのノードです。
   */
  get children(): FAMILY_NODE[] {
    return this.m_children
  }

  private m_selectedNode: FAMILY_NODE | null = null

  /**
   * 選択ノードです。
   */
  get selectedNode(): FAMILY_NODE | null {
    return this.m_selectedNode
  }

  set selectedNode(node: FAMILY_NODE | null) {
    const currentSelectedNode = this.selectedNode

    // 選択ノードが指定された場合
    if (node) {
      // 現在の選択ノードと指定されたノードが違う場合
      if (currentSelectedNode && currentSelectedNode !== node) {
        // 現在の選択ノードを非選択にする
        currentSelectedNode.selected = false
      }
      // 指定されたノードを選択状態に設定
      node.selected = true
      this.m_selectedNode = node
    }
    // 選択ノードが指定されたなかった場合
    else {
      // 現在の選択ノードを非選択にする
      if (currentSelectedNode) {
        currentSelectedNode.selected = false
      }
      this.m_selectedNode = null
    }
  }

  /**
   * 指定されたノードの選択状態を設定します。
   * @param value ノードを特定するための値を指定
   * @param selected 選択状態を指定
   * @param silent 選択系イベントを発火したくない場合はtrueを指定
   */
  setSelectedNode(value: string, selected: boolean, silent = false): void {
    const node = this.getNode(value)
    if (!node) return

    const currentSelectedNode = this.selectedNode

    // 選択状態にする場合
    if (selected) {
      // 現在の選択ノードと指定されたノードが違う場合
      if (currentSelectedNode && currentSelectedNode !== node) {
        // 現在の選択ノードを非選択にする
        currentSelectedNode.setSelected(false, silent)
      }
      // 指定されたノードを選択状態に設定
      node.setSelected(true, silent)
      this.m_selectedNode = node
    }
    // 非選択状態にする場合
    else {
      // 指定されたノードを非選択にする
      node.setSelected(false, silent)
      if (currentSelectedNode === node) {
        this.m_selectedNode = null
      }
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
  private m_allNodeDict: { [key: string]: FAMILY_NODE } = {}

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
  buildTree(nodeDataList: CompTreeNodeData[], options?: { sortFunc?: ChildrenSortFunc; insertIndex?: number | null }): void {
    const sortFunc = options?.sortFunc
    let insertIndex = options?.insertIndex
    this.m_sortFunc = sortFunc || null

    nodeDataList.forEach(nodeData => {
      this.m_addNodeByData(nodeData, { insertIndex })
      if (!(typeof insertIndex === 'undefined' || insertIndex === null)) {
        insertIndex++
      }
    })
  }

  /**
   * ノードを追加します。
   * @param child 追加するノード
   * @param options
   * <ul>
   *   <li>parent: 親ノードを特定するための値。指定されない場合、ツリービューの子として追加されます。</li>
   *   <li>insertIndex: ノード挿入位置。ノードに`sortFunc`が設定されている場合、この値は無視されます。</li>
   * </ul>
   */
  addNode<N extends CompTreeNode>(child: N, options?: { insertIndex?: number | null }): N

  /**
   * ノードを追加します。
   * @param child 追加ノードを構築するためのデータ
   * @param options
   * <ul>
   *   <li>parent: 親ノードを特定するための値。指定されない場合、ツリービューの子として追加されます。</li>
   *   <li>insertIndex: ノード挿入位置。ノードに`sortFunc`が設定されている場合、この値は無視されます。</li>
   * </ul>
   */
  addNode<N extends CompTreeNode = FAMILY_NODE>(child: CompTreeNodeData, options?: { parent?: string; insertIndex?: number | null }): N

  addNode(node: CompTreeNodeData | CompTreeNode, options?: { parent?: string; insertIndex?: number | null }): CompTreeNode {
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
      result = parentNode.addChild(node as CompTreeNode, options)
    }
    // 親が指定されていない場合
    else {
      // 引数のノードがノードコンポーネントで指定された場合
      if (childType === 'Node') {
        result = this.m_addNodeByNode(node as CompTreeNode, options)
      }
      // 引数のノードがノードデータで指定された場合
      else if (childType === 'Data') {
        result = this.m_addNodeByData(node as CompTreeNodeData, options)
      }
    }

    return result
  }

  /**
   * ノードを削除します。
   * @param value ノードを特定するための値
   */
  removeNode<N extends CompTreeNode = FAMILY_NODE>(value: string): N | undefined {
    const node = this.getNode<N>(value)
    if (!node) return

    // 親がツリービューの場合
    // (node.parentが空の場合、親はツリービュー)
    if (!node.parent) {
      this.m_removeChildFromContainer(node)
      CompTreeViewUtils.dispatchNodeRemove(this, node)
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
  getNode<N extends CompTreeNode = FAMILY_NODE>(value: string): N | undefined {
    return (this.m_allNodeDict[value] as any) as N | undefined
  }

  /**
   * ツリービューの全ノードをツリー構造から平坦化した配列形式で取得します。
   */
  getAllNodes<N extends CompTreeNode = FAMILY_NODE>(): N[] {
    const result: CompTreeNode[] = []
    for (const child of this.m_children) {
      result.push(child)
      result.push(...CompTreeViewUtils.getDescendants(child))
    }
    return result as N[]
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  private m_addNodeByData(nodeData: CompTreeNodeData, options?: { insertIndex?: number | null }): CompTreeNode {
    options = options || {}

    if (this.getNode(nodeData.value)) {
      throw new Error(`The node '${nodeData.value}' already exists.`)
    }

    // ノードの作成
    const node = CompTreeViewUtils.newNode<FAMILY_NODE>(nodeData)

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
    CompTreeViewUtils.dispatchNodeAdd(node)

    return node
  }

  private m_addNodeByNode(node: CompTreeNode, options?: { insertIndex?: number | null }): CompTreeNode {
    options = options || {}

    // 追加ノードの親が自身のツリービューの場合
    // ※自身のツリービューの子として追加ノードが既に存在する場合
    if (!node.parent && node.treeView === this) {
      const newInsertIndex = this.m_getInsertIndex(node, options)
      const currentIndex = this.children.indexOf(node as FAMILY_NODE)
      // 現在の位置と新しい挿入位置が同じ場合
      if (currentIndex === newInsertIndex) {
        CompTreeViewUtils.dispatchNodeAdd(node)
        for (const descendant of CompTreeViewUtils.getDescendants(node)) {
          CompTreeViewUtils.dispatchNodeAdd(descendant)
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
    CompTreeViewUtils.dispatchNodeAdd(node)

    return node
  }

  m_getInsertIndex(newNode: CompTreeNode, options?: { insertIndex?: number | null }): number {
    options = options || {}

    // ソート関数が指定されている場合
    if (typeof this.sortFunc === 'function') {
      const children: CompTreeNode[] = []
      if (this.children.includes(newNode as FAMILY_NODE)) {
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

    this.m_children.splice(insertIndex, 0, node as FAMILY_NODE)

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

    const index = this.m_children.indexOf(node as FAMILY_NODE)
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
  private m_onNodeAdd(e) {
    e.stopImmediatePropagation()

    const node = e.target.__vue__ as FAMILY_NODE
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
  private m_onBeforeNodeRemove(e) {
    e.stopImmediatePropagation()

    const node = e.detail.node as FAMILY_NODE

    const nodeDescendants = [node, ...node.getDescendants<FAMILY_NODE>()]
    for (const iNode of nodeDescendants) {
      if (this.selectedNode === iNode) {
        this.selectedNode = null
        break
      }
    }
  }

  /**
   * ツリービューからノードが削除された際のリスナです。
   * @param e
   */
  private m_onNodeRemove(e) {
    e.stopImmediatePropagation()

    const node = e.detail.node as FAMILY_NODE
    for (const descendant of CompTreeViewUtils.getDescendants(node)) {
      delete this.m_allNodeDict[descendant.value]
    }
    delete this.m_allNodeDict[node.value]
  }

  /**
   * ノードでnode-property-changeイベントが発火した際のリスナです。
   * @param e
   */
  private m_allNodesOnNodePropertyChange(e) {
    e.stopImmediatePropagation()

    const node = e.target.__vue__ as FAMILY_NODE
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

    const node = e.target.__vue__ as FAMILY_NODE
    const done = e.detail.done as CompTreeViewLazyLoadDoneFunc

    this.$emit('lazy-load', { node, done } as CompTreeViewLazyLoadEvent)
  }

  /**
   * ノードでopen-changeイベントが発火した際のリスナです。
   * @param e
   */
  private m_allNodesOnOpenChange(e) {
    e.stopImmediatePropagation()

    const node = e.target.__vue__ as FAMILY_NODE
    this.$emit('open-change', { node } as CompTreeViewEvent)
  }

  /**
   * ノードでselect-changeイベントが発火した際のリスナです。
   * @param e
   */
  private m_allNodesOnSelectChange(e) {
    e.stopImmediatePropagation()

    const node = e.target.__vue__ as FAMILY_NODE
    const silent = e.detail.silent

    // ノードが選択された場合
    if (node.selected) {
      this.setSelectedNode(node.value, true, silent)
    }
    // ノードの選択が解除された場合
    else {
      if (this.selectedNode === node) {
        this.setSelectedNode(node.value, false, silent)
      }
    }

    !silent && this.$emit('select-change', { node } as CompTreeViewEvent)
  }

  /**
   * ノードでselectイベントが発火した際のリスナです。
   * @param e
   */
  private m_allNodesOnSelect(e) {
    e.stopImmediatePropagation()

    const node = e.target.__vue__ as FAMILY_NODE
    const silent = e.detail.silent

    !silent && this.$emit('select', { node } as CompTreeViewEvent)
  }

  private m_allNodesOnSelectDebounce!: (e) => void | Promise<void>

  /**
   * ノードが発火する標準のイベントとは別に、独自イベントが発火した際のリスナです。
   * @param e
   */
  private m_allNodesOnExtraNodeEvent(e) {
    e.stopImmediatePropagation()

    const node = e.target.__vue__ as FAMILY_NODE
    const args = { node }
    if (e.detail) {
      Object.assign(args, e.detail)
    }

    this.$emit(e.type, args)
  }
}
</script>
