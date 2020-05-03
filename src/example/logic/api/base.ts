import { APIDocumentData, LibAPIContainer } from '@/lib'

//========================================================================
//
//  Interfaces
//
//========================================================================

export interface AppAPIContainer extends LibAPIContainer {
  getProduct(id: string): Promise<APIProduct | undefined>

  getProducts(ids?: string[]): Promise<APIProduct[]>

  getCartItem(id: string): Promise<APICartItem | undefined>

  getCartItems(ids?: string[]): Promise<APICartItem[]>

  addCartItems(items: APICartItemAddInput[]): Promise<APICartItemEditResponse[]>

  updateCartItems(items: { id: string; quantity: number }[]): Promise<APICartItemEditResponse[]>

  removeCartItems(cartItemIds: string[]): Promise<APICartItemEditResponse[]>

  checkoutCart(): Promise<boolean>
}

export interface APIProduct extends APIDocumentData {
  title: string
  price: number
  stock: number
}

export interface APICartItem extends APIDocumentData {
  uid: string
  productId: string
  title: string
  price: number
  quantity: number
}

export interface APICartItemAddInput {
  productId: string
  title: string
  price: number
  quantity: number
}

export interface APICartItemUpdateInput {
  id: string
  quantity: number
}

export interface APICartItemEditResponse extends APICartItem {
  product: Pick<APIProduct, 'id' | 'stock'>
}
