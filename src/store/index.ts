import Vue from 'vue';
import Vuex from 'vuex';
import createLogger from 'vuex/dist/logger';

import { RootState } from './states';
import { VuexStore } from './base';
import cartModule from './modules/cart-module';
import productsModule from './modules/products-module';
import CartManager from './managers/cart-manager';
import ProductsManager from './managers/products-manager';

Vue.use(Vuex);

const debug = process.env.NODE_ENV !== 'production';

export const vuexStore = new Vuex.Store<RootState>({
  modules: {
    cart: cartModule,
    products: productsModule,
  },
  strict: debug,
  plugins: debug ? [createLogger({})] : [],
}) as VuexStore;

namespace appStore {
  export const products = new ProductsManager(vuexStore);
  export const cart = new CartManager(vuexStore);
}
export default appStore;
