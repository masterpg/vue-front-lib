import * as path from 'path'
import { RequiredStorageNodeShareSettings, StorageNode, StorageNodeType } from '../../../types'
import { StorageDownloader, StorageFileDownloader, StorageFileDownloaderType } from '../download'
import { getBaseStorageURL, sortStorageNodes } from '../../../base'
import { removeBothEndsSlash, removeStartDirChars } from 'web-base-lib'
import { StorageNodeShareSettingsInput } from '../../../api'
import { StorageUploader } from '../upload'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface StorageLogic {
  readonly basePath: string

  readonly nodes: StorageNode[]

  getNode(key: { id?: string; path?: string }): StorageNode | undefined

  getDirDescendants(dirPath: string): StorageNode[]

  getDescendants(dirPath?: string): StorageNode[]

  getDirChildren(dirPath: string): StorageNode[]

  getChildren(dirPath?: string): StorageNode[]

  getHierarchicalNodes(nodePath: string): StorageNode[]

  getInheritedShare(nodePath: string): RequiredStorageNodeShareSettings

  fetchHierarchicalNodes(nodePath: string): Promise<StorageNode[]>

  fetchAncestorDirs(nodePath: string): Promise<StorageNode[]>

  fetchDirDescendants(dirPath?: string): Promise<StorageNode[]>

  fetchDescendants(dirPath?: string): Promise<StorageNode[]>

  fetchDirChildren(dirPath?: string): Promise<StorageNode[]>

  fetchChildren(dirPath?: string): Promise<StorageNode[]>

  fetchHierarchicalDescendants(dirPath?: string): Promise<StorageNode[]>

  fetchHierarchicalChildren(dirPath?: string): Promise<StorageNode[]>

  createDirs(dirPaths: string[]): Promise<StorageNode[]>

  removeDir(dirPath: string): Promise<void>

  removeFile(filePath: string): Promise<void>

  moveDir(fromDirPath: string, toDirPath: string): Promise<StorageNode[]>

  moveFile(fromFilePath: string, toFilePath: string): Promise<StorageNode>

  renameDir(dirPath: string, newName: string): Promise<StorageNode[]>

  renameFile(filePath: string, newName: string): Promise<StorageNode>

  setDirShareSettings(dirPath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode>

  setFileShareSettings(filePath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode>

  newUploader(owner: Element): StorageUploader

  newDownloader(): StorageDownloader

  newUrlUploader(owner: Element): StorageUploader

  newFileDownloader(type: StorageFileDownloaderType, filePath: string): StorageFileDownloader

  handleUploadedFileAPI(filePath: string): Promise<StorageNode>
}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace StorageLogic {
  /**
   * ストレージノードにアクセスするための基準となるURLです。
   */
  export function getBaseURL(): string {
    return getBaseStorageURL()
  }

  /**
   * ノードのパスをフルパスに変換します。
   * @param basePath
   * @param node
   */
  export function toFullPathNode<NODE extends StorageNode | undefined>(basePath: string, node: NODE): NODE {
    if (!node) return node
    return {
      ...node,
      dir: toFullNodePath(basePath, node.dir),
      path: toFullNodePath(basePath, node.path),
    }
  }

  /**
   * ノードのパスをフルパスに変換します。
   * @param basePath
   * @param nodes
   */
  export function toFullPathNodes(basePath: string, nodes: StorageNode[]): StorageNode[] {
    return nodes.map(node => toFullPathNode(basePath, node))
  }

  /**
   * ノードのパスをベースパスを基準に変換します。
   * @param basePath
   * @param node
   */
  export function toBasePathNode<NODE extends StorageNode | undefined>(basePath: string, node: NODE): NODE {
    if (!node) return node
    return {
      ...node,
      dir: toBaseNodePath(basePath, node.dir),
      path: toBaseNodePath(basePath, node.path),
    }
  }

  /**
   * ノードのパスをベースパスを基準に変換します。
   * @param basePath
   * @param nodes
   */
  export function toBasePathNodes(basePath: string, nodes: StorageNode[]): StorageNode[] {
    basePath = removeBothEndsSlash(basePath)
    const result: StorageNode[] = []
    for (const node of nodes) {
      if (node.path.startsWith(`${basePath}/`)) {
        result.push(toBasePathNode(basePath, node))
      }
    }
    return result
  }

  /**
   * ノードパスをフルパスに変換します。
   * @param basePath
   * @param nodePath
   */
  export function toFullNodePath(basePath: string, nodePath?: string): string {
    basePath = removeBothEndsSlash(basePath)
    nodePath = removeBothEndsSlash(nodePath)
    return path.join(basePath, nodePath)
  }

  /**
   * ノードパスをフルパスに変換します。
   * @param basePath
   * @param nodePaths
   */
  export function toFullNodePaths(basePath: string, nodePaths: string[]): string[] {
    return nodePaths.map(nodePath => toFullNodePath(basePath, nodePath))
  }

  /**
   * ノードパスをベースパスを基準に変換します。
   * @param basePath
   * @param nodePath
   */
  export function toBaseNodePath(basePath: string, nodePath?: string): string {
    basePath = removeBothEndsSlash(basePath)
    nodePath = removeBothEndsSlash(nodePath)
    const basePathReg = new RegExp(`^${basePath}`)
    return removeStartDirChars(nodePath.replace(basePathReg, ''))
  }

  /**
   * ノードパスをベースパスを基準に変換します。
   * @param basePath
   * @param nodePaths
   */
  export function toBaseNodePaths(basePath: string, nodePaths: string[]): string[] {
    return nodePaths.map(nodePath => toBaseNodePath(basePath, nodePath))
  }

  /**
   * ノード配列をディレクトリ階層に従ってソートします。
   * @param nodes
   */
  export function sortNodes<NODE extends { nodeType: StorageNodeType; name: string; dir: string; path: string }>(nodes: NODE[]): NODE[] {
    return sortStorageNodes(nodes)
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { StorageLogic }
