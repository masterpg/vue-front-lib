import { BaseManager, DECREMENT_PRODUCT_INVENTORY, GET_ALL_PRODUCTS, Product, ProductsGetters, ProductsState } from '../base';

export default class ProductsManager extends BaseManager implements ProductsState, ProductsGetters {

  get all(): Product[] { return this._store.state.products.all; }

  get allProducts(): Product[] { return this._store.getters.allProducts; }

  getAllProducts(): Promise<void> { return this._store.dispatch(GET_ALL_PRODUCTS); }

  decrementProductInventory(): void { this._store.commit(DECREMENT_PRODUCT_INVENTORY); }
}
