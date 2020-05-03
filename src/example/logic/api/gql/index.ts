import { APICartItem, APICartItemAddInput, APICartItemEditResponse, APICartItemUpdateInput, APIProduct, AppAPIContainer } from '../base'
import { BaseGQLAPIContainer } from '@/lib'
import gql from 'graphql-tag'

//========================================================================
//
//  Implementation
//
//========================================================================

class AppGQLAPIContainer extends BaseGQLAPIContainer implements AppAPIContainer {
  async getProduct(id: string): Promise<APIProduct | undefined> {
    const products = await this.getProducts([id])
    return products.length === 1 ? products[0] : undefined
  }

  async getProducts(ids?: string[]): Promise<APIProduct[]> {
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

  async getCartItem(id: string): Promise<APICartItem | undefined> {
    const items = await this.getCartItems([id])
    return items.length === 1 ? items[0] : undefined
  }

  async getCartItems(ids?: string[]): Promise<APICartItem[]> {
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

  async addCartItems(inputs: APICartItemAddInput[]): Promise<APICartItemEditResponse[]> {
    const response = await this.mutate<{ addCartItems: APICartItemEditResponse[] }>({
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
          } as APICartItemAddInput
        }),
      },
      isAuth: true,
    })
    return response.data!.addCartItems
  }

  async updateCartItems(inputs: APICartItemUpdateInput[]): Promise<APICartItemEditResponse[]> {
    const response = await this.mutate<{ updateCartItems: APICartItemEditResponse[] }>({
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
            }
          }
        }
      `,
      variables: {
        inputs: inputs.map(item => {
          return {
            id: item.id,
            quantity: item.quantity,
          } as APICartItemUpdateInput
        }),
      },
      isAuth: true,
    })
    return response.data!.updateCartItems
  }

  async removeCartItems(ids: string[]): Promise<APICartItemEditResponse[]> {
    const response = await this.mutate<{ removeCartItems: APICartItemEditResponse[] }>({
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

//========================================================================
//
//  Exports
//
//========================================================================

export { AppGQLAPIContainer }
