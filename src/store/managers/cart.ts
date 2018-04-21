import { BaseManager, CartGetters, CartProduct, CheckoutStatus, Product } from '../base';
import * as actions from '../actions';

export default class CartManager extends BaseManager implements CartGetters {

  get checkoutStatus(): CheckoutStatus {
    return (this._store.getters as CartGetters).checkoutStatus;
  }

  get cartProducts(): CartProduct[] {
    return (this._store.getters as CartGetters).cartProducts;
  }

  get cartTotalPrice(): number {
    return (this._store.getters as CartGetters).cartTotalPrice;
  }

  addProductToCart(product: Product): Promise<void> {
    return actions.addProductToCart(this._store, product);
  }

  checkout(products: Product[]): Promise<void> {
    return actions.checkout(this._store, products);
  }
}
