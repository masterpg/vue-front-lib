import {
  APIStorageNode,
  AppConfigResponse,
  AuthDataResult,
  LibAPIContainer,
  StorageNodeShareSettingsInput,
  StoragePaginationOptionsInput,
  StoragePaginationResult,
  ToRawTimestampEntity,
  toTimestampEntities as _toTimestampEntities,
  toTimestampEntity as _toTimestampEntity,
} from '../base'
import { PublicProfile, UserInfo, UserInfoInput } from '../../types'
import { BaseGQLClient } from './base'
import gql from 'graphql-tag'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface RawAuthDataResult extends Omit<AuthDataResult, 'user'> {
  user: RawUser
}

interface RawUser extends ToRawTimestampEntity<Omit<UserInfo, 'publicProfile'>> {
  publicProfile: RawPublicProfile
}

interface RawPublicProfile extends ToRawTimestampEntity<PublicProfile> {}

interface RawStorageNode extends ToRawTimestampEntity<APIStorageNode> {}

interface RawStoragePaginationResult {
  list: RawStorageNode[]
  nextPageToken?: string
}

//========================================================================
//
//  Implementation
//
//========================================================================

abstract class BaseGQLAPIContainer extends BaseGQLClient implements LibAPIContainer {
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
            siteDir
          }
        }
      `,
    })
    return response.data.appConfig
  }

  //--------------------------------------------------
  //  User
  //--------------------------------------------------

  async getAuthData(): Promise<AuthDataResult> {
    const response = await this.query<{ authData: RawAuthDataResult }>({
      query: gql`
        query AuthData {
          authData {
            status
            token
            user {
              id
              fullName
              email
              emailVerified
              isAppAdmin
              createdAt
              updatedAt
              publicProfile {
                id
                displayName
                photoURL
                createdAt
                updatedAt
              }
            }
          }
        }
      `,
      isAuth: true,
    })

    const { user, ...others } = response.data.authData
    if (!user) {
      return { ...others, user: undefined }
    }

    return {
      ...others,
      user: {
        ...this.toTimestampEntity(user),
        publicProfile: this.toTimestampEntity(user.publicProfile),
      },
    }
  }

  async setOwnUserInfo(input: UserInfoInput): Promise<UserInfo> {
    const response = await this.mutate<{ setOwnUserInfo: RawUser }>({
      mutation: gql`
        mutation SetOwnUserInfo($input: UserInfoInput!) {
          setOwnUserInfo(input: $input) {
            id
            fullName
            email
            emailVerified
            isAppAdmin
            createdAt
            updatedAt
            publicProfile {
              id
              displayName
              photoURL
              createdAt
              updatedAt
            }
          }
        }
      `,
      variables: { input },
      isAuth: true,
    })

    const user = response.data!.setOwnUserInfo
    return {
      ...this.toTimestampEntity(user),
      publicProfile: this.toTimestampEntity(user.publicProfile),
    }
  }

  async deleteOwnUser(): Promise<boolean> {
    const response = await this.mutate<{ deleteOwnUser: boolean }>({
      mutation: gql`
        mutation DeleteOwnUser {
          deleteOwnUser
        }
      `,
      isAuth: true,
    })
    return response.data!.deleteOwnUser
  }

  //--------------------------------------------------
  //  Storage
  //--------------------------------------------------

  async getStorageNode(nodePath: string): Promise<APIStorageNode | undefined> {
    const response = await this.query<{ storageNode: RawStorageNode | null }>({
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
              readUIds
              writeUIds
            }
            version
            createdAt
            updatedAt
          }
        }
      `,
      variables: { nodePath },
      isAuth: true,
    })
    const apiNode = response.data.storageNode
    return apiNode ? this.toTimestampEntity(apiNode) : undefined
  }

  async getStorageDirDescendants(options: StoragePaginationOptionsInput | null, dirPath?: string): Promise<StoragePaginationResult> {
    const response = await this.query<{ storageDirDescendants: RawStoragePaginationResult }>({
      query: gql`
        query GetStorageDirDescendants($dirPath: String, $options: StoragePaginationOptionsInput) {
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
                readUIds
                writeUIds
              }
              version
              createdAt
              updatedAt
            }
            nextPageToken
          }
        }
      `,
      variables: { dirPath, options },
      isAuth: true,
    })
    return {
      list: this.toTimestampEntities(response.data.storageDirDescendants.list),
      nextPageToken: response.data.storageDirDescendants.nextPageToken || undefined,
    }
  }

  async getStorageDescendants(options: StoragePaginationOptionsInput | null, dirPath?: string): Promise<StoragePaginationResult> {
    const response = await this.query<{ storageDescendants: RawStoragePaginationResult }>({
      query: gql`
        query GetStorageDescendants($dirPath: String, $options: StoragePaginationOptionsInput) {
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
                readUIds
                writeUIds
              }
              version
              createdAt
              updatedAt
            }
            nextPageToken
          }
        }
      `,
      variables: { dirPath, options },
      isAuth: true,
    })
    return {
      list: this.toTimestampEntities(response.data.storageDescendants.list),
      nextPageToken: response.data.storageDescendants.nextPageToken || undefined,
    }
  }

  async getStorageDirChildren(options: StoragePaginationOptionsInput | null, dirPath?: string): Promise<StoragePaginationResult> {
    const response = await this.query<{ storageDirChildren: RawStoragePaginationResult }>({
      query: gql`
        query GetStorageDirChildren($dirPath: String, $options: StoragePaginationOptionsInput) {
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
                readUIds
                writeUIds
              }
              version
              createdAt
              updatedAt
            }
            nextPageToken
          }
        }
      `,
      variables: { dirPath, options },
      isAuth: true,
    })
    return {
      list: this.toTimestampEntities(response.data.storageDirChildren.list),
      nextPageToken: response.data.storageDirChildren.nextPageToken || undefined,
    }
  }

  async getStorageChildren(options: StoragePaginationOptionsInput | null, dirPath?: string): Promise<StoragePaginationResult> {
    const response = await this.query<{ storageChildren: RawStoragePaginationResult }>({
      query: gql`
        query GetStorageChildren($dirPath: String, $options: StoragePaginationOptionsInput) {
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
                readUIds
                writeUIds
              }
              version
              createdAt
              updatedAt
            }
            nextPageToken
          }
        }
      `,
      variables: { dirPath, options },
      isAuth: true,
    })
    return {
      list: this.toTimestampEntities(response.data.storageChildren.list),
      nextPageToken: response.data.storageChildren.nextPageToken || undefined,
    }
  }

  async getStorageHierarchicalNodes(nodePath: string): Promise<APIStorageNode[]> {
    const response = await this.query<{ storageHierarchicalNodes: RawStorageNode[] }>({
      query: gql`
        query GetStorageHierarchicalNodes($nodePath: String!) {
          storageHierarchicalNodes(nodePath: $nodePath) {
            id
            nodeType
            name
            dir
            path
            contentType
            size
            share {
              isPublic
              readUIds
              writeUIds
            }
            version
            createdAt
            updatedAt
          }
        }
      `,
      variables: { nodePath },
      isAuth: true,
    })
    return this.toTimestampEntities(response.data!.storageHierarchicalNodes)
  }

  async getStorageAncestorDirs(nodePath: string): Promise<APIStorageNode[]> {
    const response = await this.query<{ storageAncestorDirs: RawStorageNode[] }>({
      query: gql`
        query GetStorageAncestorDirs($nodePath: String!) {
          storageAncestorDirs(nodePath: $nodePath) {
            id
            nodeType
            name
            dir
            path
            contentType
            size
            share {
              isPublic
              readUIds
              writeUIds
            }
            version
            createdAt
            updatedAt
          }
        }
      `,
      variables: { nodePath },
      isAuth: true,
    })
    return this.toTimestampEntities(response.data!.storageAncestorDirs)
  }

  async createStorageDirs(dirPaths: string[]): Promise<APIStorageNode[]> {
    const response = await this.mutate<{ createStorageDirs: RawStorageNode[] }>({
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
              readUIds
              writeUIds
            }
            version
            createdAt
            updatedAt
          }
        }
      `,
      variables: { dirPaths },
      isAuth: true,
    })
    return this.toTimestampEntities(response.data!.createStorageDirs)
  }

  async removeStorageDir(options: StoragePaginationOptionsInput | null, dirPath: string): Promise<StoragePaginationResult> {
    const response = await this.mutate<{ removeStorageDir: RawStoragePaginationResult }>({
      mutation: gql`
        mutation RemoveStorageDir($dirPath: String!, $options: StoragePaginationOptionsInput) {
          removeStorageDir(dirPath: $dirPath, options: $options) {
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
                readUIds
                writeUIds
              }
              version
              createdAt
              updatedAt
            }
            nextPageToken
          }
        }
      `,
      variables: { dirPath, options },
      isAuth: true,
    })
    return {
      list: this.toTimestampEntities(response.data!.removeStorageDir.list),
      nextPageToken: response.data!.removeStorageDir.nextPageToken || undefined,
    }
  }

  async removeStorageFile(filePath: string): Promise<APIStorageNode | undefined> {
    const response = await this.mutate<{ removeStorageFile: RawStorageNode | null }>({
      mutation: gql`
        mutation RemoveStorageFile($filePath: String!) {
          removeStorageFile(filePath: $filePath) {
            id
            nodeType
            name
            dir
            path
            contentType
            size
            share {
              isPublic
              readUIds
              writeUIds
            }
            version
            createdAt
            updatedAt
          }
        }
      `,
      variables: { filePath },
      isAuth: true,
    })
    const apiNode = response.data!.removeStorageFile
    return apiNode ? this.toTimestampEntity(apiNode) : undefined
  }

  async moveStorageDir(options: StoragePaginationOptionsInput | null, fromDirPath: string, toDirPath: string): Promise<StoragePaginationResult> {
    const response = await this.mutate<{ moveStorageDir: RawStoragePaginationResult }>({
      mutation: gql`
        mutation MoveStorageDir($fromDirPath: String!, $toDirPath: String!, $options: StoragePaginationOptionsInput) {
          moveStorageDir(fromDirPath: $fromDirPath, toDirPath: $toDirPath, options: $options) {
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
                readUIds
                writeUIds
              }
              version
              createdAt
              updatedAt
            }
            nextPageToken
          }
        }
      `,
      variables: { fromDirPath, toDirPath, options },
      isAuth: true,
    })
    return {
      list: this.toTimestampEntities(response.data!.moveStorageDir.list),
      nextPageToken: response.data!.moveStorageDir.nextPageToken || undefined,
    }
  }

  async moveStorageFile(fromFilePath: string, toFilePath: string): Promise<APIStorageNode> {
    const response = await this.mutate<{ moveStorageFile: RawStorageNode }>({
      mutation: gql`
        mutation MoveStorageFile($fromFilePath: String!, $toFilePath: String!) {
          moveStorageFile(fromFilePath: $fromFilePath, toFilePath: $toFilePath) {
            id
            nodeType
            name
            dir
            path
            contentType
            size
            share {
              isPublic
              readUIds
              writeUIds
            }
            version
            createdAt
            updatedAt
          }
        }
      `,
      variables: { fromFilePath, toFilePath },
      isAuth: true,
    })
    return this.toTimestampEntity(response.data!.moveStorageFile)
  }

  async renameStorageDir(options: StoragePaginationOptionsInput | null, dirPath: string, newName: string): Promise<StoragePaginationResult> {
    const response = await this.mutate<{ renameStorageDir: RawStoragePaginationResult }>({
      mutation: gql`
        mutation RenameStorageDir($dirPath: String!, $newName: String!, $options: StoragePaginationOptionsInput) {
          renameStorageDir(dirPath: $dirPath, newName: $newName, options: $options) {
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
                readUIds
                writeUIds
              }
              version
              createdAt
              updatedAt
            }
            nextPageToken
          }
        }
      `,
      variables: { dirPath, newName, options },
      isAuth: true,
    })
    return {
      list: this.toTimestampEntities(response.data!.renameStorageDir.list),
      nextPageToken: response.data!.renameStorageDir.nextPageToken || undefined,
    }
  }

  async renameStorageFile(filePath: string, newName: string): Promise<APIStorageNode> {
    const response = await this.mutate<{ renameStorageFile: RawStorageNode }>({
      mutation: gql`
        mutation RenameStorageFile($filePath: String!, $newName: String!) {
          renameStorageFile(filePath: $filePath, newName: $newName) {
            id
            nodeType
            name
            dir
            path
            contentType
            size
            share {
              isPublic
              readUIds
              writeUIds
            }
            version
            createdAt
            updatedAt
          }
        }
      `,
      variables: { filePath, newName },
      isAuth: true,
    })
    return this.toTimestampEntity(response.data!.renameStorageFile)
  }

  async setStorageDirShareSettings(dirPath: string, settings: StorageNodeShareSettingsInput): Promise<APIStorageNode> {
    const response = await this.mutate<{ setStorageDirShareSettings: RawStorageNode }>({
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
              readUIds
              writeUIds
            }
            version
            createdAt
            updatedAt
          }
        }
      `,
      variables: { dirPath, settings },
      isAuth: true,
    })
    return this.toTimestampEntity(response.data!.setStorageDirShareSettings)
  }

  async handleUploadedFile(filePath: string): Promise<APIStorageNode> {
    const response = await this.mutate<{ handleUploadedFile: RawStorageNode }>({
      mutation: gql`
        mutation HandleUploadedFile($filePath: String!) {
          handleUploadedFile(filePath: $filePath) {
            id
            nodeType
            name
            dir
            path
            contentType
            size
            share {
              isPublic
              readUIds
              writeUIds
            }
            version
            createdAt
            updatedAt
          }
        }
      `,
      variables: { filePath },
      isAuth: true,
    })
    return this.toTimestampEntity(response.data!.handleUploadedFile)
  }

  async setStorageFileShareSettings(filePath: string, settings: StorageNodeShareSettingsInput): Promise<APIStorageNode> {
    const response = await this.mutate<{ setStorageFileShareSettings: RawStorageNode }>({
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
              readUIds
              writeUIds
            }
            version
            createdAt
            updatedAt
          }
        }
      `,
      variables: { filePath, settings },
      isAuth: true,
    })
    return this.toTimestampEntity(response.data!.setStorageFileShareSettings)
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

  //--------------------------------------------------
  //  Helpers
  //--------------------------------------------------

  // eslint-disable-next-line space-before-function-paren
  async callStoragePaginationAPI<FUNC extends (...args: any[]) => Promise<StoragePaginationResult>>(
    func: FUNC,
    ...params: Parameters<FUNC>
  ): Promise<APIStorageNode[]> {
    const result: APIStorageNode[] = []

    // ノード検索APIの検索オプションを取得
    // ※ノード検索APIの第一引数は検索オプションという前提
    const options: StoragePaginationOptionsInput = Object.assign(
      {
        maxChunk: undefined,
        pageToken: undefined,
      },
      params[0]
    )
    params[0] = options

    // ノード検索APIの実行
    // ※ページングがなくなるまで実行
    let nodeData = await func.call(this, ...params)
    result.push(...nodeData.list)
    while (nodeData.nextPageToken) {
      options.pageToken = nodeData.nextPageToken
      nodeData = await func.call(this, ...params)
      result.push(...nodeData.list)
    }

    return result
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  protected readonly toTimestampEntity = _toTimestampEntity

  protected readonly toTimestampEntities = _toTimestampEntities
}

//========================================================================
//
//  Exports
//
//========================================================================

export { BaseGQLAPIContainer, RawAuthDataResult, RawPublicProfile, RawUser }
