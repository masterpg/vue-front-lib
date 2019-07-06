import * as td from 'testdouble'
import { Product as APIProduct, ShopAPI, api } from '@/api'
import { CartModule, CartState, CheckoutStatus, ProductsModule, ProductsState, store } from '@/store'
import { TestLogic, TestStoreModule } from '../../../helper/unit'
import { ShopLogicImpl } from '@/logic/shop'
import { logic } from '@/logic'
const assign = require('lodash/assign')
const cloneDeep = require('lodash/cloneDeep')

const shopLogic = logic.shop as TestLogic<ShopLogicImpl>
const cartModule = store.cart as TestStoreModule<CartState, CartModule>
const productModule = store.products as TestStoreModule<ProductsState, ProductsModule>

const PRODUCTS: APIProduct[] = [
  { id: '1', title: 'iPad 4 Mini', price: 500.01, inventory: 1 },
  { id: '2', title: 'Fire HD 8 Tablet', price: 80.99, inventory: 5 },
  { id: '3', title: 'MediaPad 10', price: 150.8, inventory: 10 },
  { id: '4', title: 'Surface Go', price: 630, inventory: 0 },
]

const CART_ITEMS = [{ id: '1', title: 'iPad 4 Mini', price: 500.01, quantity: 1 }, { id: '2', title: 'Fire HD 8 Tablet', price: 80.99, quantity: 1 }]

beforeEach(async () => {
  cartModule.initState({
    all: cloneDeep(CART_ITEMS),
    checkoutStatus: CheckoutStatus.None,
  })
  productModule.initState({
    all: cloneDeep(PRODUCTS),
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
    cartModule.state.all = [{ id: '1', title: 'iPad 4 Mini', price: 100, quantity: 1 }]

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
    const EXPECT_PRODUCTS = [{ id: '1', title: 'product1', price: 101, inventory: 1 }, { id: '2', title: 'product2', price: 102, inventory: 2 }]

    td.replace(shopLogic.db, 'collection')
    td.when(shopLogic.db.collection('products')).thenReturn({
      get: () => {
        return Promise.resolve([
          { id: '1', data: () => new Object({ title: 'product1', price: 101, inventory: 1 }) },
          { id: '2', data: () => new Object({ title: 'product2', price: 102, inventory: 2 }) },
        ])
      },
    })

    await shopLogic.pullProducts()
    expect(shopLogic.products).toEqual(EXPECT_PRODUCTS)
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
    const cartItemBk = cloneDeep(cartModule.getById(product.id)!)

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
    td.replace(shopLogic.db, 'runTransaction')
    td.when(shopLogic.db.runTransaction(td.matchers.anything())).thenResolve()

    await shopLogic.checkout()

    expect(shopLogic.cartItems).toEqual([])
    expect(shopLogic.checkoutStatus).toBe(CheckoutStatus.Successful)
  })

  it('Firestoreでエラーが発生した場合', async () => {
    td.replace(shopLogic.db, 'runTransaction')
    td.when(shopLogic.db.runTransaction(td.matchers.anything())).thenReject(new Error())

    await shopLogic.checkout()
    expect(shopLogic.cartItems).toEqual(CART_ITEMS)
    expect(shopLogic.checkoutStatus).toBe(CheckoutStatus.Failed)
  })

  it('カートの商品が存在しなかった場合', async () => {
    expect.assertions(2)

    const cartItem = CART_ITEMS[0]
    const transaction = new (class {
      get(ref) {
        return new Promise(resolve => {
          resolve({ exists: false })
        })
      }
    })() as any

    try {
      await shopLogic.m_createCheckoutProcess(transaction, cartItem)
    } catch (err) {
      expect(err).toBeInstanceOf(Error)
      expect(err.message).toBe(`Product "${cartItem.id}" does not exist.`)
    }
  })

  it('カートの商品の在庫が足りなかった場合', async () => {
    expect.assertions(2)

    const cartItem = CART_ITEMS[0]
    const transaction = new (class {
      get(ref) {
        return new Promise(resolve => {
          resolve({
            exists: true,
            data: () => new Object({ inventory: 0 }),
          })
        })
      }
    })() as any

    try {
      await shopLogic.m_createCheckoutProcess(transaction, cartItem)
    } catch (err) {
      expect(err).toBeInstanceOf(Error)
      expect(err.message).toBe(`The inventory of the product "${cartItem.id}" was insufficient.`)
    }
  })
})
