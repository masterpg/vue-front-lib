import { CartItem, Product } from '../types'
import { LibAPIContainer } from '@/lib'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface AppAPIContainer extends LibAPIContainer {
  getProduct(id: string): Promise<Product | undefined>

  getProducts(ids?: string[]): Promise<Product[]>

  getCartItem(id: string): Promise<CartItem | undefined>

  getCartItems(ids?: string[]): Promise<CartItem[]>

  addCartItems(items: CartItemAddInput[]): Promise<CartItemEditResponse[]>

  updateCartItems(items: CartItemUpdateInput[]): Promise<CartItemEditResponse[]>

  removeCartItems(cartItemIds: string[]): Promise<CartItemEditResponse[]>

  checkoutCart(): Promise<boolean>
}

interface CartItemAddInput {
  productId: string
  title: string
  price: number
  quantity: number
}

interface CartItemUpdateInput {
  id: string
  quantity: number
}

interface CartItemEditResponse extends CartItem {
  product: Pick<Product, 'id' | 'stock'>
}

//========================================================================
//
//  Exports
//
//========================================================================

export { AppAPIContainer, CartItemAddInput, CartItemUpdateInput, CartItemEditResponse }
