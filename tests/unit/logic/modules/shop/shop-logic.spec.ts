import { APIContainer, CartItemEditResponse } from '@/logic/api'
import { CartItem, Product } from '@/logic'
import { InternalAuthLogic } from '@/logic/modules/internal'
import { ShopLogic } from '@/logic/modules/shop'
import { StoreUtil } from '@/logic/store/base'
import dayjs from 'dayjs'
import { provideDependency } from '../../../../helpers'

//========================================================================
//
//  Test data
//
//========================================================================

const PRODUCTS: Product[] = [
  { id: 'product1', title: 'iPad 4 Mini', price: 39700, stock: 1, createdAt: dayjs('2020-01-01'), updatedAt: dayjs('2020-01-02') },
  { id: 'product2', title: 'Fire HD 8 Tablet', price: 8980, stock: 5, createdAt: dayjs('2020-01-01'), updatedAt: dayjs('2020-01-02') },
  { id: 'product3', title: 'MediaPad 10', price: 26400, stock: 10, createdAt: dayjs('2020-01-01'), updatedAt: dayjs('2020-01-02') },
  { id: 'product4', title: 'Surface Go', price: 54290, stock: 0, createdAt: dayjs('2020-01-01'), updatedAt: dayjs('2020-01-02') },
]

const CART_ITEMS: CartItem[] = [
  {
    id: 'cartItem1',
    uid: 'taro.yamada',
    productId: 'product1',
    title: 'iPad 4 Mini',
    price: 39700,
    quantity: 2,
    createdAt: dayjs('2020-01-01'),
    updatedAt: dayjs('2020-01-02'),
  },
  {
    id: 'cartItem2',
    uid: 'taro.yamada',
    productId: 'product2',
    title: 'Fire HD 8 Tablet',
    price: 8980,
    quantity: 1,
    createdAt: dayjs('2020-01-01'),
    updatedAt: dayjs('2020-01-02'),
  },
]

//========================================================================
//
//  Tests
//
//========================================================================

