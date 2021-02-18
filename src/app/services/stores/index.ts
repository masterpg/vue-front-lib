import { StorageStore } from '@/app/services/stores/storage'
import { UserStore } from '@/app/services/stores/user'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface StoreContainer {
  readonly user: UserStore
  readonly storage: StorageStore
}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace StoreContainer {
  export function newInstance(): StoreContainer {
    return newRawInstance()
  }

  export function newRawInstance() {
    const user = UserStore.newRawInstance()
    const storage = StorageStore.newRawInstance()
    return { user, storage }
  }
}

//========================================================================
//
//  Dependency Injection
//
//========================================================================

let instance: StoreContainer

function provideStore(store: StoreContainer): void {
  instance = store
}

function injectStore(): StoreContainer {
  if (!instance) {
    throw new Error(`'StoreContainer' is not provided`)
  }
  return instance
}

//========================================================================
//
//  Export
//
//========================================================================

export { StoreContainer, provideStore, injectStore }
