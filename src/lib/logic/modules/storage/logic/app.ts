import { BaseLogic, getStorageNodeURL } from '../../../base'
import { Component, Watch } from 'vue-property-decorator'
import { LibAPIContainer, StorageNodeShareSettingsInput, StoragePaginationOptionsInput, StoragePaginationResult, api } from '../../../api'
import { RequiredStorageNodeShareSettings, StorageNode } from '../../../types'
import { StorageDownloader, StorageFileDownloader, StorageFileDownloaderType } from '../download'
import { arrayToDict, splitHierarchicalPaths } from 'web-base-lib'
import { APIStorageNode } from '../../../api/base'
import { StorageLogic } from './base'
import { StorageUploader } from '../upload'
import { StorageUrlUploadManager } from '../upload-url'
import { store } from '../../../store'

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

  async getNodeAPI(nodePath: string): Promise<StorageNode | undefined> {
    const apiNode = await this.m_toStorageNode(await api.getStorageNode(nodePath))
    return this.m_toStorageNode(apiNode)
  }

  async getDirDescendantsAPI(dirPath?: string): Promise<StorageNode[]> {
    const apiNodes = await api.callStoragePaginationAPI(api.getStorageDirDescendants, null, dirPath)
    return this.m_toStorageNodes(apiNodes)
  }

  async getDescendantsAPI(dirPath?: string): Promise<StorageNode[]> {
    const apiNodes = await api.callStoragePaginationAPI(api.getStorageDescendants, null, dirPath)
    return this.m_toStorageNodes(apiNodes)
  }

  async getDirChildrenAPI(dirPath?: string): Promise<StorageNode[]> {
    const apiNodes = await api.callStoragePaginationAPI(api.getStorageDirChildren, null, dirPath)
    return this.m_toStorageNodes(apiNodes)
  }

  async getChildrenAPI(dirPath?: string): Promise<StorageNode[]> {
    const apiNodes = await api.callStoragePaginationAPI(api.getStorageChildren, null, dirPath)
    return this.m_toStorageNodes(apiNodes)
  }

  async getHierarchicalNodesAPI(nodePath: string): Promise<StorageNode[]> {
    const apiNodes = await api.getStorageHierarchicalNodes(nodePath)
    return this.m_toStorageNodes(apiNodes)
  }

  async getAncestorDirsAPI(nodePath: string): Promise<StorageNode[]> {
    const apiNodes = await api.getStorageAncestorDirs(nodePath)
    return this.m_toStorageNodes(apiNodes)
  }

  async createDirsAPI(dirPaths: string[]): Promise<StorageNode[]> {
    const apiNodes = await api.createStorageDirs(dirPaths)
    return this.m_toStorageNodes(apiNodes)
  }

  async removeDirAPI(dirPath: string): Promise<StorageNode[]> {
    const apiNodes = await api.callStoragePaginationAPI(api.removeStorageDir, null, dirPath)
    return this.m_toStorageNodes(apiNodes)
  }

  async removeFileAPI(filePath: string): Promise<StorageNode | undefined> {
    const apiNode = await api.removeStorageFile(filePath)
    return this.m_toStorageNode(apiNode)
  }

  async moveDirAPI(fromDirPath: string, toDirPath: string): Promise<StorageNode[]> {
    const apiNodes = await api.callStoragePaginationAPI(api.moveStorageDir, null, fromDirPath, toDirPath)
    return this.m_toStorageNodes(apiNodes)
  }

  async moveFileAPI(fromFilePath: string, toFilePath: string): Promise<StorageNode> {
    const apiNode = await api.moveStorageFile(fromFilePath, toFilePath)
    return this.m_toStorageNode(apiNode)!
  }

  async renameDirAPI(dirPath: string, newName: string): Promise<StorageNode[]> {
    const apiNodes = await api.callStoragePaginationAPI(api.renameStorageDir, null, dirPath, newName)
    return this.m_toStorageNodes(apiNodes)
  }

  async renameFileAPI(filePath: string, newName: string): Promise<StorageNode> {
    const apiNode = await api.renameStorageFile(filePath, newName)
    return this.m_toStorageNode(apiNode)!
  }

  async setDirShareSettingsAPI(dirPath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode> {
    const apiNode = await api.setStorageDirShareSettings(dirPath, settings)
    return this.m_toStorageNode(apiNode)!
  }

  async handleUploadedFileAPI(filePath: string): Promise<StorageNode> {
    const apiNode = await api.handleUploadedFile(filePath)
    return this.m_toStorageNode(apiNode)!
  }

  async setFileShareSettingsAPI(filePath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode> {
    const apiNode = await api.setStorageFileShareSettings(filePath, settings)
    return this.m_toStorageNode(apiNode)!
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
  private m_removeNotExistsStoreNodes(apiNodes: APIStorageNode[], storeNodes: StorageNode[]): StorageNode[] {
    const apiNodeIdDict = arrayToDict(apiNodes, 'id')
    const apiNodePathDict = arrayToDict(apiNodes, 'path')

    const removingNodes: string[] = []
    for (const storeNode of storeNodes) {
      const exists = Boolean(apiNodeIdDict[storeNode.id] || apiNodePathDict[storeNode.path])
      !exists && removingNodes.push(storeNode.path)
    }

    return store.storage.removeList({ paths: removingNodes })
  }

  private m_toStorageNode(apiNode?: APIStorageNode): StorageNode | undefined {
    if (!apiNode) return undefined
    return this.m_toStorageNodes([apiNode])[0]
  }

  private m_toStorageNodes(apiNodes: APIStorageNode[]): StorageNode[] {
    return apiNodes.map(apiNode => {
      return { ...apiNode, url: getStorageNodeURL(apiNode.id) }
    })
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
