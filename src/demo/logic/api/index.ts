import { DemoAPIContainer, ShopAPIContainer } from '@/demo/logic/api/base'
import { DemoGQLAPIContainerImpl, injectGQLAPI, provideGQLAPI } from '@/demo/logic/api/gql'
import { DemoRESTAPIContainerImpl, injectRESTAPI, provideRESTAPI } from '@/demo/logic/api/rest'
import { computed, inject, provide, reactive } from '@vue/composition-api'
import { APIKey } from '@/app/logic/api'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface DemoAPIContainerImpl extends DemoAPIContainer {
  gql: DemoGQLAPIContainerImpl
  rest: DemoRESTAPIContainerImpl
}

//========================================================================
//
//  Implementation
//
//========================================================================

function createAPI(): DemoAPIContainer {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  const gql = injectGQLAPI()
  const rest = injectRESTAPI()

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
    gql,
    rest,
  } as DemoAPIContainerImpl
}

function provideAPI(api?: DemoAPIContainer | typeof createAPI): void {
  provideGQLAPI()
  provideRESTAPI()

  let instance: DemoAPIContainer
  if (!api) {
    instance = createAPI()
  } else {
    instance = typeof api === 'function' ? api() : api
  }
  provide(APIKey, instance)
}

function injectAPI(): DemoAPIContainer {
  validateAPIProvided()
  return inject(APIKey)! as DemoAPIContainer
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

export { DemoAPIContainer, DemoAPIContainerImpl, APIKey, createAPI, injectAPI, provideAPI, validateAPIProvided }
