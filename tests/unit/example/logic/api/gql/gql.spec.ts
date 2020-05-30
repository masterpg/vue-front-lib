import { APICartItem, APIProduct } from '../../../../../../src/example/logic/api/gql'
import { CartItem, Product } from '@/example/logic'
import { CartItemAddInput, CartItemEditResponse, CartItemUpdateInput } from '../../../../../../src/example/logic/api'
import { GENERAL_TOKEN } from '../../../../../helpers/common/data'
import { TestAppAPIContainer } from '../../../../../mocks/example/logic/api'
import { cloneDeep } from 'lodash'
import dayjs from 'dayjs'
import { initExampleTest } from '../../../../../helpers/example/init'

//========================================================================
//
//  Test data
//
//========================================================================

const API_PRODUCTS: APIProduct[] = [
  { id: 'product1', title: 'iPad 4 Mini', price: 500.01, stock: 3, createdAt: '2020-01-01', updatedAt: '2020-01-02' },
  { id: 'product2', title: 'Fire HD 8 Tablet', price: 80.99, stock: 5, createdAt: '2020-01-01', updatedAt: '2020-01-02' },
  { id: 'product3', title: 'MediaPad T5 10', price: 150.8, stock: 10, createdAt: '2020-01-01', updatedAt: '2020-01-02' },
]

const PRODUCTS: Product[] = API_PRODUCTS.map(apiProduct => {
  const { createdAt, updatedAt, ...body } = apiProduct
  return {
    ...body,
    createdAt: dayjs(createdAt),
    updatedAt: dayjs(updatedAt),
  }
})

const API_CART_ITEMS: APICartItem[] = [
  {
    id: 'cartItem1',
    uid: GENERAL_TOKEN.uid,
    productId: 'product1',
    title: 'iPad 4 Mini',
    price: 500.01,
    quantity: 1,
    createdAt: '2020-01-01',
    updatedAt: '2020-01-02',
  },
  {
    id: 'cartItem2',
    uid: GENERAL_TOKEN.uid,
    productId: 'product2',
    title: 'Fire HD 8 Tablet',
    price: 80.99,
    quantity: 2,
    createdAt: '2020-01-01',
    updatedAt: '2020-01-02',
  },
]

