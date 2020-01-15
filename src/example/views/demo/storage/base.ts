import * as _path from 'path'
import { ChildrenSortFunc, CompTreeNodeData, CompTreeView, CompTreeViewUtils, StorageLogic, StorageNode, StorageNodeType } from '@/lib'
import dayjs, { Dayjs } from 'dayjs'
import { removeBothEndsSlash, removeStartDirChars } from 'web-base-lib'
import { Component } from 'vue-property-decorator'
import StorageTreeNode from '@/example/views/demo/storage/storage-tree-node.vue'
import Vue from 'vue'
import { mixins } from 'vue-class-component'
import { router } from '@/example/router'

export function toStorageTreeNodeType(nodeType: StorageNodeType): StorageNodeType {
  if (nodeType === StorageNodeType.Dir) {
    return StorageNodeType.Dir
  } else if (nodeType === StorageNodeType.File) {
    return StorageNodeType.File
  } else {
    throw new Error(`Invalid value passed: '${nodeType}'`)
  }
}

export interface StorageTreeNodeData extends CompTreeNodeData {
  icon: string
  nodeType: StorageNodeType
  contentType: string
  size: number
  baseURL: string
  created: Dayjs
  updated: Dayjs
}

export const treeSortFunc: ChildrenSortFunc = (a, b) => {
  const _a = a as StorageTreeNode
  const _b = b as StorageTreeNode
  if (_a.nodeType === StorageNodeType.Dir && _b.nodeType === StorageNodeType.File) {
    return -1
  } else if (_a.nodeType === StorageNodeType.File && _b.nodeType === StorageNodeType.Dir) {
    return 1
  }
  if (_a.label < _b.label) {
    return -1
  } else if (_a.label > _b.label) {
    return 1
  } else {
    return 0
  }
}

@Component
export class StorageTypeMixin extends Vue {
  get storageType(): 'user' | 'app' {
    return router.views.demo.storage.getType()
  }

  protected get storageLogic(): StorageLogic {
    if (this.storageType === 'user') {
      return this.$logic.userStorage
    } else {
      return this.$logic.appStorage
    }
  }
}

@Component
export class StorageTreeStore extends mixins(Vue, StorageTypeMixin) {
  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  private m_rootNode: StorageTreeNode | null = null

  /**
   * ツリービューのルートノードです。
   */
  get rootNode(): StorageTreeNode {
    if (!this.m_rootNode) {
      const rootNodeData = this.m_createRootNodeData()
      this.m_rootNode = CompTreeViewUtils.newNode(rootNodeData) as StorageTreeNode
    }
    return this.m_rootNode
  }

  /**
   * ツリービューの選択ノードです。
   */
  get selectedNode(): StorageTreeNode {
    if (!this.m_treeView) {
      return this.rootNode
    } else {
      return this.m_treeView.selectedNode! as StorageTreeNode
    }
  }

