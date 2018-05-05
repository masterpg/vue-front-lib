import * as td from 'testdouble';
import _cartStore, { CartState } from '../../../../src/app/stores/cart-store';
import { Apis, Product as ApiProduct } from '../../../../src/app/apis/types';
import { CartStore, CheckoutStatus, Stores } from '../../../../src/app/stores/types';

const assert = chai.assert;

suite('store/cart-store', () => {

  const cartStore = _cartStore as CartStore & {
    initState(state: CartState): void,
    state: CartState,
    $apis: Apis,
    $stores: Stores,
  };
  const productStore = cartStore.$stores.product;
  const shopApi = cartStore.$apis.shop;

  const PRODUCTS: ApiProduct[] = [
    { id: 1, title: 'iPad 4 Mini', price: 500.01, inventory: 2 },
    { id: 2, title: 'H&M T-Shirt White', price: 10.99, inventory: 10 },
    { id: 3, title: 'Charli XCX - Sucker CD', price: 19.99, inventory: 5 },
  ];

  setup(() => {
    cartStore.initState({
      added: [],
      checkoutStatus: CheckoutStatus.None,
    });
  });

  teardown(() => {
    cartStore.initState({
      added: [],
      checkoutStatus: CheckoutStatus.None,
    });
    td.reset();
  });

  test('getCartProductById() - 一般ケース', () => {
    cartStore.state.added = [{ id: 1, quantity: 1 }];
    const product = PRODUCTS[0];
    td.replace(cartStore, 'getProductById');
    td.when((cartStore as any).getProductById(product.id)).thenReturn(product);

    const actual = cartStore.getCartProductById(product.id);
    assert.deepEqual(actual, {
      id: product.id,
      title: product.title,
      price: product.price,
      quantity: 1,
    });
  });

  test('getCartProductById() - 存在しない商品IDを指定した場合', () => {
    assert.throws(
      () => cartStore.getCartProductById(9876),
      Error, 'A Product that matches the specified productId `9876` was not found.');
  });

  test('addProductToCart() - 一般ケース', () => {
    const product = PRODUCTS[1];
    // 【準備】
    td.replace(cartStore, 'getProductById');
    td.when((cartStore as any).getProductById(product.id)).thenReturn(product);

    const decrementProductInventory =
      td.replace(productStore, 'decrementProductInventory');

    // 【実行】
    // `addProductToCart()`を2回実行
    cartStore.addProductToCart(product.id);
    cartStore.addProductToCart(product.id);

    // 【検証】
    assert.equal(cartStore.state.checkoutStatus, CheckoutStatus.None);
    // カートに追加された商品とその数量を検証
    const cartProduct = cartStore.getCartProductById(product.id);
    assert.equal(cartProduct!.id, product.id);
    assert.equal(cartProduct!.quantity, 2);

    // `ProductStore#decrementProductInventory()`の呼び出し回数と渡された引数を検証
    const decrementProductInventoryExplain = td.explain(decrementProductInventory);
    assert.equal(decrementProductInventoryExplain.callCount, 2);
    assert.equal(decrementProductInventoryExplain.calls[0].args[0], product.id);
    assert.equal(decrementProductInventoryExplain.calls[1].args[0], product.id);
  });

  test('checkout() - 一般ケース', async () => {
    const buyProducts = td.replace(shopApi, 'buyProducts');
    td.when(shopApi.buyProducts(PRODUCTS)).thenResolve();

    await cartStore.checkout(PRODUCTS);
    assert.equal(cartStore.state.checkoutStatus, CheckoutStatus.Successful);
    assert.deepEqual(cartStore.state.added, []);

    // `ShopApi#buyProducts()`の呼び出し回数と渡された引数を検証
    const buyProductsExplain = td.explain(buyProducts);
    assert.equal(buyProductsExplain.callCount, 1);
    assert.deepEqual(buyProductsExplain.calls[0].args[0], PRODUCTS);
  });

  test('checkout() - エラーケース', async () => {
    const ADDED = [{ id: 1, quantity: 1 }];
    cartStore.state.added = ADDED;

    const buyProducts = td.replace(shopApi, 'buyProducts');
    td.when(shopApi.buyProducts(PRODUCTS)).thenReject(new Error());

    await cartStore.checkout(PRODUCTS);
    assert.equal(cartStore.state.checkoutStatus, CheckoutStatus.Failed);
    assert.deepEqual(cartStore.state.added, ADDED);
  });

});
