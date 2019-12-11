import { AppStorageStore, StorageStore, UserStorageStore, UserStore } from './types'
import { AppStorageStoreImpl, UserStorageStoreImpl } from './modules/storage'
import { UserStoreImpl } from './modules/user'
import Vue from 'vue'

//========================================================================
//
//  Exports
//
//========================================================================

export interface LibStoreContainer {
  readonly user: UserStore
  readonly userStorage: UserStorageStore
  readonly appStorage: AppStorageStore
}

export abstract class BaseStoreContainer extends Vue implements LibStoreContainer {
  readonly user: UserStore = new UserStoreImpl()
  readonly userStorage: UserStorageStore = new UserStorageStoreImpl()
  readonly appStorage: AppStorageStore = new AppStorageStoreImpl()
}

export let store: LibStoreContainer

export function setStore(value: LibStoreContainer): void {
  store = value
}

export {
  AppStorageStore,
  StatePartial,
  StorageNode,
  StorageNodeType,
  StorageState,
  StorageStore,
  StoreError,
  User,
  UserStorageStore,
  UserStore,
} from './types'

export { BaseStore } from './base'

export { UserStoreImpl, UserStorageStoreImpl, AppStorageStoreImpl }
