import { StorageNode, StorageStore } from '../../store'
import { BaseLogic } from '../../base'
import { StorageLogic } from '../../types'
import { StorageUploadManager } from './base-upload'
import { api } from '../../api'

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
    const gqlNodes = await api.userStorageDirNodes(dirPath)
    if (dirPath) {
      this.storageStore.addList(gqlNodes)
    } else {
      this.storageStore.setAll(gqlNodes)
    }
  }

  async createDirs(dirPaths: string[]): Promise<StorageNode[]> {
    const gqlNodes = await api.createUserStorageDirs(dirPaths)
    return this.storageStore.addList(gqlNodes)
  }

  async removeDirs(dirPaths: string[]): Promise<StorageNode[]> {
    const gqlNodes = await api.removeUserStorageDirs(dirPaths)
    const result: StorageNode[] = []
    for (const gqlNode of gqlNodes) {
      const removedNodes = this.storageStore.remove(gqlNode.path)
      removedNodes && result.push(...removedNodes)
    }
    return result
  }

  async removeFiles(filePaths: string[]): Promise<StorageNode[]> {
    const gqlNodes = await api.removeUserStorageFiles(filePaths)
    const result: StorageNode[] = []
    for (const gqlNode of gqlNodes) {
      const removedNodes = this.storageStore.remove(gqlNode.path)
      removedNodes && result.push(...removedNodes)
    }
    return result
  }

  async moveDir(fromDirPath: string, toDirPath: string): Promise<StorageNode[]> {
    const gqlNodes = await api.moveUserStorageDir(fromDirPath, toDirPath)
    return this.storageStore.move(fromDirPath, toDirPath)
  }

  async moveFile(fromFilePath: string, toFilePath: string): Promise<StorageNode> {
    const gqlNode = await api.moveUserStorageFile(fromFilePath, toFilePath)
    return this.storageStore.move(fromFilePath, toFilePath)[0]
  }

  async renameDir(dirPath: string, newName: string): Promise<StorageNode[]> {
    await api.renameUserStorageDir(dirPath, newName)
    return this.storageStore.rename(dirPath, newName)
  }

  async renameFile(filePath: string, newName: string): Promise<StorageNode> {
    await api.renameUserStorageFile(filePath, newName)
    return this.storageStore.rename(filePath, newName)[0]
  }
}
