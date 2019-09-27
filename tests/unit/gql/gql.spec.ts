import { GQLAddCartItemInput, GQLCartItem, GQLEditCartItemResponse, GQLProduct, gql, initGQL } from '@/gql'
import { clearAuthUser, putTestData, setAuthUser, testGQL } from '../../helper/comm'
const cloneDeep = require('lodash/cloneDeep')

jest.setTimeout(25000)
initGQL(testGQL)

const TEST_USER = { uid: 'test-user1' }

const PRODUCTS: GQLProduct[] = [
  { id: 'product1', title: 'iPad 4 Mini', price: 500.01, stock: 3 },
  { id: 'product2', title: 'Fire HD 8 Tablet', price: 80.99, stock: 5 },
  { id: 'product3', title: 'MediaPad T5 10', price: 150.8, stock: 10 },
]

const CART_ITEMS: GQLCartItem[] = [
  {
    id: 'cartItem1',
    uid: TEST_USER.uid,
    productId: 'product1',
    title: 'iPad 4 Mini',
    price: 500.01,
    quantity: 1,
  },
  {
    id: 'cartItem2',
    uid: TEST_USER.uid,
    productId: 'product2',
    title: 'Fire HD 8 Tablet',
    price: 80.99,
    quantity: 2,
  },
]

function getGQLErrorResponse(error: any): { statusCode: number; error: string; message: string } {
  return error.graphQLErrors[0].extensions.exception.response
}

beforeEach(async () => {
  clearAuthUser()
})

describe('product', () => {
  it('ベーシックケース', async () => {
    await putTestData([{ collectionName: 'products', collectionRecords: PRODUCTS }])
    const product = PRODUCTS[0]

    const actual = await gql.product(product.id)

    expect(actual).toMatchObject(product)
  })

  it('存在しない商品IDを指定した場合', async () => {
    await putTestData([{ collectionName: 'products', collectionRecords: PRODUCTS }])
    const actual = await gql.product('productXXX')

    expect(actual).toBeUndefined()
  })
})

describe('products', () => {
  it('ベーシックケース', async () => {
    await putTestData([{ collectionName: 'products', collectionRecords: PRODUCTS }])

    const actual = await gql.products()

    expect(actual).toMatchObject(PRODUCTS)
  })

  it('商品IDの配列を指定した場合', async () => {
    await putTestData([{ collectionName: 'products', collectionRecords: PRODUCTS }])
    const ids = [PRODUCTS[0].id, PRODUCTS[1].id]

    const actual = await gql.products(ids)

    expect(actual).toMatchObject([PRODUCTS[0], PRODUCTS[1]])
  })

  it('一部存在しない商品IDを指定した場合', async () => {
    await putTestData([{ collectionName: 'products', collectionRecords: PRODUCTS }])
    const ids = ['productXXX', PRODUCTS[0].id]

    const actual = await gql.products(ids)

    expect(actual).toMatchObject([PRODUCTS[0]])
  })

  it('全て存在しない商品IDを指定した場合', async () => {
    await putTestData([{ collectionName: 'products', collectionRecords: PRODUCTS }])
    const ids = ['productXXX', 'productYYY']

    const actual = await gql.products(ids)

    expect(actual.length).toBe(0)
  })
})

describe('cartItem', () => {
  it('ベーシックケース', async () => {
    setAuthUser(TEST_USER)
    await putTestData([{ collectionName: 'products', collectionRecords: PRODUCTS }, { collectionName: 'cart', collectionRecords: CART_ITEMS }])
    const cartItem = CART_ITEMS[0]

    const actual = await gql.cartItem(cartItem.id)

    expect(actual).toMatchObject(cartItem)
  })

  it('存在しないカートアイテムIDを指定した場合', async () => {
    setAuthUser(TEST_USER)
    await putTestData([{ collectionName: 'products', collectionRecords: PRODUCTS }, { collectionName: 'cart', collectionRecords: CART_ITEMS }])
    const actual = await gql.cartItem('cartItemXXX')

    expect(actual).toBeUndefined()
  })
})

