import { BaseStore, StatePartial, StoreError } from '@/app/logic/store/base'
import { Component } from 'vue-property-decorator'
import { NoCache } from '@/app/base'
import { Product } from '@/app/logic/types'
import dayjs from 'dayjs'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface ProductStore {
  readonly all: Product[]

  getById(productId: string): Product | undefined

  set(product: StatePartial<Product>): Product | undefined

  setAll(products: Product[]): void

  add(product: Product): Product

  decrementStock(productId: string): void

  incrementStock(productId: string): void
}

interface ProductState {
  all: Product[]
}

enum ProductsErrorType {
  ItemNotFound = 'itemNotFound',
}

//========================================================================
//
//  Implementation
//
//========================================================================

@Component
class ProductStoreImpl extends BaseStore<ProductState> implements ProductStore {
  //----------------------------------------------------------------------
  //
  //  Constructors
  //
  //----------------------------------------------------------------------

  constructor() {
    super()
    this.initState({
      all: [],
    })
  }

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  @NoCache
  get all(): Product[] {
    return this.state.all.map(value => {
      return this.clone(value)
    })
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  clone(value: Product): Product {
    return {
      id: value.id,
      title: value.title,
      price: value.price,
      stock: value.stock,
      createdAt: dayjs(value.createdAt),
      updatedAt: dayjs(value.updatedAt),
    }
  }

  getById(id: string): Product | undefined {
    const stateItem = this.m_getById(id)
    return stateItem ? this.clone(stateItem) : undefined
  }

  set(product: StatePartial<Product>): Product | undefined {
    const stateItem = this.m_getById(product.id)
    if (stateItem) {
      const tmp = this.clone(stateItem)
      Object.assign(tmp, product)
      Object.assign(stateItem, tmp)
    }
    return stateItem ? this.clone(stateItem) : undefined
  }

  setAll(products: Product[]): void {
    this.state.all = products.map(value => {
      return this.clone(value)
    })
  }

  add(product: Product): Product {
    const stateItem = this.clone(product)
    this.state.all.push(stateItem)
    return this.clone(stateItem)
  }

  decrementStock(productId: string): void {
    const product = this.state.all.find(item => item.id === productId)
    if (product) {
      product.stock--
    } else {
      throw new StoreError(ProductsErrorType.ItemNotFound)
    }
  }

  incrementStock(productId: string): void {
    const product = this.state.all.find(item => item.id === productId)
    if (product) {
      product.stock++
    } else {
      throw new StoreError(ProductsErrorType.ItemNotFound)
    }
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  private m_getById(id: string): Product | undefined {
    return this.state.all.find(item => item.id === id)
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { ProductStore, ProductState, ProductStoreImpl, ProductsErrorType }
