import { ADD_PRODUCT_TO_CART, BaseManager, CartGetters, CartProduct, CHECKOUT, CheckoutStatus, Product } from '../base';

export default class CartManager extends BaseManager implements CartGetters {

  get checkoutStatus(): CheckoutStatus { return (this._store.getters as CartGetters).checkoutStatus; }

  get cartProducts(): CartProduct[] { return (this._store.getters as CartGetters).cartProducts; }

  get cartTotalPrice(): number { return (this._store.getters as CartGetters).cartTotalPrice; }

  addProductToCart(product: Product): Promise<void> {
    return this._store.dispatch(ADD_PRODUCT_TO_CART, product);
  }

  checkout(products: Product[]): Promise<void> {
    return this._store.dispatch(CHECKOUT, products);
  }
}
