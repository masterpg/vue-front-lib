import { CheckoutStatus, FunctionContext } from './base';
import { Product as ApiProduct } from '../api/shop-api';

export const SET_PRODUCTS = 'setProducts';

export function setProducts(context: FunctionContext, products: ApiProduct[]): void {
  context.commit(SET_PRODUCTS, products);
}

export const DECREMENT_PRODUCT_INVENTORY = 'decrementProductInventory';

export function decrementProductInventory(context: FunctionContext, productId: number): void {
  context.commit(DECREMENT_PRODUCT_INVENTORY, productId);
}

export const PUSH_PRODUCT_TO_CART = 'pushProductToCart';

export function pushProductToCart(context: FunctionContext, productId: number): void {
  context.commit(PUSH_PRODUCT_TO_CART, productId);
}

export const INCREMENT_ITEM_QUANTITY = 'incrementItemQuantity';

export function incrementItemQuantity(context: FunctionContext, productId: number): void {
  context.commit(INCREMENT_ITEM_QUANTITY, productId);
}

export const SET_CART_ITEMS = 'setCartItems';

export function setCartItems(context: FunctionContext, items: Array<{ id: number, quantity: number }>): void {
  context.commit(SET_CART_ITEMS, items);
}

export const SET_CHECKOUT_STATUS = 'setCheckoutStatus';

export function setCheckoutStatus(context: FunctionContext, status: CheckoutStatus): void {
  context.commit(SET_CHECKOUT_STATUS, status);
}
