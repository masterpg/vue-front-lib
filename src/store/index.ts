import Vue from 'vue';
import newCartModule from './modules/cart-module';
import newProductModule from './modules/product-module';
import { AppStore, CartModule, ProductModule } from './types';
import { Component } from 'vue-property-decorator';

const debug = process.env.NODE_ENV !== 'production';

@Component
class AppStoreImpl extends Vue implements AppStore {

  constructor() {
    super();
    this.m_product = newProductModule();
    this.m_cart = newCartModule();
  }

  private m_product: ProductModule;

  get product(): ProductModule {
    return this.m_product;
  }

  private m_cart: CartModule;

  get cart(): CartModule {
    return this.m_cart;
  }

}

export const appStore: AppStore = new AppStoreImpl();
