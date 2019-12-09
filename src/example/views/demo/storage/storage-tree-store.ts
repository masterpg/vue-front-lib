import * as _path from 'path'
import { ChildrenSortFunc, CompTreeNode, CompTreeNodeData, CompTreeView, StorageNode, StorageNodeType } from '@/lib'
import StorageTreeNodeItem from '@/example/views/demo/storage/storage-tree-node-item.vue'
import { removeBothEndsSlash } from 'web-base-lib'

export interface StorageTreeNodeData extends CompTreeNodeData {
  icon: 'storage' | 'folder' | 'description'
  parent?: string
  nodeType: StorageNodeType | 'Storage'
}

export type StorageTreeView = CompTreeView<StorageTreeNodeData>

export type StorageTreeNode = CompTreeNode<StorageTreeNodeItem>

export class StorageTreeStore {
  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  private m_rootNode!: StorageTreeNode

  /**
   * ツリービューのルートノードです。
   */
  get rootNode(): StorageTreeNode {
    return this.m_rootNode
  }

  /**
   * このツリービューストアが初期化されているか否かです。
   */
  get initialized(): boolean {
    // ルートノードに子ノードが存在する場合、初期化されたとみなす
    return this.rootNode.children.length > 0
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private m_treeView!: StorageTreeView

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  init(treeView: StorageTreeView) {
    this.m_treeView = treeView

    if (!this.rootNode) {
      this.m_rootNode = this.m_treeView.addChild({
        value: '',
        label: 'Storage',
        icon: 'storage',
        opened: true,
        nodeType: 'Storage',
        itemClass: StorageTreeNodeItem,
      })
    } else {
      this.m_rootNode = this.m_treeView.addChild(this.rootNode)
    }
  }

  /**
   * ツリービューの全てのツリーノードを取得します。
   */
  getAllNodes(): StorageTreeNode[] {
    return this.m_treeView.getAllNodes<StorageTreeNodeItem>()
  }

  /**
   * 指定されたパスと一致するツリーノードを取得します。
   * @param path
   */
  getNode(path: string): StorageTreeNode | undefined {
    return this.m_treeView.getNode<StorageTreeNodeItem>(path)
  }

  /**
   * 指定されたノードを一致するツリーノードに設定します。
   * 対象のツリーノードがなかった場合、指定されたノードをもとにツリーノードを作成します。
   * @param node
   */
  setNode(node: StorageNode): void {
    this.setNodes([node])
  }

  /**
   * 指定されたノードをツリーノードに設定します。
   * 対象のツリーノードがなかった場合、指定されたノードをもとにツリーノードを作成します。
   * @param nodes
   */
  setNodes(nodes: StorageNode[]): void {
    for (const node of nodes) {
      const treeNode = this.m_treeView.getNode(node.path)
      const treeNodeData = this.m_toTreeNodeData(node)
      if (treeNode) {
        treeNode.setNodeData(treeNodeData)
      } else {
        this.m_treeView.addChild(treeNodeData, {
          parent: treeNodeData.parent || this.rootNode.value,
          sortFunc: this.m_childrenSortFunc,
        })
      }
    }
  }

  /**
   * 指定されたパスと一致するツリーノードを削除します。
   * @param path
   */
  removeNode(path: string): void {
    this.removeNodes([path])
  }

  /**
   * 指定されたパスと一致するツリーノードを削除します。
   * @param paths
   */
  removeNodes(paths: string[]): void {
    for (const path of paths) {
      this.m_treeView.removeNode(path)
    }
  }

  /**
   * ツリーノードをリネームします。
   * また対象のツリーノードとその子孫のパスも変更されます。
   * @param path
   * @param newName
   */
  renameNode(path: string, newName: string): void {
    path = removeBothEndsSlash(path)

    if (path === this.rootNode.value) {
      throw new Error(`The root node cannot be renamed.`)
    }

    const target = this.getNode(path)
    if (!target) {
      throw new Error(`The specified node was not found: '${path}'`)
    }

    target.label = newName
    target.value = _path.join(target.parent!.value, newName)

    if (target.item.nodeType === StorageNodeType.File) return

    const descendants = target.getDescendants() as StorageTreeNode[]
    for (const descendant of descendants) {
      const reg = new RegExp(`^${path}`)
      descendant.value = descendant.value.replace(reg, target.value)
    }
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  /**
   * `StorageNode`をツリービューで扱える形式の`StorageTreeNodeData`へ変換します。
   * @param source
   */
  private m_toTreeNodeData(source: StorageNode): StorageTreeNodeData {
    return {
      label: source.name,
      value: source.path,
      parent: source.dir,
      icon: source.nodeType === StorageNodeType.Dir ? 'folder' : 'description',
      nodeType: source.nodeType,
      itemClass: StorageTreeNodeItem,
    }
  }

  private m_childrenSortFunc: ChildrenSortFunc<StorageTreeNode> = (a, b) => {
    if (a.item.nodeType === StorageNodeType.Dir && b.item.nodeType === StorageNodeType.File) {
      return -1
    } else if (a.item.nodeType === StorageNodeType.File && b.item.nodeType === StorageNodeType.Dir) {
      return 1
    }
    if (a.label < b.label) {
      return -1
    } else if (a.label > b.label) {
      return 1
    } else {
      return 0
    }
  }
}

export const storageTreeStore = new StorageTreeStore()
