import { LibAPIContainer, StorageNode, StorageNodeShareSettingsInput, StoragePaginationOptionsInput, StoragePaginationResult } from '../../../api'
import { StorageStore, User } from '../../../store'
import { arrayToDict, splitHierarchicalPaths } from 'web-base-lib'
import { BaseLogic } from '../../../base'
import { Component } from 'vue-property-decorator'
import { StorageLogic } from '../../../types'
import { StorageUploadManager } from '../types'

// @ts-ignore: Vueを継承した抽象クラスに@Componentを付与するとでるエラーの回避
@Component
export abstract class BaseStorageLogic extends BaseLogic implements StorageLogic {
  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  created() {
    this.addSignedOutListener(this.m_userOnSignedOut)
  }

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  get nodes(): StorageNode[] {
    return this.storageStore.all
  }

  abstract readonly baseURL: string

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  protected abstract readonly storageStore: StorageStore

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  abstract newUploadManager(owner: Element): StorageUploadManager

  getNode(key: { id?: string; path?: string }): StorageNode | undefined {
    return this.storageStore.get(key)
  }

  getNodeDict(): { [path: string]: StorageNode } {
    return this.storageStore.getDict()
  }

  getChildren(dirPath?: string): StorageNode[] {
    return this.storageStore.getChildren(dirPath)
  }

  getDirChildren(dirPath?: string): StorageNode[] {
    return this.storageStore.getDirChildren(dirPath)
  }

  getDescendants(dirPath?: string): StorageNode[] {
    return this.storageStore.getDescendants(dirPath)
  }

  getDirDescendants(dirPath: string): StorageNode[] {
    return this.storageStore.getDirDescendants(dirPath)
  }

  getHierarchicalNode(nodePath: string): StorageNode[] {
    return splitHierarchicalPaths(nodePath).reduce(
      (result, iDirPath) => {
        const iDirNode = this.getNode({ path: iDirPath })
        iDirNode && result.push(iDirNode)
        return result
      },
      [] as StorageNode[]
    )
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
    const result = this.sortNodes(this.setAPINodesToStore(apiNodes))
    // APIノードにないストアノードを削除
    this.m_removeNotExistsStoreNodes(apiNodes, this.storageStore.getDirDescendants(dirPath))
    return result
  }

  async fetchDescendants(dirPath?: string): Promise<StorageNode[]> {
    // APIノードをストアへ反映
    const apiNodes = await this.getDescendantsAPI(dirPath)
    const result = this.sortNodes(this.setAPINodesToStore(apiNodes))
    // APIノードにないストアノードを削除
    this.m_removeNotExistsStoreNodes(apiNodes, this.storageStore.getDescendants(dirPath))
    return result
  }

  async fetchDirChildren(dirPath?: string): Promise<StorageNode[]> {
    // APIノードをストアへ反映
    const apiNodes = await this.getDirChildrenAPI(dirPath)
    const result = this.sortNodes(this.setAPINodesToStore(apiNodes))
    // APIノードにないストアノードを削除
    this.m_removeNotExistsStoreNodes(apiNodes, this.storageStore.getDirChildren(dirPath))
    return result
  }

  async fetchChildren(dirPath?: string): Promise<StorageNode[]> {
    // APIノードをストアへ反映
    const apiNodes = await this.getChildrenAPI(dirPath)
    const result = this.sortNodes(this.setAPINodesToStore(apiNodes))
    // APIノードにないストアノードを削除
    this.m_removeNotExistsStoreNodes(apiNodes, this.storageStore.getChildren(dirPath))
    return result
  }

  async fetchHierarchicalDescendants(dirPath?: string): Promise<StorageNode[]> {
    const result: StorageNode[] = []

    // 引数ディレクトリが指定されなかった場合
    if (!dirPath) {
      await Promise.all([
        (async () => {
          result.push(...(await this.fetchDirDescendants(dirPath)))
        })(),
      ])
    }
    // 引数ディレクトリが指定された場合
    else {
      await Promise.all([
        (async () => {
          result.push(...(await this.fetchAncestorDirs(dirPath)))
        })(),
        (async () => {
          result.push(...(await this.fetchDirDescendants(dirPath)))
        })(),
      ])
    }

    return this.sortNodes(result)
  }

  async fetchHierarchicalChildren(dirPath?: string): Promise<StorageNode[]> {
    const result: StorageNode[] = []

    // 引数ディレクトリが指定されなかった場合
    if (!dirPath) {
      await Promise.all([
        (async () => {
          result.push(...(await this.fetchDirChildren(dirPath)))
        })(),
      ])
    }
    // 引数ディレクトリが指定された場合
    else {
      await Promise.all([
        (async () => {
          result.push(...(await this.getAncestorDirsAPI(dirPath)))
        })(),
        (async () => {
          result.push(...(await this.fetchDirChildren(dirPath)))
        })(),
      ])
    }

    return this.sortNodes(result)
  }

