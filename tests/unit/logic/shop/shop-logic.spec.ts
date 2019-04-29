import * as td from 'testdouble'

import {ShopLogicImpl} from '@/logic/shop'
import {TestStoreModule} from '../../../helper'
import {api, Product as APIProduct, ShopAPI} from '@/api'
import {store, CartState, CartModule, CheckoutStatus, ProductsModule, ProductsState} from '@/store'
import {utils} from '@/base/utils'

const shopLogic = new ShopLogicImpl()
const cartModule = store.cart as TestStoreModule<CartState, CartModule>
const productModule = store.products as TestStoreModule<ProductsState, ProductsModule>

const PRODUCTS: APIProduct[] = [
  {id: '1', title: 'iPad 4 Mini', price: 500.01, inventory: 1},
  {id: '2', title: 'Fire HD 8 Tablet', price: 80.99, inventory: 5},
  {id: '3', title: 'MediaPad 10', price: 150.8, inventory: 10},
  {id: '4', title: 'Surface Go', price: 630, inventory: 0},
]

const CART_ITEMS = [{id: '1', title: 'iPad 4 Mini', price: 500.01, quantity: 1}, {id: '2', title: 'Fire HD 8 Tablet', price: 80.99, quantity: 1}]

beforeEach(async () => {
  cartModule.initState({
    all: utils.cloneDeep(CART_ITEMS),
    checkoutStatus: CheckoutStatus.None,
  })
  productModule.initState({
    all: utils.cloneDeep(PRODUCTS),
  })
  td.replace(api, 'shop', td.object<ShopAPI>())
})

afterEach(() => {})

describe('products', () => {
  it('ベーシックケース', () => {
    const actual = shopLogic.products

    expect(actual).toEqual(PRODUCTS)
    expect(actual).not.toBe(PRODUCTS) // コピーであることを検証
  })
})

describe('cartItems', () => {
  it('ベーシックケース', () => {
    const actual = shopLogic.cartItems

    expect(actual).toEqual(CART_ITEMS)
    expect(actual).not.toBe(CART_ITEMS) // コピーであることを検証
  })
})

describe('cartTotalPrice', () => {
  it('ベーシックケース', () => {
    cartModule.state.all = [{id: '1', title: 'iPad 4 Mini', price: 100, quantity: 1}]

    const actual = shopLogic.cartTotalPrice

    expect(actual).toBe(100)
  })
})

describe('checkoutStatus', () => {
  it('ベーシックケース', () => {
    const actual = store.cart.checkoutStatus

    expect(actual).toBe(CheckoutStatus.None)
  })
})

describe('pullProducts()', () => {
  it('ベーシックケース', async () => {
    td.replace(api.shop, 'getProducts', () => Promise.resolve(PRODUCTS))

    await shopLogic.pullProducts()
    const actual = shopLogic.products

    expect(actual).toEqual(PRODUCTS)
  })
})

describe('addProductToCart()', () => {
  it('在庫がある商品をカートへ追加する場合 & 追加しようとする商品がまだカートに存在しない場合', async () => {
    const product = PRODUCTS[2]

    shopLogic.addProductToCart(product.id)

    expect(shopLogic.checkoutStatus).toBe(CheckoutStatus.None)
    const cartItem = cartModule.getById(product.id)!
    expect(cartItem.quantity).toBe(1)
  })

  it('在庫がある商品をカートへ追加する場合 & 追加しようとする商品が既に存在する場合', async () => {
    const product = PRODUCTS[0]
    const cartItemBk = utils.cloneDeep(cartModule.getById(product.id)!)

    shopLogic.addProductToCart(product.id)

    expect(shopLogic.checkoutStatus).toBe(CheckoutStatus.None)
    const cartItem = cartModule.getById(product.id)!
    expect(cartItem.quantity).toBe(cartItemBk.quantity + 1)
  })

  it('在庫が無い商品をカートへ追加しようとした場合', async () => {
    const product = PRODUCTS[3]

    // TODO 現状何も起こらないが、エラーをスローした方がよいか検討すること
    shopLogic.addProductToCart(product.id)

    expect(shopLogic.checkoutStatus).toBe(CheckoutStatus.None)
  })
})

describe('checkout()', () => {
  it('ベーシックケース', async () => {
    await shopLogic.checkout()

    td.verify(api.shop.buyProducts(CART_ITEMS))
    expect(shopLogic.cartItems).toEqual([])
    expect(shopLogic.checkoutStatus).toBe(CheckoutStatus.Successful)
  })

  it('APIでエラーが発生してチェックアウトが失敗した場合', async () => {
    td.replace(api.shop, 'buyProducts', () => {
      throw new Error()
    })

    await shopLogic.checkout()

    expect(shopLogic.cartItems).toEqual(CART_ITEMS)
    expect(shopLogic.checkoutStatus).toBe(CheckoutStatus.Failed)
  })
})
