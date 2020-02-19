import { APIResponseStorageNode, AppConfigResponse, LibAPIContainer, StorageNode, StorageNodeShareSettingsInput } from '../types'
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

  async getUserStorageDirAndDescendants(dirPath?: string): Promise<StorageNode[]> {
    const response = await this.query<{ userStorageDirAndDescendants: APIResponseStorageNode[] }>({
      query: gql`
        query GetUserDirAndDescendants($dirPath: String) {
          userStorageDirAndDescendants(dirPath: $dirPath) {
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
      variables: { dirPath },
      isAuth: true,
    })
    return this.toAPIStorageNodes(response.data.userStorageDirAndDescendants)
  }

  async createUserStorageDirs(dirPaths: string[]): Promise<StorageNode[]> {
    const response = await this.mutate<{ createUserStorageDirs: APIResponseStorageNode[] }>({
      mutation: gql`
        mutation CreateUserStorageDirs($dirPaths: [String!]!) {
          createUserStorageDirs(dirPaths: $dirPaths) {
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

  async handleUploadedUserFiles(filePaths: string[]): Promise<StorageNode[]> {
    const response = await this.mutate<{ handleUploadedUserFiles: APIResponseStorageNode[] }>({
      mutation: gql`
        mutation HandleUploadedUserFiles($filePaths: [String!]!) {
          handleUploadedUserFiles(filePaths: $filePaths) {
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
      variables: { filePaths },
      isAuth: true,
    })
    return this.toAPIStorageNodes(response.data!.handleUploadedUserFiles)
  }

  async removeUserStorageDirs(dirPaths: string[]): Promise<StorageNode[]> {
    const response = await this.mutate<{ removeUserStorageDirs: APIResponseStorageNode[] }>({
      mutation: gql`
        mutation RemoveUserStorageDirs($dirPaths: [String!]!) {
          removeUserStorageDirs(dirPaths: $dirPaths) {
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
    return this.toAPIStorageNodes(response.data!.removeUserStorageDirs)
  }

  async removeUserStorageFiles(filePaths: string[]): Promise<StorageNode[]> {
    const response = await this.mutate<{ removeUserStorageFiles: APIResponseStorageNode[] }>({
      mutation: gql`
        mutation RemoveUserStorageFileNodes($filePaths: [String!]!) {
          removeUserStorageFiles(filePaths: $filePaths) {
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
      variables: { filePaths },
      isAuth: true,
    })
    return this.toAPIStorageNodes(response.data!.removeUserStorageFiles)
  }

  async moveUserStorageDir(fromDirPath: string, toDirPath: string): Promise<StorageNode[]> {
    const response = await this.mutate<{ moveUserStorageDir: APIResponseStorageNode[] }>({
      mutation: gql`
        mutation MoveUserStorageDir($fromDirPath: String!, $toDirPath: String!) {
          moveUserStorageDir(fromDirPath: $fromDirPath, toDirPath: $toDirPath) {
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
      variables: { fromDirPath, toDirPath },
      isAuth: true,
    })
    return this.toAPIStorageNodes(response.data!.moveUserStorageDir)
  }

  async moveUserStorageFile(fromFilePath: string, toFilePath: string): Promise<StorageNode> {
    const response = await this.mutate<{ moveUserStorageFile: APIResponseStorageNode }>({
      mutation: gql`
        mutation MoveUserStorageFile($fromFilePath: String!, $toFilePath: String!) {
          moveUserStorageFile(fromFilePath: $fromFilePath, toFilePath: $toFilePath) {
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
      variables: { fromFilePath, toFilePath },
      isAuth: true,
    })
    return this.toAPIStorageNode(response.data!.moveUserStorageFile)
  }

  async renameUserStorageDir(dirPath: string, newName: string): Promise<StorageNode[]> {
    const response = await this.mutate<{ renameUserStorageDir: APIResponseStorageNode[] }>({
      mutation: gql`
        mutation RenameUserStorageDir($dirPath: String!, $newName: String!) {
          renameUserStorageDir(dirPath: $dirPath, newName: $newName) {
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
      variables: { dirPath, newName },
      isAuth: true,
    })
    return this.toAPIStorageNodes(response.data!.renameUserStorageDir)
  }

  async renameUserStorageFile(filePath: string, newName: string): Promise<StorageNode> {
    const response = await this.mutate<{ renameUserStorageFile: APIResponseStorageNode }>({
      mutation: gql`
        mutation RenameUserStorageFile($filePath: String!, $newName: String!) {
          renameUserStorageFile(filePath: $filePath, newName: $newName) {
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
      variables: { filePath, newName },
      isAuth: true,
    })
    return this.toAPIStorageNode(response.data!.renameUserStorageFile)
  }

  async setUserStorageDirShareSettings(dirPath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode[]> {
    const response = await this.mutate<{ setUserStorageDirShareSettings: APIResponseStorageNode[] }>({
      mutation: gql`
        mutation SetUserStorageDirShareSettings($dirPath: String!, $settings: StorageNodeShareSettingsInput!) {
          setUserStorageDirShareSettings(dirPath: $dirPath, settings: $settings) {
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
    return this.toAPIStorageNodes(response.data!.setUserStorageDirShareSettings)
  }

  async setUserStorageFileShareSettings(filePath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode> {
    const response = await this.mutate<{ setUserStorageFileShareSettings: APIResponseStorageNode }>({
      mutation: gql`
        mutation SetUserStorageFileShareSettings($filePath: String!, $settings: StorageNodeShareSettingsInput!) {
          setUserStorageFileShareSettings(filePath: $filePath, settings: $settings) {
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

  async getStorageDirAndDescendants(dirPath?: string): Promise<StorageNode[]> {
    const response = await this.query<{ storageDirAndDescendants: APIResponseStorageNode[] }>({
      query: gql`
        query GetStorageNodes($dirPath: String) {
          storageDirAndDescendants(dirPath: $dirPath) {
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
      variables: { dirPath },
      isAuth: true,
    })
    return this.toAPIStorageNodes(response.data.storageDirAndDescendants)
  }

  async createStorageDirs(dirPaths: string[]): Promise<StorageNode[]> {
    const response = await this.mutate<{ createStorageDirs: APIResponseStorageNode[] }>({
      mutation: gql`
        mutation CreateStorageDirs($dirPaths: [String!]!) {
          createStorageDirs(dirPaths: $dirPaths) {
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

  async handleUploadedFiles(filePaths: string[]): Promise<StorageNode[]> {
    const response = await this.mutate<{ handleUploadedFiles: APIResponseStorageNode[] }>({
      mutation: gql`
        mutation HandleUploadedFiles($filePaths: [String!]!) {
          handleUploadedFiles(filePaths: $filePaths) {
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
      variables: { filePaths },
      isAuth: true,
    })
    return this.toAPIStorageNodes(response.data!.handleUploadedFiles)
  }

  async removeStorageDirs(dirPaths: string[]): Promise<StorageNode[]> {
    const response = await this.mutate<{ removeStorageDirs: APIResponseStorageNode[] }>({
      mutation: gql`
        mutation RemoveStorageDirs($dirPaths: [String!]!) {
          removeStorageDirs(dirPaths: $dirPaths) {
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
    return this.toAPIStorageNodes(response.data!.removeStorageDirs)
  }

  async removeStorageFiles(filePaths: string[]): Promise<StorageNode[]> {
    const response = await this.mutate<{ removeStorageFiles: APIResponseStorageNode[] }>({
      mutation: gql`
        mutation RemoveStorageFileNodes($filePaths: [String!]!) {
          removeStorageFiles(filePaths: $filePaths) {
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
      variables: { filePaths },
      isAuth: true,
    })
    return this.toAPIStorageNodes(response.data!.removeStorageFiles)
  }

  async moveStorageDir(fromDirPath: string, toDirPath: string): Promise<StorageNode[]> {
    const response = await this.mutate<{ moveStorageDir: APIResponseStorageNode[] }>({
      mutation: gql`
        mutation MoveStorageDir($fromDirPath: String!, $toDirPath: String!) {
          moveStorageDir(fromDirPath: $fromDirPath, toDirPath: $toDirPath) {
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
      variables: { fromDirPath, toDirPath },
      isAuth: true,
    })
    return this.toAPIStorageNodes(response.data!.moveStorageDir)
  }

  async moveStorageFile(fromFilePath: string, toFilePath: string): Promise<StorageNode> {
    const response = await this.mutate<{ moveStorageFile: APIResponseStorageNode }>({
      mutation: gql`
        mutation MoveStorageFile($fromFilePath: String!, $toFilePath: String!) {
          moveStorageFile(fromFilePath: $fromFilePath, toFilePath: $toFilePath) {
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
      variables: { fromFilePath, toFilePath },
      isAuth: true,
    })
    return this.toAPIStorageNode(response.data!.moveStorageFile)
  }

  async renameStorageDir(dirPath: string, newName: string): Promise<StorageNode[]> {
    const response = await this.mutate<{ renameStorageDir: APIResponseStorageNode[] }>({
      mutation: gql`
        mutation RenameStorageDir($dirPath: String!, $newName: String!) {
          renameStorageDir(dirPath: $dirPath, newName: $newName) {
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
      variables: { dirPath, newName },
      isAuth: true,
    })
    return this.toAPIStorageNodes(response.data!.renameStorageDir)
  }

  async renameStorageFile(filePath: string, newName: string): Promise<StorageNode> {
    const response = await this.mutate<{ renameStorageFile: APIResponseStorageNode }>({
      mutation: gql`
        mutation RenameStorageFile($filePath: String!, $newName: String!) {
          renameStorageFile(filePath: $filePath, newName: $newName) {
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
      variables: { filePath, newName },
      isAuth: true,
    })
    return this.toAPIStorageNode(response.data!.renameStorageFile)
  }

  async setStorageDirShareSettings(dirPath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode[]> {
    const response = await this.mutate<{ setStorageDirShareSettings: APIResponseStorageNode[] }>({
      mutation: gql`
        mutation SetStorageDirShareSettings($dirPath: String!, $settings: StorageNodeShareSettingsInput!) {
          setStorageDirShareSettings(dirPath: $dirPath, settings: $settings) {
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
    return this.toAPIStorageNodes(response.data!.setStorageDirShareSettings)
  }

  async setStorageFileShareSettings(filePath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode> {
    const response = await this.mutate<{ setStorageFileShareSettings: APIResponseStorageNode }>({
      mutation: gql`
        mutation SetStorageFileShareSettings($filePath: String!, $settings: StorageNodeShareSettingsInput!) {
          setStorageFileShareSettings(filePath: $filePath, settings: $settings) {
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
