import { AccountModule, CartModule, ProductsModule, Store } from '@/store/types'
import { AccountModuleImpl } from '@/store/modules/auth'
import { CartModuleImpl } from '@/store/modules/cart'
import { Component } from 'vue-property-decorator'
import { ProductsModuleImpl } from '@/store/modules/products'
import Vue from 'vue'

@Component
export class StoreImpl extends Vue implements Store {
  readonly products: ProductsModule = new ProductsModuleImpl()
  readonly cart: CartModule = new CartModuleImpl()
  readonly account: AccountModule = new AccountModuleImpl()
}

export let store: Store

export function initStore(): void {
  store = new StoreImpl()
}

export * from '@/store/types'
