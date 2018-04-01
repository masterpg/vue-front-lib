import Shop, { Product as ApiProduct } from '../../api/shop';
import { ActionContext } from 'vuex';
import { BaseManager, Product, ProductsState, RootState } from './base';

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

const state: ProductsState = {
  all: [],
};

//----------------------------------------------------------------------
//
//  Getters
//
//----------------------------------------------------------------------

interface ProductsGetters {
  readonly allProducts: Product[];
}

const getters = {
  allProducts: (state: ProductsState) => state.all,
};

//----------------------------------------------------------------------
//
//  Actions
//
//----------------------------------------------------------------------

const actions = {
  getAllProducts(context: ActionContext<ProductsState, RootState>): Promise<void> {
    return Shop.getProducts().then((products) => {
      context.commit('setProducts', products);
    });
  },
};

//----------------------------------------------------------------------
//
//  Mutations
//
//----------------------------------------------------------------------

const mutations = {
  setProducts(state: ProductsState, products: ApiProduct[]) {
    state.all = products;
  },

  decrementProductInventory(state: ProductsState, { id }: { id: number }) {
    const product = state.all.find(item => item.id === id);
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
  state,
  getters,
  actions,
  mutations,
};

//================================================================================
//
//  Manager
//
//================================================================================

export class ProductsManager extends BaseManager implements ProductsState, ProductsGetters {

  get all(): Product[] { return this.store.state.products.all; }

  get allProducts(): Product[] { return this.store.getters.allProducts; }

  getAllProducts(): Promise<void> { return this.store.dispatch('getAllProducts'); }

  decrementProductInventory(): void { this.store.commit('decrementProductInventory'); }
}
