import * as _path from 'path'
import { CompTreeView, CompTreeViewLazyLoadStatus, CompTreeViewUtils, StorageLogic, StorageNode, StorageNodeType, User } from '@/lib'
import { Component, Prop } from 'vue-property-decorator'
import { StorageTreeNodeData, StorageType, treeSortFunc } from '@/example/views/demo/storage/base'
import { removeBothEndsSlash, removeStartDirChars, splitHierarchicalPaths } from 'web-base-lib'
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

export interface StorageNodeForTree extends StorageNode {
  opened?: boolean
  lazyLoadStatus?: CompTreeViewLazyLoadStatus
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

  private m_isInitialPulled: boolean = false

  /**
   * 初期ストレージノードの読み込みが行われたかを示すフラグです。
   */
  get isInitialPulled(): boolean {
    return this.m_isInitialPulled
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

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  setup(treeView: CompTreeView<StorageTreeNodeData>): void {
    this.m_treeView = treeView
    this.m_treeView.addNode(this.rootNode)
  }

  teardown(): void {
    this.m_treeView = null
  }

  clear(): void {
    this.m_isInitialPulled = false

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
  }

  /**
   * サーバーから初期ストレージの読み込みを行います。
   * @param dirPath
   */
  async pullInitialNodes(dirPath?: string): Promise<void> {
    if (this.m_isInitialPulled) return
    this.m_isInitialPulled = true

    dirPath = removeBothEndsSlash(dirPath)

    // ルートノードを遅延ロード中に設定
    this.rootNode.open(false)
    this.rootNode.lazy = true
    this.rootNode.lazyLoadStatus = 'loading'

    // 引数ディレクトリのパスを構成する各ディレクトリの子ノードをサーバーから取得
    const dirPaths = splitHierarchicalPaths(dirPath)
    await Promise.all(
      ['', ...dirPaths].map(async iDirPath => {
        await this.storageLogic.pullChildren(iDirPath)
      })
    )

    // サーバーから取得された最新のストレージノードを取得
    const nodeDict = this.storageLogic.getNodeDict()

    // 引数ディレクトリのパスを構成するディレクトリは展開した状態にする
    // ※初期表示時は指定されたディレクトリを表示しておきたいので
    for (const dirPath of dirPaths) {
      const dirNode = nodeDict[dirPath]
      if (dirNode) {
        ;(dirNode as StorageNodeForTree).opened = true
      }
    }

    // 最新のストレージノードをツリービューに設定
    this.setAllNodes(Object.values(nodeDict))

    // 引数ディレクトリのパスを構成する各ディレクトリは子ノードが取得済みなので、
    // 各ディレクトリの遅延ロードは完了状態にする
    for (const dirPath of dirPaths) {
      const dirNode = this.getNode(dirPath)
      if (dirNode) {
        dirNode.lazyLoadStatus = 'loaded'
      }
    }

    // ルートノードを遅延ロード完了に設定
    this.rootNode.lazyLoadStatus = 'loaded'
  }

  /**
   * 指定されたディレクトリ配下の子ノードをサーバーから取得します。
   * @param dirPath
   */
  async pullDescendants(dirPath: string): Promise<void> {
    dirPath = removeBothEndsSlash(dirPath)

    // 引数ディレクトリを遅延ロード中に設定
    const dirTreeNode = this.getNode(dirPath)!
    dirTreeNode.lazyLoadStatus = 'loading'

    // 引数ディレクトリのパスを構成する各ディレクトリの子ノードをサーバーから取得
    // ※引数ディレクトリは除く
    const dirPaths = splitHierarchicalPaths(dirPath)
    const promises: Promise<any>[] = []
    for (const iDirPath of [this.rootNode.value, ...dirPaths]) {
      if (iDirPath === dirPath) continue
      promises.push(this.storageLogic.pullChildren(iDirPath))
    }
    // 引数ディレクトリ配下のノードをサーバーから取得
    promises.push(
      (async () => {
        await this.storageLogic.pullDescendants(dirPath)
      })()
    )
    await Promise.all(promises)

    // ロジックストアのノードをツリービューに反映
    // ※引数ディレクトリのパスを構成する各ディレクトリ(引数ディレクトリは除く)が対象
    for (const iDirPath of [this.rootNode.value, ...dirPaths]) {
      if (iDirPath === dirPath) continue
      // ロジックストアのディレクトリと直下の子ノードをツリービューにマージ
      this.mergeDirChildren(iDirPath)
      // ディレクトリの遅延ロード状態を完了に設定
      const dirTreeNode = this.m_treeView!.getNode(iDirPath)
      if (dirTreeNode) {
        dirTreeNode.lazyLoadStatus = 'loaded'
      }
    }

    // ロジックストアのノードをツリービューに反映
    // ※引数ディレクトリが対象
    this.mergeDirDescendants(dirPath)

    // 引数ディレクトリ配下にあるディレクトリの遅延ロード状態を完了に設定
    let treeDescendants: StorageTreeNode[] = []
    if (dirPath === this.rootNode.value) {
      treeDescendants = this.getAllNodes()
    } else {
      const dirTreeNode = this.m_treeView!.getNode(dirPath)
      if (dirTreeNode) {
        treeDescendants = dirTreeNode.getDescendants()
      }
    }
    for (const treeNode of treeDescendants) {
      if (treeNode.nodeType === StorageNodeType.Dir) {
        treeNode.lazyLoadStatus = 'loaded'
      }
    }

    // 選択ノードがなくなってしまった場合
    if (!this.selectedNode) {
      this.selectedNode = this.rootNode
    }

    // 引数ディレクトリを遅延ロード完了に設定
    dirTreeNode.lazyLoadStatus = 'loaded'
  }

  /**
   * 指定されたディレクトリ直下の子ノードをサーバーから取得します。
   * @param dirPath
   */
  async pullChildren(dirPath: string): Promise<void> {
    const pulled = await this.storageLogic.pullChildren(dirPath)
    this.setNodes([...pulled.added, ...pulled.updated])
    this.removeNodes(pulled.removed.map(node => node.path))
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
   * ツリービューにあるノードを全て削除し、指定されたノードに置き換えます。
   * @param nodes
   */
  setAllNodes(nodes: StorageNodeForTree[]): void {
    const targetNodePaths = this.getAllNodes().reduce(
      (result, node) => {
        node !== this.rootNode && result.push(node.value)
        return result
      },
      [] as string[]
    )
    this.removeNodes(targetNodePaths)

    this.setNodes(nodes)
  }

  /**
   * ツリービューのノードと指定されたノードをマージしてツリービューに反映します。
   * @param nodes
   */
  mergeAllNodes(nodes: StorageNodeForTree[]): void {
    nodes = this.storageLogic.sortNodes([...nodes])

    const nodeDict = nodes.reduce(
      (result, node) => {
        result[node.path] = node
        return result
      },
      {} as { [path: string]: StorageNode }
    )

    // 新ノードリストにないのにツリーには存在するノードを削除
    // ※他の端末で削除、移動、リネームされたノードが削除される
    for (const treeNode of this.getAllNodes()) {
      // ツリーのルートノードは新ノードリストには存在しないので無視
      if (treeNode === this.rootNode) continue

      const node = nodeDict[treeNode.value]
      !node && this.removeNode(treeNode.value)
    }

    // 新ノードリストをツリービューへ反映
    for (const newNode of nodes) {
      this.setNode(newNode)
    }
  }

  /**
   * ツリービューのノードと指定されたノード＋配下ノードをロジックストアから取得し、ツリービューにマージします。
   * @param dirPath
   */
  mergeDirDescendants(dirPath: string): void {
    // ロジックストアから引数ディレクトリと配下のノードを取得
    const storeDirDescendantDict = this.storageLogic.getDirDescendants(dirPath).reduce(
      (result, node) => {
        result[node.path] = node
        return result
      },
      {} as { [path: string]: StorageNode }
    )

    // ツリービューから引数ディレクトリと配下のノードを取得
    const dirTreeNode = this.getNode(dirPath)
    const driTreeDescendants: StorageTreeNode[] = []
    if (dirTreeNode) {
      driTreeDescendants.push(dirTreeNode)
      driTreeDescendants.push(...dirTreeNode.getDescendants<StorageTreeNode>())
    }

    // ロジックストアのノードリストにないのにツリーには存在するノードを削除
    // ※他の端末で削除、移動、リネームされたノードが削除される
    for (const treeNode of driTreeDescendants) {
      // ツリーのルートノードはロジックストアには存在しないので無視
      if (treeNode === this.rootNode) continue

      const storeNode = storeDirDescendantDict[treeNode.value]
      !storeNode && this.removeNode(treeNode.value)
    }

    // ロジックストアのノードリストをツリービューへ反映
    this.setNodes(Object.values(storeDirDescendantDict))
  }

  /**
   * ツリービューのノードと指定されたノード＋直下ノードをロジックストアから取得し、ツリービューにマージします。
   * @param dirPath
   */
  mergeDirChildren(dirPath: string): void {
    // ロジックストアから引数ディレクトリと直下のノードを取得
    const storeDirChildDict = this.storageLogic.getDirChildren(dirPath).reduce(
      (result, node) => {
        result[node.path] = node
        return result
      },
      {} as { [path: string]: StorageNode }
    )

    // ツリービューから引数ディレクトリと直下のノードを取得
    const dirTreeNode = this.getNode(dirPath)
    const dirTreeChildren: StorageTreeNode[] = []
    if (dirTreeNode) {
      dirTreeChildren.push(dirTreeNode)
      dirTreeChildren.push(...(dirTreeNode.children as StorageTreeNode[]))
    }

    // ロジックストアのノードリストにないのにツリーには存在するノードを削除
    // ※他の端末で削除、移動、リネームされたノードが削除される
    for (const treeNode of dirTreeChildren) {
      // ツリーのルートノードはロジックストアには存在しないので無視
      if (treeNode === this.rootNode) continue

      const storeNode = storeDirChildDict[treeNode.value]
      !storeNode && this.removeNode(treeNode.value)
    }

    // ロジックストアのノードリストをツリービューへ反映
    this.setNodes(Object.values(storeDirChildDict))
  }

  /**
   * 指定されたノードリストをツリービューに設定します。
   * 対象のツリーノードがなかった場合、指定されたノードをもとにツリーノードを作成します。
   * @param nodes
   */
  setNodes(nodes: StorageNodeForTree[]): void {
    nodes = this.storageLogic.sortNodes([...nodes])

    for (const node of nodes) {
      this.setNode(node)
    }
  }

  /**
   * 指定されたノードをツリービューに設定します。
   * 対象のツリーノードがなかった場合、指定されたノードをもとにツリーノードを作成します。
   * @param node
   */
  setNode(node: StorageNodeForTree): void {
    // 引数ノードが移動またはリネームされている可能性があるのでIDで検索
    const treeNode = this.m_getNodeById(node.id)

    // ツリービューに引数ノードが既に存在する場合
    if (treeNode) {
      // パスに変更がない場合(移動またはリネームされていない)
      if (treeNode.value === node.path) {
        treeNode.setNodeData(this.m_toTreeNodeData(node))
      }
      // 移動またはリネームされていた場合
      else {
        treeNode.setNodeData(this.m_toTreeNodeData(node))
        this.m_treeView!.addNode(treeNode, {
          parent: node.dir || this.rootNode.value,
          sortFunc: treeSortFunc,
        })
      }
    }
    // ツリービューに引数ノードがまだ存在しない場合
    else {
      this.m_treeView!.addNode(this.m_toTreeNodeData(node), {
        parent: node.dir || this.rootNode.value,
        sortFunc: treeSortFunc,
      })
    }
  }

  /**
   * 指定されたパスと一致するツリーノードを削除します。
   * @param paths
   */
  removeNodes(paths: string[]): void {
    for (const path of paths) {
      this.m_treeView!.removeNode(path)
    }

    // 選択ノードがなくなってしまった場合
    if (!this.selectedNode) {
      this.selectedNode = this.rootNode
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
      if (toPath.startsWith(_path.join(fromPath, '/'))) {
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
      const targetChildDict = (target.children as StorageTreeNode[]).reduce(
        (result, node) => {
          result[node.label] = node
          return result
        },
        {} as { [label: string]: StorageTreeNode }
      )
      for (const existsChild of [...existsNode.children]) {
        // 移動先と移動対象に同名の子ノードが存在する場合はスルー
        // (同名の子ノードがあった場合、移動対象の子ノードが優先される)
        if (targetChildDict[existsChild.label]) {
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
    this.m_treeView!.addNode(target, {
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
   * 指定されたIDと一致するツリーノードを取得します。
   * @param id
   */
  private m_getNodeById(id: string): StorageTreeNode | undefined {
    const allTreeNodes = this.m_treeView!.getAllNodes<StorageTreeNode>()
    for (const treeNode of allTreeNodes) {
      if (treeNode.id === id) return treeNode
    }
    return undefined
  }

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

    const rootNodeData: StorageTreeNodeData = {
      nodeClass: StorageTreeNode,
      label,
      value: '',
      icon: 'storage',
      opened: false,
      lazy: false,
      selected: true,
      id: '',
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
    }

    return CompTreeViewUtils.newNode(rootNodeData) as StorageTreeNode
  }

  /**
   * `StorageNode`または`StorageTreeNode`をツリービューで扱える形式の
   * `StorageTreeNodeData`へ変換します。
   * @param source
   */
  private m_toTreeNodeData(source: StorageNodeForTree | StorageTreeNode): StorageTreeNodeData {
    if ((source as any).__vue__) {
      source = source as StorageTreeNode
      const result: StorageTreeNodeData = {
        value: source.value,
        label: source.label,
        icon: source.icon,
        opened: source.opened,
        nodeClass: StorageTreeNode,
        lazy: source.nodeType === StorageNodeType.Dir,
        lazyLoadStatus: source.lazyLoadStatus,
        id: source.id,
        nodeType: source.nodeType,
        contentType: source.contentType,
        size: source.size,
        share: {
          isPublic: source.share.isPublic,
          uids: source.share.uids ? [...source.share.uids] : undefined,
        },
        baseURL: source.baseURL,
        created: source.createdDate,
        updated: source.updatedDate,
      }
      return result
    } else {
      source = source as StorageNodeForTree
      const result: StorageTreeNodeData = {
        value: removeBothEndsSlash(source.path),
        label: removeBothEndsSlash(source.name),
        icon: source.nodeType === StorageNodeType.Dir ? 'folder' : 'description',
        nodeClass: StorageTreeNode,
        lazy: source.nodeType === StorageNodeType.Dir,
        lazyLoadStatus: source.lazyLoadStatus,
        id: source.id,
        nodeType: source.nodeType,
        contentType: source.contentType,
        size: source.size,
        share: {
          isPublic: source.share.isPublic,
          uids: source.share.uids ? [...source.share.uids] : undefined,
        },
        baseURL: this.storageLogic.baseURL,
        created: source.created,
        updated: source.updated,
      }
      if (typeof source.opened === 'boolean') {
        result.opened = source.opened
      }
      return result
    }
  }

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------

  /**
   * ユーザーがサインアウトした際のリスナです。
   * @param user
   */
  private async m_userOnSignedOut(user: User) {
    this.clear()
  }
}
