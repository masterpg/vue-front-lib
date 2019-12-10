import { BaseStoreContainer, setStore } from '@/lib'
import { CartStore, ProductStore, StoreContainer } from '@/example/logic/store/types'
import { CartStoreImpl } from '@/example/logic/store/modules/cart'
import { Component } from 'vue-property-decorator'
import { ProductStoreImpl } from '@/example/logic/store/modules/product'

//========================================================================
//
//  Internal
//
//========================================================================

@Component
class StoreContainerImpl extends BaseStoreContainer implements StoreContainer {
  readonly product: ProductStore = new ProductStoreImpl()
  readonly cart: CartStore = new CartStoreImpl()
}

//========================================================================
//
//  Exports
//
//========================================================================

export let store: StoreContainer

export function initStore(): void {
  store = new StoreContainerImpl()
  setStore(store)
}

export * from '@/example/logic/store/types'
