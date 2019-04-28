import Vue from 'vue'
import {Component} from 'vue-property-decorator'

import {CartModule, ProductModule, Store} from '@/store/types'
import {CartModuleImpl} from '@/store/modules/cart'
import {ProductModuleImpl} from '@/store/modules/product'

@Component
export class StoreImpl extends Vue implements Store {
  readonly product: ProductModule = new ProductModuleImpl()
  readonly cart: CartModule = new CartModuleImpl()
}

export let store: Store

export function initStore(): void {
  store = new StoreImpl()
}

export * from '@/store/types'
