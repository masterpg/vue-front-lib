import { GQLCartItem, GQLMutation, GQLProduct } from '@/gql/types'
import Component from 'vue-class-component'
import Vue from 'vue'
import gql from 'graphql-tag'
import { gqlClient } from '@/gql/base'

@Component
export class GQLMutationImpl extends Vue implements GQLMutation {
  async addCartItems(
    items: {
      id?: string
      userId: string
      productId: string
      title: string
      price: number
      quantity: number
    }[]
  ): Promise<GQLCartItem[]> {
    const response = await gqlClient.mutate<{ addCartItems: GQLCartItem[] }>({
      mutation: gql`
        mutation AddCartItems($items: [AddCartItemInput!]!) {
          addCartItems(items: $items) {
            id
            userId
            productId
            title
            price
            quantity
          }
        }
      `,
      variables: { items },
      auth: true,
    })
    return response.data.addCartItems
  }

  async updateCartItems(items: { id: string; quantity: number }[]): Promise<GQLCartItem[]> {
    const response = await gqlClient.mutate<{ updateCartItems: GQLCartItem[] }>({
      mutation: gql`
        mutation UpdateCartItems($items: [UpdateCartItemInput!]!) {
          updateCartItems(items: $items) {
            id
            userId
            productId
            title
            price
            quantity
          }
        }
      `,
      variables: { items },
      auth: true,
    })
    return response.data.updateCartItems
  }

  async removeCartItems(cartItemIds: string[]): Promise<GQLCartItem[]> {
    const response = await gqlClient.mutate<{ removeCartItems: GQLCartItem[] }>({
      mutation: gql`
        mutation RemoveCartItems($cartItemIds: [ID!]!) {
          removeCartItems(cartItemIds: $cartItemIds) {
            id
            userId
            productId
            title
            price
            quantity
          }
        }
      `,
      variables: { cartItemIds },
      auth: true,
    })
    return response.data.removeCartItems
  }

  async checkoutCart(userId: string): Promise<boolean> {
    const response = await gqlClient.mutate<{ checkoutCart: boolean }>({
      mutation: gql`
        mutation CheckoutCart($userId: ID!) {
          checkoutCart(userId: $userId)
        }
      `,
      variables: { userId },
      auth: true,
    })
    return response.data.checkoutCart
  }
}