describe('cartItems', () => {
  it('ベーシックケース', async () => {
    setAuthUser(TEST_USER)
    await putTestData([{ collectionName: 'products', collectionRecords: PRODUCTS }, { collectionName: 'cart', collectionRecords: CART_ITEMS }])

    const actual = await gql.cartItems()

    expect(actual).toMatchObject(CART_ITEMS)
  })

  it('カートアイテムIDの配列を指定した場合', async () => {
    setAuthUser(TEST_USER)
    await putTestData([{ collectionName: 'products', collectionRecords: PRODUCTS }, { collectionName: 'cart', collectionRecords: CART_ITEMS }])
    const ids = [CART_ITEMS[0].id, CART_ITEMS[1].id]

    const actual = await gql.cartItems(ids)

    expect(actual).toMatchObject([CART_ITEMS[0], CART_ITEMS[1]])
  })

  it('一部存在しない商品IDを指定した場合', async () => {
    setAuthUser(TEST_USER)
    await putTestData([{ collectionName: 'products', collectionRecords: PRODUCTS }, { collectionName: 'cart', collectionRecords: CART_ITEMS }])
    const ids = ['cartItemXXX', CART_ITEMS[0].id]

    const actual = await gql.cartItems(ids)

    expect(actual).toMatchObject([CART_ITEMS[0]])
  })

  it('全て存在しない商品IDを指定した場合', async () => {
    setAuthUser(TEST_USER)
    await putTestData([{ collectionName: 'products', collectionRecords: PRODUCTS }, { collectionName: 'cart', collectionRecords: CART_ITEMS }])
    const ids = ['cartItemXXX', 'cartItemYYY']

    const actual = await gql.cartItems(ids)

    expect(actual.length).toBe(0)
  })

  it('自ユーザー以外のカートアイテムID指定した場合', async () => {
    setAuthUser(TEST_USER)
    await putTestData([
      { collectionName: 'products', collectionRecords: PRODUCTS },
      {
        collectionName: 'cart',
        // 自ユーザー以外のカートアイテムをテストデータ投入
        collectionRecords: CART_ITEMS.map(item => {
          return { ...item, uid: 'test-userXXX' }
        }),
      },
    ])
    const ids = [CART_ITEMS[0].id, CART_ITEMS[1].id]

    const actual = await gql.cartItems(ids)

    expect(actual.length).toBe(0)
  })

  it('サインインしていない場合', async () => {
    await putTestData([{ collectionName: 'products', collectionRecords: PRODUCTS }, { collectionName: 'cart', collectionRecords: CART_ITEMS }])
    const ids = [CART_ITEMS[0].id, CART_ITEMS[1].id]

    let actual!: Error
    try {
      await gql.cartItems(ids)
    } catch (err) {
      actual = err
    }

    expect(getGQLErrorResponse(actual).statusCode).toBe(403)
  })
})

