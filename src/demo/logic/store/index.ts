import { StoreContainer, injectStore as _injectStore, provideStore as _provideStore } from '@/app/logic/store'
import { CartStore } from '@/demo/logic/store/cart'
import { ProductStore } from '@/demo/logic/store/product'

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

function provideStore(store: DemoStoreContainer): void {
  _provideStore(store)
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
