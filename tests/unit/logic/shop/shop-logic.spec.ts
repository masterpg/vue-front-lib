import * as td from 'testdouble'

import {ShopLogicImpl} from '@/logic/shop'
import {CartModule, CheckoutStatus, ProductsModule, store} from '@/store'
import {api, Product as APIProduct, ShopAPI} from '@/api'

const shopLogic = new ShopLogicImpl()

const PRODUCTS: APIProduct[] = [
  {id: '1', title: 'iPad 4 Mini', price: 500.01, inventory: 1},
  {id: '2', title: 'Fire HD 8 Tablet', price: 80.99, inventory: 5},
  {id: '3', title: 'HUAWEI MediaPad 10', price: 150.8, inventory: 10},
]

const CART_ITEMS = [{id: '1', title: 'iPad 4 Mini', price: 500.01, quantity: 1}, {id: '2', title: 'Fire HD 8 Tablet', price: 80.99, quantity: 1}]

beforeEach(async () => {
  td.replace(store, 'cart', td.object<CartModule>())
  td.replace(store, 'products', td.object<ProductsModule>())
  td.replace(api, 'shop', td.object<ShopAPI>())
})

afterEach(() => {})

describe('products', () => {
  it('ベーシックケース', () => {
    // 【準備】
    store.products.products = PRODUCTS

    // 【実行】
    const actual = shopLogic.products

    // 【検証】
    expect(actual).toEqual(PRODUCTS)
    expect(actual).not.toBe(PRODUCTS) // コピーであることを検証
  })
})

describe('cartItems', () => {
  it('ベーシックケース', () => {
    // 【準備】
    store.cart.items = CART_ITEMS

    // 【実行】
    const actual = shopLogic.cartItems

    // 【検証】
    expect(actual).toEqual(CART_ITEMS)
    expect(actual).not.toBe(CART_ITEMS) // コピーであることを検証
  })
})

describe('cartTotalPrice', () => {
  it('ベーシックケース', () => {
    // 【準備】
    store.cart.totalPrice = 999

    // 【実行】
    const actual = store.cart.totalPrice

    // 【検証】
    expect(actual).toBe(999)
  })
})

describe('checkoutStatus', () => {
  it('ベーシックケース', () => {
    // 【準備】
    store.cart.checkoutStatus = CheckoutStatus.Successful

    // 【実行】
    const actual = store.cart.checkoutStatus

    // 【検証】
    expect(actual).toBe(CheckoutStatus.Successful)
  })
})

describe('pullProducts()', () => {
  it('ベーシックケース', async () => {
    // 【準備】
    td.replace(api.shop, 'getProducts', () => Promise.resolve(PRODUCTS))

    // 【実行】
    await shopLogic.pullProducts()

    // 【検証】
    td.verify(store.products.setProducts(PRODUCTS))
  })
})

describe('addProductToCart()', () => {
  it('在庫がある商品かつ、まだカートにない商品をカートへ追加した場合', async () => {
    // 【準備】
    const product = PRODUCTS[0]

    td.replace(shopLogic, 'm_getProductById')
    td.when((shopLogic as any).m_getProductById(product.id)).thenReturn(product)

    // カートの中身を空にする
    store.cart.items = []

    // 【実行】
    shopLogic.addProductToCart(product.id)

    // 【検証】
    td.verify(store.cart.setCheckoutStatus(CheckoutStatus.None))
    td.verify(store.cart.addProductToCart(product))
    td.verify(store.products.decrementInventory(product.id))
  })

  it('在庫がある商品かつ、既にカートにその商品が存在する状態で同じ商品また追加した場合', async () => {
    // 【準備】
    const product = PRODUCTS[0]

    td.replace(shopLogic, 'm_getProductById')
    td.when((shopLogic as any).m_getProductById(product.id)).thenReturn(product)

    // カートの中身を設定する
    // (追加しようとする商品が既に存在する状態をつくる)
    store.cart.items = CART_ITEMS

    // 【実行】
    shopLogic.addProductToCart(product.id)

    // 【検証】
    td.verify(store.cart.setCheckoutStatus(CheckoutStatus.None))
    td.verify(store.cart.incrementItemQuantity(product.id))
    td.verify(store.products.decrementInventory(product.id))
  })
})

describe('checkout()', () => {
  it('ベーシックケース', async () => {
    // 【準備】
    const product = PRODUCTS[0]

    store.cart.items = CART_ITEMS

    const setCheckoutStatus = td.replace(store.cart, 'setCheckoutStatus')

    // 【実行】
    await shopLogic.checkout()

    // 【検証】
    td.verify(api.shop.buyProducts(CART_ITEMS))
    // `store.cart.setCheckoutStatus()`の呼び出し回数と渡された引数を検証
    const setCheckoutStatusExplain = td.explain(setCheckoutStatus)
    expect(setCheckoutStatusExplain.callCount).toBe(2)
    expect(setCheckoutStatusExplain.calls[0].args[0]).toBe(CheckoutStatus.None)
    expect(setCheckoutStatusExplain.calls[1].args[0]).toBe(CheckoutStatus.Successful)
  })

  it('エラーケース', async () => {
    // 【準備】
    store.cart.items = CART_ITEMS

    td.replace(api.shop, 'buyProducts', () => {
      throw new Error()
    })

    // 【実行】
    await shopLogic.checkout()

    // 【検証】
    td.verify(store.cart.setCheckoutStatus(CheckoutStatus.Failed))
    expect(store.cart.items).toEqual(CART_ITEMS)
  })
})
