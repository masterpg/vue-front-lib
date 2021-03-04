import { DeepPartial, DeepReadonly, Entities, pickProps } from 'web-base-lib'
import { TimestampEntity, generateEntityId } from '@/app/services/base/base'
import dayjs from 'dayjs'
import { useI18n } from '@/app/i18n'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface StorageNode extends TimestampEntity {
  nodeType: StorageNodeType
  name: string
  dir: string
  path: string
  url: string
  contentType: string
  size: number
  share: StorageNodeShareSettings
  article?: StorageArticleSettings
  version: number
}

interface APIStorageNode extends Omit<StorageNode, 'url'> {}

interface ArticleTableOfContentsNode extends TimestampEntity {
  type: StorageArticleDirType
  name: string
  dir: string
  path: string
  label: string
}

type StorageNodeType = 'File' | 'Dir'

// eslint-disable-next-line @typescript-eslint/no-redeclare
namespace StorageNodeType {
  export function getLabel(nodeType: StorageNodeType, choice = 1): string {
    const i18n = useI18n()
    switch (nodeType) {
      case 'Dir':
        return String(i18n.tc('common.folder', choice))
      case 'File':
        return String(i18n.tc('common.file', choice))
    }
  }

  export function getIcon(nodeType: StorageNodeType): string {
    switch (nodeType) {
      case 'Dir':
        return 'folder'
      case 'File':
        return 'far fa-file'
    }
  }
}

type StorageArticleDirType = 'ListBundle' | 'TreeBundle' | 'Category' | 'Article'

// eslint-disable-next-line @typescript-eslint/no-redeclare
namespace StorageArticleDirType {
  export function getLabel(nodeType?: StorageArticleDirType, choice = 1): string {
    const i18n = useI18n()
    switch (nodeType) {
      case 'ListBundle':
        return String(i18n.tc('article.nodeType.listBundle', choice))
      case 'TreeBundle':
        return String(i18n.tc('article.nodeType.treeBundle', choice))
      case 'Category':
        return String(i18n.tc('article.nodeType.category', choice))
      case 'Article':
        return String(i18n.tc('article.nodeType.article', choice))
      default:
        return ''
    }
  }

  export function getIcon(nodeType?: StorageArticleDirType): string {
    switch (nodeType) {
      case 'ListBundle':
        return 'fas fa-bars'
      case 'TreeBundle':
        return 'fas fa-stream'
      case 'Category':
        return 'fas fa-list-alt'
      case 'Article':
        return 'fas fa-file-alt'
      default:
        return ''
    }
  }
}

type StorageArticleFileType = 'Master' | 'Draft'

interface StorageNodeShareSettings {
  isPublic: boolean | null
  readUIds: string[] | null
  writeUIds: string[] | null
}

interface StorageArticleSettings {
  dir?: StorageArticleDirSettings
  file?: StorageArticleFileSettings
}

interface StorageArticleDirSettings {
  name: string
  type: StorageArticleDirType
  sortOrder: number
}

interface StorageArticleFileSettings {
  type: StorageArticleFileType
}

interface StoragePaginationInput {
  maxChunk?: number
  pageToken?: string
}

namespace StoragePaginationInput {
  export function squeeze<T extends StoragePaginationInput | undefined>(input?: StoragePaginationInput): T {
    if (!input) return undefined as T
    return pickProps(input, ['maxChunk', 'pageToken']) as T
  }
}

