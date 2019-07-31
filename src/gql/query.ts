import { GQLCartItem, GQLProduct, GQLQuery } from '@/gql/types'
import Component from 'vue-class-component'
import Vue from 'vue'
import gql from 'graphql-tag'
import { gqlClient } from '@/gql/base'

@Component
export class GQLQueryImpl extends Vue implements GQLQuery {
  async products(): Promise<GQLProduct[]> {
    const response = await gqlClient.query<{ products: GQLProduct[] }>({
      query: gql`
        query GetProducts {
          products {
            id
            title
            price
            stock
          }
        }
      `,
    })
    return response.data.products
  }

  async cartItems(userId: string): Promise<GQLCartItem[]> {
    const response = await gqlClient.query<{ cartItems: GQLCartItem[] }>({
      query: gql`
        query GetCartItems($userId: ID!) {
          cartItems(userId: $userId) {
            id
            userId
            productId
            title
            price
            quantity
          }
        }
      `,
      variables: { userId },
      auth: true,
    })
    return response.data.cartItems
  }
}
