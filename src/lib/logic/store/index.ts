import { StorageStore, UserStore } from './types'
import { StorageStoreImpl } from './modules/storage'
import { UserStoreImpl } from './modules/user'
import Vue from 'vue'

//========================================================================
//
//  Exports
//
//========================================================================

export interface LibStoreContainer {
  readonly user: UserStore
  readonly storage: StorageStore
}

export abstract class BaseStoreContainer extends Vue implements LibStoreContainer {
  readonly user: UserStore = new UserStoreImpl()
  readonly storage: StorageStore = new StorageStoreImpl()
}

export let store: LibStoreContainer

export function setStore(value: LibStoreContainer): void {
  store = value
}

export { StatePartial, StorageNode, StorageNodeType, StorageState, StorageStore, StoreError, User, UserStore } from './types'

export { BaseStore } from './base'

export { StorageStoreImpl, UserStoreImpl }
