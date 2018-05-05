import * as sinon from 'sinon';
import _productStore, { ProductState } from '../../../../src/app/stores/product-store';
import { Apis, Product as ApiProduct } from '../../../../src/app/apis/types';
import { ProductStore, Stores } from '../../../../src/app/stores/types';

const assert = chai.assert;

suite('store/product-store', () => {

  const productStore = _productStore as ProductStore & {
    initState(state: ProductState): void,
    $apis: Apis,
  };
  const shopApi = productStore.$apis.shop;

  const PRODUCTS: ApiProduct[] = [
    { id: 1, title: 'iPad 4 Mini', price: 500.01, inventory: 2 },
    { id: 2, title: 'H&M T-Shirt White', price: 10.99, inventory: 10 },
    { id: 3, title: 'Charli XCX - Sucker CD', price: 19.99, inventory: 5 },
  ];

  setup(() => {
    productStore.initState({
      all: PRODUCTS,
    });
  });

  test('getProductById() - 取得できるパターン', () => {
    const product = PRODUCTS[0];
    const actual = productStore.getProductById(product.id);
    assert.deepEqual(actual, product);
  });

  test('getProductById() - 取得できるないパターン', () => {
    const actual = productStore.getProductById(9876);
    assert.isNull(actual);
  });

  test('decrementProductInventory()', () => {
    const product = PRODUCTS[0];
    productStore.decrementProductInventory(product.id);
    const actual = productStore.getProductById(product.id);
    assert.equal(actual!.inventory, product.inventory);
  });

  test('getAllProducts()', async () => {
    const API_PRODUCTS = [
      { id: 1, title: 'product1', price: 101, inventory: 1 },
      { id: 2, title: 'product2', price: 102, inventory: 2 },
    ];
    const getProducts = sinon.stub(shopApi, 'getProducts');
    getProducts.returns(API_PRODUCTS);

    await productStore.getAllProducts();
    assert.deepEqual(productStore.allProducts, API_PRODUCTS);

    getProducts.restore();
  });

});
