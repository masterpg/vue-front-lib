import { CartItem, Product } from '@/demo/services'
import { CartItemEditResponse, RawCartItem, RawProduct } from '@/demo/services/apis/base'
import { GeneralToken } from '../../../../helpers/app'
import dayjs from 'dayjs'
import { provideDependency } from '../../../../helpers/demo'

jest.setTimeout(25000)

//========================================================================
//
//  Test data
//
//========================================================================

function RawProducts(): RawProduct[] {
  return [
    {
      id: 'product1',
      title: 'iPad 4 Mini',
      price: 39700,
      stock: 1,
      version: 1,
      createdAt: '2020-01-01T00:00:00.000Z',
      updatedAt: '2020-01-02T00:00:00.000Z',
    },
    {
      id: 'product2',
      title: 'Fire HD 8 Tablet',
      price: 8980,
      stock: 5,
      version: 1,
      createdAt: '2020-01-01T00:00:00.000Z',
      updatedAt: '2020-01-02T00:00:00.000Z',
    },
    {
      id: 'product3',
      title: 'MediaPad 10',
      price: 26400,
      stock: 10,
      version: 1,
      createdAt: '2020-01-01T00:00:00.000Z',
      updatedAt: '2020-01-02T00:00:00.000Z',
    },
    {
      id: 'product4',
      title: 'Surface Go',
      price: 54290,
      stock: 0,
      version: 1,
      createdAt: '2020-01-01T00:00:00.000Z',
      updatedAt: '2020-01-02T00:00:00.000Z',
    },
  ]
}

function Products(): Product[] {
  return RawProducts().map(rawProduct => ({
    ...rawProduct,
    createdAt: dayjs(rawProduct.createdAt),
    updatedAt: dayjs(rawProduct.updatedAt),
  }))
}

function RawCartItems(): RawCartItem[] {
  return [
    {
      id: 'cartItem1',
      uid: GeneralToken().uid,
      productId: 'product1',
      title: 'iPad 4 Mini',
      price: 39700,
      quantity: 2,
      version: 1,
      createdAt: '2020-01-01T00:00:00.000Z',
      updatedAt: '2020-01-02T00:00:00.000Z',
    },
    {
      id: 'cartItem2',
      uid: GeneralToken().uid,
      productId: 'product2',
      title: 'Fire HD 8 Tablet',
      price: 8980,
      quantity: 1,
      version: 1,
      createdAt: '2020-01-01T00:00:00.000Z',
      updatedAt: '2020-01-02T00:00:00.000Z',
    },
  ]
}

function CartItems(): CartItem[] {
  return RawCartItems().map(rawCartItem => ({
    ...rawCartItem,
    createdAt: dayjs(rawCartItem.createdAt),
    updatedAt: dayjs(rawCartItem.updatedAt),
  }))
}

//========================================================================
//
//  Tests
//
//========================================================================

describe('DemoAPIContainer', () => {
  beforeEach(async () => {
    const { apis } = provideDependency()
    apis.type.value = 'gql'
    // apis.type.value = 'rest'
  })

  describe('getProduct', () => {
    it('ベーシックケース', async () => {
      const { apis } = provideDependency()
      await apis.putTestStoreData([{ collectionName: 'products', collectionRecords: RawProducts() }])

      const product1 = Products()[0]

      // テスト対象実行
      const actual = await apis.getProduct(product1.id)

      expect(actual).toMatchObject(product1)
    })
  })

  describe('getProducts', () => {
    it('ベーシックケース - 引数なし', async () => {
      const { apis } = provideDependency()
      await apis.putTestStoreData([{ collectionName: 'products', collectionRecords: RawProducts() }])

      // テスト対象実行
      const actual = await apis.getProducts()

      expect(actual).toMatchObject(Products())
    })

    it('ベーシックケース - 引数あり', async () => {
      const { apis } = provideDependency()
      await apis.putTestStoreData([{ collectionName: 'products', collectionRecords: RawProducts() }])

      const [product1, product2] = Products()

      // テスト対象実行
      const actual = await apis.getProducts([product1.id, product2.id])

      expect(actual).toMatchObject([product1, product2])
    })
  })

  it('getCartItem', async () => {
    const { apis } = provideDependency()
    await apis.putTestStoreData([{ collectionName: 'cart', collectionRecords: RawCartItems() }])

    apis.setTestAuthToken(GeneralToken())
    const cartItem1 = CartItems()[0]

    // テスト対象実行
    const actual = await apis.getCartItem(cartItem1.id)

    expect(actual).toMatchObject(cartItem1)
  })

  describe('getCartItems', () => {
    it('ベーシックケース - 引数なし', async () => {
      const { apis } = provideDependency()
      await apis.putTestStoreData([{ collectionName: 'cart', collectionRecords: RawCartItems() }])

      apis.setTestAuthToken(GeneralToken())

      // テスト対象実行
      const actual = await apis.getCartItems()

      expect(actual).toMatchObject(CartItems())
    })

    it('ベーシックケース - 引数あり', async () => {
      const { apis } = provideDependency()
      await apis.putTestStoreData([{ collectionName: 'cart', collectionRecords: RawCartItems() }])

      apis.setTestAuthToken(GeneralToken())
      const [cartItem1, cartItem2] = CartItems()

      // テスト対象実行
      const actual = await apis.getCartItems([cartItem1.id, cartItem2.id])

      expect(actual).toMatchObject([cartItem1, cartItem2])
    })
  })

  describe('addCartItems', () => {
    it('ベーシックケース', async () => {
      const { apis } = provideDependency()
      await apis.putTestStoreData([
        { collectionName: 'products', collectionRecords: RawProducts() },
        { collectionName: 'cart', collectionRecords: RawCartItems() },
      ])

      apis.setTestAuthToken(GeneralToken())
      const product3 = Products()[2]
      const now = dayjs()

      // テスト対象実行
      const actual = await apis.addCartItems([
        {
          productId: product3.id,
          title: product3.title,
          price: product3.price,
          quantity: 1,
        },
      ])

      expect(actual.length).toBe(1)
      expect(actual[0]).toMatchObject({
        uid: GeneralToken().uid,
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
      const { apis } = provideDependency()
      await apis.putTestStoreData([
        { collectionName: 'products', collectionRecords: RawProducts() },
        { collectionName: 'cart', collectionRecords: RawCartItems() },
      ])

      apis.setTestAuthToken(GeneralToken())
      const product1 = Products()[0]
      const cartItem1 = CartItems()[0]
      const now = dayjs()

      // テスト対象実行
      const actual = await apis.updateCartItems([
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
      const { apis } = provideDependency()
      await apis.putTestStoreData([
        { collectionName: 'products', collectionRecords: RawProducts() },
        { collectionName: 'cart', collectionRecords: RawCartItems() },
      ])

      apis.setTestAuthToken(GeneralToken())
      const product1 = Products()[0]
      const cartItem1 = CartItems()[0]
      const now = dayjs()

      // テスト対象実行
      const actual = await apis.removeCartItems([cartItem1.id])

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
      const { apis } = provideDependency()
      await apis.putTestStoreData([
        { collectionName: 'products', collectionRecords: RawProducts() },
        { collectionName: 'cart', collectionRecords: RawCartItems() },
      ])

      apis.setTestAuthToken(GeneralToken())

      // テスト対象実行
      const actual = await apis.checkoutCart()

      expect(actual).toBeTruthy()

      const current = await apis.getCartItems()
      expect(current.length).toBe(0)
    })
  })
})
