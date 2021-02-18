import { StorageStore } from '@/app/services/stores/storage'
import { StoreContainer } from '@/app/services/stores'
import { UserStore } from '@/app/services/stores/user'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface TestStoreContainer extends StoreContainer {
  readonly user: ReturnType<typeof UserStore['newRawInstance']>
  readonly storage: ReturnType<typeof StorageStore['newRawInstance']>
}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace TestStoreContainer {
  export function newInstance(): TestStoreContainer {
    const base = StoreContainer.newRawInstance()
    return {
      ...base,
    }
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { TestStoreContainer }
