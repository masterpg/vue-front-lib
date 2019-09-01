import CompTreeNode from '@/components/comp-tree-view/comp-tree-node.vue'
import { CompTreeNodeData } from '@/components/comp-tree-view/types'
import CompTreeView from '@/components/comp-tree-view/index.vue'
import Vue from 'vue'

/**
 * ノードを作成します。
 * @param treeView
 * @param nodeData
 */
export function newNode(treeView: CompTreeView, nodeData: CompTreeNodeData): CompTreeNode {
  const NodeClass = Vue.extend(CompTreeNode)
  const node = new NodeClass() as any
  node.init(treeView, nodeData)
  node.$mount()
  return node
}

/**
 * 指定されたノードの子孫を配列で取得します。
 * @param node
 */
export function getDescendants(node: CompTreeNode): CompTreeNode[] {
  const getChildren = (node: CompTreeNode) => {
    const result: CompTreeNode[] = []
    for (const child of (node as any).children) {
      result.push(...getChildren(child))
    }
    return result
  }

  const result: CompTreeNode[] = []
  for (const child of (node as any).children) {
    result.push(...getChildren(child))
    result.push(child)
  }
  return result
}

/**
 * 指定されたノードの子孫をマップで取得します。
 * @param node
 */
export function getDescendantMap(node: CompTreeNode): { [value: string]: CompTreeNode } {
  const getChildren = (node: CompTreeNode, result: { [value: string]: CompTreeNode }) => {
    for (const child of (node as any).children) {
      result[child.value] = child
      getChildren(child, result)
    }
    return result
  }

  const result: { [value: string]: CompTreeNode } = {}
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
export function dispatchNodeAdded(node: CompTreeNode): void {
  node.$el.dispatchEvent(
    new CustomEvent('node-added', {
      bubbles: true,
      cancelable: true,
      composed: true,
    })
  )
}

/**
 * ノードが削除された旨を通知するイベントを発火します。
 * @param parent
 * @param child
 */
export function dispatchNodeRemoved(parent: CompTreeView | CompTreeNode, child: CompTreeNode): void {
  parent.$el.dispatchEvent(
    new CustomEvent('node-removed', {
      bubbles: true,
      cancelable: true,
      composed: true,
      detail: { node: child },
    })
  )
}
