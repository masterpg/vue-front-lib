import { StorageNode, StorageStore } from '../../store'
import { APIStorageNode } from '../../api'
import { BaseLogic } from '../../base'
import { StorageLogic } from '../../types'
import { StorageUploadManager } from './base-upload'

export abstract class BaseStorageLogic extends BaseLogic implements StorageLogic {
  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  get nodes(): StorageNode[] {
    return this.storageStore.all
  }

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
    const gqlNodes = await this.storageDirNodes(dirPath)
    if (dirPath) {
      this.storageStore.addList(gqlNodes)
    } else {
      this.storageStore.setAll(gqlNodes)
    }
  }

  async createDirs(dirPaths: string[]): Promise<StorageNode[]> {
    const gqlNodes = await this.createStorageDirs(dirPaths)
    return this.storageStore.addList(gqlNodes)
  }

  async removeDirs(dirPaths: string[]): Promise<StorageNode[]> {
    const gqlNodes = await this.removeStorageDirs(dirPaths)
    const result: StorageNode[] = []
    for (const gqlNode of gqlNodes) {
      const removedNodes = this.storageStore.remove(gqlNode.path)
      removedNodes && result.push(...removedNodes)
    }
    return result
  }

  async removeFiles(filePaths: string[]): Promise<StorageNode[]> {
    const gqlNodes = await this.removeStorageFiles(filePaths)
    const result: StorageNode[] = []
    for (const gqlNode of gqlNodes) {
      const removedNodes = this.storageStore.remove(gqlNode.path)
      removedNodes && result.push(...removedNodes)
    }
    return result
  }

  async moveDir(fromDirPath: string, toDirPath: string): Promise<StorageNode[]> {
    const gqlNodes = await this.moveStorageDir(fromDirPath, toDirPath)
    this.storageStore.move(fromDirPath, toDirPath)
    return this.storageStore.setList(gqlNodes)
  }

  async moveFile(fromFilePath: string, toFilePath: string): Promise<StorageNode> {
    const gqlNode = await this.moveStorageFile(fromFilePath, toFilePath)
    this.storageStore.move(fromFilePath, toFilePath)
    return this.storageStore.setList([gqlNode])[0]
  }

  async renameDir(dirPath: string, newName: string): Promise<StorageNode[]> {
    const gqlNodes = await this.renameStorageDir(dirPath, newName)
    this.storageStore.rename(dirPath, newName)
    return this.storageStore.setList(gqlNodes)
  }

  async renameFile(filePath: string, newName: string): Promise<StorageNode> {
    const gqlNode = await this.renameStorageFile(filePath, newName)
    this.storageStore.rename(filePath, newName)
    return this.storageStore.setList([gqlNode])[0]
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  //--------------------------------------------------
  //  API
  //--------------------------------------------------

  protected abstract storageDirNodes(dirPath?: string): Promise<APIStorageNode[]>

  protected abstract createStorageDirs(dirPaths: string[]): Promise<APIStorageNode[]>

  protected abstract removeStorageDirs(dirPaths: string[]): Promise<APIStorageNode[]>

  protected abstract removeStorageFiles(filePaths: string[]): Promise<APIStorageNode[]>

  protected abstract moveStorageDir(fromDirPath: string, toDirPath: string): Promise<APIStorageNode[]>

  protected abstract moveStorageFile(fromFilePath: string, toFilePath: string): Promise<APIStorageNode>

  protected abstract renameStorageDir(dirPath: string, newName: string): Promise<APIStorageNode[]>

  protected abstract renameStorageFile(filePath: string, newName: string): Promise<APIStorageNode>
}
