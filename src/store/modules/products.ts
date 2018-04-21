import * as actions from '../actions';
import * as mutations from '../mutations';
import shopApi, { Product as ApiProduct } from '../../api/shop-api';
import { ActionContext } from 'vuex';
import { ProductsState, RootState } from '../base';

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
  [mutations.SET_PRODUCTS](state: ProductsState, products: ApiProduct[]) {
    state.all = products;
  },

  [mutations.DECREMENT_PRODUCT_INVENTORY](state: ProductsState, productId: number) {
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
  [actions.GET_ALL_PRODUCTS](context: ActionContext<ProductsState, RootState>): Promise<void> {
    return shopApi.getProducts().then((products) => {
      mutations.setProducts(context, products);
    });
  },
};

//----------------------------------------------------------------------
//
//  Export
//
//----------------------------------------------------------------------

const productsModule = {
  state: __state,
  getters: __getters,
  mutations: __mutations,
  actions: __actions,
};
export default productsModule;
