import { CartStore } from '@/demo/services/stores/cart'
import { ProductStore } from '@/demo/services/stores/product'
import { StoreContainer } from '@/app/services/stores'

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
  let instance: DemoStoreContainer

  export function useStore(stores?: DemoStoreContainer): DemoStoreContainer {
    instance = stores ?? instance ?? newRawInstance()
    return instance
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

const { useStore } = DemoStoreContainer
export { DemoStoreContainer, useStore }
