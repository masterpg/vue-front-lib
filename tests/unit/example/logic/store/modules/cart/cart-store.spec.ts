import { CartItem, CheckoutStatus } from '@/example/logic'
import { CartState, CartStore } from '../../../../../../../src/example/logic/store/cart'
import { TestStore } from '../../../../../../helpers/common/store'
import { cloneDeep } from 'lodash'
import dayjs from 'dayjs'
import { initExampleTest } from '../../../../../../helpers/example/init'
import { store } from '../../../../../../../src/example/logic/store'

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
    createdAt: dayjs('2020-01-10'),
    updatedAt: dayjs('2020-01-02'),
  },
  {
    id: 'cartItem2',
    uid: 'user1',
    productId: 'product2',
    title: 'Fire HD 8 Tablet',
    price: 80.99,
    quantity: 2,
    createdAt: dayjs('2020-01-10'),
    updatedAt: dayjs('2020-01-02'),
  },
]

//========================================================================
//
//  Test helpers
//
//========================================================================

let cartStore!: TestStore<CartStore, CartState>

function getStateCartItem(cartItemId: string): CartItem | undefined {
  for (const item of cartStore.state.all) {
    if (item.id === cartItemId) return item
  }
  return undefined
}

/**
 * 指定されたアイテムがステートのコピーであり、実態でないことを検証します。
 * @param cartItem
 */
function toBeCopy(cartItem: CartItem | CartItem[]): void {
  const nodes = Array.isArray(cartItem) ? (cartItem as CartItem[]) : [cartItem as CartItem]
  for (const cartItem of nodes) {
    const stateNode = getStateCartItem(cartItem.id)
    expect(cartItem).not.toBe(stateNode)
  }
}

//========================================================================
//
//  Tests
//
//========================================================================

beforeAll(async () => {
  await initExampleTest()
  cartStore = store.cart as TestStore<CartStore, CartState>
})

beforeEach(async () => {
  cartStore.initState({
    all: cloneDeep(CART_ITEMS),
    checkoutStatus: CheckoutStatus.None,
  })
})

describe('all', () => {
  it('ベーシックケース', () => {
    const actual = cartStore.all

    expect(actual).toEqual(CART_ITEMS)
    toBeCopy(actual)
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

    const actual = cartStore.getById(stateCartItem.id)!

    expect(actual).toEqual(stateCartItem)
    toBeCopy(actual)
  })

  it('カートに存在しないカートアイテムIDを指定した場合', () => {
    const actual = cartStore.getById('9999')
    expect(actual).toBeUndefined()
  })
})

describe('getByProductId()', () => {
  it('ベーシックケース', () => {
    const stateCartItem = cartStore.state.all[0]

    const actual = cartStore.getByProductId(stateCartItem.productId)!

    expect(actual).toEqual(stateCartItem)
    toBeCopy(actual)
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
    toBeCopy(actual)
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
    toBeCopy(actual)
  })
})

describe('remove()', () => {
  it('ベーシックケース', () => {
    const cartItem = cartStore.state.all[1]

    const actual = cartStore.remove(cartItem.id)!

    expect(actual).toEqual(cartItem)
    expect(cartStore.getById(cartItem.id)).toBeUndefined()
  })
})

describe('clear()', () => {
  it('ベーシックケース', () => {
    cartStore.clear()

    expect(cartStore.all.length).toEqual(0)
    expect(cartStore.checkoutStatus).toBe(CheckoutStatus.None)
  })
})
