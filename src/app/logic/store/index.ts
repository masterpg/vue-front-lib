import { StorageStore } from '@/app/logic/store/storage'
import { UserStore } from '@/app/logic/store/user'

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
//  Export
//
//========================================================================

export { StoreContainer }