describe('addCartItems', () => {
  const ADD_CART_ITEMS = cloneDeep(CART_ITEMS).map(item => {
    delete item.id
    delete item.uid
    return item
  }) as GQLAddCartItemInput[]

  it('ベーシックケース', async () => {
    setAuthUser(TEST_USER)
    await putTestData([{ collectionName: 'products', collectionRecords: PRODUCTS }, { collectionName: 'cart', collectionRecords: [] }])
    const addItems = cloneDeep(ADD_CART_ITEMS) as GQLAddCartItemInput[]
    const expectedItems = addItems.map(entryItem => {
      const product = PRODUCTS.find(product => product.id === entryItem.productId)!
      return {
        ...entryItem,
        product: {
          id: product.id,
          stock: product.stock - entryItem.quantity,
        },
      }
    }) as GQLEditCartItemResponse[]

    const actual = await gql.addCartItems(addItems)

    expect(actual.length).toBe(addItems.length)
    const promises: Promise<void>[] = []
    for (let i = 0; i < actual.length; i++) {
      promises.push(
        (async () => {
          // 戻り値の検証
          const actualItem = actual[i]
          expect(actualItem.id).toEqual(expect.anything())
          expect(actualItem.uid).toBe(TEST_USER.uid)
          expect(actualItem).toMatchObject(expectedItems[i])
          // カートアイテムが追加されているか検証
          const addedItem = await gql.cartItem(actualItem.id)
          expect(addedItem).toMatchObject(addItems[i])
          // 商品の在庫が更新されているか検証
          const product = await gql.product(actualItem.productId)
          expect(product).toMatchObject(actualItem.product)
        })()
      )
    }
    await Promise.all(promises)
  })

  it('存在しない商品を指定した場合', async () => {
    setAuthUser(TEST_USER)
    await putTestData([{ collectionName: 'products', collectionRecords: [] }, { collectionName: 'cart', collectionRecords: [] }])
    const addItem = cloneDeep(ADD_CART_ITEMS[0]) as GQLAddCartItemInput
    addItem.productId = 'abcdefg'

    let actual!: Error
    try {
      await gql.addCartItems([addItem])
    } catch (err) {
      actual = err
    }

    expect(getGQLErrorResponse(actual).message).toBe('The specified product was not found.')
  })

  it('既に存在するカートアイテムを追加しようとした場合', async () => {
    await putTestData([{ collectionName: 'products', collectionRecords: PRODUCTS }, { collectionName: 'cart', collectionRecords: CART_ITEMS }])
    setAuthUser(TEST_USER)
    const addItem = cloneDeep(ADD_CART_ITEMS[0]) as GQLAddCartItemInput

    let actual!: Error
    try {
      await gql.addCartItems([addItem])
    } catch (err) {
      actual = err
    }

    expect(getGQLErrorResponse(actual).message).toBe('The specified cart item already exists.')
  })

  it('在庫数を上回る数をカートアイテムに設定した場合', async () => {
    setAuthUser(TEST_USER)
    await putTestData([{ collectionName: 'products', collectionRecords: PRODUCTS }, { collectionName: 'cart', collectionRecords: [] }])
    const addItem = cloneDeep(ADD_CART_ITEMS[0]) as GQLAddCartItemInput
    addItem.quantity = 4 // 在庫数を上回る数を設定

    let actual!: Error
    try {
      await gql.addCartItems([addItem])
    } catch (err) {
      actual = err
    }

    expect(getGQLErrorResponse(actual).message).toBe('The stock of the product was insufficient.')
  })

  it('カートアイテムの数量にマイナス値を設定した場合', async () => {
    setAuthUser(TEST_USER)
    await putTestData([{ collectionName: 'products', collectionRecords: PRODUCTS }, { collectionName: 'cart', collectionRecords: [] }])
    const addItem = cloneDeep(ADD_CART_ITEMS[0]) as GQLAddCartItemInput
    addItem.quantity = -1 // マイナス値を設定

    let actual!: Error
    try {
      await gql.addCartItems([addItem])
    } catch (err) {
      actual = err
    }

    expect(getGQLErrorResponse(actual).message).toBe('Validation failed.')
  })

  it('サインインしていない場合', async () => {
    await putTestData([{ collectionName: 'products', collectionRecords: PRODUCTS }, { collectionName: 'cart', collectionRecords: [] }])
    const addItems = cloneDeep(ADD_CART_ITEMS) as GQLAddCartItemInput[]

    let actual!: Error
    try {
      await gql.addCartItems(addItems)
    } catch (err) {
      actual = err
    }

    expect(getGQLErrorResponse(actual).statusCode).toBe(403)
  })

  it('トランザクションが効いているか検証', async () => {
    setAuthUser(TEST_USER)
    await putTestData([{ collectionName: 'products', collectionRecords: PRODUCTS }, { collectionName: 'cart', collectionRecords: [] }])
    const addItems = cloneDeep(ADD_CART_ITEMS) as GQLAddCartItemInput[]
    addItems[1].productId = 'abcdefg' // 2件目に存在しない商品IDを指定

    let actual!: Error
    try {
      await gql.addCartItems(addItems)
    } catch (err) {
      actual = err
    }

    expect(actual).toBeInstanceOf(Error)

    let cartItems!: GQLCartItem[]
    let products!: GQLProduct[]
    await Promise.all([
      (async () => {
        cartItems = await gql.cartItems()
      })(),
      (async () => {
        products = await gql.products()
      })(),
    ])

    // カートアイテムが追加されていないことを検証
    expect(cartItems.length).toBe(0)
    // 商品の在庫数が更新されていないことを検証
    expect(products).toMatchObject(PRODUCTS)
  })
})

