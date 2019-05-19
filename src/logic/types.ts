import { CartItem, CheckoutStatus, Product } from '@/store'

export interface Logic {
  readonly shop: ShopLogic
}

export interface ShopLogic {
  products: Product[]

  pullProducts(): Promise<void>

  cartItems: CartItem[]

  cartTotalPrice: number

  checkoutStatus: CheckoutStatus

  addProductToCart(productId: string): void

  checkout(): Promise<void>
}

export { CartItem, CheckoutStatus, Product }