interface StoragePaginationResult<NODE extends DeepReadonly<APIStorageNode> = APIStorageNode> {
  list: NODE[]
  nextPageToken?: string
  isPaginationTimeout: boolean
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

namespace StorageNodeShareSettingsInput {
  export function squeeze<T extends StorageNodeShareSettingsInput | undefined>(input?: StorageNodeShareSettingsInput): T {
    if (!input) return undefined as T
    return pickProps(input, ['isPublic', 'readUIds', 'writeUIds']) as T
  }
}

interface StorageNodeKeyInput {
  id: string
  path: string
}

namespace StorageNodeKeyInput {
  export function squeeze<T extends StorageNodeKeyInput | undefined>(input?: StorageNodeKeyInput): T {
    if (!input) return undefined as T
    return pickProps(input, ['id', 'path']) as T
  }
}

interface StorageNodeGetKeyInput {
  id?: string
  path?: string
}

namespace StorageNodeGetKeyInput {
  export function squeeze<T extends StorageNodeGetKeyInput | undefined>(input?: StorageNodeGetKeyInput): T {
    if (!input) return undefined as T
    return pickProps(input, ['id', 'path']) as T
  }
}

interface StorageNodeGetKeysInput {
  ids?: string[]
  paths?: string[]
}

namespace StorageNodeGetKeysInput {
  export function squeeze<T extends StorageNodeGetKeysInput | undefined>(input?: StorageNodeGetKeysInput): T {
    if (!input) return undefined as T
    return pickProps(input, ['ids', 'paths']) as T
  }
}

interface StorageNodeGetUnderInput {
  id?: string
  path?: string
  includeBase?: boolean
}

namespace StorageNodeGetUnderInput {
  export function squeeze<T extends StorageNodeGetUnderInput | undefined>(input?: StorageNodeGetUnderInput): T {
    if (!input) return undefined as T
    return pickProps(input, ['id', 'path', 'includeBase']) as T
  }
}

interface SignedUploadUrlInput {
  id: string
  path: string
  contentType?: string
}

namespace SignedUploadUrlInput {
  export function squeeze<T extends SignedUploadUrlInput | undefined>(input?: SignedUploadUrlInput): T {
    if (!input) return undefined as T
    return pickProps(input, ['id', 'path', 'contentType']) as T
  }
}

interface CreateStorageNodeOptions {
  share?: StorageNodeShareSettingsInput
}

namespace CreateStorageNodeOptions {
  export function squeeze<T extends CreateStorageNodeOptions | undefined>(options?: CreateStorageNodeOptions): T {
    if (!options) return undefined as T
    return {
      share: StorageNodeShareSettingsInput.squeeze(options.share),
    } as T
  }
}

interface CreateArticleTypeDirInput {
  dir: string
  name: string
  type: StorageArticleDirType
}

namespace CreateArticleTypeDirInput {
  export function squeeze<T extends CreateArticleTypeDirInput | undefined>(input?: CreateArticleTypeDirInput): T {
    if (!input) return undefined as T
    return pickProps(input, ['dir', 'name', 'type']) as T
  }
}

interface SaveArticleSrcMasterFileResult {
  master: StorageNode
  draft: StorageNode
}

interface GetArticleChildrenInput {
  dirPath: string
  types: StorageArticleDirType[]
}

namespace GetArticleChildrenInput {
  export function squeeze<T extends GetArticleChildrenInput | undefined>(input?: GetArticleChildrenInput): T {
    if (!input) return undefined as T
    return pickProps(input, ['dirPath', 'types']) as T
  }
}

type StorageType = 'user' | 'app' | 'article'

interface SortStorageNode extends Pick<StorageNode, 'nodeType' | 'name' | 'dir' | 'path' | 'article'> {}

interface TreeStorageNode<NODE extends SortStorageNode> {
  item: NODE
  parent?: TreeStorageNode<NODE>
  children: TreeStorageNode<NODE>[]
}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace StorageNode {
  export function generateId(): string {
    return generateEntityId(Entities.StorageNodes.Name)
  }

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
    if (from.article) {
      to.article = StorageArticleSettings.populate(from.article, to.article ?? {})
    } else if (from.article === null) {
      to.article = undefined
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

namespace StorageArticleSettings {
  export function populate(from: DeepPartial<DeepReadonly<StorageArticleSettings>>, to: DeepPartial<StorageArticleSettings>): StorageArticleSettings {
    if (from.dir) {
      to.file = undefined
      to.dir = to.dir ?? { name: null as any, type: null as any, sortOrder: null as any }
      if (typeof from.dir.name === 'string') to.dir.name = from.dir.name
      if (typeof from.dir.type === 'string') to.dir.type = from.dir.type
      if (typeof from.dir.sortOrder === 'number') to.dir!.sortOrder = from.dir.sortOrder
      if (to.dir.name === null || to.dir.type === null || to.dir.sortOrder === null) {
        const detail = JSON.stringify(to, null, 2)
        throw new Error(`The required field for 'StorageArticleSettings' has not been set: ${detail}`)
      }
    } else if (from.file) {
      to.dir = undefined
      to.file = to.file ?? { type: null as any }
      if (typeof from.file.type === 'string') to.file.type = from.file.type
      if (to.file.type === null) {
        const detail = JSON.stringify(to, null, 2)
        throw new Error(`The required field for 'StorageArticleSettings' has not been set: ${detail}`)
      }
    }
    return to as StorageArticleSettings
  }

  export function clone<T extends StorageArticleSettings | undefined | null>(source?: T): T {
    if (!source) return source as T
    return populate(source!, {}) as T
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export {
  APIStorageNode,
  ArticleTableOfContentsNode,
  CreateArticleTypeDirInput,
  CreateStorageNodeOptions,
  GetArticleChildrenInput,
  RequiredStorageNodeShareSettings,
  SaveArticleSrcMasterFileResult,
  SignedUploadUrlInput,
  SortStorageNode,
  StorageArticleDirSettings,
  StorageArticleDirType,
  StorageArticleFileSettings,
  StorageArticleFileType,
  StorageArticleSettings,
  StorageNode,
  StorageNodeGetKeyInput,
  StorageNodeGetKeysInput,
  StorageNodeGetUnderInput,
  StorageNodeKeyInput,
  StorageNodeShareSettings,
  StorageNodeShareSettingsInput,
  StorageNodeType,
  StoragePaginationInput,
  StoragePaginationResult,
  StorageType,
  TreeStorageNode,
}
