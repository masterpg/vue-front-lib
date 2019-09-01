<style lang="stylus" scoped>
@import '../../styles/app.variables.styl'

.container {
  color: var(--comp-tree-view-color, $indigo-8)
  font-size: var(--comp-tree-view-font-size, 14px)
  font-weight: var(--comp-tree-font-weight, $text-weights.medium)
  line-height: var(--comp-tree-line-height, 26px)
}
</style>

<template>
  <div
    ref="container"
    class="container"
    @opened-changed="m_allNodesOnOpenedChanged"
    @node-added="m_nodeAdded"
    @node-removed="m_nodeRemoved"
    @selected="m_allNodesOnSelected"
  ></div>
</template>

<script lang="ts">
import * as treeViewUtils from '@/components/comp-tree-view/comp-tree-view-utils'
import CompCheckboxNodeItem, { CompCheckboxTreeNodeData } from '@/components/comp-tree-view/comp-checkbox-node-item.vue'
import { BaseComponent } from '@/components'
import CompTreeNode from '@/components/comp-tree-view/comp-tree-node.vue'
import { CompTreeNodeData } from '@/components/comp-tree-view/types'
import CompTreeNodeItem from '@/components/comp-tree-view/comp-tree-node-item.vue'
import { Component } from 'vue-property-decorator'
import Vue from 'vue'
const isInteger = require('lodash/isInteger')
const isString = require('lodash/isString')

export { CompTreeNodeData, CompTreeNode, CompTreeNodeItem, CompCheckboxNodeItem, CompCheckboxTreeNodeData }

/**
 * ツリーコンポーネントです。
 *
 * Custom property | Description | Default
 * ----------------|-------------|----------
 * `--comp-tree-distance` | ノードとノードの縦の間隔です | `6px`
 * `--comp-tree-indent` | ノードの左インデントです | `16px`
 * `--comp-tree-view-font-size` | ノードアイテムのフォントサイズです | `14px`
 * `--comp-tree-font-weight` | ノードアイテムのフォントの太さです | `500`
 * `--comp-tree-line-height` | ノードアイテムの行の高さです | `26px`
 * `--comp-tree-view-color` | ノードの文字色です | `indigo-8`
 * `--comp-tree-selected-color` | ノード選択時の文字色です | `pink-5`
 * `--comp-tree-unselectable-color` | 非選択ノードの文字色です | `grey-9`
 */
@Component
export default class CompTreeView<NodeData extends CompTreeNodeData = CompTreeNodeData> extends BaseComponent {
  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  private m_nodes: CompTreeNode[] = []

  /**
   * ツリービューのトップレベルのノードです。
   */
  get nodes(): CompTreeNode[] {
    return this.m_nodes
  }

  private m_selectedNode: CompTreeNode | null = null

  /**
   * 選択されているノードです。
   */
  get selectedNode(): CompTreeNode | undefined {
    return this.m_selectedNode === null ? undefined : this.m_selectedNode
  }

