import {
  APIAddCartItemInput,
  APICartItem,
  APIEditCartItemResponse,
  APIProduct,
  APIUpdateCartItemInput,
  AppAPIContainer,
} from '@/example/logic/api/types'
import { BaseRESTAPIContainer } from '@/lib'

export class AppRESTAPIContainer extends BaseRESTAPIContainer implements AppAPIContainer {
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

  async addCartItems(items: APIAddCartItemInput[]): Promise<APIEditCartItemResponse[]> {
    const response = await this.post<APIEditCartItemResponse[]>('cartItems', items, { isAuth: true })
    return response.data
  }

  async updateCartItems(items: APIUpdateCartItemInput[]): Promise<APIEditCartItemResponse[]> {
    const response = await this.put<APIEditCartItemResponse[]>('cartItems', items, { isAuth: true })
    return response.data
  }

  async removeCartItems(cartItemIds: string[]): Promise<APIEditCartItemResponse[]> {
    const response = await this.delete<APIEditCartItemResponse[]>('cartItems', {
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
