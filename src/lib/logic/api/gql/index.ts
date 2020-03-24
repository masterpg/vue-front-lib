import {
  APIResponseGetStorageResult,
  APIResponseStorageNode,
  AppConfigResponse,
  GetStorageOptionsInput,
  GetStorageResult,
  LibAPIContainer,
  StorageNode,
  StorageNodeShareSettingsInput,
} from '../types'
import { BaseGQLClient } from './base'
import dayjs from 'dayjs'
import gql from 'graphql-tag'

export abstract class BaseGQLAPIContainer extends BaseGQLClient implements LibAPIContainer {
  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  async getAppConfig(): Promise<AppConfigResponse> {
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

  async getCustomToken(): Promise<string> {
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

  //--------------------------------------------------
  //  User storage
  //--------------------------------------------------

  async getUserStorageNode(nodePath: string): Promise<StorageNode | undefined> {
    const response = await this.query<{ userStorageNode: APIResponseStorageNode | null }>({
      query: gql`
        query GetUserStorageNode($nodePath: String!) {
          userStorageNode(nodePath: $nodePath) {
            id
            nodeType
            name
            dir
            path
            contentType
            size
            share {
              isPublic
              uids
            }
            created
            updated
          }
        }
      `,
      variables: { nodePath },
      isAuth: true,
    })
    const apiNode = response.data.userStorageNode
    return apiNode ? this.toAPIStorageNode(apiNode) : undefined
  }

  async getUserStorageDirDescendants(options: GetStorageOptionsInput | null, dirPath?: string): Promise<GetStorageResult> {
    const response = await this.query<{ userStorageDirDescendants: APIResponseGetStorageResult }>({
      query: gql`
        query GetUserStorageDirDescendants($dirPath: String, $options: GetStorageOptionsInput) {
          userStorageDirDescendants(dirPath: $dirPath, options: $options) {
            list {
              id
              nodeType
              name
              dir
              path
              contentType
              size
              share {
                isPublic
                uids
              }
              created
              updated
            }
            nextPageToken
          }
        }
      `,
      variables: { dirPath, options },
      isAuth: true,
    })
    return {
      list: this.toAPIStorageNodes(response.data.userStorageDirDescendants.list),
      nextPageToken: response.data.userStorageDirDescendants.nextPageToken || undefined,
    }
  }

  async getUserStorageDescendants(options: GetStorageOptionsInput | null, dirPath?: string): Promise<GetStorageResult> {
    const response = await this.query<{ userStorageDescendants: APIResponseGetStorageResult }>({
      query: gql`
        query GetUserStorageDescendants($dirPath: String, $options: GetStorageOptionsInput) {
          userStorageDescendants(dirPath: $dirPath, options: $options) {
            list {
              id
              nodeType
              name
              dir
              path
              contentType
              size
              share {
                isPublic
                uids
              }
              created
              updated
            }
            nextPageToken
          }
        }
      `,
      variables: { dirPath, options },
      isAuth: true,
    })
    return {
      list: this.toAPIStorageNodes(response.data.userStorageDescendants.list),
      nextPageToken: response.data.userStorageDescendants.nextPageToken || undefined,
    }
  }

  async getUserStorageDirChildren(options: GetStorageOptionsInput | null, dirPath?: string): Promise<GetStorageResult> {
    const response = await this.query<{ userStorageDirChildren: APIResponseGetStorageResult }>({
      query: gql`
        query GetUserStorageDirChildren($dirPath: String, $options: GetStorageOptionsInput) {
          userStorageDirChildren(dirPath: $dirPath, options: $options) {
            list {
              id
              nodeType
              name
              dir
              path
              contentType
              size
              share {
                isPublic
                uids
              }
              created
              updated
            }
            nextPageToken
          }
        }
      `,
      variables: { dirPath, options },
      isAuth: true,
    })
    return {
      list: this.toAPIStorageNodes(response.data.userStorageDirChildren.list),
      nextPageToken: response.data.userStorageDirChildren.nextPageToken || undefined,
    }
  }

  async getUserStorageChildren(options: GetStorageOptionsInput | null, dirPath?: string): Promise<GetStorageResult> {
    const response = await this.query<{ userStorageChildren: APIResponseGetStorageResult }>({
      query: gql`
        query GetUserStorageChildren($dirPath: String, $options: GetStorageOptionsInput) {
          userStorageChildren(dirPath: $dirPath, options: $options) {
            list {
              id
              nodeType
              name
              dir
              path
              contentType
              size
              share {
                isPublic
                uids
              }
              created
              updated
            }
            nextPageToken
          }
        }
      `,
      variables: { dirPath, options },
      isAuth: true,
    })
    return {
      list: this.toAPIStorageNodes(response.data.userStorageChildren.list),
      nextPageToken: response.data.userStorageChildren.nextPageToken || undefined,
    }
  }

  async handleUploadedUserFiles(filePaths: string[]): Promise<void> {
    await this.mutate<{ handleUploadedUserFiles: boolean }>({
      mutation: gql`
        mutation HandleUploadedUserFiles($filePaths: [String!]!) {
          handleUploadedUserFiles(filePaths: $filePaths)
        }
      `,
      variables: { filePaths },
      isAuth: true,
    })
  }

  async createUserStorageDirs(dirPaths: string[]): Promise<StorageNode[]> {
    const response = await this.mutate<{ createUserStorageDirs: APIResponseStorageNode[] }>({
      mutation: gql`
        mutation CreateUserStorageDirs($dirPaths: [String!]!) {
          createUserStorageDirs(dirPaths: $dirPaths) {
            id
            nodeType
            name
            dir
            path
            contentType
            size
            share {
              isPublic
              uids
            }
            created
            updated
          }
        }
      `,
      variables: { dirPaths },
      isAuth: true,
    })
    return this.toAPIStorageNodes(response.data!.createUserStorageDirs)
  }

  async removeUserStorageDirs(dirPaths: string[]): Promise<void> {
    await this.mutate<{ removeUserStorageDirs: boolean }>({
      mutation: gql`
        mutation RemoveUserStorageDirs($dirPaths: [String!]!) {
          removeUserStorageDirs(dirPaths: $dirPaths)
        }
      `,
      variables: { dirPaths },
      isAuth: true,
    })
  }

  async removeUserStorageFiles(filePaths: string[]): Promise<void> {
    await this.mutate<{ removeUserStorageFiles: boolean }>({
      mutation: gql`
        mutation RemoveUserStorageFileNodes($filePaths: [String!]!) {
          removeUserStorageFiles(filePaths: $filePaths)
        }
      `,
      variables: { filePaths },
      isAuth: true,
    })
  }

  async moveUserStorageDir(fromDirPath: string, toDirPath: string): Promise<void> {
    await this.mutate<{ moveUserStorageDir: boolean }>({
      mutation: gql`
        mutation MoveUserStorageDir($fromDirPath: String!, $toDirPath: String!) {
          moveUserStorageDir(fromDirPath: $fromDirPath, toDirPath: $toDirPath)
        }
      `,
      variables: { fromDirPath, toDirPath },
      isAuth: true,
    })
  }

  async moveUserStorageFile(fromFilePath: string, toFilePath: string): Promise<void> {
    await this.mutate<{ moveUserStorageFile: APIResponseStorageNode }>({
      mutation: gql`
        mutation MoveUserStorageFile($fromFilePath: String!, $toFilePath: String!) {
          moveUserStorageFile(fromFilePath: $fromFilePath, toFilePath: $toFilePath)
        }
      `,
      variables: { fromFilePath, toFilePath },
      isAuth: true,
    })
  }

  async renameUserStorageDir(dirPath: string, newName: string): Promise<void> {
    await this.mutate<{ renameUserStorageDir: APIResponseStorageNode[] }>({
      mutation: gql`
        mutation RenameUserStorageDir($dirPath: String!, $newName: String!) {
          renameUserStorageDir(dirPath: $dirPath, newName: $newName)
        }
      `,
      variables: { dirPath, newName },
      isAuth: true,
    })
  }

  async renameUserStorageFile(filePath: string, newName: string): Promise<void> {
    await this.mutate<{ renameUserStorageFile: boolean }>({
      mutation: gql`
        mutation RenameUserStorageFile($filePath: String!, $newName: String!) {
          renameUserStorageFile(filePath: $filePath, newName: $newName)
        }
      `,
      variables: { filePath, newName },
      isAuth: true,
    })
  }

  async setUserStorageDirShareSettings(dirPath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode> {
    const response = await this.mutate<{ setUserStorageDirShareSettings: APIResponseStorageNode }>({
      mutation: gql`
        mutation SetUserStorageDirShareSettings($dirPath: String!, $settings: StorageNodeShareSettingsInput!) {
          setUserStorageDirShareSettings(dirPath: $dirPath, settings: $settings) {
            id
            nodeType
            name
            dir
            path
            contentType
            size
            share {
              isPublic
              uids
            }
            created
            updated
          }
        }
      `,
      variables: { dirPath, settings },
      isAuth: true,
    })
    return this.toAPIStorageNode(response.data!.setUserStorageDirShareSettings)
  }

  async setUserStorageFileShareSettings(filePath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode> {
    const response = await this.mutate<{ setUserStorageFileShareSettings: APIResponseStorageNode }>({
      mutation: gql`
        mutation SetUserStorageFileShareSettings($filePath: String!, $settings: StorageNodeShareSettingsInput!) {
          setUserStorageFileShareSettings(filePath: $filePath, settings: $settings) {
            id
            nodeType
            name
            dir
            path
            contentType
            size
            share {
              isPublic
              uids
            }
            created
            updated
          }
        }
      `,
      variables: { filePath, settings },
      isAuth: true,
    })
    return this.toAPIStorageNode(response.data!.setUserStorageFileShareSettings)
  }

  //--------------------------------------------------
  //  Application storage
  //--------------------------------------------------

  async getStorageNode(nodePath: string): Promise<StorageNode | undefined> {
    const response = await this.query<{ storageNode: APIResponseStorageNode | null }>({
      query: gql`
        query GetStorageNode($nodePath: String!) {
          storageNode(nodePath: $nodePath) {
            id
            nodeType
            name
            dir
            path
            contentType
            size
            share {
              isPublic
              uids
            }
            created
            updated
          }
        }
      `,
      variables: { nodePath },
      isAuth: true,
    })
    const apiNode = response.data.storageNode
    return apiNode ? this.toAPIStorageNode(apiNode) : undefined
  }

  async getStorageDirDescendants(options: GetStorageOptionsInput | null, dirPath?: string): Promise<GetStorageResult> {
    const response = await this.query<{ storageDirDescendants: APIResponseGetStorageResult }>({
      query: gql`
        query GetStorageDirDescendants($dirPath: String, $options: GetStorageOptionsInput) {
          storageDirDescendants(dirPath: $dirPath, options: $options) {
            list {
              id
              nodeType
              name
              dir
              path
              contentType
              size
              share {
                isPublic
                uids
              }
              created
              updated
            }
            nextPageToken
          }
        }
      `,
      variables: { dirPath, options },
      isAuth: true,
    })
    return {
      list: this.toAPIStorageNodes(response.data.storageDirDescendants.list),
      nextPageToken: response.data.storageDirDescendants.nextPageToken || undefined,
    }
  }

  async getStorageDescendants(options: GetStorageOptionsInput | null, dirPath?: string): Promise<GetStorageResult> {
    const response = await this.query<{ storageDescendants: APIResponseGetStorageResult }>({
      query: gql`
        query GetStorageDescendants($dirPath: String, $options: GetStorageOptionsInput) {
          storageDescendants(dirPath: $dirPath, options: $options) {
            list {
              id
              nodeType
              name
              dir
              path
              contentType
              size
              share {
                isPublic
                uids
              }
              created
              updated
            }
            nextPageToken
          }
        }
      `,
      variables: { dirPath, options },
      isAuth: true,
    })
    return {
      list: this.toAPIStorageNodes(response.data.storageDescendants.list),
      nextPageToken: response.data.storageDescendants.nextPageToken || undefined,
    }
  }

  async getStorageDirChildren(options: GetStorageOptionsInput | null, dirPath?: string): Promise<GetStorageResult> {
    const response = await this.query<{ storageDirChildren: APIResponseGetStorageResult }>({
      query: gql`
        query GetStorageDirChildren($dirPath: String, $options: GetStorageOptionsInput) {
          storageDirChildren(dirPath: $dirPath, options: $options) {
            list {
              id
              nodeType
              name
              dir
              path
              contentType
              size
              share {
                isPublic
                uids
              }
              created
              updated
            }
            nextPageToken
          }
        }
      `,
      variables: { dirPath, options },
      isAuth: true,
    })
    return {
      list: this.toAPIStorageNodes(response.data.storageDirChildren.list),
      nextPageToken: response.data.storageDirChildren.nextPageToken || undefined,
    }
  }

  async getStorageChildren(options: GetStorageOptionsInput | null, dirPath?: string): Promise<GetStorageResult> {
    const response = await this.query<{ storageChildren: APIResponseGetStorageResult }>({
      query: gql`
        query GetStorageChildren($dirPath: String, $options: GetStorageOptionsInput) {
          storageChildren(dirPath: $dirPath, options: $options) {
            list {
              id
              nodeType
              name
              dir
              path
              contentType
              size
              share {
                isPublic
                uids
              }
              created
              updated
            }
            nextPageToken
          }
        }
      `,
      variables: { dirPath, options },
      isAuth: true,
    })
    return {
      list: this.toAPIStorageNodes(response.data.storageChildren.list),
      nextPageToken: response.data.storageChildren.nextPageToken || undefined,
    }
  }

  async handleUploadedFiles(filePaths: string[]): Promise<void> {
    await this.mutate<{ handleUploadedFiles: boolean }>({
      mutation: gql`
        mutation HandleUploadedFiles($filePaths: [String!]!) {
          handleUploadedFiles(filePaths: $filePaths)
        }
      `,
      variables: { filePaths },
      isAuth: true,
    })
  }

  async createStorageDirs(dirPaths: string[]): Promise<StorageNode[]> {
    const response = await this.mutate<{ createStorageDirs: APIResponseStorageNode[] }>({
      mutation: gql`
        mutation CreateStorageDirs($dirPaths: [String!]!) {
          createStorageDirs(dirPaths: $dirPaths) {
            id
            nodeType
            name
            dir
            path
            contentType
            size
            share {
              isPublic
              uids
            }
            created
            updated
          }
        }
      `,
      variables: { dirPaths },
      isAuth: true,
    })
    return this.toAPIStorageNodes(response.data!.createStorageDirs)
  }

  async removeStorageDirs(dirPaths: string[]): Promise<void> {
    await this.mutate<{ removeStorageDirs: boolean }>({
      mutation: gql`
        mutation RemoveStorageDirs($dirPaths: [String!]!) {
          removeStorageDirs(dirPaths: $dirPaths)
        }
      `,
      variables: { dirPaths },
      isAuth: true,
    })
  }

  async removeStorageFiles(filePaths: string[]): Promise<void> {
    await this.mutate<{ removeStorageFiles: boolean }>({
      mutation: gql`
        mutation RemoveStorageFileNodes($filePaths: [String!]!) {
          removeStorageFiles(filePaths: $filePaths)
        }
      `,
      variables: { filePaths },
      isAuth: true,
    })
  }

  async moveStorageDir(fromDirPath: string, toDirPath: string): Promise<void> {
    await this.mutate<{ moveStorageDir: boolean }>({
      mutation: gql`
        mutation MoveStorageDir($fromDirPath: String!, $toDirPath: String!) {
          moveStorageDir(fromDirPath: $fromDirPath, toDirPath: $toDirPath)
        }
      `,
      variables: { fromDirPath, toDirPath },
      isAuth: true,
    })
  }

  async moveStorageFile(fromFilePath: string, toFilePath: string): Promise<void> {
    await this.mutate<{ moveStorageFile: boolean }>({
      mutation: gql`
        mutation MoveStorageFile($fromFilePath: String!, $toFilePath: String!) {
          moveStorageFile(fromFilePath: $fromFilePath, toFilePath: $toFilePath)
        }
      `,
      variables: { fromFilePath, toFilePath },
      isAuth: true,
    })
  }

  async renameStorageDir(dirPath: string, newName: string): Promise<void> {
    await this.mutate<{ renameStorageDir: boolean }>({
      mutation: gql`
        mutation RenameStorageDir($dirPath: String!, $newName: String!) {
          renameStorageDir(dirPath: $dirPath, newName: $newName)
        }
      `,
      variables: { dirPath, newName },
      isAuth: true,
    })
  }

  async renameStorageFile(filePath: string, newName: string): Promise<void> {
    await this.mutate<{ renameStorageFile: boolean }>({
      mutation: gql`
        mutation RenameStorageFile($filePath: String!, $newName: String!) {
          renameStorageFile(filePath: $filePath, newName: $newName)
        }
      `,
      variables: { filePath, newName },
      isAuth: true,
    })
  }

  async setStorageDirShareSettings(dirPath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode> {
    const response = await this.mutate<{ setStorageDirShareSettings: APIResponseStorageNode }>({
      mutation: gql`
        mutation SetStorageDirShareSettings($dirPath: String!, $settings: StorageNodeShareSettingsInput!) {
          setStorageDirShareSettings(dirPath: $dirPath, settings: $settings) {
            id
            nodeType
            name
            dir
            path
            contentType
            size
            share {
              isPublic
              uids
            }
            created
            updated
          }
        }
      `,
      variables: { dirPath, settings },
      isAuth: true,
    })
    return this.toAPIStorageNode(response.data!.setStorageDirShareSettings)
  }

  async setStorageFileShareSettings(filePath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode> {
    const response = await this.mutate<{ setStorageFileShareSettings: APIResponseStorageNode }>({
      mutation: gql`
        mutation SetStorageFileShareSettings($filePath: String!, $settings: StorageNodeShareSettingsInput!) {
          setStorageFileShareSettings(filePath: $filePath, settings: $settings) {
            id
            nodeType
            name
            dir
            path
            contentType
            size
            share {
              isPublic
              uids
            }
            created
            updated
          }
        }
      `,
      variables: { filePath, settings },
      isAuth: true,
    })
    return this.toAPIStorageNode(response.data!.setStorageFileShareSettings)
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

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  protected toAPIStorageNode(responseNode: APIResponseStorageNode): StorageNode {
    return Object.assign(responseNode, {
      created: dayjs(responseNode.created),
      updated: dayjs(responseNode.updated),
    })
  }

  protected toAPIStorageNodes(responseNodes: APIResponseStorageNode[]): StorageNode[] {
    return responseNodes.map(node => this.toAPIStorageNode(node))
  }
}
