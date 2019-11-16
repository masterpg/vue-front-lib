import { APIStorageNode, BaseAPIContainer } from '../types'
import { BaseGQLClient } from './base'
import gql from 'graphql-tag'

export abstract class BaseGQLAPIContainer extends BaseGQLClient implements BaseAPIContainer {
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
    return response.data!.createUserStorageDirs
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
    return response.data!.removeUserStorageFiles
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
    return response.data!.removeUserStorageDir
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
}
