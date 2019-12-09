import { APIStorageNode, AppConfigResponse, LibAPIContainer } from '../types'
import { BaseGQLClient } from './base'
import gql from 'graphql-tag'

export abstract class BaseGQLAPIContainer extends BaseGQLClient implements LibAPIContainer {
  async appConfig(): Promise<AppConfigResponse> {
    const response = await this.query<{ appConfig: AppConfigResponse }>({
      query: gql`
        query GetAppConfig {
          appConfig {
            usersDir
          }
        }
      `,
    })
    return response.data.appConfig
  }

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

  async removeUserStorageDirs(dirPaths: string[]): Promise<APIStorageNode[]> {
    const response = await this.mutate<{ removeUserStorageDirs: APIStorageNode[] }>({
      mutation: gql`
        mutation RemoveUserStorageDirs($dirPaths: [String!]!) {
          removeUserStorageDirs(dirPaths: $dirPaths) {
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
    return response.data!.removeUserStorageDirs
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

  async moveUserStorageDir(fromDirPath: string, toDirPath: string): Promise<APIStorageNode[]> {
    const response = await this.mutate<{ moveUserStorageDir: APIStorageNode[] }>({
      mutation: gql`
        mutation MoveUserStorageDir($fromDirPath: String!, $toDirPath: String!) {
          moveUserStorageDir(fromDirPath: $fromDirPath, toDirPath: $toDirPath) {
            nodeType
            name
            dir
            path
          }
        }
      `,
      variables: { fromDirPath, toDirPath },
      isAuth: true,
    })
    return response.data!.moveUserStorageDir
  }

  async moveUserStorageFile(fromFilePath: string, toFilePath: string): Promise<APIStorageNode> {
    const response = await this.mutate<{ moveUserStorageFile: APIStorageNode }>({
      mutation: gql`
        mutation MoveUserStorageFile($fromFilePath: String!, $toFilePath: String!) {
          moveUserStorageFile(fromFilePath: $fromFilePath, toFilePath: $toFilePath) {
            nodeType
            name
            dir
            path
          }
        }
      `,
      variables: { fromFilePath, toFilePath },
      isAuth: true,
    })
    return response.data!.moveUserStorageFile
  }

  async renameUserStorageDir(dirPath: string, newName: string): Promise<APIStorageNode[]> {
    const response = await this.mutate<{ renameUserStorageDir: APIStorageNode[] }>({
      mutation: gql`
        mutation RenameUserStorageDir($dirPath: String!, $newName: String!) {
          renameUserStorageDir(dirPath: $dirPath, newName: $newName) {
            nodeType
            name
            dir
            path
          }
        }
      `,
      variables: { dirPath, newName },
      isAuth: true,
    })
    return response.data!.renameUserStorageDir
  }

  async renameUserStorageFile(filePath: string, newName: string): Promise<APIStorageNode> {
    const response = await this.mutate<{ renameUserStorageFile: APIStorageNode }>({
      mutation: gql`
        mutation RenameUserStorageFile($filePath: String!, $newName: String!) {
          renameUserStorageFile(filePath: $filePath, newName: $newName) {
            nodeType
            name
            dir
            path
          }
        }
      `,
      variables: { filePath, newName },
      isAuth: true,
    })
    return response.data!.renameUserStorageFile
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
