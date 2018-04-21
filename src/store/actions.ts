import { BehaviorContext } from './base';
import { Product } from './entities';

export const GET_ALL_PRODUCTS = 'getAllProducts';
export const CHECKOUT = 'checkout';
export const ADD_PRODUCT_TO_CART = 'addProductToCart';

export const actions = {

  [GET_ALL_PRODUCTS](context: BehaviorContext): Promise<void> {
    return context.dispatch(GET_ALL_PRODUCTS);
  },

  [CHECKOUT](context: BehaviorContext, products: Product[]): Promise<void> {
    return context.dispatch(CHECKOUT, products);
  },

  [ADD_PRODUCT_TO_CART](context: BehaviorContext, product: Product): Promise<void> {
    return context.dispatch(ADD_PRODUCT_TO_CART, product);
  },

};
