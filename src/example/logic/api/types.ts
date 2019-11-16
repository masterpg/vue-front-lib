import { BaseAPIContainer } from '@/lib'

//========================================================================
//
//  API
//
//========================================================================

export interface AppAPIContainer extends BaseAPIContainer {
  getSignedUploadUrls(params: { filePath: string; contentType?: string }[]): Promise<string[]>

  product(id: string): Promise<APIProduct | undefined>

  products(ids?: string[]): Promise<APIProduct[]>

  cartItem(id: string): Promise<APICartItem | undefined>

  cartItems(ids?: string[]): Promise<APICartItem[]>

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
