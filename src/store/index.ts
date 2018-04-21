import Vue from 'vue';
import Vuex from 'vuex';
import createLogger from 'vuex/dist/logger';

import { VuexStore, RootState } from './base';
import cartModule from './modules/cart';
import productsModule from './modules/products';
import CartManager from './managers/cart';
import ProductsManager from './managers/products';

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
