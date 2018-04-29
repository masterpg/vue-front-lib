import Vue from 'vue';
import newCartModule from './modules/cart-module';
import newProductsModule from './modules/products-module';
import { AppStore, CartModule, ProductsModule } from './types';
import { Component } from 'vue-property-decorator';

const debug = process.env.NODE_ENV !== 'production';

@Component
class AppStoreImpl extends Vue implements AppStore {

  constructor() {
    super();
    this.m_products = newProductsModule();
    this.m_cart = newCartModule();
  }

  private m_products: ProductsModule;

  get products(): ProductsModule {
    return this.m_products;
  }

  private m_cart: CartModule;

  get cart(): CartModule {
    return this.m_cart;
  }

}

export const appStore: AppStore = new AppStoreImpl();
