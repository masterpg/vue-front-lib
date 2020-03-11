import { Product, ProductState, ProductStore, ProductsErrorType, store } from '@/example/logic/store'
import { StoreError } from '@/lib'
import { TestStore } from '../../../../../../helpers/common/store'
import { initExampleTest } from '../../../../../../helpers/example/init'
const cloneDeep = require('lodash/cloneDeep')

//========================================================================
//
//  Test data
//
//========================================================================

const PRODUCTS: Product[] = [
  { id: 'product1', title: 'iPad 4 Mini', price: 500.01, stock: 1 },
  { id: 'product2', title: 'Fire HD 8 Tablet', price: 80.99, stock: 5 },
  { id: 'product3', title: 'MediaPad T5 10', price: 150.8, stock: 10 },
]

//========================================================================
//
//  Test helpers
//
//========================================================================

let productStore!: TestStore<ProductStore, ProductState>

//========================================================================
//
//  Tests
//
//========================================================================

beforeAll(async () => {
  await initExampleTest()
  productStore = store.product as TestStore<ProductStore, ProductState>
})

beforeEach(async () => {
  productStore.initState({
    all: cloneDeep(PRODUCTS),
  })
})

describe('all', () => {
  it('ベーシックケース', () => {
    expect(productStore.all).toEqual(PRODUCTS)
  })
})

describe('getById', () => {
  it('ベーシックケース', () => {
    const stateProduct = productStore.state.all[0]

    const actual = productStore.getById(stateProduct.id)

    expect(actual).toEqual(stateProduct)
    expect(actual).not.toBe(stateProduct)
  })

  it('存在しない商品IDを指定した場合', () => {
    const actual = productStore.getById('9999')
    expect(actual).toBeUndefined()
  })
})

describe('set', () => {
  it('ベーシックケース', () => {
    const product = cloneDeep(productStore.state.all[0])
    product.title = 'aaa'

    // 一部のプロパティだけを変更
    const actual = productStore.set({
      id: product.id,
      title: product.title,
    })!

    const stateProduct = productStore.state.all[0]
    expect(actual).toEqual(product)
    expect(actual).not.toBe(stateProduct)
  })

  it('余分なプロパティを含んだ場合', () => {
    const product = cloneDeep(productStore.state.all[0])
    product.zzz = 'zzz'

    const actual = productStore.set(product)!

    expect(actual).not.toHaveProperty('zzz')
  })

  it('存在しない商品IDを指定した場合', () => {
    const product = cloneDeep(productStore.state.all[0])
    product.id = '9999'

    const actual = productStore.set(product)

    expect(actual).toBeUndefined()
  })
})

describe('setAll', () => {
  it('ベーシックケース', () => {
    productStore.setAll(PRODUCTS)
    expect(productStore.state.all).toEqual(PRODUCTS)
    expect(productStore.state.all).not.toBe(PRODUCTS)
  })
})

describe('add', () => {
  it('ベーシックケース', () => {
    const product = cloneDeep(productStore.state.all[0])
    product.id = 'productXXX'
    product.title = 'aaa'
    product.price = 999
    product.stock = 888

    const actual = productStore.add(product)

    const stateProduct = productStore.state.all[productStore.state.all.length - 1]
    expect(actual).toEqual(stateProduct)
    expect(actual).not.toBe(stateProduct)
  })
})

describe('decrementStock', () => {
  it('ベーシックケース', () => {
    const product = cloneDeep(productStore.state.all[0])

    productStore.decrementStock(product.id)

    const stateProduct = productStore.state.all[0]
    expect(stateProduct.id).toBe(product.id)
    expect(stateProduct.stock).toBe(product.stock - 1)
  })

  it('存在しない商品の在庫をデクリメントしようとした場合', () => {
    let actual!: Error
    try {
      productStore.decrementStock('9999')
    } catch (err) {
      actual = err
    }

    expect(actual).toBeInstanceOf(StoreError)
    if (actual instanceof StoreError) {
      expect(actual.errorType).toBe(ProductsErrorType.ItemNotFound)
    }
  })
})

describe('incrementStock', () => {
  it('ベーシックケース', () => {
    const product = cloneDeep(productStore.state.all[0])

    productStore.incrementStock(product.id)

    const stateProduct = productStore.state.all[0]
    expect(stateProduct.id).toBe(product.id)
    expect(stateProduct.stock).toBe(product.stock + 1)
  })

  it('存在しない商品の在庫をインクリメントしようとした場合', () => {
    let actual!: Error
    try {
      productStore.incrementStock('9999')
    } catch (err) {
      actual = err
    }

    expect(actual).toBeInstanceOf(StoreError)
    if (actual instanceof StoreError) {
      expect(actual.errorType).toBe(ProductsErrorType.ItemNotFound)
    }
  })
})
