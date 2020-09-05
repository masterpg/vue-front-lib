import * as path from 'path'
import {
  CreateArticleRootUnderDirInput,
  SetArticleSortOrderInput,
  StorageArticleNodeType,
  StorageNode,
  StoragePaginationInput,
  StoragePaginationResult,
} from '../../../types'
import { Component } from 'vue-property-decorator'
import { StorageLogic } from './base'
import { SubStorageLogic } from './sub'
import { api } from '../../../api'
import { config } from '@/lib/config'
import { splitHierarchicalPaths } from 'web-base-lib'
import { store } from '../../../store'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface ArticleStorageLogic extends StorageLogic {
  fetchArticleRoot(): Promise<void>
  createArticleRootUnderDir(dirPath: string, input?: CreateArticleRootUnderDirInput): Promise<StorageNode>
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
  async fetchArticleRoot(): Promise<void> {
    this.m_validateSignedIn()

    // 記事ルートがストアに存在しない場合
    if (!this.m_existsHierarchicalOnStore(this.basePath)) {
      // 記事ルートをサーバーから読み込み
      await this.appStorage.fetchHierarchicalNodes(this.basePath)
    }
    // 記事ルートがストアに存在しない場合
    if (!this.m_existsHierarchicalOnStore(this.basePath)) {
      // 記事ルートを作成
      await this.appStorage.createHierarchicalDirs([this.basePath])
    }

    // アセットディレクトリを作成
    const assetsPath = path.join(this.basePath, config.storage.article.assetsName)
    let assetsNode = await this.appStorage.getNodeAPI({ path: assetsPath })
    if (!assetsNode) {
      assetsNode = await this.appStorage.createDir(assetsPath)
    }
    this.appStorage.setAPINodesToStore([assetsNode])
  }

  async createArticleRootUnderDir(dirPath: string, input?: CreateArticleRootUnderDirInput): Promise<StorageNode> {
    this.m_validateSignedIn()

    // 記事ルートを読み込み
    await this.fetchArticleRoot()
    // 指定ディレクトリの祖先を読み込み
    await this.m_fetchAncestors(dirPath)
    // 指定ディレクトリの祖先が存在しない場合、例外をスロー
    if (!this.m_existsAncestorsOnStore(dirPath)) {
      throw new Error(`The ancestor of the specified directory '${dirPath}' does not exist.`)
    }

    // APIで指定ディレクトリを作成
    const fullDirPath = StorageLogic.toFullNodePath(this.basePath, dirPath)
    const dirNode = await this.m_createArticleRootUnderDirAPI(fullDirPath, input)

    // 記事作成時は記事ファイルも作成されるので読み込みを行う
    let dirChildren: StorageNode[] = []
    if (input && input.articleNodeType === StorageArticleNodeType.Article) {
      dirChildren = await this.appStorage.fetchChildren(fullDirPath)
    }

    // 作成されたディレクトリをストアに反映
    this.appStorage.setAPINodesToStore([dirNode, ...dirChildren])

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

  /**
   * ユーザーがサインインしているか検証します。
   */
  private m_validateSignedIn(): void {
    if (!this.isSignedIn) {
      throw new Error(`The application is not yet signed in.`)
    }
  }

  /**
   * 指定パスの祖先を構成するノードをサーバーから読み込み、ストアに格納します。
   * @param targetPath
   */
  private async m_fetchAncestors(targetPath: string): Promise<void> {
    // 対象ノードの祖先がストアに存在しない場合
    if (!this.m_existsAncestorsOnStore(targetPath)) {
      // 対象ノードの祖先をサーバーから読み込み
      await this.appStorage.fetchAncestorDirs(targetPath)
    }
  }

  /**
   * 指定パスを含め階層を構成するノードがストアに存在しているかを走査します。
   * @param targetPath
   */
  private m_existsHierarchicalOnStore(targetPath: string): boolean {
    const nodePaths = splitHierarchicalPaths(targetPath)
    for (const nodePath of nodePaths) {
      const node = store.storage.get({ path: nodePath })
      if (!node) return false
    }
    return true
  }

  /**
   * 指定パスの祖先を構成するノードがストアに存在するかを走査します。
   * @param targetPath
   */
  private async m_existsAncestorsOnStore(targetPath: string): Promise<boolean> {
    const dirPaths = splitHierarchicalPaths(targetPath).filter(dirPath => dirPath !== targetPath)
    for (const iDirPath of dirPaths) {
      const iDirNode = store.storage.get({ path: iDirPath })
      if (!iDirNode) return true
    }
    return false
  }

  //--------------------------------------------------
  //  API
  //--------------------------------------------------

  private async m_createArticleRootUnderDirAPI(dirPath: string, input?: CreateArticleRootUnderDirInput): Promise<StorageNode> {
    const apiNode = await api.createArticleRootUnderDir(dirPath, input)
    return this.appStorage.apiNodeToStorageNode(apiNode)!
  }

  private async m_setArticleSortOrderAPI(nodePath: string, input: SetArticleSortOrderInput): Promise<StorageNode> {
    const apiNode = await api.setArticleSortOrder(nodePath, input)
    return this.appStorage.apiNodeToStorageNode(apiNode)!
  }

  private async m_getArticleChildrenAPI(
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
