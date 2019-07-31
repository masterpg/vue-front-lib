import * as td from 'testdouble'
import { CartItem, CartModule, CartState, CheckoutStatus, ProductModule, ProductState, User, UserModule, UserState, store } from '@/store'
import { GQLMutation, GQLProduct, GQLQuery, gql } from '@/gql'
import { TestLogic, TestStoreModule } from '../../../helper/unit'
import { ShopLogicImpl } from '@/logic/modules/shop'
import { logic } from '@/logic'
const assign = require('lodash/assign')
const cloneDeep = require('lodash/cloneDeep')

const shopLogic = logic.shop as TestLogic<ShopLogicImpl>
const cartModule = store.cart as TestStoreModule<CartState, CartModule>
const productModule = store.product as TestStoreModule<ProductState, ProductModule>
const userModule = store.user as TestStoreModule<UserState, UserModule>

const PRODUCTS: GQLProduct[] = [
  { id: 'product1', title: 'iPad 4 Mini', price: 500.01, stock: 1 },
  { id: 'product2', title: 'Fire HD 8 Tablet', price: 80.99, stock: 5 },
  { id: 'product3', title: 'MediaPad 10', price: 150.8, stock: 10 },
  { id: 'product4', title: 'Surface Go', price: 630, stock: 0 },
]

const CART_ITEMS: CartItem[] = [
  {
    id: 'cartItem1',
    userId: 'user1',
    productId: 'product1',
    title: 'iPad 4 Mini',
    price: 500.01,
    quantity: 1,
  },
  {
    id: 'cartItem2',
    userId: 'user1',
    productId: 'product2',
    title: 'Fire HD 8 Tablet',
    price: 80.99,
    quantity: 1,
  },
]

const USER: User = {
  id: 'user1',
  displayName: 'taro',
  email: 'taro@example.com',
  emailVerified: true,
  isSignedIn: true,
  photoURL: '',
}

beforeEach(async () => {
  cartModule.initState({
    all: cloneDeep(CART_ITEMS),
    checkoutStatus: CheckoutStatus.None,
  })
  productModule.initState({
    all: cloneDeep(PRODUCTS),
  })
  userModule.initState(cloneDeep(USER))
  td.replace(gql, 'query', td.object<GQLQuery>())
  td.replace(gql, 'mutation', td.object<GQLMutation>())
})

afterEach(() => {})

describe('products', () => {
  it('ベーシックケース', () => {
    const actual = shopLogic.products
    expect(actual).toEqual(PRODUCTS)
  })
})

describe('cartItems', () => {
  it('ベーシックケース', () => {
    const actual = shopLogic.cartItems
    expect(actual).toEqual(CART_ITEMS)
  })
})

describe('cartTotalPrice', () => {
  it('ベーシックケース', () => {
    const cartItems = cartModule.all
    cartItems[0].price = 100
    cartItems[0].quantity = 1
    cartItems[1].price = 200
    cartItems[1].quantity = 2
    cartModule.state.all = cartItems

    const actual = shopLogic.cartTotalPrice

    expect(actual).toBe(500)
  })
})

describe('checkoutStatus', () => {
  it('ベーシックケース', () => {
    const actual = cartModule.checkoutStatus
    expect(actual).toBe(CheckoutStatus.None)
  })
})

describe('pullProducts()', () => {
  it('ベーシックケース', async () => {
    td.replace(gql.query, 'products', () => Promise.resolve(PRODUCTS))

    await shopLogic.pullProducts()
    const actual = shopLogic.products

    expect(actual).toEqual(PRODUCTS)
  })
})