  async createDirs(dirPaths: string[]): Promise<StorageNode[]> {
    const apiNodes = await this.createDirsAPI(dirPaths)
    return this.storageStore.addList(apiNodes)
  }

  async removeDir(dirPath: string): Promise<void> {
    await this.removeDirAPI(dirPath)
    this.storageStore.remove({ path: dirPath })
  }

  async removeFile(filePath: string): Promise<void> {
    await this.removeFileAPI(filePath)
    this.storageStore.remove({ path: filePath })
  }

  async moveDir(fromDirPath: string, toDirPath: string): Promise<StorageNode[]> {
    const apiNodes = await this.moveDirAPI(fromDirPath, toDirPath)
    this.storageStore.move(fromDirPath, toDirPath)
    return this.setAPINodesToStore(apiNodes)
  }

  async moveFile(fromFilePath: string, toFilePath: string): Promise<StorageNode> {
    const apiNode = await this.moveFileAPI(fromFilePath, toFilePath)
    this.storageStore.move(fromFilePath, toFilePath)
    return this.setAPINodesToStore([apiNode])[0]
  }

  async renameDir(dirPath: string, newName: string): Promise<StorageNode[]> {
    const apiNodes = await this.renameDirAPI(dirPath, newName)
    this.storageStore.rename(dirPath, newName)
    return this.setAPINodesToStore(apiNodes)
  }

  async renameFile(filePath: string, newName: string): Promise<StorageNode> {
    const apiNode = await this.renameFileAPI(filePath, newName)
    this.storageStore.rename(filePath, newName)
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

  sortNodes(nodes: StorageNode[]): StorageNode[] {
    nodes.sort(this.storageStore.sortFunc)
    return nodes
  }

  //----------------------------------------------------------------------
  //
  //  Storage internal methods
  //
  //----------------------------------------------------------------------

  setAPINodesToStore(apiNodes: StorageNode[]): StorageNode[] {
    const result: StorageNode[] = []

    for (const apiNode of apiNodes) {
      const storeNode = this.storageStore.get({ id: apiNode.id, path: apiNode.path })
      if (!storeNode) {
        result.push(this.storageStore.add(apiNode))
      } else {
        // ストアノードとAPIノードのパスが異なる場合
        // ※ノード移動が行われていた場合
        if (storeNode.path !== apiNode.path) {
          this.storageStore.move(storeNode.path, apiNode.path)
        }
        result.push(this.storageStore.set(apiNode))
      }
    }

    return result
  }

  //--------------------------------------------------
  //  API
  //--------------------------------------------------

  abstract getNodeAPI(nodePath: string): Promise<StorageNode | undefined>

  abstract getDirDescendantsAPI(dirPath?: string): Promise<StorageNode[]>

  abstract getDescendantsAPI(dirPath?: string): Promise<StorageNode[]>

  abstract getDirChildrenAPI(dirPath?: string): Promise<StorageNode[]>

  abstract getChildrenAPI(dirPath?: string): Promise<StorageNode[]>

  abstract getHierarchicalNodesAPI(nodePath: string): Promise<StorageNode[]>

  abstract getAncestorDirsAPI(nodePath: string): Promise<StorageNode[]>

  abstract handleUploadedFileAPI(filePath: string): Promise<StorageNode>

  abstract createDirsAPI(dirPaths: string[]): Promise<StorageNode[]>

  abstract removeDirAPI(dirPath: string): Promise<StorageNode[]>

  abstract removeFileAPI(filePath: string): Promise<StorageNode | undefined>

  abstract moveDirAPI(fromDirPath: string, toDirPath: string): Promise<StorageNode[]>

  abstract moveFileAPI(fromFilePath: string, toFilePath: string): Promise<StorageNode>

  abstract renameDirAPI(dirPath: string, newName: string): Promise<StorageNode[]>

  abstract renameFileAPI(filePath: string, newName: string): Promise<StorageNode>

  abstract setDirShareSettingsAPI(dirPath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode>

  abstract setFileShareSettingsAPI(filePath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode>

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

    return this.sortNodes(Object.values(nodeDict))
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

    return this.storageStore.removeList({ paths: removingNodes })
  }

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------

  private m_userOnSignedOut(user: User) {
    this.storageStore.clear()
  }
}
