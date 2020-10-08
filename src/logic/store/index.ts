import { CartStore, createCartStore } from '@/logic/store/cart'
import { InjectionKey, inject, provide } from '@vue/composition-api'
import { ProductStore, createProductStore } from '@/logic/store/product'
import { UserStore, createUserStore } from '@/logic/store/user'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface StoreContainer {
  readonly user: UserStore
  readonly product: ProductStore
  readonly cart: CartStore
}

//========================================================================
//
//  Implementation
//
//========================================================================

const StoreKey: InjectionKey<StoreContainer> = Symbol('Store')

function createStore(): StoreContainer {
  return {
    user: createUserStore(),
    product: createProductStore(),
    cart: createCartStore(),
  }
}

function provideStore(store?: StoreContainer | typeof createStore): void {
  let instance: StoreContainer
  if (!store) {
    instance = createStore()
  } else {
    instance = typeof store === 'function' ? store() : store
  }
  provide(StoreKey, instance)
}

function injectStore(): StoreContainer {
  validateStoreProvided()
  return inject(StoreKey)!
}

function validateStoreProvided(): void {
  const value = inject(StoreKey)
  if (!value) {
    throw new Error(`${StoreKey.description} is not provided`)
  }
}

//========================================================================
//
//  Export
//
//========================================================================

export { StoreUtil } from '@/logic/store/base'
export { StoreContainer, StoreKey, createStore, provideStore, injectStore, validateStoreProvided }
