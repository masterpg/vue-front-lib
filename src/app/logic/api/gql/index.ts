import {
  APIStorageNode,
  AuthStatus,
  CreateArticleTypeDirInput,
  CreateStorageNodeInput,
  PublicProfile,
  SetArticleSortOrderInput,
  StorageArticleNodeType,
  StorageNodeKeyInput,
  StorageNodeShareSettingsInput,
  StoragePaginationInput,
  StoragePaginationResult,
  UserInfo,
  UserInfoInput,
} from '@/app/logic/base'
import { GQLAPIClient, createGQLAPIClient, injectGQLAPIClient, provideGQLAPIClient } from '@/app/logic/api/gql/client'
import { InjectionKey, inject, provide } from '@vue/composition-api'
import { RawEntity, toEntity } from '@/app/logic/api/base'
import { StorageConfig } from '@/app/config'
import gql from 'graphql-tag'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface GQLAPIContainer {
  getAppConfig(): Promise<AppConfigResponse>

  //--------------------------------------------------
  //  User
  //--------------------------------------------------

  getAuthData(): Promise<AuthDataResult>

  setOwnUserInfo(input: UserInfoInput): Promise<UserInfo>

  deleteOwnUser(): Promise<boolean>

  //--------------------------------------------------
  //  Storage
  //--------------------------------------------------

  getStorageNode(input: StorageNodeKeyInput): Promise<APIStorageNode | undefined>

  getStorageDirDescendants(dirPath?: string, input?: StoragePaginationInput): Promise<StoragePaginationResult>

  getStorageDescendants(dirPath?: string, input?: StoragePaginationInput): Promise<StoragePaginationResult>

  getStorageDirChildren(dirPath?: string, input?: StoragePaginationInput): Promise<StoragePaginationResult>

  getStorageChildren(dirPath?: string, input?: StoragePaginationInput): Promise<StoragePaginationResult>

  getStorageHierarchicalNodes(nodePath: string): Promise<APIStorageNode[]>

  getStorageAncestorDirs(nodePath: string): Promise<APIStorageNode[]>

  createStorageDir(dirPath: string, input?: CreateStorageNodeInput): Promise<APIStorageNode>

  createStorageHierarchicalDirs(dirPaths: string[]): Promise<APIStorageNode[]>

  removeStorageDir(dirPath: string, input?: StoragePaginationInput): Promise<StoragePaginationResult>

  removeStorageFile(filePath: string): Promise<APIStorageNode | undefined>

  moveStorageDir(fromDirPath: string, toDirPath: string, input?: StoragePaginationInput): Promise<StoragePaginationResult>

  moveStorageFile(fromFilePath: string, toFilePath: string): Promise<APIStorageNode>

  renameStorageDir(dirPath: string, newName: string, input?: StoragePaginationInput): Promise<StoragePaginationResult>

  renameStorageFile(filePath: string, newName: string): Promise<APIStorageNode>

  setStorageDirShareSettings(dirPath: string, input: StorageNodeShareSettingsInput): Promise<APIStorageNode>

  setStorageFileShareSettings(filePath: string, input: StorageNodeShareSettingsInput): Promise<APIStorageNode>

  handleUploadedFile(filePath: string): Promise<APIStorageNode>

  getSignedUploadUrls(inputs: { filePath: string; contentType?: string }[]): Promise<string[]>

  //--------------------------------------------------
  //  Article
  //--------------------------------------------------

  createArticleTypeDir(input: CreateArticleTypeDirInput): Promise<APIStorageNode>

  createArticleGeneralDir(dirPath: string): Promise<APIStorageNode>

  renameArticleNode(nodePath: string, newName: string): Promise<APIStorageNode>

  setArticleSortOrder(nodePath: string, input: SetArticleSortOrderInput): Promise<APIStorageNode>

  getArticleChildren(dirPath: string, articleTypes: StorageArticleNodeType[], input?: StoragePaginationInput): Promise<StoragePaginationResult>

  //--------------------------------------------------
  //  Helpers
  //--------------------------------------------------

  /**
   * ページングが必要なノード検索APIをページングがなくなるまで実行し結果を取得します。
   * 注意: ノード検索API関数の第一引数は検索オプション`StoragePaginationInput`
   *       であることを前提とします。
   *
   * @param func ノード検索API関数を指定
   * @param params ノード検索APIに渡す引数を指定
   */
  callStoragePaginationAPI<FUNC extends (...args: any[]) => Promise<StoragePaginationResult>>(
    func: FUNC,
    ...params: Parameters<FUNC>
  ): Promise<APIStorageNode[]>
}

