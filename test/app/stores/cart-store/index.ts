import * as td from 'testdouble';
import { CartState, CartStoreImpl, newCartStore } from '../../../../src/app/stores/cart-store';
import { CheckoutStatus } from '../../../../src/app/stores';
import { Product as APIProduct } from '../../../../src/app/apis';
import { TestStore } from '../../../types';

const assert = chai.assert;

suite('store/cart-store', () => {
  const cartStore = newCartStore() as CartStoreImpl & TestStore<CartState>;
  const productStore = cartStore.$stores.product;
  const shopAPI = cartStore.$apis.shop;

  const PRODUCTS: APIProduct[] = [
    { id: '1', title: 'iPad 4 Mini', price: 500.01, inventory: 2 },
    { id: '2', title: 'H&M T-Shirt White', price: 10.99, inventory: 10 },
    { id: '3', title: 'Charli XCX - Sucker CD', price: 19.99, inventory: 5 },
  ];

  setup(() => {
    cartStore.f_initState({
      added: [],
      checkoutStatus: CheckoutStatus.None,
    });
  });

  teardown(() => {
    cartStore.f_initState({
      added: [],
      checkoutStatus: CheckoutStatus.None,
    });
    td.reset();
  });

  test('getCartProductById() - 一般ケース', () => {
    cartStore.f_state.added = [{ id: '1', quantity: 1 }];
    const product = PRODUCTS[0];
    td.replace(cartStore, 'm_getProductById');
    td.when(cartStore.m_getProductById(product.id)).thenReturn(product);

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
      () => cartStore.getCartProductById('9876'),
      Error,
      'A Product that matches the specified productId "9876" was not found.',
    );
  });

  test('addProductToCart() - 一般ケース', () => {
    const product = PRODUCTS[1];
    // 【準備】
    td.replace(cartStore, 'm_getProductById');
    td.when(cartStore.m_getProductById(product.id)).thenReturn(product);

    const decrementProductInventory = td.replace(productStore, 'decrementProductInventory');

    // 【実行】
    // `addProductToCart()`を2回実行
    cartStore.addProductToCart(product.id);
    cartStore.addProductToCart(product.id);

    // 【検証】
    assert.equal(cartStore.f_state.checkoutStatus, CheckoutStatus.None);
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
    const ADDED = [{ id: '1', quantity: 1 }, { id: '2', quantity: 1 }];
    cartStore.f_state.added = ADDED;
    td.replace(cartStore.f_db, 'runTransaction');
    td.when(cartStore.f_db.runTransaction(td.matchers.anything())).thenResolve();

    await cartStore.checkout();
    assert.equal(cartStore.f_state.checkoutStatus, CheckoutStatus.Successful);
    assert.deepEqual(cartStore.f_state.added, []);
  });

  test('checkout() - エラーケース', async () => {
    const ADDED = [{ id: '1', quantity: 1 }, { id: '2', quantity: 1 }];
    cartStore.f_state.added = ADDED;
    td.replace(cartStore.f_db, 'runTransaction');
    td.when(cartStore.f_db.runTransaction(td.matchers.anything())).thenReject(new Error());

    await cartStore.checkout();
    assert.equal(cartStore.f_state.checkoutStatus, CheckoutStatus.Failed);
    assert.deepEqual(cartStore.f_state.added, ADDED);
  });

  test('m_createCheckoutProcess() - 商品が存在しなかった場合', async () => {
    const transaction = new class {
      get(ref) {
        return new Promise((resolve) => {
          resolve({
            exists: false,
            data: () => new Object({ inventory: 10 }),
          });
        });
      }
    }() as any;
    try {
      await cartStore.m_createCheckoutProcess(transaction, { id: '9876', quantity: 5 });
      assert(false, 'No exception occurred.');
    } catch (err) {
      assert.instanceOf(err, Error);
      assert.equal(err.message, 'Product "9876" does not exist.');
    }
  });

  test('m_createCheckoutProcess() - 在庫が足りなかった場合', async () => {
    const transaction = new class {
      get(ref) {
        return new Promise((resolve) => {
          resolve({
            exists: true,
            data: () => new Object({ inventory: 1 }),
          });
        });
      }
    }() as any;
    try {
      await cartStore.m_createCheckoutProcess(transaction, { id: '1', quantity: 10 });
      assert(false, 'No exception occurred.');
    } catch (err) {
      assert.instanceOf(err, Error);
      assert.equal(err.message, 'The inventory of the product "1" was insufficient.');
    }
  });
});
