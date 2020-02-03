import * as _path from 'path'
import { CompTreeView, CompTreeViewUtils, StorageLogic, StorageNode, StorageNodeType, User } from '@/lib'
import { Component, Prop } from 'vue-property-decorator'
import { StorageTreeNodeData, StorageType, treeSortFunc } from '@/example/views/demo/storage/base'
import { removeBothEndsSlash, removeStartDirChars } from 'web-base-lib'
import StorageTreeNode from '@/example/views/demo/storage/storage-tree-node.vue'
import Vue from 'vue'
import dayjs from 'dayjs'
import { i18n } from '@/example/i18n'

export function newStorageTreeStore(storageType: StorageType, storageLogic: StorageLogic): StorageTreeStore {
  // プログラム的にコンポーネントのインスタンスを生成
  // https://css-tricks.com/creating-vue-js-component-instances-programmatically/
  const ComponentClass = Vue.extend(StorageTreeStore)
  return new ComponentClass({
    propsData: { storageType, storageLogic },
  }) as StorageTreeStore
}

@Component
export class StorageTreeStore extends Vue {
  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  created() {
    this.m_rootNode = this.m_createRootNode()

    this.$logic.auth.addSignedInListener(this.m_userOnSignedIn)
    this.$logic.auth.addSignedOutListener(this.m_userOnSignedOut)
  }

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  @Prop({ required: true })
  storageType!: StorageType

  @Prop({ required: true })
  storageLogic!: StorageLogic

  private m_rootNode: StorageTreeNode = {} as any

  /**
   * ツリービューのルートノードです。
   */
  get rootNode(): StorageTreeNode {
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

  private m_isNodesPulled: boolean = false

  /**
   * サーバーからストレージノード一覧が取得済みかを示すフラグです。
   */
  get isNodesPulled(): boolean {
    return this.m_isNodesPulled
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  /**
   * 本クラスがアクティブな状態か否かを示すフラグです。
   * アクティブ状態はストレージページが表示されている状態です。
   * 非アクティブ状態はストレージページが表示されていない状態です。
   */
  private get m_isActive(): boolean {
    // ツリービューがある場合は既に本クラスが開始状態になっているのでアクティブとなる。
    // ツリービューがない場合はまだ本クラスが開始状態になっていないので非アクティブとなる。
    return Boolean(this.m_treeView)
  }

  private m_treeView: CompTreeView<StorageTreeNodeData> | null = null

  private m_pulledListener: (() => void) | null = null

  private m_clearedListener: (() => void) | null = null

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  setup(params: { pulled: () => void; cleared: () => void }): void {
    this.m_pulledListener = params.pulled
    this.m_clearedListener = params.cleared
  }

  teardown(): void {
    this.m_pulledListener = null
    this.m_clearedListener = null
    this.m_treeView = null
  }

  start(treeView: CompTreeView<StorageTreeNodeData>): void {
    this.m_treeView = treeView
    this.m_treeView.addChild(this.rootNode)

    // サインイン済み、かつまだサーバーからストレージノード一覧を取得していない場合
    if (this.$logic.auth.user.isSignedIn && !this.m_isNodesPulled) {
      this.pullNodes()
    }
  }

  clear(): void {
    this.m_isNodesPulled = false

    // 本クラスがアクティブ状態の場合(ストレージページが表示中)
    if (this.m_isActive) {
      // 表示中のルートノード配下全ノードを削除し、ルートノードを選択ノードにする
      this.rootNode.removeAllChildren()
      this.selectedNode = this.rootNode
    }
    // 本クラスが非アクティブ状態の場合(ストレージページが非表示)
    else {
      // ルートノードを作成し直す
      this.m_rootNode = this.m_createRootNode()
    }

    this.m_clearedListener && this.m_clearedListener()
  }

  /**
   * サーバーからストレージノード一覧を取得します。
   */
  async pullNodes(): Promise<void> {
    await this.storageLogic.pullNodes()
    this.m_isNodesPulled = true
    this.m_pulledListener && this.m_pulledListener()
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
   * ルートノードを作成します。
   */
  private m_createRootNode(): StorageTreeNode {
    const label = (() => {
      switch (this.storageType) {
        case 'user':
          return String(i18n.t('storage.userRootName'))
        case 'app':
          return String(i18n.t('storage.appRootName'))
      }
    })()

    const rootNodeData = {
      nodeClass: StorageTreeNode,
      label,
      value: '',
      icon: 'storage',
      nodeType: StorageNodeType.Dir,
      contentType: '',
      size: 0,
      share: {
        isPublic: false,
        uids: [],
      },
      baseURL: this.storageLogic.baseURL,
      created: dayjs(0),
      updated: dayjs(0),
      selected: true,
      opened: true,
    }

    return CompTreeViewUtils.newNode(rootNodeData) as StorageTreeNode
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
        share: {
          isPublic: source.share.isPublic,
          uids: [...source.share.uids],
        },
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
        nodeType: source.nodeType,
        contentType: source.contentType,
        size: source.size,
        share: {
          isPublic: source.share.isPublic,
          uids: [...source.share.uids],
        },
        baseURL: this.storageLogic.baseURL,
        created: source.created,
        updated: source.updated,
      }
    }
  }

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------

  /**
   * ユーザーがサインインした際のリスナです。
   * @param user
   */
  private async m_userOnSignedIn(user: User) {
    // 本クラスがアクティブ状態の場合(ストレージページが表示中)、
    // サーバーからストレージノード一覧の取得を行う
    if (this.m_isActive) {
      await this.pullNodes()
    }
  }

  /**
   * ユーザーがサインアウトした際のリスナです。
   * @param user
   */
  private async m_userOnSignedOut(user: User) {
    this.clear()
  }
}
