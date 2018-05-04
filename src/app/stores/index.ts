import Vue from 'vue';
import cartStore from './cart-store';
import productStore from './product-store';
import { Stores, CartStore, ProductStore } from './types';
import { Component } from 'vue-property-decorator';

const debug = process.env.NODE_ENV !== 'production';

@Component
class StoresImpl extends Vue implements Stores {

  constructor() {
    super();
    this.m_product = productStore;
    this.m_cart = cartStore;
  }

  private m_product: ProductStore;

  get product(): ProductStore {
    return this.m_product;
  }

  private m_cart: CartStore;

  get cart(): CartStore {
    return this.m_cart;
  }

}

export function init(): void {
  Object.defineProperty(
    Vue.prototype, '$stores', {
      value: new StoresImpl(),
      writable: false,
    },
  );
}

