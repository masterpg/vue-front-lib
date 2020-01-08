import { AppStorageLogic, AuthLogic, StorageLogic, UserStorageLogic } from './types'
import { AppStorageLogicImpl, StorageUploadManager, UserStorageLogicImpl } from './modules/storage'
import { AuthLogicImpl } from './modules/auth'
import Vue from 'vue'

//========================================================================
//
//  Exports
//
//========================================================================

export interface LibLogicContainer {
  readonly userStorage: UserStorageLogic
  readonly appStorage: AppStorageLogic
  readonly auth: AuthLogic
}

export abstract class BaseLogicContainer extends Vue implements LibLogicContainer {
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

export let logic: LibLogicContainer

export function setLogic(value: LibLogicContainer): void {
  logic = value
}

export { AppStorageLogic, AuthLogic, AuthProviderType, StorageLogic, UserStorageLogic } from './types'

export { BaseLogic } from './base'

export { StorageUploadManager, UserStorageLogicImpl, AppStorageLogicImpl, AuthLogicImpl }