describe('ShopLogic', () => {
  it('fetchProducts', async () => {
    const { store, logic } = provideDependency(({ api }) => {
      // モック設定
      const getProducts = td.replace<APIContainer, 'getProducts'>(api, 'getProducts')
      td.when(getProducts()).thenResolve(PRODUCTS)
    })

    // テスト対象実行
    const actual = await logic.shop.fetchProducts()

    expect(actual).toEqual(PRODUCTS)
    expect(store.product.all).toEqual(PRODUCTS)
  })

  describe('fetchCartItems', () => {
    it('ベーシックケース', async () => {
      const { store, internal, logic } = provideDependency(({ api, internal }) => {
        // モック設定
        td.replace<InternalAuthLogic, 'validateSignedIn'>(internal.auth, 'validateSignedIn')
        const getCartItems = td.replace<APIContainer, 'getCartItems'>(api, 'getCartItems')
        td.when(getCartItems()).thenResolve(CART_ITEMS)
      })

      // テスト対象実行
      const actual = await logic.shop.fetchCartItems()

      expect(actual).toEqual(CART_ITEMS)
      expect(store.cart.all).toEqual(CART_ITEMS)

      // validateSignedInの呼び出しを検証
      const exp = td.explain(internal.auth.validateSignedIn)
      expect(exp.calls.length).toBe(1) // 1回呼び出されるはず
      expect(exp.calls[0].args[0]).toBeUndefined() // 1回目の呼び出しが引数なしなはず
    })

    it('APIでエラーが発生した場合', async () => {
      const { store, logic } = provideDependency(({ api, internal }) => {
        // モック設定
        const getCartItems = td.replace<APIContainer, 'getCartItems'>(api, 'getCartItems')
        td.when(getCartItems()).thenReject(new Error())
      })

      let actual!: Error
      try {
        // テスト対象実行
        await logic.shop.fetchCartItems()
      } catch (err) {
        actual = err
      }

      expect(actual).toBeInstanceOf(Error)
      // ストアに変化がないことを検証
      expect(store.cart.all.length).toBe(0)
    })
  })

  describe('addItemToCart', () => {
    it('ベーシックケース - 追加', async () => {
      // 現在の商品の在庫数を設定
      const products = StoreUtil.cloneProducts(PRODUCTS)
      const product3 = products[2]
      product3.stock = 10
      // API実行後のレスポンスオブジェクト
      const response: CartItemEditResponse = {
        id: StoreUtil.generateId(),
        uid: 'taro.yamada',
        productId: product3.id,
        title: product3.title,
        price: product3.price,
        quantity: 1,
        createdAt: dayjs(),
        updatedAt: dayjs(),
        product: {
          id: product3.id,
          stock: product3.stock - 1,
        },
      }

      const { api, store, internal, logic } = provideDependency(({ api, store, internal }) => {
        // ストア設定
        store.product.setAll(products)
        // モック設定
        td.replace<InternalAuthLogic, 'validateSignedIn'>(internal.auth, 'validateSignedIn')
        const addCartItems = td.replace<APIContainer, 'addCartItems'>(api, 'addCartItems')
        td.when(addCartItems(td.matchers.anything())).thenResolve([response])
      })

      // テスト対象実行
      await logic.shop.addItemToCart(response.product.id)

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
      const cartItem = store.cart.sgetById(response.id)
      expect(cartItem.quantity).toBe(response.quantity)
      // 商品の在庫数が適切にマイナスされたか検証
      const product = store.product.sgetById(response.productId)
      expect(product.stock).toBe(response.product.stock)

      // validateSignedInの呼び出しを検証
      const exp = td.explain(internal.auth.validateSignedIn)
      expect(exp.calls.length).toBe(1)
      expect(exp.calls[0].args[0]).toBeUndefined()
    })

    it('ベーシックケース - 更新', async () => {
      // 現在の商品の在庫数を設定
      const products = StoreUtil.cloneProducts(PRODUCTS)
      const product1 = products[0]
      product1.stock = 10
      // API実行後のレスポンスオブジェクト
      const cartItem1 = CART_ITEMS[0]
      expect(cartItem1.productId).toBe(product1.id)
      const response: CartItemEditResponse = {
        ...cartItem1,
        quantity: cartItem1.quantity + 1,
        product: {
          id: cartItem1.productId,
          stock: product1.stock - 1,
        },
      }

      const { api, store, internal, logic } = provideDependency(({ api, store, internal }) => {
        // ストア設定
        store.product.setAll(products)
        store.cart.setAll(CART_ITEMS)
        // モック設定
        td.replace<InternalAuthLogic, 'validateSignedIn'>(internal.auth, 'validateSignedIn')
        const updateCartItems = td.replace<APIContainer, 'updateCartItems'>(api, 'updateCartItems')
        td.when(updateCartItems(td.matchers.anything())).thenResolve([response])
      })

      // テスト対象実行
      await logic.shop.addItemToCart(response.product.id)

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
      const cartItem = store.cart.sgetById(response.id)
      expect(cartItem.quantity).toBe(response.quantity)
      // 商品の在庫数が適切にマイナスされたか検証
      const product = store.product.sgetById(response.productId)
      expect(product.stock).toBe(response.product.stock)

      // validateSignedInの呼び出しを検証
      const exp = td.explain(internal.auth.validateSignedIn)
      expect(exp.calls.length).toBe(1)
      expect(exp.calls[0].args[0]).toBeUndefined()
    })

    it('在庫が足りなかった場合', async () => {
      const products = StoreUtil.cloneProducts(PRODUCTS)
      const product1 = products[0]
      // 現在の商品の在庫数を設定
      product1.stock = 0

      const { store, logic } = provideDependency(({ api, store, internal }) => {
        // ストア設定
        store.product.setAll(products)
        // モック設定
        td.replace<InternalAuthLogic, 'validateSignedIn'>(internal.auth, 'validateSignedIn')
        const addCartItems = td.replace<APIContainer, 'addCartItems'>(api, 'addCartItems')
        td.when(addCartItems(td.matchers.anything())).thenReject(new Error())
      })

      let actual!: Error
      try {
        // テスト対象実行
        await logic.shop.addItemToCart(product1.id)
      } catch (err) {
        actual = err
      }

      expect(actual).toBeInstanceOf(Error)
      // ストアに変化がないことを検証
      expect(store.product.all).toEqual(products)
      expect(store.cart.all.length).toBe(0)
    })

    it('APIでエラーが発生した場合', async () => {
      const product1 = PRODUCTS[0]

      const { store, logic } = provideDependency(({ api, store, internal }) => {
        // ストア設定
        store.product.setAll(PRODUCTS)
        // モック設定
        td.replace<InternalAuthLogic, 'validateSignedIn'>(internal.auth, 'validateSignedIn')
        const addCartItems = td.replace<APIContainer, 'addCartItems'>(api, 'addCartItems')
        td.when(addCartItems(td.matchers.anything())).thenReject(new Error())
      })

      let actual!: Error
      try {
        // テスト対象実行
        await logic.shop.addItemToCart(product1.id)
      } catch (err) {
        actual = err
      }

      expect(actual).toBeInstanceOf(Error)
      // ストアに変化がないことを検証
      expect(store.product.all).toEqual(PRODUCTS)
      expect(store.cart.all.length).toBe(0)
    })
  })

  describe('removeItemFromCart', () => {
    it('ベーシックケース - 更新', async () => {
      // 現在の商品の在庫数を設定
      const products = StoreUtil.cloneProducts(PRODUCTS)
      const product1 = products[0]
      product1.stock = 10
      // 現在のカートの数量を設定
      const cartItems = StoreUtil.cloneCartItems(CART_ITEMS)
      const cartItem1 = cartItems[0]
      cartItem1.quantity = 2
      // API実行後のレスポンスオブジェクト
      expect(cartItem1.productId).toBe(product1.id)
      const response: CartItemEditResponse = {
        ...cartItem1,
        quantity: cartItem1.quantity - 1,
        product: {
          id: cartItem1.productId,
          stock: product1.stock + 1,
        },
      }

      const { api, store, internal, logic } = provideDependency(({ api, store, internal }) => {
        // ストア設定
        store.product.setAll(products)
        store.cart.setAll(cartItems)
        // モック設定
        td.replace<InternalAuthLogic, 'validateSignedIn'>(internal.auth, 'validateSignedIn')
        const updateCartItems = td.replace<APIContainer, 'updateCartItems'>(api, 'updateCartItems')
        td.when(updateCartItems(td.matchers.anything())).thenResolve([response])
      })

      // テスト対象実行
      await logic.shop.removeItemFromCart(response.product.id)

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
      const cartItem = store.cart.sgetById(response.id)
      expect(cartItem.quantity).toBe(response.quantity)
      // 商品の在庫数が適切にプラスされたか検証
      const product = store.product.sgetById(response.productId)
      expect(product.stock).toBe(response.product.stock)

      // validateSignedInの呼び出しを検証
      const exp = td.explain(internal.auth.validateSignedIn)
      expect(exp.calls.length).toBe(1)
      expect(exp.calls[0].args[0]).toBeUndefined()
    })

    it('ベーシックケース - 削除', async () => {
      // 現在の商品の在庫数を設定
      const products = StoreUtil.cloneProducts(PRODUCTS)
      const product1 = products[0]
      product1.stock = 10
      // 現在のカートの数量を設定
      const cartItems = StoreUtil.cloneCartItems(CART_ITEMS)
      const cartItem1 = cartItems[0]
      cartItem1.quantity = 1
      // API実行後のレスポンスオブジェクト
      expect(cartItem1.productId).toBe(product1.id)
      const response: CartItemEditResponse = {
        ...cartItem1,
        quantity: cartItem1.quantity - 1,
        product: {
          id: cartItem1.productId,
          stock: product1.stock + 1,
        },
      }

      const { api, store, internal, logic } = provideDependency(({ api, store, internal }) => {
        // ストア設定
        store.product.setAll(products)
        store.cart.setAll(cartItems)
        // モック設定
        td.replace<InternalAuthLogic, 'validateSignedIn'>(internal.auth, 'validateSignedIn')
        const removeCartItems = td.replace<APIContainer, 'removeCartItems'>(api, 'removeCartItems')
        td.when(removeCartItems(td.matchers.anything())).thenResolve([response])
      })

      // テスト対象実行
      await logic.shop.removeItemFromCart(response.product.id)

      // APIが適切な引数でコールされたか検証
      td.verify(api.removeCartItems([response.id]))
      // カートアイテムが削除されたか検証
      const cartItem = store.cart.getById(response.id)
      expect(cartItem).toBeUndefined()
      // 商品の在庫数が適切にプラスされたか検証
      const product = store.product.sgetById(response.productId)
      expect(product.stock).toBe(response.product.stock)

      // validateSignedInの呼び出しを検証
      const exp = td.explain(internal.auth.validateSignedIn)
      expect(exp.calls.length).toBe(1)
      expect(exp.calls[0].args[0]).toBeUndefined()
    })

    it('APIでエラーが発生した場合', async () => {
      const product1 = PRODUCTS[0]
      // 現在のカートの数量を設定
      const cartItems = StoreUtil.cloneCartItems(CART_ITEMS)
      const cartItem1 = cartItems[0]
      cartItem1.quantity = 1

      const { store, logic } = provideDependency(({ api, store, internal }) => {
        // ストア設定
        store.product.setAll(PRODUCTS)
        store.cart.setAll(cartItems)
        // モック設定
        td.replace<InternalAuthLogic, 'validateSignedIn'>(internal.auth, 'validateSignedIn')
        const removeCartItems = td.replace<APIContainer, 'removeCartItems'>(api, 'removeCartItems')
        td.when(removeCartItems(td.matchers.anything())).thenReject(new Error())
      })

      let actual!: Error
      try {
        // テスト対象実行
        await logic.shop.removeItemFromCart(product1.id)
      } catch (err) {
        actual = err
      }

      expect(actual).toBeInstanceOf(Error)
      // ストアに変化がないことを検証
      expect(store.product.all).toEqual(PRODUCTS)
      expect(store.cart.all).toEqual(cartItems)
    })
  })

  describe('checkout', () => {
    it('ベーシックケース', async () => {
      const { api, logic } = provideDependency(({ api, store, internal }) => {
        // ストア設定
        store.product.setAll(PRODUCTS)
        store.cart.setAll(CART_ITEMS)
        // モック設定
        td.replace<InternalAuthLogic, 'validateSignedIn'>(internal.auth, 'validateSignedIn')
        const checkoutCart = td.replace<APIContainer, 'checkoutCart'>(api, 'checkoutCart')
        td.when(checkoutCart()).thenResolve(true)
      })

      // テスト対象の実行
      await logic.shop.checkout()

      td.verify(api.checkoutCart())
      expect(logic.shop.cartItems.length).toBe(0)
      expect(logic.shop.products).toEqual(PRODUCTS)
    })

    it('APIでエラーが発生した場合', async () => {
      const { store, logic } = provideDependency(({ api, store, internal }) => {
        // ストア設定
        store.product.setAll(PRODUCTS)
        store.cart.setAll(CART_ITEMS)
        // モック設定
        td.replace<InternalAuthLogic, 'validateSignedIn'>(internal.auth, 'validateSignedIn')
        const checkoutCart = td.replace<APIContainer, 'checkoutCart'>(api, 'checkoutCart')
        td.when(checkoutCart()).thenReject(new Error())
      })

      let actual!: Error
      try {
        // テスト対象実行
        await logic.shop.checkout()
      } catch (err) {
        actual = err
      }

      expect(actual).toBeInstanceOf(Error)
      // ストアに変化がないことを検証
      expect(store.product.all).toEqual(PRODUCTS)
      expect(store.cart.all).toEqual(CART_ITEMS)
    })
  })
})
