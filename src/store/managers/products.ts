import { BaseManager, DECREMENT_PRODUCT_INVENTORY, GET_ALL_PRODUCTS, Product, ProductsGetters } from '../base';

export default class ProductsManager extends BaseManager implements ProductsGetters {

  get allProducts(): Product[] {
    return this._store.getters.allProducts;
  }

  getAllProducts(): Promise<void> {
    return this._store.dispatch(GET_ALL_PRODUCTS);
  }

  decrementProductInventory(productId: number): void {
    this._store.commit(DECREMENT_PRODUCT_INVENTORY, productId);
  }
}
