import {
  CreateArticleTypeDirInput,
  CreateStorageNodeOptions,
  GetArticleChildrenInput,
  SaveArticleSrcMasterFileResult,
  StorageNode,
  StoragePaginationInput,
  StoragePaginationResult,
} from '@/app/services/base'
import { AppStorageService } from '@/app/services/modules/storage/app-storage'
import { StorageService } from '@/app/services/modules/storage/base'
import _path from 'path'
import { extendedMethod } from '@/app/base'
import { splitArrayChunk } from 'web-base-lib'
import { useAPI } from '@/app/services/apis'
import { useConfig } from '@/app/config'
import { useHelper } from '@/app/services/helpers'
import { useStore } from '@/app/services/stores'
import { watch } from '@vue/composition-api'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface ArticleStorageService extends StorageService {
  createArticleTypeDir(input: CreateArticleTypeDirInput, options?: CreateStorageNodeOptions): Promise<StorageNode>
  setArticleSortOrder(orderNodePaths: string[]): Promise<StorageNode[]>
  saveArticleSrcMasterFile(articleDirPath: string, srcContent: string, textContent: string): Promise<SaveArticleSrcMasterFileResult>
  saveArticleSrcDraftFile(articleDirPath: string, srcContent: string): Promise<StorageNode>
  fetchArticleChildren(input: GetArticleChildrenInput, pagination?: StoragePaginationInput): Promise<StoragePaginationResult<StorageNode>>
}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace ArticleStorageService {
  export function newInstance(): ArticleStorageService {
    return newRawInstance()
  }

  export function newRawInstance() {
    //----------------------------------------------------------------------
    //
    //  Variables
    //
    //----------------------------------------------------------------------

    const base = AppStorageService.newRawInstance()

    const config = useConfig()
    const apis = useAPI()
    const stores = useStore()
    const helpers = useHelper()

    watch(
      () => helpers.auth.isSignedIn.value,
      newValue => {
        if (newValue) {
          base.basePath.value = _path.join(config.storage.user.rootName, stores.user.value.id, config.storage.article.rootName)
        } else {
          base.basePath.value = ''
        }
      }
    )

    //----------------------------------------------------------------------
    //
    //  Methods
    //
    //----------------------------------------------------------------------

    base.fetchRoot.value = async () => {
      // 記事ルートがストアに存在しない場合
      if (!base.existsHierarchicalOnStore('')) {
        // 記事ルートをサーバーから読み込み
        await base.fetchHierarchicalNodes('')
      }
      // サーバーから記事ルートを読み込んだ後でも、記事ルートが存在しない場合
      if (!base.existsHierarchicalOnStore('')) {
        // 記事ルートを作成
        const apiNodes = await base.createHierarchicalDirsAPI([base.toFullPath('')])
        base.setAPINodesToStore(apiNodes)
      }

      // アセットディレクトリのパスを取得
      const assetsPath = _path.join(base.basePath.value, config.storage.article.assetsName)
      // アセットディレクトリがストアに存在しない場合
      let assetsNode = stores.storage.get({ path: assetsPath })
      if (!assetsNode) {
        // アセットディレクトリをサーバーから取得し、ストアに格納
        assetsNode = await base.getNodeAPI({ path: assetsPath })
        assetsNode && base.setAPINodeToStore(assetsNode)
      }
      // アセットディレクトリをサーバーから取得した後でも、アセットディレクトリが存在しない場合
      if (!assetsNode) {
        // アセットディレクトリを作成
        assetsNode = await createArticleGeneralDirAPI(assetsPath)
        base.setAPINodeToStore(assetsNode)
      }
    }

    base.removeDir.value = async dirPath => {
      const result = await base.removeDir.super(dirPath)

      // 目次に影響がある更新が発生したことを通知
      helpers.article.emitTableOfContentsUpdate()

      return result
    }

    base.renameDir.value = async (dirPath, newName) => {
      const dirNode = base.sgetNode({ path: dirPath })
      if (dirNode.article?.dir) {
        const apiNode = await renameArticleDirAPI(base.toFullPath(dirPath), newName)
        const dirNode = base.setAPINodeToStore(apiNode)

        // 目次に影響がある更新が発生したことを通知
        helpers.article.emitTableOfContentsUpdate()

        return base.toBasePathNodes([dirNode])
      } else {
        return await base.renameDir.super(dirPath, newName)
      }
    }

    base.setDirShareSettings.value = async (dirPath, input) => {
      const result = await base.setDirShareSettings.super(dirPath, input)

      // 目次に影響がある更新が発生したことを通知
      helpers.article.emitTableOfContentsUpdate()

      return result
    }

    base.createDir.value = async (dirPath, input) => {
      base.validateNotBasePathRoot('dirPath', dirPath)

      // 指定ディレクトリの祖先が読み込まれていない場合、例外をスロー
      // ※祖先が読み込まれていない状態でディレクトリを作成すると、ストアのディレクトリ構造が不整合になるため
      if (!base.existsAncestorDirsOnStore(dirPath)) {
        throw new Error(`One of the ancestor nodes in the path '${base.toFullPath(dirPath)}' does not exist.`)
      }

      // APIで指定ディレクトリを作成
      const apiNode = await createArticleGeneralDirAPI(base.toFullPath(dirPath))
      const dirNode = base.setAPINodeToStore(apiNode)

      return base.toBasePathNode(dirNode)!
    }

    const createArticleTypeDir: ArticleStorageService['createArticleTypeDir'] = async (input, options) => {
      const parentPath = input.dir

      // 指定ディレクトリの祖先が読み込まれていない場合、例外をスロー
      // ※祖先が読み込まれていない状態でディレクトリを作成すると、ストアのディレクトリ構造が不整合になるため
      if (!base.existsHierarchicalOnStore(parentPath)) {
        throw new Error(`One of the nodes in the path '${base.toFullPath(parentPath)}' does not exist.`)
      }

      // 指定された記事系ディレクトリをAPIで作成
      const apiNode = await createArticleTypeDirAPI(
        {
          ...input,
          dir: base.toFullPath(parentPath),
        },
        options
      )
      // 作成されたディレクトリをストアに反映
      const dirNode = base.setAPINodeToStore(apiNode)

      // 記事作成時は記事ファイルも作成されるので読み込みを行う
      if (apiNode.article?.dir?.type === 'Article') {
        await base.fetchChildren({ path: base.toBasePath(apiNode.path) })
      }

      // 目次に影響がある更新が発生したことを通知
      helpers.article.emitTableOfContentsUpdate()

      return base.toBasePathNode(dirNode)!
    }

    const setArticleSortOrder: ArticleStorageService['setArticleSortOrder'] = async orderNodePaths => {
      // APIでソート順を設定
      const fullOrderNodePaths = orderNodePaths.map(nodePath => base.toFullPath(nodePath))
      await setArticleSortOrderAPI(fullOrderNodePaths)

      // 移動したノードをサーバーから読み込む
      const nodes: StorageNode[] = []
      for (const paths of splitArrayChunk(orderNodePaths, 50)) {
        const _nodes = await base.fetchNodes({ paths })
        nodes.push(..._nodes)
      }

      // 目次に影響がある更新が発生したことを通知
      helpers.article.emitTableOfContentsUpdate()

      return nodes
    }

    const saveArticleSrcMasterFile: ArticleStorageService['saveArticleSrcMasterFile'] = async (articleDirPath, srcContent, textContent) => {
      // APIで記事ソースファイルを保存
      const fullArticleDirPath = base.toFullPath(articleDirPath)
      const apiResult = await saveArticleSrcMasterFileAPI(fullArticleDirPath, srcContent, textContent)

      // APIノードをストアへ反映
      const master = base.setAPINodeToStore(apiResult.master)
      const draft = base.setAPINodeToStore(apiResult.draft)

      return {
        master: base.toBasePathNode(master)!,
        draft: base.toBasePathNode(draft)!,
      }
    }

    const saveArticleSrcDraftFile: ArticleStorageService['saveArticleSrcDraftFile'] = async (articleDirPath, srcContent) => {
      // APIで下書きファイルを保存
      const fullArticleDirPath = base.toFullPath(articleDirPath)
      const apiNode = await saveArticleSrcDraftFileAPI(fullArticleDirPath, srcContent)

      // APIノードをストアへ反映
      const node = base.setAPINodeToStore(apiNode)

      return base.toBasePathNode(node)!
    }

    const fetchArticleChildren: ArticleStorageService['fetchArticleChildren'] = async (input, pagination) => {
      const { dirPath, types } = input
      // APIノードをストアへ反映
      const { nextPageToken, list: apiNodes, isPaginationTimeout } = await getArticleChildrenAPI(
        { dirPath: base.toFullPath(dirPath), types },
        pagination
      )
      // APIノードにないストアノードを削除
      base.removeNotExistsStoreNodes(apiNodes, stores.storage.getChildren({ path: dirPath }))

      const list = base.setAPINodesToStore(apiNodes)
      return { nextPageToken, list, isPaginationTimeout }
    }

    //----------------------------------------------------------------------
    //
    //  Internal methods
    //
    //----------------------------------------------------------------------

    //--------------------------------------------------
    //  API
    //--------------------------------------------------

    const createArticleTypeDirAPI = extendedMethod(async (input: CreateArticleTypeDirInput, options?: CreateStorageNodeOptions) => {
      const apiNode = await apis.createArticleTypeDir(input, options)
      return base.apiNodeToStorageNode(apiNode)!
    })

    const createArticleGeneralDirAPI = extendedMethod(async (dirPath: string) => {
      const apiNode = await apis.createArticleGeneralDir(dirPath)
      return base.apiNodeToStorageNode(apiNode)!
    })

    const renameArticleDirAPI = extendedMethod(async (nodePath: string, newName: string) => {
      const apiNode = await apis.renameArticleDir(nodePath, newName)
      return base.apiNodeToStorageNode(apiNode)!
    })

    const setArticleSortOrderAPI = extendedMethod(async (orderNodePaths: string[]) => {
      const apiNode = await apis.setArticleSortOrder(orderNodePaths)
    })

    const saveArticleSrcMasterFileAPI = extendedMethod(async (articleDirPath: string, srcContent: string, textContent: string) => {
      const apiNode = await apis.saveArticleSrcMasterFile(articleDirPath, srcContent, textContent)
      return {
        master: base.apiNodeToStorageNode(apiNode.master)!,
        draft: base.apiNodeToStorageNode(apiNode.draft)!,
      } as SaveArticleSrcMasterFileResult
    })

    const saveArticleSrcDraftFileAPI = extendedMethod(async (articleDirPath: string, srcContent: string) => {
      const apiNode = await apis.saveArticleSrcDraftFile(articleDirPath, srcContent)
      return base.apiNodeToStorageNode(apiNode)!
    })

    const getArticleChildrenAPI = extendedMethod(async (input: GetArticleChildrenInput, pagination?: StoragePaginationInput) => {
      const { list, nextPageToken, isPaginationTimeout } = await apis.getArticleChildren(input, pagination)
      return {
        nextPageToken,
        list: base.apiNodesToStorageNodes(list),
        isPaginationTimeout,
      }
    })

    //----------------------------------------------------------------------
    //
    //  Result
    //
    //----------------------------------------------------------------------

    return {
      ...base,
      createArticleTypeDir,
      setArticleSortOrder,
      saveArticleSrcMasterFile,
      saveArticleSrcDraftFile,
      fetchArticleChildren,
      createArticleTypeDirAPI,
      createArticleGeneralDirAPI,
      renameArticleDirAPI,
      setArticleSortOrderAPI,
      saveArticleSrcMasterFileAPI,
      saveArticleSrcDraftFileAPI,
      getArticleChildrenAPI,
    }
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { ArticleStorageService }
