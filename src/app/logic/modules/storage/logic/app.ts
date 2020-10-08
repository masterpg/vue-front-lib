import { APIStorageNode, AppAPIContainer, api } from '@/app/logic/api'
import { BaseLogic, getStorageNodeURL } from '@/app/logic/base'
import { Component, Watch } from 'vue-property-decorator'
import {
  CreateStorageNodeInput,
  RequiredStorageNodeShareSettings,
  StorageNode,
  StorageNodeKeyInput,
  StorageNodeShareSettingsInput,
  StoragePaginationInput,
  StoragePaginationResult,
} from '@/app/logic/types'
import { StorageDownloader, StorageFileDownloader, StorageFileDownloaderType } from '@/app/logic/modules/storage/download'
import { arrayToDict, splitHierarchicalPaths } from 'web-base-lib'
import { StorageLogic } from '@/app/logic/modules/storage/logic/base'
import { StorageUploader } from '@/app/logic/modules/storage/upload'
import { StorageUrlUploadManager } from '@/app/logic/modules/storage/upload-url'
import { store } from '@/app/logic/store'

//========================================================================
//
//  Implementation
//
//========================================================================

@Component
class AppStorageLogic extends BaseLogic implements StorageLogic {
  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

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

  sgetNode(key: { id?: string; path?: string }): StorageNode {
    const node = store.storage.get(key)
    if (!node) {
      const nodeKey = key.id ? JSON.stringify({ id: key.id }) : JSON.stringify({ path: key.path })
      throw new Error(`Storage store does not have specified node: ${nodeKey}`)
    }
    return node
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

  getInheritedShare(nodePath: string): RequiredStorageNodeShareSettings {
    const result: RequiredStorageNodeShareSettings = { isPublic: false, readUIds: [], writeUIds: [] }
    const hierarchicalNodes = this.getHierarchicalNodes(nodePath)

    for (let i = hierarchicalNodes.length - 1; i >= 0; i--) {
      const node = hierarchicalNodes[i]
      if (typeof node.share.isPublic === 'boolean') {
        result.isPublic = node.share.isPublic
        break
      }
    }

    for (let i = hierarchicalNodes.length - 1; i >= 0; i--) {
      const node = hierarchicalNodes[i]
      if (node.share.readUIds) {
        result.readUIds.push(...node.share.readUIds)
        break
      }
    }

    for (let i = hierarchicalNodes.length - 1; i >= 0; i--) {
      const node = hierarchicalNodes[i]
      if (node.share.writeUIds) {
        result.writeUIds.push(...node.share.writeUIds)
        break
      }
    }

    return result
  }

  async fetchRoot(): Promise<void> {
    // アプリケーションストレージの場合、特にすることはない
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
    this.removeNotExistsStoreNodes(apiNodes, storeNodes)

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
    this.removeNotExistsStoreNodes(apiNodes, storeNodes)

    return result
  }

  async fetchDirDescendants(dirPath?: string): Promise<StorageNode[]> {
    // APIノードをストアへ反映
    const apiNodes = await this.getDirDescendantsAPI(dirPath)
    const result = this.setAPINodesToStore(apiNodes)
    // APIノードにないストアノードを削除
    this.removeNotExistsStoreNodes(apiNodes, store.storage.getDirDescendants(dirPath))

    return result
  }

  async fetchDescendants(dirPath?: string): Promise<StorageNode[]> {
    // APIノードをストアへ反映
    const apiNodes = await this.getDescendantsAPI(dirPath)
    const result = this.setAPINodesToStore(apiNodes)
    // APIノードにないストアノードを削除
    this.removeNotExistsStoreNodes(apiNodes, store.storage.getDescendants(dirPath))

    return result
  }

  async fetchDirChildren(dirPath?: string): Promise<StorageNode[]> {
    // APIノードをストアへ反映
    const apiNodes = await this.getDirChildrenAPI(dirPath)
    const result = this.setAPINodesToStore(apiNodes)
    // APIノードにないストアノードを削除
    this.removeNotExistsStoreNodes(apiNodes, store.storage.getDirChildren(dirPath))

    return result
  }

  async fetchChildren(dirPath?: string): Promise<StorageNode[]> {
    // APIノードをストアへ反映
    const apiNodes = await this.getChildrenAPI(dirPath)
    const result = this.setAPINodesToStore(apiNodes)
    // APIノードにないストアノードを削除
    this.removeNotExistsStoreNodes(apiNodes, store.storage.getChildren(dirPath))

    return result
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

    return result
  }

  async fetchHierarchicalChildren(dirPath?: string): Promise<StorageNode[]> {
    const result: StorageNode[] = []

    // 引数ディレクトリが指定されなかった場合
    if (!dirPath) {
      result.push(...(await this.fetchDirChildren(dirPath)))
    }
    // 引数ディレクトリが指定された場合
    else {
      result.push(...(await this.fetchAncestorDirs(dirPath)))
      result.push(...(await this.fetchDirChildren(dirPath)))
    }

    return result
  }

  async createDir(dirPath: string, input?: CreateStorageNodeInput): Promise<StorageNode> {
    // 指定ディレクトリの祖先が読み込まれていない場合、例外をスロー
    // ※祖先が読み込まれていない状態でディレクトリを作成すると、ストアのディレクトリ構造が不整合になるため
    if (!this.existsAncestorDirsOnStore(dirPath)) {
      throw new Error(`One of the ancestor nodes in the path '${dirPath}' does not exist.`)
    }

    const apiNode = await this.createDirAPI(dirPath, input)
    return this.setAPINodesToStore([apiNode])[0]
  }

  async createHierarchicalDirs(dirPaths: string[]): Promise<StorageNode[]> {
    const apiNodes = await this.createHierarchicalDirsAPI(dirPaths)
    return this.setAPINodesToStore(apiNodes)
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

  async setDirShareSettings(dirPath: string, input: StorageNodeShareSettingsInput): Promise<StorageNode> {
    const apiNode = await this.setDirShareSettingsAPI(dirPath, input)
    return this.setAPINodesToStore([apiNode])[0]
  }

  async setFileShareSettings(filePath: string, input: StorageNodeShareSettingsInput): Promise<StorageNode> {
    const apiNode = await this.setFileShareSettingsAPI(filePath, input)
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
  //  Internal storage methods
  //
  //----------------------------------------------------------------------

  //--------------------------------------------------
  //  API
  //--------------------------------------------------

  async getNodeAPI(input: StorageNodeKeyInput): Promise<StorageNode | undefined> {
    const apiNode = await this.apiNodeToStorageNode(await api.getStorageNode(input))
    return this.apiNodeToStorageNode(apiNode)
  }

  async getDirDescendantsAPI(dirPath?: string): Promise<StorageNode[]> {
    const apiNodes = await api.callStoragePaginationAPI(api.getStorageDirDescendants, dirPath)
    return this.apiNodesToStorageNodes(apiNodes)
  }

  async getDescendantsAPI(dirPath?: string): Promise<StorageNode[]> {
    const apiNodes = await api.callStoragePaginationAPI(api.getStorageDescendants, dirPath)
    return this.apiNodesToStorageNodes(apiNodes)
  }

  async getDirChildrenAPI(dirPath?: string): Promise<StorageNode[]> {
    const apiNodes = await api.callStoragePaginationAPI(api.getStorageDirChildren, dirPath)
    return this.apiNodesToStorageNodes(apiNodes)
  }

  async getChildrenAPI(dirPath?: string): Promise<StorageNode[]> {
    const apiNodes = await api.callStoragePaginationAPI(api.getStorageChildren, dirPath)
    return this.apiNodesToStorageNodes(apiNodes)
  }

  async getHierarchicalNodesAPI(nodePath: string): Promise<StorageNode[]> {
    const apiNodes = await api.getStorageHierarchicalNodes(nodePath)
    return this.apiNodesToStorageNodes(apiNodes)
  }

  async getAncestorDirsAPI(nodePath: string): Promise<StorageNode[]> {
    const apiNodes = await api.getStorageAncestorDirs(nodePath)
    return this.apiNodesToStorageNodes(apiNodes)
  }

  async createDirAPI(dirPath: string, input?: CreateStorageNodeInput): Promise<StorageNode> {
    const apiNode = await api.createStorageDir(dirPath, input)
    return this.apiNodeToStorageNode(apiNode)!
  }

  async createHierarchicalDirsAPI(dirPaths: string[]): Promise<StorageNode[]> {
    const apiNodes = await api.createStorageHierarchicalDirs(dirPaths)
    return this.apiNodesToStorageNodes(apiNodes)
  }

  async removeDirAPI(dirPath: string): Promise<StorageNode[]> {
    const apiNodes = await api.callStoragePaginationAPI(api.removeStorageDir, dirPath)
    return this.apiNodesToStorageNodes(apiNodes)
  }

  async removeFileAPI(filePath: string): Promise<StorageNode | undefined> {
    const apiNode = await api.removeStorageFile(filePath)
    return this.apiNodeToStorageNode(apiNode)
  }

  async moveDirAPI(fromDirPath: string, toDirPath: string): Promise<StorageNode[]> {
    const apiNodes = await api.callStoragePaginationAPI(api.moveStorageDir, fromDirPath, toDirPath)
    return this.apiNodesToStorageNodes(apiNodes)
  }

  async moveFileAPI(fromFilePath: string, toFilePath: string): Promise<StorageNode> {
    const apiNode = await api.moveStorageFile(fromFilePath, toFilePath)
    return this.apiNodeToStorageNode(apiNode)!
  }

  async renameDirAPI(dirPath: string, newName: string): Promise<StorageNode[]> {
    const apiNodes = await api.callStoragePaginationAPI(api.renameStorageDir, dirPath, newName)
    return this.apiNodesToStorageNodes(apiNodes)
  }

  async renameFileAPI(filePath: string, newName: string): Promise<StorageNode> {
    const apiNode = await api.renameStorageFile(filePath, newName)
    return this.apiNodeToStorageNode(apiNode)!
  }

  async setDirShareSettingsAPI(dirPath: string, input: StorageNodeShareSettingsInput): Promise<StorageNode> {
    const apiNode = await api.setStorageDirShareSettings(dirPath, input)
    return this.apiNodeToStorageNode(apiNode)!
  }

  async handleUploadedFileAPI(filePath: string): Promise<StorageNode> {
    const apiNode = await api.handleUploadedFile(filePath)
    return this.apiNodeToStorageNode(apiNode)!
  }

  async setFileShareSettingsAPI(filePath: string, input: StorageNodeShareSettingsInput): Promise<StorageNode> {
    const apiNode = await api.setStorageFileShareSettings(filePath, input)
    return this.apiNodeToStorageNode(apiNode)!
  }

  //--------------------------------------------------
  //  Helper
  //--------------------------------------------------

  apiNodeToStorageNode(apiNode?: APIStorageNode): StorageNode | undefined {
    if (!apiNode) return undefined
    return this.apiNodesToStorageNodes([apiNode])[0]
  }

  apiNodesToStorageNodes(apiNodes: APIStorageNode[]): StorageNode[] {
    return apiNodes.map(apiNode => {
      return { ...apiNode, url: getStorageNodeURL(apiNode.id) }
    })
  }

  /**
   * APIノードをストアに反映します。
   * @param apiNodes
   */
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

    store.storage.sort()

    return result
  }

  /**
   * APIノードにないストアノードを削除します。
   * @param apiNodes
   * @param storeNodes
   */
  removeNotExistsStoreNodes(apiNodes: APIStorageNode[], storeNodes: StorageNode[]): StorageNode[] {
    const apiNodeIdDict = arrayToDict(apiNodes, 'id')
    const apiNodePathDict = arrayToDict(apiNodes, 'path')

    const removingNodes: string[] = []
    for (const storeNode of storeNodes) {
      const exists = Boolean(apiNodeIdDict[storeNode.id] || apiNodePathDict[storeNode.path])
      !exists && removingNodes.push(storeNode.path)
    }

    return store.storage.removeList({ paths: removingNodes })
  }

  /**
   * 指定パスを構成するノードに未読み込みのノードがある場合、
   * サーバーから読み込み、ストアに格納します。
   * @param targetPath
   */
  async fetchUnloadedHierarchicalNodes(targetPath: string): Promise<void> {
    // 対象ノードの祖先がストアに存在しない場合
    if (!this.existsHierarchicalOnStore(targetPath)) {
      // 対象ノードを構成するノードをサーバーから読み込み
      await this.fetchHierarchicalNodes(targetPath)
    }
  }

  /**
   * 指定パスを含め階層を構成するノードがストアに存在しているかを走査します。
   * @param targetPath
   */
  existsHierarchicalOnStore(targetPath: string): boolean {
    const nodePaths = splitHierarchicalPaths(targetPath)
    for (const nodePath of nodePaths) {
      const node = store.storage.get({ path: nodePath })
      if (!node) return false
    }
    return true
  }

  /**
   * 指定パスの祖先を構成するノードにみ読み込みのノードがある場合、
   * サーバーから読み込み、ストアに格納します。
   * @param targetPath
   */
  async fetchUnloadedAncestorDirs(targetPath: string): Promise<void> {
    // 対象ノードの祖先がストアに存在しない場合
    if (!this.existsAncestorDirsOnStore(targetPath)) {
      // 対象ノードの祖先をサーバーから読み込み
      await this.fetchAncestorDirs(targetPath)
    }
  }

  /**
   * 指定パスの祖先を構成するノードがストアに存在するかを走査します。
   * @param targetPath
   */
  existsAncestorDirsOnStore(targetPath: string): boolean {
    const nodePaths = splitHierarchicalPaths(targetPath).filter(dirPath => dirPath !== targetPath)
    for (const nodePath of nodePaths) {
      const node = store.storage.get({ path: nodePath })
      if (!node) return false
    }
    return true
  }

  /**
   * ユーザーがサインインしているか検証します。
   */
  validateSignedIn(): void {
    if (!this.isSignedIn) {
      throw new Error(`The application is not yet signed in.`)
    }
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  /**
   * ページングが必要なノード検索APIをページングがなくなるまで実行し結果を取得します。
   * 注意: ノード検索API関数の第一引数は検索オプション（StoragePaginationInput）であることを前提とします。
   *
   * @param api ノード検索API関数のオーナーであるAPIを指定
   * @param func ノード検索API関数を指定
   * @param params ノード検索APIに渡す引数を指定
   */
  // eslint-disable-next-line space-before-function-paren
  protected async m_getPaginationNodesAPI<FUNC extends (...args: any[]) => Promise<StoragePaginationResult>>(
    api: AppAPIContainer,
    func: FUNC,
    ...params: Parameters<FUNC>
  ): Promise<StorageNode[]> {
    const nodeDict: { [path: string]: StorageNode } = {}

    // ノード検索APIの検索オプションを取得
    // ※ノード検索APIの第一引数は検索オプションという前提
    const input: StoragePaginationInput = Object.assign({ maxChunk: undefined, pageToken: undefined }, params[0])
    params[0] = input

    // ノード検索APIの実行
    // ※ページングがなくなるまで実行
    let nodeData = await func.call(api, ...params)
    Object.assign(nodeDict, arrayToDict(nodeData.list, 'path'))
    while (nodeData.nextPageToken) {
      input.pageToken = nodeData.nextPageToken
      nodeData = await func.call(api, ...params)
      Object.assign(nodeDict, arrayToDict(nodeData.list, 'path'))
    }

    return StorageLogic.sortTree(Object.values(nodeDict))
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

export { AppStorageLogic }
