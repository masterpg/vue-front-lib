import { Commit, Dispatch, Store } from 'vuex';
import { Product as ApiProduct } from '../api/shop-api';

//----------------------------------------------------------------------
//
//  Externals
//
//----------------------------------------------------------------------

//--------------------------------------------------
//  Entities
//--------------------------------------------------

export type Product = ApiProduct;

export interface CartProduct {
  id: number;
  title: string;
  price: number;
  quantity: number;
}

//--------------------------------------------------
//  Enumerations
//--------------------------------------------------

export enum CheckoutStatus {
  None = 'none',
  Failed = 'failed',
  Successful = 'successful',
}

//----------------------------------------------------------------------
//
//  Managers
//
//----------------------------------------------------------------------

export abstract class BaseManager {
  constructor(store: VuexStore) {
    this._store = store;
  }

  readonly _store: VuexStore;
}

//----------------------------------------------------------------------
//
//  Vuex
//
//----------------------------------------------------------------------

export interface VuexStore extends Store<RootState> {}

//--------------------------------------------------
//  States
//--------------------------------------------------

export interface RootState {
  cart: CartState;
  products: ProductsState;
}

export interface CartState {
  added: Array<{ id: number, quantity: number }>;
  checkoutStatus: CheckoutStatus;
}

export interface ProductsState {
  all: Product[];
}

//--------------------------------------------------
//  Getters
//--------------------------------------------------

export interface CartGetters {
  readonly checkoutStatus: CheckoutStatus;
  readonly cartProducts: CartProduct[];
  readonly cartTotalPrice: number;
}

export interface ProductsGetters {
  readonly allProducts: Product[];
}

//--------------------------------------------------
//  Mutations, Actions
//--------------------------------------------------

export interface FunctionContext {
  dispatch: Dispatch;
  commit: Commit;
}
