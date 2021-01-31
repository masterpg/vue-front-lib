import {
  ArticleStorageService,
  StorageDownloader,
  StorageFileDownloader,
  StorageFileDownloaderType,
  StorageFileUploader,
  StorageService,
  UploadFileParam,
} from '@/app/service/modules/storage'
import { ComputedRef, Ref, WritableComputedRef, computed, ref, watch } from '@vue/composition-api'
import {
  CreateArticleTypeDirInput,
  RequiredStorageNodeShareSettings,
  SaveArticleSrcMasterFileResult,
  StorageArticleDirType,
  StorageArticleFileType,
  StorageArticleSettings,
  StorageNode,
  StorageNodeGetKeyInput,
  StorageNodeShareSettings,
  StorageNodeType,
  StorageType,
  StorageUtil,
  injectService,
} from '@/app/service'
import { DeepPartial, PartialAre, arrayToDict, pickProps, removeBothEndsSlash, removeStartDirChars, splitHierarchicalPaths } from 'web-base-lib'
import { StorageRoute, useViewRoutes } from '@/app/router'
import { StorageTreeNodeData, StorageTreeNodeInput } from '@/app/views/base/storage/base'
import { TreeView, TreeViewLazyLoadStatus, newTreeNode } from '@/app/components/tree-view'
import { Notify } from 'quasar'
import { StorageTreeNode } from '@/app/views/base/storage/storage-tree-node.vue'
import { UploadEndedEvent } from '@/app/components/storage'
import _path from 'path'
import dayjs from 'dayjs'
import { extendedMethod } from '@/app/base'
import merge from 'lodash/merge'
import { useConfig } from '@/app/config'
import { useI18n } from '@/app/i18n'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface StoragePageService {
  /**
   * ページデータを保管するストアです。
   */
  store: StoragePageStore
  /**
   * ユーザーがサインインしているか否かを表すフラグです。
   */
  isSignedIn: ComputedRef<boolean>
  /**
   * ストレージ用ルートオブジェクトです。
   */
  route: StorageRoute
  /**
   * ツリービューの選択ノードです。
   */
  selectedTreeNode: WritableComputedRef<StorageTreeNode>
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
  getStorageNode: StorageService['getNode']
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
   * 指定されたノード＋配下ノードをストアから取得し、ツリービューにマージします。
   * @param dirPath
   */
  mergeTreeDirDescendants(dirPath: string): void
  /**
   * ツリービューのノードと指定されたノード＋直下ノードをストアから取得し、ツリービューにマージします。
   * @param dirPath
   */
  mergeTreeDirChildren(dirPath: string): void
  /**
   * ストレージノードを取得します。
   * ノードが存在しない場合は例外がスローされます。
   */
  sgetStorageNode: StorageService['sgetNode']
  /**
   * 指定ディレクトリ配下のストレージノードを取得します。
   */
  getStorageDescendants: StorageService['getDescendants']
  /**
   * 指定ディレクトリ直下のストレージノードを取得します。
   */
  getStorageChildren: StorageService['getChildren']
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
   * @param options
   */
  reloadStorageDir(dirPath: string, options?: { deep: boolean }): Promise<void>
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
   * @param toParentPath 移動先親ディレクトリのパス。例: 'tmp'
   */
  moveStorageNodes(fromNodePaths: string[], toParentPath: string): Promise<void>
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
   * 指定されたノードにソート順を設定します。
   * @param orderNodePaths ソート順を設定するノードパスを順番に指定
   */
  setArticleSortOrder(orderNodePaths: string[]): Promise<void>
  /**
   * 記事ソースファイルを保存します。
   * @param articleDirPath 記事ディレクトリパス
   * @param srcContent 記事ソース
   * @param textContent 記事ソースのパース結果からテキストのみ抽出したもの
   */
  saveArticleSrcMasterFile(articleDirPath: string, srcContent: string, textContent: string): Promise<SaveArticleSrcMasterFileResult>
  /**
   * 下書きファイルを保存します。
   * @param articleDirPath 記事ディレクトリパス
   * @param srcContent 記事ソース
   */
  saveArticleSrcDraftFile(articleDirPath: string, srcContent: string): Promise<StorageNode>
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
  getDisplayNodeName(node: Pick<StorageNode, 'path' | 'name' | 'article'>): string
  /**
   * ノードの表示用パスを取得します。
   * @param key
   */
  getDisplayNodePath(key: StorageNodeGetKeyInput): string
  /**
   * ノードのアイコンを取得します。
   * @param node
   */
  getNodeIcon(node: { path: string; nodeType: StorageNodeType; article?: DeepPartial<StorageArticleSettings> }): string
  /**
   * ノードタイプのアイコンを取得します。
   * @param node
   */
  getNodeTypeIcon(node: { nodeType: StorageNodeType; article?: DeepPartial<StorageArticleSettings> }): string
  /**
   * ノードタイプの表示ラベルを取得します。
   * @param node
   */
  getNodeTypeLabel(node: { nodeType: StorageNodeType; article?: DeepPartial<StorageArticleSettings> }): string
  /**
   * 指定されたノードが記事ルートの配下ノードか否かを取得します。
   * @param key
   */
  isArticleRootUnder(key: StorageNodeGetKeyInput): boolean
  /**
   * 指定されたノードが｢アセットディレクトリ｣か否かを取得します。
   * @param key
   */
  isAssetsDir(key: StorageNodeGetKeyInput): boolean
  /**
   * 指定されたノードが｢リストバンドル｣か否かを取得します。
   * @param key
   */
  isListBundle(key: StorageNodeGetKeyInput): boolean
  /**
   * 指定されたノードが｢ツリーバンドル｣か否かを取得します。
   * @param key
   */
  isTreeBundle(key: StorageNodeGetKeyInput): boolean
  /**
   * 指定されたノードが｢カテゴリディレクトリ｣か否かを取得します。
   * @param key
   */
  isCategoryDir(key: StorageNodeGetKeyInput): boolean
  /**
   * 指定されたノードが｢記事ディレクトリ｣か否かを取得します。
   * @param key
   */
  isArticleDir(key: StorageNodeGetKeyInput): boolean
  /**
   * 指定されたノードが｢記事ディレクトリ｣配下のノードか否かを取得します。
   * @param key
   */
  isArticleDirUnder(key: StorageNodeGetKeyInput): boolean
  /**
   * 指定されたノードが｢記事マスターソース｣か否かを取得します。
   * @param key
   */
  isArticleMasterSrc(key: StorageNodeGetKeyInput): boolean
  /**
   * 指定されたノードが｢記事下書きソース｣か否かを取得します。
   * @param key
   */
  isArticleDraftSrc(key: StorageNodeGetKeyInput): boolean
  /**
   * 記事の下書きソースをローカルストレージから取得します。
   * @param draftNodeId 下書きファイルノードのID
   */
  getLocalArticleDraftData(draftNodeIdd: string): { version: number; srcContent: string }
  /**
   * 記事の下書きソースをローカルストレージへ保存します。
   * @param draftNodeIdd 下書きファイルノードのID
   * @param data
   *   - version: 下書きファイルノードのバージョン<br>
   *   - srcContent: 記事の下書きソース
   */
  setLocalArticleDraftData(draftNodeIdd: string, data: { version?: number; srcContent?: string }): void
  /**
   * 記事の下書きソースをローカルストレージから削除します。
   * @param draftNodeId 下書きファイルノードのID
   */
  discardLocalArticleDraftData(draftNodeIdd: string): void
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

namespace StoragePageService {
  const pageServiceDict: { [storageType: string]: StoragePageService } = {}

  /**
   * 指定されたストレージタイプに対応するストレージサービスのインスタンスを取得します。
   * @param storageType
   */
  export function getInstance(storageType: StorageType): StoragePageService {
    const pageService = pageServiceDict[storageType]
    if (!pageService) {
      throw new Error(`'StoragePageService' associated with the storage type '${storageType}' has not been instantiated.`)
    }
    return pageService
  }

  /**
   * 指定されたストレージタイプに対応するストレージサービスのインスタンスを破棄します。
   * @param storageType
   */
  export function destroyInstance(storageType: StorageType): void {
    delete pageServiceDict[storageType]
  }

  export function newInstance(params: {
    storageType: StorageType
    treeViewRef: Ref<TreeView<StorageTreeNode, StorageTreeNodeData> | undefined>
    nodeFilter?: (node: StorageNode) => boolean
  }): StoragePageService {
    const pageService = newRawInstance(params)
    pageServiceDict[params.storageType] = pageService
    return pageService
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
      nodeFilter = StorageTreeNodeFilter.DirFilter
    }

    //----------------------------------------------------------------------
    //
    //  Variables
    //
    //----------------------------------------------------------------------

    const config = useConfig()
    const service = injectService()
    const viewRoutes = useViewRoutes()
    const { t, tc } = useI18n()

    const storageService: StorageService = (() => {
      switch (storageType) {
        case 'app':
          return service.appStorage
        case 'user':
          return service.userStorage
        case 'article':
          return service.articleStorage
      }
    })()

    //----------------------------------------------------------------------
    //
    //  Properties
    //
    //----------------------------------------------------------------------

    const store: StoragePageService['store'] = StoragePageStore.getInstance(storageType)

    const isSignedIn = service.auth.isSignedIn

    const route: StorageRoute = (() => {
      switch (storageType) {
        case 'app':
          return viewRoutes.appAdmin.storage
        case 'user':
          return viewRoutes.siteAdmin.storage
        case 'article':
          return viewRoutes.siteAdmin.article
      }
    })()

    const selectedTreeNode: StoragePageService['selectedTreeNode'] = computed({
      get: () => {
        return treeViewRef.value?.selectedNode ?? getRootTreeNode()
      },
      set: node => {
        const current = getTreeView().selectedNode ?? getRootTreeNode()
        if (current.path !== node?.path) {
          getTreeView().selectedNode = node
        }
        store.selectedTreeNodePath.value = node.path
      },
    })

    const setSelectedTreeNode: StoragePageService['setSelectedTreeNode'] = (value, selected, silent) => {
      getTreeView().setSelectedNode(value, selected, silent)
      store.selectedTreeNodePath.value = value
    }

    //----------------------------------------------------------------------
    //
    //  Methods
    //
    //----------------------------------------------------------------------

    let _rootTreeNode: StorageTreeNode | null = null
    const getRootTreeNode: StoragePageService['getRootTreeNode'] = () => {
      if (!_rootTreeNode) {
        _rootTreeNode = newTreeNode<StorageTreeNode>(_createRootNodeData(storageType), StorageTreeNode.clazz)
      }
      return _rootTreeNode!
    }

    const getAllTreeNodes: StoragePageService['getAllTreeNodes'] = () => {
      return getTreeView().getAllNodes()
    }

    const getTreeNode: StoragePageService['getTreeNode'] = path => {
      return getTreeView().getNode(path)
    }

    const sgetTreeNode: StoragePageService['sgetTreeNode'] = path => {
      const node = getTreeView().getNode(path)
      if (!node) {
        throw new Error(`The specified tree node was not found: '${path}'`)
      }
      return node
    }

    const getStorageNode: StoragePageService['getStorageNode'] = key => {
      return storageService.getNode(key)
    }

    const sgetStorageNode: StoragePageService['sgetStorageNode'] = key => {
      return storageService.sgetNode(key)
    }

    const getStorageDescendants: StoragePageService['getStorageDescendants'] = dirPath => {
      return storageService.getDescendants(dirPath)
    }

    const getStorageChildren: StoragePageService['getStorageChildren'] = dirPath => {
      return storageService.getChildren(dirPath)
    }

    const fetchInitialStorage: StoragePageService['fetchInitialStorage'] = async dirPath => {
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
      const storageDirNodes: StorageNode[] = []

      if (!store.isFetchedInitialStorage.value) {
        // ルートノードを読み込み
        await storageService.fetchRoot()
        // 引数ディレクトリを含め、階層構造を形成する各ディレクトリの子ノードをサーバーから取得
        for (const iDirPath of [getRootTreeNode().path, ...dirPaths]) {
          storageDirNodes.push(...(await storageService.fetchChildren(iDirPath)))
        }
      } else {
        // 引数ディレクトリを含め、階層構造を形成する各ディレクトリの子ノードを取得
        for (const iDirPath of [getRootTreeNode().path, ...dirPaths]) {
          storageDirNodes.push(...storageService.getChildren(iDirPath))
        }
      }

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
      store.isFetchedInitialStorage.value = true
    }

    const fetchStorageChildren: StoragePageService['fetchStorageChildren'] = async dirPath => {
      const storeChildDirNodes = await storageService.fetchChildren(dirPath)

      // ストアのノードをツリービューに反映
      setTreeNodes(storeChildDirNodes)

      const dirTreeNode = getTreeNode(dirPath)
      if (!dirTreeNode) {
        throw new Error(`The specified node was not found: '${dirPath}'`)
      }

      // ストアにないがツリーには存在するノードをツリーから削除
      // ※他の端末で削除、移動、リネームされたノードが削除される
      removeNotExistsTreeNodes(storeChildDirNodes, dirTreeNode.children)

      // 引数ディレクトリを遅延ロード済みに設定
      dirTreeNode.lazyLoadStatus = 'loaded'
    }

    const reloadStorageDir = extendedMethod<StoragePageService['reloadStorageDir']>(async (dirPath, options) => {
      dirPath = removeBothEndsSlash(dirPath)
      const deep = options?.deep ?? false

      // 引数ディレクトリを遅延ロード中に設定
      const dirTreeNode = getTreeNode(dirPath)!
      dirTreeNode.lazyLoadStatus = 'loading'

      // 引数ディレクトリのパスを構成する各ディレクトリと、
      // ｢配下ノード or 直下ノード｣をサーバーから取得
      deep ? await storageService.fetchHierarchicalDescendants(dirPath) : await storageService.fetchHierarchicalChildren(dirPath)

      // ストアのノードをツリービューに反映
      // ※引数ディレクトリの祖先ディレクトリが対象
      splitHierarchicalPaths(dirPath).map(ancestorDirPath => {
        // 引数ディレクトリは以降で処理するためここでは無視
        if (ancestorDirPath === dirPath) return
        // 祖先ディレクトリをツリービューに反映
        const storeDirNode = storageService.getNode({ path: ancestorDirPath })
        if (storeDirNode) {
          setTreeNode(storeDirNode)
        } else {
          removeTreeNode(ancestorDirPath)
        }
      })

      // ストアのノードをツリービューに反映
      // ※引数ディレクトリと｢配下ノード or 直下ノード｣が対象
      deep ? mergeTreeDirDescendants(dirPath) : mergeTreeDirChildren(dirPath)

      if (deep) {
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
      }

      // 選択ノードがなくなってしまった場合
      if (!selectedTreeNode.value) {
        selectedTreeNode.value = getRootTreeNode()
      }

      // 引数ディレクトリを遅延ロード済みに設定
      dirTreeNode.lazyLoadStatus = 'loaded'
    })

    const setAllTreeNodes: StoragePageService['setAllTreeNodes'] = (nodes, rootNodeOptions) => {
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

    const setTreeNode: StoragePageService['setTreeNode'] = node => {
      // 対象ノードが記事下書きノードの場合
      if (node.article?.file?.type === StorageArticleFileType.Draft) {
        // ローカルストレージに下書きが存在した場合、その下書き情報のバージョンを更新
        const draftInfo = getLocalArticleDraftData(node.id)
        if (draftInfo.version) {
          setLocalArticleDraftData(node.id, { version: node.version })
        }
      }

      if (!nodeFilter(node)) return

      // id検索が必要な理由:
      //   他端末でノード移動するとidは変わらないがpathは変化する。
      //   この状況でpath検索を行うと、対象のノードを見つけられないためid検索する必要がある。
      // path検索が必要な理由:
      //   他端末で'd1/d11'を削除してからまた同じパスの'd1/d11'が作成された場合、
      //   元のidと再作成されたidが異なり、パスは同じでもidが異なる状況が発生する。
      //   この場合id検索しても対象ノードが見つからないため、path検索する必要がある。
      let treeNode = getTreeNodeById(node.id) || getTreeNode(node.path)

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

    const setTreeNodes: StoragePageService['setTreeNodes'] = nodes => {
      // 上位ノードから順に追加または更新する必要があるためソートする
      nodes = StorageUtil.sortNodes([...nodes])

      for (const node of nodes) {
        setTreeNode(node)
      }
    }

    const removeTreeNode: StoragePageService['removeTreeNode'] = path => {
      removeTreeNodes([path])
    }

    const removeTreeNodes: StoragePageService['removeTreeNodes'] = paths => {
      for (const path of paths) {
        getTreeView().removeNode(path)
      }

      // 選択ノードがなくなってしまった場合
      if (!selectedTreeNode.value) {
        selectedTreeNode.value = getRootTreeNode()
      }
    }

    const moveTreeNode: StoragePageService['moveTreeNode'] = (fromNodePath, toNodePath) => {
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
            const toTreeNodeData = nodeToTreeData(storageType, targetTreeNode) as PartialAre<
              ReturnType<typeof nodeToTreeData>,
              'opened' | 'lazyLoadStatus'
            >
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

    const mergeAllTreeNodes: StoragePageService['mergeAllTreeNodes'] = nodes => {
      nodes = StorageUtil.sortNodes([...nodes])

      const nodeDict = arrayToDict(nodes, 'path')

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

    const mergeTreeDirDescendants: StoragePageService['mergeTreeDirDescendants'] = dirPath => {
      // ストアから引数ディレクトリと配下のノードを取得
      const storeDirDescendants = storageService.getDirDescendants(dirPath)
      const storeDirDescendantIdDict = arrayToDict(storeDirDescendants, 'id')
      const storeDirDescendantPathDict = arrayToDict(storeDirDescendants, 'path')

      // ストアのノードリストをツリービューへ反映
      setTreeNodes(storeDirDescendants)

      // ツリービューから引数ディレクトリと配下のノードを取得
      const dirTreeNode = getTreeNode(dirPath)
      const driTreeDescendants: StorageTreeNode[] = []
      if (dirTreeNode) {
        driTreeDescendants.push(dirTreeNode)
        driTreeDescendants.push(...dirTreeNode.getDescendants())
      }

      // ストアのノードリストにないのにツリーには存在するノードを削除
      // ※他の端末で削除、移動、リネームされたノードが削除される
      for (const treeNode of driTreeDescendants) {
        // ツリーのルートノードはストアには存在しないので無視
        if (treeNode === getRootTreeNode()) continue

        const exists = Boolean(storeDirDescendantIdDict[treeNode.id] || storeDirDescendantPathDict[treeNode.path])
        !exists && removeTreeNode(treeNode.path)
      }
    }

    const mergeTreeDirChildren: StoragePageService['mergeTreeDirChildren'] = dirPath => {
      // ストアから引数ディレクトリと直下のノードを取得
      const storeDirChildren = storageService.getDirChildren(dirPath)
      const storeDirChildrenIdDict = arrayToDict(storeDirChildren, 'id')
      const storeDirChildrenPathDict = arrayToDict(storeDirChildren, 'path')

      // ストアのノードリストをツリービューへ反映
      setTreeNodes(storeDirChildren)

      // ツリービューから引数ディレクトリと直下のノードを取得
      const dirTreeNode = getTreeNode(dirPath)
      const dirTreeChildren: StorageTreeNode[] = []
      if (dirTreeNode) {
        dirTreeChildren.push(dirTreeNode)
        dirTreeChildren.push(...dirTreeNode.children)
      }

      // ストアのノードリストにないのにツリーには存在するノードを削除
      // ※他の端末で削除、移動、リネームされたノードが削除される
      for (const treeNode of dirTreeChildren) {
        // ツリーのルートノードはストアには存在しないので無視
        if (treeNode === getRootTreeNode()) continue

        const exists = Boolean(storeDirChildrenIdDict[treeNode.id] || storeDirChildrenPathDict[treeNode.path])
        !exists && removeTreeNode(treeNode.path)
      }
    }

    const createStorageDir: StoragePageService['createStorageDir'] = async dirPath => {
      dirPath = removeBothEndsSlash(dirPath)

      // APIによるディレクトリ作成処理を実行
      let dirNode: StorageNode
      try {
        dirNode = await storageService.createDir(dirPath)
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

    const createArticleTypeDir: StoragePageService['createArticleTypeDir'] = async input => {
      if (storageType !== 'article') {
        throw new Error(`This method cannot be executed by storageType '${storageType}'.`)
      }

      const articleService = storageService as ArticleStorageService

      // APIによるディレクトリ作成処理を実行
      let dirNode: StorageNode
      try {
        dirNode = await articleService.createArticleTypeDir(input)
      } catch (err) {
        console.error(err)
        showNotification('error', String(t('storage.create.creatingDirError', { nodeName: input.name })))
        return
      }

      // 記事ディレクトリ作成時は記事ファイルも作成されるので読み込みを行う
      let dirChildren: StorageNode[] = []
      if (dirNode.article?.dir?.type === StorageArticleDirType.Article) {
        dirChildren = articleService.getChildren(dirNode.path)
      }

      // ツリービューに作成したディレクトリノードを追加
      setTreeNodes([dirNode, ...dirChildren])
      const dirTreeNode = getTreeNode(dirNode.path)!
      // 作成したディレクトリの遅延ロード状態を済みに設定
      dirTreeNode.lazyLoadStatus = 'loaded'

      return dirTreeNode
    }

    const removeStorageNodes: StoragePageService['removeStorageNodes'] = async nodePaths => {
      nodePaths = nodePaths.map(fromNodePath => removeBothEndsSlash(fromNodePath))

      // 引数チェック
      for (const nodePath of nodePaths) {
        if (nodePath === getRootTreeNode().path) {
          throw new Error(`The root node cannot be renamed.`)
        }
        // ストレージストアに指定ノードが存在するかチェック
        storageService.sgetNode({ path: nodePath })
      }

      const removedNodePaths: string[] = []

      // APIによる削除処理を実行
      for (const nodePath of nodePaths) {
        const node = storageService.sgetNode({ path: nodePath })
        try {
          switch (node.nodeType) {
            case StorageNodeType.Dir:
              await storageService.removeDir(node.path)
              removedNodePaths.push(node.path)
              break
            case StorageNodeType.File:
              await storageService.removeFile(node.path)
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

    const moveStorageNodes: StoragePageService['moveStorageNodes'] = async (fromNodePaths, toParentPath) => {
      fromNodePaths = fromNodePaths.map(fromNodePath => removeBothEndsSlash(fromNodePath))
      toParentPath = removeBothEndsSlash(toParentPath)

      // 選択ノードのIDを保存しておく
      const selectedNodeId = selectedTreeNode.value.id

      // 引数チェック
      for (const fromNodePath of fromNodePaths) {
        // 移動ノードがルートノードでないことを確認
        if (fromNodePath === getRootTreeNode().path) {
          throw new Error(`The root node cannot be moved.`)
        }

        // ストレージストアに指定ノードが存在するかチェック
        const fromNode = storageService.sgetNode({ path: fromNodePath })

        if (fromNode.nodeType === StorageNodeType.Dir) {
          // 移動先ディレクトリが移動対象のサブディレクトリでないことを確認
          // from: aaa/bbb → to: aaa/bbb/ccc/bbb [NG]
          //               → to: aaa/zzz/ccc/bbb [OK]
          if (toParentPath.startsWith(_path.join(fromNodePath, '/'))) {
            throw new Error(`The destination directory is its own subdirectory: '${fromNodePath}' -> '${toParentPath}'`)
          }
        }
      }

      //
      // 1. APIによる移動処理を実行
      //
      const movedNodes: StorageNode[] = []
      for (const fromNodePath of fromNodePaths) {
        const fromNode = storageService.sgetNode({ path: fromNodePath })
        const toNodePath = _path.join(toParentPath, fromNode.name)
        try {
          switch (fromNode.nodeType) {
            case StorageNodeType.Dir: {
              const nodes = await storageService.moveDir(fromNode.path, toNodePath)
              movedNodes.push(...nodes)
              break
            }
            case StorageNodeType.File: {
              const node = await storageService.moveFile(fromNode.path, toNodePath)
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
      // 2. 移動先ディレクトリの上位ディレクトリ階層の取得
      //
      const hierarchicalNodes = await storageService.getHierarchicalNodes(toParentPath)
      setTreeNodes(hierarchicalNodes)

      //
      // 3. 移動ノードをツリービューに反映
      //
      setTreeNodes(movedNodes)

      // 移動によって選択ノードのパスが変わることがあるため、
      // 保存しておいた選択ノードIDをもとに選択ノードを再設定
      selectedTreeNode.value = getTreeNodeById(selectedNodeId)!
    }

    const renameStorageNode: StoragePageService['renameStorageNode'] = async (nodePath, newName) => {
      nodePath = removeBothEndsSlash(nodePath)

      if (nodePath === getRootTreeNode().path) {
        throw new Error(`The root node cannot be renamed.`)
      }

      const targetNode = storageService.sgetNode({ path: nodePath })

      // 選択ノードのIDを保存しておく
      const selectedNodeId = selectedTreeNode.value.id

      //
      // 1. APIによるリネーム処理を実行
      //
      const renamedNodes: StorageNode[] = []
      try {
        if (targetNode.nodeType === StorageNodeType.Dir) {
          const nodes = await storageService.renameDir(targetNode.path, newName)
          renamedNodes.push(...nodes)
        } else if (targetNode.nodeType === StorageNodeType.File) {
          const node = await storageService.renameFile(targetNode.path, newName)
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
      setTreeNodes(renamedNodes)

      // リネームによって選択ノードのパスが変わることがあるため、
      // 保存しておいた選択ノードIDをもとに選択ノードを再設定
      selectedTreeNode.value = getTreeNodeById(selectedNodeId)!
    }

    const setStorageNodeShareSettings: StoragePageService['setStorageNodeShareSettings'] = async (nodePaths, input) => {
      nodePaths = nodePaths.map(fromNodePath => removeBothEndsSlash(fromNodePath))

      // 引数チェック
      for (const nodePath of nodePaths) {
        if (nodePath === getRootTreeNode().path) {
          throw new Error(`The root node cannot be set share settings.`)
        }

        // ストレージストアに指定ノードが存在するかチェック
        storageService.sgetNode({ path: nodePath })
      }

      // APIによる共有設定処理を実行
      const processedNodes: StorageNode[] = []
      for (const nodePath of nodePaths) {
        const node = storageService.sgetNode({ path: nodePath })
        try {
          if (node.nodeType === StorageNodeType.Dir) {
            processedNodes.push(await storageService.setDirShareSettings(node.path, input))
          } else if (node.nodeType === StorageNodeType.File) {
            processedNodes.push(await storageService.setFileShareSettings(node.path, input))
          }
        } catch (err) {
          console.error(err)
          showNotification('error', String(t('storage.share.sharingError', { nodeName: node.name })))
        }
      }

      // ツリービューに処理内容を反映
      setTreeNodes(processedNodes)
    }

    const setArticleSortOrder: StoragePageService['setArticleSortOrder'] = async orderNodePaths => {
      if (storageType !== 'article') {
        throw new Error(`This method cannot be executed by storageType '${storageType}'.`)
      }

      const articleService = storageService as ArticleStorageService

      // 引数チェック
      for (const nodePath of orderNodePaths) {
        const node = articleService.sgetNode({ path: nodePath })
        if (!node.article?.dir) {
          const nodeDetail = JSON.stringify(pickProps(node, ['id', 'path', 'article']), null, 2)
          throw new Error(`A node is specified for which the sort order cannot be set: ${nodeDetail}`)
        }
      }

      // APIによるソート順設定を実行
      let processedNodes!: StorageNode[]
      try {
        processedNodes = await articleService.setArticleSortOrder(orderNodePaths)
      } catch (err) {
        console.error(err)
        showNotification('error', String(t('storage.sort.sortingError')))
      }

      // ツリービューに処理内容を反映
      setTreeNodes(processedNodes)
    }

    const saveArticleSrcMasterFile: StoragePageService['saveArticleSrcMasterFile'] = async (articleDirPath, srcContent, textContent) => {
      if (storageType !== 'article') {
        throw new Error(`This method cannot be executed by storageType '${storageType}'.`)
      }

      const articleService = storageService as ArticleStorageService

      // APIによる記事ソース保存を実行
      let processed!: SaveArticleSrcMasterFileResult
      try {
        processed = await articleService.saveArticleSrcMasterFile(articleDirPath, srcContent, textContent)
      } catch (err) {
        console.error(err)
        showNotification('error', String(t('article.saveMasterError')))
      }

      // ツリービューに処理内容を反映
      setTreeNodes([processed.master, processed.draft])

      return processed
    }

    const saveArticleSrcDraftFile: StoragePageService['saveArticleSrcDraftFile'] = async (articleDirPath, srcContent) => {
      if (storageType !== 'article') {
        throw new Error(`This method cannot be executed by storageType '${storageType}'.`)
      }

      const articleService = storageService as ArticleStorageService

      // APIによる下書き保存を実行
      let processedDraftNode!: StorageNode
      try {
        processedDraftNode = await articleService.saveArticleSrcDraftFile(articleDirPath, srcContent)
      } catch (err) {
        console.error(err)
        showNotification('error', String(t('article.saveDraftError')))
      }

      // ツリービューに処理内容を反映
      setTreeNode(processedDraftNode)

      return processedDraftNode
    }

    const onUploaded: StoragePageService['onUploaded'] = async e => {
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
      const uploadedNodes = uploadedNodePaths.reduce<StorageNode[]>((result, uploadedNodePath) => {
        const uploadedNode = getStorageNode({ path: uploadedNodePath })
        uploadedNode && result.push(uploadedNode)
        return result
      }, [])

      // 上記で取得したノードをツリービューに反映
      // ※アップロード前に必要なディレクトリは作成されるため、対象ノードの親ツリーノードは必ず存在する想定
      setTreeNodes(uploadedNodes)
    }

    const newDownloader: StoragePageService['newDownloader'] = () => {
      return storageService.newDownloader()
    }

    const newFileDownloader: StoragePageService['newFileDownloader'] = (type, filePath) => {
      return storageService.newFileDownloader(type, filePath)
    }

    const newFileUploader: StoragePageService['newFileUploader'] = uploadParam => {
      return storageService.newFileUploader(uploadParam)
    }

    //--------------------------------------------------
    //  Helper methods
    //--------------------------------------------------

    const showNotification: StoragePageService['showNotification'] = (type, message) => {
      Notify.create({
        icon: type === 'error' ? 'error' : 'warning',
        position: 'bottom-left',
        message,
        timeout: 0,
        color: type === 'error' ? 'red-9' : 'grey-9',
        actions: [{ icon: 'close', color: 'white' }],
      })
    }

    const getInheritedShare: StoragePageService['getInheritedShare'] = nodePath => {
      return storageService.getInheritedShare(nodePath)
    }

    const createRootNodeData: StoragePageService['createRootNodeData'] = () => _createRootNodeData(storageType)

    const nodeToTreeData: StoragePageService['nodeToTreeData'] = (storageType, source) => {
      const result = {
        storageType,
        value: removeBothEndsSlash(source.path),
        label: getDisplayNodeName(source),
        icon: getNodeIcon(source),
        lazy: source.nodeType === StorageNodeType.Dir,
        sortFunc: StorageUtil.childrenSortFunc,
        id: source.id,
        nodeType: source.nodeType,
        contentType: source.contentType,
        size: source.size,
        share: {
          isPublic: source.share.isPublic,
          readUIds: source.share.readUIds ? [...source.share.readUIds] : null,
          writeUIds: source.share.writeUIds ? [...source.share.writeUIds] : null,
        },
        article: StorageArticleSettings.clone(source.article),
        url: source.url,
        createdAt: source.createdAt,
        updatedAt: source.updatedAt,
        version: source.version,
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

    const getDisplayNodeName: StoragePageService['getDisplayNodeName'] = node => {
      if (isAssetsDir(node)) {
        return String(tc('storage.asset', 2))
      }
      return node.article?.dir?.name || node.name
    }

    const getDisplayNodePath: StoragePageService['getDisplayNodePath'] = key => {
      const node = storageService.getNode(key)
      if (!node) return ''

      const hierarchicalNodes = storageService.getHierarchicalNodes(node.path)
      return hierarchicalNodes.reduce((result, node) => {
        const name = getDisplayNodeName(node)
        return result ? `${result}/${name}` : name
      }, '')
    }

    const getNodeIcon: StoragePageService['getNodeIcon'] = node => {
      if (isAssetsDir(node)) {
        return 'photo_library'
      }

      return getNodeTypeIcon(node)
    }

    const getNodeTypeIcon: StoragePageService['getNodeTypeIcon'] = node => {
      if (node.article?.dir) {
        return StorageArticleDirType.getIcon(node.article.dir.type)
      } else {
        if (node.article?.file?.type === StorageArticleFileType.Master) {
          return 'fas fa-pen-square'
        } else {
          return StorageNodeType.getIcon(node.nodeType)
        }
      }
    }

    const getNodeTypeLabel: StoragePageService['getNodeTypeLabel'] = node => {
      switch (node.nodeType) {
        case StorageNodeType.Dir: {
          if (node.article?.dir) {
            return StorageArticleDirType.getLabel(node.article.dir.type)
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

    const isArticleRootUnder: StoragePageService['isArticleRootUnder'] = key => {
      const node = storageService.getNode(key)
      if (!node) return false
      return StorageUtil.isArticleRootUnder(storageService.toFullPath(node.path))
    }

    const isAssetsDir: StoragePageService['isAssetsDir'] = key => {
      if (storageType !== 'article') return false
      const node = storageService.getNode(key)
      if (!node) return false

      return node.path === config.storage.article.assetsName
    }

    const isListBundle: StoragePageService['isListBundle'] = key => {
      const node = storageService.getNode(key)
      if (!node) return false
      return node.article?.dir?.type === StorageArticleDirType.ListBundle
    }

    const isTreeBundle: StoragePageService['isTreeBundle'] = key => {
      const node = storageService.getNode(key)
      if (!node) return false
      return node.article?.dir?.type === StorageArticleDirType.TreeBundle
    }

    const isCategoryDir: StoragePageService['isCategoryDir'] = key => {
      const node = storageService.getNode(key)
      if (!node) return false
      return node.article?.dir?.type === StorageArticleDirType.Category
    }

    const isArticleDir: StoragePageService['isArticleDir'] = key => {
      const node = storageService.getNode(key)
      if (!node) return false
      return node.article?.dir?.type === StorageArticleDirType.Article
    }

    const isArticleDirUnder: StoragePageService['isArticleDirUnder'] = key => {
      function existsArticle(nodePath: string): boolean {
        const parentPath = removeStartDirChars(_path.dirname(nodePath))
        if (!parentPath) return false
        const parentNode = storageService.getNode({ path: parentPath })
        if (!parentNode) return false

        if (parentNode.article?.dir?.type === StorageArticleDirType.Article) {
          return true
        } else {
          return existsArticle(parentPath)
        }
      }

      const node = storageService.getNode(key)
      if (!node) return false

      const parentPath = removeStartDirChars(_path.dirname(node.path))
      if (!parentPath) return false

      return existsArticle(node.path)
    }

    const isArticleMasterSrc: StoragePageService['isArticleMasterSrc'] = key => {
      const node = storageService.getNode(key)
      if (!node) return false
      return node.article?.file?.type === StorageArticleFileType.Master
    }

    const isArticleDraftSrc: StoragePageService['isArticleDraftSrc'] = key => {
      const node = storageService.getNode(key)
      if (!node) return false
      return node.article?.file?.type === StorageArticleFileType.Draft
    }

    const getLocalArticleDraftData: StoragePageService['getLocalArticleDraftData'] = draftNodeIdd => {
      // ローカルストレージに保存されている下書きソースを取得
      const dataString = localStorage.getItem(`article.draft.${draftNodeIdd}`)
      // 保存されてなかった場合は空状態として返す
      if (!dataString) return { version: 0, srcContent: '' }

      // 取得した取得ソースをJSON形式にパースして返す
      const { version, srcContent } = JSON.parse(dataString) as { version: number; srcContent: string }
      return { version: version ?? 0, srcContent: srcContent ?? '' }
    }

    const setLocalArticleDraftData: StoragePageService['setLocalArticleDraftData'] = (draftNodeIdd, data) => {
      // 引数データが新規保存だった場合(まだローカルストレージに保存されていない場合)、
      // バージョン指定されていなかったらエラー
      const existingData = getLocalArticleDraftData(draftNodeIdd)
      if (!existingData.version && !data.version) {
        throw new Error('When you save a new draft to local storage, must specify the version.')
      }

      // 引数データをJSON文字列に変換してローカルストレージに保存
      const dataString = JSON.stringify(merge(existingData, data))
      localStorage.setItem(`article.draft.${draftNodeIdd}`, dataString)
    }

    const discardLocalArticleDraftData: StoragePageService['discardLocalArticleDraftData'] = draftNodeIdd => {
      localStorage.removeItem(`article.draft.${draftNodeIdd}`)
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
    function getTreeNodeById(id: string): StorageTreeNode | undefined {
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

    //----------------------------------------------------------------------
    //
    //  result
    //
    //----------------------------------------------------------------------

    return {
      store,
      isSignedIn,
      route,
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
      getStorageNode,
      sgetStorageNode,
      getStorageDescendants,
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
      setArticleSortOrder,
      saveArticleSrcMasterFile,
      saveArticleSrcDraftFile,
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
      isArticleRootUnder,
      isAssetsDir,
      isListBundle,
      isTreeBundle,
      isCategoryDir,
      isArticleDir,
      isArticleDirUnder,
      isArticleMasterSrc,
      isArticleDraftSrc,
      getLocalArticleDraftData,
      setLocalArticleDraftData,
      discardLocalArticleDraftData,
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
        icon = 'storage'
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
      sortFunc: StorageUtil.childrenSortFunc,
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
      article: undefined,
      url: '',
      createdAt: dayjs(0),
      updatedAt: dayjs(0),
      version: 0,
      disableContextMenu: false,
    }
  }
}

namespace StoragePageStore {
  const storeDict: { [storageType: string]: StoragePageStore } = {}

  export function getInstance(storageType: StorageType): StoragePageStore {
    let store = storeDict[storageType]
    if (!store) {
      store = newRawInstance()
      storeDict[storageType] = store
    }
    return store
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

namespace StorageTreeNodeFilter {
  export const AllFilter = (node: StorageNode) => {
    return true
  }

  export const DirFilter = (node: StorageNode) => {
    // ファイルを除外
    return node.nodeType === StorageNodeType.Dir
  }

  export const ArticleFilter = (node: StorageNode) => {
    // 下書きファイルは除外
    return node.article?.file?.type !== StorageArticleFileType.Draft
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { StoragePageService, StorageTreeNodeFilter }
