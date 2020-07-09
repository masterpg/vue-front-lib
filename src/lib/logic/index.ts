import { AppStorageLogic, StorageDownloader, StorageFileUploader, StorageLogic, StorageUploader, UserStorageLogic } from './modules/storage'
import { AuthLogic, AuthLogicImpl } from './modules/auth'
import Vue from 'vue'

//========================================================================
//
// Interfaces
//
//========================================================================

interface LibLogicContainer {
  readonly appStorage: StorageLogic
  readonly userStorage: StorageLogic
  readonly auth: AuthLogic
}

//========================================================================
//
// Implementation
//
//========================================================================

abstract class BaseLogicContainer extends Vue implements LibLogicContainer {
  //----------------------------------------------------------------------
  //
  //  Constructor
  //
  //----------------------------------------------------------------------

  constructor() {
    super()

    this.appStorage = this.newAppStorageLogic()
    this.userStorage = this.newUserStorageLogic(this.appStorage)
    this.auth = this.newAuthLogic()
  }

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  readonly appStorage: StorageLogic

  readonly userStorage: StorageLogic

  readonly auth: AuthLogic

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  protected newAppStorageLogic(): StorageLogic {
    return new AppStorageLogic()
  }

  protected newUserStorageLogic(appStorage: StorageLogic): StorageLogic {
    const userStorage = new UserStorageLogic()
    userStorage.init(appStorage)
    return userStorage
  }

  protected newAuthLogic(): AuthLogic {
    return new AuthLogicImpl()
  }
}

let logic: LibLogicContainer

function setLogic(value: LibLogicContainer): void {
  logic = value
}

//========================================================================
//
//  Exports
//
//========================================================================

export * from './api'
export * from './store'
export { BaseLogic } from './base'
export * from './types'
export {
  BasePathStorageLogic,
  StorageDownloader,
  StorageFileUploader,
  StorageLogic,
  StorageUploader,
  StorageUrlUploadManager,
} from './modules/storage'
export { AuthLogic, AuthProviderType } from './modules/auth'
export { LibLogicContainer, BaseLogicContainer, logic, setLogic }
