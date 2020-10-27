import { APIContainer, injectAPI as _injectAPI, provideAPI as _provideAPI } from '@/app/logic/api'
import { WritableComputedRef, computed, reactive } from '@vue/composition-api'
import { DemoGQLAPIContainer } from '@/demo/logic/api/gql'
import { DemoRESTAPIContainer } from '@/demo/logic/api/rest'
import { GQLAPIClient } from '@/app/logic/api/gql/client'
import { RESTAPIClient } from '@/app/logic/api/rest/client'
import { ShopAPIContainer } from '@/demo/logic/api/base'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface DemoAPIContainer extends APIContainer, ShopAPIContainer {
  type: WritableComputedRef<'gql' | 'rest'>
}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace DemoAPIContainer {
  export function newInstance(): DemoAPIContainer {
    return newRawInstance()
  }

  export function newRawInstance() {
    //----------------------------------------------------------------------
    //
    //  Variables
    //
    //----------------------------------------------------------------------

    const gqlClient = GQLAPIClient.newInstance()
    const restClient = RESTAPIClient.newInstance()

    const gql = DemoGQLAPIContainer.newRawInstance(gqlClient)
    const rest = DemoRESTAPIContainer.newRawInstance(restClient)

    const state = reactive({
      type: 'gql' as 'gql' | 'rest',
    })

    const shopAPI = computed<ShopAPIContainer>(() => {
      switch (type.value) {
        case 'gql':
          return gql
        case 'rest':
          return rest
      }
    })

    //----------------------------------------------------------------------
    //
    //  Properties
    //
    //----------------------------------------------------------------------

    const type = computed({
      get: () => state.type,
      set: value => (state.type = value),
    })

    //----------------------------------------------------------------------
    //
    //  Methods
    //
    //----------------------------------------------------------------------

    //--------------------------------------------------
    //  Shop
    //--------------------------------------------------

    const getProduct: DemoAPIContainer['getProduct'] = id => shopAPI.value.getProduct(id)

    const getProducts: DemoAPIContainer['getProducts'] = ids => shopAPI.value.getProducts(ids)

    const getCartItem: DemoAPIContainer['getCartItem'] = id => shopAPI.value.getCartItem(id)

    const getCartItems: DemoAPIContainer['getCartItems'] = ids => shopAPI.value.getCartItems(ids)

    const addCartItems: DemoAPIContainer['addCartItems'] = inputs => shopAPI.value.addCartItems(inputs)

    const updateCartItems: DemoAPIContainer['updateCartItems'] = inputs => shopAPI.value.updateCartItems(inputs)

    const removeCartItems: DemoAPIContainer['removeCartItems'] = ids => shopAPI.value.removeCartItems(ids)

    const checkoutCart: DemoAPIContainer['checkoutCart'] = () => shopAPI.value.checkoutCart()

    //----------------------------------------------------------------------
    //
    //  Result
    //
    //----------------------------------------------------------------------

    return {
      ...gql,
      ...rest,
      type,
      getProduct,
      getProducts,
      getCartItem,
      getCartItems,
      addCartItems,
      updateCartItems,
      removeCartItems,
      checkoutCart,
      gql: { client: gqlClient },
      rest: { client: restClient },
    }
  }
}

//========================================================================
//
//  Dependency Injection
//
//========================================================================

function provideAPI(api: DemoAPIContainer): void {
  _provideAPI(api)
}

function injectAPI(): DemoAPIContainer {
  return _injectAPI() as DemoAPIContainer
}

//========================================================================
//
//  Exports
//
//========================================================================

export { DemoAPIContainer, provideAPI, injectAPI }
