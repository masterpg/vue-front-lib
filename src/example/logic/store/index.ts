import { CartStore, CartStoreImpl } from './cart'
import { LibStoreContainer, LibStoreContainerImpl, setStore } from '@/lib'
import { ProductStore, ProductStoreImpl } from './product'
import { Component } from 'vue-property-decorator'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface StoreContainer extends LibStoreContainer {
  readonly product: ProductStore
  readonly cart: CartStore
}

//========================================================================
//
//  Implementation
//
//========================================================================

@Component
class StoreContainerImpl extends LibStoreContainerImpl implements StoreContainer {
  readonly product: ProductStore = new ProductStoreImpl()
  readonly cart: CartStore = new CartStoreImpl()
}

let store: StoreContainer

function initStore(): void {
  store = new StoreContainerImpl()
  setStore(store)
}

//========================================================================
//
//  Exports
//
//========================================================================

export * from './cart'
export * from './product'
export { StoreContainer, store, initStore }
