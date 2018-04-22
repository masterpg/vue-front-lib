import Vue from 'vue';
import Vuex from 'vuex';
import createLogger from 'vuex/dist/logger';

import { RootState } from './states';
import { VuexStore } from './base';
import cartModule from './modules/cart-module';
import productsModule from './modules/products-module';
import CartFacade from './facades/cart-facade';
import ProductsFacade from './facades/products-facade';

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
  export const products = new ProductsFacade(vuexStore);
  export const cart = new CartFacade(vuexStore);
}
export default appStore;
