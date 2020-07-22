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

interface StorageNode extends TimestampEntity {
  nodeType: StorageNodeType
  name: string
  dir: string
  path: string
  url: string
  contentType: string
  size: number
  share: StorageNodeShareSettings
  docBundleType: StorageDocBundleType | null
  isDoc: boolean | null
  docSortOrder: number | null
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

enum StorageNodeType {
  File = 'File',
  Dir = 'Dir',
}

enum StorageDocBundleType {
  List = 'List',
  Category = 'Category',
}

//========================================================================
//
//  Exports
//
//========================================================================

export {
  AuthStatus,
  Entity,
  IdToken,
  PublicProfile,
  RequiredStorageNodeShareSettings,
  StorageNode,
  StorageNodeShareSettings,
  StorageNodeType,
  TimestampEntity,
  UserClaims,
  UserIdClaims,
  UserInfo,
  UserInfoInput,
}
