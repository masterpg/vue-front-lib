import * as _path from 'path'
import { StorageNode, StorageNodeType } from '../../api'
import { arrayToDict, removeBothEndsSlash, removeStartDirChars } from 'web-base-lib'
import { BaseStore } from '../base'
import { Component } from 'vue-property-decorator'
import { NoCache } from '../../../base/decorators'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface StorageStore {
  readonly all: StorageNode[]

  get(key: { id?: string; path?: string }): StorageNode | undefined

  getChildren(dirPath?: string): StorageNode[]

  getDirChildren(dirPath?: string): StorageNode[]

  getDescendants(dirPath?: string): StorageNode[]

  getDirDescendants(dirPath?: string): StorageNode[]

  addList(nodes: StorageNode[]): StorageNode[]

  add(value: StorageNode): StorageNode

  setAll(values: StorageNode[]): void

  setList(nodes: StorageNodeForSet[]): StorageNode[]

  set(node: StorageNodeForSet): StorageNode

  removeList(key: { ids?: string[]; paths?: string[] }): StorageNode[]

  remove(key: { id?: string; path?: string }): StorageNode[]

  move(fromPath: string, toPath: string): StorageNode[]

  rename(path: string, newName: string): StorageNode[]

  clone(value: StorageNode): StorageNode

  clear(): void

  /**
   * ノード配列をディレクトリ階層に従ってソートします。
   * @param values
   */
  sort(values: StorageNode[]): StorageNode[]

  /**
   * ノード配列をディレクトリ階層に従ってソートするための関数です。
   * @param a
   * @param b
   */
  sortFunc(a: StorageNode, b: StorageNode): number
}

type StorageNodeForSet = Partial<Omit<StorageNode, 'nodeType'>> & {
  id: string
  name: string
  dir: string
  path: string
}

interface StorageState {
  all: StorageNode[]
}

//========================================================================
//
//  Implementation
//
//========================================================================

