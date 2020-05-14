import { APITimestampEntity, BaseRESTAPIContainer, OmitEntityTimestamp } from '@/lib'
import { AppAPIContainer, CartItem, CartItemAddInput, CartItemEditResponse, CartItemUpdateInput, Product } from '../base'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface APIProduct extends OmitEntityTimestamp<Product>, APITimestampEntity {}

interface APICartItem extends OmitEntityTimestamp<CartItem>, APITimestampEntity {}

//========================================================================
//
//  Implementation
//
//========================================================================

class AppRESTAPIContainer extends BaseRESTAPIContainer implements AppAPIContainer {
  async getProduct(id: string): Promise<Product | undefined> {
    const response = await this.get<APIProduct>(`products/${id}`)
    return this.toTimestampEntity(response.data)
  }

  async getProducts(ids?: string[]): Promise<Product[]> {
    const response = await this.get<APIProduct[]>('products')
    return this.toTimestampEntities(response.data)
  }

  async getCartItem(id: string): Promise<CartItem | undefined> {
    const response = await this.get<APICartItem>(`cartItems/${id}`, { isAuth: true })
    return this.toTimestampEntity(response.data)
  }

  async getCartItems(ids?: string[]): Promise<CartItem[]> {
    const response = await this.get<APICartItem[]>('cartItems', { isAuth: true })
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
