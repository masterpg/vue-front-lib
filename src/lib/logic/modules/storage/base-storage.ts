import { StorageNode, StorageNodeShareSettingsInput } from '../../api'
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

  getNodeMap(): { [path: string]: StorageNode } {
    return this.storageStore.getMap()
  }

  async pullNodes(dirPath?: string): Promise<void> {
    const apiNodes = await this.getHierarchicalStorageDescendants(dirPath)
    if (!dirPath) {
      this.storageStore.setAll(apiNodes)
    } else {
      // 取得したノードリストをストアへ反映
      const storeAllNodeMap = this.storageStore.all.reduce(
        (result, node) => {
          result[node.id] = node
          return result
        },
        {} as { [id: string]: StorageNode }
      )
      const updatingNodes: StorageNode[] = []
      const addingNodes: StorageNode[] = []
      for (const apiNode of apiNodes) {
        const exists = Boolean(storeAllNodeMap[apiNode.id])
        if (exists) {
          updatingNodes.push(apiNode)
        } else {
          addingNodes.push(apiNode)
        }
      }
      this.storageStore.setList(updatingNodes)
      this.storageStore.addList(addingNodes)

      // ストアにはあるが取得したノードリストにはないノードをストアから削除
      const apiNodeMap = apiNodes.reduce(
        (result, node) => {
          result[node.id] = node
          return result
        },
        {} as { [id: string]: StorageNode }
      )
      const removingNodes: string[] = []
      for (const storeNode of this.storageStore.getDescendants(dirPath)) {
        const exists = Boolean(apiNodeMap[storeNode.id])
        !exists && removingNodes.push(storeNode.path)
      }
      this.storageStore.removeList(removingNodes)
    }
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
    return this.storageStore.setList(apiNodes)
  }

  async moveFile(fromFilePath: string, toFilePath: string): Promise<StorageNode> {
    const apiNode = await this.moveStorageFile(fromFilePath, toFilePath)
    this.storageStore.move(fromFilePath, toFilePath)
    return this.storageStore.set(apiNode)
  }

  async renameDir(dirPath: string, newName: string): Promise<StorageNode[]> {
    const apiNodes = await this.renameStorageDir(dirPath, newName)
    this.storageStore.rename(dirPath, newName)
    return this.storageStore.setList(apiNodes)
  }

  async renameFile(filePath: string, newName: string): Promise<StorageNode> {
    const apiNode = await this.renameStorageFile(filePath, newName)
    this.storageStore.rename(filePath, newName)
    return this.storageStore.set(apiNode)
  }

  async setDirShareSettings(dirPath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode[]> {
    const apiNodes = await this.setStorageDirShareSettings(dirPath, settings)
    return this.storageStore.setList(apiNodes)
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
