import { CartItem, Product } from '@/demo/services'
import { TestDemoAPIContainer, provideDependency, toBeCopyCartItem, toBeCopyProduct } from '../../../../../helpers/demo'
import { AuthHelper } from '@/app/services/helpers'
import { CartItemEditResponse } from '@/demo/services/apis/base'
import dayjs from 'dayjs'

//========================================================================
//
//  Test data
//
//========================================================================

function Products(): Product[] {
  return [
    {
      id: 'product1',
      title: 'iPad 4 Mini',
      price: 39700,
      stock: 1,
      version: 1,
      createdAt: dayjs('2020-01-01'),
      updatedAt: dayjs('2020-01-02'),
    },
    {
      id: 'product2',
      title: 'Fire HD 8 Tablet',
      price: 8980,
      stock: 5,
      version: 1,
      createdAt: dayjs('2020-01-01'),
      updatedAt: dayjs('2020-01-02'),
    },
    {
      id: 'product3',
      title: 'MediaPad 10',
      price: 26400,
      stock: 10,
      version: 1,
      createdAt: dayjs('2020-01-01'),
      updatedAt: dayjs('2020-01-02'),
    },
    {
      id: 'product4',
      title: 'Surface Go',
      price: 54290,
      stock: 0,
      version: 1,
      createdAt: dayjs('2020-01-01'),
      updatedAt: dayjs('2020-01-02'),
    },
  ]
}

function CartItems(): CartItem[] {
  return [
    {
      id: 'cartItem1',
      uid: 'taro.yamada',
      productId: 'product1',
      title: 'iPad 4 Mini',
      price: 39700,
      quantity: 2,
      version: 1,
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
      version: 1,
      createdAt: dayjs('2020-01-01'),
      updatedAt: dayjs('2020-01-02'),
    },
  ]
}

//========================================================================
//
//  Tests
//
//========================================================================

