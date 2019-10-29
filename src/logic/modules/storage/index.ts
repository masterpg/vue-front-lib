import { StorageLogic, StorageNodeBag } from '@/logic'
import { StorageUploadManager, toStorageNodeBag } from '@/logic/modules/storage/base'
import { AdminStorageUploadManager } from '@/logic/modules/storage/admin-upload'
import { BaseLogic } from '@/logic/base'
import { Component } from 'vue-property-decorator'
import { UserStorageUploadManager } from '@/logic/modules/storage/user-upload'
import { api } from '@/api'
import { config } from '@/base'

@Component
export class StorageLogicImpl extends BaseLogic implements StorageLogic {
  toURL(path: string): string {
    path = path.replace(/^\//, '')
    return `${config.api.baseURL}/storage/${path}`
  }

  async getUserNodes(dirPath?: string): Promise<StorageNodeBag> {
    const gqlNodes = await api.userStorageDirNodes(dirPath)
    return toStorageNodeBag(gqlNodes)
  }

  async createUserStorageDirs(dirPaths: string[]): Promise<StorageNodeBag> {
    const gqlNodes = await api.createUserStorageDirs(dirPaths)
    return toStorageNodeBag(gqlNodes)
  }

  async removeUserStorageFiles(filePaths: string[]): Promise<StorageNodeBag> {
    const gqlNodes = await api.removeUserStorageFiles(filePaths)
    return toStorageNodeBag(gqlNodes)
  }

  async removeUserStorageDir(dirPath: string): Promise<StorageNodeBag> {
    const gqlNodes = await api.removeUserStorageDir(dirPath)
    return toStorageNodeBag(gqlNodes)
  }

  newUserUploadManager(owner: Element): StorageUploadManager {
    return new UserStorageUploadManager(owner)
  }

  newAdminUploadManager(owner: Element): StorageUploadManager {
    return new AdminStorageUploadManager(owner)
  }
}

export { StorageUploadManager }
