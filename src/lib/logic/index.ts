import { AuthLogic, StorageLogic } from './types'
import { StorageLogicImpl, StorageUploadManager } from './modules/storage'
import { AuthLogicImpl } from './modules/auth'
import Vue from 'vue'

//========================================================================
//
//  Exports
//
//========================================================================

export interface LibLogicContainer {
  readonly storage: StorageLogic

  readonly auth: AuthLogic
}

export abstract class BaseLibLogicContainer extends Vue implements LibLogicContainer {
  readonly storage: StorageLogic = new StorageLogicImpl()

  readonly auth: AuthLogic = new AuthLogicImpl()
}

export let logic: LibLogicContainer

export function setLogic(value: LibLogicContainer): void {
  logic = value
}

export { AuthLogic, AuthProviderType, StorageLogic } from './types'

export { BaseLogic } from './base'

export { StorageUploadManager }
