import { CartItemAddInput, CartItemEditResponse, CartItemUpdateInput, RawCartItem, RawProduct, ShopAPIContainer } from '@/demo/logic/api/base'
import { GQLAPIClient, createGQLAPIClient, injectGQLAPIClient, provideGQLAPIClient } from '@/app/logic/api/gql/client'
import { GQLAPIContainer, GQLAPIKey, createGQLAPI as _createGQLAPI, validateGQLAPIProvided } from '@/app/logic/api/gql'
import { ToRawTimestampEntity, toTimestampEntities, toTimestampEntity } from '@/app/logic/api/base'
import { inject, provide } from '@vue/composition-api'
import gql from 'graphql-tag'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface DemoGQLAPIContainer extends GQLAPIContainer, ShopAPIContainer {}

interface DemoGQLAPIContainerImpl extends DemoGQLAPIContainer {
  client: GQLAPIClient
}

interface RawCartItemEditResponse extends ToRawTimestampEntity<Omit<CartItemEditResponse, 'product'>> {
  product: ToRawTimestampEntity<CartItemEditResponse['product']>
}

//========================================================================
//
//  Implementation
//
//========================================================================

function createGQLAPI(): DemoGQLAPIContainer {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  const base = _createGQLAPI()
  const client = injectGQLAPIClient()

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  const getProduct: DemoGQLAPIContainerImpl['getProduct'] = async id => {
    const products = await getProducts([id])
    return products.length === 1 ? products[0] : undefined
  }

  const getProducts: DemoGQLAPIContainerImpl['getProducts'] = async ids => {
    const response = await client.query<{ products: RawProduct[] }>({
      query: gql`
        query GetProducts($ids: [ID!]) {
          products(ids: $ids) {
            id
            title
            price
            stock
            createdAt
            updatedAt
          }
        }
      `,
      variables: { ids },
    })

    return toTimestampEntities(response.data.products)
  }

  const getCartItem: DemoGQLAPIContainerImpl['getCartItem'] = async id => {
    const items = await getCartItems([id])
    return items.length === 1 ? items[0] : undefined
  }

  const getCartItems: DemoGQLAPIContainerImpl['getCartItems'] = async ids => {
    const response = await client.query<{ cartItems: RawCartItem[] }>({
      query: gql`
        query GetCartItems($ids: [ID!]) {
          cartItems(ids: $ids) {
            id
            uid
            productId
            title
            price
            quantity
            createdAt
            updatedAt
          }
        }
      `,
      variables: { ids },
      isAuth: true,
    })
    return toTimestampEntities(response.data.cartItems)
  }

  const addCartItems: DemoGQLAPIContainerImpl['addCartItems'] = async inputs => {
    const response = await client.mutate<{ addCartItems: RawCartItemEditResponse[] }>({
      mutation: gql`
        mutation AddCartItems($inputs: [CartItemAddInput!]!) {
          addCartItems(inputs: $inputs) {
            id
            uid
            productId
            title
            price
            quantity
            product {
              id
              stock
              createdAt
              updatedAt
            }
            createdAt
            updatedAt
          }
        }
      `,
      variables: {
        inputs: inputs.map(item => {
          return {
            productId: item.productId,
            title: item.title,
            price: item.price,
            quantity: item.quantity,
          } as CartItemAddInput
        }),
      },
      isAuth: true,
    })

    return response.data!.addCartItems.map(item => {
      const product = toTimestampEntity(item.product)
      const cartItem = toTimestampEntity(item)
      return { ...cartItem, product }
    })
  }

  const updateCartItems: DemoGQLAPIContainerImpl['updateCartItems'] = async inputs => {
    const response = await client.mutate<{ updateCartItems: RawCartItemEditResponse[] }>({
      mutation: gql`
        mutation UpdateCartItems($inputs: [CartItemUpdateInput!]!) {
          updateCartItems(inputs: $inputs) {
            id
            uid
            productId
            title
            price
            quantity
            product {
              id
              stock
              createdAt
              updatedAt
            }
            createdAt
            updatedAt
          }
        }
      `,
      variables: {
        inputs: inputs.map(item => {
          return {
            id: item.id,
            quantity: item.quantity,
          } as CartItemUpdateInput
        }),
      },
      isAuth: true,
    })

    return response.data!.updateCartItems.map(item => {
      const product = toTimestampEntity(item.product)
      const cartItem = toTimestampEntity(item)
      return { ...cartItem, product }
    })
  }

  const removeCartItems: DemoGQLAPIContainerImpl['removeCartItems'] = async ids => {
    const response = await client.mutate<{ removeCartItems: RawCartItemEditResponse[] }>({
      mutation: gql`
        mutation RemoveCartItems($ids: [ID!]!) {
          removeCartItems(ids: $ids) {
            id
            uid
            productId
            title
            price
            quantity
            product {
              id
              stock
              createdAt
              updatedAt
            }
            createdAt
            updatedAt
          }
        }
      `,
      variables: { ids },
      isAuth: true,
    })

    return response.data!.removeCartItems.map(item => {
      const product = toTimestampEntity(item.product)
      const cartItem = toTimestampEntity(item)
      return { ...cartItem, product }
    })
  }

  const checkoutCart: DemoGQLAPIContainerImpl['checkoutCart'] = async () => {
    const response = await client.mutate<{ checkoutCart: boolean }>({
      mutation: gql`
        mutation CheckoutCart {
          checkoutCart
        }
      `,
      isAuth: true,
    })
    return response.data!.checkoutCart
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
  } as DemoGQLAPIContainerImpl
}

function provideGQLAPI(options?: { api?: DemoGQLAPIContainer | typeof createGQLAPI; client?: GQLAPIClient | typeof createGQLAPIClient }): void {
  provideGQLAPIClient(options?.client)

  let instance: DemoGQLAPIContainer
  if (!options?.api) {
    instance = createGQLAPI()
  } else {
    instance = typeof options.api === 'function' ? options.api() : options.api
  }
  provide(GQLAPIKey, instance)
}

function injectGQLAPI(): DemoGQLAPIContainer {
  validateGQLAPIProvided()
  return inject(GQLAPIKey)! as DemoGQLAPIContainer
}

//========================================================================
//
//  Exports
//
//========================================================================

export { DemoGQLAPIContainer, DemoGQLAPIContainerImpl, GQLAPIKey, createGQLAPI, injectGQLAPI, provideGQLAPI, validateGQLAPIProvided }
