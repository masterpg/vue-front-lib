import { StorageNode, StorageNodeShareSettingsInput } from '../../api'
import { StorageStore, User } from '../../store'
import { BaseLogic } from '../../base'
import { Component } from 'vue-property-decorator'
import { StorageLogic } from '../../types'
import { StorageUploadManager } from './base-upload'
import { splitHierarchicalPaths } from 'web-base-lib'

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

    const apiNodes = await this.getHierarchicalStorageDescendants(dirPath)

    // 取得したノードリストをストアへ反映
    Object.assign(result, this.setNodesToStore(apiNodes))

    // 取得ノードリストをマップ化
    const apiNodeMap = apiNodes.reduce(
      (result, node) => {
        result[node.id] = node
        return result
      },
      {} as { [id: string]: StorageNode }
    )
    // ストアから対象ノードを取得
    const hierarchicalDirPaths = splitHierarchicalPaths(dirPath)
    let storeNodes = hierarchicalDirPaths.reduce(
      (result, path) => {
        const node = this.getNode(path)
        node && result.push(node)
        return result
      },
      [] as StorageNode[]
    )
    storeNodes = storeNodes.concat(...this.storageStore.getDescendants(dirPath))
    // ストアにあって取得ノードリストにないノードをストアから削除
    const removingNodes: string[] = []
    for (const storeNode of storeNodes) {
      const exists = Boolean(apiNodeMap[storeNode.id])
      !exists && removingNodes.push(storeNode.path)
    }
    result.removed = this.storageStore.removeList(removingNodes)

    return result
  }

  async pullChildren(dirPath?: string): Promise<{ added: StorageNode[]; updated: StorageNode[]; removed: StorageNode[] }> {
    const result: { added: StorageNode[]; updated: StorageNode[]; removed: StorageNode[] } = { added: [], updated: [], removed: [] }

    const apiNodes = await this.getStorageChildren(dirPath)

    // 取得したノードリストをストアへ反映
    Object.assign(result, this.setNodesToStore(apiNodes))
    // ストアにあって取得ノードリストにないノードをストアから削除
    const apiNodeMap = apiNodes.reduce(
      (result, node) => {
        result[node.id] = node
        return result
      },
      {} as { [id: string]: StorageNode }
    )
    const removingNodes: string[] = []
    for (const storeNode of this.storageStore.getChildren(dirPath)) {
      const exists = Boolean(apiNodeMap[storeNode.id])
      !exists && removingNodes.push(storeNode.path)
    }
    result.removed = this.storageStore.removeList(removingNodes)

    return result
  }

  async createDirs(dirPaths: string[]): Promise<StorageNode[]> {
    const apiNodes = await this.createStorageDirs(dirPaths)
    return this.storageStore.addList(apiNodes)
  }

  async removeDirs(dirPaths: string[]): Promise<StorageNode[]> {
    const apiNodes = await this.removeStorageDirs(dirPaths)
    const result: StorageNode[] = []
    for (const apiNode of apiNodes) {
      const removedNodes = this.storageStore.remove(apiNode.path)
      removedNodes && result.push(...removedNodes)
    }
    return result
  }

  async removeFiles(filePaths: string[]): Promise<StorageNode[]> {
    const apiNodes = await this.removeStorageFiles(filePaths)
    const result: StorageNode[] = []
    for (const apiNode of apiNodes) {
      const removedNodes = this.storageStore.remove(apiNode.path)
      removedNodes && result.push(...removedNodes)
    }
    return result
  }

  async moveDir(fromDirPath: string, toDirPath: string): Promise<StorageNode[]> {
    const apiNodes = await this.moveStorageDir(fromDirPath, toDirPath)
    this.storageStore.move(fromDirPath, toDirPath)
    const result = this.setNodesToStore(apiNodes)
    return this.sortNodes([...result.added, ...result.updated])
  }

  async moveFile(fromFilePath: string, toFilePath: string): Promise<StorageNode> {
    const apiNode = await this.moveStorageFile(fromFilePath, toFilePath)
    this.storageStore.move(fromFilePath, toFilePath)
    return this.storageStore.set(apiNode)
  }

  async renameDir(dirPath: string, newName: string): Promise<StorageNode[]> {
    const apiNodes = await this.renameStorageDir(dirPath, newName)
    this.storageStore.rename(dirPath, newName)
    const result = this.setNodesToStore(apiNodes)
    return this.sortNodes([...result.added, ...result.updated])
  }

  async renameFile(filePath: string, newName: string): Promise<StorageNode> {
    const apiNode = await this.renameStorageFile(filePath, newName)
    this.storageStore.rename(filePath, newName)
    return this.storageStore.set(apiNode)
  }

  async setDirShareSettings(dirPath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode[]> {
    const apiNodes = await this.setStorageDirShareSettings(dirPath, settings)
    const result = this.setNodesToStore(apiNodes)
    return this.sortNodes([...result.added, ...result.updated])
  }

  async setFileShareSettings(filePath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode> {
    const apiNode = await this.setStorageFileShareSettings(filePath, settings)
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

  protected abstract getHierarchicalStorageDescendants(dirPath?: string): Promise<StorageNode[]>

  protected abstract getHierarchicalStorageChildren(dirPath?: string): Promise<StorageNode[]>

  protected abstract getStorageChildren(dirPath?: string): Promise<StorageNode[]>

  protected abstract createStorageDirs(dirPaths: string[]): Promise<StorageNode[]>

  protected abstract removeStorageDirs(dirPaths: string[]): Promise<StorageNode[]>

  protected abstract removeStorageFiles(filePaths: string[]): Promise<StorageNode[]>

  protected abstract moveStorageDir(fromDirPath: string, toDirPath: string): Promise<StorageNode[]>

  protected abstract moveStorageFile(fromFilePath: string, toFilePath: string): Promise<StorageNode>

  protected abstract renameStorageDir(dirPath: string, newName: string): Promise<StorageNode[]>

  protected abstract renameStorageFile(filePath: string, newName: string): Promise<StorageNode>

  protected abstract setStorageDirShareSettings(dirPath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode[]>

  protected abstract setStorageFileShareSettings(filePath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode>

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------

  private m_userOnSignedOut(user: User) {
    this.storageStore.clear()
  }
}
