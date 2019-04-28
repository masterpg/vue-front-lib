import {TestStoreModule} from '../../../../helper'
import {store, StoreError, CartModule, CartModuleErrorType, CartState, CheckoutStatus, Product} from '@/store'

const cartModule = store.cart as TestStoreModule<CartState, CartModule>

const CART_ITEMS = [{id: '1', title: 'iPad 4 Mini', price: 500.01, quantity: 1}, {id: '2', title: 'Fire HD 8 Tablet', price: 80.99, quantity: 2}]

const PRODUCTS: Product[] = [
  {id: '1', title: 'iPad 4 Mini', price: 500.01, inventory: 1},
  {id: '2', title: 'Fire HD 8 Tablet', price: 80.99, inventory: 5},
  {id: '3', title: 'MediaPad T5 10', price: 150.8, inventory: 10},
]

beforeEach(async () => {
  cartModule.initState({
    items: CART_ITEMS,
    checkoutStatus: CheckoutStatus.None,
  })
})

describe('items', () => {
  it('ベーシックケース', () => {
    expect(cartModule.items).toBe(CART_ITEMS)
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

describe('setItems()', () => {
  it('ベーシックケース', () => {
    cartModule.setItems(CART_ITEMS)
    expect(cartModule.items).toEqual(CART_ITEMS)
    expect(cartModule.items).not.toBe(CART_ITEMS)
  })
})

describe('setCheckoutStatus()', () => {
  it('ベーシックケース', () => {
    cartModule.setCheckoutStatus(CheckoutStatus.Successful)
    expect(cartModule.checkoutStatus).toBe(CheckoutStatus.Successful)
  })
})

describe('addProductToCart()', () => {
  it('ベーシックケース', () => {
    const product = PRODUCTS[2]
    const expectItem = {
      id: product.id,
      title: product.title,
      price: product.price,
      quantity: 1,
    }

    const actual = cartModule.addProductToCart(product)

    expect(actual).toEqual(expectItem)
    expect(cartModule.items[2]).toEqual(expectItem)
    expect(cartModule.items[2]).not.toBe(expectItem)
  })
})

describe('incrementItemQuantity()', () => {
  const product = PRODUCTS[0]

  it('ベーシックケース', () => {
    cartModule.incrementItemQuantity(product.id)
    expect(cartModule.items[0].id).toBe(product.id)
    expect(cartModule.items[0].quantity).toBe(2)
  })

  it('カートに存在しない商品の数量をインクリメントしようとした場合', () => {
    try {
      cartModule.incrementItemQuantity('9999')
    } catch (e) {
      expect(e).toBeInstanceOf(StoreError)
      if (e instanceof StoreError) {
        expect(e.errorType).toBe(CartModuleErrorType.ItemNotFound)
      }
    }
  })
})
