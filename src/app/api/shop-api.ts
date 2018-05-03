/**
 * Mocking client-server processing
 */

const __products = [
  { id: 1, title: 'iPad 4 Mini', price: 500.01, inventory: 2 },
  { id: 2, title: 'H&M T-Shirt White', price: 10.99, inventory: 10 },
  { id: 3, title: 'Charli XCX - Sucker CD', price: 19.99, inventory: 5 },
];

const shopApi = {
  getProducts(): Promise<Product[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(__products), 100);
    });
  },

  buyProducts(products: Product[]): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // simulate random checkout failure.
        (Math.random() > 0.5 || navigator.userAgent.indexOf('PhantomJS') > -1)
          ? resolve()
          : reject();
      }, 100);
    });
  },
};
export default shopApi;

export interface Product {
  id: number;
  title: string;
  price: number;
  inventory: number;
}
