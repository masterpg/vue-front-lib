import shopApi, { Product as ApiProduct } from '../../api/shop-api';
import { BaseModule } from './base';
import { Component } from 'vue-property-decorator';
import { NoCache } from '../../components/decorators';
import { Product, ProductsModule } from '../types';

export default function newProductsModule(): ProductsModule {
  return new ProductsModuleImpl();
}

interface ProductsState {
  all: Product[];
}

@Component
class ProductsModuleImpl extends BaseModule<ProductsState>
  implements ProductsModule {

  //----------------------------------------------------------------------
  //
  //  Constructors
  //
  //----------------------------------------------------------------------

  constructor() {
    super();
    this.init({
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

  setProducts(products: ApiProduct[]): void {
    this.state.all = products;
  }

  decrementProductInventory(productId: number): void {
    const product = this.state.all.find((item) => item.id === productId);
    if (product) {
      product.inventory--;
    }
  }

  async getAllProducts(): Promise<void> {
    const products = await shopApi.getProducts();
    this.setProducts(products);
  }

}
