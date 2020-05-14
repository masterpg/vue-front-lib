import { APITimestampEntity, BaseGQLAPIContainer, OmitEntityTimestamp } from '@/lib'
import { AppAPIContainer, CartItem, CartItemAddInput, CartItemEditResponse, CartItemUpdateInput, Product } from '../base'
import gql from 'graphql-tag'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface APIProduct extends OmitEntityTimestamp<Product>, APITimestampEntity {}

interface APICartItem extends OmitEntityTimestamp<CartItem>, APITimestampEntity {}

//========================================================================
//
//  Implementation
//
//========================================================================

class AppGQLAPIContainer extends BaseGQLAPIContainer implements AppAPIContainer {
  async getProduct(id: string): Promise<Product | undefined> {
    const products = await this.getProducts([id])
    return products.length === 1 ? products[0] : undefined
  }

  async getProducts(ids?: string[]): Promise<Product[]> {
    const response = await this.query<{ products: APIProduct[] }>({
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

    return this.toTimestampEntities(response.data.products)
  }

  async getCartItem(id: string): Promise<CartItem | undefined> {
    const items = await this.getCartItems([id])
    return items.length === 1 ? items[0] : undefined
  }

  async getCartItems(ids?: string[]): Promise<CartItem[]> {
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
            createdAt
            updatedAt
          }
        }
      `,
      variables: { ids },
      isAuth: true,
    })
    return this.toTimestampEntities(response.data.cartItems)
  }

  async addCartItems(inputs: CartItemAddInput[]): Promise<CartItemEditResponse[]> {
    const response = await this.mutate<{ addCartItems: CartItemEditResponse[] }>({
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
          } as CartItemAddInput
        }),
      },
      isAuth: true,
    })
    return response.data!.addCartItems
  }

  async updateCartItems(inputs: CartItemUpdateInput[]): Promise<CartItemEditResponse[]> {
    const response = await this.mutate<{ updateCartItems: CartItemEditResponse[] }>({
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
          } as CartItemUpdateInput
        }),
      },
      isAuth: true,
    })
    return response.data!.updateCartItems
  }

  async removeCartItems(ids: string[]): Promise<CartItemEditResponse[]> {
    const response = await this.mutate<{ removeCartItems: CartItemEditResponse[] }>({
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

export { AppGQLAPIContainer, APIProduct, APICartItem }
