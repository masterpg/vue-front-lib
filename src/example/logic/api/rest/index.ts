import { APICartItem, APICartItemAddInput, APICartItemEditResponse, APICartItemUpdateInput, APIProduct, AppAPIContainer } from '../base'
import { BaseRESTAPIContainer } from '@/lib'

//========================================================================
//
//  Implementation
//
//========================================================================

class AppRESTAPIContainer extends BaseRESTAPIContainer implements AppAPIContainer {
  async getProduct(id: string): Promise<APIProduct | undefined> {
    const response = await this.get<APIProduct>(`products/${id}`)
    return response.data
  }

  async getProducts(ids?: string[]): Promise<APIProduct[]> {
    const response = await this.get<APIProduct[]>('products')
    return response.data
  }

  async getCartItem(id: string): Promise<APICartItem | undefined> {
    const response = await this.get<APICartItem>(`cartItems/${id}`, { isAuth: true })
    return response.data
  }

  async getCartItems(ids?: string[]): Promise<APICartItem[]> {
    const response = await this.get<APICartItem[]>('cartItems', { isAuth: true })
    return response.data
  }

  async addCartItems(items: APICartItemAddInput[]): Promise<APICartItemEditResponse[]> {
    const response = await this.post<APICartItemEditResponse[]>('cartItems', items, { isAuth: true })
    return response.data
  }

  async updateCartItems(items: APICartItemUpdateInput[]): Promise<APICartItemEditResponse[]> {
    const response = await this.put<APICartItemEditResponse[]>('cartItems', items, { isAuth: true })
    return response.data
  }

  async removeCartItems(cartItemIds: string[]): Promise<APICartItemEditResponse[]> {
    const response = await this.delete<APICartItemEditResponse[]>('cartItems', {
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
