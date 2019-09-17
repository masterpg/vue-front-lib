import { GQLAddCartItemInput, GQLCartItem, GQLEditCartItemResponse, GQLFacade, GQLProduct, GQLStorageNode, GQLUpdateCartItemInput } from '@/gql/types'
import { BaseGQLClient } from '@/gql/base'
import gql from 'graphql-tag'

export class GQLFacadeImpl extends BaseGQLClient implements GQLFacade {
  async customToken(): Promise<string> {
    const response = await this.query<{ customToken: string }>({
      query: gql`
        query GetCustomToken {
          customToken
        }
      `,
      isAuth: true,
    })
    return response.data.customToken
  }

  async userStorageBasePath(): Promise<string> {
    const response = await this.query<{ userStorageBasePath: string }>({
      query: gql`
        query GetUserStorageBasePath {
          userStorageBasePath
        }
      `,
      isAuth: true,
    })
    return response.data.userStorageBasePath
  }

  async userStorageNodes(dirPath?: string): Promise<GQLStorageNode[]> {
    const response = await this.query<{ userStorageNodes: GQLStorageNode[] }>({
      query: gql`
        query GetUserStorageNodes($dirPath: String) {
          userStorageNodes(dirPath: $dirPath) {
            nodeType
            name
            dir
            path
          }
        }
      `,
      variables: { dirPath },
      isAuth: true,
    })
    return response.data.userStorageNodes
  }

  async createUserStorageDirs(dirPaths: string[]): Promise<GQLStorageNode[]> {
    const response = await this.mutate<{ createUserStorageDirs: GQLStorageNode[] }>({
      mutation: gql`
        mutation CreateUserStorageDirs($dirPaths: [String!]!) {
          createUserStorageDirs(dirPaths: $dirPaths) {
            nodeType
            name
            dir
            path
          }
        }
      `,
      variables: { dirPaths },
      isAuth: true,
    })
    return response.data.createUserStorageDirs
  }

  async removeUserStorageNodes(nodePaths: string[]): Promise<GQLStorageNode[]> {
    const response = await this.mutate<{ removeUserStorageNodes: GQLStorageNode[] }>({
      mutation: gql`
        mutation RemoveStorageNodes($nodePaths: [String!]!) {
          removeUserStorageNodes(nodePaths: $nodePaths) {
            nodeType
            name
            dir
            path
          }
        }
      `,
      variables: { nodePaths },
      isAuth: true,
    })
    return response.data.removeUserStorageNodes
  }

  async getSignedUploadUrls(params: { filePath: string; contentType?: string }[]): Promise<string[]> {
    const response = await this.query<{ signedUploadUrls: string[] }>({
      query: gql`
        query GetSignedUploadUrls($params: [SignedUploadUrlParam!]!) {
          signedUploadUrls(params: $params)
        }
      `,
      variables: { params },
      isAuth: true,
    })
    return response.data.signedUploadUrls
  }

  async product(id: string): Promise<GQLProduct | undefined> {
    const products = await this.products([id])
    return products.length === 1 ? products[0] : undefined
  }

  async products(ids?: string[]): Promise<GQLProduct[]> {
    const response = await this.query<{ products: GQLProduct[] }>({
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

  async cartItem(id: string): Promise<GQLCartItem | undefined> {
    const items = await this.cartItems([id])
    return items.length === 1 ? items[0] : undefined
  }

  async cartItems(ids?: string[]): Promise<GQLCartItem[]> {
    const response = await this.query<{ cartItems: GQLCartItem[] }>({
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

  async addCartItems(items: GQLAddCartItemInput[]): Promise<GQLEditCartItemResponse[]> {
    const response = await this.mutate<{ addCartItems: GQLEditCartItemResponse[] }>({
      mutation: gql`
        mutation AddCartItems($items: [AddCartItemInput!]!) {
          addCartItems(items: $items) {
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
        items: items.map(item => {
          return {
            productId: item.productId,
            title: item.title,
            price: item.price,
            quantity: item.quantity,
          } as GQLAddCartItemInput
        }),
      },
      isAuth: true,
    })
    return response.data.addCartItems
  }

  async updateCartItems(items: GQLUpdateCartItemInput[]): Promise<GQLEditCartItemResponse[]> {
    const response = await this.mutate<{ updateCartItems: GQLEditCartItemResponse[] }>({
      mutation: gql`
        mutation UpdateCartItems($items: [UpdateCartItemInput!]!) {
          updateCartItems(items: $items) {
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
        items: items.map(item => {
          return {
            id: item.id,
            quantity: item.quantity,
          } as GQLUpdateCartItemInput
        }),
      },
      isAuth: true,
    })
    return response.data.updateCartItems
  }

  async removeCartItems(ids: string[]): Promise<GQLEditCartItemResponse[]> {
    const response = await this.mutate<{ removeCartItems: GQLEditCartItemResponse[] }>({
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
    return response.data.removeCartItems
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
    return response.data.checkoutCart
  }
}
