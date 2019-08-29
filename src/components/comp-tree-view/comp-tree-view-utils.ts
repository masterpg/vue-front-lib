import CompTreeNode from '@/components/comp-tree-view/comp-tree-node.vue'
import { CompTreeNodeData } from '@/components/comp-tree-view/types'
import Vue from 'vue'

/**
 * ノードを作成します。
 * @param nodeData
 */
export function newNode(nodeData: CompTreeNodeData): CompTreeNode {
  const NodeClass = Vue.extend(CompTreeNode)
  const node = new NodeClass() as any
  node.init(nodeData)
  node.$mount()
  return node
}

/**
 * ノードが追加された旨を通知するイベントを発火します。
 * @param node
 */
export function dispatchNodeAdded(node: CompTreeNode): void {
  node.$el.dispatchEvent(
    new CustomEvent('node-added', {
      bubbles: true,
      cancelable: true,
      composed: true,
    })
  )
}
