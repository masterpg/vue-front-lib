import Vue from 'vue'
import {newAuthModule} from '@/store/auth-module'
import {newCartModule} from '@/store/cart-module'
import {newProductModule} from '@/store/product-module'
import {AuthModule, AppStore, CartModule, ProductModule} from '@/store/types'
import {Component} from 'vue-property-decorator'

const debug = process.env.NODE_ENV !== 'production'

@Component
class AppStoreImpl extends Vue implements AppStore {
  constructor() {
    super()
    this.m_auth = newAuthModule()
    this.m_product = newProductModule()
    this.m_cart = newCartModule({product: this.product})
  }

  m_auth: AuthModule

  get auth(): AuthModule {
    return this.m_auth
  }

  m_product: ProductModule

  get product(): ProductModule {
    return this.m_product
  }

  m_cart: CartModule

  get cart(): CartModule {
    return this.m_cart
  }
}

export let appStore: AppStore

export function initStore(): void {
  appStore = new AppStoreImpl()
  Object.defineProperty(Vue.prototype, '$appStore', {
    value: appStore,
    writable: false,
  })
}

export * from '@/store/types'
