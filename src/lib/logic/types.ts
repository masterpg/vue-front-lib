import { Dayjs } from 'dayjs'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface Entity {
  id: string
}

interface TimestampEntity {
  id: string
  createdAt: Dayjs
  updatedAt: Dayjs
}

interface UserClaims {
  isAppAdmin?: boolean
}

interface UserIdClaims extends UserClaims {
  uid: string
}

interface IdToken extends firebase.auth.IdTokenResult, UserClaims {}

//--------------------------------------------------
//  User
//--------------------------------------------------

enum AuthStatus {
  None = 'None',
  WaitForEmailVerified = 'WaitForEmailVerified',
  WaitForEntry = 'WaitForEntry',
  Available = 'Available',
}

interface UserInfo extends TimestampEntity {
  email: string
  emailVerified: boolean
  isAppAdmin: boolean
  publicProfile: PublicProfile
}

interface PublicProfile extends TimestampEntity {
  displayName: string
  photoURL?: string
}

interface UserInfoInput {
  fullName: string
  displayName: string
}

//--------------------------------------------------
//  Storage
//--------------------------------------------------

enum StorageNodeType {
  File = 'File',
  Dir = 'Dir',
}

enum StorageArticleNodeType {
  ListBundle = 'ListBundle',
  CategoryBundle = 'CategoryBundle',
  ArticleDir = 'ArticleDir',
  CategoryDir = 'CategoryDir',
}

interface StorageNode extends TimestampEntity {
  nodeType: StorageNodeType
  name: string
  dir: string
  path: string
  url: string
  contentType: string
  size: number
  share: StorageNodeShareSettings
  articleNodeType: StorageArticleNodeType | null
  articleSortOrder: number | null
  version: number
}

interface StorageNodeShareSettings {
  isPublic: boolean | null
  readUIds: string[] | null
  writeUIds: string[] | null
}

interface RequiredStorageNodeShareSettings {
  isPublic: boolean
  readUIds: string[]
  writeUIds: string[]
}

interface StorageNodeShareSettingsInput {
  isPublic?: boolean | null
  readUIds?: string[] | null
  writeUIds?: string[] | null
}

interface StorageNodeKeyInput {
  id?: string
  path?: string
}

interface CreateStorageNodeInput extends StorageNodeShareSettingsInput {}

interface CreateArticleDirInput {
  articleNodeType?: StorageArticleNodeType
}

interface SetArticleSortOrderInput {
  insertBeforeNodePath?: string
  insertAfterNodePath?: string
}

//========================================================================
//
//  Exports
//
//========================================================================

export {
  AuthStatus,
  CreateArticleDirInput,
  CreateStorageNodeInput,
  Entity,
  IdToken,
  PublicProfile,
  RequiredStorageNodeShareSettings,
  SetArticleSortOrderInput,
  StorageArticleNodeType,
  StorageNode,
  StorageNodeShareSettings,
  StorageNodeShareSettingsInput,
  StorageNodeKeyInput,
  StorageNodeType,
  TimestampEntity,
  UserClaims,
  UserIdClaims,
  UserInfo,
  UserInfoInput,
}
