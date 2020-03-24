import * as _path from 'path'
import { GetStorageOptionsInput, GetStorageResult, LibAPIContainer, StorageNode, StorageNodeShareSettingsInput } from '../../api'
import { StorageStore, User } from '../../store'
import { BaseLogic } from '../../base'
import { Component } from 'vue-property-decorator'
import { StorageLogic } from '../../types'
import { StorageUploadManager } from './base-upload'

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

  getNode(path: string): StorageNode | undefined {
    return this.storageStore.get(path)
  }

  getNodeMap(): { [path: string]: StorageNode } {
    return this.storageStore.getMap()
  }

  getChildren(dirPath?: string): StorageNode[] {
    return this.storageStore.getChildren(dirPath)
  }

  getDirChildren(dirPath?: string): StorageNode[] {
    return this.storageStore.getDirChildren(dirPath)
  }

  getDescendants(dirPath: string): StorageNode[] {
    return this.storageStore.getDescendants(dirPath)
  }

  getDirDescendants(dirPath: string): StorageNode[] {
    return this.storageStore.getDirDescendants(dirPath)
  }

  async pullDescendants(dirPath?: string): Promise<{ added: StorageNode[]; updated: StorageNode[]; removed: StorageNode[] }> {
    const result: { added: StorageNode[]; updated: StorageNode[]; removed: StorageNode[] } = { added: [], updated: [], removed: [] }

    const apiNodes = await this.getDirDescendantsAPI(dirPath)

    // 取得したノードリストをストアへ反映
    Object.assign(result, this.setNodesToStore(apiNodes))

    // 取得ノードリストをマップ化
    const apiNodeDict = apiNodes.reduce(
      (result, node) => {
        result[node.id] = node
        return result
      },
      {} as { [id: string]: StorageNode }
    )
    // ストアから対象ノードを取得
    const storeNodes = this.storageStore.getDirDescendants(dirPath)
    // ストアにあって取得ノードリストにないノードをストアから削除
    const removingNodes: string[] = []
    for (const storeNode of storeNodes) {
      const exists = Boolean(apiNodeDict[storeNode.id])
      !exists && removingNodes.push(storeNode.path)
    }
    result.removed = this.storageStore.removeList(removingNodes)

    return result
  }

  async pullChildren(dirPath?: string): Promise<{ added: StorageNode[]; updated: StorageNode[]; removed: StorageNode[] }> {
    const result: { added: StorageNode[]; updated: StorageNode[]; removed: StorageNode[] } = { added: [], updated: [], removed: [] }

    const apiNodes = await this.getChildrenAPI(dirPath)

    // 取得したノードリストをストアへ反映
    Object.assign(result, this.setNodesToStore(apiNodes))
    // ストアにあって取得ノードリストにないノードをストアから削除
    const apiNodeDict = apiNodes.reduce(
      (result, node) => {
        result[node.id] = node
        return result
      },
      {} as { [id: string]: StorageNode }
    )
    const removingNodes: string[] = []
    for (const storeNode of this.storageStore.getChildren(dirPath)) {
      const exists = Boolean(apiNodeDict[storeNode.id])
      !exists && removingNodes.push(storeNode.path)
    }
    result.removed = this.storageStore.removeList(removingNodes)

    return result
  }

  async createDirs(dirPaths: string[]): Promise<StorageNode[]> {
    const apiNodes = await this.createDirsAPI(dirPaths)
    return this.storageStore.addList(apiNodes)
  }

  async removeDirs(dirPaths: string[]): Promise<void> {
    await this.removeDirsAPI(dirPaths)
    this.storageStore.removeList(dirPaths)
  }

  async removeFiles(filePaths: string[]): Promise<void> {
    await this.removeFilesAPI(filePaths)
    this.storageStore.removeList(filePaths)
  }

  async moveDir(fromDirPath: string, toDirPath: string): Promise<void> {
    await this.moveDirAPI(fromDirPath, toDirPath)
    this.storageStore.move(fromDirPath, toDirPath)

    this.setNodesToStore(await this.getDirDescendantsAPI(toDirPath))
  }

  async moveFile(fromFilePath: string, toFilePath: string): Promise<void> {
    await this.moveFileAPI(fromFilePath, toFilePath)
    this.storageStore.move(fromFilePath, toFilePath)

    const apiNode = await this.getNodeAPI(toFilePath)
    apiNode && this.storageStore.set(apiNode)
  }

  async renameDir(dirPath: string, newName: string): Promise<void> {
    await this.renameDirAPI(dirPath, newName)
    this.storageStore.rename(dirPath, newName)

    const reg = new RegExp(`${_path.basename(dirPath)}$`)
    const toDirPath = dirPath.replace(reg, newName)
    this.setNodesToStore(await this.getDirDescendantsAPI(toDirPath))
  }

  async renameFile(filePath: string, newName: string): Promise<void> {
    await this.renameFileAPI(filePath, newName)
    this.storageStore.rename(filePath, newName)

    const reg = new RegExp(`${_path.basename(filePath)}$`)
    const toFilePath = filePath.replace(reg, newName)
    const apiNode = await this.getNodeAPI(toFilePath)
    apiNode && this.storageStore.set(apiNode)
  }

  async setDirShareSettings(dirPath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode> {
    const apiNode = await this.setDirShareSettingsAPI(dirPath, settings)
    return this.storageStore.set(apiNode)
  }

  async setFileShareSettings(filePath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode> {
    const apiNode = await this.setFileShareSettingsAPI(filePath, settings)
    return this.storageStore.set(apiNode)
  }

  sortNodes(nodes: StorageNode[]): StorageNode[] {
    nodes.sort(this.storageStore.sortFunc)
    return nodes
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  protected setNodesToStore(nodes: StorageNode[]): { added: StorageNode[]; updated: StorageNode[] } {
    const stateNodeMap = this.storageStore.all.reduce(
      (result, node) => {
        result[node.id] = node
        return result
      },
      {} as { [id: string]: StorageNode }
    )

    const updatingNodes: StorageNode[] = []
    const addingNodes: StorageNode[] = []
    for (const node of nodes) {
      const exists = Boolean(stateNodeMap[node.id])
      if (exists) {
        updatingNodes.push(node)
      } else {
        addingNodes.push(node)
      }
    }

    const result = {
      added: this.storageStore.addList(addingNodes),
      updated: this.storageStore.setList(updatingNodes),
    }

    return result
  }

  //--------------------------------------------------
  //  API
  //--------------------------------------------------

  /**
   * ページングが必要なノード検索APIをページングがなくなるまで実行し結果を取得します。
   * 注意: ノード検索API関数の第一引数は検索オプション（GetStorageOptionsInput）であることを前提とします。
   *
   * @param api ノード検索API関数のオーナーであるAPIを指定
   * @param func ノード検索API関数を指定
   * @param params ノード検索APIに渡す引数を指定
   */
  // eslint-disable-next-line space-before-function-paren
  protected async getPaginationNodesAPI<FUNC extends (...args: any[]) => Promise<GetStorageResult>>(
    api: LibAPIContainer,
    func: FUNC,
    ...params: Parameters<FUNC>
  ): Promise<StorageNode[]> {
    const toDict = (list: StorageNode[]) => {
      return list.reduce(
        (result, item) => {
          result[item.path] = item
          return result
        },
        {} as { [path: string]: StorageNode }
      )
    }

    const nodeDict: { [path: string]: StorageNode } = {}

    // ノード検索APIの検索オプションを取得
    // ※ノード検索APIの第一引数は検索オプションという前提
    const options: GetStorageOptionsInput = Object.assign({ maxResults: undefined, pageToken: undefined }, params[0])
    params[0] = options

    // ノード検索APIの実行
    // ※ページングがなくなるまで実行
    let nodeData = await func.call(api, ...params)
    Object.assign(nodeDict, toDict(nodeData.list))
    while (nodeData.nextPageToken) {
      options.pageToken = nodeData.nextPageToken
      nodeData = await func.call(api, ...params)
      Object.assign(nodeDict, toDict(nodeData.list))
    }

    return this.sortNodes(Object.values(nodeDict))
  }

  protected abstract getNodeAPI(nodePath: string): Promise<StorageNode | undefined>

  protected abstract getDirDescendantsAPI(dirPath?: string): Promise<StorageNode[]>

  protected abstract getDescendantsAPI(dirPath?: string): Promise<StorageNode[]>

  protected abstract getDirChildrenAPI(dirPath?: string): Promise<StorageNode[]>

  protected abstract getChildrenAPI(dirPath?: string): Promise<StorageNode[]>

  protected abstract createDirsAPI(dirPaths: string[]): Promise<StorageNode[]>

  protected abstract removeDirsAPI(dirPaths: string[]): Promise<void>

  protected abstract removeFilesAPI(filePaths: string[]): Promise<void>

  protected abstract moveDirAPI(fromDirPath: string, toDirPath: string): Promise<void>

  protected abstract moveFileAPI(fromFilePath: string, toFilePath: string): Promise<void>

  protected abstract renameDirAPI(dirPath: string, newName: string): Promise<void>

  protected abstract renameFileAPI(filePath: string, newName: string): Promise<void>

  protected abstract setDirShareSettingsAPI(dirPath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode>

  protected abstract setFileShareSettingsAPI(filePath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode>

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------

  private m_userOnSignedOut(user: User) {
    this.storageStore.clear()
  }
}
