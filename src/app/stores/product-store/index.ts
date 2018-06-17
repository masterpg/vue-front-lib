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
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  created() {
    this.getAllProducts();
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  getProductById(productId: string): Product | undefined {
    const stateProduct = this.getStateProductById(productId);
    return this.$utils.cloneDeep(stateProduct);
  }

  decrementProductInventory(productId: string): void {
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

  private getStateProductById(productId: string): Product | undefined {
    return this.state.all.find((item) => item.id === productId);
  }
}

export function newProductStore(): ProductStore {
  return new ProductStoreImpl();
}
