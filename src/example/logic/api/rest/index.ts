import {
  APIStorageNode,
  AppAPIContainer,
  AppConfigResponse,
  AuthDataResult,
  CartItemAddInput,
  CartItemEditResponse,
  CartItemUpdateInput,
  RawTimestampEntity,
  toTimestampEntities as _toTimestampEntities,
  toTimestampEntity as _toTimestampEntity,
} from '@/example/logic/api/base'
import {
  CartItem,
  CreateArticleTypeDirInput,
  CreateStorageNodeInput,
  Product,
  SetArticleSortOrderInput,
  StorageArticleNodeType,
  StorageNode,
  StorageNodeKeyInput,
  StorageNodeShareSettingsInput,
  StoragePaginationInput,
  StoragePaginationResult,
  UserInfo,
  UserInfoInput,
} from '@/example/logic/types'
import { BaseRESTClient } from '@/example/logic/api/rest/base'
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

class AppRESTAPIContainer extends BaseRESTClient implements AppAPIContainer {
  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  async getAppConfig(): Promise<AppConfigResponse> {
    throw new Error(`This method 'getAppConfig' is not implemented.`)
  }

  //--------------------------------------------------
  //  User
  //--------------------------------------------------

  getAuthData(): Promise<AuthDataResult> {
    throw new Error(`This method 'getAuthData' is not implemented.`)
  }

  setOwnUserInfo(input: UserInfoInput): Promise<UserInfo> {
    throw new Error(`This method 'setOwnUserInfo' is not implemented.`)
  }

  deleteOwnUser(): Promise<boolean> {
    throw new Error(`This method 'deleteOwnUser' is not implemented.`)
  }

  //--------------------------------------------------
  //  Storage
  //--------------------------------------------------

  getStorageNode(input: StorageNodeKeyInput): Promise<APIStorageNode | undefined> {
    throw new Error(`This method 'getStorageNode' is not implemented.`)
  }

  getStorageDirDescendants(dirPath?: string, input?: StoragePaginationInput): Promise<StoragePaginationResult> {
    throw new Error(`This method 'getStorageDirDescendants' is not implemented.`)
  }

  getStorageDescendants(dirPath?: string, input?: StoragePaginationInput): Promise<StoragePaginationResult> {
    throw new Error(`This method 'getStorageDescendants' is not implemented.`)
  }

  getStorageDirChildren(dirPath?: string, input?: StoragePaginationInput): Promise<StoragePaginationResult> {
    throw new Error(`This method 'getStorageDirChildren' is not implemented.`)
  }

  getStorageChildren(dirPath?: string, input?: StoragePaginationInput): Promise<StoragePaginationResult> {
    throw new Error(`This method 'getStorageChildren' is not implemented.`)
  }

  getStorageHierarchicalNodes(nodePath: string): Promise<StorageNode[]> {
    throw new Error(`This method 'getStorageHierarchicalNodes' is not implemented.`)
  }

  getStorageAncestorDirs(nodePath: string): Promise<StorageNode[]> {
    throw new Error(`This method 'getStorageAncestorDirs' is not implemented.`)
  }

  async handleUploadedFile(filePath: string): Promise<StorageNode> {
    throw new Error(`This method 'handleUploadedFile' is not implemented.`)
  }

  createStorageDir(dirPath: string, input?: CreateStorageNodeInput): Promise<APIStorageNode> {
    throw new Error(`This method 'createStorageDir' is not implemented.`)
  }

  async createStorageHierarchicalDirs(dirPaths: string[]): Promise<StorageNode[]> {
    throw new Error(`This method 'createStorageHierarchicalDirs' is not implemented.`)
  }

  async removeStorageDir(dirPath: string, input?: StoragePaginationInput): Promise<StoragePaginationResult> {
    throw new Error(`This method 'removeStorageDir' is not implemented.`)
  }

  async removeStorageFile(filePath: string): Promise<StorageNode | undefined> {
    throw new Error(`This method 'removeStorageFile' is not implemented.`)
  }

  moveStorageDir(fromDirPath: string, toDirPath: string, input?: StoragePaginationInput): Promise<StoragePaginationResult> {
    throw new Error(`This method 'moveStorageDir' is not implemented.`)
  }

  moveStorageFile(fromFilePath: string, toFilePath: string): Promise<StorageNode> {
    throw new Error(`This method 'moveStorageFile' is not implemented.`)
  }

  async renameStorageDir(dirPath: string, newName: string, input?: StoragePaginationInput): Promise<StoragePaginationResult> {
    throw new Error(`This method 'renameStorageDir' is not implemented.`)
  }

  async renameStorageFile(filePath: string, newName: string): Promise<StorageNode> {
    throw new Error(`This method 'renameStorageFile' is not implemented.`)
  }

  setStorageDirShareSettings(dirPath: string, input: StorageNodeShareSettingsInput): Promise<StorageNode> {
    throw new Error(`This method 'setStorageDirShareSettings' is not implemented.`)
  }

  setStorageFileShareSettings(filePath: string, input: StorageNodeShareSettingsInput): Promise<StorageNode> {
    throw new Error(`This method 'setStorageFileShareSettings' is not implemented.`)
  }

  async getSignedUploadUrls(inputs: { filePath: string; contentType?: string }[]): Promise<string[]> {
    throw new Error(`This method 'getSignedUploadUrls' is not implemented.`)
  }

  //--------------------------------------------------
  //  Article
  //--------------------------------------------------

  createArticleTypeDir(input: CreateArticleTypeDirInput): Promise<APIStorageNode> {
    throw new Error(`This method 'createArticleTypeDir' is not implemented.`)
  }

  createArticleGeneralDir(dirPath: string): Promise<APIStorageNode> {
    throw new Error(`This method 'createArticleGeneralDir' is not implemented.`)
  }

  renameArticleNode(nodePath: string, newName: string): Promise<APIStorageNode> {
    throw new Error(`This method 'renameArticleNode' is not implemented.`)
  }

  setArticleSortOrder(nodePath: string, input: SetArticleSortOrderInput): Promise<APIStorageNode> {
    throw new Error(`This method 'setArticleSortOrder' is not implemented.`)
  }

  getArticleChildren(dirPath: string, articleTypes: StorageArticleNodeType[], input?: StoragePaginationInput): Promise<StoragePaginationResult> {
    throw new Error(`This method 'getArticleChildren' is not implemented.`)
  }

  //--------------------------------------------------
  //  Helpers
  //--------------------------------------------------

  // eslint-disable-next-line space-before-function-paren
  async callStoragePaginationAPI<FUNC extends (...args: any[]) => Promise<StoragePaginationResult>>(
    func: FUNC,
    ...params: Parameters<FUNC>
  ): Promise<StorageNode[]> {
    throw new Error(`This method 'callStoragePaginationAPI' is not implemented.`)
  }

  //--------------------------------------------------
  //  Shop
  //--------------------------------------------------

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

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  protected readonly toTimestampEntity = _toTimestampEntity

  protected readonly toTimestampEntities = _toTimestampEntities
}

//========================================================================
//
//  Exports
//
//========================================================================

export { AppRESTAPIContainer }
