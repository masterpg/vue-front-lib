import { CartModule, CartState, CheckoutStatus, Product, store } from '@/store'
import { TestStoreModule } from '../../../../helper/unit'
import { utils } from '@/base/utils'

const cartModule = store.cart as TestStoreModule<CartState, CartModule>

const CART_ITEMS = [{ id: '1', title: 'iPad 4 Mini', price: 500.01, quantity: 1 }, { id: '2', title: 'Fire HD 8 Tablet', price: 80.99, quantity: 2 }]

const PRODUCTS: Product[] = [
  { id: '1', title: 'iPad 4 Mini', price: 500.01, inventory: 1 },
  { id: '2', title: 'Fire HD 8 Tablet', price: 80.99, inventory: 5 },
  { id: '3', title: 'MediaPad T5 10', price: 150.8, inventory: 10 },
]

beforeEach(async () => {
  cartModule.initState({
    all: utils.cloneDeep(CART_ITEMS),
    checkoutStatus: CheckoutStatus.None,
  })
})

describe('all', () => {
  it('ベーシックケース', () => {
    expect(cartModule.all).toEqual(CART_ITEMS)
  })
})

describe('totalPrice', () => {
  it('ベーシックケース', () => {
    expect(cartModule.totalPrice).toBe(661.99)
  })
})

describe('checkoutStatus', () => {
  it('ベーシックケース', () => {
    expect(cartModule.checkoutStatus).toBe(CheckoutStatus.None)
  })
})

describe('getById', () => {
  it('ベーシックケース', () => {
    const cartItem = cartModule.state.all[0]
    const actual = cartModule.getById(cartItem.id)
    expect(actual).toEqual(cartItem)
  })
  it('カートに存在しない商品IDを指定した場合', () => {
    const actual = cartModule.getById('9999')
    expect(actual).toBeUndefined()
  })
})

describe('setAll()', () => {
  it('ベーシックケース', () => {
    cartModule.setAll(CART_ITEMS)
    expect(cartModule.all).toEqual(CART_ITEMS)
    expect(cartModule.all).not.toBe(CART_ITEMS)
  })
})

describe('setCheckoutStatus()', () => {
  it('ベーシックケース', () => {
    cartModule.setCheckoutStatus(CheckoutStatus.Successful)
    expect(cartModule.checkoutStatus).toBe(CheckoutStatus.Successful)
  })
})

describe('addProductToCart()', () => {
  it('追加しようとする商品がまだカートに存在しない場合', async () => {
    const product = PRODUCTS[2]

    cartModule.addProductToCart(product)

    const cartItem = cartModule.getById(product.id)!
    expect(cartItem.quantity).toBe(1)
  })

  it('追加しようとする商品が既に存在する場合', async () => {
    const product = PRODUCTS[0]
    const cartItemBk = utils.cloneDeep(cartModule.getById(product.id)!)

    cartModule.addProductToCart(product)

    const cartItem = cartModule.getById(product.id)!
    expect(cartItem.quantity).toBe(cartItemBk.quantity + 1)
  })
})
