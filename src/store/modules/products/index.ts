import {Component} from 'vue-property-decorator'
import {BaseModule} from '@/store/base'
import {Product, ProductsModule, ProductsState} from '@/store/types'

@Component
export class ProductsModuleImpl extends BaseModule<ProductsState> implements ProductsModule {
  //----------------------------------------------------------------------
  //
  //  Constructors
  //
  //----------------------------------------------------------------------

  constructor() {
    super()
    this.f_initState({
      all: [],
    })
  }

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  get all(): Product[] {
    return this.f_state.all
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  getById(productId: string): Product | undefined {
    const product = this.f_state.all.find(item => item.id === productId)
    return product
  }

  setAll(products: Product[]): void {
    this.f_state.all = products
  }

  decrementInventory(productId: string): void {
    const product = this.f_state.all.find(item => item.id === productId)
    if (product) {
      product.inventory--
    }
  }
}
