import Component from 'vue-class-component';
import { BaseApi } from '../base';
import { Product, ShopApi } from '../types';

import axios from 'axios';

const SAMPLE_DATA: Product[] = [
  { id: 1, title: 'iPad 4 Mini', price: 500.01, inventory: 2 },
  { id: 2, title: 'H&M T-Shirt White', price: 10.99, inventory: 10 },
  { id: 3, title: 'Charli XCX - Sucker CD', price: 19.99, inventory: 5 },
];

@Component
class ShopApiImpl extends BaseApi implements ShopApi {
  async getProducts(): Promise<Product[]> {
    const apiInfo = this.$config.apiInfo;
    const url = `${apiInfo.protocol}://${apiInfo.host}:${apiInfo.port}/api/products`;
    const response = await axios.get(url, {});
    return response.data as Product[];
  }

  buyProducts(products: Array<{ id: number, quantity: number }>): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // simulate random checkout failure.
        (Math.random() > 0.5 || navigator.userAgent.indexOf('PhantomJS') > -1)
          ? resolve()
          : reject();
      }, 100);
    });
  }
}

const shopApi: ShopApi = new ShopApiImpl();
export default shopApi;
