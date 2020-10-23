import { StorageStoreImpl } from '@/app/logic/store/storage'
import { StoreContainer } from '@/app/logic/store'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface TestStoreContainer extends StoreContainer {
  readonly storage: StorageStoreImpl
}

//========================================================================
//
//  Exports
//
//========================================================================

export { TestStoreContainer }