describe('updateCartItems', () => {
  it('ベーシックケース', async () => {
    setAuthUser(TEST_USER)
    await putTestData([{ collectionName: 'products', collectionRecords: PRODUCTS }, { collectionName: 'cart', collectionRecords: CART_ITEMS }])
    const updateItems = CART_ITEMS.map(item => {
      return { ...item, quantity: item.quantity + 1 }
    })
    const expectedItems = updateItems.map(item => {
      const product = PRODUCTS.find(product => product.id === item.productId)!
      return { ...item, product: { id: product.id, stock: product.stock - 1 } }
    })

    const actual = await gql.updateCartItems(updateItems)

    const promises: Promise<void>[] = []
    for (let i = 0; i < actual.length; i++) {
      promises.push(
        (async () => {
          // 戻り値の検証
          expect(actual[i]).toMatchObject(expectedItems[i])
          // カートアイテムが更新されているか検証
          const updatedItem = await gql.cartItem(updateItems[i].id)
          expect(updatedItem).toMatchObject(updateItems[i])
          // 商品の在庫が更新されているか検証
          const updatedProduct = await gql.product(expectedItems[i].productId)
          expect(updatedProduct).toMatchObject(expectedItems[i].product)
        })()
      )
    }
    await Promise.all(promises)
  })

  it('自ユーザー以外のカートアイテムを変更しようとした場合', async () => {
    setAuthUser(TEST_USER)
    await putTestData([
      { collectionName: 'products', collectionRecords: PRODUCTS },
      {
        collectionName: 'cart',
        // 自ユーザー以外のカートアイテムをテストデータ投入
        collectionRecords: CART_ITEMS.map(item => {
          return { ...item, uid: 'test-userXXX' }
        }),
      },
    ])
    const updateItems = CART_ITEMS.map(item => {
      return { ...item, quantity: item.quantity + 1 }
    })

    let actual!: Error
    try {
      await gql.updateCartItems(updateItems)
    } catch (err) {
      actual = err
    }

    expect(getGQLErrorResponse(actual).message).toBe('You can not access the specified cart item.')
  })

  it('在庫数を上回る数をカートアイテムに設定した場合', async () => {
    setAuthUser(TEST_USER)
    await putTestData([{ collectionName: 'products', collectionRecords: PRODUCTS }, { collectionName: 'cart', collectionRecords: CART_ITEMS }])
    const updateItem = cloneDeep(CART_ITEMS[0]) as GQLCartItem
    const product = PRODUCTS.find(product => product.id === updateItem.productId)!
    updateItem.quantity += product.stock + 1 // 在庫数を上回る数を設定

    let actual!: Error
    try {
      await gql.updateCartItems([updateItem])
    } catch (err) {
      actual = err
    }

    expect(getGQLErrorResponse(actual).message).toBe('The stock of the product was insufficient.')
  })

  it('カートアイテムの数量にマイナス値を設定した場合', async () => {
    setAuthUser(TEST_USER)
    await putTestData([{ collectionName: 'products', collectionRecords: PRODUCTS }, { collectionName: 'cart', collectionRecords: CART_ITEMS }])
    const updateItem = cloneDeep(CART_ITEMS[0]) as GQLCartItem
    const product = PRODUCTS.find(product => product.id === updateItem.productId)!
    updateItem.quantity = -1 // マイナス値を設定

    let actual!: Error
    try {
      await gql.updateCartItems([updateItem])
    } catch (err) {
      actual = err
    }

    expect(getGQLErrorResponse(actual).message).toBe('Validation failed.')
  })

  it('サインインしていない場合', async () => {
    await putTestData([{ collectionName: 'products', collectionRecords: PRODUCTS }, { collectionName: 'cart', collectionRecords: CART_ITEMS }])
    const updateItems = cloneDeep(CART_ITEMS) as GQLCartItem[]

    let actual!: Error
    try {
      await gql.updateCartItems(updateItems)
    } catch (err) {
      actual = err
    }

    expect(getGQLErrorResponse(actual).statusCode).toBe(403)
  })

  it('トランザクションが効いているか検証', async () => {
    setAuthUser(TEST_USER)
    await putTestData([{ collectionName: 'products', collectionRecords: PRODUCTS }, { collectionName: 'cart', collectionRecords: CART_ITEMS }])
    const updateItems = cloneDeep(CART_ITEMS) as GQLCartItem[]
    updateItems[0].quantity = 2
    updateItems[1].quantity = 9999999999 // 2件目に在庫数を上回る数を設定

    let actual!: Error
    try {
      await gql.updateCartItems(updateItems)
    } catch (err) {
      actual = err
    }

    expect(actual).toBeInstanceOf(Error)

    let cartItems!: GQLCartItem[]
    let products!: GQLProduct[]
    await Promise.all([
      (async () => {
        cartItems = await gql.cartItems()
      })(),
      (async () => {
        products = await gql.products()
      })(),
    ])

    // カートアイテムが更新されていないことを検証
    expect(cartItems).toMatchObject(CART_ITEMS)
    // 商品の在庫数が更新されていないことを検証
    expect(products).toMatchObject(PRODUCTS)
  })
})

