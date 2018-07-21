import Vue from 'vue';
import { newAuthStore } from './auth-store';
import { newCartStore } from './cart-store';
import { newProductStore } from './product-store';
import { AuthStore, CartStore, ProductStore, Stores } from './types';
import { Component } from 'vue-property-decorator';

const debug = process.env.NODE_ENV !== 'production';

@Component
class StoresImpl extends Vue implements Stores {
  constructor() {
    super();
    this.m_auth = newAuthStore();
    this.m_product = newProductStore();
    this.m_cart = newCartStore();
  }

  m_auth: AuthStore;

  get auth(): AuthStore {
    return this.m_auth;
  }

  m_product: ProductStore;

  get product(): ProductStore {
    return this.m_product;
  }

  m_cart: CartStore;

  get cart(): CartStore {
    return this.m_cart;
  }
}

export function init(): void {
  Object.defineProperty(Vue.prototype, '$stores', {
    value: new StoresImpl(),
    writable: false,
  });
}
