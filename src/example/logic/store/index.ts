import { CartStore, CartStoreImpl } from '@/example/logic/store/cart'
import { ProductStore, ProductStoreImpl } from '@/example/logic/store/product'
import { StorageStore, StorageStoreImpl } from '@/example/logic/store/storage'
import { UserStore, UserStoreImpl } from '@/example/logic/store/user'
import { Component } from 'vue-property-decorator'
import Vue from 'vue'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface StoreContainer {
  readonly user: UserStore
  readonly storage: StorageStore
  readonly product: ProductStore
  readonly cart: CartStore
}

//========================================================================
//
//  Implementation
//
//========================================================================

@Component
class StoreContainerImpl extends Vue implements StoreContainer {
  readonly user: UserStore = new UserStoreImpl()
  readonly storage: StorageStore = new StorageStoreImpl()
  readonly product: ProductStore = new ProductStoreImpl()
  readonly cart: CartStore = new CartStoreImpl()
}

let store: StoreContainer

function initStore(): void {
  store = new StoreContainerImpl()
}

//========================================================================
//
//  Exports
//
//========================================================================

export { StoreContainer, store, initStore }
export * from '@/example/logic/store/user'
export * from '@/example/logic/store/storage'
export * from '@/example/logic/store/cart'
export * from '@/example/logic/store/product'
