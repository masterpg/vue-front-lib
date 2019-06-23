import { CompTreeNodeData, CompTreeNodeParent } from '@/components/comp-tree-view/types'
import CompTreeNode from '@/components/comp-tree-view/comp-tree-node.vue'
import Vue from 'vue'

/**
 * ツリービューのノードを再帰的に構築します。
 * @param nodeData ツリービューに追加するノードのデータを指定します。
 * @param parent 追加するノードの親ノードを指定します。
 */
export function buildNode<T extends CompTreeNodeData<T>>(nodeData: T, parent: CompTreeNodeParent): CompTreeNode {
  // ノードの作成
  const NodeClass = Vue.extend(CompTreeNode)
  const node = new NodeClass() as CompTreeNode
  node.init(nodeData)

  // 上記で作成したノードを親に追加
  parent.addChild(node, false)

  // ノードが追加されたことを通知するイベントを発火
  node.$el.dispatchEvent(
    new CustomEvent('node-added', {
      bubbles: true,
      cancelable: true,
      composed: true,
    })
  )

  // ノードの子ノードを作成
  if (nodeData.children && nodeData.children.length > 0) {
    for (const childNodeData of nodeData.children) {
      buildNode(childNodeData, node)
    }
  }

  return node
}
