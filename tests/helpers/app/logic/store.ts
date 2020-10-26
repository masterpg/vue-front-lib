import { StorageStore } from '@/app/logic/store/storage'
import { StoreContainer } from '@/app/logic/store'
import { UserStore } from '@/app/logic/store/user'

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
