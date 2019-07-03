import { CartModule, ProductsModule, Store } from '@/store/types'
import { CartModuleImpl } from '@/store/modules/cart'
import { Component } from 'vue-property-decorator'
import { ProductsModuleImpl } from '@/store/modules/products'
import Vue from 'vue'

@Component
export class StoreImpl extends Vue implements Store {
  readonly products: ProductsModule = new ProductsModuleImpl()
  readonly cart: CartModule = new CartModuleImpl()
}

export let store: Store

export function initStore(): void {
  store = new StoreImpl()
}

export * from '@/store/types'
