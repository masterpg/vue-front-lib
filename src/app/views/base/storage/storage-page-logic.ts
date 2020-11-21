import {
  ArticleStorageLogic,
  StorageDownloader,
  StorageFileDownloader,
  StorageFileDownloaderType,
  StorageFileUploader,
  StorageLogic,
  UploadFileParam,
} from '@/app/logic/modules/storage'
import { ComputedRef, Ref, WritableComputedRef, computed, ref, watch } from '@vue/composition-api'
import {
  CreateArticleTypeDirInput,
  RequiredStorageNodeShareSettings,
  StorageArticleNodeType,
  StorageNode,
  StorageNodeKeyInput,
  StorageNodeShareSettings,
  StorageNodeType,
  StorageType,
  injectLogic,
} from '@/app/logic'
import { StorageTreeNodeData, StorageTreeNodeInput } from '@/app/views/base/storage/base'
import { TreeView, TreeViewLazyLoadStatus, newTreeNode } from '@/app/components/tree-view'
import { arrayToDict, removeBothEndsSlash, removeStartDirChars, splitHierarchicalPaths } from 'web-base-lib'
import router, { StorageRoute } from '@/app/router'
import { Notify } from 'quasar'
import { StorageTreeNode } from '@/app/views/base/storage/storage-tree-node.vue'
import { UploadEndedEvent } from '@/app/components/storage'
import _path from 'path'
import dayjs from 'dayjs'
import { extendedMethod } from '@/app/base'
import { useConfig } from '@/app/config'
import { useI18n } from '@/app/i18n'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface StoragePageLogic {
  /**
   * ユーザーがサインインしているか否かを表すフラグです。
   */
  isSignedIn: ComputedRef<boolean>
  /**
   * ストレージ用ルートオブジェクトです。
   */
  route: StorageRoute
  /**
   * ツリービューの選択ノードのパスです。
   */
  selectedTreeNodePath: WritableComputedRef<string>
  /**
   * ツリービューの選択ノードです。
   */
  selectedTreeNode: WritableComputedRef<StorageTreeNode | null>
  /**
   * 指定されたノードの選択状態を設定します。
   * @param value ノードを特定するための値を指定
   * @param selected 選択状態を指定
   * @param silent 選択イベントを発火したくない場合はtrueを指定
   */
  setSelectedTreeNode(value: string, selected: boolean, silent: boolean): void
  /**
   * ツリービューのルートノードです。
   */
  getRootTreeNode: () => StorageTreeNode
  /**
   * ツリービューの全てのツリーノードを取得します。
   */
  getAllTreeNodes(): StorageTreeNode[]
  /**
   * 指定されたパスと一致するツリーノードを取得します。
   * @param path
   */
  getTreeNode(path: string): StorageTreeNode | undefined
  /**
   * 指定されたパスと一致するツリーノードを取得します。
   * ツリーノードが存在しない場合は例外がスローされます。
   * @param path
   */
  sgetTreeNode(path: string): StorageTreeNode
  /**
   * ストレージノードを取得します。
   */
  getStorageNode: StorageLogic['getNode']
  /**
   * ツリービューにあるノードを全て削除し、指定されたノードに置き換えます。
   * @param nodes
   * @param rootNodeOptions
   */
  setAllTreeNodes(nodes: StorageTreeNodeInput[], rootNodeOptions?: { opened?: boolean; lazyLoadStatus?: TreeViewLazyLoadStatus }): void
  /**
   * 指定されたノードをツリービューに設定します。
   * 対象のツリーノードがなかった場合、指定されたノードをもとにツリーノードを作成します。
   * @param node
   */
  setTreeNode(node: StorageTreeNodeInput): void
  /**
   * 指定されたノードリストをツリービューに設定します。
   * 対象のツリーノードがなかった場合、指定されたノードをもとにツリーノードを作成します。
   * @param nodes
   */
  setTreeNodes(nodes: StorageTreeNodeInput[]): void
  /**
   * 指定されたパスと一致するツリーノードを削除します。
   * @param path
   */
  removeTreeNode(path: string): void
  /**
   * 指定されたパスと一致するツリーノードを削除します。
   * @param paths
   */
  removeTreeNodes(paths: string[]): void
  /**
   * ノードの移動を行います。
   * @param fromNodePath 移動するノードパス。例: 'home/development'
   * @param toNodePath 移動後のノードパス。例: 'work/dev'
   */
  moveTreeNode(fromNodePath: string, toNodePath: string): void
  /**
   * ツリービューのノードと指定されたノードをマージしてツリービューに反映します。
   * @param nodes
   */
  mergeAllTreeNodes(nodes: StorageTreeNodeInput[]): void
  /**
   * 指定されたノード＋配下ノードをロジックストアから取得し、ツリービューにマージします。
   * @param dirPath
   */
  mergeTreeDirDescendants(dirPath: string): void
  /**
   * ツリービューのノードと指定されたノード＋直下ノードをロジックストアから取得し、ツリービューにマージします。
   * @param dirPath
   */
  mergeTreeDirChildren(dirPath: string): void
  /**
   * ストレージノードの初期読み込みが既に行われているか否かのフラグです。
   */
  isFetchedInitialStorage: ComputedRef<boolean>
  /**
   * ストレージノードを取得します。
   * ノードが存在しない場合は例外がスローされます。
   */
  sgetStorageNode: StorageLogic['sgetNode']
  /**
   * 指定ディレクトリ直下のストレージノードを取得します。
   */
  getStorageChildren: StorageLogic['getChildren']
  /**
   * ストレージノードの初回読み込みを行います。
   * 指定されたディレクトリを基準にその祖先と直下の子ノードがサーバーから読み込まれます。
   * @param dirPath
   */
  fetchInitialStorage(dirPath?: string): Promise<void>
  /**
   * 指定されたディレクトリ直下の子ノードをサーバーから読み込みます。
   * @param dirPath
   */
  fetchStorageChildren(dirPath: string): Promise<void>
  /**
   * 指定されたディレクトリの再読み込みを行います。
   * @param dirPath
   */
  reloadStorageDir(dirPath: string): Promise<void>
  /**
   * ディレクトリの作成を行います。
   * @param dirPath 作成するディレクトリのパス
   */
  createStorageDir(dirPath: string): Promise<void>
  /**
   * 記事系ディレクトリの作成を行います。
   * @param input
   */
  createArticleTypeDir(input: CreateArticleTypeDirInput): Promise<StorageTreeNode | undefined>
  /**
   * ノードの削除を行います。
   * @param nodePaths 削除するノードのパス
   */
  removeStorageNodes(nodePaths: string[]): Promise<void>
  /**
   * ノードの移動を行います。
   * @param fromNodePaths 移動するノードのパス。例: ['home/dev', 'home/photos']
   * @param toDirPath 移動先のディレクトリパス。例: 'tmp'
   */
  moveStorageNodes(fromNodePaths: string[], toDirPath: string): Promise<void>
  /**
   * ノードをリネームします。
   * また対象のツリーノードとその子孫のパスも変更されます。
   * @param nodePath リネームするノードのパス
   * @param newName ノードの新しい名前
   */
  renameStorageNode(nodePath: string, newName: string): Promise<void>
  /**
   * ノードの共有設定を行います。
   * @param nodePaths 共有設定するノードのパス
   * @param input 共有設定の内容
   */
  setStorageNodeShareSettings(nodePaths: string[], input: StorageNodeShareSettings): Promise<void>
  /**
   * アップロードが行われた後のツリーの更新処理を行います。
   * @param e
   */
  onUploaded(e: UploadEndedEvent): Promise<void>
  /**
   * ファイルまたはディレクトリのダウンロード管理を行うダウンローダーを生成します。
   */
  newDownloader(): StorageDownloader
  /**
   * 単一ファイルダウンロードの管理を行うダウンローダーを生成します。
   * @param type
   * @param filePath
   */
  newFileDownloader(type: StorageFileDownloaderType, filePath: string): StorageFileDownloader

  /**
   * 単一ファイルダアップロードの管理を行うアップローダーを生成します。
   * @param uploadParam
   */
  newFileUploader(uploadParam: UploadFileParam): StorageFileUploader

  //--------------------------------------------------
  //  Helper methods
  //--------------------------------------------------

  /**
   * 画面に通知バーを表示します。
   * @param type
   * @param message
   */
  showNotification(type: 'error' | 'warning', message: string): void
  /**
   * 上位ディレクトリの共有設定を加味した共有設定を取得します。
   * @param nodePath
   */
  getInheritedShare(nodePath: string): RequiredStorageNodeShareSettings
  /**
   * ルートノードのツリーノードデータを作成します。
   */
  createRootNodeData(): StorageTreeNodeData
  /**
   * ストレージノードまたはツリーノードをツリービューで扱える形式へ変換します。
   * @param storageType
   * @param source
   */
  nodeToTreeData(storageType: StorageType, source: StorageTreeNodeInput | StorageTreeNode): StorageTreeNodeData
  /**
   * ノードの表示用の名前を取得します。
   * @param node
   */
  getDisplayNodeName(node: {
    path: StorageNode['path']
    name: StorageNode['name']
    articleNodeName: StorageNode['articleNodeName']
    articleNodeType: StorageNode['articleNodeType']
  }): string
  /**
   * ノードの表示用パスを取得します。
   * @param key
   */
  getDisplayNodePath(key: StorageNodeKeyInput): string
  /**
   * ノードのアイコンを取得します。
   * @param node
   */
  getNodeIcon(node: { path: StorageNode['path']; nodeType: StorageNode['nodeType']; articleNodeType: StorageNode['articleNodeType'] }): string
  /**
   * ノードタイプのアイコンを取得します。
   * @param node
   */
  getNodeTypeIcon(node: { nodeType: StorageNode['nodeType']; articleNodeType: StorageNode['articleNodeType'] }): string
  /**
   * ノードタイプの表示ラベルを取得します。
   * @param node
   */
  getNodeTypeLabel(node: { nodeType: StorageNode['nodeType']; articleNodeType: StorageNode['articleNodeType'] }): string
  /**
   * 指定されたノードが｢アセットディレクトリ｣か否かを取得します。
   * @param key
   */
  isAssetsDir(key: StorageNodeKeyInput): boolean
  /**
   * 指定されたノードが｢リストバンドル｣か否かを取得します。
   * @param key
   */
  isListBundle(key: StorageNodeKeyInput): boolean
  /**
   * 指定されたノードが｢カテゴリバンドル｣か否かを取得します。
   * @param key
   */
  isCategoryBundle(key: StorageNodeKeyInput): boolean
  /**
   * 指定されたノードが｢カテゴリ｣か否かを取得します。
   * @param key
   */
  isCategory(key: StorageNodeKeyInput): boolean
  /**
   * 指定されたノードが｢記事｣か否かを取得します。
   * @param key
   */
  isArticle(key: StorageNodeKeyInput): boolean
  /**
   * 指定されたノードが｢記事ファイル｣か否かを取得します。
   * @param key
   */
  isArticleFile(key: StorageNodeKeyInput): boolean
  /**
   * 指定されたノードが｢記事｣の子孫か否かを取得します。
   * @param key
   */
  isArticleDescendant(key: StorageNodeKeyInput): boolean
}

