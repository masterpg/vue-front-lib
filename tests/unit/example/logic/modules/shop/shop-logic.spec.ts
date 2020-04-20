import * as td from 'testdouble'
import { APICartItemEditResponse, APIProduct, AppAPIContainer, api } from '@/example/logic/api'
import { CartItem, CartState, CartStore, CheckoutStatus, ProductState, ProductStore, store } from '@/example/logic/store'
import { TestLogic, TestStore } from '../../../../../helpers/common/store'
import { User, UserStore } from '@/lib'
import { ShopLogicImpl } from '@/example/logic/modules/shop'
import { initExampleTest } from '../../../../../helpers/example/init'
import { logic } from '@/example/logic'
const cloneDeep = require('lodash/cloneDeep')

//========================================================================
//
//  Test data
//
//========================================================================

const PRODUCTS: APIProduct[] = [
  { id: 'product1', title: 'iPad 4 Mini', price: 500.01, stock: 1 },
  { id: 'product2', title: 'Fire HD 8 Tablet', price: 80.99, stock: 5 },
  { id: 'product3', title: 'MediaPad 10', price: 150.8, stock: 10 },
  { id: 'product4', title: 'Surface Go', price: 630, stock: 0 },
]

const CART_ITEMS: CartItem[] = [
  {
    id: 'cartItem1',
    uid: 'general.user',
    productId: 'product1',
    title: 'iPad 4 Mini',
    price: 500.01,
    quantity: 1,
  },
  {
    id: 'cartItem2',
    uid: 'general.user',
    productId: 'product2',
    title: 'Fire HD 8 Tablet',
    price: 80.99,
    quantity: 1,
  },
]

const GENERAL_USER: User = {
  id: 'general.user',
  displayName: '一般ユーザー',
  email: 'general.user@example.com',
  emailVerified: true,
  isSignedIn: true,
  photoURL: '',
  isAppAdmin: false,
  myDirName: 'general.user',
  getIsAppAdmin(): Promise<boolean> {
    return Promise.resolve(false)
  },
}

//========================================================================
//
//  Test helpers
//
//========================================================================

let shopLogic!: TestLogic<ShopLogicImpl>
let cartStore!: TestStore<CartStore, CartState>
let productStore!: TestStore<ProductStore, ProductState>
let userStore!: TestStore<UserStore, void>

//========================================================================
//
//  Tests
//
//========================================================================

beforeAll(async () => {
  await initExampleTest({
    api: td.object<AppAPIContainer>(),
  })

  shopLogic = logic.shop as TestLogic<ShopLogicImpl>
  cartStore = store.cart as TestStore<CartStore, CartState>
  productStore = store.product as TestStore<ProductStore, ProductState>
  userStore = store.user as TestStore<UserStore, void>
})

beforeEach(async () => {
  cartStore.initState({
    all: cloneDeep(CART_ITEMS),
    checkoutStatus: CheckoutStatus.None,
  })
  productStore.initState({
    all: cloneDeep(PRODUCTS),
  })
  userStore.set(GENERAL_USER)
})

afterEach(() => {})

describe('getProducts', () => {
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
    const cartItems = cartStore.all
    cartItems[0].price = 100
    cartItems[0].quantity = 1
    cartItems[1].price = 200
    cartItems[1].quantity = 2
    cartStore.state.all = cartItems

    const actual = shopLogic.cartTotalPrice

    expect(actual).toBe(500)
  })
})

describe('checkoutStatus', () => {
  it('ベーシックケース', () => {
    const actual = cartStore.checkoutStatus
    expect(actual).toBe(CheckoutStatus.None)
  })
})

describe('pullProducts()', () => {
  it('ベーシックケース', async () => {
    td.when(api.getProducts()).thenResolve(PRODUCTS)

    await shopLogic.pullProducts()
    const actual = shopLogic.products

    expect(actual).toEqual(PRODUCTS)
  })

  it('APIでエラーが発生した場合', async () => {
    td.when(api.getProducts()).thenThrow(new Error())
    productStore.state.all = []

    await shopLogic.pullProducts()
    const actual = shopLogic.products

    expect(actual.length).toBe(0)
  })
})

describe('pullCartItems()', () => {
  it('ベーシックケース', async () => {
    // ユーザーがサインインしている状態へ変更
    userStore.set({ isSignedIn: true })

    td.when(api.getCartItems()).thenResolve(CART_ITEMS)

    await shopLogic.pullCartItems()
    const actual = shopLogic.cartItems

    expect(actual).toEqual(CART_ITEMS)
  })

  it('APIでエラーが発生した場合', async () => {
    // ユーザーがサインインしている状態へ変更
    userStore.set({ isSignedIn: true })

    td.when(api.getCartItems()).thenThrow(new Error())
    cartStore.state.all = []

    await shopLogic.pullCartItems()
    const actual = shopLogic.cartItems

    expect(actual.length).toBe(0)
  })

  it('ユーザーがサインインしていない場合', async () => {
    // ユーザーがサインインしていない状態へ変更
    userStore.set({ isSignedIn: false })

    let actual!: Error
    try {
      await shopLogic.pullCartItems()
    } catch (err) {
      actual = err
    }

    expect(actual).toBeInstanceOf(Error)
    expect(actual.message).toBe('Not signed in.')
  })
})

