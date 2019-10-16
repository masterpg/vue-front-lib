import { APIAddCartItemInput, APICartItem, APIEditCartItemResponse, APIProduct, APIStorageNode, APIUpdateCartItemInput, AppAPI } from '@/api'
import { BaseGQLClient } from '@/api/gql/base'
import gql from 'graphql-tag'

export class GQLAppAPIImpl extends BaseGQLClient implements AppAPI {
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

  async userStorageDirNodes(dirPath?: string): Promise<APIStorageNode[]> {
    const response = await this.query<{ userStorageDirNodes: APIStorageNode[] }>({
      query: gql`
        query GetUserStorageNodes($dirPath: String) {
          userStorageDirNodes(dirPath: $dirPath) {
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
    return response.data.userStorageDirNodes
  }

  async createUserStorageDirs(dirPaths: string[]): Promise<APIStorageNode[]> {
    const response = await this.mutate<{ createUserStorageDirs: APIStorageNode[] }>({
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

  async removeUserStorageFiles(filePaths: string[]): Promise<APIStorageNode[]> {
    const response = await this.mutate<{ removeUserStorageFiles: APIStorageNode[] }>({
      mutation: gql`
        mutation RemoveUserStorageFileNodes($filePaths: [String!]!) {
          removeUserStorageFiles(filePaths: $filePaths) {
            nodeType
            name
            dir
            path
          }
        }
      `,
      variables: { filePaths },
      isAuth: true,
    })
    return response.data.removeUserStorageFiles
  }

  async removeUserStorageDir(dirPath: string): Promise<APIStorageNode[]> {
    const response = await this.mutate<{ removeUserStorageDir: APIStorageNode[] }>({
      mutation: gql`
        mutation RemoveUserStorageDirNodes($dirPath: String!) {
          removeUserStorageDir(dirPath: $dirPath) {
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
    return response.data.removeUserStorageDir
  }

  async getSignedUploadUrls(inputs: { filePath: string; contentType?: string }[]): Promise<string[]> {
    const response = await this.query<{ signedUploadUrls: string[] }>({
      query: gql`
        query GetSignedUploadUrls($inputs: [SignedUploadUrlInput!]!) {
          signedUploadUrls(inputs: $inputs)
        }
      `,
      variables: { inputs },
      isAuth: true,
    })
    return response.data.signedUploadUrls
  }

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
    return response.data.addCartItems
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
    return response.data.updateCartItems
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
