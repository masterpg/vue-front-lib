import * as actions from '../actions';
import * as mutations from '../mutations';
import { BaseManager, Product, ProductsGetters } from '../base';

export default class ProductsManager extends BaseManager implements ProductsGetters {

  get allProducts(): Product[] {
    return this._store.getters.allProducts;
  }

  getAllProducts(): Promise<void> {
    return actions.getAllProducts(this._store);
  }

  decrementProductInventory(productId: number): void {
    mutations.decrementProductInventory(this._store, productId);
  }
}
