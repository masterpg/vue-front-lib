import {
  APIAddCartItemInput,
  APICartItem,
  APIEditCartItemResponse,
  APIProduct,
  APIUpdateCartItemInput,
  AppAPIContainer,
} from '@/example/logic/api/types'
import { BaseGQLAPIContainer } from '@/lib'
import gql from 'graphql-tag'

export class AppGQLAPIContainer extends BaseGQLAPIContainer implements AppAPIContainer {
  async product(id: string): Promise<APIProduct | undefined> {
    const products = await this.products([id])
    return products.length === 1 ? products[0] : undefined
  }

  async products(ids?: string[]): Promise<APIProduct[]> {
    const response = await this.query<{ products: APIProduct[] }>({
      query: gql`
        query GetProducts($ids: [ID!]) {
          products(ids: $ids) {
            id
            title
            price
            stock
          }
        }
      `,
      variables: { ids },
    })
    return response.data.products
  }

  async cartItem(id: string): Promise<APICartItem | undefined> {
    const items = await this.cartItems([id])
    return items.length === 1 ? items[0] : undefined
  }

  async cartItems(ids?: string[]): Promise<APICartItem[]> {
    const response = await this.query<{ cartItems: APICartItem[] }>({
      query: gql`
        query GetCartItems($ids: [ID!]) {
          cartItems(ids: $ids) {
            id
            uid
            productId
            title
            price
            quantity
          }
        }
      `,
      variables: { ids },
      isAuth: true,
    })
    return response.data.cartItems
  }

  async addCartItems(inputs: APIAddCartItemInput[]): Promise<APIEditCartItemResponse[]> {
    const response = await this.mutate<{ addCartItems: APIEditCartItemResponse[] }>({
      mutation: gql`
        mutation AddCartItems($inputs: [AddCartItemInput!]!) {
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
            }
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
          } as APIAddCartItemInput
        }),
      },
      isAuth: true,
    })
    return response.data!.addCartItems
  }

  async updateCartItems(inputs: APIUpdateCartItemInput[]): Promise<APIEditCartItemResponse[]> {
    const response = await this.mutate<{ updateCartItems: APIEditCartItemResponse[] }>({
      mutation: gql`
        mutation UpdateCartItems($inputs: [UpdateCartItemInput!]!) {
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
            }
          }
        }
      `,
      variables: {
        inputs: inputs.map(item => {
          return {
            id: item.id,
            quantity: item.quantity,
          } as APIUpdateCartItemInput
        }),
      },
      isAuth: true,
    })
    return response.data!.updateCartItems
  }

  async removeCartItems(ids: string[]): Promise<APIEditCartItemResponse[]> {
    const response = await this.mutate<{ removeCartItems: APIEditCartItemResponse[] }>({
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
            }
          }
        }
      `,
      variables: { ids },
      isAuth: true,
    })
    return response.data!.removeCartItems
  }

  async checkoutCart(): Promise<boolean> {
    const response = await this.mutate<{ checkoutCart: boolean }>({
      mutation: gql`
        mutation CheckoutCart {
          checkoutCart
        }
      `,
      isAuth: true,
    })
    return response.data!.checkoutCart
  }
}
