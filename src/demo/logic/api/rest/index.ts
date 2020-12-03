import { RawCartItem, RawCartItemEditResponse, RawProduct, ShopAPIContainer } from '@/demo/logic/api/base'
import { RESTAPIClient } from '@/app/logic/api/rest/client'
import { RESTAPIContainer } from '@/app/logic/api/rest'
import { toEntity } from '@/app/logic/api/base'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface DemoRESTAPIContainer extends RESTAPIContainer, ShopAPIContainer {}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace DemoRESTAPIContainer {
  export function newInstance(): DemoRESTAPIContainer {
    return newRawInstance()
  }

  export function newRawInstance() {
    //----------------------------------------------------------------------
    //
    //  Variables
    //
    //----------------------------------------------------------------------

    const PREFIX = 'example/shop'

    const base = RESTAPIContainer.newRawInstance()
    const client = RESTAPIClient.newInstance('example')

    //----------------------------------------------------------------------
    //
    //  Methods
    //
    //----------------------------------------------------------------------

    const getProduct: DemoRESTAPIContainer['getProduct'] = async id => {
      const response = await client.get<RawProduct[]>(`${PREFIX}/products`, {
        params: { ids: [id] },
      })
      if (response.data.length === 0) return
      return toEntity(response.data)[0]
    }

    const getProducts: DemoRESTAPIContainer['getProducts'] = async ids => {
      const response = await client.get<RawProduct[]>(`${PREFIX}/products`, {
        params: { ids },
      })
      return toEntity(response.data)
    }

    const getCartItem: DemoRESTAPIContainer['getCartItem'] = async id => {
      const response = await client.get<RawCartItem[]>(`${PREFIX}/cartItems`, {
        isAuth: true,
        params: { ids: [id] },
      })
      if (response.data.length === 0) return
      return toEntity(response.data)[0]
    }

    const getCartItems: DemoRESTAPIContainer['getCartItems'] = async ids => {
      const response = await client.get<RawCartItem[]>(`${PREFIX}/cartItems`, {
        isAuth: true,
        params: { ids },
      })
      return toEntity(response.data)
    }

    const addCartItems: DemoRESTAPIContainer['addCartItems'] = async inputs => {
      const response = await client.post<RawCartItemEditResponse[]>(`${PREFIX}/cartItems`, inputs, { isAuth: true })
      return toEntity(response.data)
    }

    const updateCartItems: DemoRESTAPIContainer['updateCartItems'] = async inputs => {
      const response = await client.put<RawCartItemEditResponse[]>(`${PREFIX}/cartItems`, inputs, { isAuth: true })
      return toEntity(response.data)
    }

    const removeCartItems: DemoRESTAPIContainer['removeCartItems'] = async cartItemIds => {
      const response = await client.delete<RawCartItemEditResponse[]>(`${PREFIX}/cartItems`, {
        isAuth: true,
        params: { ids: cartItemIds },
      })
      return toEntity(response.data)
    }

    const checkoutCart: DemoRESTAPIContainer['checkoutCart'] = async () => {
      const response = await client.put<boolean>(`${PREFIX}/checkoutCart`, undefined, { isAuth: true })
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
    }
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { DemoRESTAPIContainer, RawCartItem, RawProduct }
