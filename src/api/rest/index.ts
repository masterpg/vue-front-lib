import { APIAddCartItemInput, APICartItem, APIEditCartItemResponse, APIProduct, APIStorageNode, APIUpdateCartItemInput, AppAPI } from '@/api/types'
import { BaseAPI } from '@/api/rest/base'

export class RESTAppAPIImpl extends BaseAPI implements AppAPI {
  async customToken(): Promise<string> {
    throw new Error('This method "customToken" is not implemented.')
  }

  async userStorageBasePath(): Promise<string> {
    throw new Error('This method "userStorageBasePath" is not implemented.')
  }

  async userStorageDirNodes(dirPath?: string): Promise<APIStorageNode[]> {
    throw new Error('This method "userStorageDirNodes" is not implemented.')
  }

  async createUserStorageDirs(dirPaths: string[]): Promise<APIStorageNode[]> {
    throw new Error('This method "createUserStorageDirs" is not implemented.')
  }

  async removeUserStorageFiles(filePaths: string[]): Promise<APIStorageNode[]> {
    throw new Error('This method "removeUserStorageFiles" is not implemented.')
  }

  async removeUserStorageDir(dirPath: string): Promise<APIStorageNode[]> {
    throw new Error('This method "removeUserStorageDir" is not implemented.')
  }

  async getSignedUploadUrls(inputs: { filePath: string; contentType?: string }[]): Promise<string[]> {
    throw new Error('This method "getSignedUploadUrls" is not implemented.')
  }

  async product(id: string): Promise<APIProduct | undefined> {
    const response = await this.get<APIProduct>(`products/${id}`)
    return response.data
  }

  async products(ids?: string[]): Promise<APIProduct[]> {
    const response = await this.get<APIProduct[]>('products')
    return response.data
  }

  async cartItem(id: string): Promise<APICartItem | undefined> {
    const response = await this.get<APICartItem>(`cartItems/${id}`, { isAuth: true })
    return response.data
  }

  async cartItems(ids?: string[]): Promise<APICartItem[]> {
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