interface GQLAPIContainerImpl extends GQLAPIContainer {
  client: GQLAPIClient
}

//--------------------------------------------------
//  Foundation
//--------------------------------------------------

interface AppConfigResponse extends StorageConfig {}

//--------------------------------------------------
//  User
//--------------------------------------------------

interface AuthDataResult {
  status: AuthStatus
  token: string
  user?: UserInfo
}

//--------------------------------------------------
//  User
//--------------------------------------------------

interface RawAuthDataResult extends Omit<AuthDataResult, 'user'> {
  user: RawUser
}

interface RawUser extends RawEntity<Omit<UserInfo, 'publicProfile'>> {
  publicProfile: RawPublicProfile
}

interface RawPublicProfile extends RawEntity<PublicProfile> {}

//--------------------------------------------------
//  Storage
//--------------------------------------------------

interface RawStorageNode extends RawEntity<APIStorageNode> {}

interface RawStoragePaginationResult {
  list: RawStorageNode[]
  nextPageToken?: string
}

//========================================================================
//
//  Implementation
//
//========================================================================

function createGQLAPI(): GQLAPIContainer {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  const client = injectGQLAPIClient()

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  const getAppConfig: GQLAPIContainerImpl['getAppConfig'] = async () => {
    const response = await client.query<{ appConfig: AppConfigResponse }>({
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

  const getAuthData: GQLAPIContainerImpl['getAuthData'] = async () => {
    const response = await client.query<{ authData: RawAuthDataResult }>({
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
        ...toEntity(user),
        publicProfile: toEntity(user.publicProfile),
      },
    }
  }

  const setOwnUserInfo: GQLAPIContainerImpl['setOwnUserInfo'] = async input => {
    const response = await client.mutate<{ setOwnUserInfo: RawUser }>({
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
      ...toEntity(user),
      publicProfile: toEntity(user.publicProfile),
    }
  }

  const deleteOwnUser: GQLAPIContainerImpl['deleteOwnUser'] = async () => {
    const response = await client.mutate<{ deleteOwnUser: boolean }>({
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

  const getStorageNode: GQLAPIContainerImpl['getStorageNode'] = async input => {
    const response = await client.query<{ storageNode: RawStorageNode | null }>({
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
            articleNodeName
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
    return toEntity(response.data.storageNode)
  }

  const getStorageDirDescendants: GQLAPIContainerImpl['getStorageDirDescendants'] = async (dirPath, input) => {
    const response = await client.query<{ storageDirDescendants: RawStoragePaginationResult }>({
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
              articleNodeName
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
      list: toEntity(response.data.storageDirDescendants.list),
      nextPageToken: response.data.storageDirDescendants.nextPageToken || undefined,
    }
  }

  const getStorageDescendants: GQLAPIContainerImpl['getStorageDescendants'] = async (dirPath, input) => {
    const response = await client.query<{ storageDescendants: RawStoragePaginationResult }>({
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
              articleNodeName
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
      list: toEntity(response.data.storageDescendants.list),
      nextPageToken: response.data.storageDescendants.nextPageToken || undefined,
    }
  }

  const getStorageDirChildren: GQLAPIContainerImpl['getStorageDirChildren'] = async (dirPath, input) => {
    const response = await client.query<{ storageDirChildren: RawStoragePaginationResult }>({
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
              articleNodeName
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
      list: toEntity(response.data.storageDirChildren.list),
      nextPageToken: response.data.storageDirChildren.nextPageToken || undefined,
    }
  }

  const getStorageChildren: GQLAPIContainerImpl['getStorageChildren'] = async (dirPath, input) => {
    const response = await client.query<{ storageChildren: RawStoragePaginationResult }>({
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
              articleNodeName
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
      list: toEntity(response.data.storageChildren.list),
      nextPageToken: response.data.storageChildren.nextPageToken || undefined,
    }
  }

  const getStorageHierarchicalNodes: GQLAPIContainerImpl['getStorageHierarchicalNodes'] = async nodePath => {
    const response = await client.query<{ storageHierarchicalNodes: RawStorageNode[] }>({
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
            articleNodeName
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
    return toEntity(response.data!.storageHierarchicalNodes)
  }

  const getStorageAncestorDirs: GQLAPIContainerImpl['getStorageAncestorDirs'] = async nodePath => {
    const response = await client.query<{ storageAncestorDirs: RawStorageNode[] }>({
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
            articleNodeName
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
    return toEntity(response.data!.storageAncestorDirs)
  }

  const createStorageDir: GQLAPIContainerImpl['createStorageDir'] = async (dirPath, input) => {
    const response = await client.mutate<{ createStorageDir: RawStorageNode }>({
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
            articleNodeName
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
    return toEntity(response.data!.createStorageDir)
  }

  const createStorageHierarchicalDirs: GQLAPIContainerImpl['createStorageHierarchicalDirs'] = async dirPaths => {
    const response = await client.mutate<{ createStorageHierarchicalDirs: RawStorageNode[] }>({
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
            articleNodeName
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
    return toEntity(response.data!.createStorageHierarchicalDirs)
  }

  const removeStorageDir: GQLAPIContainerImpl['removeStorageDir'] = async (dirPath, input) => {
    const response = await client.mutate<{ removeStorageDir: RawStoragePaginationResult }>({
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
              articleNodeName
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
      list: toEntity(response.data!.removeStorageDir.list),
      nextPageToken: response.data!.removeStorageDir.nextPageToken || undefined,
    }
  }

  const removeStorageFile: GQLAPIContainerImpl['removeStorageFile'] = async filePath => {
    const response = await client.mutate<{ removeStorageFile: RawStorageNode | null }>({
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
            articleNodeName
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
    return toEntity(response.data!.removeStorageFile)
  }

  const moveStorageDir: GQLAPIContainerImpl['moveStorageDir'] = async (fromDirPath, toDirPath, input) => {
    const response = await client.mutate<{ moveStorageDir: RawStoragePaginationResult }>({
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
              articleNodeName
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
      list: toEntity(response.data!.moveStorageDir.list),
      nextPageToken: response.data!.moveStorageDir.nextPageToken || undefined,
    }
  }

  const moveStorageFile: GQLAPIContainerImpl['moveStorageFile'] = async (fromFilePath, toFilePath) => {
    const response = await client.mutate<{ moveStorageFile: RawStorageNode }>({
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
            articleNodeName
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
    return toEntity(response.data!.moveStorageFile)
  }

  const renameStorageDir: GQLAPIContainerImpl['renameStorageDir'] = async (dirPath, newName, input) => {
    const response = await client.mutate<{ renameStorageDir: RawStoragePaginationResult }>({
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
              articleNodeName
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
      list: toEntity(response.data!.renameStorageDir.list),
      nextPageToken: response.data!.renameStorageDir.nextPageToken || undefined,
    }
  }

  const renameStorageFile: GQLAPIContainerImpl['renameStorageFile'] = async (filePath, newName) => {
    const response = await client.mutate<{ renameStorageFile: RawStorageNode }>({
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
            articleNodeName
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
    return toEntity(response.data!.renameStorageFile)
  }

  const setStorageDirShareSettings: GQLAPIContainerImpl['setStorageDirShareSettings'] = async (dirPath, input) => {
    const response = await client.mutate<{ setStorageDirShareSettings: RawStorageNode }>({
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
            articleNodeName
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
    return toEntity(response.data!.setStorageDirShareSettings)
  }

  const handleUploadedFile: GQLAPIContainerImpl['handleUploadedFile'] = async filePath => {
    const response = await client.mutate<{ handleUploadedFile: RawStorageNode }>({
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
            articleNodeName
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
    return toEntity(response.data!.handleUploadedFile)
  }

  const setStorageFileShareSettings: GQLAPIContainerImpl['setStorageFileShareSettings'] = async (filePath, input) => {
    const response = await client.mutate<{ setStorageFileShareSettings: RawStorageNode }>({
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
            articleNodeName
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
    return toEntity(response.data!.setStorageFileShareSettings)
  }

  const getSignedUploadUrls: GQLAPIContainerImpl['getSignedUploadUrls'] = async inputs => {
    const response = await client.query<{ signedUploadUrls: string[] }>({
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

  const createArticleTypeDir: GQLAPIContainerImpl['createArticleTypeDir'] = async input => {
    const response = await client.mutate<{ createArticleTypeDir: RawStorageNode }>({
      mutation: gql`
        mutation CreateArticleTypeDir($input: CreateArticleTypeDirInput!) {
          createArticleTypeDir(input: $input) {
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
            articleNodeName
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
    return toEntity(response.data!.createArticleTypeDir)
  }

  const createArticleGeneralDir: GQLAPIContainerImpl['createArticleGeneralDir'] = async dirPath => {
    const response = await client.mutate<{ createArticleGeneralDir: RawStorageNode }>({
      mutation: gql`
        mutation CreateArticleGeneralDir($dirPath: String!) {
          createArticleGeneralDir(dirPath: $dirPath) {
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
            articleNodeName
            articleNodeType
            articleSortOrder
            version
            createdAt
            updatedAt
          }
        }
      `,
      variables: { dirPath },
      isAuth: true,
    })
    return toEntity(response.data!.createArticleGeneralDir)
  }

  const renameArticleNode: GQLAPIContainerImpl['renameArticleNode'] = async (nodePath, newName) => {
    const response = await client.mutate<{ renameArticleNode: RawStorageNode }>({
      mutation: gql`
        mutation RenameArticleNode($nodePath: String!, $newName: String!) {
          renameArticleNode(nodePath: $nodePath, newName: $newName) {
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
            articleNodeName
            articleNodeType
            articleSortOrder
            version
            createdAt
            updatedAt
          }
        }
      `,
      variables: { nodePath, newName },
      isAuth: true,
    })
    return toEntity(response.data!.renameArticleNode)
  }

  const setArticleSortOrder: GQLAPIContainerImpl['setArticleSortOrder'] = async (nodePath, input) => {
    const response = await client.mutate<{ setArticleSortOrder: RawStorageNode }>({
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
            articleNodeName
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
    return toEntity(response.data!.setArticleSortOrder)
  }

  const getArticleChildren: GQLAPIContainerImpl['getArticleChildren'] = async (dirPath, articleTypes, input) => {
    const response = await client.query<{ articleChildren: RawStoragePaginationResult }>({
      query: gql`
        query GetArticleChildren($dirPath: String!, $articleTypes: [StorageArticleNodeType!]!, $input: StoragePaginationInput) {
          articleChildren(dirPath: $dirPath, articleTypes: $articleTypes, input: $input) {
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
              articleNodeName
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
      variables: { dirPath, articleTypes, input },
      isAuth: true,
    })
    return {
      list: toEntity(response.data.articleChildren.list),
      nextPageToken: response.data.articleChildren.nextPageToken || undefined,
    }
  }

  //--------------------------------------------------
  //  Helpers
  //--------------------------------------------------

  const callStoragePaginationAPI: GQLAPIContainerImpl['callStoragePaginationAPI'] = async (func, ...params) => {
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
    let nodeData = await func(...params)
    result.push(...nodeData.list)
    while (nodeData.nextPageToken) {
      input.pageToken = nodeData.nextPageToken
      // nodeData = await func.call(func, ...params)
      nodeData = await func(...params)
      result.push(...nodeData.list)
    }

    return result
  }

  //----------------------------------------------------------------------
  //
  //  Result
  //
  //----------------------------------------------------------------------

  return {
    getAppConfig,
    getAuthData,
    setOwnUserInfo,
    deleteOwnUser,
    getStorageNode,
    getStorageDirDescendants,
    getStorageDescendants,
    getStorageDirChildren,
    getStorageChildren,
    getStorageHierarchicalNodes,
    getStorageAncestorDirs,
    createStorageDir,
    createStorageHierarchicalDirs,
    removeStorageDir,
    removeStorageFile,
    moveStorageDir,
    moveStorageFile,
    renameStorageDir,
    renameStorageFile,
    setStorageDirShareSettings,
    handleUploadedFile,
    setStorageFileShareSettings,
    getSignedUploadUrls,
    createArticleTypeDir,
    createArticleGeneralDir,
    renameArticleNode,
    setArticleSortOrder,
    getArticleChildren,
    callStoragePaginationAPI,
    client,
  } as GQLAPIContainerImpl
}

const GQLAPIKey: InjectionKey<GQLAPIContainer> = Symbol('GQLAPIContainer')

function provideGQLAPI(options?: { api?: GQLAPIContainer | typeof createGQLAPI; client?: GQLAPIClient | typeof createGQLAPIClient }): void {
  provideGQLAPIClient(options?.client)

  let instance: GQLAPIContainer
  if (!options?.api) {
    instance = createGQLAPI()
  } else {
    instance = typeof options.api === 'function' ? options.api() : options.api
  }
  provide(GQLAPIKey, instance)
}

function injectGQLAPI(): GQLAPIContainer {
  validateGQLAPIProvided()
  return inject(GQLAPIKey)!
}

function validateGQLAPIProvided(): void {
  const value = inject(GQLAPIKey)
  if (!value) {
    throw new Error(`${GQLAPIKey.description} is not provided`)
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { GQLAPIContainer, GQLAPIContainerImpl, GQLAPIKey, RawUser, createGQLAPI, injectGQLAPI, provideGQLAPI, validateGQLAPIProvided, RawStorageNode }
