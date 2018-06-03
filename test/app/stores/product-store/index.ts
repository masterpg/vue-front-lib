import * as td from 'testdouble';
import _productStore, { ProductState } from '../../../../src/app/stores/product-store';
import { Product as APIProduct } from '../../../../src/app/apis/types';
import { ProductStore, Stores } from '../../../../src/app/stores/types';
import { TestStore } from '../../../types';

const assert = chai.assert;

suite('store/product-store', () => {

  const productStore = _productStore as ProductStore & TestStore<ProductState>;
  const shopAPI = productStore.$apis.shop;

  const PRODUCTS: APIProduct[] = [
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

  test('getProductById() - 取得できないパターン', () => {
    const actual = productStore.getProductById(9876);
    assert.isUndefined(actual);
  });

  test('decrementProductInventory() - 一般ケース', () => {
    const product = PRODUCTS[0];
    productStore.decrementProductInventory(product.id);
    const actual = productStore.getProductById(product.id);
    assert.equal(actual!.inventory, product.inventory);
  });

  test('decrementProductInventory() - 存在しない商品IDを指定した場合', () => {
    const product = PRODUCTS[0];
    productStore.decrementProductInventory(9876);
    // 何も問題は起きない
    assert(true);
  });

  test('getAllProducts()', async () => {
    const API_PRODUCTS = [
      { id: 1, title: 'product1', price: 101, inventory: 1 },
      { id: 2, title: 'product2', price: 102, inventory: 2 },
    ];
    td.replace(shopAPI, 'getProducts');
    td.when(shopAPI.getProducts()).thenResolve(API_PRODUCTS);

    await productStore.getAllProducts();
    assert.deepEqual(productStore.allProducts, API_PRODUCTS);
  });

});
