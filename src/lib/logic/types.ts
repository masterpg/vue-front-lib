import { APIStorageNode } from './api'
import { Dayjs } from 'dayjs'
import { i18n } from '@/lib/i18n'

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

namespace StorageNodeType {
  export function getLabel(nodeType: StorageNodeType, choice = 1): string {
    switch (nodeType) {
      case StorageNodeType.Dir:
        return String(i18n.tc('common.folder', choice))
      case StorageNodeType.File:
        return String(i18n.tc('common.file', choice))
    }
  }

  export function getIcon(nodeType: StorageNodeType): string {
    switch (nodeType) {
      case StorageNodeType.Dir:
        return 'folder'
      case StorageNodeType.File:
        return 'description'
    }
  }
}

enum StorageArticleNodeType {
  ListBundle = 'ListBundle',
  CategoryBundle = 'CategoryBundle',
  ArticleDir = 'ArticleDir',
  CategoryDir = 'CategoryDir',
}

namespace StorageArticleNodeType {
  export function getLabel(nodeType: StorageArticleNodeType | null, choice = 1): string {
    switch (nodeType) {
      case StorageArticleNodeType.ListBundle:
        return String(i18n.tc('article.nodeType.listBundle', choice))
      case StorageArticleNodeType.CategoryBundle:
        return String(i18n.tc('article.nodeType.categoryBundle', choice))
      case StorageArticleNodeType.CategoryDir:
        return String(i18n.tc('article.nodeType.categoryDir', choice))
      case StorageArticleNodeType.ArticleDir:
        return String(i18n.tc('article.nodeType.articleDir', choice))
      default:
        return ''
    }
  }

  export function getIcon(nodeType: StorageArticleNodeType | null): string {
    switch (nodeType) {
      case StorageArticleNodeType.ListBundle:
        return 'view_headline'
      case StorageArticleNodeType.CategoryBundle:
        return 'subject'
      case StorageArticleNodeType.CategoryDir:
        return 'snippet_folder'
      case StorageArticleNodeType.ArticleDir:
        return 'article'
      default:
        return ''
    }
  }
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

interface StoragePaginationInput {
  maxChunk?: number
  pageToken?: string
}

interface StoragePaginationResult<NODE extends APIStorageNode = APIStorageNode> {
  list: NODE[]
  nextPageToken?: string
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
  StoragePaginationInput,
  StoragePaginationResult,
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
