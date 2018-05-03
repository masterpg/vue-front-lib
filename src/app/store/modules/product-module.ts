import shopApi, { Product as ApiProduct } from '../../api/shop-api';
import { BaseModule } from './base';
import { Component } from 'vue-property-decorator';
import { NoCache } from '../../components/decorators';
import { Product, ProductModule } from '../types';

export default function newProductModule(): ProductModule {
  return new ProductModuleImpl();
}

interface ProductState {
  all: Product[];
}

@Component
class ProductModuleImpl extends BaseModule<ProductState> implements ProductModule {

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

  decrementProductInventory(productId: number): void {
    const product = this.state.all.find((item) => item.id === productId);
    if (product) {
      product.inventory--;
    }
  }

  async getAllProducts(): Promise<void> {
    const products = await shopApi.getProducts();
    this.state.all = products;
  }

}
