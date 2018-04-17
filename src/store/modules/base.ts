import { Store } from 'vuex';
import { Product as ApiProduct } from '../../api/shop';

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
  added: Array<{ id: number, quantity: number }>;
  checkoutStatus: CheckoutStatus;
}

export interface ProductsState {
  all: Product[];
}

//================================================================================
//
//  Getters
//
//================================================================================

export interface CartGetters {
  readonly checkoutStatus: CheckoutStatus;
  readonly cartProducts: CartProduct[];
  readonly cartTotalPrice: number;
}

export interface ProductsGetters {
  readonly allProducts: Product[];
}

//================================================================================
//
//  Entities
//
//================================================================================

export type Product = ApiProduct;

export interface CartProduct {
  id: number;
  title: string;
  price: number;
  quantity: number;
}

//================================================================================
//
//  Constants
//
//================================================================================

//--------------------------------------------------
//  Action
//--------------------------------------------------

export const GET_ALL_PRODUCTS = 'getAllProducts';

export const CHECKOUT = 'checkout';

export const ADD_PRODUCT_TO_CART = 'addProductToCart';

//--------------------------------------------------
//  Mutation
//--------------------------------------------------

export const SET_PRODUCTS = 'setProducts';

export const DECREMENT_PRODUCT_INVENTORY = 'decrementProductInventory';

export const PUSH_PRODUCT_TO_CART = 'pushProductToCart';

export const INCREMENT_ITEM_QUANTITY = 'incrementItemQuantity';

export const SET_CART_ITEMS = 'setCartItems';

export const SET_CHECKOUT_STATUS = 'setCheckoutStatus';

//================================================================================
//
//  Enumerations
//
//================================================================================

export enum CheckoutStatus {
  None = 'none',
  Failed = 'failed',
  Successful = 'successful',
}
