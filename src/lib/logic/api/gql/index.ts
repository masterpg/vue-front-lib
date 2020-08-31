import {
  APIStorageNode,
  AppConfigResponse,
  AuthDataResult,
  LibAPIContainer,
  ToRawTimestampEntity,
  toTimestampEntities as _toTimestampEntities,
  toTimestampEntity as _toTimestampEntity,
} from '../base'
import {
  CreateArticleDirInput,
  CreateStorageNodeInput,
  PublicProfile,
  SetArticleSortOrderInput,
  StorageNodeKeyInput,
  StorageNodeShareSettingsInput,
  StoragePaginationInput,
  StoragePaginationResult,
  UserInfo,
  UserInfoInput,
} from '../../types'
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
            user {
              rootName
            }
            article {
              rootName
              fileName
              assetsName
            }
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

  async getStorageNode(input: StorageNodeKeyInput): Promise<APIStorageNode | undefined> {
    const response = await this.query<{ storageNode: RawStorageNode | null }>({
      query: gql`
        query GetStorageNode($input: StorageNodeKeyInput!) {
          storageNode(input: $input) {
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
            articleNodeType
            articleSortOrder
            version
            createdAt
            updatedAt
          }
        }
      `,
      variables: { input },
      isAuth: true,
    })
    const apiNode = response.data.storageNode
    return apiNode ? this.toTimestampEntity(apiNode) : undefined
  }

  async getStorageDirDescendants(dirPath?: string, input?: StoragePaginationInput): Promise<StoragePaginationResult> {
    const response = await this.query<{ storageDirDescendants: RawStoragePaginationResult }>({
      query: gql`
        query GetStorageDirDescendants($dirPath: String, $input: StoragePaginationInput) {
          storageDirDescendants(dirPath: $dirPath, input: $input) {
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
              articleNodeType
              articleSortOrder
              version
              createdAt
              updatedAt
            }
            nextPageToken
          }
        }
      `,
      variables: { dirPath, input },
      isAuth: true,
    })
    return {
      list: this.toTimestampEntities(response.data.storageDirDescendants.list),
      nextPageToken: response.data.storageDirDescendants.nextPageToken || undefined,
    }
  }

  async getStorageDescendants(dirPath?: string, input?: StoragePaginationInput): Promise<StoragePaginationResult> {
    const response = await this.query<{ storageDescendants: RawStoragePaginationResult }>({
      query: gql`
        query GetStorageDescendants($dirPath: String, $input: StoragePaginationInput) {
          storageDescendants(dirPath: $dirPath, input: $input) {
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
              articleNodeType
              articleSortOrder
              version
              createdAt
              updatedAt
            }
            nextPageToken
          }
        }
      `,
      variables: { dirPath, input },
      isAuth: true,
    })
    return {
      list: this.toTimestampEntities(response.data.storageDescendants.list),
      nextPageToken: response.data.storageDescendants.nextPageToken || undefined,
    }
  }

  async getStorageDirChildren(dirPath?: string, input?: StoragePaginationInput): Promise<StoragePaginationResult> {
    const response = await this.query<{ storageDirChildren: RawStoragePaginationResult }>({
      query: gql`
        query GetStorageDirChildren($dirPath: String, $input: StoragePaginationInput) {
          storageDirChildren(dirPath: $dirPath, input: $input) {
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
              articleNodeType
              articleSortOrder
              version
              createdAt
              updatedAt
            }
            nextPageToken
          }
        }
      `,
      variables: { dirPath, input },
      isAuth: true,
    })
    return {
      list: this.toTimestampEntities(response.data.storageDirChildren.list),
      nextPageToken: response.data.storageDirChildren.nextPageToken || undefined,
    }
  }

  async getStorageChildren(dirPath?: string, input?: StoragePaginationInput): Promise<StoragePaginationResult> {
    const response = await this.query<{ storageChildren: RawStoragePaginationResult }>({
      query: gql`
        query GetStorageChildren($dirPath: String, $input: StoragePaginationInput) {
          storageChildren(dirPath: $dirPath, input: $input) {
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
              articleNodeType
              articleSortOrder
              version
              createdAt
              updatedAt
            }
            nextPageToken
          }
        }
      `,
      variables: { dirPath, input },
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
            articleNodeType
            articleSortOrder
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
            articleNodeType
            articleSortOrder
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

  async createStorageDir(dirPath: string, input?: CreateStorageNodeInput): Promise<APIStorageNode> {
    const response = await this.mutate<{ createStorageDir: RawStorageNode }>({
      mutation: gql`
        mutation CreateStorageDir($dirPath: String!, $input: CreateStorageNodeInput) {
          createStorageDir(dirPath: $dirPath, input: $input) {
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
            articleNodeType
            articleSortOrder
            version
            createdAt
            updatedAt
          }
        }
      `,
      variables: { dirPath, input },
      isAuth: true,
    })
    return this.toTimestampEntity(response.data!.createStorageDir)
  }

  async createStorageHierarchicalDirs(dirPaths: string[]): Promise<APIStorageNode[]> {
    const response = await this.mutate<{ createStorageHierarchicalDirs: RawStorageNode[] }>({
      mutation: gql`
        mutation CreateStorageHierarchicalDirs($dirPaths: [String!]!) {
          createStorageHierarchicalDirs(dirPaths: $dirPaths) {
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
            articleNodeType
            articleSortOrder
            version
            createdAt
            updatedAt
          }
        }
      `,
      variables: { dirPaths },
      isAuth: true,
    })
    return this.toTimestampEntities(response.data!.createStorageHierarchicalDirs)
  }

  async removeStorageDir(dirPath: string, input?: StoragePaginationInput): Promise<StoragePaginationResult> {
    const response = await this.mutate<{ removeStorageDir: RawStoragePaginationResult }>({
      mutation: gql`
        mutation RemoveStorageDir($dirPath: String!, $input: StoragePaginationInput) {
          removeStorageDir(dirPath: $dirPath, input: $input) {
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
              articleNodeType
              articleSortOrder
              version
              createdAt
              updatedAt
            }
            nextPageToken
          }
        }
      `,
      variables: { dirPath, input },
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
            articleNodeType
            articleSortOrder
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

  async moveStorageDir(fromDirPath: string, toDirPath: string, input?: StoragePaginationInput): Promise<StoragePaginationResult> {
    const response = await this.mutate<{ moveStorageDir: RawStoragePaginationResult }>({
      mutation: gql`
        mutation MoveStorageDir($fromDirPath: String!, $toDirPath: String!, $input: StoragePaginationInput) {
          moveStorageDir(fromDirPath: $fromDirPath, toDirPath: $toDirPath, input: $input) {
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
              articleNodeType
              articleSortOrder
              version
              createdAt
              updatedAt
            }
            nextPageToken
          }
        }
      `,
      variables: { fromDirPath, toDirPath, input },
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
            articleNodeType
            articleSortOrder
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

  async renameStorageDir(dirPath: string, newName: string, input?: StoragePaginationInput): Promise<StoragePaginationResult> {
    const response = await this.mutate<{ renameStorageDir: RawStoragePaginationResult }>({
      mutation: gql`
        mutation RenameStorageDir($dirPath: String!, $newName: String!, $input: StoragePaginationInput) {
          renameStorageDir(dirPath: $dirPath, newName: $newName, input: $input) {
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
              articleNodeType
              articleSortOrder
              version
              createdAt
              updatedAt
            }
            nextPageToken
          }
        }
      `,
      variables: { dirPath, newName, input },
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
            articleNodeType
            articleSortOrder
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

  async setStorageDirShareSettings(dirPath: string, input: StorageNodeShareSettingsInput): Promise<APIStorageNode> {
    const response = await this.mutate<{ setStorageDirShareSettings: RawStorageNode }>({
      mutation: gql`
        mutation SetStorageDirShareSettings($dirPath: String!, $input: StorageNodeShareSettingsInput!) {
          setStorageDirShareSettings(dirPath: $dirPath, input: $input) {
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
            articleNodeType
            articleSortOrder
            version
            createdAt
            updatedAt
          }
        }
      `,
      variables: { dirPath, input },
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
            articleNodeType
            articleSortOrder
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

  async setStorageFileShareSettings(filePath: string, input: StorageNodeShareSettingsInput): Promise<APIStorageNode> {
    const response = await this.mutate<{ setStorageFileShareSettings: RawStorageNode }>({
      mutation: gql`
        mutation SetStorageFileShareSettings($filePath: String!, $input: StorageNodeShareSettingsInput!) {
          setStorageFileShareSettings(filePath: $filePath, input: $input) {
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
            articleNodeType
            articleSortOrder
            version
            createdAt
            updatedAt
          }
        }
      `,
      variables: { filePath, input },
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
  //  Article
  //--------------------------------------------------

  async createArticleDir(dirPath: string, input: CreateArticleDirInput): Promise<APIStorageNode> {
    const response = await this.mutate<{ createArticleDir: RawStorageNode }>({
      mutation: gql`
        mutation CreateArticleDir($dirPath: String!, $input: CreateArticleDirInput!) {
          createArticleDir(dirPath: $dirPath, input: $input) {
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
            articleNodeType
            articleSortOrder
            version
            createdAt
            updatedAt
          }
        }
      `,
      variables: { dirPath, input },
      isAuth: true,
    })
    return this.toTimestampEntity(response.data!.createArticleDir)
  }

  async setArticleSortOrder(nodePath: string, input: SetArticleSortOrderInput): Promise<APIStorageNode> {
    const response = await this.mutate<{ setArticleSortOrder: RawStorageNode }>({
      mutation: gql`
        mutation SetArticleSortOrder($nodePath: String!, $input: SetArticleSortOrderInput!) {
          setArticleSortOrder(nodePath: $nodePath, input: $input) {
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
            articleNodeType
            articleSortOrder
            version
            createdAt
            updatedAt
          }
        }
      `,
      variables: { nodePath, input },
      isAuth: true,
    })
    return this.toTimestampEntity(response.data!.setArticleSortOrder)
  }

  async getArticleChildren(dirPath: string, input?: StoragePaginationInput): Promise<StoragePaginationResult> {
    const response = await this.query<{ articleChildren: RawStoragePaginationResult }>({
      query: gql`
        query GetArticleChildren($dirPath: String!, $input: StoragePaginationInput) {
          articleChildren(dirPath: $dirPath, input: $input) {
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
              articleNodeType
              articleSortOrder
              version
              createdAt
              updatedAt
            }
            nextPageToken
          }
        }
      `,
      variables: { dirPath, input },
      isAuth: true,
    })
    return {
      list: this.toTimestampEntities(response.data.articleChildren.list),
      nextPageToken: response.data.articleChildren.nextPageToken || undefined,
    }
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
    // ※ノード検索APIの引数の最後は検索オプションという前提
    let input: StoragePaginationInput
    const lastParam = params[params.length - 1]
    if (typeof lastParam.maxChunk === 'number' || typeof lastParam.pageToken === 'string') {
      input = lastParam
      params[params.length - 1] = input
    } else {
      input = {
        maxChunk: undefined,
        pageToken: undefined,
      }
      params.push(input)
    }

    // ノード検索APIの実行
    // ※ページングがなくなるまで実行
    let nodeData = await func.call(this, ...params)
    result.push(...nodeData.list)
    while (nodeData.nextPageToken) {
      input.pageToken = nodeData.nextPageToken
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
