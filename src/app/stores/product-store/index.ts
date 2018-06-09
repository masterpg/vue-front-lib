import { BaseStore } from '../base';
import { Component } from 'vue-property-decorator';
import { NoCache } from '../../components';
import { Product, ProductStore } from '../types';

export interface ProductState {
  all: Product[];
}

@Component
class ProductStoreImpl extends BaseStore<ProductState> implements ProductStore {

  //----------------------------------------------------------------------
  //
  //  Constructors
  //
  //----------------------------------------------------------------------

  constructor() {
    super();
    this.initState({
      all: [],
    });
  }

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  @NoCache
  get allProducts(): Product[] {
    return this.$utils.cloneDeep(this.state.all);
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  getProductById(productId: number): Product | undefined {
    const stateProduct = this.getStateProductById(productId);
    return this.$utils.cloneDeep(stateProduct);
  }

  decrementProductInventory(productId: number): void {
    const stateProduct = this.getStateProductById(productId);
    if (stateProduct) {
      stateProduct.inventory--;
    }
  }

  async getAllProducts(): Promise<void> {
    const products = await this.$apis.shop.getProducts();
    this.state.all = products;
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  private getStateProductById(productId: number): Product | undefined {
    return this.state.all.find((item) => item.id === productId);
  }

}

const productStore: ProductStore = new ProductStoreImpl();
export default productStore;
