import { APIAddCartItemInput, APICartItem, APIEditCartItemResponse, APIProduct, api, initAPI } from '@/api'
import { clearAuthUser, putTestData, removeTestStorageDir, setAuthUser, testAPI, uploadTestFiles } from '../../../helpers/comm'
const cloneDeep = require('lodash/cloneDeep')
const isEmpty = require('lodash/isEmpty')

jest.setTimeout(25000)
initAPI(testAPI)

const GENERAL_USER = { uid: 'taro.yamada' }
const TEST_FILES_DIR = 'test-files'

const PRODUCTS: APIProduct[] = [
  { id: 'product1', title: 'iPad 4 Mini', price: 500.01, stock: 3 },
  { id: 'product2', title: 'Fire HD 8 Tablet', price: 80.99, stock: 5 },
  { id: 'product3', title: 'MediaPad T5 10', price: 150.8, stock: 10 },
]

const CART_ITEMS: APICartItem[] = [
  {
    id: 'cartItem1',
    uid: GENERAL_USER.uid,
    productId: 'product1',
    title: 'iPad 4 Mini',
    price: 500.01,
    quantity: 1,
  },
  {
    id: 'cartItem2',
    uid: GENERAL_USER.uid,
    productId: 'product2',
    title: 'Fire HD 8 Tablet',
    price: 80.99,
    quantity: 2,
  },
]

function getAPIErrorResponse(error: any): { statusCode: number; error: string; message: string } {
  return error.graphQLErrors[0].extensions.exception.response
}

beforeEach(async () => {
  clearAuthUser()
})

describe('App API', () => {
  describe('customToken', () => {
    it('疎通確認', async () => {
      setAuthUser(GENERAL_USER)

      const actual = await api.customToken()

      expect(isEmpty(actual)).toBeFalsy()
    })

    it('サインインしていない場合', async () => {
      let actual!: Error
      try {
        await api.customToken()
      } catch (err) {
        actual = err
      }

      expect(getAPIErrorResponse(actual).statusCode).toBe(403)
    })
  })
})

