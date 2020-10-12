import { CartItem, Product } from '@/demo/logic/base'
import { APIContainer } from '@/app/logic/api'
import { OmitEntityTimestamp } from '@/firestore-ex'
import { RawTimestampEntity } from '@/app/logic/api/base'
import { WritableComputedRef } from '@vue/composition-api'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface DemoAPIContainer extends APIContainer, ShopAPIContainer {
  type: WritableComputedRef<'gql' | 'rest'>
}

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
  product: Pick<Product, 'id' | 'stock' | 'createdAt' | 'updatedAt'>
}

interface RawProduct extends OmitEntityTimestamp<Product>, RawTimestampEntity {}

interface RawCartItem extends OmitEntityTimestamp<CartItem>, RawTimestampEntity {}

interface RawCartItemEditResponse extends OmitEntityTimestamp<CartItemEditResponse>, RawTimestampEntity {}

//========================================================================
//
//  Exports
//
//========================================================================

export {
  CartItemAddInput,
  CartItemEditResponse,
  CartItemUpdateInput,
  DemoAPIContainer,
  RawProduct,
  RawCartItem,
  RawCartItemEditResponse,
  ShopAPIContainer,
}