  set selectedNode(value: StorageTreeNode) {
    this.m_treeView!.selectedNode = value
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private m_treeView: CompTreeView<StorageTreeNodeData> | null = null

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  init(treeView: CompTreeView<StorageTreeNodeData>) {
    this.m_treeView = treeView
    this.m_treeView!.addChild(this.rootNode)
  }

  /**
   * ツリービューの全てのツリーノードを取得します。
   */
  getAllNodes(): StorageTreeNode[] {
    return this.m_treeView!.getAllNodes<StorageTreeNode>()
  }

  /**
   * 指定されたパスと一致するツリーノードを取得します。
   * @param path
   */
  getNode(path: string): StorageTreeNode | undefined {
    return this.m_treeView!.getNode<StorageTreeNode>(path)
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
      const treeNode = this.m_treeView!.getNode(node.path)
      const treeNodeData = this.m_toTreeNodeData(node)
      if (treeNode) {
        treeNode.setNodeData(treeNodeData)
      } else {
        this.m_treeView!.addChild(treeNodeData, {
          parent: node.dir || this.rootNode.value,
          sortFunc: treeSortFunc,
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
      this.m_treeView!.removeNode(path)
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
      // 移動先ディレクトリが移動対象のサブディレクトリでないことを確認
      // from: aaa/bbb → to: aaa/bbb/ccc/bbb [NG]
      //               → to: aaa/zzz/ccc/bbb [OK]
      if (toPath.startsWith(fromPath)) {
        throw new Error(`The destination directory is its own subdirectory: '${fromPath}' -> '${toPath}'`)
      }
    }

    // 移動先ノードを取得
    // (移動先ディレクトリに移動対象と同名のノードが既に存在することがあるので)
    const existsNode = this.getNode(toPath)

    // 移動先ディレクトリに移動対象と同名のノードが既に存在する場合
    if (existsNode) {
      // 既存ノードをツリーから削除
      existsNode.opened && target.open()
      this.m_treeView!.removeNode(existsNode.value)
      // 既存ノードの子孫ノードを移動対象ノードへ付け替え
      const targetChildMap = (target.children as StorageTreeNode[]).reduce(
        (result, node) => {
          result[node.label] = node
          return result
        },
        {} as { [label: string]: StorageTreeNode }
      )
      for (const existsChild of [...existsNode.children]) {
        // 移動先と移動対象に同名の子ノードが存在する場合はスルー
        // (同名の子ノードがあった場合、移動対象の子ノードが優先される)
        if (targetChildMap[existsChild.label]) {
          continue
        }
        // 移動先の子ノードを移動対象ノードへ付け替え
        target.addChild(existsChild, { sortFunc: treeSortFunc })
      }
    }

    // 移動対象ノードのパスを移動先パスへ書き換え
    target.label = _path.basename(toPath)
    target.value = toPath

    // ノードの名前が変わった場合、兄弟ノードの並び順も変える必要がある。
    // ここでは名前変更があったノードを再度addChildしてソートし直している。
    this.m_treeView!.addChild(target, {
      parent: removeStartDirChars(_path.dirname(target.value)),
      sortFunc: treeSortFunc,
    })

    // 移動対象ノードの子孫のパスを移動先パスへ書き換え
    if (target.nodeType === StorageNodeType.Dir) {
      const descendants = target.getDescendants<StorageTreeNode>()
      for (const descendant of descendants) {
        const reg = new RegExp(`^${fromPath}`)
        descendant.value = descendant.value.replace(reg, target.value)
      }
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

    const dirPath = removeStartDirChars(_path.dirname(path))
    const toPath = _path.join(dirPath, newName)

    this.moveNode(path, toPath)
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  /**
   * ルートノードデータを作成します。
   */
  private m_createRootNodeData(): StorageTreeNodeData {
    const label = (() => {
      if (this.storageType === 'user') {
        return String(this.$t('storage.userRootName'))
      } else {
        return String(this.$t('storage.appRootName'))
      }
    })()

    return {
      nodeClass: StorageTreeNode,
      label,
      value: '',
      icon: 'storage',
      nodeType: StorageNodeType.Dir,
      contentType: '',
      size: 0,
      baseURL: this.storageLogic.baseURL,
      created: dayjs(0),
      updated: dayjs(0),
      selected: true,
      opened: true,
    }
  }

  /**
   * `StorageNode`または`StorageTreeNode`をツリービューで扱える形式の
   * `StorageTreeNodeData`へ変換します。
   * @param source
   */
  private m_toTreeNodeData(source: StorageNode | StorageTreeNode): StorageTreeNodeData {
    if ((source as any).__vue__) {
      source = source as StorageTreeNode
      return {
        label: source.label,
        value: source.value,
        nodeClass: StorageTreeNode,
        icon: source.icon,
        nodeType: source.nodeType,
        contentType: source.contentType,
        size: source.size,
        baseURL: source.baseURL,
        created: source.createdDate,
        updated: source.updatedDate,
      }
    } else {
      source = source as StorageNode
      return {
        label: removeBothEndsSlash(source.name),
        value: removeBothEndsSlash(source.path),
        nodeClass: StorageTreeNode,
        icon: source.nodeType === StorageNodeType.Dir ? 'folder' : 'description',
        nodeType: toStorageTreeNodeType(source.nodeType),
        contentType: source.contentType,
        size: source.size,
        baseURL: this.storageLogic.baseURL,
        created: source.created,
        updated: source.updated,
      }
    }
  }
}
