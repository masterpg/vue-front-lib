import { APIContainer, CartItemEditResponse, RawCartItem, RawProduct } from '@/app/logic/api'
import { CartItem, Product } from '@/app/logic'
import dayjs from 'dayjs'
import { provideDependency } from '../../../../helpers/app'

//========================================================================
//
//  Test data
//
//========================================================================

const RAW_PRODUCTS: RawProduct[] = [
  { id: 'product1', title: 'iPad 4 Mini', price: 39700, stock: 1, createdAt: '2020-01-01T00:00:00.000Z', updatedAt: '2020-01-02T00:00:00.000Z' },
  { id: 'product2', title: 'Fire HD 8 Tablet', price: 8980, stock: 5, createdAt: '2020-01-01T00:00:00.000Z', updatedAt: '2020-01-02T00:00:00.000Z' },
  { id: 'product3', title: 'MediaPad 10', price: 26400, stock: 10, createdAt: '2020-01-01T00:00:00.000Z', updatedAt: '2020-01-02T00:00:00.000Z' },
  { id: 'product4', title: 'Surface Go', price: 54290, stock: 0, createdAt: '2020-01-01T00:00:00.000Z', updatedAt: '2020-01-02T00:00:00.000Z' },
]

const PRODUCTS: Product[] = RAW_PRODUCTS.map(apiProduct => {
  const { createdAt, updatedAt, ...body } = apiProduct
  return {
    ...body,
    createdAt: dayjs(createdAt),
    updatedAt: dayjs(updatedAt),
  }
})

const RAW_CART_ITEMS: RawCartItem[] = [
  {
    id: 'cartItem1',
    uid: 'taro.yamada',
    productId: 'product1',
    title: 'iPad 4 Mini',
    price: 39700,
    quantity: 2,
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2020-01-02T00:00:00.000Z',
  },
  {
    id: 'cartItem2',
    uid: 'taro.yamada',
    productId: 'product2',
    title: 'Fire HD 8 Tablet',
    price: 8980,
    quantity: 1,
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2020-01-02T00:00:00.000Z',
  },
]

const CART_ITEMS: CartItem[] = RAW_CART_ITEMS.map(apiCartItem => {
  const { createdAt, updatedAt, ...body } = apiCartItem
  return {
    ...body,
    createdAt: dayjs(createdAt),
    updatedAt: dayjs(updatedAt),
  }
})

//========================================================================
//
//  Test helpers
//
//========================================================================

/**
 * 擬似的なサインインを実現するためにテスト用IDトークンを設定します。
 */
function setTestIdToken(): void {
  // TODO
  //  ここでローカルストレージに保存したIDトークンはAPIリクエストで使用されます。
  localStorage.setItem('idToken', JSON.stringify({ uid: 'taro.yamada' }))
}

//========================================================================
//
//  Tests
//
//========================================================================