@Component
class StorageStoreImpl extends BaseStore<StorageState> implements StorageStore {
  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  constructor() {
    super()
    this.initState({ all: [] })
  }

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  @NoCache
  get all(): StorageNode[] {
    return this.state.all.map(value => {
      return this.clone(value)
    })
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  get(key: { id?: string; path?: string }): StorageNode | undefined {
    const stateNode = this.getStateNode(key)
    if (stateNode) {
      return this.clone(stateNode)
    }
    return undefined
  }

  getChildren(dirPath?: string): StorageNode[] {
    const children = this.getStateChildren(dirPath)
    return children.map(child => this.clone(child))
  }

  getDirChildren(dirPath?: string): StorageNode[] {
    if (!dirPath) {
      return this.getChildren()
    } else {
      const dirNode = this.get({ path: dirPath })
      let result: StorageNode[] = []
      if (dirNode) {
        result = [dirNode, ...this.getChildren(dirPath)]
      }
      return result
    }
  }

  getDescendants(dirPath?: string): StorageNode[] {
    const descendants = this.getStateDescendants(dirPath)
    return descendants.map(descendant => this.clone(descendant))
  }

  getDirDescendants(dirPath?: string): StorageNode[] {
    if (!dirPath) {
      return this.getDescendants()
    } else {
      const dirNode = this.get({ path: dirPath })
      let result: StorageNode[] = []
      if (dirNode) {
        result = [dirNode, ...this.getDescendants(dirPath)]
      }
      return result
    }
  }

  setAll(nodes: StorageNode[]): void {
    this.state.all = nodes.map(node => {
      return this.clone(node)
    })
    this.sort(this.state.all)
  }

  setList(nodes: StorageNodeForSet[]): StorageNode[] {
    const result: StorageNode[] = []

    for (const node of nodes) {
      // id検索が必要な理由:
      //   他端末でノード移動するとidは変わらないがpathは変化する。
      //   この状況でpath検索を行うと、対象のノードを見つけられないためid検索する必要がある。
      // path検索が必要な理由:
      //   他端末で'd1/d11'を削除してからまた同じパスの'd1/d11'が作成された場合、
      //   元のidと再作成されたidが異なり、パスは同じでもidが異なる状況が発生する。
      //   この場合id検索しても対象ノードが見つからないため、path検索する必要がある。
      const stateNode = this.getStateNode({ id: node.id, path: node.path })
      if (!stateNode) {
        throw new Error(`The specified node was not found: '${node.id}'`)
      }

      stateNode.id = node.id
      stateNode.name = node.name
      stateNode.dir = node.dir
      stateNode.path = node.path
      if (typeof node.contentType === 'string') stateNode.contentType = node.contentType
      if (typeof node.size === 'number') stateNode.size = node.size
      if (node.share) {
        stateNode.share.isPublic = node.share.isPublic
        stateNode.share.readUIds = node.share.readUIds ? [...node.share.readUIds] : null
        stateNode.share.writeUIds = node.share.writeUIds ? [...node.share.writeUIds] : null
      }
      if (typeof node.version === 'number') stateNode.version = node.version
      if (node.createdAt) stateNode.createdAt = node.createdAt
      if (node.updatedAt) stateNode.updatedAt = node.updatedAt

      result.push(this.clone(stateNode))
    }

    this.sort(this.state.all)

    return result
  }

  set(node: StorageNodeForSet): StorageNode {
    return this.setList([node])[0]
  }

  addList(nodes: StorageNode[]): StorageNode[] {
    const addingNodes = nodes.map(node => {
      this.state.all.push(this.clone(node))
      return this.clone(node)
    })

    this.sort(this.state.all)

    return addingNodes
  }

  add(value: StorageNode): StorageNode {
    return this.addList([value])[0]
  }

  removeList(key: { ids?: string[]; paths?: string[] }): StorageNode[] {
    if (!key.ids && !key.paths) {
      throw new Error(`Either the 'ids' or the 'paths' must be specified.`)
    }

    const result: StorageNode[] = []
    if (key.ids) {
      for (const id of key.ids) {
        result.push(...this.remove({ id }))
      }
    } else if (key.paths) {
      for (const path of key.paths) {
        result.push(...this.remove({ path }))
      }
    }

    return result
  }

  remove(key: { id?: string; path?: string }): StorageNode[] {
    const stateNode = this.getStateNode(key)
    if (!stateNode) return []

    const result: StorageNode[] = []
    for (let i = 0; i < this.state.all.length; i++) {
      const node = this.state.all[i]
      if (node.path === stateNode.path || node.dir === stateNode.path || node.dir.startsWith(`${stateNode.path}/`)) {
        this.state.all.splice(i--, 1)
        result.push(node)
      }
    }
    return result
  }

  move(fromNodePath: string, toNodePath: string): StorageNode[] {
    fromNodePath = removeBothEndsSlash(fromNodePath)
    toNodePath = removeBothEndsSlash(toNodePath)

    const targetTopNode = this.getStateNode({ path: fromNodePath })

    if (!targetTopNode) {
      throw new Error(`The specified node was not found: '${fromNodePath}'`)
    }

    if (targetTopNode.nodeType === StorageNodeType.Dir) {
      // 移動先ディレクトリが移動対象のサブディレクトリでないことを確認
      // from: aaa/bbb → to: aaa/bbb/ccc/bbb [NG]
      //               → to: aaa/zzz/ccc/bbb [OK]
      if (toNodePath.startsWith(_path.join(fromNodePath, '/'))) {
        throw new Error(`The destination directory is its own subdirectory: '${fromNodePath}' -> '${toNodePath}'`)
      }
    }

    const result: StorageNode[] = []
    const targetNodes = [targetTopNode, ...this.getStateDescendants(targetTopNode.path)]

    // 移動先の同名ノード＋配下ノードを取得(ない場合もある)
    const existsTopNode = this.getStateNode({ path: toNodePath })
    const existsNodeDict: { [path: string]: StorageNode } = {}
    if (existsTopNode) {
      const existsNodes = [existsTopNode, ...this.getStateDescendants(existsTopNode.path)]
      Object.assign(existsNodeDict, arrayToDict(existsNodes, 'path'))
    }

    // 移動ノード＋配下ノードのパスを移動先パスへ書き換え
    for (const targetNode of targetNodes) {
      const reg = new RegExp(`^${fromNodePath}`)
      const newTargetNodePath = targetNode.path.replace(reg, toNodePath)
      targetNode.name = _path.basename(newTargetNodePath)
      targetNode.dir = removeStartDirChars(_path.dirname(newTargetNodePath))
      targetNode.path = newTargetNodePath
      result.push(this.clone(targetNode))
    }

    // 移動先に同名ノードが存在する場合、そのノードを削除
    for (const targetNode of targetNodes) {
      const existsNode = existsNodeDict[targetNode.path]
      existsNode && this.removeSpecifiedNode({ id: existsNode.id })
    }

    this.sort(this.state.all)

    return result
  }

  rename(path: string, newName: string): StorageNode[] {
    path = removeBothEndsSlash(path)
    const reg = new RegExp(`${_path.basename(path)}$`)
    const toPath = path.replace(reg, newName)
    return this.move(path, toPath)
  }

  clear(): void {
    this.state.all.splice(0)
  }

  clone(value: StorageNode): StorageNode {
    return {
      id: value.id,
      nodeType: value.nodeType,
      name: value.name,
      dir: value.dir,
      path: value.path,
      contentType: value.contentType,
      size: value.size,
      share: {
        isPublic: value.share.isPublic,
        readUIds: value.share.readUIds ? [...value.share.readUIds] : null,
        writeUIds: value.share.writeUIds ? [...value.share.writeUIds] : null,
      },
      version: value.version,
      createdAt: value.createdAt,
      updatedAt: value.updatedAt,
    }
  }

  sort(values: StorageNode[]): StorageNode[] {
    values.sort(this.sortFunc)
    return values
  }

  sortFunc(a: StorageNode, b: StorageNode): number {
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

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  protected getStateNode(key: { id?: string; path?: string }): StorageNode | undefined {
    if (!key.id && !key.path) {
      throw new Error(`Either the 'id' or the 'path' must be specified.`)
    }

    key.path = removeBothEndsSlash(key.path)
    for (const node of this.state.all) {
      if (node.id === key.id) return node
      if (node.path === key.path) return node
    }
    return undefined
  }

  protected getStateChildren(path?: string): StorageNode[] {
    path = removeBothEndsSlash(path)
    const result: StorageNode[] = []
    for (const node of this.state.all) {
      if (node.dir === path) {
        result.push(node)
      }
    }
    return result
  }

  protected getStateDescendants(path?: string): StorageNode[] {
    path = removeBothEndsSlash(path)
    const result: StorageNode[] = []
    for (const node of this.state.all) {
      if (node.dir.startsWith(path)) {
        result.push(node)
      }
    }
    return result
  }

  protected removeSpecifiedNode(key: { id?: string; path?: string }): StorageNode | undefined {
    if (!key.id && !key.path) {
      throw new Error(`Either the 'id' or the 'path' must be specified.`)
    }

    for (let i = 0; i < this.state.all.length; i++) {
      const node = this.state.all[i]
      if (typeof key.id === 'string') {
        if (node.id === key.id) {
          this.state.all.splice(i--, 1)
          return node
        }
      } else if (typeof key.path === 'string') {
        if (node.path === key.path) {
          this.state.all.splice(i--, 1)
          return node
        }
      }
    }

    return undefined
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { StorageNodeForSet, StorageState, StorageStore, StorageStoreImpl }
