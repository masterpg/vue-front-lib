import { CartStore } from '@/demo/logic/store/cart'
import { ProductStore } from '@/demo/logic/store/product'
import { StoreContainer } from '@/app/logic/store'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface DemoStoreContainer extends StoreContainer {
  readonly product: ProductStore
  readonly cart: CartStore
}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace DemoStoreContainer {
  export function newInstance(): DemoStoreContainer {
    return newRawInstance()
  }

  export function newRawInstance() {
    const base = StoreContainer.newRawInstance()

    return {
      ...base,
      product: ProductStore.newRawInstance(),
      cart: CartStore.newRawInstance(),
    }
  }
}

//========================================================================
//
//  Export
//
//========================================================================

export { DemoStoreContainer }
