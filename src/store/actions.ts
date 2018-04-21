import { FunctionContext, Product } from './base';

export const GET_ALL_PRODUCTS = 'getAllProducts';

export function getAllProducts(context: FunctionContext): Promise<void> {
  return context.dispatch(GET_ALL_PRODUCTS);
}

export const CHECKOUT = 'checkout';

export function checkout(context: FunctionContext, products: Product[]): Promise<void> {
  return context.dispatch(CHECKOUT, products);
}

export const ADD_PRODUCT_TO_CART = 'addProductToCart';

export function addProductToCart(context: FunctionContext, product: Product): Promise<void> {
  return context.dispatch(ADD_PRODUCT_TO_CART, product);
}
