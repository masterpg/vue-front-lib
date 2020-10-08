import { APIClient, createAPIClient, injectAPIClient, provideAPIClient } from '@/logic/api/client'
import { CartItem, OmitEntityTimestamp, Product, TimestampEntity } from '@/logic'
import { InjectionKey, inject, provide } from '@vue/composition-api'
import dayjs from 'dayjs'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface APIContainer {
  getProduct(id: string): Promise<Product | undefined>

  getProducts(ids?: string[]): Promise<Product[]>

  getCartItem(id: string): Promise<CartItem | undefined>

  getCartItems(ids?: string[]): Promise<CartItem[]>

  addCartItems(items: CartItemAddInput[]): Promise<CartItemEditResponse[]>

  updateCartItems(items: CartItemUpdateInput[]): Promise<CartItemEditResponse[]>

  removeCartItems(cartItemIds: string[]): Promise<CartItemEditResponse[]>

  checkoutCart(): Promise<boolean>
}

interface APIContainerImpl extends APIContainer {
  client: APIClient

  toTimestampEntity<T extends RawTimestampEntity>(entity: T): (OmitEntityTimestamp<T> & TimestampEntity) | undefined

  toTimestampEntities<T extends RawTimestampEntity>(entities: T[]): (OmitEntityTimestamp<T> & TimestampEntity)[]
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
  product: Pick<Product, 'id' | 'stock'>
}

interface RawEntity {
  id: string
}

interface RawTimestampEntity extends RawEntity {
  createdAt: string
  updatedAt: string
}

interface RawProduct extends OmitEntityTimestamp<Product>, RawTimestampEntity {}

interface RawCartItem extends OmitEntityTimestamp<CartItem>, RawTimestampEntity {}

interface RawCartItemEditResponse extends OmitEntityTimestamp<CartItemEditResponse>, RawTimestampEntity {}

//========================================================================
//
//  Implementation
//
//========================================================================

const APIKey: InjectionKey<APIContainer> = Symbol('APIContainer')

function createAPI(): APIContainer {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  const client = injectAPIClient()

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  const getProduct: APIContainer['getProduct'] = async id => {
    const response = await client.get<RawProduct[]>('products', {
      params: { ids: [id] },
    })
    if (response.data.length === 0) return
    return toTimestampEntities(response.data)[0]
  }

  const getProducts: APIContainer['getProducts'] = async ids => {
    const response = await client.get<RawProduct[]>('products', {
      params: { ids },
    })
    return toTimestampEntities(response.data)
  }

  const getCartItem: APIContainer['getCartItem'] = async id => {
    const response = await client.get<RawCartItem[]>('cartItems', {
      isAuth: true,
      params: { ids: [id] },
    })
    if (response.data.length === 0) return
    return toTimestampEntities(response.data)[0]
  }

  const getCartItems: APIContainer['getCartItems'] = async ids => {
    const response = await client.get<RawCartItem[]>('cartItems', {
      isAuth: true,
      params: { ids },
    })
    return toTimestampEntities(response.data)
  }

  const addCartItems: APIContainer['addCartItems'] = async items => {
    const response = await client.post<RawCartItemEditResponse[]>('cartItems', items, { isAuth: true })
    return toTimestampEntities(response.data)
  }

  const updateCartItems: APIContainer['updateCartItems'] = async items => {
    const response = await client.put<RawCartItemEditResponse[]>('cartItems', items, { isAuth: true })
    return toTimestampEntities(response.data)
  }

  const removeCartItems: APIContainer['removeCartItems'] = async cartItemIds => {
    const response = await client.delete<RawCartItemEditResponse[]>('cartItems', {
      isAuth: true,
      params: { ids: cartItemIds },
    })
    return toTimestampEntities(response.data)
  }

  const checkoutCart: APIContainer['checkoutCart'] = async () => {
    const response = await client.put<boolean>('cartItems/checkout', undefined, { isAuth: true })
    return response.data
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  const toTimestampEntity: APIContainerImpl['toTimestampEntity'] = entity => {
    if (!entity) return

    const { createdAt, updatedAt, ...otherEntity } = entity
    return {
      ...otherEntity,
      createdAt: dayjs(createdAt),
      updatedAt: dayjs(updatedAt),
    }
  }

  const toTimestampEntities: APIContainerImpl['toTimestampEntities'] = entities => {
    return entities.map(entity => toTimestampEntity(entity)!)
  }

  //----------------------------------------------------------------------
  //
  //  Result
  //
  //----------------------------------------------------------------------

  return {
    getProduct,
    getProducts,
    getCartItem,
    getCartItems,
    addCartItems,
    updateCartItems,
    removeCartItems,
    checkoutCart,
    client,
    toTimestampEntity,
    toTimestampEntities,
  } as APIContainerImpl
}

function provideAPI(options?: { api?: APIContainer | typeof createAPI; client?: APIClient | typeof createAPIClient }): void {
  provideAPIClient(options?.client)

  let instance: APIContainer
  if (!options?.api) {
    instance = createAPI()
  } else {
    instance = typeof options.api === 'function' ? options.api() : options.api
  }
  provide(APIKey, instance)
}

function injectAPI(): APIContainer {
  validateAPIProvided()
  return inject(APIKey)!
}

function validateAPIProvided(): void {
  const value = inject(APIKey)
  if (!value) {
    throw new Error(`${APIKey.description} is not provided`)
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export {
  APIContainer,
  APIContainerImpl,
  APIKey,
  CartItemAddInput,
  CartItemEditResponse,
  CartItemUpdateInput,
  RawCartItem,
  RawEntity,
  RawProduct,
  RawTimestampEntity,
  createAPI,
  injectAPI,
  provideAPI,
  validateAPIProvided,
}
