import Vue from 'vue';
import Vuex from 'vuex';
import createLogger from 'vuex/dist/logger';

import { CartModule, CartManager } from './modules/cart';
import { ProductsModule, ProductsManager } from './modules/products';
import { IVuexStore, RootState } from "./modules/base";

Vue.use(Vuex);

const debug = process.env.NODE_ENV !== 'production';

export const VuexStore: IVuexStore = new Vuex.Store<RootState>({
  modules: {
    cart: CartModule,
    products: ProductsModule,
  },
  strict: debug,
  // plugins: debug ? [createLogger({})] : []
});

namespace AppStore {
  export const products = new ProductsManager(VuexStore);
  export const cart = new CartManager(VuexStore);
}
export default AppStore;

// export {
//   VuexStore,
//   AppStore,
// };