describe('removeCartItems', () => {
  it('ベーシックケース', async () => {
    setAuthUser(TEST_USER)
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

    const actual = await gql.removeCartItems(removeIds)

    const promises: Promise<void>[] = []
    for (let i = 0; i < actual.length; i++) {
      promises.push(
        (async () => {
          // 戻り値の検証
          expect(actual[i]).toMatchObject(expectedItems[i])
          // カートアイテムが削除されているか検証
          const removedItem = await gql.cartItem(removeIds[i])
          expect(removedItem).toBeUndefined()
          // 商品の在庫が更新されているか検証
          const updatedProduct = await gql.product(expectedItems[i].productId)
          expect(updatedProduct).toMatchObject(expectedItems[i].product)
        })()
      )
    }
    await Promise.all(promises)
  })

  it('自ユーザー以外のカートアイテムを削除しようとした場合', async () => {
    setAuthUser(TEST_USER)
    await putTestData([
      { collectionName: 'products', collectionRecords: PRODUCTS },
      {
        collectionName: 'cart',
        // 自ユーザー以外のカートアイテムをテストデータ投入
        collectionRecords: CART_ITEMS.map(item => {
          return { ...item, uid: 'test-userXXX' }
        }),
      },
    ])
    const removeIds = CART_ITEMS.map(item => item.id)

    let actual!: Error
    try {
      await gql.removeCartItems(removeIds)
    } catch (err) {
      actual = err
    }

    expect(getGQLErrorResponse(actual).message).toBe('You can not access the specified cart item.')
  })

  it('サインインしていない場合', async () => {
    await putTestData([{ collectionName: 'products', collectionRecords: PRODUCTS }, { collectionName: 'cart', collectionRecords: CART_ITEMS }])
    const removeIds = CART_ITEMS.map(item => item.id)

    let actual!: Error
    try {
      await gql.removeCartItems(removeIds)
    } catch (err) {
      actual = err
    }

    expect(getGQLErrorResponse(actual).statusCode).toBe(403)
  })

  it('トランザクションが効いているか検証', async () => {
    setAuthUser(TEST_USER)
    await putTestData([{ collectionName: 'products', collectionRecords: PRODUCTS }, { collectionName: 'cart', collectionRecords: CART_ITEMS }])
    const removeIds = CART_ITEMS.map(item => item.id)
    removeIds[1] = 'cartItemXXX' // 2件目に存在しないカートアイテムIDを設定

    let actual!: Error
    try {
      await gql.removeCartItems(removeIds)
    } catch (err) {
      actual = err
    }

    expect(actual).toBeInstanceOf(Error)

    let cartItems!: GQLCartItem[]
    let products!: GQLProduct[]
    await Promise.all([
      (async () => {
        cartItems = await gql.cartItems()
      })(),
      (async () => {
        products = await gql.products()
      })(),
    ])

    // カートアイテムが削除されていないことを検証
    expect(cartItems).toMatchObject(CART_ITEMS)
    // 商品の在庫数が更新されていないことを検証
    expect(products).toMatchObject(PRODUCTS)
  })
})

describe('checkout', () => {
  it('ベーシックケース', async () => {
    setAuthUser(TEST_USER)
    await putTestData([{ collectionName: 'products', collectionRecords: PRODUCTS }, { collectionName: 'cart', collectionRecords: CART_ITEMS }])

    const actual = await gql.checkoutCart()

    expect(actual).toBeTruthy()
    // カートアイテムが削除されてることを検証
    const cartItems = await gql.cartItems()
    expect(cartItems.length).toBe(0)
  })

  it('サインインしていない場合', async () => {
    await putTestData([{ collectionName: 'products', collectionRecords: PRODUCTS }, { collectionName: 'cart', collectionRecords: CART_ITEMS }])

    let actual!: Error
    try {
      await gql.checkoutCart()
    } catch (err) {
      actual = err
    }

    expect(getGQLErrorResponse(actual).statusCode).toBe(403)
  })
})
