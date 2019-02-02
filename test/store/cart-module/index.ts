import * as td from 'testdouble'
import {CartState, CartModuleImpl, newCartModule} from '@/store/cart-module'
import {CheckoutStatus} from '@/store'
import {Product as APIProduct} from '@/apis'
import {TestModule} from '../../types'
import {newProductModule} from '@/store/product-module'

const assert = chai.assert

suite('store/cart-module', () => {
  const productModule = newProductModule()
  const cartModule = newCartModule({product: productModule}) as CartModuleImpl & TestModule<CartState>

  const PRODUCTS: APIProduct[] = [
    {id: '1', title: 'iPad 4 Mini', price: 500.01, inventory: 2},
    {id: '2', title: 'H&M T-Shirt White', price: 10.99, inventory: 10},
    {id: '3', title: 'Charli XCX - Sucker CD', price: 19.99, inventory: 5},
  ]

  setup(() => {
    cartModule.f_initState({
      items: [],
      checkoutStatus: CheckoutStatus.None,
    })
  })

  teardown(() => {
    cartModule.f_initState({
      items: [],
      checkoutStatus: CheckoutStatus.None,
    })
    td.reset()
  })

  test('getCartItemById() - 一般ケース', () => {
    cartModule.f_state.items = [{id: '1', quantity: 1}]
    const product = PRODUCTS[0]
    td.replace(cartModule, 'm_getProductById')
    td.when(cartModule.m_getProductById(product.id)).thenReturn(product)

    const actual = cartModule.getCartItemById(product.id)
    assert.deepEqual(actual, {
      id: product.id,
      title: product.title,
      price: product.price,
      quantity: 1,
    })
  })

  test('getCartItemById() - 存在しない商品IDを指定した場合', () => {
    assert.throws(() => cartModule.getCartItemById('9876'), Error, 'A product that matches the specified productId "9876" was not found.')
  })

  test('addProductToCart() - 一般ケース', () => {
    const product = PRODUCTS[1]
    // 【準備】
    td.replace(cartModule, 'm_getProductById')
    td.when(cartModule.m_getProductById(product.id)).thenReturn(product)

    const decrementProductInventory = td.replace(productModule, 'decrementProductInventory')

    // 【実行】
    // `addProductToCart()`を2回実行
    cartModule.addProductToCart(product.id)
    cartModule.addProductToCart(product.id)

    // 【検証】
    assert.equal(cartModule.f_state.checkoutStatus, CheckoutStatus.None)
    // カートに追加された商品とその数量を検証
    const cartItem = cartModule.getCartItemById(product.id)
    assert.equal(cartItem!.id, product.id)
    assert.equal(cartItem!.quantity, 2)

    // `ProductModule#decrementProductInventory()`の呼び出し回数と渡された引数を検証
    const decrementProductInventoryExplain = td.explain(decrementProductInventory)
    assert.equal(decrementProductInventoryExplain.callCount, 2)
    assert.equal(decrementProductInventoryExplain.calls[0].args[0], product.id)
    assert.equal(decrementProductInventoryExplain.calls[1].args[0], product.id)
  })

  test('checkout() - 一般ケース', async () => {
    const CART_ITEMS = [{id: '1', quantity: 1}, {id: '2', quantity: 1}]
    cartModule.f_state.items = CART_ITEMS
    td.replace(cartModule.f_db, 'runTransaction')
    td.when(cartModule.f_db.runTransaction(td.matchers.anything())).thenResolve()

    await cartModule.checkout()
    assert.equal(cartModule.f_state.checkoutStatus, CheckoutStatus.Successful)
    assert.deepEqual(cartModule.f_state.items, [])
  })

  test('checkout() - エラーケース', async () => {
    const CART_ITEMS = [{id: '1', quantity: 1}, {id: '2', quantity: 1}]
    cartModule.f_state.items = CART_ITEMS
    td.replace(cartModule.f_db, 'runTransaction')
    td.when(cartModule.f_db.runTransaction(td.matchers.anything())).thenReject(new Error())

    await cartModule.checkout()
    assert.equal(cartModule.f_state.checkoutStatus, CheckoutStatus.Failed)
    assert.deepEqual(cartModule.f_state.items, CART_ITEMS)
  })

  test('m_createCheckoutProcess() - 商品が存在しなかった場合', async () => {
    const transaction = new class {
      get(ref) {
        return new Promise(resolve => {
          resolve({
            exists: false,
            data: () => new Object({inventory: 10}),
          })
        })
      }
    }() as any
    try {
      await cartModule.m_createCheckoutProcess(transaction, {id: '9876', quantity: 5})
      assert(false, 'No exception occurred.')
    } catch (err) {
      assert.instanceOf(err, Error)
      assert.equal(err.message, 'Product "9876" does not exist.')
    }
  })

  test('m_createCheckoutProcess() - 在庫が足りなかった場合', async () => {
    const transaction = new class {
      get(ref) {
        return new Promise(resolve => {
          resolve({
            exists: true,
            data: () => new Object({inventory: 1}),
          })
        })
      }
    }() as any
    try {
      await cartModule.m_createCheckoutProcess(transaction, {id: '1', quantity: 10})
      assert(false, 'No exception occurred.')
    } catch (err) {
      assert.instanceOf(err, Error)
      assert.equal(err.message, 'The inventory of the product "1" was insufficient.')
    }
  })
})
