import { AppStorageStore, AppStorageStoreImpl, UserStorageStore, UserStorageStoreImpl } from './storage'
import { UserStore, UserStoreImpl } from './user'
import Vue from 'vue'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface LibStoreContainer {
  readonly user: UserStore
  readonly userStorage: UserStorageStore
  readonly appStorage: AppStorageStore
}

//========================================================================
//
//  Implementation
//
//========================================================================

abstract class LibStoreContainerImpl extends Vue implements LibStoreContainer {
  readonly user: UserStore = new UserStoreImpl()
  readonly userStorage: UserStorageStore = new UserStorageStoreImpl()
  readonly appStorage: AppStorageStore = new AppStorageStoreImpl()
}

let store: LibStoreContainer

function setStore(value: LibStoreContainer): void {
  store = value
}

//========================================================================
//
//  Exports
//
//========================================================================

export { BaseStore, StatePartial, StoreError } from './base'
export { User, UserStore, UserStoreImpl } from './user'
export { AppStorageStore, AppStorageStoreImpl, StorageState, StorageStore, UserStorageStore, UserStorageStoreImpl } from './storage'

export { LibStoreContainer, LibStoreContainerImpl, store, setStore }
