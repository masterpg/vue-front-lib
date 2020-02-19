import { LibAPIContainer } from '@/lib'

//========================================================================
//
//  API
//
//========================================================================

export interface AppAPIContainer extends LibAPIContainer {
  getProduct(id: string): Promise<APIProduct | undefined>

  getProducts(ids?: string[]): Promise<APIProduct[]>

  getCartItem(id: string): Promise<APICartItem | undefined>

  getCartItems(ids?: string[]): Promise<APICartItem[]>

  addCartItems(items: APIAddCartItemInput[]): Promise<APIEditCartItemResponse[]>

  updateCartItems(items: { id: string; quantity: number }[]): Promise<APIEditCartItemResponse[]>

  removeCartItems(cartItemIds: string[]): Promise<APIEditCartItemResponse[]>

  checkoutCart(): Promise<boolean>
}

//========================================================================
//
//  Value objects
//
//========================================================================

export interface APIProduct {
  id: string
  title: string
  price: number
  stock: number
}

export interface APICartItem {
  id: string
  uid: string
  productId: string
  title: string
  price: number
  quantity: number
}

export interface APIAddCartItemInput {
  productId: string
  title: string
  price: number
  quantity: number
}

export interface APIUpdateCartItemInput {
  id: string
  quantity: number
}

export interface APIEditCartItemResponse extends APICartItem {
  product: Pick<APIProduct, 'id' | 'stock'>
}