describe('addItemToCart()', () => {
  it('追加しようとする商品がカートに存在しない場合', async () => {
    // ユーザーがサインインしている状態へ変更
    userModule.set({ isSignedIn: true })
    // GQL実行後の期待値となるカートアイテムの設定
    const resultCartItem = {
      id: 'cartItemXXX',
      userId: 'user1',
      productId: 'product3',
      title: 'MediaPad 10',
      price: 150.8,
      quantity: 1,
    }
    // モック設定
    td.when(gql.mutation.addCartItems(td.matchers.anything())).thenResolve([resultCartItem])
    // 商品の在庫数を設定
    productModule.set({
      id: resultCartItem.productId,
      stock: 10,
    })

    await shopLogic.addItemToCart(resultCartItem.productId)

    // GQLが適切な引数でコールされたか検証
    td.verify(
      gql.mutation.addCartItems([
        {
          userId: resultCartItem.userId,
          productId: resultCartItem.productId,
          title: resultCartItem.title,
          price: resultCartItem.price,
          quantity: resultCartItem.quantity,
        },
      ])
    )
    // カートにアイテムが追加されたか検証
    const cartItem = cartModule.getById(resultCartItem.id)!
    expect(cartItem.quantity).toBe(resultCartItem.quantity)
    // 商品の在庫数が適切にマイナスされたか検証
    const product = productModule.getById(resultCartItem.productId)!
    expect(product.stock).toBe(9)
    // チェックアウトステータスの検証
    expect(shopLogic.checkoutStatus).toBe(CheckoutStatus.None)
  })

  it('追加しようとする商品がカートに存在する場合', async () => {
    // ユーザーがサインインしている状態へ変更
    userModule.set({ isSignedIn: true })
    // GQL実行後の期待値となるカートアイテムの設定
    const resultCartItem = cartModule.all[0]
    resultCartItem.quantity++
    // モック設定
    td.when(gql.mutation.updateCartItems(td.matchers.anything())).thenResolve([resultCartItem])
    // 商品の在庫数を設定
    productModule.set({
      id: resultCartItem.productId,
      stock: 10,
    })

    await shopLogic.addItemToCart(resultCartItem.productId)

    // GQLが適切な引数でコールされたか検証
    td.verify(
      gql.mutation.updateCartItems([
        {
          id: resultCartItem.id,
          quantity: resultCartItem.quantity,
        },
      ])
    )
    // カートアイテムの個数が適切にプラスされたか検証
    const cartItem = cartModule.getById(resultCartItem.id)!
    expect(cartItem.quantity).toBe(resultCartItem.quantity)
    // 商品の在庫数が適切にマイナスされたか検証
    const product = productModule.getById(resultCartItem.productId)!
    expect(product.stock).toBe(9)
    // チェックアウトステータスの検証
    expect(shopLogic.checkoutStatus).toBe(CheckoutStatus.None)
  })

  it('ユーザーがサインインしていない場合', async () => {
    // ユーザーがサインインしていない状態へ変更
    userModule.set({ isSignedIn: false })
    // チェックアウトステータスに成功を設定
    cartModule.setCheckoutStatus(CheckoutStatus.Successful)

    try {
      await shopLogic.addItemToCart('cartItem1')
    } catch (err) {
      expect(err).toBeInstanceOf(Error)
      expect(err.message).toBe('Not signed in.')
    }
  })

  it('GQLでエラーが発生した場合', async () => {
    userModule.set({ isSignedIn: true })
    const prevCartItem = cartModule.all[0]
    const prevProduct = productModule.getById(prevCartItem.productId)!
    td.when(gql.mutation.updateCartItems(td.matchers.anything())).thenThrow(new Error())
    cartModule.setCheckoutStatus(CheckoutStatus.Successful)

    await shopLogic.addItemToCart(prevCartItem.productId)

    // カートアイテムの個数に変化がないことを検証
    const cartItem = cartModule.getById(prevCartItem.id)!
    expect(cartItem.quantity).toBe(prevCartItem.quantity)
    // 商品の在庫数がに変化がないことを検証
    const product = productModule.getById(prevProduct.id)!
    expect(product.stock).toBe(prevProduct.stock)
    // チェックアウトステータスに変化がないことを検証
    expect(shopLogic.checkoutStatus).toBe(CheckoutStatus.Successful)
  })
})

