import {
  CreateArticleTypeDirInput,
  LogicDependency,
  SetArticleSortOrderInput,
  StorageArticleNodeType,
  StorageNode,
  StoragePaginationInput,
  StoragePaginationResult,
} from '@/app/logic/base'
import { AppStorageLogic } from '@/app/logic/modules/storage/app-storage'
import { StorageLogic } from '@/app/logic/modules/storage/base'
import _path from 'path'
import { extendedMethod } from '@/app/base'
import { useConfig } from '@/app/config'
import { watch } from '@vue/composition-api'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface ArticleStorageLogic extends StorageLogic {
  createArticleTypeDir(input: CreateArticleTypeDirInput): Promise<StorageNode>
  setArticleSortOrder(nodePath: string, input: SetArticleSortOrderInput): Promise<StorageNode>
  fetchArticleChildren(
    dirPath: string,
    articleTypes: StorageArticleNodeType[],
    input?: StoragePaginationInput
  ): Promise<StoragePaginationResult<StorageNode>>
}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace ArticleStorageLogic {
  export function newInstance(dependency: LogicDependency): ArticleStorageLogic {
    return newRawInstance(dependency)
  }

  export function newRawInstance(dependency: LogicDependency) {
    //----------------------------------------------------------------------
    //
    //  Variables
    //
    //----------------------------------------------------------------------

    const base = AppStorageLogic.newRawInstance(dependency)

    const config = useConfig()
    const { api, store, internal } = dependency

    watch(
      () => internal.auth.isSignedIn.value,
      isSignedIn => {
        if (isSignedIn) {
          base.basePath.value = _path.join(config.storage.user.rootName, store.user.value.id, config.storage.article.rootName)
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
      if (!base.existsHierarchicalOnStore()) {
        // 記事ルートをサーバーから読み込み
        await base.fetchHierarchicalNodes()
      }
      // サーバーから記事ルートを読み込んだ後でも、記事ルートが存在しない場合
      if (!base.existsHierarchicalOnStore()) {
        // 記事ルートを作成
        await base.createHierarchicalDirs([''])
      }

      // アセットディレクトリのパスを取得
      const assetsPath = _path.join(base.basePath.value, config.storage.article.assetsName)
      // アセットディレクトリがストアに存在しない場合
      let assetsNode = store.storage.get({ path: assetsPath })
      if (!assetsNode) {
        // アセットディレクトリをサーバーから取得し、ストアに格納
        assetsNode = await base.getNodeAPI({ path: assetsPath })
        assetsNode && base.setAPINodesToStore([assetsNode])
      }
      // アセットディレクトリをサーバーから取得した後でも、アセットディレクトリが存在しない場合
      if (!assetsNode) {
        // アセットディレクトリを作成
        assetsNode = await createArticleGeneralDirAPI(assetsPath)
        base.setAPINodesToStore([assetsNode])
      }
    }

    base.renameDir.value = async (dirPath, newName) => {
      const dirNode = base.sgetNode({ path: dirPath })
      if (dirNode.articleNodeType) {
        const apiNode = await renameArticleNodeAPI(base.toFullPath(dirPath), newName)
        const dirNode = base.setAPINodesToStore([apiNode])[0]
        return base.toBasePathNode([dirNode])
      } else {
        return await base.renameDir.super(dirPath, newName)
      }
    }

    base.createDir.value = async (dirPath, input) => {
      // 指定ディレクトリの祖先が読み込まれていない場合、例外をスロー
      // ※祖先が読み込まれていない状態でディレクトリを作成すると、ストアのディレクトリ構造が不整合になるため
      if (!base.existsAncestorDirsOnStore(dirPath)) {
        throw new Error(`One of the ancestor nodes in the path '${base.toFullPath(dirPath)}' does not exist.`)
      }

      // APIで指定ディレクトリを作成
      const apiNode = await createArticleGeneralDirAPI(base.toFullPath(dirPath))
      const dirNode = base.setAPINodesToStore([apiNode])[0]

      return base.toBasePathNode(dirNode)
    }

    const createArticleTypeDir: ArticleStorageLogic['createArticleTypeDir'] = async input => {
      const parentPath = input.dir

      // 指定ディレクトリの祖先が読み込まれていない場合、例外をスロー
      // ※祖先が読み込まれていない状態でディレクトリを作成すると、ストアのディレクトリ構造が不整合になるため
      if (!base.existsHierarchicalOnStore(parentPath)) {
        throw new Error(`One of the nodes in the path '${base.toFullPath(parentPath)}' does not exist.`)
      }

      // 指定された記事系ディレクトリをAPIで作成
      const apiNode = await createArticleTypeDirAPI({
        ...input,
        dir: base.toFullPath(parentPath),
      })
      // 作成されたディレクトリをストアに反映
      const dirNode = base.setAPINodesToStore([apiNode])[0]

      // 記事作成時は記事ファイルも作成されるので読み込みを行う
      if (apiNode.articleNodeType === StorageArticleNodeType.Article) {
        await base.fetchChildren(base.toBasePath(apiNode.path))
      }

      return base.toBasePathNode(dirNode)
    }

    const setArticleSortOrder: ArticleStorageLogic['setArticleSortOrder'] = async (nodePath, input) => {
      // APIでソート順を設定
      const fullNodePath = base.toFullPath(nodePath)
      const fullInput: SetArticleSortOrderInput = {}
      if (input.insertBeforeNodePath) {
        fullInput.insertBeforeNodePath = base.toFullPath(input.insertBeforeNodePath)
      } else if (input.insertAfterNodePath) {
        fullInput.insertAfterNodePath = base.toFullPath(input.insertAfterNodePath)
      }
      const node = await setArticleSortOrderAPI(fullNodePath, fullInput)

      // API結果をストアに反映
      base.setAPINodesToStore([node])

      return base.toBasePathNode(node)
    }

    const fetchArticleChildren: ArticleStorageLogic['fetchArticleChildren'] = async (dirPath, articleTypes, input) => {
      // APIノードをストアへ反映
      const { nextPageToken, list: apiNodes } = await getArticleChildrenAPI(base.toFullPath(dirPath), articleTypes, input)
      // APIノードにないストアノードを削除
      base.removeNotExistsStoreNodes(apiNodes, store.storage.getChildren(dirPath))

      const list = base.setAPINodesToStore(apiNodes)
      return { nextPageToken, list }
    }

    //----------------------------------------------------------------------
    //
    //  Internal methods
    //
    //----------------------------------------------------------------------

    //--------------------------------------------------
    //  API
    //--------------------------------------------------

    const createArticleTypeDirAPI = extendedMethod(async (input: CreateArticleTypeDirInput) => {
      const apiNode = await api.createArticleTypeDir(input)
      return base.apiNodeToStorageNode(apiNode)!
    })

    const createArticleGeneralDirAPI = extendedMethod(async (dirPath: string) => {
      const apiNode = await api.createArticleGeneralDir(dirPath)
      return base.apiNodeToStorageNode(apiNode)!
    })

    const renameArticleNodeAPI = extendedMethod(async (nodePath: string, newName: string) => {
      const apiNode = await api.renameArticleNode(nodePath, newName)
      return base.apiNodeToStorageNode(apiNode)!
    })

    const setArticleSortOrderAPI = extendedMethod(async (nodePath: string, input: SetArticleSortOrderInput) => {
      const apiNode = await api.setArticleSortOrder(nodePath, input)
      return base.apiNodeToStorageNode(apiNode)!
    })

    const getArticleChildrenAPI = extendedMethod(async (dirPath: string, articleTypes: StorageArticleNodeType[], input?: StoragePaginationInput) => {
      const apiPagination = await api.getArticleChildren(dirPath, articleTypes, input)
      return {
        nextPageToken: apiPagination.nextPageToken,
        list: base.apiNodesToStorageNodes(apiPagination.list),
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
      fetchArticleChildren,
      createArticleTypeDirAPI,
      createArticleGeneralDirAPI,
      renameArticleNodeAPI,
      setArticleSortOrderAPI,
      getArticleChildrenAPI,
    }
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { ArticleStorageLogic }
