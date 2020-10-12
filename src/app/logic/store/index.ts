import { InjectionKey, inject, provide } from '@vue/composition-api'
import { UserStore, createUserStore } from '@/app/logic/store/user'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface StoreContainer {
  readonly user: UserStore
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

export { StoreContainer, StoreKey, createStore, provideStore, injectStore, validateStoreProvided }
