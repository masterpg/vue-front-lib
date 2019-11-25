import { BaseModule, CompTreeNodeData, StorageNode, StorageNodeType } from '@/lib'
import { Component } from 'vue-property-decorator'
import StorageTreeNodeItem from '@/example/views/demo/storage/storage-tree-node-item.vue'

export interface StorageTreeState {
  rootNode: StorageTreeNodeData
  nodes: StorageTreeNodeData[]
}

export interface StorageTreeNodeData extends Omit<CompTreeNodeData, 'children'> {
  parent?: string
  icon: 'storage' | 'folder' | 'description'
  nodeType: StorageNodeType | 'Storage'
}

@Component
export class StorageTreeStore extends BaseModule<StorageTreeState> {
  //----------------------------------------------------------------------
  //
  //  Constructors
  //
  //----------------------------------------------------------------------

  constructor() {
    super()

    const rootNode: StorageTreeNodeData = {
      value: '',
      label: 'Storage',
      icon: 'storage',
      opened: true,
      nodeType: 'Storage',
      itemClass: StorageTreeNodeItem,
    }
    this.initState({
      rootNode,
      nodes: [rootNode],
    })
  }

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  get rootNode(): StorageTreeNodeData {
    return this.state.rootNode
  }

  get nodes(): StorageTreeNodeData[] {
    return this.state.nodes
  }

  get initialized(): boolean {
    // ルートノード以外のノードを取得
    const nodes = this.nodes.filter(node => {
      return node !== this.rootNode
    })
    // ノードが存在する場合、初期化されたとみなす
    return nodes.length > 0
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  setAllNodes(nodes: StorageNode[]): void {
    this.state.nodes.length = 0
    this.state.nodes.push(this.state.rootNode)
    for (const node of nodes) {
      const treeNodeData = this.toTreeNodeData(node)
      this.state.nodes.push(treeNodeData)
    }
  }

  setNode(node: StorageNode): void {
    this.setNodes([node])
  }

  setNodes(nodes: StorageNode[]): void {
    const treeNodeMap = this.getNodeMap()
    for (const node of nodes) {
      const treeNode = treeNodeMap[node.path]
      if (treeNode) {
        this.toTreeNodeData(node, treeNode)
      } else {
        const treeNode = this.toTreeNodeData(node)
        this.state.nodes.push(treeNode)
      }
    }
  }

  removeNode(path: string): void {
    this.removeNodes([path])
  }

  removeNodes(paths: string[]): void {
    for (const path of paths) {
      for (let i = 0; i < this.state.nodes.length; i++) {
        const node = this.state.nodes[i]
        const nodeParent = node.parent || ''
        if (node.value === path || nodeParent.startsWith(path)) {
          this.state.nodes.splice(i--, 1)
        }
      }
    }
  }

  getNodeMap(): { [value: string]: StorageTreeNodeData } {
    const result: { [value: string]: StorageTreeNodeData } = {}
    for (const node of this.state.nodes) {
      result[node.value] = node
    }
    return result
  }

  toTreeNodeData(source: StorageNode, dest?: Partial<StorageTreeNodeData>): StorageTreeNodeData {
    dest = dest || {}
    dest.label = source.name
    dest.value = source.path
    dest.parent = source.dir
    dest.icon = source.nodeType === StorageNodeType.Dir ? 'folder' : 'description'
    dest.opened = dest.opened || false
    dest.selected = dest.selected || false
    dest.nodeType = source.nodeType
    dest.itemClass = StorageTreeNodeItem
    return dest as StorageTreeNodeData
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  m_clone(value: StorageTreeNodeData): StorageTreeNodeData {
    return {
      label: value.label,
      value: value.value,
      parent: value.parent,
      icon: value.icon,
      opened: value.opened,
      selected: value.selected,
      nodeType: value.nodeType,
      itemClass: value.itemClass,
    }
  }
}

export const storageTreeStore = new StorageTreeStore()
