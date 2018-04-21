import { BaseManager } from '../base';
import { Product } from '../entities';
import { ProductsGetters } from '../getters';
import { actions } from '../actions';
import { mutations } from '../mutations';

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
