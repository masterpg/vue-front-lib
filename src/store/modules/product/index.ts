import {Component} from 'vue-property-decorator'
import {BaseModule} from '@/store/base'
import {Product, ProductErrorType, ProductModule, ProductState, StoreError} from '@/store/types'
import {utils} from '@/base/utils'

@Component
export class ProductModuleImpl extends BaseModule<ProductState> implements ProductModule {
  //----------------------------------------------------------------------
  //
  //  Constructors
  //
  //----------------------------------------------------------------------

  constructor() {
    super()
    this.initState({
      products: [],
    })
  }

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  get products(): Product[] {
    return this.state.products
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  getProductById(productId: string): Product | undefined {
    const product = this.state.products.find(item => item.id === productId)
    return product
  }

  setProducts(products: Product[]): void {
    this.state.products = utils.cloneDeep(products)
  }

  decrementInventory(productId: string): void {
    const product = this.state.products.find(item => item.id === productId)
    if (product) {
      product.inventory--
    } else {
      new StoreError(ProductErrorType.ItemNotFound)
    }
  }
}
