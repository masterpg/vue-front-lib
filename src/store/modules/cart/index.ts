import {Component} from 'vue-property-decorator'
import {BaseModule} from '@/store/base'
import {CartModule, CartState, CartItem, CheckoutStatus, Product} from '@/store/types'

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
      items: [],
      checkoutStatus: CheckoutStatus.None,
    })
  }

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  get items(): CartItem[] {
    return this.state.items
  }

  get totalPrice(): number {
    return this.state.items.reduce((total, product) => {
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

  setItems(items: CartItem[]): void {
    this.state.items = items
  }

  setCheckoutStatus(status: CheckoutStatus): void {
    this.state.checkoutStatus = status
  }

  addProductToCart(product: Product): CartItem {
    const cartItem = {
      id: product.id,
      title: product.title,
      price: product.price,
      quantity: 1,
    }
    this.state.items.push(cartItem)
    return cartItem
  }

  incrementItemQuantity(productId: string): void {
    const cartItem = this.state.items.find(item => item.id === productId)
    if (cartItem) {
      cartItem.quantity++
    }
  }
}