describe('ShopService', () => {
  beforeEach(async () => {
    provideDependency(({ service }) => {
      // Firebaseの認証状態が変化した際の処理は実行されたくないので無効化
      service.auth.firebaseOnAuthStateChanged.value = async user => {}
    })
  })

  it('fetchProducts', async () => {
    const { stores, service } = provideDependency(({ apis }) => {
      // モック設定
      const getProducts = td.replace<TestDemoAPIContainer, 'getProducts'>(apis, 'getProducts')
      td.when(getProducts()).thenResolve(Products())
    })

    // テスト対象実行
    const actual = await service.shop.fetchProducts()

    expect(actual).toEqual(Products())
    expect(stores.product.all.value).toEqual(Products())
    toBeCopyProduct(stores, actual)
  })

  describe('fetchCartItems', () => {
    it('ベーシックケース', async () => {
      const { stores, helpers, service } = provideDependency(({ apis, helpers }) => {
        // モック設定
        td.replace<AuthHelper, 'validateSignedIn'>(helpers.auth, 'validateSignedIn')
        const getCartItems = td.replace<TestDemoAPIContainer, 'getCartItems'>(apis, 'getCartItems')
        td.when(getCartItems()).thenResolve(CartItems())
      })

      // テスト対象実行
      const actual = await service.shop.fetchCartItems()

      expect(actual).toEqual(CartItems())
      expect(stores.cart.all.value).toEqual(CartItems())
      toBeCopyCartItem(stores, actual)

      // validateSignedInの呼び出しを検証
      const exp = td.explain(helpers.auth.validateSignedIn)
      expect(exp.calls.length).toBe(1) // 1回呼び出されるはず
      expect(exp.calls[0].args[0]).toBeUndefined() // 1回目の呼び出しが引数なしなはず
    })

    it('APIでエラーが発生した場合', async () => {
      const expected = new Error()
      const { stores, service } = provideDependency(({ apis, helpers }) => {
        // モック設定
        td.replace<AuthHelper, 'validateSignedIn'>(helpers.auth, 'validateSignedIn')
        const getCartItems = td.replace<TestDemoAPIContainer, 'getCartItems'>(apis, 'getCartItems')
        td.when(getCartItems()).thenReject(expected)
      })

      let actual!: Error
      try {
        // テスト対象実行
        await service.shop.fetchCartItems()
      } catch (err) {
        actual = err
      }

      expect(actual).toBe(expected)
      // ストアに変化がないことを検証
      expect(stores.cart.all.value.length).toBe(0)
    })
  })

  describe('addItemToCart', () => {
    it('ベーシックケース - 追加', async () => {
      // 現在の商品の在庫数を設定
      const products = Products()
      const product3 = products[2]
      product3.stock = 10
      // API実行後のレスポンスオブジェクト
      const response: CartItemEditResponse = {
        id: CartItem.generateId(),
        uid: 'taro.yamada',
        productId: product3.id,
        title: product3.title,
        price: product3.price,
        quantity: 1,
        version: 1,
        createdAt: dayjs(),
        updatedAt: dayjs(),
        product: {
          id: product3.id,
          stock: product3.stock - 1,
          version: product3.version + 1,
          createdAt: dayjs(),
          updatedAt: dayjs(),
        },
      }

      const { apis, stores, helpers, service } = provideDependency(({ apis, stores, helpers }) => {
        // ストア設定
        stores.product.setAll(products)
        // モック設定
        td.replace<AuthHelper, 'validateSignedIn'>(helpers.auth, 'validateSignedIn')
        const addCartItems = td.replace<TestDemoAPIContainer, 'addCartItems'>(apis, 'addCartItems')
        td.when(addCartItems(td.matchers.anything())).thenResolve([response])
      })

      // テスト対象実行
      await service.shop.addItemToCart(response.product.id)

      // APIが適切な引数でコールされたか検証
      td.verify(
        apis.addCartItems([
          {
            productId: response.productId,
            title: response.title,
            price: response.price,
            quantity: response.quantity,
          },
        ])
      )
      // カートにアイテムが追加されたか検証
      const cartItem = stores.cart.sgetById(response.id)
      expect(cartItem.quantity).toBe(response.quantity)
      // 商品の在庫数が適切にマイナスされたか検証
      const product = stores.product.sgetById(response.productId)
      expect(product.stock).toBe(response.product.stock)

      // validateSignedInの呼び出しを検証
      const exp = td.explain(helpers.auth.validateSignedIn)
      expect(exp.calls.length).toBe(1)
      expect(exp.calls[0].args[0]).toBeUndefined()
    })

    it('ベーシックケース - 更新', async () => {
      // 現在の商品の在庫数を設定
      const products = Products()
      const product1 = products[0]
      product1.stock = 10
      // API実行後のレスポンスオブジェクト
      const cartItem1 = CartItems()[0]
      expect(cartItem1.productId).toBe(product1.id)
      const response: CartItemEditResponse = {
        ...cartItem1,
        quantity: cartItem1.quantity + 1,
        updatedAt: dayjs(),
        product: {
          id: cartItem1.productId,
          stock: product1.stock - 1,
          version: product1.version + 1,
          createdAt: product1.createdAt,
          updatedAt: dayjs(),
        },
      }

      const { apis, stores, helpers, service } = provideDependency(({ apis, stores, helpers }) => {
        // ストア設定
        stores.product.setAll(products)
        stores.cart.setAll(CartItems())
        // モック設定
        td.replace<AuthHelper, 'validateSignedIn'>(helpers.auth, 'validateSignedIn')
        const updateCartItems = td.replace<TestDemoAPIContainer, 'updateCartItems'>(apis, 'updateCartItems')
        td.when(updateCartItems(td.matchers.anything())).thenResolve([response])
      })

      // テスト対象実行
      await service.shop.addItemToCart(response.product.id)

      // APIが適切な引数でコールされたか検証
      td.verify(
        apis.updateCartItems([
          {
            id: response.id,
            quantity: response.quantity,
          },
        ])
      )
      // カートアイテムの個数が適切にプラスされたか検証
      const cartItem = stores.cart.sgetById(response.id)
      expect(cartItem.quantity).toBe(response.quantity)
      // 商品の在庫数が適切にマイナスされたか検証
      const product = stores.product.sgetById(response.productId)
      expect(product.stock).toBe(response.product.stock)

      // validateSignedInの呼び出しを検証
      const exp = td.explain(helpers.auth.validateSignedIn)
      expect(exp.calls.length).toBe(1)
      expect(exp.calls[0].args[0]).toBeUndefined()
    })

    it('在庫が足りなかった場合', async () => {
      const products = Products()
      const product1 = products[0]
      // 現在の商品の在庫数を設定
      product1.stock = 0

      const { stores, service } = provideDependency(({ apis, stores, helpers }) => {
        // ストア設定
        stores.product.setAll(products)
        // モック設定
        td.replace<AuthHelper, 'validateSignedIn'>(helpers.auth, 'validateSignedIn')
        const addCartItems = td.replace<TestDemoAPIContainer, 'addCartItems'>(apis, 'addCartItems')
        td.when(addCartItems(td.matchers.anything())).thenReject(new Error())
      })

      let actual!: Error
      try {
        // テスト対象実行
        await service.shop.addItemToCart(product1.id)
      } catch (err) {
        actual = err
      }

      expect(actual).toBeInstanceOf(Error)
      // ストアに変化がないことを検証
      expect(stores.product.all.value).toEqual(products)
      expect(stores.cart.all.value.length).toBe(0)
    })

    it('APIでエラーが発生した場合', async () => {
      const product1 = Products()[0]

      const expected = new Error()
      const { stores, service } = provideDependency(({ apis, stores, helpers }) => {
        // ストア設定
        stores.product.setAll(Products())
        // モック設定
        td.replace<AuthHelper, 'validateSignedIn'>(helpers.auth, 'validateSignedIn')
        const addCartItems = td.replace<TestDemoAPIContainer, 'addCartItems'>(apis, 'addCartItems')
        td.when(addCartItems(td.matchers.anything())).thenReject(expected)
      })

      let actual!: Error
      try {
        // テスト対象実行
        await service.shop.addItemToCart(product1.id)
      } catch (err) {
        actual = err
      }

      expect(actual).toBe(expected)
      // ストアに変化がないことを検証
      expect(stores.product.all.value).toEqual(Products())
      expect(stores.cart.all.value.length).toBe(0)
    })
  })

  describe('removeItemFromCart', () => {
    it('ベーシックケース - 更新', async () => {
      // 現在の商品の在庫数を設定
      const products = Products()
      const product1 = products[0]
      product1.stock = 10
      // 現在のカートの数量を設定
      const cartItems = CartItems()
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
          version: product1.version + 1,
          createdAt: product1.updatedAt,
          updatedAt: dayjs(),
        },
      }

      const { apis, stores, helpers, service } = provideDependency(({ apis, stores, helpers }) => {
        // ストア設定
        stores.product.setAll(products)
        stores.cart.setAll(cartItems)
        // モック設定
        td.replace<AuthHelper, 'validateSignedIn'>(helpers.auth, 'validateSignedIn')
        const updateCartItems = td.replace<TestDemoAPIContainer, 'updateCartItems'>(apis, 'updateCartItems')
        td.when(updateCartItems(td.matchers.anything())).thenResolve([response])
      })

      // テスト対象実行
      await service.shop.removeItemFromCart(response.product.id)

      // APIが適切な引数でコールされたか検証
      td.verify(
        apis.updateCartItems([
          {
            id: response.id,
            quantity: response.quantity,
          },
        ])
      )
      // カートアイテムの個数が適切にマイナスされたか検証
      const cartItem = stores.cart.sgetById(response.id)
      expect(cartItem.quantity).toBe(response.quantity)
      // 商品の在庫数が適切にプラスされたか検証
      const product = stores.product.sgetById(response.productId)
      expect(product.stock).toBe(response.product.stock)

      // validateSignedInの呼び出しを検証
      const exp = td.explain(helpers.auth.validateSignedIn)
      expect(exp.calls.length).toBe(1)
      expect(exp.calls[0].args[0]).toBeUndefined()
    })

    it('ベーシックケース - 削除', async () => {
      // 現在の商品の在庫数を設定
      const products = Products()
      const product1 = products[0]
      product1.stock = 10
      // 現在のカートの数量を設定
      const cartItems = CartItems()
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
          version: product1.version + 1,
          createdAt: product1.updatedAt,
          updatedAt: dayjs(),
        },
      }

      const { apis, stores, helpers, service } = provideDependency(({ apis, stores, helpers }) => {
        // ストア設定
        stores.product.setAll(products)
        stores.cart.setAll(cartItems)
        // モック設定
        td.replace<AuthHelper, 'validateSignedIn'>(helpers.auth, 'validateSignedIn')
        const removeCartItems = td.replace<TestDemoAPIContainer, 'removeCartItems'>(apis, 'removeCartItems')
        td.when(removeCartItems(td.matchers.anything())).thenResolve([response])
      })

      // テスト対象実行
      await service.shop.removeItemFromCart(response.product.id)

      // APIが適切な引数でコールされたか検証
      td.verify(apis.removeCartItems([response.id]))
      // カートアイテムが削除されたか検証
      const cartItem = stores.cart.getById(response.id)
      expect(cartItem).toBeUndefined()
      // 商品の在庫数が適切にプラスされたか検証
      const product = stores.product.sgetById(response.productId)
      expect(product.stock).toBe(response.product.stock)

      // validateSignedInの呼び出しを検証
      const exp = td.explain(helpers.auth.validateSignedIn)
      expect(exp.calls.length).toBe(1)
      expect(exp.calls[0].args[0]).toBeUndefined()
    })

    it('APIでエラーが発生した場合', async () => {
      const product1 = Products()[0]
      // 現在のカートの数量を設定
      const cartItems = CartItems()
      const cartItem1 = cartItems[0]
      cartItem1.quantity = 1

      const expected = new Error()
      const { stores, service } = provideDependency(({ apis, stores, helpers }) => {
        // ストア設定
        stores.product.setAll(Products())
        stores.cart.setAll(cartItems)
        // モック設定
        td.replace<AuthHelper, 'validateSignedIn'>(helpers.auth, 'validateSignedIn')
        const removeCartItems = td.replace<TestDemoAPIContainer, 'removeCartItems'>(apis, 'removeCartItems')
        td.when(removeCartItems(td.matchers.anything())).thenReject(expected)
      })

      let actual!: Error
      try {
        // テスト対象実行
        await service.shop.removeItemFromCart(product1.id)
      } catch (err) {
        actual = err
      }

      expect(actual).toBe(expected)
      // ストアに変化がないことを検証
      expect(stores.product.all.value).toEqual(Products())
      expect(stores.cart.all.value).toEqual(cartItems)
    })
  })

  describe('checkout', () => {
    it('ベーシックケース', async () => {
      const { apis, service } = provideDependency(({ apis, stores, helpers }) => {
        // ストア設定
        stores.product.setAll(Products())
        stores.cart.setAll(CartItems())
        // モック設定
        td.replace<AuthHelper, 'validateSignedIn'>(helpers.auth, 'validateSignedIn')
        const checkoutCart = td.replace<TestDemoAPIContainer, 'checkoutCart'>(apis, 'checkoutCart')
        td.when(checkoutCart()).thenResolve(true)
      })

      // テスト対象の実行
      await service.shop.checkout()

      td.verify(apis.checkoutCart())
      expect(service.shop.cartItems.value.length).toBe(0)
      expect(service.shop.products.value).toEqual(Products())
    })

    it('APIでエラーが発生した場合', async () => {
      const expected = new Error()
      const { stores, service } = provideDependency(({ apis, stores, helpers }) => {
        // ストア設定
        stores.product.setAll(Products())
        stores.cart.setAll(CartItems())
        // モック設定
        td.replace<AuthHelper, 'validateSignedIn'>(helpers.auth, 'validateSignedIn')
        const checkoutCart = td.replace<TestDemoAPIContainer, 'checkoutCart'>(apis, 'checkoutCart')
        td.when(checkoutCart()).thenReject(expected)
      })

      let actual!: Error
      try {
        // テスト対象実行
        await service.shop.checkout()
      } catch (err) {
        actual = err
      }

      expect(actual).toBe(expected)
      // ストアに変化がないことを検証
      expect(stores.product.all.value).toEqual(Products())
      expect(stores.cart.all.value).toEqual(CartItems())
    })
  })
})
