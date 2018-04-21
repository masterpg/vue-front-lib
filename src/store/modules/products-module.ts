import shopApi, { Product as ApiProduct } from '../../api/shop-api';
import { ActionContext } from '../base';
import { DECREMENT_PRODUCT_INVENTORY, mutations, SET_PRODUCTS } from '../mutations';
import { GET_ALL_PRODUCTS } from '../actions';
import { ProductsState, RootState } from '../states';
import { ProductsGetters } from '../getters';

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

type Context = ActionContext<ProductsState, RootState, ProductsGetters>;

const __actions = {
  [GET_ALL_PRODUCTS](context: Context): Promise<void> {
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
