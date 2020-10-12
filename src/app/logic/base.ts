import { DeepPartial, removeEndSlash } from 'web-base-lib'
import dayjs, { Dayjs } from 'dayjs'
import { injectConfig } from '@/app/config'
import { useI18n } from '@/app/i18n'

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
    const { tc } = useI18n()
    switch (nodeType) {
      case StorageNodeType.Dir:
        return String(tc('common.folder', choice))
      case StorageNodeType.File:
        return String(tc('common.file', choice))
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
  Category = 'Category',
  Article = 'Article',
}

namespace StorageArticleNodeType {
  export function getLabel(nodeType: StorageArticleNodeType | null, choice = 1): string {
    const { tc } = useI18n()
    switch (nodeType) {
      case StorageArticleNodeType.ListBundle:
        return String(tc('article.nodeType.listBundle', choice))
      case StorageArticleNodeType.CategoryBundle:
        return String(tc('article.nodeType.categoryBundle', choice))
      case StorageArticleNodeType.Category:
        return String(tc('article.nodeType.category', choice))
      case StorageArticleNodeType.Article:
        return String(tc('article.nodeType.article', choice))
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
      case StorageArticleNodeType.Category:
        return 'snippet_folder'
      case StorageArticleNodeType.Article:
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
  articleNodeName: string | null
  articleNodeType: StorageArticleNodeType | null
  articleSortOrder: number | null
  version: number
}

interface APIStorageNode extends Omit<StorageNode, 'url'> {}

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

interface CreateArticleTypeDirInput {
  dir: string
  articleNodeName: string
  articleNodeType: StorageArticleNodeType
}

interface SetArticleSortOrderInput {
  insertBeforeNodePath?: string
  insertAfterNodePath?: string
}

interface SortStorageNode {
  nodeType: StorageNodeType
  name: string
  dir: string
  path: string
  articleSortOrder?: number | null
}

interface SortTreeNode<NODE extends SortStorageNode> {
  item: NODE
  parent?: SortTreeNode<NODE>
  children: SortTreeNode<NODE>[]
}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace UserInfo {
  export function populate(from: DeepPartial<UserInfo>, to: DeepPartial<UserInfo>): UserInfo {
    if (typeof from.id === 'string') to.id = from.id
    if (typeof from.email === 'string') to.email = from.email
    if (typeof from.emailVerified === 'boolean') to.emailVerified = from.emailVerified
    if (typeof from.isAppAdmin === 'boolean') to.isAppAdmin = from.isAppAdmin
    if (dayjs.isDayjs(from.createdAt)) to.createdAt = dayjs(from.createdAt)
    if (dayjs.isDayjs(from.updatedAt)) to.updatedAt = dayjs(from.updatedAt)
    if (from.publicProfile) {
      to.publicProfile = to.publicProfile ?? ({} as any)
      if (typeof from.publicProfile.id === 'string') to.publicProfile!.id = from.publicProfile.id
      if (typeof from.publicProfile.displayName === 'string') to.publicProfile!.displayName = from.publicProfile.displayName
      if (typeof from.publicProfile.photoURL === 'string') to.publicProfile!.photoURL = from.publicProfile.photoURL
      if (dayjs.isDayjs(from.publicProfile.createdAt)) to.publicProfile!.createdAt = dayjs(from.publicProfile.createdAt)
      if (dayjs.isDayjs(from.publicProfile.updatedAt)) to.publicProfile!.updatedAt = dayjs(from.publicProfile.updatedAt)
    }
    return to as UserInfo
  }

  export function clone(source: UserInfo): UserInfo {
    return populate(source, {})
  }
}

/**
 * ノード配列をディレクトリ階層に従ってソートする関数です。
 * ※この関数では記事系ノードを適切にソートすることはできません。
 */
const storageTreeSortFunc = <NODE extends SortStorageNode>(a: NODE, b: NODE) => {
  // ソート用文字列(strA, strB)の説明:
  //   ノードがファイルの場合、同じ階層にあるディレクトリより順位を下げるために
  //   大きな文字コード'0xffff'を付加している。これにより同一階層のファイルと
  //   ディレクトリを比較した際、ファイルの方が文字的に大きいと判断され、下の方へ
  //   配置されることになる。

  let strA = a.path
  let strB = b.path
  if (a.nodeType === StorageNodeType.File) {
    strA = `${a.dir}${String.fromCodePoint(0xffff)}${a.name}`
  }
  if (b.nodeType === StorageNodeType.File) {
    strB = `${b.dir}${String.fromCodePoint(0xffff)}${b.name}`
  }

  return strA < strB ? -1 : strA > strB ? 1 : 0
}

/**
 * ノード配列をディレクトリ階層に従ってソートします。
 * @param nodes
 */
function sortStorageTree<NODE extends SortStorageNode>(nodes: NODE[]): NODE[] {
  nodes.sort(storageTreeSortFunc)

  const topTreeNodes: SortTreeNode<NODE>[] = []
  const treeNodeDict: { [path: string]: SortTreeNode<NODE> } = {}
  for (const node of nodes) {
    const parent = treeNodeDict[node.dir]
    const treeNode: SortTreeNode<NODE> = { item: node, parent, children: [] }
    treeNodeDict[node.path] = treeNode
    if (parent) {
      parent.children.push(treeNode)
    } else {
      topTreeNodes.push(treeNode)
    }
  }

  nodes.splice(0)

  const sort = (treeNodes: SortTreeNode<NODE>[]) => {
    treeNodes.sort((treeNodeA, treeNodeB) => {
      const a = treeNodeA.item
      const b = treeNodeB.item
      if (a.nodeType === b.nodeType) {
        const orderA = a.articleSortOrder || 0
        const orderB = b.articleSortOrder || 0
        if (orderA === orderB) {
          return a.name < b.name ? -1 : a.name > b.name ? 1 : 0
        } else {
          return orderB - orderA
        }
      } else {
        return a.nodeType === StorageNodeType.Dir ? -1 : 1
      }
    })

    for (const treeNode of treeNodes) {
      nodes.push(treeNode.item)
      sort(treeNode.children)
    }
  }

  sort(topTreeNodes)

  return nodes
}

/**
 * ディレクトリの子ノードをソートする関数です。
 */
const storageChildrenSortFunc = <NODE extends SortStorageNode>(a: NODE, b: NODE) => {
  if (a.nodeType === b.nodeType) {
    const orderA = a.articleSortOrder || 0
    const orderB = b.articleSortOrder || 0
    if (orderA === orderB) {
      return a.name < b.name ? -1 : a.name > b.name ? 1 : 0
    } else {
      return orderB - orderA
    }
  } else {
    return a.nodeType === StorageNodeType.Dir ? -1 : 1
  }
}

/**
 * ストレージノードにアクセスするための基準となるURLです。
 */
function getBaseStorageURL(): string {
  const config = injectConfig()
  return `${removeEndSlash(config.api.baseURL)}/storage`
}

/**
 * ストレージノードのアクセス先となるURLを取得します。
 * @param nodeId
 */
function getStorageNodeURL(nodeId: string): string {
  return `${getBaseStorageURL()}/${nodeId}`
}

//========================================================================
//
//  Exports
//
//========================================================================

export {
  APIStorageNode,
  AuthStatus,
  CreateArticleTypeDirInput,
  CreateStorageNodeInput,
  Entity,
  IdToken,
  PublicProfile,
  RequiredStorageNodeShareSettings,
  SetArticleSortOrderInput,
  StorageArticleNodeType,
  StorageNode,
  StorageNodeKeyInput,
  StorageNodeShareSettings,
  StorageNodeShareSettingsInput,
  StorageNodeType,
  StoragePaginationInput,
  StoragePaginationResult,
  TimestampEntity,
  UserClaims,
  UserInfo,
  UserInfoInput,
}
export { SortStorageNode, getBaseStorageURL, getStorageNodeURL, sortStorageTree, storageChildrenSortFunc }
