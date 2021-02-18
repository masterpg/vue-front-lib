import { CartItem, Product } from '@/demo/services/base'
import { RawEntity } from '@/app/services/apis/base'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface ShopAPIContainer {
  getProduct(id: string): Promise<Product | undefined>

  getProducts(ids?: string[]): Promise<Product[]>

  getCartItem(id: string): Promise<CartItem | undefined>

  getCartItems(ids?: string[]): Promise<CartItem[]>

  addCartItems(inputs: CartItemAddInput[]): Promise<CartItemEditResponse[]>

  updateCartItems(inputs: CartItemUpdateInput[]): Promise<CartItemEditResponse[]>

  removeCartItems(ids: string[]): Promise<CartItemEditResponse[]>

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
  product: Pick<Product, 'id' | 'stock' | 'version' | 'createdAt' | 'updatedAt'>
}

interface RawProduct extends RawEntity<Product> {}

interface RawCartItem extends RawEntity<CartItem> {}

interface RawCartItemEditResponse extends RawEntity<CartItemEditResponse> {}

//========================================================================
//
//  Exports
//
//========================================================================

export { CartItemAddInput, CartItemEditResponse, CartItemUpdateInput, RawCartItem, RawCartItemEditResponse, RawProduct, ShopAPIContainer }