describe('Storage API', () => {
  let userStorageBasePath!: string

  beforeEach(async () => {
    if (!userStorageBasePath) {
      setAuthUser(GENERAL_USER)
      userStorageBasePath = await api.userStorageBasePath()
      clearAuthUser()
    }
    await Promise.all([removeTestStorageDir(TEST_FILES_DIR), removeTestStorageDir(userStorageBasePath)])
  })

  describe('userStorageBasePath', () => {
    it('疎通確認', async () => {
      setAuthUser(GENERAL_USER)

      const actual = await api.userStorageBasePath()

      expect(isEmpty(actual)).toBeFalsy()
    })

    it('サインインしていない場合', async () => {
      let actual!: Error
      try {
        await api.userStorageBasePath()
      } catch (err) {
        actual = err
      }

      expect(getAPIErrorResponse(actual).statusCode).toBe(403)
    })
  })

  describe('userStorageDirNodes', () => {
    it('疎通確認', async () => {
      setAuthUser(GENERAL_USER)
      await uploadTestFiles([{ filePath: `${userStorageBasePath}/docs/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])

      const actual = await api.userStorageDirNodes()

      expect(actual.length).toBe(2)
    })

    it('サインインしていない場合', async () => {
      let actual!: Error
      try {
        await api.userStorageDirNodes()
      } catch (err) {
        actual = err
      }

      expect(getAPIErrorResponse(actual).statusCode).toBe(403)
    })
  })

  describe('createUserStorageDirs', () => {
    it('疎通確認', async () => {
      setAuthUser(GENERAL_USER)

      const actual = await api.createUserStorageDirs(['dir1/dir1_1'])

      expect(actual.length).toBe(2)
      expect(actual[0].path).toBe('dir1')
      expect(actual[1].path).toBe('dir1/dir1_1')

      const nodes = await api.userStorageDirNodes()

      expect(nodes.length).toBe(2)
      expect(nodes[0].path).toBe('dir1')
      expect(nodes[1].path).toBe('dir1/dir1_1')
    })

    it('サインインしていない場合', async () => {
      let actual!: Error
      try {
        await await api.createUserStorageDirs(['dir1/dir1_1'])
      } catch (err) {
        actual = err
      }

      expect(getAPIErrorResponse(actual).statusCode).toBe(403)
    })
  })

  describe('removeUserStorageFiles', () => {
    it('疎通確認', async () => {
      setAuthUser(GENERAL_USER)
      await uploadTestFiles([
        { filePath: `${userStorageBasePath}/docs/fileA.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `${userStorageBasePath}/docs/fileB.txt`, fileData: 'test', contentType: 'text/plain' },
      ])

      const actual = await api.removeUserStorageFiles([`docs/fileA.txt`])

      expect(actual.length).toBe(1)
      expect(actual[0].path).toBe(`docs/fileA.txt`)

      const nodes = await api.userStorageDirNodes()

      expect(nodes.length).toBe(2)
      expect(nodes[0].path).toBe('docs')
      expect(nodes[1].path).toBe(`docs/fileB.txt`)
    })

    it('サインインしていない場合', async () => {
      let actual!: Error
      try {
        await await api.removeUserStorageFiles([`docs/fileA.txt`])
      } catch (err) {
        actual = err
      }

      expect(getAPIErrorResponse(actual).statusCode).toBe(403)
    })
  })

  describe('removeUserStorageDir', () => {
    it('疎通確認', async () => {
      setAuthUser(GENERAL_USER)
      await uploadTestFiles([
        { filePath: `${userStorageBasePath}/docs/fileA.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `${userStorageBasePath}/docs/fileB.txt`, fileData: 'test', contentType: 'text/plain' },
      ])

      const actual = await api.removeUserStorageDir(`docs`)

      expect(actual.length).toBe(2)
      expect(actual[0].path).toBe(`docs/fileA.txt`)
      expect(actual[1].path).toBe(`docs/fileB.txt`)

      const nodes = await api.userStorageDirNodes()

      expect(nodes.length).toBe(0)
    })

    it('サインインしていない場合', async () => {
      let actual!: Error
      try {
        await await api.removeUserStorageDir(`docs/fileA.txt`)
      } catch (err) {
        actual = err
      }

      expect(getAPIErrorResponse(actual).statusCode).toBe(403)
    })
  })
})

describe('Product API', () => {
  describe('product', () => {
    it('疎通確認', async () => {
      await putTestData([{ collectionName: 'products', collectionRecords: PRODUCTS }])
      const product = PRODUCTS[0]

      const actual = await api.product(product.id)

      expect(actual).toMatchObject(product)
    })

    it('存在しない商品IDを指定した場合', async () => {
      await putTestData([{ collectionName: 'products', collectionRecords: PRODUCTS }])
      const actual = await api.product('productXXX')

      expect(actual).toBeUndefined()
    })
  })

  describe('products', () => {
    it('疎通確認', async () => {
      await putTestData([{ collectionName: 'products', collectionRecords: PRODUCTS }])
      const ids = [PRODUCTS[0].id, PRODUCTS[1].id]

      const actual = await api.products(ids)

      expect(actual).toMatchObject([PRODUCTS[0], PRODUCTS[1]])
    })

    it('存在しない商品IDを指定した場合', async () => {
      await putTestData([{ collectionName: 'products', collectionRecords: PRODUCTS }])
      const ids = ['productXXX', 'productYYY']

      const actual = await api.products(ids)

      expect(actual.length).toBe(0)
    })
  })
})

describe('Cart API', () => {
  describe('cartItem', () => {
    it('疎通確認', async () => {
      setAuthUser(GENERAL_USER)
      await putTestData([{ collectionName: 'products', collectionRecords: PRODUCTS }, { collectionName: 'cart', collectionRecords: CART_ITEMS }])
      const cartItem = CART_ITEMS[0]

      const actual = await api.cartItem(cartItem.id)

      expect(actual).toMatchObject(cartItem)
    })

    it('存在しないカートアイテムIDを指定した場合', async () => {
      setAuthUser(GENERAL_USER)
      await putTestData([{ collectionName: 'products', collectionRecords: PRODUCTS }, { collectionName: 'cart', collectionRecords: CART_ITEMS }])
      const actual = await api.cartItem('cartItemXXX')

      expect(actual).toBeUndefined()
    })

    it('サインインしていない場合', async () => {
      const cartItem = CART_ITEMS[0]

      let actual!: Error
      try {
        await api.cartItem(cartItem.id)
      } catch (err) {
        actual = err
      }

      expect(getAPIErrorResponse(actual).statusCode).toBe(403)
    })
  })

  describe('cartItems', () => {
    it('疎通確認', async () => {
      setAuthUser(GENERAL_USER)
      await putTestData([{ collectionName: 'products', collectionRecords: PRODUCTS }, { collectionName: 'cart', collectionRecords: CART_ITEMS }])
      const ids = [CART_ITEMS[0].id, CART_ITEMS[1].id]

      const actual = await api.cartItems(ids)

      expect(actual).toMatchObject([CART_ITEMS[0], CART_ITEMS[1]])
    })

    it('存在しない商品IDを指定した場合', async () => {
      setAuthUser(GENERAL_USER)
      await putTestData([{ collectionName: 'products', collectionRecords: PRODUCTS }, { collectionName: 'cart', collectionRecords: CART_ITEMS }])
      const ids = ['cartItemXXX', 'cartItemYYY']

      const actual = await api.cartItems(ids)

      expect(actual.length).toBe(0)
    })

    it('サインインしていない場合', async () => {
      const ids = [CART_ITEMS[0].id, CART_ITEMS[1].id]

      let actual!: Error
      try {
        await api.cartItems(ids)
      } catch (err) {
        actual = err
      }

      expect(getAPIErrorResponse(actual).statusCode).toBe(403)
    })
  })

  describe('addCartItems', () => {
    const ADD_CART_ITEMS = cloneDeep(CART_ITEMS).map(item => {
      delete item.id
      delete item.uid
      return item
    }) as APIAddCartItemInput[]

    it('疎通確認', async () => {
      setAuthUser(GENERAL_USER)
      await putTestData([{ collectionName: 'products', collectionRecords: PRODUCTS }, { collectionName: 'cart', collectionRecords: [] }])
      const addItems = cloneDeep(ADD_CART_ITEMS) as APIAddCartItemInput[]
      const expectedItems = addItems.map(addItem => {
        const product = PRODUCTS.find(product => product.id === addItem.productId)!
        return {
          ...addItem,
          product: {
            id: product.id,
            stock: product.stock - addItem.quantity,
          },
        }
      }) as APIEditCartItemResponse[]

      const actual = await api.addCartItems(addItems)

      expect(actual.length).toBe(addItems.length)
      for (let i = 0; i < actual.length; i++) {
        const actualItem = actual[i]
        expect(actualItem.id).toEqual(expect.anything())
        expect(actualItem.uid).toBe(GENERAL_USER.uid)
        expect(actualItem).toMatchObject(expectedItems[i])
      }
    })

    it('サインインしていない場合', async () => {
      const addItems = cloneDeep(ADD_CART_ITEMS) as APIAddCartItemInput[]

      let actual!: Error
      try {
        await api.addCartItems(addItems)
      } catch (err) {
        actual = err
      }

      expect(getAPIErrorResponse(actual).statusCode).toBe(403)
    })
  })

  describe('updateCartItems', () => {
    it('疎通確認', async () => {
      setAuthUser(GENERAL_USER)
      await putTestData([{ collectionName: 'products', collectionRecords: PRODUCTS }, { collectionName: 'cart', collectionRecords: CART_ITEMS }])
      const updateItems = CART_ITEMS.map(item => {
        return { ...item, quantity: item.quantity + 1 }
      })
      const expectedItems = updateItems.map(item => {
        const product = PRODUCTS.find(product => product.id === item.productId)!
        return { ...item, product: { id: product.id, stock: product.stock - 1 } }
      })

      const actual = await api.updateCartItems(updateItems)

      expect(actual.length).toBe(updateItems.length)
      for (let i = 0; i < actual.length; i++) {
        expect(actual[i]).toMatchObject(expectedItems[i])
      }
    })

    it('サインインしていない場合', async () => {
      const updateItems = cloneDeep(CART_ITEMS) as APICartItem[]

      let actual!: Error
      try {
        await api.updateCartItems(updateItems)
      } catch (err) {
        actual = err
      }

      expect(getAPIErrorResponse(actual).statusCode).toBe(403)
    })
  })

  describe('removeCartItems', () => {
    it('疎通確認', async () => {
      setAuthUser(GENERAL_USER)
      await putTestData([{ collectionName: 'products', collectionRecords: PRODUCTS }, { collectionName: 'cart', collectionRecords: CART_ITEMS }])
      const removeIds = CART_ITEMS.map(item => item.id) as string[]
      const expectedItems = removeIds.map(id => {
        const cartItem = CART_ITEMS.find(item => item.id === id)!
        const product = PRODUCTS.find(product => product.id === cartItem.productId)!
        return {
          ...cartItem,
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

      expect(getAPIErrorResponse(actual).statusCode).toBe(403)
    })
  })

  describe('checkout', () => {
    it('ベーシックケース', async () => {
      setAuthUser(GENERAL_USER)
      await putTestData([{ collectionName: 'products', collectionRecords: PRODUCTS }, { collectionName: 'cart', collectionRecords: CART_ITEMS }])

      const actual = await api.checkoutCart()

      expect(actual).toBeTruthy()
      // カートアイテムが削除されてることを検証
      const cartItems = await api.cartItems()
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

      expect(getAPIErrorResponse(actual).statusCode).toBe(403)
    })
  })
})
