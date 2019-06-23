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
import { CompTreeNodeData, CompTreeNodeParent } from '@/components/comp-tree-view/types'
import { BaseComponent } from '@/components'
import CompTreeNode from '@/components/comp-tree-view/comp-tree-node.vue'
import { Component } from 'vue-property-decorator'

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
export default class CompTreeView<T extends CompTreeNodeData<T> = any> extends BaseComponent implements CompTreeNodeParent {
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
   */
  buildNodes(nodeDataList: T[]): void {
    nodeDataList.forEach((nodeData, index) => {
      const node = this.buildChild(nodeData)
      this.m_nodes.push(node)
      if (index === 0) {
        node.isEldest = true
      }
    })
  }

  /**
   * 指定されたノードデータからノードツリーを構築します。
   * @param nodeData ノードツリーを構築するためのデータ
   */
  buildChild(nodeData: T): CompTreeNode {
    const node = treeViewUtils.buildNode(nodeData, this)
    return node
  }

  addChild(childNode: CompTreeNode): void {
    childNode.$mount()
    this.m_container.appendChild(childNode.$el)
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

  m_addExtraNodeEventListener(eventName: string): void {
    this.m_container.removeEventListener(eventName, this.m_allNodesOnExtraNodeEvent)
    this.m_container.addEventListener(eventName, this.m_allNodesOnExtraNodeEvent)
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
