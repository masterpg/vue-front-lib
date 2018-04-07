import Shop, { Product as ApiProduct } from '../../api/shop';
import { ActionContext } from 'vuex';
import { BaseManager, DECREMENT_PRODUCT_INVENTORY, GET_ALL_PRODUCTS, Product, ProductsGetters, ProductsState, RootState, SET_PRODUCTS } from './base';

//================================================================================
//
//  Module
//
//================================================================================

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
//  Mutations
//
//----------------------------------------------------------------------

const __mutations = {
  [SET_PRODUCTS](state: ProductsState, products: ApiProduct[]) {
    state.all = products;
  },

  [DECREMENT_PRODUCT_INVENTORY](state: ProductsState, { id }: { id: number }) {
    const product = state.all.find((item) => item.id === id);
    if (product) {
      product.inventory--;
    }
  },
};

//----------------------------------------------------------------------
//
//  Export
//
//----------------------------------------------------------------------

export const ProductsModule = {
  state: __state,
  getters: __getters,
  actions: __actions,
  mutations: __mutations,
};

//================================================================================
//
//  Manager
//
//================================================================================

export class ProductsManager extends BaseManager implements ProductsState, ProductsGetters {

  get all(): Product[] { return this.store.state.products.all; }

  get allProducts(): Product[] { return this.store.getters.allProducts; }

  getAllProducts(): Promise<void> { return this.store.dispatch(GET_ALL_PRODUCTS); }

  decrementProductInventory(): void { this.store.commit(DECREMENT_PRODUCT_INVENTORY); }
}
