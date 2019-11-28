import { StorageNode, store } from '../../store'
import { AdminStorageUploadManager } from './admin-upload'
import { BaseLogic } from '../../base'
import { Component } from 'vue-property-decorator'
import { StorageLogic } from '../../types'
import { StorageUploadManager } from './base'
import { UserStorageUploadManager } from './user-upload'
import { UserStorageUrlUploadManager } from './user-upload-by-url'
import { api } from '../../api'

@Component
export class StorageLogicImpl extends BaseLogic implements StorageLogic {
  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  get nodes(): StorageNode[] {
    return store.storage.all
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  getNodeMap(): { [path: string]: StorageNode } {
    return store.storage.getMap()
  }

  async pullUserNodes(dirPath?: string): Promise<void> {
    const gqlNodes = await api.userStorageDirNodes(dirPath)
    if (dirPath) {
      store.storage.addList(gqlNodes)
    } else {
      store.storage.setAll(gqlNodes)
    }
  }

  async createUserStorageDirs(dirPaths: string[]): Promise<StorageNode[]> {
    const gqlNodes = await api.createUserStorageDirs(dirPaths)
    return store.storage.addList(gqlNodes)
  }

  async removeUserStorageFiles(filePaths: string[]): Promise<StorageNode[]> {
    const gqlNodes = await api.removeUserStorageFiles(filePaths)
    const result: StorageNode[] = []
    for (const gqlNode of gqlNodes) {
      const removedNodes = store.storage.remove(gqlNode.path)
      removedNodes && result.push(...removedNodes)
    }
    return result
  }

  async removeUserStorageDir(dirPath: string): Promise<StorageNode[]> {
    const gqlNodes = await api.removeUserStorageDir(dirPath)
    const result: StorageNode[] = []
    for (const gqlNode of gqlNodes) {
      const removedNodes = store.storage.remove(gqlNode.path)
      removedNodes && result.push(...removedNodes)
    }
    return result
  }

  newUserUploadManager(owner: Element): StorageUploadManager {
    return new UserStorageUploadManager(owner)
  }

  newUserUrlUploadManager(owner: Element): StorageUploadManager {
    return new UserStorageUrlUploadManager(owner)
  }

  newAdminUploadManager(owner: Element): StorageUploadManager {
    return new AdminStorageUploadManager(owner)
  }
}

export { StorageUploadManager }
