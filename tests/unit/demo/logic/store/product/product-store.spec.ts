import { provideDependency, toBeCopyProduct } from '../../../../../helpers/demo'
import { Product } from '@/demo/logic'
import dayjs from 'dayjs'

//========================================================================
//
//  Test data
//
//========================================================================

function Products(): Product[] {
  return [
    { id: 'product1', title: 'iPad 4 Mini', price: 39700, stock: 1, createdAt: dayjs('2020-01-01'), updatedAt: dayjs('2020-01-02') },
    { id: 'product2', title: 'Fire HD 8 Tablet', price: 8980, stock: 5, createdAt: dayjs('2020-01-01'), updatedAt: dayjs('2020-01-02') },
    { id: 'product3', title: 'MediaPad 10', price: 26400, stock: 10, createdAt: dayjs('2020-01-01'), updatedAt: dayjs('2020-01-02') },
    { id: 'product4', title: 'Surface Go', price: 54290, stock: 0, createdAt: dayjs('2020-01-01'), updatedAt: dayjs('2020-01-02') },
  ]
}

function Product1(): Product {
  return Products()[0]
}

//========================================================================
//
//  Tests
//
//========================================================================

describe('ProductStore', () => {
  it('all', async () => {
    const { store } = provideDependency(({ store }) => {
      store.product.setAll(Products())
    })

    // テスト対象実行
    const actual = store.product.all.value

    expect(actual).toEqual(Products())
  })

  describe('getById', () => {
    it('ベーシックケース', () => {
      const { store } = provideDependency(({ store }) => {
        store.product.setAll(Products())
      })

      // テスト対象実行
      const actual = store.product.getById(Product1().id)!

      expect(actual).toEqual(Product1())
      toBeCopyProduct(store, actual)
    })

    it('存在しない商品IDを指定した場合', () => {
      const { store } = provideDependency(({ store }) => {
        store.product.setAll(Products())
      })

      // テスト対象実行
      const actual = store.product.getById('9999')

      expect(actual).toBeUndefined()
    })
  })

  describe('sgetById', () => {
    it('ベーシックケース', () => {
      const { store } = provideDependency(({ store }) => {
        store.product.setAll(Products())
      })

      // テスト対象実行
      const actual = store.product.sgetById(Product1().id)

      expect(actual).toEqual(Product1())
      toBeCopyProduct(store, actual)
    })

    it('存在しない商品IDを指定した場合', () => {
      const { store } = provideDependency(({ store }) => {
        store.product.setAll(Products())
      })

      let actual!: Error
      try {
        // テスト対象実行
        store.product.sgetById('9999')
      } catch (err) {
        actual = err
      }

      expect(actual.message).toBe(`The specified Product was not found: '9999'`)
    })
  })

  describe('add', () => {
    it('ベーシックケース', () => {
      const { store } = provideDependency(({ store }) => {
        store.product.setAll(Products())
      })

      const productX = Product.clone(Product1())
      productX.id = Product.generateId()
      productX.title = 'Product X'
      productX.price = 999
      productX.stock = 888

      // テスト対象実行
      const actual = store.product.add(productX)

      expect(actual).toEqual(productX)
      toBeCopyProduct(store, actual)

      const added = store.product.sgetById(productX.id)
      expect(added).toEqual(productX)
    })

    it('余分なプロパティを含んだ場合', () => {
      const { store } = provideDependency(({ store }) => {
        store.product.setAll(Products())
      })

      const productX = Product.clone(Products()[0])
      productX.id = Product.generateId()
      productX.title = 'Product X'
      productX.price = 999
      productX.stock = 888

      // テスト対象実行
      const actual = store.product.add({
        ...productX,
        zzz: 'zzz',
      } as any)

      expect(actual).toEqual(productX)
      expect(actual).not.toHaveProperty('zzz')
      toBeCopyProduct(store, actual)

      const added = store.product.sgetById(productX.id)
      expect(added).toEqual(productX)
      expect(added).not.toHaveProperty('zzz')
    })

    it('既に存在する商品IDを指定した場合', () => {
      const { store } = provideDependency(({ store }) => {
        store.product.setAll(Products())
      })

      let actual!: Error
      try {
        // テスト対象実行
        store.product.add(Product1())
      } catch (err) {
        actual = err
      }

      expect(actual.message).toBe(`The specified Product already exists: '${Product1().id}'`)
    })
  })

  describe('set', () => {
    it('ベーシックケース', () => {
      const { store } = provideDependency(({ store }) => {
        store.product.setAll(Products())
      })

      const product1 = Product.clone(Products()[0])
      product1.title = 'aaa'

      // テスト対象実行
      // ※一部のプロパティだけを変更
      const actual = store.product.set({
        id: product1.id,
        title: product1.title,
      })!

      expect(actual).toEqual(product1)
      toBeCopyProduct(store, actual)
    })

    it('余分なプロパティを含んだ場合', () => {
      const { store } = provideDependency(({ store }) => {
        store.product.setAll(Products())
      })

      const product1 = Product.clone(Product1())

      // テスト対象実行
      const actual = store.product.set({
        ...product1,
        zzz: 'zzz',
      } as any)!

      expect(actual).toEqual(product1)
      expect(actual).not.toHaveProperty('zzz')
      toBeCopyProduct(store, actual)

      const updated = store.product.sgetById(product1.id)
      expect(updated).toEqual(product1)
      expect(updated).not.toHaveProperty('zzz')
    })

    it('存在しない商品IDを指定した場合', () => {
      const { store } = provideDependency(({ store }) => {
        store.product.setAll(Products())
      })

      // テスト対象実行
      const actual = store.product.set({
        ...Product1(),
        id: '9999',
      })

      expect(actual).toBeUndefined()
    })
  })

  describe('decrementStock', () => {
    it('ベーシックケース', () => {
      const { store } = provideDependency(({ store }) => {
        store.product.setAll(Products())
      })

      // テスト対象実行
      const actual = store.product.decrementStock(Product1().id)

      const updated = store.product.sgetById(Product1().id)
      expect(updated.stock).toBe(Product1().stock - 1)
    })

    it('存在しない商品IDを指定した場合', () => {
      const { store } = provideDependency(({ store }) => {
        store.product.setAll(Products())
      })

      let actual!: Error
      try {
        // テスト対象実行
        store.product.decrementStock('9999')
      } catch (err) {
        actual = err
      }

      expect(actual.message).toBe(`The specified Product was not found: '9999'`)
    })
  })

  describe('incrementStock', () => {
    it('ベーシックケース', () => {
      const { store } = provideDependency(({ store }) => {
        store.product.setAll(Products())
      })

      // テスト対象実行
      const actual = store.product.incrementStock(Product1().id)

      const updated = store.product.sgetById(Product1().id)
      expect(updated.stock).toBe(Product1().stock + 1)
    })

    it('存在しない商品IDを指定した場合', () => {
      const { store } = provideDependency(({ store }) => {
        store.product.setAll(Products())
      })

      let actual!: Error
      try {
        // テスト対象実行
        store.product.incrementStock('9999')
      } catch (err) {
        actual = err
      }

      expect(actual.message).toBe(`The specified Product was not found: '9999'`)
    })
  })
})
