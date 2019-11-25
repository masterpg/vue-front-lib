import { StorageModule, UserModule } from './types'
import { StorageModuleImpl } from './modules/storage'
import { UserModuleImpl } from './modules/user'
import Vue from 'vue'

//========================================================================
//
//  Exports
//
//========================================================================

export interface LibStoreContainer {
  readonly user: UserModule
  readonly storage: StorageModule
}

export abstract class BaseLibStoreContainer extends Vue implements LibStoreContainer {
  readonly user: UserModule = new UserModuleImpl()
  readonly storage: StorageModule = new StorageModuleImpl()
}

export let store: LibStoreContainer

export function setStore(value: LibStoreContainer): void {
  store = value
}

export { StatePartial, StorageNode, StorageNodeType, StorageState, StoreError, User, UserModule, UserState } from './types'

export { BaseModule } from './base'
