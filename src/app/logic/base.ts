import { DeepPartial, DeepReadonly } from 'web-base-lib'
import { Entity, OmitEntityTimestamp } from '@/firestore-ex'
import dayjs, { Dayjs } from 'dayjs'
import { useI18n } from '@/app/i18n'

//========================================================================
//
//  Interfaces
//
//========================================================================

type TimestampEntity<T = {}> = Entity &
  OmitEntityTimestamp<T> & {
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
        return 'far fa-file'
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
        return 'fas fa-bars'
      case StorageArticleNodeType.CategoryBundle:
        return 'fas fa-stream'
      case StorageArticleNodeType.Category:
        return 'fas fa-list-alt'
      case StorageArticleNodeType.Article:
        return 'fas fa-file-alt'
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
  isArticleFile: boolean
  version: number
}

interface APIStorageNode extends Omit<StorageNode, 'url'> {}

interface StoragePaginationInput {
  maxChunk?: number
  pageToken?: string
}

interface StoragePaginationResult<NODE extends DeepReadonly<APIStorageNode> = APIStorageNode> {
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

interface StorageNodeKeysInput {
  ids?: string[]
  paths?: string[]
}

interface CreateStorageNodeInput extends StorageNodeShareSettingsInput {}

interface CreateArticleTypeDirInput {
  dir: string
  articleNodeName: string
  articleNodeType: StorageArticleNodeType
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

async function getIdToken(): Promise<string> {
  const currentUser = firebase.auth().currentUser
  if (currentUser) {
    return await currentUser.getIdToken()
  } else {
    return ''
  }
}

async function sgetIdToken(): Promise<string> {
  const idToken = getIdToken()
  if (!idToken) throw new Error('Not signed in.')
  return idToken
}

namespace UserInfo {
  export function populate(from: DeepPartial<DeepReadonly<UserInfo>>, to: DeepPartial<UserInfo>): UserInfo {
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

  export function clone(source: DeepReadonly<UserInfo>): UserInfo {
    return populate(source, {})
  }
}

namespace StorageNode {
  export function populate(from: DeepPartial<DeepReadonly<StorageNode>>, to: DeepPartial<StorageNode>): StorageNode {
    if (typeof from.id === 'string') to.id = from.id
    if (typeof from.nodeType === 'string') to.nodeType = from.nodeType
    if (typeof from.name === 'string') to.name = from.name
    if (typeof from.dir === 'string') to.dir = from.dir
    if (typeof from.path === 'string') to.path = from.path
    if (typeof from.url === 'string') to.url = from.url
    if (typeof from.contentType === 'string') to.contentType = from.contentType
    if (typeof from.size === 'number') to.size = from.size
    if (from.share) {
      to.share = to.share ?? { isPublic: null, readUIds: null, writeUIds: null }
      if (typeof from.share.isPublic === 'boolean' || from.share.isPublic === null) {
        to.share.isPublic = from.share.isPublic
      }
      if (Array.isArray(from.share.readUIds) || from.share.readUIds === null) {
        to.share!.readUIds = from.share.readUIds
      }
      if (Array.isArray(from.share.writeUIds) || from.share.writeUIds === null) {
        to.share!.writeUIds = from.share.writeUIds
      }
    }
    if (typeof from.articleNodeName === 'string' || from.articleNodeName === null) {
      to.articleNodeName = from.articleNodeName
    }
    if (typeof from.articleNodeType === 'string' || from.articleNodeType === null) {
      to.articleNodeType = from.articleNodeType
    }
    if (typeof from.articleSortOrder === 'number' || from.articleSortOrder === null) {
      to.articleSortOrder = from.articleSortOrder
    }
    if (typeof from.isArticleFile === 'boolean') {
      to.isArticleFile = from.isArticleFile
    }
    if (typeof from.version === 'number') to.version = from.version
    if (dayjs.isDayjs(from.createdAt)) to.createdAt = from.createdAt
    if (dayjs.isDayjs(from.updatedAt)) to.updatedAt = from.updatedAt
    return to as StorageNode
  }

  export function clone<T extends StorageNode | StorageNode[] | undefined | null>(source?: DeepReadonly<T>): T {
    if (!source) return source as T
    if (Array.isArray(source)) {
      const list = source as DeepReadonly<StorageNode>[]
      return list.map(item => clone(item)) as T
    } else {
      const item = source as DeepReadonly<StorageNode>
      return populate(item, {}) as T
    }
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
  IdToken,
  PublicProfile,
  RequiredStorageNodeShareSettings,
  StorageArticleNodeType,
  StorageNode,
  StorageNodeKeyInput,
  StorageNodeKeysInput,
  StorageNodeShareSettings,
  StorageNodeShareSettingsInput,
  StorageNodeType,
  StoragePaginationInput,
  StoragePaginationResult,
  TimestampEntity,
  UserClaims,
  UserInfo,
  UserInfoInput,
  getIdToken,
  sgetIdToken,
}
export { SortStorageNode, sortStorageTree, storageChildrenSortFunc }
