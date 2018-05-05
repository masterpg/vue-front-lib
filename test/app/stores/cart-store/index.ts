import * as sinon from 'sinon';
import _cartStore, { CartState } from '../../../../src/app/stores/cart-store';
import { Apis, Product as ApiProduct } from '../../../../src/app/apis/types';
import { CartStore, Stores } from '../../../../src/app/stores/types';

const assert = chai.assert;

suite('store/cart-store', () => {

  const cartStore = _cartStore as CartStore & {
    initState(state: CartState): void,
    $apis: Apis,
    $stores: Stores,
  };
  const productStore = cartStore.$stores.product;

  const PRODUCTS: ApiProduct[] = [
    { id: 1, title: 'iPad 4 Mini', price: 500.01, inventory: 2 },
    { id: 2, title: 'H&M T-Shirt White', price: 10.99, inventory: 10 },
    { id: 3, title: 'Charli XCX - Sucker CD', price: 19.99, inventory: 5 },
  ];

  test('addProductToCart()', () => {
    const product = PRODUCTS[0];

    // @ts-ignore
    const getProductById = sinon.stub(cartStore, 'getProductById');
    getProductById.returns(product);

    const productStoreMock = sinon.mock(productStore);
    productStoreMock.expects('decrementProductInventory')
      .withArgs(product.id)
      .exactly(1);

    cartStore.addProductToCart(product.id);
    const cartProduct = cartStore.getCartProductById(product.id);
    assert.equal(cartProduct!.id, product.id);
    assert.equal(cartProduct!.quantity, 1);

    productStoreMock.verify();
    productStoreMock.restore();
    getProductById.restore();
  });

});
