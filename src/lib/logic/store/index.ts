import { StorageStore, StorageStoreImpl } from './storage'
import { UserStore, UserStoreImpl } from './user'
import Vue from 'vue'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface LibStoreContainer {
  readonly user: UserStore
  readonly storage: StorageStore
}

//========================================================================
//
//  Implementation
//
//========================================================================

abstract class LibStoreContainerImpl extends Vue implements LibStoreContainer {
  readonly user: UserStore = new UserStoreImpl()
  readonly storage: StorageStore = new StorageStoreImpl()
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
export { UserStore, UserStoreImpl } from './user'
export { StorageState, StorageStore } from './storage'

export { LibStoreContainer, LibStoreContainerImpl, store, setStore }
