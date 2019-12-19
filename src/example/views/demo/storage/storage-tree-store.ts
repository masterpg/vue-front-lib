import * as _path from 'path'
import { CompTreeView, StorageNode, StorageNodeType } from '@/lib'
import {
  StorageTreeNodeData,
  getStorageTreeRootNodeData,
  storageTreeChildrenSortFunc,
  toStorageTreeNodeData,
} from '@/example/views/demo/storage/base'
import { removeBothEndsSlash, removeStartDirChars } from 'web-base-lib'
import StorageTreeNode from '@/example/views/demo/storage/storage-tree-node.vue'

export type StorageTreeView = CompTreeView<StorageTreeNodeData>

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
      this.m_rootNode = this.m_treeView.addChild(getStorageTreeRootNodeData()) as StorageTreeNode
    } else {
      this.m_rootNode = this.m_treeView.addChild(this.rootNode) as StorageTreeNode
    }
  }

  /**
   * ツリービューの全てのツリーノードを取得します。
   */
  getAllNodes(): StorageTreeNode[] {
    return this.m_treeView.getAllNodes<StorageTreeNode>()
  }

  /**
   * 指定されたパスと一致するツリーノードを取得します。
   * @param path
   */
  getNode(path: string): StorageTreeNode | undefined {
    return this.m_treeView.getNode<StorageTreeNode>(path)
  }

  /**
   * 指定されたノードをツリーノードに設定します。
   * 対象のツリーノードがなかった場合、指定されたノードをもとにツリーノードを作成します。
   * @param nodes
   */
  setNodes(nodes: StorageNode[]): void {
    const sortedNodes = (Object.assign([], nodes) as StorageNode[]).sort((a, b) => {
      if (a.path < b.path) {
        return -1
      } else if (a.path > b.path) {
        return 1
      } else {
        return 0
      }
    })

    for (const node of sortedNodes) {
      const treeNode = this.m_treeView.getNode(node.path)
      const treeNodeData = toStorageTreeNodeData(node)
      if (treeNode) {
        treeNode.setNodeData(treeNodeData)
      } else {
        this.m_treeView.addChild(treeNodeData, {
          parent: treeNodeData.parent || this.rootNode.value,
          sortFunc: storageTreeChildrenSortFunc,
        })
      }
    }
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
   * 指定されたパスと一致するツリーノードを削除します。
   * @param paths
   */
  removeNodes(paths: string[]): void {
    for (const path of paths) {
      this.m_treeView.removeNode(path)
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
   * ツリーノードの移動を行います。
   * また対象のツリーノードとその子孫のパスも変更されます。
   *
   * ディレクトリの移動例:
   *   + fromDirPath: 'photos'
   *   + toDirPath: 'archives/photos'
   *
   * ファイルの移動例:
   *   + fromPath: 'photos/family.png'
   *   + toPath: 'archives/family.png'
   *
   * @param fromPath
   * @param toPath
   */
  moveNode(fromPath, toPath: string): void {
    fromPath = removeBothEndsSlash(fromPath)
    toPath = removeBothEndsSlash(toPath)

    if (fromPath === this.rootNode.value) {
      throw new Error(`The root node cannot be renamed.`)
    }

    const target = this.getNode(fromPath)
    if (!target) {
      throw new Error(`The specified node was not found: '${fromPath}'`)
    }

    if (target.nodeType === StorageNodeType.Dir) {
      // 移動先ディレクトリが移動元のサブディレクトリでないことを確認
      // from: aaa/bbb → to: aaa/bbb/ccc/bbb [NG]
      //               → to: aaa/zzz/ccc/bbb [OK]
      if (toPath.startsWith(fromPath)) {
        throw new Error(`The destination directory is its own subdirectory: '${fromPath}' -> '${toPath}'`)
      }
    }

    target.label = _path.basename(toPath)
    target.value = toPath

    // ノードの名前が変わった事により、兄弟ノードの並び順も変える必要性がある。
    // ここでは名前変更があったノードを再度addChildしてソートし直している。
    this.m_treeView.addChild(target, {
      parent: removeStartDirChars(_path.dirname(target.value)),
      sortFunc: storageTreeChildrenSortFunc,
    })

    if (target.nodeType === StorageNodeType.Dir) {
      const descendants = target.getDescendants() as StorageTreeNode[]
      for (const descendant of descendants) {
        const reg = new RegExp(`^${fromPath}`)
        descendant.value = descendant.value.replace(reg, target.value)
      }
    }

    target.parent!.open(false)
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

    const dirPath = removeStartDirChars(_path.dirname(path))
    const toPath = _path.join(dirPath, newName)

    this.moveNode(path, toPath)
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------
}

export const storageTreeStore = new StorageTreeStore()
