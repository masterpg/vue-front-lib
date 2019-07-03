import { Product, ProductsErrorType, ProductsModule, ProductsState, StatePartial, StoreError } from '@/store/types'
import { BaseModule } from '@/store/base'
import { Component } from 'vue-property-decorator'
const cloneDeep = require('lodash/cloneDeep')
const assign = require('lodash/assign')

@Component
export class ProductsModuleImpl extends BaseModule<ProductsState> implements ProductsModule {
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

  get all(): Product[] {
    return this.state.all
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  getById(productId: string): Product | undefined {
    const product = this.state.all.find(item => item.id === productId)
    return product
  }

  set(product: StatePartial<Product>): Product | undefined {
    const result = this.getById(product.id)
    if (result) {
      assign(result, product)
    }
    return result
  }

  setAll(products: Product[]): void {
    this.state.all = cloneDeep(products)
  }

  add(product: Product): Product {
    const result = cloneDeep(product)
    this.state.all.push(result)
    return result
  }

  decrementInventory(productId: string): void {
    const product = this.state.all.find(item => item.id === productId)
    if (product) {
      product.inventory--
    } else {
      new StoreError(ProductsErrorType.ItemNotFound)
    }
  }
}