const CART_ITEMS: CartItem[] = API_CART_ITEMS.map(apiCartItem => {
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

let api!: TestAppAPIContainer

function getAPIErrorResponse(error: any): { statusCode: number; error: string; message: string } {
  return error.graphQLErrors[0].extensions.exception.response
}

//========================================================================
//
//  Tests
//
//========================================================================

beforeAll(async () => {
  api = new TestAppAPIContainer()
  await initExampleTest({ api })
})

beforeEach(async () => {
  api.clearTestAuthUser()
})

describe('Product API', () => {
  describe('getProduct', () => {
    it('疎通確認', async () => {
      await api.putTestStoreData([{ collectionName: 'products', collectionRecords: API_PRODUCTS }])
      const product = PRODUCTS[0]

      const actual = await api.getProduct(product.id)

      expect(actual).toMatchObject(product)
    })

    it('存在しない商品IDを指定した場合', async () => {
      await api.putTestStoreData([{ collectionName: 'products', collectionRecords: API_PRODUCTS }])
      const actual = await api.getProduct('productXXX')

      expect(actual).toBeUndefined()
    })
  })

  describe('getProducts', () => {
    it('疎通確認', async () => {
      await api.putTestStoreData([{ collectionName: 'products', collectionRecords: API_PRODUCTS }])
      const ids = [PRODUCTS[0].id, PRODUCTS[1].id]

      const actual = await api.getProducts(ids)

      expect(actual).toMatchObject([PRODUCTS[0], PRODUCTS[1]])
    })

    it('存在しない商品IDを指定した場合', async () => {
      await api.putTestStoreData([{ collectionName: 'products', collectionRecords: API_PRODUCTS }])
      const ids = ['productXXX', 'productYYY']

      const actual = await api.getProducts(ids)

      expect(actual.length).toBe(0)
    })
  })
})

describe('Cart API', () => {
  describe('getCartItem', () => {
    it('疎通確認', async () => {
      api.setTestAuthToken(GENERAL_TOKEN)
      await api.putTestStoreData([
        { collectionName: 'products', collectionRecords: API_PRODUCTS },
        { collectionName: 'cart', collectionRecords: API_CART_ITEMS },
      ])
      const cartItem = CART_ITEMS[0]

      const actual = await api.getCartItem(cartItem.id)

      expect(actual).toMatchObject(cartItem)
    })

    it('存在しないカートアイテムIDを指定した場合', async () => {
      api.setTestAuthToken(GENERAL_TOKEN)
      await api.putTestStoreData([
        { collectionName: 'products', collectionRecords: API_PRODUCTS },
        { collectionName: 'cart', collectionRecords: API_CART_ITEMS },
      ])
      const actual = await api.getCartItem('cartItemXXX')

      expect(actual).toBeUndefined()
    })

    it('サインインしていない場合', async () => {
      const cartItem = CART_ITEMS[0]

      let actual!: Error
      try {
        await api.getCartItem(cartItem.id)
      } catch (err) {
        actual = err
      }

      expect(getAPIErrorResponse(actual).statusCode).toBe(401)
    })
  })

  describe('getCartItems', () => {
    it('疎通確認', async () => {
      api.setTestAuthToken(GENERAL_TOKEN)
      await api.putTestStoreData([
        { collectionName: 'products', collectionRecords: API_PRODUCTS },
        { collectionName: 'cart', collectionRecords: API_CART_ITEMS },
      ])
      const ids = [CART_ITEMS[0].id, CART_ITEMS[1].id]

      const actual = await api.getCartItems(ids)

      expect(actual).toMatchObject([CART_ITEMS[0], CART_ITEMS[1]])
    })

    it('存在しない商品IDを指定した場合', async () => {
      api.setTestAuthToken(GENERAL_TOKEN)
      await api.putTestStoreData([
        { collectionName: 'products', collectionRecords: API_PRODUCTS },
        { collectionName: 'cart', collectionRecords: API_CART_ITEMS },
      ])
      const ids = ['cartItemXXX', 'cartItemYYY']

      const actual = await api.getCartItems(ids)

      expect(actual.length).toBe(0)
    })

    it('サインインしていない場合', async () => {
      const ids = [CART_ITEMS[0].id, CART_ITEMS[1].id]

      let actual!: Error
      try {
        await api.getCartItems(ids)
      } catch (err) {
        actual = err
      }

      expect(getAPIErrorResponse(actual).statusCode).toBe(401)
    })
  })

  describe('addCartItems', () => {
    const ADD_CART_ITEMS = cloneDeep(CART_ITEMS).map(item => {
      const { id, uid, createdAt, updatedAt, ...body } = item
      return body
    }) as CartItemAddInput[]

    it('疎通確認', async () => {
      api.setTestAuthToken(GENERAL_TOKEN)
      await api.putTestStoreData([
        { collectionName: 'products', collectionRecords: API_PRODUCTS },
        { collectionName: 'cart', collectionRecords: [] },
      ])
      const addItems = cloneDeep(ADD_CART_ITEMS)
      const expectedItems = addItems.map(addItem => {
        const product = PRODUCTS.find(product => product.id === addItem.productId)!
        return {
          ...addItem,
          product: {
            id: product.id,
            stock: product.stock - addItem.quantity,
          },
        }
      }) as CartItemEditResponse[]

      const actual = await api.addCartItems(addItems)

      expect(actual.length).toBe(addItems.length)
      for (let i = 0; i < actual.length; i++) {
        const actualItem = actual[i]
        expect(actualItem.id).toEqual(expect.anything())
        expect(actualItem.uid).toBe(GENERAL_TOKEN.uid)
        expect(actualItem).toMatchObject(expectedItems[i])
      }
    })

    it('サインインしていない場合', async () => {
      const addItems = cloneDeep(ADD_CART_ITEMS) as CartItemAddInput[]

      let actual!: Error
      try {
        await api.addCartItems(addItems)
      } catch (err) {
        actual = err
      }

      expect(getAPIErrorResponse(actual).statusCode).toBe(401)
    })
  })

  describe('updateCartItems', () => {
    it('疎通確認', async () => {
      api.setTestAuthToken(GENERAL_TOKEN)
      await api.putTestStoreData([
        { collectionName: 'products', collectionRecords: API_PRODUCTS },
        { collectionName: 'cart', collectionRecords: API_CART_ITEMS },
      ])
      const updateItems = CART_ITEMS.map(item => {
        return { ...item, quantity: item.quantity + 1 }
      })
      const expectedItems = updateItems.map(item => {
        const product = PRODUCTS.find(product => product.id === item.productId)!
        const { createdAt, updatedAt, ...itemBody } = item
        return { ...itemBody, product: { id: product.id, stock: product.stock - 1 } }
      })

      const actual = await api.updateCartItems(updateItems)

      expect(actual.length).toBe(updateItems.length)
      for (let i = 0; i < actual.length; i++) {
        expect(actual[i]).toMatchObject(expectedItems[i])
      }
    })

    it('サインインしていない場合', async () => {
      const updateItems = cloneDeep(CART_ITEMS) as CartItemUpdateInput[]

      let actual!: Error
      try {
        await api.updateCartItems(updateItems)
      } catch (err) {
        actual = err
      }

      expect(getAPIErrorResponse(actual).statusCode).toBe(401)
    })
  })

  describe('removeCartItems', () => {
    it('疎通確認', async () => {
      api.setTestAuthToken(GENERAL_TOKEN)
      await api.putTestStoreData([
        { collectionName: 'products', collectionRecords: API_PRODUCTS },
        { collectionName: 'cart', collectionRecords: API_CART_ITEMS },
      ])
      const removeIds = CART_ITEMS.map(item => item.id) as string[]
      const expectedItems = removeIds.map(id => {
        const cartItem = CART_ITEMS.find(item => item.id === id)!
        const product = PRODUCTS.find(product => product.id === cartItem.productId)!
        const { createdAt, updatedAt, ...cartItemBody } = cartItem
        return {
          ...cartItemBody,
          quantity: 0,
          product: {
            id: product.id,
            stock: product.stock + cartItem.quantity,
          },
        }
      })

      const actual = await api.removeCartItems(removeIds)

      expect(actual.length).toBe(removeIds.length)
      for (let i = 0; i < actual.length; i++) {
        expect(actual[i]).toMatchObject(expectedItems[i])
      }
    })

    it('サインインしていない場合', async () => {
      const removeIds = CART_ITEMS.map(item => item.id)

      let actual!: Error
      try {
        await api.removeCartItems(removeIds)
      } catch (err) {
        actual = err
      }

      expect(getAPIErrorResponse(actual).statusCode).toBe(401)
    })
  })

  describe('checkout', () => {
    it('ベーシックケース', async () => {
      api.setTestAuthToken(GENERAL_TOKEN)
      await api.putTestStoreData([
        { collectionName: 'products', collectionRecords: API_PRODUCTS },
        { collectionName: 'cart', collectionRecords: API_CART_ITEMS },
      ])

      const actual = await api.checkoutCart()

      expect(actual).toBeTruthy()
      // カートアイテムが削除されてることを検証
      const cartItems = await api.getCartItems()
      expect(cartItems.length).toBe(0)
    })

    it('サインインしていない場合', async () => {
      const removeIds = CART_ITEMS.map(item => item.id)

      let actual!: Error
      try {
        await api.removeCartItems(removeIds)
      } catch (err) {
        actual = err
      }

      expect(getAPIErrorResponse(actual).statusCode).toBe(401)
    })
  })
})
