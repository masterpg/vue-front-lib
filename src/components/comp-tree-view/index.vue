<style lang="stylus" scoped>
@import '../../styles/app.variables.styl'

.container {
  color: var(--comp-tree-view-color, $indigo-8)
  font-size: var(--comp-tree-view-font-size, 16px)
  font-weight: var(--comp-tree-font-weight, $text-weights.medium)
  line-height: var(--comp-tree-line-height, 26px)
}
</style>

<template>
  <div ref="container" class="container" @opened-changed="m_allNodesOnOpenedChanged" @node-added="m_nodeAdded" @selected="m_allNodesOnSelected"></div>
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

export { CompTreeNodeData, CompTreeNode, CompTreeNodeItem, CompCheckboxNodeItem, CompCheckboxTreeNodeData }

/**
 * ツリーコンポーネントです。
 *
 * Custom property | Description | Default
 * ----------------|-------------|----------
 * `--comp-tree-distance` | ノードとノードの縦の間隔です | `6px`
 * `--comp-tree-indent` | ノードの左インデントです | `16px`
 * `--comp-tree-view-font-size` | ノードアイテムのフォントサイズです | `16px`
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

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  /**
   * ツリーの全ノードのマップです。
   * key: ノードを特定するための値, value: ノード
   */
  private m_allNodes: { [key: string]: CompTreeNode } = {}

  private m_selectedNode?: CompTreeNode

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  /**
   * 指定されたノードデータからノードツリーを構築します。
   * @param nodeDataList ノードツリーを構築するためのデータ
   * @param insertIndex ノードの挿入位置
   */
  buildTree(nodeDataList: NodeData[], insertIndex?: number): void {
    nodeDataList.forEach(nodeData => {
      this.m_buildChild(nodeData, 'tree', this, insertIndex)
      if (!(insertIndex === undefined || insertIndex === null)) {
        insertIndex++
      }
    })
  }

  /**
   * 子ノードを追加します。
   * @param child ノード、またはノードを構築するためのデータ
   * @param insertIndex ノードの挿入位置
   */
  addChild(child: NodeData | CompTreeNode, insertIndex?: number): CompTreeNode {
    let childNode: CompTreeNode
    if (child instanceof Vue) {
      childNode = child as CompTreeNode
    } else {
      childNode = this.m_buildChild(child, 'tree', this, insertIndex)
    }

    return childNode
  }

  /**
   * ノードを特定するためのvalueと一致するノードを取得します。
   * @param value ノードを特定するための値
   */
  getNodeByValue(value: string): CompTreeNode | undefined {
    return this.m_allNodes[value]
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  /**
   * 指定されたノードデータからノードツリーを構築します。
   * @param nodeData ノードを構築するためのデータ
   * @param parentType 追加するノードの親ノードのタイプ
   * @param parent 追加するノードの親ノード
   * @param insertIndex ノードの挿入位置
   */
  private m_buildChild(nodeData: NodeData, parentType: 'tree' | 'node', parent: CompTreeView | CompTreeNode, insertIndex?: number): CompTreeNode {
    // ノードの作成
    const node = treeViewUtils.newNode(nodeData)

    // 作成したノードを親に追加
    // ・親がツリービューの場合
    if (parentType === 'tree') {
      const parentTree = parent as CompTreeView
      if (insertIndex === undefined || insertIndex === null) {
        insertIndex = this.m_nodes.length
      }
      parentTree.m_insertChildIntoContainer(node, insertIndex)
      this.m_nodes.splice(insertIndex, 0, node)
      this.m_nodes.forEach((item, index) => {
        item.isEldest = index === 0
      })
    }
    // ・親がノードの場合
    else if (parentType === 'node') {
      const parentNode = parent as CompTreeNode
      parentNode.addChild(node)
    }

    // ノードが追加されたことを通知するイベントを発火
    treeViewUtils.dispatchNodeAdded(node)

    // 作成したノードの子ノードを作成
    if (nodeData.children && nodeData.children.length > 0) {
      for (const childNodeData of nodeData.children) {
        this.m_buildChild(childNodeData, 'node', node)
      }
    }

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
   * 子ノードを子コンテナへ挿入します。
   * @param childNode 追加する子ノード
   * @param insertIndex ノードの挿入位置
   */
  private m_insertChildIntoContainer(childNode: CompTreeNode, insertIndex: number): void {
    const childrenLength = this.m_container.children.length

    // 挿入位置が大きすぎないかを検証
    if (childrenLength < insertIndex) {
      throw new Error('insertIndex is too big.')
    }

    if (insertIndex === 0 || childrenLength === insertIndex) {
      this.m_container.appendChild(childNode.$el)
    } else {
      const afterNode = this.m_container.children[insertIndex]
      this.m_container.insertBefore(childNode.$el, afterNode)
    }
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

    // 選択されたノード以外の選択を解除
    if (this.m_selectedNode && this.m_selectedNode !== node) {
      this.m_selectedNode.selected = false
    }
    this.m_selectedNode = node

    this.$emit('selected', node)
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
