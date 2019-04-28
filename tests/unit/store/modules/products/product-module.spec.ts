import {store, StoreError, Product, ProductErrorType, ProductModule, ProductState} from '@/store'
import {utils} from '@/base/utils'
import {TestStoreModule} from '../../../../helper'

const productModule = store.product as TestStoreModule<ProductState, ProductModule>

const PRODUCTS: Product[] = [
  {id: '1', title: 'iPad 4 Mini', price: 500.01, inventory: 1},
  {id: '2', title: 'Fire HD 8 Tablet', price: 80.99, inventory: 5},
  {id: '3', title: 'MediaPad T5 10', price: 150.8, inventory: 10},
]

beforeEach(async () => {
  productModule.initState({
    products: PRODUCTS,
  })
})

describe('products', () => {
  it('ベーシックケース', () => {
    expect(productModule.products).toBe(PRODUCTS)
  })
})

describe('getProductById', () => {
  it('ベーシックケース', () => {
    const product = utils.cloneDeep(productModule.state.products[0])
    const actual = productModule.getProductById(product.id)
    expect(actual).toEqual(product)
  })
  it('存在しない商品IDを指定した場合', () => {
    const actual = productModule.getProductById('9999')
    expect(actual).toBeUndefined()
  })
})

describe('setProducts', () => {
  it('ベーシックケース', () => {
    productModule.setProducts(PRODUCTS)
    expect(productModule.products).toEqual(PRODUCTS)
    expect(productModule.products).not.toBe(PRODUCTS)
  })
})

describe('decrementInventory', () => {
  it('ベーシックケース', () => {
    const product = utils.cloneDeep(productModule.state.products[0])
    productModule.decrementInventory(product.id)
    const actual = productModule.state.products[0]
    expect(actual.id).toBe(product.id)
    expect(actual.inventory).toBe(product.inventory - 1)
  })
  it('存在しない商品の在庫をデクリメントしようとした場合', () => {
    try {
      productModule.decrementInventory('9999')
    } catch (e) {
      expect(e).toBeInstanceOf(StoreError)
      if (e instanceof StoreError) {
        expect(e.errorType).toBe(ProductErrorType.ItemNotFound)
      }
    }
  })
})
