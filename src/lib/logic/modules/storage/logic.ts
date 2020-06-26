import * as path from 'path'
import { Component, Watch } from 'vue-property-decorator'
import { LibAPIContainer, StorageNode, StorageNodeShareSettingsInput, StoragePaginationOptionsInput, StoragePaginationResult, api } from '../../api'
import { StorageDownloader, StorageFileDownloader, StorageFileDownloaderType } from './download'
import { arrayToDict, removeBothEndsSlash, removeEndSlash, removeStartDirChars, splitHierarchicalPaths } from 'web-base-lib'
import { BaseLogic } from '../../base'
import { StorageUploader } from './upload'
import { StorageUrlUploadManager } from './upload-url'
import { config } from '@/lib/config'
import { store } from '../../store'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface StorageLogic {
  readonly baseURL: string

  readonly basePath: string

  readonly nodes: StorageNode[]

  getNode(key: { id?: string; path?: string }): StorageNode | undefined

  getDirDescendants(dirPath: string): StorageNode[]

  getDescendants(dirPath?: string): StorageNode[]

  getDirChildren(dirPath: string): StorageNode[]

  getChildren(dirPath?: string): StorageNode[]

  getHierarchicalNodes(nodePath: string): StorageNode[]

  fetchHierarchicalNodes(nodePath: string): Promise<StorageNode[]>

  fetchAncestorDirs(nodePath: string): Promise<StorageNode[]>

  fetchDirDescendants(dirPath?: string): Promise<StorageNode[]>

  fetchDescendants(dirPath?: string): Promise<StorageNode[]>

  fetchDirChildren(dirPath?: string): Promise<StorageNode[]>

  fetchChildren(dirPath?: string): Promise<StorageNode[]>

  fetchHierarchicalDescendants(dirPath?: string): Promise<StorageNode[]>

  fetchHierarchicalChildren(dirPath?: string): Promise<StorageNode[]>

  createDirs(dirPaths: string[]): Promise<StorageNode[]>

  removeDir(dirPath: string): Promise<void>

  removeFile(filePath: string): Promise<void>

  moveDir(fromDirPath: string, toDirPath: string): Promise<StorageNode[]>

  moveFile(fromFilePath: string, toFilePath: string): Promise<StorageNode>

  renameDir(dirPath: string, newName: string): Promise<StorageNode[]>

  renameFile(filePath: string, newName: string): Promise<StorageNode>

  setDirShareSettings(dirPath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode>

  setFileShareSettings(filePath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode>

  newUploader(owner: Element): StorageUploader

  newDownloader(): StorageDownloader

  newUrlUploader(owner: Element): StorageUploader

  newFileDownloader(type: StorageFileDownloaderType, filePath: string): StorageFileDownloader

  handleUploadedFileAPI(filePath: string): Promise<StorageNode>
}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace StorageLogic {
  /**
   * ノードのパスをフルパスに変換します。
   * @param basePath
   * @param node
   */
  export function toFullPathNode<NODE extends StorageNode | undefined>(basePath: string, node: NODE): NODE {
    if (!node) return node
    return {
      ...node,
      dir: toFullNodePath(basePath, node.dir),
      path: toFullNodePath(basePath, node.path),
    }
  }

  /**
   * ノードのパスをフルパスに変換します。
   * @param basePath
   * @param nodes
   */
  export function toFullPathNodes(basePath: string, nodes: StorageNode[]): StorageNode[] {
    return nodes.map(node => toFullPathNode(basePath, node))
  }

  /**
   * ノードのパスをベースパスを基準に変換します。
   * @param basePath
   * @param node
   */
  export function toBasePathNode<NODE extends StorageNode | undefined>(basePath: string, node: NODE): NODE {
    if (!node) return node
    return {
      ...node,
      dir: toBaseNodePath(basePath, node.dir),
      path: toBaseNodePath(basePath, node.path),
    }
  }

  /**
   * ノードのパスをベースパスを基準に変換します。
   * @param basePath
   * @param nodes
   */
  export function toBasePathNodes(basePath: string, nodes: StorageNode[]): StorageNode[] {
    basePath = removeBothEndsSlash(basePath)
    const result: StorageNode[] = []
    for (const node of nodes) {
      if (node.path.startsWith(`${basePath}/`)) {
        result.push(toBasePathNode(basePath, node))
      }
    }
    return result
  }

  /**
   * ノードパスをフルパスに変換します。
   * @param basePath
   * @param nodePath
   */
  export function toFullNodePath(basePath: string, nodePath?: string): string {
    basePath = removeBothEndsSlash(basePath)
    nodePath = removeBothEndsSlash(nodePath)
    return path.join(basePath, nodePath)
  }

  /**
   * ノードパスをフルパスに変換します。
   * @param basePath
   * @param nodePaths
   */
  export function toFullNodePaths(basePath: string, nodePaths: string[]): string[] {
    return nodePaths.map(nodePath => toFullNodePath(basePath, nodePath))
  }

  /**
   * ノードパスをベースパスを基準に変換します。
   * @param basePath
   * @param nodePath
   */
  export function toBaseNodePath(basePath: string, nodePath?: string): string {
    basePath = removeBothEndsSlash(basePath)
    nodePath = removeBothEndsSlash(nodePath)
    const basePathReg = new RegExp(`^${basePath}`)
    return removeStartDirChars(nodePath.replace(basePathReg, ''))
  }

  /**
   * ノードパスをベースパスを基準に変換します。
   * @param basePath
   * @param nodePaths
   */
  export function toBaseNodePaths(basePath: string, nodePaths: string[]): string[] {
    return nodePaths.map(nodePath => toBaseNodePath(basePath, nodePath))
  }

  /**
   * ノード配列をディレクトリ階層に従ってソートします。
   * @param nodes
   */
  export function sortNodes(nodes: StorageNode[]): StorageNode[] {
    nodes.sort(store.storage.sortFunc)
    return nodes
  }
}

@Component
class AppStorageLogic extends BaseLogic implements StorageLogic {
  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  get baseURL(): string {
    return `${removeEndSlash(config.api.baseURL)}/storage`
  }

  get basePath(): string {
    return ''
  }

  get nodes(): StorageNode[] {
    return store.storage.all
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  getNode(key: { id?: string; path?: string }): StorageNode | undefined {
    return store.storage.get(key)
  }

  getDirDescendants(dirPath: string): StorageNode[] {
    return store.storage.getDirDescendants(dirPath)
  }

  getDescendants(dirPath?: string): StorageNode[] {
    return store.storage.getDescendants(dirPath)
  }

  getDirChildren(dirPath: string): StorageNode[] {
    return store.storage.getDirChildren(dirPath)
  }

  getChildren(dirPath?: string): StorageNode[] {
    return store.storage.getChildren(dirPath)
  }

  getHierarchicalNodes(nodePath: string): StorageNode[] {
    return splitHierarchicalPaths(nodePath).reduce((result, iDirPath) => {
      const iDirNode = store.storage.get({ path: iDirPath })
      iDirNode && result.push(iDirNode)
      return result
    }, [] as StorageNode[])
  }

  async fetchHierarchicalNodes(nodePath: string): Promise<StorageNode[]> {
    // APIノードをストアへ反映
    const apiNodes = await this.getHierarchicalNodesAPI(nodePath)
    const result = this.setAPINodesToStore(apiNodes)

    // APIノードにないストアノードを削除
    const storeNodes = (() => {
      const result: StorageNode[] = []
      for (const ancestorDirPath of splitHierarchicalPaths(nodePath)) {
        const storeNode = this.getNode({ path: ancestorDirPath })
        storeNode && result.push(storeNode)
      }
      return result
    })()
    this.m_removeNotExistsStoreNodes(apiNodes, storeNodes)

    return result
  }

  async fetchAncestorDirs(nodePath: string): Promise<StorageNode[]> {
    // APIノードをストアへ反映
    const apiNodes = await this.getAncestorDirsAPI(nodePath)
    const result = this.setAPINodesToStore(apiNodes)

    // APIノードにないストアノードを削除
    const storeNodes = (() => {
      const result: StorageNode[] = []
      for (const ancestorDirPath of splitHierarchicalPaths(nodePath)) {
        if (ancestorDirPath === nodePath) continue
        const storeNode = this.getNode({ path: ancestorDirPath })
        storeNode && result.push(storeNode)
      }
      return result
    })()
    this.m_removeNotExistsStoreNodes(apiNodes, storeNodes)

    return result
  }

  async fetchDirDescendants(dirPath?: string): Promise<StorageNode[]> {
    // APIノードをストアへ反映
    const apiNodes = await this.getDirDescendantsAPI(dirPath)
    const result = this.setAPINodesToStore(apiNodes)
    // APIノードにないストアノードを削除
    this.m_removeNotExistsStoreNodes(apiNodes, store.storage.getDirDescendants(dirPath))

    return StorageLogic.sortNodes(result)
  }

  async fetchDescendants(dirPath?: string): Promise<StorageNode[]> {
    // APIノードをストアへ反映
    const apiNodes = await this.getDescendantsAPI(dirPath)
    const result = this.setAPINodesToStore(apiNodes)
    // APIノードにないストアノードを削除
    this.m_removeNotExistsStoreNodes(apiNodes, store.storage.getDescendants(dirPath))

    return StorageLogic.sortNodes(result)
  }

  async fetchDirChildren(dirPath?: string): Promise<StorageNode[]> {
    // APIノードをストアへ反映
    const apiNodes = await this.getDirChildrenAPI(dirPath)
    const result = this.setAPINodesToStore(apiNodes)
    // APIノードにないストアノードを削除
    this.m_removeNotExistsStoreNodes(apiNodes, store.storage.getDirChildren(dirPath))

    return StorageLogic.sortNodes(result)
  }

  async fetchChildren(dirPath?: string): Promise<StorageNode[]> {
    // APIノードをストアへ反映
    const apiNodes = await this.getChildrenAPI(dirPath)
    const result = this.setAPINodesToStore(apiNodes)
    // APIノードにないストアノードを削除
    this.m_removeNotExistsStoreNodes(apiNodes, store.storage.getChildren(dirPath))

    return StorageLogic.sortNodes(result)
  }

  async fetchHierarchicalDescendants(dirPath?: string): Promise<StorageNode[]> {
    const result: StorageNode[] = []

    // 引数ディレクトリが指定されなかった場合
    if (!dirPath) {
      result.push(...(await this.fetchDirDescendants(dirPath)))
    }
    // 引数ディレクトリが指定された場合
    else {
      result.push(...(await this.fetchAncestorDirs(dirPath)))
      result.push(...(await this.fetchDirDescendants(dirPath)))
    }

    return StorageLogic.sortNodes(result)
  }

  async fetchHierarchicalChildren(dirPath?: string): Promise<StorageNode[]> {
    const result: StorageNode[] = []

    // 引数ディレクトリが指定されなかった場合
    if (!dirPath) {
      result.push(...(await this.fetchDirChildren(dirPath)))
    }
    // 引数ディレクトリが指定された場合
    else {
      result.push(...(await this.getAncestorDirsAPI(dirPath)))
      result.push(...(await this.fetchDirChildren(dirPath)))
    }

    return StorageLogic.sortNodes(result)
  }

  async createDirs(dirPaths: string[]): Promise<StorageNode[]> {
    const apiNodes = await this.createDirsAPI(dirPaths)
    return store.storage.addList(apiNodes)
  }

  async removeDir(dirPath: string): Promise<void> {
    await this.removeDirAPI(dirPath)
    store.storage.remove({ path: dirPath })
  }

  async removeFile(filePath: string): Promise<void> {
    await this.removeFileAPI(filePath)
    store.storage.remove({ path: filePath })
  }

  async moveDir(fromDirPath: string, toDirPath: string): Promise<StorageNode[]> {
    const apiNodes = await this.moveDirAPI(fromDirPath, toDirPath)
    store.storage.move(fromDirPath, toDirPath)
    return this.setAPINodesToStore(apiNodes)
  }

  async moveFile(fromFilePath: string, toFilePath: string): Promise<StorageNode> {
    const apiNode = await this.moveFileAPI(fromFilePath, toFilePath)
    store.storage.move(fromFilePath, toFilePath)
    return this.setAPINodesToStore([apiNode])[0]
  }

  async renameDir(dirPath: string, newName: string): Promise<StorageNode[]> {
    const apiNodes = await this.renameDirAPI(dirPath, newName)
    store.storage.rename(dirPath, newName)
    return this.setAPINodesToStore(apiNodes)
  }

  async renameFile(filePath: string, newName: string): Promise<StorageNode> {
    const apiNode = await this.renameFileAPI(filePath, newName)
    store.storage.rename(filePath, newName)
    return this.setAPINodesToStore([apiNode])[0]
  }

  async setDirShareSettings(dirPath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode> {
    const apiNode = await this.setDirShareSettingsAPI(dirPath, settings)
    return this.setAPINodesToStore([apiNode])[0]
  }

  async setFileShareSettings(filePath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode> {
    const apiNode = await this.setFileShareSettingsAPI(filePath, settings)
    return this.setAPINodesToStore([apiNode])[0]
  }

  newUploader(owner: Element): StorageUploader {
    return new StorageUploader(this, owner)
  }

  newUrlUploader(owner: Element): StorageUploader {
    return new StorageUrlUploadManager(this, owner)
  }

  newDownloader(): StorageDownloader {
    return new StorageDownloader(this)
  }

  newFileDownloader(type: StorageFileDownloaderType, filePath: string): StorageFileDownloader {
    return StorageFileDownloader.newInstance(this, type, filePath)
  }

  //----------------------------------------------------------------------
  //
  //  Storage internal methods
  //
  //----------------------------------------------------------------------

  setAPINodesToStore(apiNodes: StorageNode[]): StorageNode[] {
    const result: StorageNode[] = []

    for (const apiNode of apiNodes) {
      const storeNode = store.storage.get({ id: apiNode.id, path: apiNode.path })
      if (!storeNode) {
        result.push(store.storage.add(apiNode))
      } else {
        // ストアノードとAPIノードのパスが異なる場合
        // ※ノード移動が行われていた場合
        if (storeNode.path !== apiNode.path) {
          store.storage.move(storeNode.path, apiNode.path)
        }
        result.push(store.storage.set(apiNode))
      }
    }

    return result
  }

  //--------------------------------------------------
  //  API
  //--------------------------------------------------

  getNodeAPI(nodePath: string): Promise<StorageNode | undefined> {
    return api.getStorageNode(nodePath)
  }

  getDirDescendantsAPI(dirPath?: string): Promise<StorageNode[]> {
    return api.callStoragePaginationAPI(api.getStorageDirDescendants, null, dirPath)
  }

  getDescendantsAPI(dirPath?: string): Promise<StorageNode[]> {
    return api.callStoragePaginationAPI(api.getStorageDescendants, null, dirPath)
  }

  getDirChildrenAPI(dirPath?: string): Promise<StorageNode[]> {
    return api.callStoragePaginationAPI(api.getStorageDirChildren, null, dirPath)
  }

  getChildrenAPI(dirPath?: string): Promise<StorageNode[]> {
    return api.callStoragePaginationAPI(api.getStorageChildren, null, dirPath)
  }

  getHierarchicalNodesAPI(nodePath: string): Promise<StorageNode[]> {
    return api.getStorageHierarchicalNodes(nodePath)
  }

  getAncestorDirsAPI(nodePath: string): Promise<StorageNode[]> {
    return api.getStorageAncestorDirs(nodePath)
  }

  createDirsAPI(dirPaths: string[]): Promise<StorageNode[]> {
    return api.createStorageDirs(dirPaths)
  }

  removeDirAPI(dirPath: string): Promise<StorageNode[]> {
    return api.callStoragePaginationAPI(api.removeStorageDir, null, dirPath)
  }

  removeFileAPI(filePath: string): Promise<StorageNode | undefined> {
    return api.removeStorageFile(filePath)
  }

  moveDirAPI(fromDirPath: string, toDirPath: string): Promise<StorageNode[]> {
    return api.callStoragePaginationAPI(api.moveStorageDir, null, fromDirPath, toDirPath)
  }

  moveFileAPI(fromFilePath: string, toFilePath: string): Promise<StorageNode> {
    return api.moveStorageFile(fromFilePath, toFilePath)
  }

  renameDirAPI(dirPath: string, newName: string): Promise<StorageNode[]> {
    return api.callStoragePaginationAPI(api.renameStorageDir, null, dirPath, newName)
  }

  renameFileAPI(filePath: string, newName: string): Promise<StorageNode> {
    return api.renameStorageFile(filePath, newName)
  }

  setDirShareSettingsAPI(dirPath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode> {
    return api.setStorageDirShareSettings(dirPath, settings)
  }

  handleUploadedFileAPI(filePath: string): Promise<StorageNode> {
    return api.handleUploadedFile(filePath)
  }

  setFileShareSettingsAPI(filePath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode> {
    return api.setStorageFileShareSettings(filePath, settings)
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  /**
   * ページングが必要なノード検索APIをページングがなくなるまで実行し結果を取得します。
   * 注意: ノード検索API関数の第一引数は検索オプション（StoragePaginationOptionsInput）であることを前提とします。
   *
   * @param api ノード検索API関数のオーナーであるAPIを指定
   * @param func ノード検索API関数を指定
   * @param params ノード検索APIに渡す引数を指定
   */
  // eslint-disable-next-line space-before-function-paren
  protected async getPaginationNodesAPI<FUNC extends (...args: any[]) => Promise<StoragePaginationResult>>(
    api: LibAPIContainer,
    func: FUNC,
    ...params: Parameters<FUNC>
  ): Promise<StorageNode[]> {
    const nodeDict: { [path: string]: StorageNode } = {}

    // ノード検索APIの検索オプションを取得
    // ※ノード検索APIの第一引数は検索オプションという前提
    const options: StoragePaginationOptionsInput = Object.assign({ maxChunk: undefined, pageToken: undefined }, params[0])
    params[0] = options

    // ノード検索APIの実行
    // ※ページングがなくなるまで実行
    let nodeData = await func.call(api, ...params)
    Object.assign(nodeDict, arrayToDict(nodeData.list, 'path'))
    while (nodeData.nextPageToken) {
      options.pageToken = nodeData.nextPageToken
      nodeData = await func.call(api, ...params)
      Object.assign(nodeDict, arrayToDict(nodeData.list, 'path'))
    }

    return StorageLogic.sortNodes(Object.values(nodeDict))
  }

  /**
   * APIノードにないストアノードを削除します。
   * @param apiNodes
   * @param storeNodes
   */
  private m_removeNotExistsStoreNodes(apiNodes: StorageNode[], storeNodes: StorageNode[]): StorageNode[] {
    const apiNodeIdDict = arrayToDict(apiNodes, 'id')
    const apiNodePathDict = arrayToDict(apiNodes, 'path')

    const removingNodes: string[] = []
    for (const storeNode of storeNodes) {
      const exists = Boolean(apiNodeIdDict[storeNode.id] || apiNodePathDict[storeNode.path])
      !exists && removingNodes.push(storeNode.path)
    }

    return store.storage.removeList({ paths: removingNodes })
  }

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------

  @Watch('isSignedIn')
  private async m_isSignedInOnChange(newValue: boolean, oldValue: boolean) {
    if (!this.isSignedIn) {
      store.storage.clear()
    }
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { StorageLogic, AppStorageLogic }
