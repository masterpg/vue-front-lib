import { AppStorageLogic, UserStorageLogic } from '../../types'
import { AppStorageStore, UserStorageStore, store } from '../../store'
import { AppStorageUploadManager } from './app-upload'
import { BaseStorageLogic } from './base-storage'
import { Component } from 'vue-property-decorator'
import { StorageUploadManager } from './base-upload'
import { UserStorageUploadManager } from './user-upload'
import { UserStorageUrlUploadManager } from './user-upload-by-url'

@Component
export class UserStorageLogicImpl extends BaseStorageLogic implements UserStorageLogic {
  protected get storageStore(): UserStorageStore {
    return store.userStorage
  }

  newUploadManager(owner: Element): StorageUploadManager {
    return new UserStorageUploadManager(owner)
  }

  newUrlUploadManager(owner: Element): StorageUploadManager {
    return new UserStorageUrlUploadManager(owner)
  }
}

@Component
export class AppStorageLogicImpl extends BaseStorageLogic implements AppStorageLogic {
  protected get storageStore(): AppStorageStore {
    return store.appStorage
  }

  newUploadManager(owner: Element): StorageUploadManager {
    return new AppStorageUploadManager(owner)
  }
}

export { StorageUploadManager }
