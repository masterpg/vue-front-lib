import { BaseLibStoreContainer, setStore } from '@/lib'
import { CartModule, ProductModule, StoreContainer } from '@/example/logic/store/types'
import { CartModuleImpl } from '@/example/logic/store/modules/cart'
import { Component } from 'vue-property-decorator'
import { ProductModuleImpl } from '@/example/logic/store/modules/product'

//========================================================================
//
//  Internal
//
//========================================================================

@Component
class StoreContainerImpl extends BaseLibStoreContainer implements StoreContainer {
  readonly product: ProductModule = new ProductModuleImpl()
  readonly cart: CartModule = new CartModuleImpl()
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
