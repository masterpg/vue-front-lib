import { CartItem, CartState, CartStore, CheckoutStatus, store } from '@/example/logic/store'
import { TestStore } from '../../../../../../helpers/common/store'
import { initExampleTest } from '../../../../../../helpers/example/init'
const cloneDeep = require('lodash/cloneDeep')

//========================================================================
//
//  Test data
//
//========================================================================

const CART_ITEMS: CartItem[] = [
  {
    id: 'cartItem1',
    uid: 'user1',
    productId: 'product1',
    title: 'iPad 4 Mini',
    price: 500.01,
    quantity: 1,
  },
  {
    id: 'cartItem2',
    uid: 'user1',
    productId: 'product2',
    title: 'Fire HD 8 Tablet',
    price: 80.99,
    quantity: 2,
  },
]

//========================================================================
//
//  Test helpers
//
//========================================================================

let cartStore!: TestStore<CartState, CartStore>

//========================================================================
//
//  Tests
//
//========================================================================

beforeAll(async () => {
  await initExampleTest()
  cartStore = store.cart as TestStore<CartState, CartStore>
})

beforeEach(async () => {
  cartStore.initState({
    all: cloneDeep(CART_ITEMS),
    checkoutStatus: CheckoutStatus.None,
  })
})

describe('all', () => {
  it('ベーシックケース', () => {
    expect(cartStore.all).toEqual(CART_ITEMS)
  })
})

describe('totalPrice', () => {
  it('ベーシックケース', () => {
    expect(cartStore.totalPrice).toBe(661.99)
  })
})

describe('checkoutStatus', () => {
  it('ベーシックケース', () => {
    expect(cartStore.checkoutStatus).toBe(CheckoutStatus.None)
  })
})

describe('getById()', () => {
  it('ベーシックケース', () => {
    const stateCartItem = cartStore.state.all[0]

    const actual = cartStore.getById(stateCartItem.id)

    expect(actual).toEqual(stateCartItem)
    expect(actual).not.toBe(stateCartItem)
  })

  it('カートに存在しないカートアイテムIDを指定した場合', () => {
    const actual = cartStore.getById('9999')
    expect(actual).toBeUndefined()
  })
})

describe('getByProductId()', () => {
  it('ベーシックケース', () => {
    const stateCartItem = cartStore.state.all[0]

    const actual = cartStore.getByProductId(stateCartItem.productId)

    expect(actual).toEqual(stateCartItem)
    expect(actual).not.toBe(stateCartItem)
  })

  it('カートに存在しない商品IDを指定した場合', () => {
    const actual = cartStore.getByProductId('9999')
    expect(actual).toBeUndefined()
  })
})

describe('set()', () => {
  it('ベーシックケース', () => {
    const cartItem = cartStore.all[0]
    cartItem.title = 'aaa'

    // 一部のプロパティだけを変更
    const actual = cartStore.set({
      id: cartItem.id,
      title: cartItem.title,
    })!

    const stateProduct = cartStore.state.all[0]
    expect(actual).toEqual(cartItem)
    expect(actual).not.toBe(stateProduct)
  })

  it('余分なプロパティを含んだ場合', () => {
    const cartItem = cartStore.all[0]
    ;(cartItem as any).zzz = 'zzz'

    const actual = cartStore.set(cartItem)!

    expect(actual).not.toHaveProperty('zzz')
  })

  it('存在しないカートアイテムIDを指定した場合', () => {
    const cartItem = cartStore.all[0]
    cartItem.id = '9999'

    const actual = cartStore.set(cartItem)

    expect(actual).toBeUndefined()
  })
})

describe('setAll()', () => {
  it('ベーシックケース', () => {
    cartStore.setAll(CART_ITEMS)
    expect(cartStore.state.all).toEqual(CART_ITEMS)
    expect(cartStore.state.all).not.toBe(CART_ITEMS)
  })
})

describe('setCheckoutStatus()', () => {
  it('ベーシックケース', () => {
    cartStore.setCheckoutStatus(CheckoutStatus.Successful)
    expect(cartStore.checkoutStatus).toBe(CheckoutStatus.Successful)
  })
})

describe('add()', () => {
  it('ベーシックケース', () => {
    const cartItem = cartStore.all[0]
    cartItem.id = 'cartItemXXX'
    cartItem.uid = 'user1'
    cartItem.productId = 'product3'
    cartItem.title = 'aaa'
    cartItem.price = 999
    cartItem.quantity = 999

    const actual = cartStore.add(cartItem)

    const stateCartItem = cartStore.state.all[cartStore.state.all.length - 1]
    expect(actual).toEqual(stateCartItem)
    expect(actual).not.toBe(stateCartItem)
  })
})

describe('remove()', () => {
  it('ベーシックケース', () => {
    const cartItem = cartStore.state.all[1]
    const actual = cartStore.remove(cartItem.id)
    expect(actual).toEqual(cartItem)
    expect(cartStore.getById(cartItem.id)).toBeUndefined()
  })
})
