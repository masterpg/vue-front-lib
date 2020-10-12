import { RESTAPIClient, createRESTAPIClient, injectRESTAPIClient, provideRESTAPIClient } from '@/app/logic/api/rest/client'
import { RESTAPIContainer, RESTAPIKey, createRESTAPI as _createRESTAPI, validateRESTAPIProvided } from '@/app/logic/api/rest'
import { RawCartItem, RawCartItemEditResponse, RawProduct, ShopAPIContainer } from '@/demo/logic/api/base'
import { inject, provide } from '@vue/composition-api'
import { toTimestampEntities } from '@/app/logic/api/base'
import { validateAPIProvided } from '@/app/logic/api'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface RESTDemoAPIContainer extends RESTAPIContainer, ShopAPIContainer {}

interface DemoRESTAPIContainerImpl extends RESTDemoAPIContainer {
  client: RESTAPIClient
}

//========================================================================
//
//  Implementation
//
//========================================================================

function createRESTAPI(): RESTDemoAPIContainer {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  const base = _createRESTAPI()
  const client = injectRESTAPIClient()

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  const getProduct: DemoRESTAPIContainerImpl['getProduct'] = async id => {
    const response = await client.get<RawProduct[]>('products', {
      params: { ids: [id] },
    })
    if (response.data.length === 0) return
    return toTimestampEntities(response.data)[0]
  }

  const getProducts: DemoRESTAPIContainerImpl['getProducts'] = async ids => {
    const response = await client.get<RawProduct[]>('products', {
      params: { ids },
    })
    return toTimestampEntities(response.data)
  }

  const getCartItem: DemoRESTAPIContainerImpl['getCartItem'] = async id => {
    const response = await client.get<RawCartItem[]>('cartItems', {
      isAuth: true,
      params: { ids: [id] },
    })
    if (response.data.length === 0) return
    return toTimestampEntities(response.data)[0]
  }

  const getCartItems: DemoRESTAPIContainerImpl['getCartItems'] = async ids => {
    const response = await client.get<RawCartItem[]>('cartItems', {
      isAuth: true,
      params: { ids },
    })
    return toTimestampEntities(response.data)
  }

  const addCartItems: DemoRESTAPIContainerImpl['addCartItems'] = async inputs => {
    const response = await client.post<RawCartItemEditResponse[]>('cartItems', inputs, { isAuth: true })
    return toTimestampEntities(response.data)
  }

  const updateCartItems: DemoRESTAPIContainerImpl['updateCartItems'] = async inputs => {
    const response = await client.put<RawCartItemEditResponse[]>('cartItems', inputs, { isAuth: true })
    return toTimestampEntities(response.data)
  }

  const removeCartItems: DemoRESTAPIContainerImpl['removeCartItems'] = async cartItemIds => {
    const response = await client.delete<RawCartItemEditResponse[]>('cartItems', {
      isAuth: true,
      params: { ids: cartItemIds },
    })
    return toTimestampEntities(response.data)
  }

  const checkoutCart: DemoRESTAPIContainerImpl['checkoutCart'] = async () => {
    const response = await client.put<boolean>('cartItems/checkout', undefined, { isAuth: true })
    return response.data
  }

  //----------------------------------------------------------------------
  //
  //  Result
  //
  //----------------------------------------------------------------------

  return {
    ...base,
    getProduct,
    getProducts,
    getCartItem,
    getCartItems,
    addCartItems,
    updateCartItems,
    removeCartItems,
    checkoutCart,
    client,
  } as DemoRESTAPIContainerImpl
}

function provideRESTAPI(options?: { api?: RESTDemoAPIContainer | typeof createRESTAPI; client?: RESTAPIClient | typeof createRESTAPIClient }): void {
  provideRESTAPIClient(options?.client)

  let instance: RESTDemoAPIContainer
  if (!options?.api) {
    instance = createRESTAPI()
  } else {
    instance = typeof options.api === 'function' ? options.api() : options.api
  }
  provide(RESTAPIKey, instance)
}

function injectRESTAPI(): RESTDemoAPIContainer {
  validateRESTAPIProvided()
  return inject(RESTAPIKey)! as RESTDemoAPIContainer
}

//========================================================================
//
//  Exports
//
//========================================================================

export {
  RESTDemoAPIContainer,
  DemoRESTAPIContainerImpl,
  RESTAPIKey,
  RawCartItem,
  RawProduct,
  createRESTAPI,
  injectRESTAPI,
  provideRESTAPI,
  validateAPIProvided,
}