describe('APIContainer', () => {
  beforeEach(async () => {})

  describe('getProducts', () => {
    it('ベーシックケース', async () => {
      const { api } = provideDependency()
      await api.putTestData({
        products: RAW_PRODUCTS,
      })

      const product1 = PRODUCTS[0]

      // テスト対象実行
      const actual = await api.getProduct(product1.id)

      expect(actual).toEqual(product1)
    })
  })

  describe('getProducts', () => {
    it('ベーシックケース - 引数なし', async () => {
      const { api } = provideDependency()
      await api.putTestData({
        products: RAW_PRODUCTS,
      })

      // テスト対象実行
      const actual = await api.getProducts()

      expect(actual).toEqual(PRODUCTS)
    })

    it('ベーシックケース - 引数あり', async () => {
      const { api } = provideDependency()
      await api.putTestData({
        products: RAW_PRODUCTS,
      })

      const [product1, product2] = PRODUCTS

      // テスト対象実行
      const actual = await api.getProducts([product1.id, product2.id])

      expect(actual).toEqual([product1, product2])
    })
  })

  it('getCartItem', async () => {
    const { api } = provideDependency()
    await api.putTestData({
      cartItems: RAW_CART_ITEMS,
    })

    const cartItem1 = CART_ITEMS[0]
    setTestIdToken()

    // テスト対象実行
    const actual = await api.getCartItem(cartItem1.id)

    expect(actual).toEqual(cartItem1)
  })

  describe('getCartItems', () => {
    it('ベーシックケース - 引数なし', async () => {
      const { api } = provideDependency()
      await api.putTestData({
        cartItems: RAW_CART_ITEMS,
      })

      setTestIdToken()

      // テスト対象実行
      const actual = await api.getCartItems()

      expect(actual).toEqual(CART_ITEMS)
    })

    it('ベーシックケース - 引数あり', async () => {
      const { api } = provideDependency()
      await api.putTestData({
        cartItems: RAW_CART_ITEMS,
      })

      const [cartItem1, cartItem2] = CART_ITEMS
      setTestIdToken()

      // テスト対象実行
      const actual = await api.getCartItems([cartItem1.id, cartItem2.id])

      expect(actual).toEqual([cartItem1, cartItem2])
    })
  })

  describe('addCartItems', () => {
    it('ベーシックケース', async () => {
      const { api } = provideDependency()
      await api.putTestData({
        products: PRODUCTS,
        cartItems: RAW_CART_ITEMS,
      })

      const product3 = PRODUCTS[2]
      const now = dayjs()
      setTestIdToken()

      // テスト対象実行
      const actual = await api.addCartItems([
        {
          productId: product3.id,
          title: product3.title,
          price: product3.price,
          quantity: 1,
        },
      ])

      expect(actual.length).toBe(1)
      expect(actual[0]).toMatchObject({
        uid: 'taro.yamada',
        productId: product3.id,
        title: product3.title,
        price: product3.price,
        quantity: 1,
        product: {
          id: product3.id,
          stock: product3.stock - 1,
        },
      } as CartItemEditResponse)
      expect(actual[0].id.length > 0).toBeTruthy()
      expect(actual[0].createdAt.isAfter(now)).toBeTruthy()
      expect(actual[0].updatedAt.isAfter(now)).toBeTruthy()
    })
  })

  describe('updateCartItems', () => {
    it('ベーシックケース', async () => {
      const { api } = provideDependency()
      await api.putTestData({
        products: PRODUCTS,
        cartItems: RAW_CART_ITEMS,
      })

      const product1 = PRODUCTS[0]
      const cartItem1 = CART_ITEMS[0]
      const now = dayjs()
      setTestIdToken()

      // テスト対象実行
      const actual = await api.updateCartItems([
        {
          id: cartItem1.id,
          quantity: cartItem1.quantity + 1,
        },
      ])

      expect(actual.length).toBe(1)
      expect(actual[0]).toMatchObject({
        id: cartItem1.id,
        uid: cartItem1.uid,
        productId: cartItem1.productId,
        title: cartItem1.title,
        price: cartItem1.price,
        quantity: cartItem1.quantity + 1,
        product: {
          id: cartItem1.productId,
          stock: product1.stock - 1,
        },
      } as CartItemEditResponse)
      expect(actual[0].createdAt).toEqual(cartItem1.createdAt)
      expect(actual[0].updatedAt.isAfter(now)).toBeTruthy()
    })
  })

  describe('removeCartItems', () => {
    it('ベーシックケース', async () => {
      const { api } = provideDependency()
      await api.putTestData({
        products: PRODUCTS,
        cartItems: RAW_CART_ITEMS,
      })

      const product1 = PRODUCTS[0]
      const cartItem1 = CART_ITEMS[0]
      const now = dayjs()
      setTestIdToken()

      // テスト対象実行
      const actual = await api.removeCartItems([cartItem1.id])

      expect(actual.length).toBe(1)
      expect(actual[0]).toMatchObject({
        id: cartItem1.id,
        uid: cartItem1.uid,
        productId: cartItem1.productId,
        title: cartItem1.title,
        price: cartItem1.price,
        quantity: cartItem1.quantity,
        product: {
          id: cartItem1.productId,
          stock: product1.stock + cartItem1.quantity,
        },
      } as CartItemEditResponse)
      expect(actual[0].createdAt).toEqual(cartItem1.createdAt)
      expect(actual[0].updatedAt).toEqual(cartItem1.updatedAt)
    })
  })

  describe('checkoutCart', () => {
    it('ベーシックケース', async () => {
      const { api } = provideDependency()
      await api.putTestData({
        products: PRODUCTS,
        cartItems: RAW_CART_ITEMS,
      })

      setTestIdToken()

      // テスト対象実行
      const actual = await api.checkoutCart()

      expect(actual).toBeTruthy()

      const current = await api.getCartItems()
      expect(current.length).toBe(0)
    })
  })
})
