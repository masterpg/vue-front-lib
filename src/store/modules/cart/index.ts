import {Component} from 'vue-property-decorator'
import {BaseModule} from '@/store/base'
import {CartModule, CartState, CartItem, CheckoutStatus, Product, StoreError, CartModuleErrorType} from '@/store/types'
import {utils} from '@/base/utils'

@Component
export class CartModuleImpl extends BaseModule<CartState> implements CartModule {
  //----------------------------------------------------------------------
  //
  //  Constructors
  //
  //----------------------------------------------------------------------

  constructor() {
    super()
    this.initState({
      all: [],
      checkoutStatus: CheckoutStatus.None,
    })
  }

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  get all(): CartItem[] {
    return this.state.all
  }

  get totalPrice(): number {
    return this.state.all.reduce((total, product) => {
      return total + product.price * product.quantity
    }, 0)
  }

  get checkoutStatus(): CheckoutStatus {
    return this.state.checkoutStatus
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  getById(productId: string): CartItem | undefined {
    const item = this.state.all.find(item => item.id === productId)
    return item
  }

  setAll(items: CartItem[]): void {
    this.state.all = utils.cloneDeep(items)
  }

  setCheckoutStatus(status: CheckoutStatus): void {
    this.state.checkoutStatus = status
  }

  addProductToCart(product: Product): CartItem {
    let item = this.state.all.find(item => item.id === product.id)
    if (!item) {
      item = {
        id: product.id,
        title: product.title,
        price: product.price,
        quantity: 1,
      }
      this.state.all.push(item)
    } else {
      item.quantity++
    }
    return item
  }
}
