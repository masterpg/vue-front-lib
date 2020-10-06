import * as path from 'path'
import {
  CreateArticleTypeDirInput,
  CreateStorageNodeInput,
  SetArticleSortOrderInput,
  StorageArticleNodeType,
  StorageNode,
  StoragePaginationInput,
  StoragePaginationResult,
} from '@/example/logic/types'
import { Component } from 'vue-property-decorator'
import { StorageLogic } from '@/example/logic/modules/storage/logic/base'
import { SubStorageLogic } from '@/example/logic/modules/storage/logic/sub'
import { api } from '@/example/logic/api'
import { config } from '@/example/config'
import { store } from '@/example/logic/store'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface ArticleStorageLogic extends StorageLogic {
  createArticleTypeDir(input: CreateArticleTypeDirInput): Promise<StorageNode>
  setArticleSortOrder(nodePath: string, input: SetArticleSortOrderInput): Promise<StorageNode>
}

//========================================================================
//
//  Implementation
//
//========================================================================

@Component
class ArticleStorageLogicImpl extends SubStorageLogic implements ArticleStorageLogic {
  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  get basePath(): string {
    if (!this.isSignedIn) return ''
    return path.join(config.storage.user.rootName, store.user.id, config.storage.article.rootName)
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  /**
   * 記事ルートを構成するノードをサーバーから読み込み、ストアに格納します。
   * もし記事ルートを構成するノードが一部でも存在しなかった場合、作成を行います。
   */
  async fetchRoot(): Promise<void> {
    this.appStorage.validateSignedIn()

    // 記事ルートがストアに存在しない場合
    if (!this.appStorage.existsHierarchicalOnStore(this.basePath)) {
      // 記事ルートをサーバーから読み込み
      await this.appStorage.fetchHierarchicalNodes(this.basePath)
    }
    // サーバーから記事ルートを読み込んだ後でも、記事ルートが存在しない場合
    if (!this.appStorage.existsHierarchicalOnStore(this.basePath)) {
      // 記事ルートを作成
      await this.appStorage.createHierarchicalDirs([this.basePath])
    }

    // アセットディレクトリのパスを取得
    const assetsPath = path.join(this.basePath, config.storage.article.assetsName)
    // アセットディレクトリがストアに存在しない場合
    let assetsNode = store.storage.get({ path: assetsPath })
    if (!assetsNode) {
      // アセットディレクトリをサーバーから読み込み
      assetsNode = await this.appStorage.getNodeAPI({ path: assetsPath })
      assetsNode && this.appStorage.setAPINodesToStore([assetsNode])
    }
    // サーバーからアセットディレクトリを読み込んだ後でも、アセットディレクトリが存在しない場合
    if (!assetsNode) {
      // アセットディレクトリを作成
      assetsNode = await this.m_createArticleGeneralDirAPI(assetsPath)
      this.appStorage.setAPINodesToStore([assetsNode])
    }
  }

  async renameDir(dirPath: string, newName: string): Promise<StorageNode[]> {
    this.appStorage.validateSignedIn()

    dirPath = StorageLogic.toFullNodePath(this.basePath, dirPath)
    const dirNode = this.appStorage.sgetNode({ path: dirPath })
    if (dirNode.articleNodeType) {
      const apiNode = await this.m_renameArticleNodeAPI(dirPath, newName)
      const dirNode = this.appStorage.setAPINodesToStore([apiNode])[0]
      return StorageLogic.toBasePathNodes(this.basePath, [dirNode])
    } else {
      return StorageLogic.toBasePathNodes(this.basePath, await this.appStorage.renameDir(dirPath, newName))
    }
  }

  async renameFile(filePath: string, newName: string): Promise<StorageNode> {
    this.appStorage.validateSignedIn()

    filePath = StorageLogic.toFullNodePath(this.basePath, filePath)
    const dirNode = this.appStorage.sgetNode({ path: filePath })
    if (dirNode.articleNodeType) {
      const apiNode = await this.m_renameArticleNodeAPI(filePath, newName)
      const fileNode = this.appStorage.setAPINodesToStore([apiNode])[0]
      return StorageLogic.toBasePathNode(this.basePath, fileNode)
    } else {
      return StorageLogic.toBasePathNode(this.basePath, await this.appStorage.renameFile(filePath, newName))
    }
  }

  async createDir(dirPath: string, input?: CreateStorageNodeInput): Promise<StorageNode> {
    this.appStorage.validateSignedIn()
    dirPath = StorageLogic.toFullNodePath(this.basePath, dirPath)

    // 指定ディレクトリの祖先が読み込まれていない場合、例外をスロー
    // ※祖先が読み込まれていない状態でディレクトリを作成すると、ストアのディレクトリ構造が不整合になるため
    if (!this.appStorage.existsAncestorDirsOnStore(dirPath)) {
      throw new Error(`One of the ancestor nodes in the path '${dirPath}' does not exist.`)
    }

    // APIで指定ディレクトリを作成
    const apiNode = await this.m_createArticleGeneralDirAPI(dirPath)
    const dirNode = this.appStorage.setAPINodesToStore([apiNode])[0]

    return StorageLogic.toBasePathNode(this.basePath, dirNode)
  }

  async createArticleTypeDir(input: CreateArticleTypeDirInput): Promise<StorageNode> {
    this.appStorage.validateSignedIn()

    const parentPath = StorageLogic.toFullNodePath(this.basePath, input.dir)

    // 指定ディレクトリの祖先が読み込まれていない場合、例外をスロー
    // ※祖先が読み込まれていない状態でディレクトリを作成すると、ストアのディレクトリ構造が不整合になるため
    if (!this.appStorage.existsHierarchicalOnStore(parentPath)) {
      throw new Error(`One of the nodes in the path '${parentPath}' does not exist.`)
    }

    // 指定された記事系ディレクトリをAPIで作成
    const apiNode = await this.m_createArticleTypeDirAPI({
      ...input,
      dir: parentPath,
    })
    // 作成されたディレクトリをストアに反映
    const dirNode = this.appStorage.setAPINodesToStore([apiNode])[0]

    // 記事作成時は記事ファイルも作成されるので読み込みを行う
    if (apiNode.articleNodeType === StorageArticleNodeType.Article) {
      await this.appStorage.fetchChildren(apiNode.path)
    }

    return StorageLogic.toBasePathNode(this.basePath, dirNode)
  }

  async setArticleSortOrder(nodePath: string, input: SetArticleSortOrderInput): Promise<StorageNode> {
    // APIでソート順を設定
    const fullNodePath = StorageLogic.toFullNodePath(this.basePath, nodePath)
    const fullInput: SetArticleSortOrderInput = {}
    if (input.insertBeforeNodePath) {
      fullInput.insertBeforeNodePath = StorageLogic.toFullNodePath(this.basePath, input.insertBeforeNodePath)
    } else if (input.insertAfterNodePath) {
      fullInput.insertAfterNodePath = StorageLogic.toFullNodePath(this.basePath, input.insertAfterNodePath)
    }
    const node = await this.m_setArticleSortOrderAPI(fullNodePath, fullInput)

    // API結果をストアに反映
    this.appStorage.setAPINodesToStore([node])

    return StorageLogic.toBasePathNode(this.basePath, node)
  }

  async fetchArticleChildren(
    dirPath: string,
    articleTypes: StorageArticleNodeType[],
    input?: StoragePaginationInput
  ): Promise<StoragePaginationResult<StorageNode>> {
    // APIノードをストアへ反映
    const { nextPageToken, list: apiNodes } = await this.m_getArticleChildrenAPI(dirPath, articleTypes, input)
    const list = this.appStorage.setAPINodesToStore(apiNodes)
    // APIノードにないストアノードを削除
    this.appStorage.removeNotExistsStoreNodes(list, store.storage.getChildren(dirPath))

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

  protected async m_createArticleTypeDirAPI(input: CreateArticleTypeDirInput): Promise<StorageNode> {
    const apiNode = await api.createArticleTypeDir(input)
    return this.appStorage.apiNodeToStorageNode(apiNode)!
  }

  protected async m_createArticleGeneralDirAPI(dirPath: string): Promise<StorageNode> {
    const apiNode = await api.createArticleGeneralDir(dirPath)
    return this.appStorage.apiNodeToStorageNode(apiNode)!
  }

  protected async m_renameArticleNodeAPI(nodePath: string, newName: string): Promise<StorageNode> {
    const apiNode = await api.renameArticleNode(nodePath, newName)
    return this.appStorage.apiNodeToStorageNode(apiNode)!
  }

  protected async m_setArticleSortOrderAPI(nodePath: string, input: SetArticleSortOrderInput): Promise<StorageNode> {
    const apiNode = await api.setArticleSortOrder(nodePath, input)
    return this.appStorage.apiNodeToStorageNode(apiNode)!
  }

  protected async m_getArticleChildrenAPI(
    dirPath: string,
    articleTypes: StorageArticleNodeType[],
    input?: StoragePaginationInput
  ): Promise<StoragePaginationResult<StorageNode>> {
    const apiPagination = await api.getArticleChildren(dirPath, articleTypes, input)
    return {
      nextPageToken: apiPagination.nextPageToken,
      list: this.appStorage.apiNodesToStorageNodes(apiPagination.list),
    }
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { ArticleStorageLogic, ArticleStorageLogicImpl }
