import { Product, ProductsErrorType, ProductsModule, ProductsState, StoreError, store } from '@/store'
import { TestStoreModule } from '../../../../helper/unit'
import { utils } from '@/base/utils'

const productsModule = store.products as TestStoreModule<ProductsState, ProductsModule>

const PRODUCTS: Product[] = [
  { id: '1', title: 'iPad 4 Mini', price: 500.01, inventory: 1 },
  { id: '2', title: 'Fire HD 8 Tablet', price: 80.99, inventory: 5 },
  { id: '3', title: 'MediaPad T5 10', price: 150.8, inventory: 10 },
]

beforeEach(async () => {
  productsModule.initState({
    all: utils.cloneDeep(PRODUCTS),
  })
})

describe('all', () => {
  it('ベーシックケース', () => {
    expect(productsModule.all).toEqual(PRODUCTS)
  })
})

describe('getById', () => {
  it('ベーシックケース', () => {
    const product = productsModule.state.all[0]
    const actual = productsModule.getById(product.id)
    expect(actual).toEqual(product)
  })
  it('存在しない商品IDを指定した場合', () => {
    const actual = productsModule.getById('9999')
    expect(actual).toBeUndefined()
  })
})

describe('set', () => {
  it('ベーシックケース', () => {
    const product = utils.cloneDeep(PRODUCTS[0])
    product.title = 'aaa'
    product.price = 999
    product.inventory = 888

    const actual = productsModule.set(product)!

    expect(actual).toEqual(product)
    expect(actual).toBe(productsModule.getById(actual.id))
  })

  it('存在しない商品IDを指定した場合', () => {
    const product = utils.cloneDeep(PRODUCTS[0])
    product.id = '9999'

    const actual = productsModule.set(product)

    expect(actual).toBeUndefined()
  })
})

describe('setAll', () => {
  it('ベーシックケース', () => {
    productsModule.setAll(PRODUCTS)
    expect(productsModule.all).toEqual(PRODUCTS)
    expect(productsModule.all).not.toBe(PRODUCTS)
  })
})

describe('add', () => {
  it('ベーシックケース', () => {
    const product = utils.cloneDeep(PRODUCTS[0])
    product.id = '50'
    product.title = 'aaa'
    product.price = 999
    product.inventory = 888

    const actual = productsModule.add(product)

    expect(actual).toEqual(product)
    expect(actual).toBe(productsModule.getById(actual.id))
  })
})

describe('decrementInventory', () => {
  it('ベーシックケース', () => {
    const product = utils.cloneDeep(productsModule.state.all[0])
    productsModule.decrementInventory(product.id)
    const actual = productsModule.state.all[0]
    expect(actual.id).toBe(product.id)
    expect(actual.inventory).toBe(product.inventory - 1)
  })
  it('存在しない商品の在庫をデクリメントしようとした場合', () => {
    try {
      productsModule.decrementInventory('9999')
    } catch (e) {
      expect(e).toBeInstanceOf(StoreError)
      if (e instanceof StoreError) {
        expect(e.errorType).toBe(ProductsErrorType.ItemNotFound)
      }
    }
  })
})
