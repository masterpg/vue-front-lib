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
  let instance: StoreContainer

  export function useStore(stores?: StoreContainer): StoreContainer {
    instance = stores ?? instance ?? newRawInstance()
    return instance
  }

  export function newRawInstance() {
    const user = UserStore.newRawInstance()
    const storage = StorageStore.newRawInstance()
    return { user, storage }
  }
}

//========================================================================
//
//  Export
//
//========================================================================

const { useStore } = StoreContainer
export { StoreContainer, useStore }
