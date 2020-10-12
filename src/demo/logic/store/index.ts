import { CartStore, createCartStore } from '@/demo/logic/store/cart'
import { ProductStore, createProductStore } from '@/demo/logic/store/product'
import { StoreContainer, StoreKey, createStore as _createStore, validateStoreProvided } from '@/app/logic/store'
import { inject, provide } from '@vue/composition-api'

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

function createStore(): DemoStoreContainer {
  const base = _createStore()

  return {
    ...base,
    product: createProductStore(),
    cart: createCartStore(),
  }
}

function provideStore(store?: DemoStoreContainer | typeof createStore): void {
  let instance: DemoStoreContainer
  if (!store) {
    instance = createStore()
  } else {
    instance = typeof store === 'function' ? store() : store
  }
  provide(StoreKey, instance)
}

function injectStore(): DemoStoreContainer {
  validateStoreProvided()
  return inject(StoreKey)! as DemoStoreContainer
}

//========================================================================
//
//  Export
//
//========================================================================

export { DemoStoreContainer, StoreKey, createStore, provideStore, injectStore, validateStoreProvided }
