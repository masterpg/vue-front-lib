import { APIContainer, injectAPI as _injectAPI, provideAPI as _provideAPI } from '@/app/services/apis'
import { WritableComputedRef, computed, reactive } from '@vue/composition-api'
import { DemoGQLAPIContainer } from '@/demo/services/apis/gql'
import { DemoRESTAPIContainer } from '@/demo/services/apis/rest'
import { ShopAPIContainer } from '@/demo/services/apis/base'

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

    const gql = DemoGQLAPIContainer.newRawInstance()
    const rest = DemoRESTAPIContainer.newRawInstance()

    const state = reactive({
      type: 'gql' as 'gql' | 'rest',
    })

    const shopAPI = computed<ShopAPIContainer>(() => {
      switch (type.value) {
        case 'gql':
          return gql
        case 'rest':
          return rest
        default:
          throw new Error(`API type '${type.value}' is invalid.`)
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
    }
  }
}

//========================================================================
//
//  Dependency Injection
//
//========================================================================

function provideAPI(apis: DemoAPIContainer): void {
  _provideAPI(apis)
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
