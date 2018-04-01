import { Store } from "vuex";
import { Product as ApiProduct } from "../../api/shop";

//================================================================================
//
//  Commons
//
//================================================================================

export interface IVuexStore extends Store<RootState> {}

export abstract class BaseManager {
  constructor(store: IVuexStore) {
    this.store = store;
  }

  readonly store: IVuexStore;
}

//================================================================================
//
//  States
//
//================================================================================

export interface RootState {
  cart: CartState;
  products: ProductsState;
}

export interface CartState {
  added: { id: number, quantity: number }[];
  checkoutStatus: string | null;
}

export interface ProductsState {
  all: Product[];
}

//================================================================================
//
//  Entities
//
//================================================================================

export type Product = ApiProduct;
