import { AppAPIContainer, CartItemAddInput, CartItemEditResponse, CartItemUpdateInput } from '../base'
import { BaseRESTAPIContainer, RawTimestampEntity } from '@/lib'
import { CartItem, Product } from '../../types'
import { OmitEntityTimestamp } from '@/firestore-ex'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface RawProduct extends OmitEntityTimestamp<Product>, RawTimestampEntity {}

interface RawCartItem extends OmitEntityTimestamp<CartItem>, RawTimestampEntity {}

//========================================================================
//
//  Implementation
//
//========================================================================

class AppRESTAPIContainer extends BaseRESTAPIContainer implements AppAPIContainer {
  async getProduct(id: string): Promise<Product | undefined> {
    const response = await this.get<RawProduct>(`products/${id}`)
    return this.toTimestampEntity(response.data)
  }

  async getProducts(ids?: string[]): Promise<Product[]> {
    const response = await this.get<RawProduct[]>('products')
    return this.toTimestampEntities(response.data)
  }

  async getCartItem(id: string): Promise<CartItem | undefined> {
    const response = await this.get<RawCartItem>(`cartItems/${id}`, { isAuth: true })
    return this.toTimestampEntity(response.data)
  }

  async getCartItems(ids?: string[]): Promise<CartItem[]> {
    const response = await this.get<RawCartItem[]>('cartItems', { isAuth: true })
    return this.toTimestampEntities(response.data)
  }

  async addCartItems(items: CartItemAddInput[]): Promise<CartItemEditResponse[]> {
    const response = await this.post<CartItemEditResponse[]>('cartItems', items, { isAuth: true })
    return response.data
  }

  async updateCartItems(items: CartItemUpdateInput[]): Promise<CartItemEditResponse[]> {
    const response = await this.put<CartItemEditResponse[]>('cartItems', items, { isAuth: true })
    return response.data
  }

  async removeCartItems(cartItemIds: string[]): Promise<CartItemEditResponse[]> {
    const response = await this.delete<CartItemEditResponse[]>('cartItems', {
      isAuth: true,
      params: { ids: cartItemIds },
    })
    return response.data
  }

  async checkoutCart(): Promise<boolean> {
    const response = await this.put<boolean>('cartItems/checkout', undefined, { isAuth: true })
    return response.data
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { AppRESTAPIContainer }
