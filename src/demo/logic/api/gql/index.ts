import { CartItemAddInput, CartItemEditResponse, CartItemUpdateInput, RawCartItem, RawProduct, ShopAPIContainer } from '@/demo/logic/api/base'
import { RawEntity, toEntity } from '@/app/logic/api/base'
import { GQLAPIClient } from '@/app/logic/api/gql/client'
import { GQLAPIContainer } from '@/app/logic/api/gql'
import gql from 'graphql-tag'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface DemoGQLAPIContainer extends GQLAPIContainer, ShopAPIContainer {}

interface RawCartItemEditResponse extends RawEntity<Omit<CartItemEditResponse, 'product'>> {
  product: RawEntity<CartItemEditResponse['product']>
}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace DemoGQLAPIContainer {
  export function newInstance(): DemoGQLAPIContainer {
    return newRawInstance()
  }

  export function newRawInstance() {
    //----------------------------------------------------------------------
    //
    //  Variables
    //
    //----------------------------------------------------------------------

    const base = GQLAPIContainer.newRawInstance()
    const clientExample = GQLAPIClient.newInstance('example')

    //----------------------------------------------------------------------
    //
    //  Methods
    //
    //----------------------------------------------------------------------

    const getProduct: DemoGQLAPIContainer['getProduct'] = async id => {
      const products = await getProducts([id])
      return products.length === 1 ? products[0] : undefined
    }

    const getProducts: DemoGQLAPIContainer['getProducts'] = async ids => {
      const response = await clientExample.query<{ products: RawProduct[] }>({
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

      return toEntity(response.data.products)
    }

    const getCartItem: DemoGQLAPIContainer['getCartItem'] = async id => {
      const items = await getCartItems([id])
      return items.length === 1 ? items[0] : undefined
    }

    const getCartItems: DemoGQLAPIContainer['getCartItems'] = async ids => {
      const response = await clientExample.query<{ cartItems: RawCartItem[] }>({
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
      return toEntity(response.data.cartItems)
    }

    const addCartItems: DemoGQLAPIContainer['addCartItems'] = async inputs => {
      const response = await clientExample.mutate<{ addCartItems: RawCartItemEditResponse[] }>({
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
        const product = toEntity(item.product)
        const cartItem = toEntity(item)
        return { ...cartItem, product }
      })
    }

    const updateCartItems: DemoGQLAPIContainer['updateCartItems'] = async inputs => {
      const response = await clientExample.mutate<{ updateCartItems: RawCartItemEditResponse[] }>({
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
        const product = toEntity(item.product)
        const cartItem = toEntity(item)
        return { ...cartItem, product }
      })
    }

    const removeCartItems: DemoGQLAPIContainer['removeCartItems'] = async ids => {
      const response = await clientExample.mutate<{ removeCartItems: RawCartItemEditResponse[] }>({
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
        const product = toEntity(item.product)
        const cartItem = toEntity(item)
        return { ...cartItem, product }
      })
    }

    const checkoutCart: DemoGQLAPIContainer['checkoutCart'] = async () => {
      const response = await clientExample.mutate<{ checkoutCart: boolean }>({
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
    }
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { DemoGQLAPIContainer }