describe('removeItemFromCart()', () => {
  it('カートアイテムの数が2個以上の場合', async () => {
    // ユーザーがサインインしている状態へ変更
    userModule.set({ isSignedIn: true })
    // GQL実行後の期待値となるカートアイテムの設定
    const resultCartItem = cartModule.all[0]
    resultCartItem.quantity = 2
    // モック設定
    td.when(gql.mutation.updateCartItems(td.matchers.anything())).thenResolve([resultCartItem])
    // カートアイテムの個数を設定
    cartModule.set({
      id: resultCartItem.id,
      quantity: 3,
    })
    // 商品の在庫数を設定
    productModule.set({
      id: resultCartItem.productId,
      stock: 9,
    })

    await shopLogic.removeItemFromCart(resultCartItem.productId)

    // GQLが適切な引数でコールされたか検証
    td.verify(
      gql.mutation.updateCartItems([
        {
          id: resultCartItem.id,
          quantity: resultCartItem.quantity,
        },
      ])
    )
    // カートアイテムの個数が適切にマイナスされたか検証
    const cartItem = cartModule.getById(resultCartItem.id)!
    expect(cartItem.quantity).toBe(resultCartItem.quantity)
    // 商品の在庫数が適切にプラスされたか検証
    const product = productModule.getById(resultCartItem.productId)!
    expect(product.stock).toBe(10)
    // チェックアウトステータスの検証
    expect(shopLogic.checkoutStatus).toBe(CheckoutStatus.None)
  })

  it('カートアイテムの数が1個の場合', async () => {
    // ユーザーがサインインしている状態へ変更
    userModule.set({ isSignedIn: true })
    // GQL実行後の期待値となるカートアイテムの設定
    const resultCartItem = cartModule.all[0]
    resultCartItem.quantity = 0
    // モック設定
    td.when(gql.mutation.removeCartItems(td.matchers.anything())).thenResolve([resultCartItem])
    // カートアイテムの個数を設定
    cartModule.set({
      id: resultCartItem.id,
      quantity: 1,
    })
    // 商品の在庫数を設定
    productModule.set({
      id: resultCartItem.productId,
      stock: 9,
    })

    await shopLogic.removeItemFromCart(resultCartItem.productId)

    // GQLが適切な引数でコールされたか検証
    td.verify(gql.mutation.removeCartItems([resultCartItem.id]))
    // カートアイテムが削除されたか検証
    expect(cartModule.getById(resultCartItem.id)).toBeUndefined()
    // 商品の在庫数が適切にプラスされたか検証
    const product = productModule.getById(resultCartItem.productId)!
    expect(product.stock).toBe(10)
    // チェックアウトステータスの検証
    expect(shopLogic.checkoutStatus).toBe(CheckoutStatus.None)
  })

  it('ユーザーがサインインしていない場合', async () => {
    // ユーザーがサインインしていない状態へ変更
    userModule.set({ isSignedIn: false })
    // チェックアウトステータスに成功を設定
    cartModule.setCheckoutStatus(CheckoutStatus.Successful)

    try {
      await shopLogic.removeItemFromCart('cartItem1')
    } catch (err) {
      expect(err).toBeInstanceOf(Error)
      expect(err.message).toBe('Not signed in.')
    }
  })

  it('GQLでエラーが発生した場合', async () => {
    userModule.set({ isSignedIn: true })
    const prevCartItem = cartModule.all[0]
    const prevProduct = productModule.getById(prevCartItem.productId)!
    td.when(gql.mutation.updateCartItems(td.matchers.anything())).thenThrow(new Error())
    cartModule.setCheckoutStatus(CheckoutStatus.Successful)

    await shopLogic.addItemToCart(prevCartItem.productId)

    // カートアイテムの個数に変化がないことを検証
    const cartItem = cartModule.getById(prevCartItem.id)!
    expect(cartItem.quantity).toBe(prevCartItem.quantity)
    // 商品の在庫数がに変化がないことを検証
    const product = productModule.getById(prevProduct.id)!
    expect(product.stock).toBe(prevProduct.stock)
    // チェックアウトステータスに変化がないことを検証
    expect(shopLogic.checkoutStatus).toBe(CheckoutStatus.Successful)
  })
})

describe('checkout()', () => {
  it('ベーシックケース', async () => {
    userModule.set({ isSignedIn: true })

    await shopLogic.checkout()

    td.verify(gql.mutation.checkoutCart(userModule.value.id))
    expect(shopLogic.cartItems).toEqual([])
    expect(shopLogic.checkoutStatus).toBe(CheckoutStatus.Successful)
  })

  it('GQLでエラーが発生した場合', async () => {
    td.when(gql.mutation.checkoutCart(td.matchers.anything())).thenThrow(new Error())

    await shopLogic.checkout()

    expect(shopLogic.cartItems).toEqual(CART_ITEMS)
    expect(shopLogic.checkoutStatus).toBe(CheckoutStatus.Failed)
  })
})
