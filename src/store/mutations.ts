import { BehaviorContext } from './base';
import { Product as ApiProduct } from '../api/shop-api';
import { CheckoutStatus } from './entities';

export const SET_PRODUCTS = 'setProducts';
export const DECREMENT_PRODUCT_INVENTORY = 'decrementProductInventory';
export const PUSH_PRODUCT_TO_CART = 'pushProductToCart';
export const INCREMENT_ITEM_QUANTITY = 'incrementItemQuantity';
export const SET_CART_ITEMS = 'setCartItems';
export const SET_CHECKOUT_STATUS = 'setCheckoutStatus';

export const mutations = {

  [SET_PRODUCTS](context: BehaviorContext, products: ApiProduct[]): void {
    context.commit(SET_PRODUCTS, products);
  },

  [DECREMENT_PRODUCT_INVENTORY](context: BehaviorContext, productId: number): void {
    context.commit(DECREMENT_PRODUCT_INVENTORY, productId);
  },

  [PUSH_PRODUCT_TO_CART](context: BehaviorContext, productId: number): void {
    context.commit(PUSH_PRODUCT_TO_CART, productId);
  },

  [INCREMENT_ITEM_QUANTITY](context: BehaviorContext, productId: number): void {
    context.commit(INCREMENT_ITEM_QUANTITY, productId);
  },

  [SET_CART_ITEMS](context: BehaviorContext, items: Array<{ id: number, quantity: number }>): void {
    context.commit(SET_CART_ITEMS, items);
  },

  [SET_CHECKOUT_STATUS](context: BehaviorContext, status: CheckoutStatus): void {
    context.commit(SET_CHECKOUT_STATUS, status);
  },

};