describe('addItemToCart()', () => {
  it('追加しようとする商品がカートに存在しない場合', async () => {
    // ユーザーがサインインしている状態へ変更
    userStore.set({ isSignedIn: true })
    // API実行後のレスポンスの設定
    const product3 = PRODUCTS[2]
    const response = {
      id: 'cartItemXXX',
      uid: 'general.user',
      productId: product3.id,
      title: product3.title,
      price: product3.price,
      quantity: 1,
      product: {
        id: product3.id,
        stock: 10 - 1,
      },
    } as APICartItemEditResponse
    // モック設定
    td.when(api.addCartItems(td.matchers.anything())).thenResolve([response])
    // 現在の商品の在庫数を設定
    productStore.set({
      id: response.productId,
      stock: 10,
    })

    await shopLogic.addItemToCart(response.productId)

    // APIが適切な引数でコールされたか検証
    td.verify(
      api.addCartItems([
        {
          productId: response.productId,
          title: response.title,
          price: response.price,
          quantity: response.quantity,
        },
      ])
    )
    // カートにアイテムが追加されたか検証
    const cartItem = cartStore.getById(response.id)!
    expect(cartItem.quantity).toBe(response.quantity)
    // 商品の在庫数が適切にマイナスされたか検証
    const product = productStore.getById(response.productId)!
    expect(product.stock).toBe(response.product.stock)
    // チェックアウトステータスの検証
    expect(shopLogic.checkoutStatus).toBe(CheckoutStatus.None)
  })

  it('追加しようとする商品がカートに存在する場合', async () => {
    // ユーザーがサインインしている状態へ変更
    userStore.set({ isSignedIn: true })
    // API実行後のレスポンスの設定
    const response = {
      ...cartStore.all[0],
      quantity: cartStore.all[0].quantity + 1,
      product: {
        id: cartStore.all[0].productId,
        stock: 10 - 1,
      },
    } as APICartItemEditResponse
    // モック設定
    td.when(api.updateCartItems(td.matchers.anything())).thenResolve([response])
    // 現在の商品の在庫数を設定
    productStore.set({
      id: response.productId,
      stock: 10,
    })

    await shopLogic.addItemToCart(response.productId)

    // APIが適切な引数でコールされたか検証
    td.verify(
      api.updateCartItems([
        {
          id: response.id,
          quantity: response.quantity,
        },
      ])
    )
    // カートアイテムの個数が適切にプラスされたか検証
    const cartItem = cartStore.getById(response.id)!
    expect(cartItem.quantity).toBe(response.quantity)
    // 商品の在庫数が適切にマイナスされたか検証
    const product = productStore.getById(response.productId)!
    expect(product.stock).toBe(response.product.stock)
    // チェックアウトステータスの検証
    expect(shopLogic.checkoutStatus).toBe(CheckoutStatus.None)
  })

  it('ユーザーがサインインしていない場合', async () => {
    // ユーザーがサインインしていない状態へ変更
    userStore.set({ isSignedIn: false })
    // チェックアウトステータスに成功を設定
    cartStore.setCheckoutStatus(CheckoutStatus.Successful)

    let actual!: Error
    try {
      await shopLogic.addItemToCart('cartItem1')
    } catch (err) {
      actual = err
    }

    expect(actual).toBeInstanceOf(Error)
    expect(actual.message).toBe('Not signed in.')
  })

  it('APIでエラーが発生した場合', async () => {
    userStore.set({ isSignedIn: true })
    const prevCartItem = cartStore.all[0]
    const prevProduct = productStore.getById(prevCartItem.productId)!
    td.when(api.updateCartItems(td.matchers.anything())).thenThrow(new Error())
    cartStore.setCheckoutStatus(CheckoutStatus.Successful)

    await shopLogic.addItemToCart(prevCartItem.productId)

    // カートアイテムの個数に変化がないことを検証
    const cartItem = cartStore.getById(prevCartItem.id)!
    expect(cartItem.quantity).toBe(prevCartItem.quantity)
    // 商品の在庫数がに変化がないことを検証
    const product = productStore.getById(prevProduct.id)!
    expect(product.stock).toBe(prevProduct.stock)
    // チェックアウトステータスに変化がないことを検証
    expect(shopLogic.checkoutStatus).toBe(CheckoutStatus.Successful)
  })
})

