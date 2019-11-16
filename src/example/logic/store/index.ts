import { BaseStoreContainer, setStore } from '@/lib'
import { CartModule, ProductModule } from '@/example/logic/store/types'
import { CartModuleImpl } from '@/example/logic/store/modules/cart'
import { Component } from 'vue-property-decorator'
import { ProductModuleImpl } from '@/example/logic/store/modules/product'

//========================================================================
//
//  Internal
//
//========================================================================

@Component
class StoreContainer extends BaseStoreContainer {
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
  store = new StoreContainer()
  setStore(store)
}

export * from '@/example/logic/store/types'
