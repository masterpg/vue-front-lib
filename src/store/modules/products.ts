import Shop, { Product as ApiProduct } from '../../api/shop-api';
import { ActionContext } from 'vuex';
import { DECREMENT_PRODUCT_INVENTORY, GET_ALL_PRODUCTS, ProductsState, RootState, SET_PRODUCTS } from '../base';

//----------------------------------------------------------------------
//
//  State
//
//----------------------------------------------------------------------

const __state: ProductsState = {
  all: [],
};

//----------------------------------------------------------------------
//
//  Getters
//
//----------------------------------------------------------------------

const __getters = {
  allProducts: (state: ProductsState) => state.all,
};

//----------------------------------------------------------------------
//
//  Mutations
//
//----------------------------------------------------------------------

const __mutations = {
  [SET_PRODUCTS](state: ProductsState, products: ApiProduct[]) {
    state.all = products;
  },

  [DECREMENT_PRODUCT_INVENTORY](state: ProductsState, productId: number) {
    const product = state.all.find((item) => item.id === productId);
    if (product) {
      product.inventory--;
    }
  },
};

//----------------------------------------------------------------------
//
//  Actions
//
//----------------------------------------------------------------------

const __actions = {
  [GET_ALL_PRODUCTS](context: ActionContext<ProductsState, RootState>): Promise<void> {
    return Shop.getProducts().then((products) => {
      context.commit(SET_PRODUCTS, products);
    });
  },
};

//----------------------------------------------------------------------
//
//  Export
//
//----------------------------------------------------------------------

const ProductsModule = {
  state: __state,
  getters: __getters,
  mutations: __mutations,
  actions: __actions,
};
export default ProductsModule;
