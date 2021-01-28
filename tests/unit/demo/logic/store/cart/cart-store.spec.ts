import { provideDependency, toBeCopyCartItem } from '../../../../../helpers/demo'
import { CartItem } from '@/demo/logic'
import dayjs from 'dayjs'

//========================================================================
//
//  Test data
//
//========================================================================

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

function CartItem1(): CartItem {
  return CartItems()[0]
}

//========================================================================
//
//  Tests
//
//========================================================================

describe('CartStore', () => {
  it('all', async () => {
    const { store } = provideDependency(({ store }) => {
      store.cart.setAll(CartItems())
    })

    // テスト対象実行
    const actual = store.cart.all.value

    expect(actual).toEqual(CartItems())
  })

  it('totalPrice', async () => {
    const { store } = provideDependency(({ store }) => {
      store.cart.setAll(CartItems())
    })

    // テスト対象実行
    const actual = store.cart.totalPrice

    expect(actual.value).toBe(88380)
  })

  describe('getById', () => {
    it('ベーシックケース', () => {
      const { store } = provideDependency(({ store }) => {
        store.cart.setAll(CartItems())
      })

      // テスト対象実行
      const actual = store.cart.getById(CartItem1().id)!

      expect(actual).toEqual(CartItem1())
      toBeCopyCartItem(store, actual)
    })

    it('存在しないカートアイテムIDを指定した場合', () => {
      const { store } = provideDependency(({ store }) => {
        store.cart.setAll(CartItems())
      })

      // テスト対象実行
      const actual = store.cart.getById('9999')

      expect(actual).toBeUndefined()
    })
  })

  describe('sgetById', () => {
    it('ベーシックケース', () => {
      const { store } = provideDependency(({ store }) => {
        store.cart.setAll(CartItems())
      })

      // テスト対象実行
      const actual = store.cart.sgetById(CartItem1().id)

      expect(actual).toEqual(CartItem1())
      toBeCopyCartItem(store, actual)
    })

    it('存在しないカートアイテムIDを指定した場合', () => {
      const { store } = provideDependency(({ store }) => {
        store.cart.setAll(CartItems())
      })

      let actual!: Error
      try {
        // テスト対象実行
        store.cart.sgetById('9999')
      } catch (err) {
        actual = err
      }

      expect(actual.message).toBe(`The specified CartItem was not found: '9999'`)
    })
  })

  describe('getByProductId', () => {
    it('ベーシックケース', () => {
      const { store } = provideDependency(({ store }) => {
        store.cart.setAll(CartItems())
      })

      // テスト対象実行
      const actual = store.cart.getByProductId(CartItem1().productId)!

      expect(actual).toEqual(CartItem1())
      toBeCopyCartItem(store, actual)
    })

    it('存在しない商品IDを指定した場合', () => {
      const { store } = provideDependency(({ store }) => {
        store.cart.setAll(CartItems())
      })

      // テスト対象実行
      const actual = store.cart.getByProductId('9999')

      expect(actual).toBeUndefined()
    })
  })

  describe('sgetByProductId', () => {
    it('ベーシックケース', () => {
      const { store } = provideDependency(({ store }) => {
        store.cart.setAll(CartItems())
      })

      // テスト対象実行
      const actual = store.cart.sgetByProductId(CartItem1().productId)

      expect(actual).toEqual(CartItem1())
      toBeCopyCartItem(store, actual)
    })

    it('存在しない商品IDを指定した場合', () => {
      const { store } = provideDependency(({ store }) => {
        store.cart.setAll(CartItems())
      })

      let actual!: Error
      try {
        // テスト対象実行
        store.cart.sgetByProductId('9999')
      } catch (err) {
        actual = err
      }

      expect(actual.message).toBe(`The specified CartItem was not found: {"productId":"9999"}`)
    })
  })

  describe('add', () => {
    it('ベーシックケース', () => {
      const { store } = provideDependency(({ store }) => {
        store.cart.setAll(CartItems())
      })

      const cartItemX = CartItem.clone(CartItem1())
      cartItemX.id = CartItem.generateId()
      cartItemX.uid = 'userX'
      cartItemX.productId = 'productX'
      cartItemX.title = 'Product X'
      cartItemX.price = 999
      cartItemX.quantity = 888

      // テスト対象実行
      const actual = store.cart.add(cartItemX)

      expect(actual).toEqual(cartItemX)
      toBeCopyCartItem(store, actual)

      const added = store.cart.sgetById(cartItemX.id)
      expect(added).toEqual(cartItemX)
    })

    it('余分なプロパティを含んだ場合', () => {
      const { store } = provideDependency(({ store }) => {
        store.cart.setAll(CartItems())
      })

      const cartItemX = CartItem.clone(CartItem1())
      cartItemX.id = CartItem.generateId()
      cartItemX.uid = 'userX'
      cartItemX.productId = 'productX'
      cartItemX.title = 'Product X'
      cartItemX.price = 999
      cartItemX.quantity = 888

      // テスト対象実行
      const actual = store.cart.add({
        ...cartItemX,
        zzz: 'zzz',
      } as any)

      expect(actual).toEqual(cartItemX)
      expect(actual).not.toHaveProperty('zzz')
      toBeCopyCartItem(store, actual)

      const added = store.cart.sgetById(cartItemX.id)
      expect(added).toEqual(cartItemX)
      expect(added).not.toHaveProperty('zzz')
    })

    it('既に存在するカートアイテムIDを指定した場合', () => {
      const { store } = provideDependency(({ store }) => {
        store.cart.setAll(CartItems())
      })

      let actual!: Error
      try {
        // テスト対象実行
        store.cart.add(CartItem1())
      } catch (err) {
        actual = err
      }

      expect(actual.message).toBe(`The specified CartItem already exists: '${CartItem1().id}'`)
    })
  })

  describe('set', () => {
    it('ベーシックケース', () => {
      const { store } = provideDependency(({ store }) => {
        store.cart.setAll(CartItems())
      })

      const cartItem1 = CartItem.clone(CartItem1())
      cartItem1.title = 'aaa'

      // テスト対象実行
      // ※一部のプロパティだけを変更
      const actual = store.cart.set({
        id: cartItem1.id,
        title: cartItem1.title,
      })!

      expect(actual).toEqual(cartItem1)
      toBeCopyCartItem(store, actual)
    })

    it('余分なプロパティを含んだ場合', () => {
      const { store } = provideDependency(({ store }) => {
        store.cart.setAll(CartItems())
      })

      const cartItem1 = CartItem.clone(CartItem1())

      // テスト対象実行
      const actual = store.cart.set({
        ...cartItem1,
        zzz: 'zzz',
      } as any)!

      expect(actual).toEqual(cartItem1)
      expect(actual).not.toHaveProperty('zzz')
      toBeCopyCartItem(store, actual)

      const updated = store.cart.sgetById(cartItem1.id)
      expect(updated).toEqual(cartItem1)
      expect(updated).not.toHaveProperty('zzz')
    })

    it('存在しないカートアイテムIDを指定した場合', () => {
      const { store } = provideDependency(({ store }) => {
        store.cart.setAll(CartItems())
      })

      // テスト対象実行
      const actual = store.cart.set({
        ...CartItem1(),
        id: '9999',
      })

      expect(actual).toBeUndefined()
    })
  })

  describe('remove', () => {
    it('ベーシックケース', () => {
      const { store } = provideDependency(({ store }) => {
        store.cart.setAll(CartItems())
      })

      // テスト対象実行
      const actual = store.cart.remove(CartItem1().id)!

      expect(actual).toEqual(CartItem1())
      toBeCopyCartItem(store, actual)
    })

    it('存在しないカートアイテムIDを指定した場合', () => {
      const { store } = provideDependency(({ store }) => {
        store.cart.setAll(CartItems())
      })

      // テスト対象実行
      const actual = store.cart.remove(CartItem1().id)

      expect(actual).toBeDefined()
    })
  })

  describe('clear', () => {
    it('ベーシックケース', () => {
      const { store } = provideDependency(({ store }) => {
        store.cart.setAll(CartItems())
      })

      // テスト対象実行
      store.cart.clear()

      expect(store.cart.all.value.length).toBe(0)
    })
  })
})
