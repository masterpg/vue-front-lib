import { CartStore, CartStoreImpl } from '@/app/logic/store/cart'
import { ProductStore, ProductStoreImpl } from '@/app/logic/store/product'
import { StorageStore, StorageStoreImpl } from '@/app/logic/store/storage'
import { UserStore, UserStoreImpl } from '@/app/logic/store/user'
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
export * from '@/app/logic/store/user'
export * from '@/app/logic/store/storage'
export * from '@/app/logic/store/cart'
export * from '@/app/logic/store/product'