describe('removeItemFromCart()', () => {
  it('カートアイテムの数が2個以上の場合', async () => {
    // ユーザーがサインインしている状態へ変更
    userStore.set({ isSignedIn: true })
    // API実行後のレスポンスの設定
    const response = {
      ...cartStore.all[0],
      quantity: 1,
      product: {
        id: cartStore.all[0].productId,
        stock: 9 + 1,
      },
    } as APICartItemEditResponse
    // モック設定
    td.when(api.updateCartItems(td.matchers.anything())).thenResolve([response])
    // 現在のカートアイテムの個数を設定
    cartStore.set({
      id: response.id,
      // 現在のカートアイテムの個数を2に設定
      // この場合はAPIの`updateCartItems`がコールされる
      quantity: 2,
    })
    // 現在の商品の在庫数を設定
    productStore.set({
      id: response.productId,
      stock: 9,
    })

    await shopLogic.removeItemFromCart(response.productId)

    // APIが適切な引数でコールされたか検証
    td.verify(
      api.updateCartItems([
        {
          id: response.id,
          quantity: response.quantity,
        },
      ])
    )
    // カートアイテムの個数が適切にマイナスされたか検証
    const cartItem = cartStore.getById(response.id)!
    expect(cartItem.quantity).toBe(response.quantity)
    // 商品の在庫数が適切にプラスされたか検証
    const product = productStore.getById(response.productId)!
    expect(product.stock).toBe(response.product.stock)
    // チェックアウトステータスの検証
    expect(shopLogic.checkoutStatus).toBe(CheckoutStatus.None)
  })

  it('カートアイテムの数が1個の場合', async () => {
    // ユーザーがサインインしている状態へ変更
    userStore.set({ isSignedIn: true })
    // API実行後のレスポンスの設定
    const response = {
      ...cartStore.all[0],
      quantity: 0,
      product: {
        id: cartStore.all[0].productId,
        stock: 9 + 1,
      },
    } as APICartItemEditResponse
    // モック設定
    td.when(api.removeCartItems(td.matchers.anything())).thenResolve([response])
    // 現在のカートアイテムの個数を設定
    cartStore.set({
      id: response.id,
      quantity: 1,
    })
    // 現在の商品の在庫数を設定
    productStore.set({
      id: response.productId,
      stock: 9,
    })

    await shopLogic.removeItemFromCart(response.productId)

    // APIが適切な引数でコールされたか検証
    td.verify(api.removeCartItems([response.id]))
    // カートアイテムが削除されたか検証
    expect(cartStore.getById(response.id)).toBeUndefined()
    // 商品の在庫数が適切にプラスされたか検証
    const product = productStore.getById(response.productId)!
    expect(product.stock).toBe(response.product.stock)
    // チェックアウトステータスの検証
    expect(shopLogic.checkoutStatus).toBe(CheckoutStatus.None)
  })

  it('ユーザーがサインインしていない場合', async () => {
    // ユーザーがサインインしていない状態へ変更
    userStore.set({ isSignedIn: false })
    // チェックアウトステータスに成功を設定
    cartStore.setCheckoutStatus(CheckoutStatus.Successful)

    let actual!: Error
    try {
      await shopLogic.removeItemFromCart('cartItem1')
    } catch (err) {
      actual = err
    }

    expect(actual).toBeInstanceOf(Error)
    expect(actual.message).toBe('Not signed in.')
  })

  it('APIでエラーが発生した場合', async () => {
    userStore.set({ isSignedIn: true })
    const prevCartItem = cartStore.all[0]
    const prevProduct = productStore.getById(prevCartItem.productId)!
    td.when(api.updateCartItems(td.matchers.anything())).thenThrow(new Error())
    cartStore.setCheckoutStatus(CheckoutStatus.Successful)

    await shopLogic.addItemToCart(prevCartItem.productId)

    // カートアイテムの個数に変化がないことを検証
    const cartItem = cartStore.getById(prevCartItem.id)!
    expect(cartItem.quantity).toBe(prevCartItem.quantity)
    // 商品の在庫数がに変化がないことを検証
    const product = productStore.getById(prevProduct.id)!
    expect(product.stock).toBe(prevProduct.stock)
    // チェックアウトステータスに変化がないことを検証
    expect(shopLogic.checkoutStatus).toBe(CheckoutStatus.Successful)
  })
})

describe('checkout()', () => {
  it('ベーシックケース', async () => {
    userStore.set({ isSignedIn: true })

    await shopLogic.checkout()

    td.verify(api.checkoutCart())
    expect(shopLogic.cartItems).toEqual([])
    expect(shopLogic.checkoutStatus).toBe(CheckoutStatus.Successful)
  })

  it('APIでエラーが発生した場合', async () => {
    td.when(api.checkoutCart()).thenThrow(new Error())

    await shopLogic.checkout()

    expect(shopLogic.cartItems).toEqual(CART_ITEMS)
    expect(shopLogic.checkoutStatus).toBe(CheckoutStatus.Failed)
  })
})
