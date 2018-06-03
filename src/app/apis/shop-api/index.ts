import Component from 'vue-class-component';
import { BaseApi } from '../base';
import { Product, ShopApi } from '../types';

@Component
class ShopApiImpl extends BaseApi implements ShopApi {
  async getProducts(): Promise<Product[]> {
    const response = await this.get<Product[]>('products');
    return response.data;
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
