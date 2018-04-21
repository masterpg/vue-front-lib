import Vue from 'vue';
import Vuex from 'vuex';
import createLogger from 'vuex/dist/logger';

import { IVuexStore, RootState } from './base';
import CartModule from './modules/cart';
import ProductsModule from './modules/products';
import CartManager from './managers/cart';
import ProductsManager from './managers/products';

Vue.use(Vuex);

const debug = process.env.NODE_ENV !== 'production';

export const VuexStore: IVuexStore = new Vuex.Store<RootState>({
  modules: {
    cart: CartModule,
    products: ProductsModule,
  },
  strict: debug,
  plugins: debug ? [createLogger({})] : [],
});

namespace AppStore {
  export const products = new ProductsManager(VuexStore);
  export const cart = new CartManager(VuexStore);
}
export default AppStore;
