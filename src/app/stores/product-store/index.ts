import { BaseStore } from '../base';
import { Component } from 'vue-property-decorator';
import { NoCache } from '../../components/decorators';
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
    return this.cloneDeep(this.state.all);
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  getProductById(productId: number): Product | null {
    const result = this.state.all.find((item) => {
      return item.id === productId;
    }) || null;
    return this.cloneDeep(result);
  }

  decrementProductInventory(productId: number): void {
    const product = this.state.all.find((item) => item.id === productId);
    if (product) {
      product.inventory--;
    }
  }

  async getAllProducts(): Promise<void> {
    const products = await this.$apis.shop.getProducts();
    this.state.all = products;
  }

}

const productStore: ProductStore = new ProductStoreImpl();
export default productStore;
