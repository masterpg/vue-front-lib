import {
  APIStorageNode,
  APIStoragePaginationResult,
  AppConfigResponse,
  AuthDataResult,
  LibAPIContainer,
  PublicProfile,
  StorageNode,
  StorageNodeShareSettingsInput,
  StoragePaginationOptionsInput,
  StoragePaginationResult,
  ToAPITimestampEntity,
  User,
  UserInfoInput,
  toTimestampEntities as _toTimestampEntities,
  toTimestampEntity as _toTimestampEntity,
} from '../base'
import { BaseGQLClient } from './base'
import dayjs from 'dayjs'
import gql from 'graphql-tag'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface APIAuthDataResult extends Omit<AuthDataResult, 'user'> {
  user: APIUser
}

interface APIUser extends ToAPITimestampEntity<Omit<User, 'publicProfile'>> {
  publicProfile: APIPublicProfile
}

interface APIPublicProfile extends ToAPITimestampEntity<PublicProfile> {}

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
  //  User
  //--------------------------------------------------

  async getAuthData(): Promise<AuthDataResult> {
    const response = await this.query<{ authData: APIAuthDataResult }>({
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
              myDirName
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

  async setOwnUserInfo(input: UserInfoInput): Promise<User> {
    const response = await this.mutate<{ setOwnUserInfo: APIUser }>({
      mutation: gql`
        mutation SetOwnUserInfo($input: UserInfoInput!) {
          setOwnUserInfo(input: $input) {
            id
            fullName
            email
            emailVerified
            isAppAdmin
            myDirName
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
  //  Storage (User)
  //--------------------------------------------------

  async getUserStorageNode(nodePath: string): Promise<StorageNode | undefined> {
    const response = await this.query<{ userStorageNode: APIStorageNode | null }>({
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
              readUIds
              writeUIds
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
    return apiNode ? this.toStorageNode(apiNode) : undefined
  }

  async getUserStorageDirDescendants(options: StoragePaginationOptionsInput | null, dirPath?: string): Promise<StoragePaginationResult> {
    const response = await this.query<{ userStorageDirDescendants: APIStoragePaginationResult }>({
      query: gql`
        query GetUserStorageDirDescendants($dirPath: String, $options: StoragePaginationOptionsInput) {
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
                readUIds
                writeUIds
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
      list: this.toStorageNodes(response.data.userStorageDirDescendants.list),
      nextPageToken: response.data.userStorageDirDescendants.nextPageToken || undefined,
    }
  }

  async getUserStorageDescendants(options: StoragePaginationOptionsInput | null, dirPath?: string): Promise<StoragePaginationResult> {
    const response = await this.query<{ userStorageDescendants: APIStoragePaginationResult }>({
      query: gql`
        query GetUserStorageDescendants($dirPath: String, $options: StoragePaginationOptionsInput) {
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
                readUIds
                writeUIds
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
      list: this.toStorageNodes(response.data.userStorageDescendants.list),
      nextPageToken: response.data.userStorageDescendants.nextPageToken || undefined,
    }
  }

  async getUserStorageDirChildren(options: StoragePaginationOptionsInput | null, dirPath?: string): Promise<StoragePaginationResult> {
    const response = await this.query<{ userStorageDirChildren: APIStoragePaginationResult }>({
      query: gql`
        query GetUserStorageDirChildren($dirPath: String, $options: StoragePaginationOptionsInput) {
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
                readUIds
                writeUIds
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
      list: this.toStorageNodes(response.data.userStorageDirChildren.list),
      nextPageToken: response.data.userStorageDirChildren.nextPageToken || undefined,
    }
  }

  async getUserStorageChildren(options: StoragePaginationOptionsInput | null, dirPath?: string): Promise<StoragePaginationResult> {
    const response = await this.query<{ userStorageChildren: APIStoragePaginationResult }>({
      query: gql`
        query GetUserStorageChildren($dirPath: String, $options: StoragePaginationOptionsInput) {
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
                readUIds
                writeUIds
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
      list: this.toStorageNodes(response.data.userStorageChildren.list),
      nextPageToken: response.data.userStorageChildren.nextPageToken || undefined,
    }
  }

  async getUserStorageHierarchicalNodes(nodePath: string): Promise<StorageNode[]> {
    const response = await this.query<{ userStorageHierarchicalNodes: APIStorageNode[] }>({
      query: gql`
        query GetUserStorageHierarchicalNodes($nodePath: String!) {
          userStorageHierarchicalNodes(nodePath: $nodePath) {
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
            created
            updated
          }
        }
      `,
      variables: { nodePath },
      isAuth: true,
    })
    return this.toStorageNodes(response.data.userStorageHierarchicalNodes)
  }

  async getUserStorageAncestorDirs(nodePath: string): Promise<StorageNode[]> {
    const response = await this.query<{ userStorageAncestorDirs: APIStorageNode[] }>({
      query: gql`
        query GetUserStorageAncestorDirs($nodePath: String!) {
          userStorageAncestorDirs(nodePath: $nodePath) {
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
            created
            updated
          }
        }
      `,
      variables: { nodePath },
      isAuth: true,
    })
    return this.toStorageNodes(response.data.userStorageAncestorDirs)
  }

  async handleUploadedUserFile(filePath: string): Promise<StorageNode> {
    const response = await this.mutate<{ handleUploadedUserFile: APIStorageNode }>({
      mutation: gql`
        mutation HandleUploadedUserFile($filePath: String!) {
          handleUploadedUserFile(filePath: $filePath) {
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
            created
            updated
          }
        }
      `,
      variables: { filePath },
      isAuth: true,
    })
    return this.toStorageNode(response.data!.handleUploadedUserFile)
  }

  async createUserStorageDirs(dirPaths: string[]): Promise<StorageNode[]> {
    const response = await this.mutate<{ createUserStorageDirs: APIStorageNode[] }>({
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
              readUIds
              writeUIds
            }
            created
            updated
          }
        }
      `,
      variables: { dirPaths },
      isAuth: true,
    })
    return this.toStorageNodes(response.data!.createUserStorageDirs)
  }

  async removeUserStorageDir(options: StoragePaginationOptionsInput | null, dirPath: string): Promise<StoragePaginationResult> {
    const response = await this.mutate<{ removeUserStorageDir: APIStoragePaginationResult }>({
      mutation: gql`
        mutation RemoveUserStorageDir($dirPath: String!, $options: StoragePaginationOptionsInput) {
          removeUserStorageDir(dirPath: $dirPath, options: $options) {
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
      list: this.toStorageNodes(response.data!.removeUserStorageDir.list),
      nextPageToken: response.data!.removeUserStorageDir.nextPageToken || undefined,
    }
  }

  async removeUserStorageFile(filePath: string): Promise<StorageNode | undefined> {
    const response = await this.mutate<{ removeUserStorageFile: APIStorageNode | null }>({
      mutation: gql`
        mutation RemoveUserStorageFile($filePath: String!) {
          removeUserStorageFile(filePath: $filePath) {
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
            created
            updated
          }
        }
      `,
      variables: { filePath },
      isAuth: true,
    })
    const apiNode = response.data!.removeUserStorageFile
    return apiNode ? this.toStorageNode(apiNode) : undefined
  }

  async moveUserStorageDir(options: StoragePaginationOptionsInput | null, fromDirPath: string, toDirPath: string): Promise<StoragePaginationResult> {
    const response = await this.mutate<{ moveUserStorageDir: APIStoragePaginationResult }>({
      mutation: gql`
        mutation MoveUserStorageDir($fromDirPath: String!, $toDirPath: String!, $options: StoragePaginationOptionsInput) {
          moveUserStorageDir(fromDirPath: $fromDirPath, toDirPath: $toDirPath, options: $options) {
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
              created
              updated
            }
            nextPageToken
          }
        }
      `,
      variables: { fromDirPath, toDirPath, options },
      isAuth: true,
    })
    return {
      list: this.toStorageNodes(response.data!.moveUserStorageDir.list),
      nextPageToken: response.data!.moveUserStorageDir.nextPageToken || undefined,
    }
  }

  async moveUserStorageFile(fromFilePath: string, toFilePath: string): Promise<StorageNode> {
    const response = await this.mutate<{ moveUserStorageFile: APIStorageNode }>({
      mutation: gql`
        mutation MoveUserStorageFile($fromFilePath: String!, $toFilePath: String!) {
          moveUserStorageFile(fromFilePath: $fromFilePath, toFilePath: $toFilePath) {
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
            created
            updated
          }
        }
      `,
      variables: { fromFilePath, toFilePath },
      isAuth: true,
    })
    return this.toStorageNode(response.data!.moveUserStorageFile)
  }

  async renameUserStorageDir(options: StoragePaginationOptionsInput | null, dirPath: string, newName: string): Promise<StoragePaginationResult> {
    const response = await this.mutate<{ renameUserStorageDir: APIStoragePaginationResult }>({
      mutation: gql`
        mutation RenameUserStorageDir($dirPath: String!, $newName: String!, $options: StoragePaginationOptionsInput) {
          renameUserStorageDir(dirPath: $dirPath, newName: $newName, options: $options) {
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
              created
              updated
            }
            nextPageToken
          }
        }
      `,
      variables: { dirPath, newName, options },
      isAuth: true,
    })
    return {
      list: this.toStorageNodes(response.data!.renameUserStorageDir.list),
      nextPageToken: response.data!.renameUserStorageDir.nextPageToken || undefined,
    }
  }

  async renameUserStorageFile(filePath: string, newName: string): Promise<StorageNode> {
    const response = await this.mutate<{ renameUserStorageFile: APIStorageNode }>({
      mutation: gql`
        mutation RenameUserStorageFile($filePath: String!, $newName: String!) {
          renameUserStorageFile(filePath: $filePath, newName: $newName) {
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
            created
            updated
          }
        }
      `,
      variables: { filePath, newName },
      isAuth: true,
    })
    return this.toStorageNode(response.data!.renameUserStorageFile)
  }

  async setUserStorageDirShareSettings(dirPath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode> {
    const response = await this.mutate<{ setUserStorageDirShareSettings: APIStorageNode }>({
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
              readUIds
              writeUIds
            }
            created
            updated
          }
        }
      `,
      variables: { dirPath, settings },
      isAuth: true,
    })
    return this.toStorageNode(response.data!.setUserStorageDirShareSettings)
  }

  async setUserStorageFileShareSettings(filePath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode> {
    const response = await this.mutate<{ setUserStorageFileShareSettings: APIStorageNode }>({
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
              readUIds
              writeUIds
            }
            created
            updated
          }
        }
      `,
      variables: { filePath, settings },
      isAuth: true,
    })
    return this.toStorageNode(response.data!.setUserStorageFileShareSettings)
  }

  //--------------------------------------------------
  //  Storage (Admin)
  //--------------------------------------------------

  async getStorageNode(nodePath: string): Promise<StorageNode | undefined> {
    const response = await this.query<{ storageNode: APIStorageNode | null }>({
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
            created
            updated
          }
        }
      `,
      variables: { nodePath },
      isAuth: true,
    })
    const apiNode = response.data.storageNode
    return apiNode ? this.toStorageNode(apiNode) : undefined
  }

  async getStorageDirDescendants(options: StoragePaginationOptionsInput | null, dirPath?: string): Promise<StoragePaginationResult> {
    const response = await this.query<{ storageDirDescendants: APIStoragePaginationResult }>({
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
      list: this.toStorageNodes(response.data.storageDirDescendants.list),
      nextPageToken: response.data.storageDirDescendants.nextPageToken || undefined,
    }
  }

  async getStorageDescendants(options: StoragePaginationOptionsInput | null, dirPath?: string): Promise<StoragePaginationResult> {
    const response = await this.query<{ storageDescendants: APIStoragePaginationResult }>({
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
      list: this.toStorageNodes(response.data.storageDescendants.list),
      nextPageToken: response.data.storageDescendants.nextPageToken || undefined,
    }
  }

  async getStorageDirChildren(options: StoragePaginationOptionsInput | null, dirPath?: string): Promise<StoragePaginationResult> {
    const response = await this.query<{ storageDirChildren: APIStoragePaginationResult }>({
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
      list: this.toStorageNodes(response.data.storageDirChildren.list),
      nextPageToken: response.data.storageDirChildren.nextPageToken || undefined,
    }
  }

  async getStorageChildren(options: StoragePaginationOptionsInput | null, dirPath?: string): Promise<StoragePaginationResult> {
    const response = await this.query<{ storageChildren: APIStoragePaginationResult }>({
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
      list: this.toStorageNodes(response.data.storageChildren.list),
      nextPageToken: response.data.storageChildren.nextPageToken || undefined,
    }
  }

  async getStorageHierarchicalNodes(nodePath: string): Promise<StorageNode[]> {
    const response = await this.query<{ storageHierarchicalNodes: APIStorageNode[] }>({
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
            created
            updated
          }
        }
      `,
      variables: { nodePath },
      isAuth: true,
    })
    return this.toStorageNodes(response.data!.storageHierarchicalNodes)
  }

  async getStorageAncestorDirs(nodePath: string): Promise<StorageNode[]> {
    const response = await this.query<{ storageAncestorDirs: APIStorageNode[] }>({
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
            created
            updated
          }
        }
      `,
      variables: { nodePath },
      isAuth: true,
    })
    return this.toStorageNodes(response.data!.storageAncestorDirs)
  }

  async handleUploadedFile(filePath: string): Promise<StorageNode> {
    const response = await this.mutate<{ handleUploadedFile: APIStorageNode }>({
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
            created
            updated
          }
        }
      `,
      variables: { filePath },
      isAuth: true,
    })
    return this.toStorageNode(response.data!.handleUploadedFile)
  }

  async createStorageDirs(dirPaths: string[]): Promise<StorageNode[]> {
    const response = await this.mutate<{ createStorageDirs: APIStorageNode[] }>({
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
            created
            updated
          }
        }
      `,
      variables: { dirPaths },
      isAuth: true,
    })
    return this.toStorageNodes(response.data!.createStorageDirs)
  }

  async removeStorageDir(options: StoragePaginationOptionsInput | null, dirPath: string): Promise<StoragePaginationResult> {
    const response = await this.mutate<{ removeStorageDir: APIStoragePaginationResult }>({
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
      list: this.toStorageNodes(response.data!.removeStorageDir.list),
      nextPageToken: response.data!.removeStorageDir.nextPageToken || undefined,
    }
  }

  async removeStorageFile(filePath: string): Promise<StorageNode | undefined> {
    const response = await this.mutate<{ removeStorageFile: APIStorageNode | null }>({
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
            created
            updated
          }
        }
      `,
      variables: { filePath },
      isAuth: true,
    })
    const apiNode = response.data!.removeStorageFile
    return apiNode ? this.toStorageNode(apiNode) : undefined
  }

  async moveStorageDir(options: StoragePaginationOptionsInput | null, fromDirPath: string, toDirPath: string): Promise<StoragePaginationResult> {
    const response = await this.mutate<{ moveStorageDir: APIStoragePaginationResult }>({
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
              created
              updated
            }
            nextPageToken
          }
        }
      `,
      variables: { fromDirPath, toDirPath, options },
      isAuth: true,
    })
    return {
      list: this.toStorageNodes(response.data!.moveStorageDir.list),
      nextPageToken: response.data!.moveStorageDir.nextPageToken || undefined,
    }
  }

  async moveStorageFile(fromFilePath: string, toFilePath: string): Promise<StorageNode> {
    const response = await this.mutate<{ moveStorageFile: APIStorageNode }>({
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
            created
            updated
          }
        }
      `,
      variables: { fromFilePath, toFilePath },
      isAuth: true,
    })
    return this.toStorageNode(response.data!.moveStorageFile)
  }

  async renameStorageDir(options: StoragePaginationOptionsInput | null, dirPath: string, newName: string): Promise<StoragePaginationResult> {
    const response = await this.mutate<{ renameStorageDir: APIStoragePaginationResult }>({
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
              created
              updated
            }
            nextPageToken
          }
        }
      `,
      variables: { dirPath, newName, options },
      isAuth: true,
    })
    return {
      list: this.toStorageNodes(response.data!.renameStorageDir.list),
      nextPageToken: response.data!.renameStorageDir.nextPageToken || undefined,
    }
  }

  async renameStorageFile(filePath: string, newName: string): Promise<StorageNode> {
    const response = await this.mutate<{ renameStorageFile: APIStorageNode }>({
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
            created
            updated
          }
        }
      `,
      variables: { filePath, newName },
      isAuth: true,
    })
    return this.toStorageNode(response.data!.renameStorageFile)
  }

  async setStorageDirShareSettings(dirPath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode> {
    const response = await this.mutate<{ setStorageDirShareSettings: APIStorageNode }>({
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
            created
            updated
          }
        }
      `,
      variables: { dirPath, settings },
      isAuth: true,
    })
    return this.toStorageNode(response.data!.setStorageDirShareSettings)
  }

  async setStorageFileShareSettings(filePath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode> {
    const response = await this.mutate<{ setStorageFileShareSettings: APIStorageNode }>({
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
            created
            updated
          }
        }
      `,
      variables: { filePath, settings },
      isAuth: true,
    })
    return this.toStorageNode(response.data!.setStorageFileShareSettings)
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
  ): Promise<StorageNode[]> {
    const result: StorageNode[] = []

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

  protected toStorageNode(responseNode: APIStorageNode): StorageNode {
    return Object.assign(responseNode, {
      created: dayjs(responseNode.created),
      updated: dayjs(responseNode.updated),
    })
  }

  protected toStorageNodes(responseNodes: APIStorageNode[]): StorageNode[] {
    return responseNodes.map(node => this.toStorageNode(node))
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { BaseGQLAPIContainer, APIAuthDataResult, APIPublicProfile, APIUser }