  set selectedNode(node: CompTreeNode | undefined) {
    this.m_setSelectedNode(node)
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  /**
   * ツリービューが管理する全ノードのマップです。
   * key: ノードを特定するための値, value: ノード
   */
  private m_allNodes: { [key: string]: CompTreeNode } = {}

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  /**
   * 指定されたノードデータからノードツリーを構築します。
   * @param nodeDataList ノードツリーを構築するためのデータ
   * @param insertIndex ノード挿入位置
   */
  buildTree(nodeDataList: NodeData[], insertIndex?: number): void {
    nodeDataList.forEach(nodeData => {
      this.m_addNodeByData(nodeData, insertIndex)
      if (!(insertIndex === undefined || insertIndex === null)) {
        insertIndex++
      }
    })
  }

  /**
   * ノードを追加します。
   * @param child ノード、またはノードを構築するためのデータ
   * @param insertIndex ノード挿入位置
   */
  addNode(child: NodeData | CompTreeNode, insertIndex?: number): CompTreeNode

  /**
   * ノードを追加します。
   * @param child ノード、またはノードを構築するためのデータ
   * @param parent 親ノードを特定するための値
   * @param insertIndex ノード挿入位置
   */
  addNode(child: NodeData | CompTreeNode, parent?: string, insertIndex?: number): CompTreeNode

  addNode(child: NodeData | CompTreeNode, parentOrInsertIndex?: string | number, insertIndex?: number): CompTreeNode {
    let node: CompTreeNode
    const childType = child instanceof Vue ? 'Node' : 'Data'
    let parent: string | undefined

    if (parentOrInsertIndex !== '' && isString(parentOrInsertIndex)) {
      parent = parentOrInsertIndex as string
    } else if (isInteger(parentOrInsertIndex)) {
      insertIndex = parentOrInsertIndex as number
    }

    if (parent) {
      const parentNode = this.getNode(parent)
      if (!parentNode) {
        throw new Error(`The parent node "${parent}" does not exist.`)
      }
      node = parentNode.addChild(child, insertIndex)
    } else {
      // 引数のノードがノードコンポーネントで指定された場合
      if (childType === 'Node') {
        node = this.m_addNodeByNode(child as CompTreeNode, insertIndex)
      }
      // 引数のノードがノードデータで指定された場合
      else if (childType === 'Data') {
        node = this.m_addNodeByData(child as NodeData, insertIndex)
      }
    }

    return node!
  }

  /**
   * ノードを削除します。
   * @param value ノードを特定するための値
   */
  removeNode(value: string): CompTreeNode | undefined {
    const node = this.getNode(value)
    if (!node) return

    // 親がツリービューの場合
    // (node.parentが空の場合、親はツリービュー)
    if (!node.parent) {
      this.m_removeChildFromContainer(node)
      treeViewUtils.dispatchNodeRemoved(this, node)
    }
    // 親がノードの場合
    else {
      node.parent.removeChild(node)
    }

    return node
  }

  /**
   * ノードを特定するためのvalueと一致するノードを取得します。
   * @param value ノードを特定するための値
   */
  getNode(value: string): CompTreeNode | undefined {
    return this.m_allNodes[value]
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  private m_addNodeByData(nodeData: NodeData, insertIndex?: number): CompTreeNode {
    if (this.getNode(nodeData.value)) {
      throw new Error(`The node "${nodeData.value}" already exists.`)
    }

    // ノードの作成
    const node = treeViewUtils.newNode(this, nodeData)

    // ノード挿入位置を決定
    if (insertIndex === undefined || insertIndex === null) {
      insertIndex = this.m_nodes.length
    }

    // コンテナにノードを追加
    this.m_insertChildIntoContainer(node, insertIndex)

    // 子ノードの設定
    const len = nodeData.children ? nodeData.children.length : 0
    for (let i = 0; i < len; i++) {
      node.addChild(nodeData.children![i], i)
    }

    // ノードが追加されたことを通知するイベントを発火
    treeViewUtils.dispatchNodeAdded(node)

    return node
  }

  private m_addNodeByNode(node: CompTreeNode, insertIndex?: number): CompTreeNode {
    // 一旦親からノードを削除
    if (node.parent) {
      node.parent.removeChild(node)
    } else {
      // 親がない場合、ツリービューが親
      node.treeView.removeNode(node.value)
    }

    // ノード挿入位置を決定
    if (insertIndex === undefined || insertIndex === null) {
      insertIndex = this.m_nodes.length
    }

    // コンテナにノードを追加
    this.m_insertChildIntoContainer(node, insertIndex)

    // 子ノードの設定
    for (let i = 0; i < node.children.length; i++) {
      const childNode = node.children[i]
      node.addChild(childNode, i)
    }

    // ノードが追加されたことを通知するイベントを発火
    treeViewUtils.dispatchNodeAdded(node)

    return node
  }

  /**
   * ノードが発火する標準のイベントとは別に、独自イベント用のリスナを登録します。
   * @param eventName
   */
  m_addExtraNodeEventListener(eventName: string): void {
    this.m_container.removeEventListener(eventName, this.m_allNodesOnExtraNodeEvent)
    this.m_container.addEventListener(eventName, this.m_allNodesOnExtraNodeEvent)
  }

  /**
   * コンテナへノードを挿入します。
   * @param node 追加するノード
   * @param insertIndex ノード挿入位置
   */
  private m_insertChildIntoContainer(node: CompTreeNode, insertIndex: number): void {
    const childrenLength = this.m_container.children.length

    // 挿入位置が大きすぎないかを検証
    if (childrenLength < insertIndex) {
      throw new Error('insertIndex is too big.')
    }

    // コンテナにノードを追加
    if (childrenLength === insertIndex) {
      this.m_container.appendChild(node.$el)
    } else {
      const afterNode = this.m_container.children[insertIndex]
      this.m_container.insertBefore(node.$el, afterNode)
    }

    this.m_nodes.splice(insertIndex, 0, node)

    // 最年長ノードフラグを再設定
    this.m_restIsEldest()
  }

  /**
   * コンテナからノードを削除します。
   * @node 削除するノード
   */
  private m_removeChildFromContainer(node: CompTreeNode): void {
    this.m_container.removeChild(node.$el)

    const index = this.m_nodes.indexOf(node)
    if (index >= 0) {
      this.m_nodes.splice(index, 1)
    }

    // 最年長ノードフラグを再設定
    this.m_restIsEldest()
  }

  /**
   * 最年長ノードフラグを再設定します。
   */
  private m_restIsEldest(): void {
    this.m_nodes.forEach((item, index) => {
      item.isEldest = index === 0
    })
  }

  /**
   * ノード選択の設定を行います。
   * @param node 選択ノード
   */
  private m_setSelectedNode(node: CompTreeNode | undefined): void {
    // 選択されたノード以外の選択を解除
    if (this.selectedNode && this.selectedNode !== node) {
      this.selectedNode.selected = false
    }
    this.m_selectedNode = node ? node : null

    this.$emit('selected', this.m_selectedNode)
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

  get m_container(): HTMLElement {
    return this.$refs.container as HTMLElement
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
    this.m_allNodes[node.value] = node

    // ノードが発火する独自イベントの設定
    for (const eventName of node.extraEventNames) {
      this.m_addExtraNodeEventListener(eventName)
    }
  }

  /**
   * ツリービューからノードが削除された際のリスナです。
   * @param e
   */
  private m_nodeRemoved(e) {
    e.stopImmediatePropagation()

    const node = e.detail.node as CompTreeNode
    for (const descendant of treeViewUtils.getDescendants(node)) {
      delete this.m_allNodes[descendant.value]
    }
    delete this.m_allNodes[node.value]
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
   * ノードでselectedイベントが発火した際のリスナです。
   * @param e
   */
  private m_allNodesOnSelected(e) {
    e.stopImmediatePropagation()

    const node = e.target.__vue__ as CompTreeNode
    this.m_setSelectedNode(node)
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
