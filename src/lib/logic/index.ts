import {
  AppStorageLogic,
  AppStorageLogicImpl,
  StorageDownloader,
  StorageFileUploader,
  StorageLogic,
  StorageUploader,
  UserStorageLogic,
  UserStorageLogicImpl,
} from './modules/storage'
import { AuthLogic, AuthLogicImpl } from './modules/auth'
import Vue from 'vue'

//========================================================================
//
// Interfaces
//
//========================================================================

interface LibLogicContainer {
  readonly userStorage: UserStorageLogic
  readonly appStorage: AppStorageLogic
  readonly auth: AuthLogic
}

//========================================================================
//
// Implementation
//
//========================================================================

abstract class BaseLogicContainer extends Vue implements LibLogicContainer {
  constructor() {
    super()

    this.userStorage = this.newUserStorageLogic()
    this.appStorage = this.newAppStorageLogic()
    this.auth = this.newAuthLogic()
  }

  readonly userStorage: UserStorageLogic
  readonly appStorage: AppStorageLogic
  readonly auth: AuthLogic

  protected newUserStorageLogic(): UserStorageLogic {
    return new UserStorageLogicImpl()
  }

  protected newAppStorageLogic(): AppStorageLogic {
    return new AppStorageLogicImpl()
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
export { AppStorageLogic, StorageFileUploader, StorageLogic, StorageDownloader, StorageUploader, UserStorageLogic } from './modules/storage'
export { AuthLogic, AuthProviderType } from './modules/auth'
export { LibLogicContainer, BaseLogicContainer, logic, setLogic }
