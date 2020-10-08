import { StatePartial, StoreUtil } from '@/logic/store/base'
import { DeepReadonly } from 'web-base-lib'
import { Product } from '@/logic/types'
import { reactive } from '@vue/composition-api'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface ProductStore {
  readonly all: DeepReadonly<Product>[]

  getById(productId: string): DeepReadonly<Product> | undefined

  sgetById(productId: string): DeepReadonly<Product>

  exists(productId: string): boolean

  setAll(products: Product[]): void

  add(product: Product): DeepReadonly<Product>

  set(product: StatePartial<Product>): DeepReadonly<Product> | undefined

  decrementStock(productId: string): void

  incrementStock(productId: string): void
}

//========================================================================
//
//  Implementation
//
//========================================================================

function createProductStore(): ProductStore {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  const state = reactive({
    all: [] as Product[],
  })

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  const exists: ProductStore['exists'] = productId => {
    return Boolean(getStateProductById(productId))
  }

  const getById: ProductStore['getById'] = productId => {
    return getStateProductById(productId)
  }

  const sgetById: ProductStore['sgetById'] = productId => {
    const result = getById(productId)
    if (!result) {
      throw new Error(`The specified Product was not found: '${productId}'`)
    }
    return result
  }

  const setAll: ProductStore['setAll'] = products => {
    state.all.splice(0)
    for (const product of products) {
      state.all.push(StoreUtil.cloneProduct(product))
    }
  }

  const add: ProductStore['add'] = product => {
    if (exists(product.id)) {
      throw new Error(`The specified Product already exists: '${product.id}'`)
    }

    const stateItem = StoreUtil.cloneProduct(product)
    state.all.push(stateItem)
    return stateItem
  }

  const set: ProductStore['set'] = product => {
    const stateItem = getStateProductById(product.id)
    if (!stateItem) {
      return
    }

    return StoreUtil.populateProduct(product, stateItem)
  }

  const decrementStock: ProductStore['decrementStock'] = productId => {
    const product = state.all.find(item => item.id === productId)
    if (!product) {
      throw new Error(`The specified Product was not found: '${productId}'`)
    }
    product.stock--
  }

  const incrementStock: ProductStore['incrementStock'] = productId => {
    const product = state.all.find(item => item.id === productId)
    if (!product) {
      throw new Error(`The specified Product was not found: '${productId}'`)
    }
    product.stock++
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  function getStateProductById(productId: string): Product | undefined {
    return state.all.find(item => item.id === productId)
  }

  //----------------------------------------------------------------------
  //
  //  Result
  //
  //----------------------------------------------------------------------

  return {
    all: state.all,
    exists,
    getById,
    sgetById,
    setAll,
    set,
    add,
    decrementStock,
    incrementStock,
  }
}

//========================================================================
//
//  Export
//
//========================================================================

export { ProductStore, createProductStore }
