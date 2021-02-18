import { StoreContainer, injectStore as _injectStore, provideStore as _provideStore } from '@/app/services/stores'
import { CartStore } from '@/demo/services/stores/cart'
import { ProductStore } from '@/demo/services/stores/product'

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
//  Dependency Injection
//
//========================================================================

function provideStore(stores: DemoStoreContainer): void {
  _provideStore(stores)
}

function injectStore(): DemoStoreContainer {
  return _injectStore() as DemoStoreContainer
}

//========================================================================
//
//  Export
//
//========================================================================

export { DemoStoreContainer, provideStore, injectStore }
