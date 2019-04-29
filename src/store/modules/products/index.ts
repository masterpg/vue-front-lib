import {Component} from 'vue-property-decorator'
import {BaseModule} from '@/store/base'
import {Product, ProductErrorType, ProductsModule, ProductsState, StoreError} from '@/store/types'
import {utils} from '@/base/utils'

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

  setAll(products: Product[]): void {
    this.state.all = utils.cloneDeep(products)
  }

  decrementInventory(productId: string): void {
    const product = this.state.all.find(item => item.id === productId)
    if (product) {
      product.inventory--
    } else {
      new StoreError(ProductErrorType.ItemNotFound)
    }
  }
}
