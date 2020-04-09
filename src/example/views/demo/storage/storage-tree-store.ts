import * as _path from 'path'
import {
  CompTreeView,
  CompTreeViewLazyLoadStatus,
  CompTreeViewUtils,
  StorageLogic,
  StorageNode,
  StorageNodeShareSettings,
  StorageNodeType,
  User,
} from '@/lib'
import { Component, Prop } from 'vue-property-decorator'
import { StorageTreeNodeData, StorageType, treeSortFunc } from '@/example/views/demo/storage/base'
import { arrayToDict, removeBothEndsSlash, removeStartDirChars, splitHierarchicalPaths } from 'web-base-lib'
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
      [this.rootNode.value, ...dirPaths].map(async iDirPath => {
        await this.storageLogic.fetchChildren(iDirPath)
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
    // 各ディレクトリの遅延ロードは済みにする
    for (const dirPath of dirPaths) {
      const dirTreeNode = this.getNode(dirPath)
      if (dirTreeNode) {
        dirTreeNode.lazyLoadStatus = 'loaded'
      }
    }

    // ルートノードを遅延ロード済みに設定
    this.rootNode.lazyLoadStatus = 'loaded'
  }

  /**
   * 指定されたディレクトリ直下の子ノードをサーバーから取得します。
   * @param dirPath
   */
  async pullChildren(dirPath: string): Promise<void> {
    const storeChildNodes = await this.storageLogic.fetchChildren(dirPath)

    // ロジックストアのノードをツリービューに反映
    this.setNodes(storeChildNodes)

    const dirTreeNode = this.getNode(dirPath)
    if (!dirTreeNode) {
      throw new Error(`The specified node was not found: '${dirPath}'`)
    }

    // ロジックストアにないがツリーには存在するノードをツリーから削除
    // ※他の端末で削除、移動、リネームされたノードが削除される
    this.m_removeNotExistsTreeNodes(storeChildNodes, dirTreeNode.children as StorageTreeNode[])

    // 引数ディレクトリを遅延ロード済みに設定
    dirTreeNode.lazyLoadStatus = 'loaded'
  }

  /**
   * 指定されたディレクトリの再読み込みを行います。
   * @param dirPath
   */
  async reloadDir(dirPath: string): Promise<void> {
    dirPath = removeBothEndsSlash(dirPath)

    // 引数ディレクトリを遅延ロード中に設定
    const dirTreeNode = this.getNode(dirPath)!
    dirTreeNode.lazyLoadStatus = 'loading'

    // 引数ディレクトリのパスを構成する各ディレクトリと配下ノードをサーバーから取得
    await this.storageLogic.fetchHierarchicalDescendants(dirPath)

    // ロジックストアのノードをツリービューに反映
    // ※引数ディレクトリの祖先ディレクトリが対象
    splitHierarchicalPaths(dirPath).map(ancestorDirPath => {
      // 引数ディレクトリは以降で処理するためここでは無視
      if (ancestorDirPath === dirPath) return
      // 祖先ディレクトリをツリービューに反映
      const storeDirNode = this.storageLogic.getNode({ path: ancestorDirPath })
      if (storeDirNode) {
        this.setNode(storeDirNode)
      } else {
        this.removeNode(ancestorDirPath)
      }
    })

    // ロジックストアのノードをツリービューに反映
    // ※引数ディレクトリと配下ノードが対象
    this.mergeDirDescendants(dirPath)

    // 引数ディレクトリ配下にあるディレクトリの遅延ロード状態を済みに設定
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

    // 引数ディレクトリを遅延ロード済みに設定
    dirTreeNode.lazyLoadStatus = 'loaded'
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
   * 指定されたノード＋配下ノードをロジックストアから取得し、ツリービューにマージします。
   * @param dirPath
   */
  mergeDirDescendants(dirPath: string): void {
    // ロジックストアから引数ディレクトリと配下のノードを取得
    const storeDirDescendants = this.storageLogic.getDirDescendants(dirPath)
    const storeDirDescendantIdDict = arrayToDict(storeDirDescendants, 'id')
    const storeDirDescendantPathDict = arrayToDict(storeDirDescendants, 'path')

    // ロジックストアのノードリストをツリービューへ反映
    this.setNodes(storeDirDescendants)

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

      const exists = Boolean(storeDirDescendantIdDict[treeNode.id] || storeDirDescendantPathDict[treeNode.value])
      !exists && this.removeNode(treeNode.value)
    }
  }

  /**
   * ツリービューのノードと指定されたノード＋直下ノードをロジックストアから取得し、ツリービューにマージします。
   * @param dirPath
   */
  mergeDirChildren(dirPath: string): void {
    // ロジックストアから引数ディレクトリと直下のノードを取得
    const storeDirChildren = this.storageLogic.getDirChildren(dirPath)
    const storeDirChildrenIdDict = arrayToDict(storeDirChildren, 'id')
    const storeDirChildrenPathDict = arrayToDict(storeDirChildren, 'path')

    // ロジックストアのノードリストをツリービューへ反映
    this.setNodes(storeDirChildren)

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

      const exists = Boolean(storeDirChildrenIdDict[treeNode.id] || storeDirChildrenPathDict[treeNode.value])
      !exists && this.removeNode(treeNode.value)
    }
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
    // id検索が必要な理由:
    //   他端末でノード移動するとidは変わらないがpathは変化する。
    //   この状況でpath検索を行うと、対象のノードを見つけられないためid検索する必要がある。
    // path検索が必要な理由:
    //   他端末で'd1/d11'を削除してからまた同じパスの'd1/d11'が作成された場合、
    //   元のidと再作成されたidが異なり、パスは同じでもidが異なる状況が発生する。
    //   この場合id検索しても対象ノードが見つからないため、path検索する必要がある。
    const treeNode = this.m_getNodeById(node.id) || this.getNode(node.path)

    // ツリービューに引数ノードが既に存在する場合
    if (treeNode) {
      // パスに変更がない場合(移動またはリネームされていない)
      if (treeNode.value === node.path) {
        treeNode.setNodeData(this.m_toTreeNodeData(node))
      }
      // パスに変更がある場合(移動またはリネームされていた場合)
      else {
        this.moveNode(treeNode.value, node.path)
      }
    }
    // ツリービューに引数ノードがまだ存在しない場合
    else {
      this.m_treeView!.addNode(this.m_toTreeNodeData(node), {
        parent: node.dir || this.rootNode.value,
      })
    }
  }

  /**
   * ノードの移動を行います。
   * @param fromNodePath 移動するノードパス。例: 'home/development'
   * @param toNodePath 移動後のノードパス。例: 'work/dev'
   */
  moveNode(fromNodePath: string, toNodePath: string): void {
    fromNodePath = removeBothEndsSlash(fromNodePath)
    toNodePath = removeBothEndsSlash(toNodePath)

    // ツリービューから移動するノードとその配下のノードを取得
    const targetTreeTopNode = this.getNode(fromNodePath)!
    const targetTreeNodes = [targetTreeTopNode, ...targetTreeTopNode.getDescendants<StorageTreeNode>()]

    // ツリービューから移動先のノードを取得
    const existsTreeTopNode = this.getNode(toNodePath)

    // 移動ノード＋配下ノードのパスを移動先パスへ書き換え
    for (const targetTreeNode of targetTreeNodes) {
      const reg = new RegExp(`^${fromNodePath}`)
      const newTargetNodePath = targetTreeNode.value.replace(reg, toNodePath)
      targetTreeNode.setNodeData({
        value: newTargetNodePath,
        label: _path.basename(newTargetNodePath),
      })
    }

    // 移動ノードと同名のノードが移動先に存在しない場合
    if (!existsTreeTopNode) {
      const parentPath = removeStartDirChars(_path.dirname(toNodePath))
      const parentTreeNode = this.getNode(parentPath)!
      parentTreeNode.addChild(targetTreeTopNode)
    }
    // 移動ノードと同名のノードが移動先に存在する場合
    else {
      // 移動ノードをツリーから削除
      // ※この後の処理で移動ノードを移動先の同名ノードへ上書きすることにより、
      //   移動ノードは必要なくなるためツリービューから削除
      this.m_treeView!.removeNode(targetTreeTopNode.value)

      // 移動ノード＋配下ノードを既存ノードへ付け替え
      const existsTreeNodes = [existsTreeTopNode, ...existsTreeTopNode.getDescendants<StorageTreeNode>()]
      const existsTreeNodeDict = arrayToDict(existsTreeNodes, 'value')
      for (const targetTreeNode of targetTreeNodes) {
        const existsTreeNode = existsTreeNodeDict[targetTreeNode.value]
        // 移動先に同名ノードが存在する場合
        if (existsTreeNode) {
          // 移動ノードを移動先の同名ノードへ上書き
          const toTreeNodeData = this.m_toTreeNodeData(targetTreeNode)
          delete toTreeNodeData.opened
          delete toTreeNodeData.lazyLoadStatus
          existsTreeNode.setNodeData(toTreeNodeData)
        }
        // 移動先に同名ノードが存在しない場合
        else {
          // 移動先のディレクトリを検索し、そのディレクトリに移動ノードを追加
          const parentPath = removeStartDirChars(_path.dirname(targetTreeNode.value))
          const parentTreeNode = existsTreeNodeDict[parentPath]
          existsTreeNodeDict[targetTreeNode.value] = parentTreeNode.addChild(targetTreeNode) as StorageTreeNode
        }
      }
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
   * ディレクトリの作成を行います。
   * @param dirPath 作成するディレクトリのパス
   */
  async createStorageDir(dirPath: string): Promise<void> {
    dirPath = removeBothEndsSlash(dirPath)

    // APIによるディレクトリ作成処理を実行
    let dirNode: StorageNode
    try {
      dirNode = (await this.storageLogic.createDirs([dirPath]))[0]
    } catch (err) {
      console.error(err)
      this.m_showNotification('error', String(this.$t('storage.create.creatingDirError', { nodeName: _path.basename(dirPath) })))
      return
    }

    // ツリービューに作成したディレクトリノードを追加
    this.setNode(dirNode)
    const dirTreeNode = this.getNode(dirPath)!
    // 作成したディレクトリの遅延ロード状態を済みに設定
    dirTreeNode.lazyLoadStatus = 'loaded'
  }

  /**
   * ノードの削除を行います。
   * @param nodePaths 削除するノードのパス
   */
  async removeStorageNodes(nodePaths: string[]): Promise<void> {
    nodePaths = nodePaths.map(fromNodePath => removeBothEndsSlash(fromNodePath))

    const dirPaths: string[] = []
    const filePaths: string[] = []

    // 引数チェック
    for (const nodePath of nodePaths) {
      if (nodePath === this.rootNode.value) {
        throw new Error(`The root node cannot be renamed.`)
      }

      const treeNode = this.getNode(nodePath)
      if (!treeNode) {
        throw new Error(`The specified node could not be found: '${nodePath}'`)
      }

      switch (treeNode.nodeType) {
        case StorageNodeType.Dir:
          dirPaths.push(treeNode.value)
          break
        case StorageNodeType.File:
          filePaths.push(treeNode.value)
          break
      }
    }

    // APIによる削除処理を実行
    try {
      if (dirPaths.length) await this.storageLogic.removeDirs(dirPaths)
      if (filePaths.length) await this.storageLogic.removeFiles(filePaths)
    } catch (err) {
      console.error(err)
      this.m_showNotification('error', String(this.$t('storage.delete.deletingError')))
      return
    }

    // ツリービューから引数ノードを削除
    this.removeNodes([...dirPaths, ...filePaths])
  }

  /**
   * ノードの移動を行います。
   * @param fromNodePaths 移動するノードのパス。例: ['home/dev', 'home/photos']
   * @param toDirPath 移動先のディレクトリパス。例: 'tmp'
   */
  async moveStorageNodes(fromNodePaths: string[], toDirPath: string): Promise<void> {
    fromNodePaths = fromNodePaths.map(fromNodePath => removeBothEndsSlash(fromNodePath))
    toDirPath = removeBothEndsSlash(toDirPath)

    const moveNodeDataList: { treeNode: StorageTreeNode; toNodePath: string }[] = []

    // 引数チェック
    for (const fromNodePath of fromNodePaths) {
      // 移動ノードがルートノードでないことを確認
      if (fromNodePath === this.rootNode.value) {
        throw new Error(`The root node cannot be moved.`)
      }

      // 移動ノードが存在することを確認
      const fromTreeNode = this.getNode(fromNodePath)
      if (!fromTreeNode) {
        throw new Error(`The specified node was not found: '${fromNodePath}'`)
      }

      if (fromTreeNode.nodeType === StorageNodeType.Dir) {
        // 移動先ディレクトリが移動対象のサブディレクトリでないことを確認
        // from: aaa/bbb → to: aaa/bbb/ccc/bbb [NG]
        //               → to: aaa/zzz/ccc/bbb [OK]
        if (toDirPath.startsWith(_path.join(fromNodePath, '/'))) {
          throw new Error(`The destination directory is its own subdirectory: '${fromNodePath}' -> '${toDirPath}'`)
        }
      }

      moveNodeDataList.push({
        treeNode: fromTreeNode,
        toNodePath: _path.join(toDirPath, fromTreeNode.label),
      })
    }

    //
    // 1. APIによる移動処理を実行
    //
    const moveStorageNode = async (moveNodeData: { treeNode: StorageTreeNode; toNodePath: string }) => {
      const fromTreeNode = moveNodeData.treeNode
      const toNodePath = moveNodeData.toNodePath
      try {
        switch (fromTreeNode.nodeType) {
          case StorageNodeType.Dir:
            await this.storageLogic.moveDir(fromTreeNode.value, toNodePath)
            break
          case StorageNodeType.File:
            await this.storageLogic.moveFile(fromTreeNode.value, toNodePath)
            break
        }
      } catch (err) {
        console.error(err)
        this.m_showNotification('error', String(this.$t('storage.move.movingError', { nodeName: fromTreeNode.label })))
        return undefined
      }
      return moveNodeData
    }
    const movedNodeDataList = await Promise.all(moveNodeDataList.map(moveNodeData => moveStorageNode(moveNodeData))).then(result => {
      return result.filter(moveNodeData => Boolean(moveNodeData)) as { treeNode: StorageTreeNode; toNodePath: string }[]
    })

    //
    // 2. 移動先ディレクトリとその上位ディレクトリ階層の作成
    //
    const hierarchicalNode = await this.storageLogic.fetchHierarchicalNode(toDirPath)
    this.setNodes(hierarchicalNode)

    // 3. 移動先ディレクトリに移動されたノードをツリービューへ反映
    for (const moveNodeData of movedNodeDataList) {
      // 移動されたノードをロジックストアから取得
      const toNodePath = moveNodeData.toNodePath
      const toNode = this.storageLogic.getNode({ path: toNodePath })!
      // 移動ノードがディレクトリの場合
      if (toNode.nodeType === StorageNodeType.Dir) {
        this.mergeDirDescendants(toNode.path)
      }
      // 移動ノードがファイルの場合
      else {
        this.setNode(toNode)
      }
    }

    //
    // 4. ディレクトリの子ノード読み込み
    //
    // 移動先ディレクトリとその上位ディレクトリの読み込み状態の設定
    for (const dirPath of [this.rootNode.value, ...splitHierarchicalPaths(toDirPath)]) {
      const dirTreeNode = this.getNode(dirPath)
      // ディレクトリがまだ子ノードを読み込んでいない場合
      // ※移動が行われた際はツリービューで上位を展開する仕様なので、
      //   子ノードが読み込まれていない場合は読み込んでおく必要がある。
      if (dirTreeNode && dirTreeNode.lazyLoadStatus === 'none') {
        await this.pullChildren(dirPath)
      }
    }
    // 移動ディレクトリの子ノード読み込み
    for (const moveNodeData of movedNodeDataList) {
      const toNodePath = moveNodeData.toNodePath
      const toTreeDirNode = this.getNode(toNodePath)!
      for (const treeNode of [toTreeDirNode, ...toTreeDirNode.getDescendants<StorageTreeNode>()]) {
        if (treeNode.nodeType !== StorageNodeType.Dir) continue
        // ディレクトリが既に子ノードを読み込んでいる場合
        if (treeNode.lazyLoadStatus === 'loaded') {
          await this.pullChildren(treeNode.value)
        }
      }
    }
  }

  /**
   * ノードをリネームします。
   * また対象のツリーノードとその子孫のパスも変更されます。
   * @param nodePath リネームするノードのパス
   * @param newName ノードの新しい名前
   */
  async renameStorageNode(nodePath: string, newName: string): Promise<void> {
    nodePath = removeBothEndsSlash(nodePath)

    if (nodePath === this.rootNode.value) {
      throw new Error(`The root node cannot be renamed.`)
    }

    const treeNode = this.getNode(nodePath)
    if (!treeNode) {
      throw new Error(`The specified node was not found: '${nodePath}'`)
    }

    // APIによるリネーム処理を実行
    try {
      if (treeNode.nodeType === StorageNodeType.Dir) {
        await this.storageLogic.renameDir(treeNode.value, newName)
      } else if (treeNode.nodeType === StorageNodeType.File) {
        await this.storageLogic.renameFile(treeNode.value, newName)
      }
    } catch (err) {
      console.error(err)
      this.m_showNotification('error', String(this.$t('storage.rename.renamingError', { nodeName: treeNode.label })))
      return
    }

    // リネームされたノードを取得
    const dirPath = removeStartDirChars(_path.dirname(nodePath))
    const toNodePath = _path.join(dirPath, newName)
    const toNode = this.storageLogic.getNode({ path: toNodePath })!

    // リネームノードがディレクトリの場合
    if (toNode.nodeType === StorageNodeType.Dir) {
      this.mergeDirDescendants(toNodePath)
    }
    // リネームノードノードがファイルの場合
    else {
      this.setNode(toNode)
    }

    // ディレクトリの子ノード読み込み
    const toTreeNode = this.getNode(toNodePath)!
    for (const treeNode of [toTreeNode, ...toTreeNode.getDescendants<StorageTreeNode>()]) {
      if (treeNode.nodeType !== StorageNodeType.Dir) continue
      // ディレクトリが既に子ノードを読み込んでいる場合
      if (treeNode.lazyLoadStatus === 'loaded') {
        await this.pullChildren(treeNode.value)
      }
    }
  }

  /**
   * ノードの共有設定を行います。
   * @param nodePaths 共有設定するノードのパス
   * @param settings 共有設定の内容
   */
  async setShareSettings(nodePaths: string[], settings: StorageNodeShareSettings): Promise<void> {
    nodePaths = nodePaths.map(fromNodePath => removeBothEndsSlash(fromNodePath))

    const treeNodes: StorageTreeNode[] = []

    // 引数チェック
    for (const nodePath of nodePaths) {
      if (nodePath === this.rootNode.value) {
        throw new Error(`The root node cannot be set share settings.`)
      }

      const treeNode = this.getNode(nodePath)
      if (!treeNode) {
        throw new Error(`The specified node was not found: '${nodePath}'`)
      }

      treeNodes.push(treeNode)
    }

    const setShare = async (treeNode: StorageTreeNode, settings: StorageNodeShareSettings) => {
      try {
        if (treeNode.nodeType === StorageNodeType.Dir) {
          return await this.storageLogic.setDirShareSettings(treeNode.value, settings)
        } else if (treeNode.nodeType === StorageNodeType.File) {
          return await this.storageLogic.setFileShareSettings(treeNode.value, settings)
        }
      } catch (err) {
        console.error(err)
        this.m_showNotification('error', String(this.$t('storage.share.sharingError', { nodeName: treeNode.label })))
        return undefined
      }
    }
    const processedNodes = await Promise.all(treeNodes.map(treeNode => setShare(treeNode, settings))).then(result => {
      return result.filter(nodePath => Boolean(nodePath)) as StorageNode[]
    })

    // ツリービューに処理内容を反映
    for (const node of processedNodes) {
      // 対象ノードがディレクトリの場合
      if (node.nodeType === StorageNodeType.Dir) {
        this.mergeDirDescendants(node.path)
      }
      // 対象ノードがファイルの場合
      else {
        this.setNode(node)
      }
    }
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
      sortFunc: treeSortFunc,
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
    if ((source as any).__vue__ || (source as any)._isVue) {
      source = source as StorageTreeNode
      const result: StorageTreeNodeData = {
        value: source.value,
        label: source.label,
        icon: source.icon,
        opened: source.opened,
        nodeClass: StorageTreeNode,
        lazy: source.nodeType === StorageNodeType.Dir,
        lazyLoadStatus: source.lazyLoadStatus,
        sortFunc: treeSortFunc,
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
        sortFunc: treeSortFunc,
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

  /**
   * ロジックストアにないツリーノードを削除します。
   * @param storeNodes
   * @param treeNodes
   */
  private m_removeNotExistsTreeNodes(storeNodes: StorageNode[], treeNodes: StorageTreeNode[]): void {
    const apiNodeIdDict = arrayToDict(storeNodes, 'id')
    const apiNodePathDict = arrayToDict(storeNodes, 'path')

    const removingNodes: string[] = []
    for (const treeNode of treeNodes) {
      const exists = Boolean(apiNodeIdDict[treeNode.id] || apiNodePathDict[treeNode.value])
      !exists && removingNodes.push(treeNode.value)
    }

    this.removeNodes(removingNodes)
  }

  private m_showNotification(type: 'error' | 'warning', message: string): void {
    this.$q.notify({
      icon: type === 'error' ? 'error' : 'warning',
      position: 'bottom-left',
      message,
      timeout: 0,
      color: 'red',
      actions: [{ icon: 'close', color: 'white' }],
    })
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
