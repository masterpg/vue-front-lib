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
import { AuthLogic, AuthProviderType } from './types'
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

export { BaseLogic } from './base'
export { AppStorageLogic, AuthLogic, AuthProviderType, StorageFileUploader, StorageLogic, StorageDownloader, StorageUploader, UserStorageLogic }