interface StoragePageStore {
  isFetchedInitialStorage: Ref<boolean>
  selectedTreeNodePath: Ref<string>
}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace StoragePageLogic {
  const pageLogicDict: { [storageType: string]: StoragePageLogic } = {}

  export function getInstance(storageType: StorageType): StoragePageLogic {
    const pageLogic = pageLogicDict[storageType]
    if (!pageLogic) {
      throw new Error(`'StoragePageLogic' associated with the storage type '${storageType}' has not been instantiated.`)
    }
    return pageLogic
  }

  export function deleteInstance(storageType: StorageType): void {
    delete pageLogicDict[storageType]
  }

  export function newInstance(params: {
    storageType: StorageType
    treeViewRef: Ref<TreeView<StorageTreeNode, StorageTreeNodeData> | undefined>
    nodeFilter?: (node: StorageNode) => boolean
  }): StoragePageLogic {
    const pageLogic = newRawInstance(params)
    pageLogicDict[params.storageType] = pageLogic
    return pageLogic
  }

  export function newRawInstance(params: {
    storageType: StorageType
    treeViewRef: Ref<TreeView<StorageTreeNode, StorageTreeNodeData> | undefined>
    nodeFilter?: (node: StorageNode) => boolean
  }) {
    const { storageType, treeViewRef } = params

    let nodeFilter: (node: StorageNode) => boolean
    if (params.nodeFilter) {
      nodeFilter = params.nodeFilter
    } else {
      nodeFilter = (node: StorageNode) => {
        return node.nodeType === StorageNodeType.Dir
      }
    }

    //----------------------------------------------------------------------
    //
    //  Variables
    //
    //----------------------------------------------------------------------

    const config = useConfig()
    const logic = injectLogic()
    const { t, tc } = useI18n()

    const storageLogic: StorageLogic = (() => {
      switch (storageType) {
        case 'app':
          return logic.appStorage
        case 'user':
          return logic.userStorage
        case 'article':
          return logic.articleStorage
      }
    })()

    const pageStore = StoragePageStore.getInstance(storageType)

    //----------------------------------------------------------------------
    //
    //  Properties
    //
    //----------------------------------------------------------------------

    const isSignedIn = logic.auth.isSignedIn

    const route: StorageRoute = (() => {
      switch (storageType) {
        case 'app':
          return router.views.appAdmin.storage
        case 'user':
          return router.views.siteAdmin.storage
        case 'article':
          return router.views.siteAdmin.article
      }
    })()

    const selectedTreeNodePath = computed({
      get: () => pageStore.selectedTreeNodePath.value,
      set: value => (pageStore.selectedTreeNodePath.value = value),
    })

    const selectedTreeNode = computed({
      get: () => {
        return treeViewRef.value?.selectedNode ?? null
      },
      set: node => {
        const current = getTreeView().selectedNode
        if (current) {
          if (current.path !== node?.path) {
            getTreeView().selectedNode = node
          }
        } else {
          getTreeView().selectedNode = node
        }
      },
    })

    const setSelectedTreeNode: StoragePageLogic['setSelectedTreeNode'] = (value, selected, silent) => {
      getTreeView().setSelectedNode(value, selected, silent)
    }

    //----------------------------------------------------------------------
    //
    //  Methods
    //
    //----------------------------------------------------------------------

    let _rootTreeNode: StorageTreeNode | null = null
    const getRootTreeNode: StoragePageLogic['getRootTreeNode'] = () => {
      if (!_rootTreeNode) {
        _rootTreeNode = newTreeNode<StorageTreeNode>(_createRootNodeData(storageType), StorageTreeNode.clazz)
      }
      return _rootTreeNode!
    }

    const getAllTreeNodes: StoragePageLogic['getAllTreeNodes'] = () => {
      return getTreeView().getAllNodes()
    }

    const getTreeNode: StoragePageLogic['getTreeNode'] = path => {
      return getTreeView().getNode(path)
    }

    const sgetTreeNode: StoragePageLogic['sgetTreeNode'] = path => {
      const node = getTreeView().getNode(path)
      if (!node) {
        throw new Error(`The specified tree node was not found: '${path}'`)
      }
      return node
    }

    const getStorageNode: StoragePageLogic['getStorageNode'] = key => {
      return storageLogic.getNode(key)
    }

    const sgetStorageNode: StoragePageLogic['sgetStorageNode'] = key => {
      return storageLogic.sgetNode(key)
    }

    const getStorageChildren: StoragePageLogic['getStorageChildren'] = dirPath => {
      return storageLogic.getChildren(dirPath)
    }

    const fetchInitialStorage: StoragePageLogic['fetchInitialStorage'] = async dirPath => {
      dirPath = removeBothEndsSlash(dirPath)
      if (!treeViewRef.value) return
      if (!isSignedIn.value) return

      // ツリービューにルートノードを追加
      getTreeView().addNode(getRootTreeNode())
      getRootTreeNode().setSelected(true, true)
      getRootTreeNode().open(false)
      getRootTreeNode().lazy = true
      getRootTreeNode().lazyLoadStatus = 'loading'

      // 引数ディレクトリとその上位ディレクトリのパス
      const dirPaths = splitHierarchicalPaths(dirPath)
      // ストアにある最新のストレージノードを格納
      let storageDirNodes: StorageNode[] = []

      if (!pageStore.isFetchedInitialStorage.value) {
        // ルートノードを読み込み
        await storageLogic.fetchRoot()
        // 引数ディレクトリを含め、階層構造を形成する各ディレクトリの子ノードをサーバーから取得
        for (const iDirPath of [getRootTreeNode().path, ...dirPaths]) {
          storageDirNodes.push(...(await storageLogic.fetchChildren(iDirPath)))
        }
      } else {
        // 引数ディレクトリを含め、階層構造を形成する各ディレクトリの子ノードをサーバーから取得
        for (const iDirPath of [getRootTreeNode().path, ...dirPaths]) {
          storageDirNodes.push(...storageLogic.getChildren(iDirPath))
        }
      }

      // ストアから取得された最新のストレージノードを必要なものだけにフィルタ
      storageDirNodes = storageDirNodes.filter(nodeFilter)
      const storageDirNodeDict = arrayToDict(storageDirNodes, 'path')

      // 引数ディレクトリのパスを構成するディレクトリは展開した状態にする
      // ※初期表示時は指定されたディレクトリを表示しておきたいので
      for (const iDirPath of dirPaths) {
        if (iDirPath === dirPath) continue
        const dirNode = storageDirNodeDict[iDirPath]
        if (dirNode) {
          ;(dirNode as StorageTreeNodeInput).opened = true
        }
      }

      // 引数ディレクトリのパスを構成する各ディレクトリは子ノードが取得済みなので、
      // 各ディレクトリの遅延ロードは済みにする
      for (const dirPath of dirPaths) {
        const dirNode = storageDirNodeDict[dirPath]
        if (dirNode) {
          ;(dirNode as StorageTreeNodeInput).lazyLoadStatus = 'loaded'
        }
      }

      // ストアから取得された最新のストレージノードをツリービューに設定
      setTreeNodes(storageDirNodes)

      // ルートノードを遅延ロード済みに設定
      getRootTreeNode().lazyLoadStatus = 'loaded'

      // ストレージノードの初回読み込み済みを設定
      pageStore.isFetchedInitialStorage.value = true
    }

    const fetchStorageChildren: StoragePageLogic['fetchStorageChildren'] = async dirPath => {
      const storeChildDirNodes = (await storageLogic.fetchChildren(dirPath)).filter(nodeFilter)

      // ロジックストアのノードをツリービューに反映
      setTreeNodes(storeChildDirNodes)

      const dirTreeNode = getTreeNode(dirPath)
      if (!dirTreeNode) {
        throw new Error(`The specified node was not found: '${dirPath}'`)
      }

      // ロジックストアにないがツリーには存在するノードをツリーから削除
      // ※他の端末で削除、移動、リネームされたノードが削除される
      removeNotExistsTreeNodes(storeChildDirNodes, dirTreeNode.children)

      // 引数ディレクトリを遅延ロード済みに設定
      dirTreeNode.lazyLoadStatus = 'loaded'
    }

    const reloadStorageDir = extendedMethod<StoragePageLogic['reloadStorageDir']>(async dirPath => {
      dirPath = removeBothEndsSlash(dirPath)

      // 引数ディレクトリを遅延ロード中に設定
      const dirTreeNode = getTreeNode(dirPath)!
      dirTreeNode.lazyLoadStatus = 'loading'

      // 引数ディレクトリのパスを構成する各ディレクトリと配下ノードをサーバーから取得
      await storageLogic.fetchHierarchicalDescendants(dirPath)

      // ロジックストアのノードをツリービューに反映
      // ※引数ディレクトリの祖先ディレクトリが対象
      splitHierarchicalPaths(dirPath).map(ancestorDirPath => {
        // 引数ディレクトリは以降で処理するためここでは無視
        if (ancestorDirPath === dirPath) return
        // 祖先ディレクトリをツリービューに反映
        const storeDirNode = storageLogic.getNode({ path: ancestorDirPath })
        if (storeDirNode) {
          setTreeNode(storeDirNode)
        } else {
          removeTreeNode(ancestorDirPath)
        }
      })

      // ロジックストアのノードをツリービューに反映
      // ※引数ディレクトリと配下ノードが対象
      mergeTreeDirDescendants(dirPath)

      // 引数ディレクトリ配下にあるディレクトリの遅延ロード状態を済みに設定
      let treeDescendants: StorageTreeNode[] = []
      if (dirPath === getRootTreeNode().path) {
        treeDescendants = getAllTreeNodes()
      } else {
        const dirTreeNode = getTreeView().getNode(dirPath)
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
      if (!selectedTreeNode.value) {
        selectedTreeNode.value = getRootTreeNode()
      }

      // 引数ディレクトリを遅延ロード済みに設定
      dirTreeNode.lazyLoadStatus = 'loaded'
    })

    const setAllTreeNodes: StoragePageLogic['setAllTreeNodes'] = (nodes, rootNodeOptions) => {
      // ツリービューからルートノードを削除
      getTreeView().removeNode(getRootTreeNode().path)
      _rootTreeNode = null
      // ツリービューに新しいルートノードを追加
      const rootTreeNode = getRootTreeNode()
      rootNodeOptions?.opened && rootTreeNode.open(false)
      rootNodeOptions?.lazyLoadStatus && (rootTreeNode.lazyLoadStatus = rootNodeOptions.lazyLoadStatus)
      getTreeView().addNode(rootTreeNode)
      // 引数で指定されたノードを追加
      setTreeNodes(nodes)
    }

    const setTreeNode: StoragePageLogic['setTreeNode'] = node => {
      // id検索が必要な理由:
      //   他端末でノード移動するとidは変わらないがpathは変化する。
      //   この状況でpath検索を行うと、対象のノードを見つけられないためid検索する必要がある。
      // path検索が必要な理由:
      //   他端末で'd1/d11'を削除してからまた同じパスの'd1/d11'が作成された場合、
      //   元のidと再作成されたidが異なり、パスは同じでもidが異なる状況が発生する。
      //   この場合id検索しても対象ノードが見つからないため、path検索する必要がある。
      let treeNode = getNodeById(node.id) || getTreeNode(node.path)

      // ツリービューに引数ノードが既に存在する場合
      if (treeNode) {
        // パスに変更がある場合(移動またはリネームされていた場合)
        if (treeNode.path !== node.path) {
          moveTreeNode(treeNode.path, node.path)
          // `moveNode()`によって`treeNode`が削除されるケースがあるので取得し直している
          // ※移動先に同名ノードがあると、移動ノードが移動先ノードを上書きし、その後移動ノードは削除される。
          //   これにより`treeNode`はツリービューには存在しないノードとなるため取得し直す必要がある。
          treeNode = getTreeNode(node.path)!
        }
        treeNode.setNodeData(nodeToTreeData(storageType, node))
      }
      // ツリービューに引数ノードがまだ存在しない場合
      else {
        getTreeView().addNode(nodeToTreeData(storageType, node), {
          parent: node.dir || getRootTreeNode().path,
        })
      }
    }

    const setTreeNodes: StoragePageLogic['setTreeNodes'] = nodes => {
      nodes = StorageLogic.sortTree([...nodes])

      for (const node of nodes) {
        setTreeNode(node)
      }
    }

    const removeTreeNode: StoragePageLogic['removeTreeNode'] = path => {
      removeTreeNodes([path])
    }

    const removeTreeNodes: StoragePageLogic['removeTreeNodes'] = paths => {
      for (const path of paths) {
        getTreeView().removeNode(path)
      }

      // 選択ノードがなくなってしまった場合
      if (!selectedTreeNode.value) {
        selectedTreeNode.value = getRootTreeNode()
      }
    }

    const moveTreeNode: StoragePageLogic['moveTreeNode'] = (fromNodePath, toNodePath) => {
      fromNodePath = removeBothEndsSlash(fromNodePath)
      toNodePath = removeBothEndsSlash(toNodePath)

      // ツリービューから移動するノードとその配下のノードを取得
      const targetTreeTopNode = getTreeNode(fromNodePath)!
      const targetTreeNodes = [targetTreeTopNode, ...targetTreeTopNode.getDescendants()]

      // ツリービューから移動先のノードを取得
      const existsTreeTopNode = getTreeNode(toNodePath)

      // 移動ノード＋配下ノードのパスを移動先パスへ書き換え
      for (const targetTreeNode of targetTreeNodes) {
        const reg = new RegExp(`^${fromNodePath}`)
        const newTargetNodePath = targetTreeNode.path.replace(reg, toNodePath)
        targetTreeNode.setNodeData({
          value: newTargetNodePath,
          label: _path.basename(newTargetNodePath),
        })
      }

      // 移動ノードと同名のノードが移動先に存在しない場合
      if (!existsTreeTopNode) {
        const parentPath = removeStartDirChars(_path.dirname(toNodePath))
        const parentTreeNode = getTreeNode(parentPath)!
        parentTreeNode.addChild(targetTreeTopNode)
      }
      // 移動ノードと同名のノードが移動先に存在する場合
      else {
        // 移動ノードをツリーから削除
        // ※この後の処理で移動ノードを移動先の同名ノードへ上書きすることにより、
        //   移動ノードは必要なくなるためツリービューから削除
        getTreeView().removeNode(targetTreeTopNode.path)

        // 移動ノード＋配下ノードを既存ノードへ付け替え
        const existsTreeNodes = [existsTreeTopNode, ...existsTreeTopNode.getDescendants()]
        const existsTreeNodeDict = arrayToDict(existsTreeNodes, 'value')
        for (const targetTreeNode of targetTreeNodes) {
          const existsTreeNode = existsTreeNodeDict[targetTreeNode.path]
          // 移動先に同名ノードが存在する場合
          if (existsTreeNode) {
            // 移動ノードを移動先の同名ノードへ上書き
            const toTreeNodeData = nodeToTreeData(storageType, targetTreeNode)
            delete toTreeNodeData.opened
            delete toTreeNodeData.lazyLoadStatus
            existsTreeNode.setNodeData(toTreeNodeData)
          }
          // 移動先に同名ノードが存在しない場合
          else {
            // 移動先のディレクトリを検索し、そのディレクトリに移動ノードを追加
            const parentPath = removeStartDirChars(_path.dirname(targetTreeNode.path))
            const parentTreeNode = existsTreeNodeDict[parentPath]
            existsTreeNodeDict[targetTreeNode.path] = parentTreeNode.addChild(targetTreeNode)
          }
        }
      }
    }

    const mergeAllTreeNodes: StoragePageLogic['mergeAllTreeNodes'] = nodes => {
      let filteredNodes = nodes.filter(nodeFilter)
      filteredNodes = StorageLogic.sortTree([...filteredNodes])

      const nodeDict = arrayToDict(filteredNodes, 'path')

      // 新ノードリストにないのにツリーには存在するノードを削除
      // ※他の端末で削除、移動、リネームされたノードが削除される
      for (const treeNode of getAllTreeNodes()) {
        // ツリーのルートノードは新ノードリストには存在しないので無視
        if (treeNode === getRootTreeNode()) continue

        const node = nodeDict[treeNode.path]
        !node && removeTreeNode(treeNode.path)
      }

      // 新ノードリストをツリービューへ反映
      for (const newDirNode of Object.values(nodeDict)) {
        setTreeNode(newDirNode)
      }
    }

    const mergeTreeDirDescendants: StoragePageLogic['mergeTreeDirDescendants'] = dirPath => {
      // ロジックストアから引数ディレクトリと配下のノードを取得
      const storeDirDescendants = storageLogic.getDirDescendants(dirPath).filter(nodeFilter)
      const storeDirDescendantIdDict = arrayToDict(storeDirDescendants, 'id')
      const storeDirDescendantPathDict = arrayToDict(storeDirDescendants, 'path')

      // ロジックストアのノードリストをツリービューへ反映
      setTreeNodes(storeDirDescendants)

      // ツリービューから引数ディレクトリと配下のノードを取得
      const dirTreeNode = getTreeNode(dirPath)
      const driTreeDescendants: StorageTreeNode[] = []
      if (dirTreeNode) {
        driTreeDescendants.push(dirTreeNode)
        driTreeDescendants.push(...dirTreeNode.getDescendants())
      }

      // ロジックストアのノードリストにないのにツリーには存在するノードを削除
      // ※他の端末で削除、移動、リネームされたノードが削除される
      for (const treeNode of driTreeDescendants) {
        // ツリーのルートノードはロジックストアには存在しないので無視
        if (treeNode === getRootTreeNode()) continue

        const exists = Boolean(storeDirDescendantIdDict[treeNode.id] || storeDirDescendantPathDict[treeNode.path])
        !exists && removeTreeNode(treeNode.path)
      }
    }

    const mergeTreeDirChildren: StoragePageLogic['mergeTreeDirChildren'] = dirPath => {
      // ロジックストアから引数ディレクトリと直下のノードを取得
      const storeDirChildren = storageLogic.getDirChildren(dirPath).filter(nodeFilter)
      const storeDirChildrenIdDict = arrayToDict(storeDirChildren, 'id')
      const storeDirChildrenPathDict = arrayToDict(storeDirChildren, 'path')

      // ロジックストアのノードリストをツリービューへ反映
      setTreeNodes(storeDirChildren)

      // ツリービューから引数ディレクトリと直下のノードを取得
      const dirTreeNode = getTreeNode(dirPath)
      const dirTreeChildren: StorageTreeNode[] = []
      if (dirTreeNode) {
        dirTreeChildren.push(dirTreeNode)
        dirTreeChildren.push(...dirTreeNode.children)
      }

      // ロジックストアのノードリストにないのにツリーには存在するノードを削除
      // ※他の端末で削除、移動、リネームされたノードが削除される
      for (const treeNode of dirTreeChildren) {
        // ツリーのルートノードはロジックストアには存在しないので無視
        if (treeNode === getRootTreeNode()) continue

        const exists = Boolean(storeDirChildrenIdDict[treeNode.id] || storeDirChildrenPathDict[treeNode.path])
        !exists && removeTreeNode(treeNode.path)
      }
    }

    const createStorageDir: StoragePageLogic['createStorageDir'] = async dirPath => {
      dirPath = removeBothEndsSlash(dirPath)

      // APIによるディレクトリ作成処理を実行
      let dirNode: StorageNode
      try {
        dirNode = await storageLogic.createDir(dirPath)
      } catch (err) {
        console.error(err)
        showNotification('error', String(t('storage.create.creatingDirError', { nodeName: _path.basename(dirPath) })))
        return
      }

      // ツリービューに作成したディレクトリノードを追加
      setTreeNode(dirNode)
      const dirTreeNode = getTreeNode(dirPath)!
      // 作成したディレクトリの遅延ロード状態を済みに設定
      dirTreeNode.lazyLoadStatus = 'loaded'
    }

    const createArticleTypeDir: StoragePageLogic['createArticleTypeDir'] = async input => {
      if (storageType !== 'article') {
        throw new Error(`This method cannot be executed by storageType '${storageType}'.`)
      }

      const articleLogic = storageLogic as ArticleStorageLogic

      // APIによるディレクトリ作成処理を実行
      let dirNode: StorageNode
      try {
        dirNode = await articleLogic.createArticleTypeDir(input)
      } catch (err) {
        console.error(err)
        showNotification('error', String(t('storage.create.creatingDirError', { nodeName: input.articleNodeName })))
        return
      }

      // 記事ディレクトリ作成時は記事ファイルも作成されるので読み込みを行う
      let dirChildren: StorageNode[] = []
      if (dirNode.articleNodeType === StorageArticleNodeType.Article) {
        dirChildren = articleLogic.getChildren(dirNode.path)
      }

      // ツリービューに作成したディレクトリノードを追加
      setTreeNodes([dirNode, ...dirChildren])
      const dirTreeNode = getTreeNode(dirNode.path)!
      // 作成したディレクトリの遅延ロード状態を済みに設定
      dirTreeNode.lazyLoadStatus = 'loaded'

      return dirTreeNode
    }

    const removeStorageNodes: StoragePageLogic['removeStorageNodes'] = async nodePaths => {
      nodePaths = nodePaths.map(fromNodePath => removeBothEndsSlash(fromNodePath))

      // 引数チェック
      for (const nodePath of nodePaths) {
        if (nodePath === getRootTreeNode().path) {
          throw new Error(`The root node cannot be renamed.`)
        }
        // ストレージストアに指定ノードが存在するかチェック
        storageLogic.sgetNode({ path: nodePath })
      }

      const removedNodePaths: string[] = []

      // APIによる削除処理を実行
      for (const nodePath of nodePaths) {
        const node = storageLogic.sgetNode({ path: nodePath })
        try {
          switch (node.nodeType) {
            case StorageNodeType.Dir:
              await storageLogic.removeDir(node.path)
              removedNodePaths.push(node.path)
              break
            case StorageNodeType.File:
              await storageLogic.removeFile(node.path)
              removedNodePaths.push(node.path)
              break
          }
        } catch (err) {
          console.error(err)
          showNotification('error', String(t('storage.delete.deletingError', { nodeName: node.name })))
        }
      }

      // ツリービューから引数ノードを削除
      removeTreeNodes(removedNodePaths)
    }

    const moveStorageNodes: StoragePageLogic['moveStorageNodes'] = async (fromNodePaths, toDirPath) => {
      fromNodePaths = fromNodePaths.map(fromNodePath => removeBothEndsSlash(fromNodePath))
      toDirPath = removeBothEndsSlash(toDirPath)

      // 引数チェック
      for (const fromNodePath of fromNodePaths) {
        // 移動ノードがルートノードでないことを確認
        if (fromNodePath === getRootTreeNode().path) {
          throw new Error(`The root node cannot be moved.`)
        }

        // ストレージストアに指定ノードが存在するかチェック
        const fromNode = storageLogic.sgetNode({ path: fromNodePath })

        if (fromNode.nodeType === StorageNodeType.Dir) {
          // 移動先ディレクトリが移動対象のサブディレクトリでないことを確認
          // from: aaa/bbb → to: aaa/bbb/ccc/bbb [NG]
          //               → to: aaa/zzz/ccc/bbb [OK]
          if (toDirPath.startsWith(_path.join(fromNodePath, '/'))) {
            throw new Error(`The destination directory is its own subdirectory: '${fromNodePath}' -> '${toDirPath}'`)
          }
        }
      }

      //
      // 1. APIによる移動処理を実行
      //
      const movedNodes: StorageNode[] = []
      for (const fromNodePath of fromNodePaths) {
        const fromNode = storageLogic.sgetNode({ path: fromNodePath })
        const toNodePath = _path.join(toDirPath, fromNode.name)
        try {
          switch (fromNode.nodeType) {
            case StorageNodeType.Dir: {
              const nodes = await storageLogic.moveDir(fromNode.path, toNodePath)
              movedNodes.push(...nodes)
              break
            }
            case StorageNodeType.File: {
              const node = await storageLogic.moveFile(fromNode.path, toNodePath)
              movedNodes.push(node)
              break
            }
          }
        } catch (err) {
          console.error(err)
          showNotification('error', String(t('storage.move.movingError', { nodeName: fromNode.name })))
        }
      }

      //
      // 2. 移動先ディレクトリの上位ディレクトリ階層の作成
      //
      const hierarchicalNodes = await storageLogic.fetchHierarchicalNodes(toDirPath)
      setTreeNodes(hierarchicalNodes)

      //
      // 3. 移動ノードをツリービューに反映
      //
      const movedDirNodes = movedNodes.filter(nodeFilter)
      setTreeNodes(
        movedDirNodes.map(storeNode => {
          if (storeNode.nodeType === StorageNodeType.Dir) {
            return Object.assign({}, storeNode, { lazyLoadStatus: 'loaded' })
          } else {
            return storeNode
          }
        })
      )
    }

    const renameStorageNode: StoragePageLogic['renameStorageNode'] = async (nodePath, newName) => {
      nodePath = removeBothEndsSlash(nodePath)

      if (nodePath === getRootTreeNode().path) {
        throw new Error(`The root node cannot be renamed.`)
      }

      const targetNode = storageLogic.sgetNode({ path: nodePath })

      //
      // 1. APIによるリネーム処理を実行
      //
      const renamedNodes: StorageNode[] = []
      try {
        if (targetNode.nodeType === StorageNodeType.Dir) {
          const nodes = await storageLogic.renameDir(targetNode.path, newName)
          renamedNodes.push(...nodes)
        } else if (targetNode.nodeType === StorageNodeType.File) {
          const node = await storageLogic.renameFile(targetNode.path, newName)
          renamedNodes.push(node)
        }
      } catch (err) {
        console.error(err)
        showNotification('error', String(t('storage.rename.renamingError', { nodeName: targetNode.name })))
        return
      }

      //
      // 2. リネームノードをツリービューに反映
      //
      const renamedDirNodes = renamedNodes.filter(nodeFilter)
      setTreeNodes(
        renamedDirNodes.map(storeNode => {
          if (storeNode.nodeType === StorageNodeType.Dir) {
            return Object.assign({}, storeNode, { lazyLoadStatus: 'loaded' })
          } else {
            return storeNode
          }
        })
      )
    }

    const setStorageNodeShareSettings: StoragePageLogic['setStorageNodeShareSettings'] = async (nodePaths, input) => {
      nodePaths = nodePaths.map(fromNodePath => removeBothEndsSlash(fromNodePath))

      // 引数チェック
      for (const nodePath of nodePaths) {
        if (nodePath === getRootTreeNode().path) {
          throw new Error(`The root node cannot be set share settings.`)
        }

        // ストレージストアに指定ノードが存在するかチェック
        storageLogic.sgetNode({ path: nodePath })
      }

      // APIによる共有設定処理を実行
      const processedNodes: StorageNode[] = []
      for (const nodePath of nodePaths) {
        const node = storageLogic.sgetNode({ path: nodePath })
        try {
          if (node.nodeType === StorageNodeType.Dir) {
            processedNodes.push(await storageLogic.setDirShareSettings(node.path, input))
          } else if (node.nodeType === StorageNodeType.File) {
            processedNodes.push(await storageLogic.setFileShareSettings(node.path, input))
          }
        } catch (err) {
          console.error(err)
          showNotification('error', String(t('storage.share.sharingError', { nodeName: node.name })))
        }
      }

      // ツリービューに処理内容を反映
      const processedDirNodes = processedNodes.filter(nodeFilter)
      setTreeNodes(processedDirNodes)
    }

    const onUploaded: StoragePageLogic['onUploaded'] = async e => {
      const uploadDirTreeNode = getTreeNode(e.uploadDirPath)
      if (!uploadDirTreeNode) {
        throw new Error(`The specified node could not be found: '${e.uploadDirPath}'`)
      }

      // アップロードされたディレクトリ階層とファイルのパスを取得
      // 引数イベントが次のような場合:
      //   e: {
      //     uploadDirPath: 'd1',
      //     uploadFiles: [
      //       { path: 'd1/d11/d111/fileA.txt', … },
      //       { path: 'd1/d11/fileB.txt', … },
      //       { path: 'd1/d12/fileC.txt', … },
      //       { path: 'd1/fileD.txt', … },
      //     ]
      //   }
      // 次のようなパスが取得される:
      //   ['d1', 'd1/d11', 'd1/d12', 'd1/fileD.txt']
      const uploadedNodePaths = splitHierarchicalPaths(...e.uploadedFiles.map(item => item.path))

      // 上記で取得したパスのノードを取得
      const uploadedNodes = uploadedNodePaths
        .map(uploadedNodePath => {
          return sgetStorageNode({ path: uploadedNodePath })
        })
        .filter(nodeFilter)

      // 上記で取得したノードをツリービューに反映
      for (const uploadedNode of uploadedNodes) {
        // アップロード前に必要なディレクトリは作成されるため、
        // 対象ノードの親ツリーノードは必ず存在する想定
        setTreeNode(uploadedNode)
      }
    }

    const newDownloader: StoragePageLogic['newDownloader'] = () => {
      return storageLogic.newDownloader()
    }

    const newFileDownloader: StoragePageLogic['newFileDownloader'] = (type, filePath) => {
      return storageLogic.newFileDownloader(type, filePath)
    }

    const newFileUploader: StoragePageLogic['newFileUploader'] = uploadParam => {
      return storageLogic.newFileUploader(uploadParam)
    }

    //--------------------------------------------------
    //  Helper methods
    //--------------------------------------------------

    const showNotification: StoragePageLogic['showNotification'] = (type, message) => {
      Notify.create({
        icon: type === 'error' ? 'error' : 'warning',
        position: 'bottom-left',
        message,
        timeout: 0,
        color: type === 'error' ? 'red-9' : 'grey-9',
        actions: [{ icon: 'close', color: 'white' }],
      })
    }

    const getInheritedShare: StoragePageLogic['getInheritedShare'] = nodePath => {
      return storageLogic.getInheritedShare(nodePath)
    }

    const createRootNodeData: StoragePageLogic['createRootNodeData'] = () => _createRootNodeData(storageType)

    const nodeToTreeData: StoragePageLogic['nodeToTreeData'] = (storageType, source) => {
      const result = {
        storageType,
        value: removeBothEndsSlash(source.path),
        label: getDisplayNodeName(source),
        icon: getNodeIcon(source),
        lazy: source.nodeType === StorageNodeType.Dir,
        sortFunc: StorageLogic.childrenSortFunc,
        id: source.id,
        nodeType: source.nodeType,
        contentType: source.contentType,
        size: source.size,
        share: {
          isPublic: source.share.isPublic,
          readUIds: source.share.readUIds ? [...source.share.readUIds] : null,
          writeUIds: source.share.writeUIds ? [...source.share.writeUIds] : null,
        },
        articleNodeName: source.articleNodeName,
        articleNodeType: source.articleNodeType,
        articleSortOrder: source.articleSortOrder,
        url: source.url,
        createdAt: source.createdAt,
        updatedAt: source.updatedAt,
        disableContextMenu: source.disableContextMenu,
      } as StorageTreeNodeData

      if (typeof source.opened === 'boolean') {
        result.opened = source.opened
      }
      if (typeof source.lazyLoadStatus === 'string') {
        result.lazyLoadStatus = source.lazyLoadStatus
      }
      if (typeof source.disableContextMenu === 'boolean') {
        result.disableContextMenu = source.disableContextMenu
      }

      return result
    }

    const getDisplayNodeName: StoragePageLogic['getDisplayNodeName'] = node => {
      // ページのストレージタイプが｢記事｣かつ、指定されたノードがアセットディレクトリの場合
      if (storageType === 'article' && node.path === config.storage.article.assetsName) {
        return String(tc('storage.asset', 2))
      }
      if (node.articleNodeName) {
        return node.articleNodeName
      }
      return node.name
    }

    const getDisplayNodePath: StoragePageLogic['getDisplayNodePath'] = key => {
      const node = storageLogic.getNode(key)
      if (!node) return ''

      const hierarchicalNodes = storageLogic.getHierarchicalNodes(node.path)
      return hierarchicalNodes.reduce((result, node) => {
        const name = getDisplayNodeName(node)
        return result ? `${result}/${name}` : name
      }, '')
    }

    const getNodeIcon: StoragePageLogic['getNodeIcon'] = node => {
      // ページのストレージタイプが｢記事｣かつ、指定されたノードがアセットディレクトリの場合
      if (storageType === 'article' && node.path === config.storage.article.assetsName) {
        return 'photo_library'
      }

      return getNodeTypeIcon(node)
    }

    const getNodeTypeIcon: StoragePageLogic['getNodeTypeIcon'] = node => {
      if (node.articleNodeType) {
        return StorageArticleNodeType.getIcon(node.articleNodeType)
      } else {
        return StorageNodeType.getIcon(node.nodeType)
      }
    }

    const getNodeTypeLabel: StoragePageLogic['getNodeTypeLabel'] = node => {
      switch (node.nodeType) {
        case StorageNodeType.Dir: {
          if (node.articleNodeType) {
            return StorageArticleNodeType.getLabel(node.articleNodeType)
          }
          return StorageNodeType.getLabel(node.nodeType)
        }
        case StorageNodeType.File: {
          return StorageNodeType.getLabel(node.nodeType)
        }
        default: {
          return ''
        }
      }
    }

    const isAssetsDir: StoragePageLogic['isAssetsDir'] = key => {
      if (storageType !== 'article') return false
      const node = storageLogic.getNode(key)
      if (!node) return false

      return node.path === config.storage.article.assetsName
    }

    const isListBundle: StoragePageLogic['isListBundle'] = key => {
      if (storageType !== 'article') return false
      const node = storageLogic.getNode(key)
      if (!node) return false
      return node.articleNodeType === StorageArticleNodeType.ListBundle
    }

    const isCategoryBundle: StoragePageLogic['isCategoryBundle'] = key => {
      if (storageType !== 'article') return false
      const node = storageLogic.getNode(key)
      if (!node) return false
      return node.articleNodeType === StorageArticleNodeType.CategoryBundle
    }

    const isCategory: StoragePageLogic['isCategory'] = key => {
      if (storageType !== 'article') return false
      const node = storageLogic.getNode(key)
      if (!node) return false
      return node.articleNodeType === StorageArticleNodeType.Category
    }

    const isArticle: StoragePageLogic['isArticle'] = key => {
      if (storageType !== 'article') return false
      const node = storageLogic.getNode(key)
      if (!node) return false
      return node.articleNodeType === StorageArticleNodeType.Article
    }

    const isArticleFile: StoragePageLogic['isArticleFile'] = key => {
      if (storageType !== 'article') return false
      const node = storageLogic.getNode(key)
      if (!node) return false

      const parentPath = removeStartDirChars(_path.dirname(node.path))
      if (!parentPath) return false
      const parent = storageLogic.getNode({ path: parentPath })
      if (!parent) return false

      return parent.articleNodeType === StorageArticleNodeType.Article && node.name === config.storage.article.fileName
    }

    const isArticleDescendant: StoragePageLogic['isArticleDescendant'] = key => {
      if (storageType !== 'article') return false
      const node = storageLogic.getNode(key)
      if (!node) return false

      const parentPath = removeStartDirChars(_path.dirname(node.path))
      if (!parentPath) return false

      function existsArticle(nodePath: string): boolean {
        const parentPath = removeStartDirChars(_path.dirname(nodePath))
        if (!parentPath) return false
        const parentNode = storageLogic.getNode({ path: parentPath })
        if (!parentNode) return false

        if (parentNode.articleNodeType === StorageArticleNodeType.Article) {
          return true
        } else {
          return existsArticle(parentPath)
        }
      }

      return existsArticle(node.path)
    }

    //----------------------------------------------------------------------
    //
    //  Internal methods
    //
    //----------------------------------------------------------------------

    function getTreeView(): TreeView<StorageTreeNode, StorageTreeNodeData> {
      if (!treeViewRef.value) {
        throw new Error(`'treeViewRef' has not yet been instantiated.`)
      }
      treeViewRef.value.setNodeClass(StorageTreeNode.clazz)
      return treeViewRef.value!
    }

    /**
     * 指定されたIDと一致するツリーノードを取得します。
     * @param id
     */
    function getNodeById(id: string): StorageTreeNode | undefined {
      const allTreeNodes = getTreeView().getAllNodes()
      for (const treeNode of allTreeNodes) {
        if (treeNode.id === id) return treeNode
      }
      return undefined
    }

    /**
     * ストアに存在しないツリーノードを削除します。
     * @param storeNodes
     * @param treeNodes
     */
    function removeNotExistsTreeNodes(storeNodes: StorageNode[], treeNodes: StorageTreeNode[]): void {
      const apiNodeIdDict = arrayToDict(storeNodes, 'id')
      const apiNodePathDict = arrayToDict(storeNodes, 'path')

      const removingNodes: string[] = []
      for (const treeNode of treeNodes) {
        const exists = Boolean(apiNodeIdDict[treeNode.id] || apiNodePathDict[treeNode.path])
        !exists && removingNodes.push(treeNode.path)
      }

      removeTreeNodes(removingNodes)
    }

    //----------------------------------------------------------------------
    //
    //  Event listeners
    //
    //----------------------------------------------------------------------

    watch(
      () => isSignedIn.value,
      isSignedIn => {
        if (!isSignedIn) {
          // 表示中のルートノード配下全ノードを削除し、ルートノードを選択ノードにする
          getRootTreeNode().removeAllChildren()
          selectedTreeNode.value = getRootTreeNode()
        }
      }
    )

    watch(
      () => selectedTreeNode.value,
      newValue => {
        selectedTreeNodePath.value = newValue?.path ?? getRootTreeNode().path
      }
    )

    //----------------------------------------------------------------------
    //
    //  result
    //
    //----------------------------------------------------------------------

    return {
      isSignedIn,
      route,
      selectedTreeNodePath,
      selectedTreeNode,
      setSelectedTreeNode,
      getAllTreeNodes,
      getRootTreeNode,
      getTreeNode,
      sgetTreeNode,
      setAllTreeNodes,
      setTreeNode,
      setTreeNodes,
      removeTreeNode,
      removeTreeNodes,
      moveTreeNode,
      mergeAllTreeNodes,
      mergeTreeDirDescendants,
      mergeTreeDirChildren,
      isFetchedInitialStorage: pageStore.isFetchedInitialStorage,
      getStorageNode,
      sgetStorageNode,
      getStorageChildren,
      fetchInitialStorage,
      fetchStorageChildren,
      reloadStorageDir,
      createStorageDir,
      createArticleTypeDir,
      removeStorageNodes,
      moveStorageNodes,
      renameStorageNode,
      setStorageNodeShareSettings,
      onUploaded,
      newDownloader,
      newFileDownloader,
      newFileUploader,
      showNotification,
      getInheritedShare,
      createRootNodeData,
      nodeToTreeData,
      getDisplayNodeName,
      getDisplayNodePath,
      getNodeIcon,
      getNodeTypeIcon,
      getNodeTypeLabel,
      isAssetsDir,
      isListBundle,
      isCategoryBundle,
      isCategory,
      isArticle,
      isArticleFile,
      isArticleDescendant,
    }
  }

  /**
   * ルートノードのツリーノードデータを作成します。
   * @param storageType
   */
  function _createRootNodeData(storageType: StorageType): StorageTreeNodeData {
    const { t } = useI18n()

    let label: string
    let icon: string
    switch (storageType) {
      case 'app':
        label = String(t('storage.appRootName'))
        icon = 'storage'
        break
      case 'user':
        label = String(t('storage.userRootName'))
        icon = 'storage'
        break
      case 'article':
        label = String(t('storage.articleRootName'))
        icon = 'home'
        break
    }

    return {
      storageType,
      label,
      value: '',
      icon,
      opened: false,
      lazy: false,
      lazyLoadStatus: 'none',
      sortFunc: StorageLogic.childrenSortFunc,
      selected: false,
      id: '',
      nodeType: StorageNodeType.Dir,
      contentType: '',
      size: 0,
      share: {
        isPublic: false,
        readUIds: [],
        writeUIds: [],
      },
      articleNodeName: null,
      articleNodeType: null,
      articleSortOrder: null,
      url: '',
      createdAt: dayjs(0),
      updatedAt: dayjs(0),
      disableContextMenu: false,
    }
  }
}

namespace StoragePageStore {
  const pageStoreDict: { [storageType: string]: StoragePageStore } = {}

  export function getInstance(storageType: StorageType): StoragePageStore {
    let pageStore = pageStoreDict[storageType]
    if (!pageStore) {
      pageStore = newRawInstance()
      pageStoreDict[storageType] = pageStore
    }
    return pageStore
  }

  export function newRawInstance() {
    const isFetchedInitialStorage = ref(false)

    const selectedTreeNodePath = ref('')

    return {
      isFetchedInitialStorage,
      selectedTreeNodePath,
    }
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { StoragePageLogic }
