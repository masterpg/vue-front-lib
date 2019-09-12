import { StorageLogic, StorageNodeBag } from '@/logic'
import { StorageUploadManager, toStorageNodeBag } from '@/logic/modules/storage/base'
import { BaseLogic } from '@/logic/base'
import { Component } from 'vue-property-decorator'
import { config } from '@/base/config'
import { gql } from '@/gql'

@Component
export class StorageLogicImpl extends BaseLogic implements StorageLogic {
  toURL(path: string): string {
    path = path.replace(/^\//, '')
    return `${config.api.baseURL}/storage/${path}`
  }

  async getUserNodes(dirPath?: string): Promise<StorageNodeBag> {
    const gqlNodes = await gql.userStorageNodes(dirPath)
    return toStorageNodeBag(gqlNodes)
  }

  async createStorageDir(dirPath: string): Promise<StorageNodeBag> {
    const gqlNodes = await gql.createStorageDir(dirPath)
    return toStorageNodeBag(gqlNodes)
  }

  async removeStorageNodes(nodePaths: string[]): Promise<StorageNodeBag> {
    const gqlNodes = await gql.removeStorageNodes(nodePaths)
    return toStorageNodeBag(gqlNodes)
  }

  newUploadManager(owner: Element): StorageUploadManager {
    return new StorageUploadManager(owner)
  }
}

export { StorageUploadManager }
