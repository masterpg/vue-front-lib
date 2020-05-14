import { LibAPIContainer, TimestampEntity } from '@/lib'

//========================================================================
//
//  Interfaces
//
//========================================================================

export interface AppAPIContainer extends LibAPIContainer {
  getProduct(id: string): Promise<Product | undefined>

  getProducts(ids?: string[]): Promise<Product[]>

  getCartItem(id: string): Promise<CartItem | undefined>

  getCartItems(ids?: string[]): Promise<CartItem[]>

  addCartItems(items: CartItemAddInput[]): Promise<CartItemEditResponse[]>

  updateCartItems(items: { id: string; quantity: number }[]): Promise<CartItemEditResponse[]>

  removeCartItems(cartItemIds: string[]): Promise<CartItemEditResponse[]>

  checkoutCart(): Promise<boolean>
}

export interface Product extends TimestampEntity {
  title: string
  price: number
  stock: number
}

export interface CartItem extends TimestampEntity {
  uid: string
  productId: string
  title: string
  price: number
  quantity: number
}

export interface CartItemAddInput {
  productId: string
  title: string
  price: number
  quantity: number
}

export interface CartItemUpdateInput {
  id: string
  quantity: number
}

export interface CartItemEditResponse extends CartItem {
  product: Pick<Product, 'id' | 'stock'>
}
