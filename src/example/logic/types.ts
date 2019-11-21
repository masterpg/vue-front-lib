import { CartItem, CheckoutStatus, Product } from '@/example/logic/store'
import { LibLogicContainer } from '@/lib'

//----------------------------------------------------------------------
//
//  Logic
//
//----------------------------------------------------------------------

export interface LogicContainer extends LibLogicContainer {
  apiType: 'gql' | 'rest'

  readonly shop: ShopLogic
}

export interface ShopLogic {
  products: Product[]

  pullProducts(): Promise<void>

  cartItems: CartItem[]

  pullCartItems(): Promise<void>

  cartTotalPrice: number

  checkoutStatus: CheckoutStatus

  addItemToCart(productId: string): Promise<void>

  removeItemFromCart(productId: string): Promise<void>

  checkout(): Promise<void>
}

export { CartItem, CheckoutStatus, Product }
