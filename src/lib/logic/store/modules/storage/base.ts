import * as _path from 'path'
import { StorageNode, StorageNodeType } from '../../../api'
import { StorageNodeForSet, StorageState, StorageStore } from '../../types'
import { removeBothEndsSlash, removeStartDirChars } from 'web-base-lib'
import { BaseStore } from '../../base'
import { NoCache } from '../../../../base/decorators'

export abstract class BaseStorageStore extends BaseStore<StorageState> implements StorageStore {
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

  get(path: string): StorageNode | undefined {
    const stateNode = this.getStateNode(path)
    if (stateNode) {
      return this.clone(stateNode)
    }
    return undefined
  }

  getById(id: string): StorageNode | undefined {
    const stateNode = this.getStateNodeById(id)
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
      const dirNode = this.get(dirPath)
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
      const dirNode = this.get(dirPath)
      let result: StorageNode[] = []
      if (dirNode) {
        result = [dirNode, ...this.getDescendants(dirPath)]
      }
      return result
    }
  }

  getDict(): { [path: string]: StorageNode } {
    const result: { [path: string]: StorageNode } = {}
    for (const node of this.state.all) {
      result[node.path] = this.clone(node)
    }
    return result
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
      const stateNode = this.getStateNodeById(node.id)
      if (!stateNode) {
        throw new Error(`The specified node was not found: '${node.id}'`)
      }

      if (typeof node.name === 'string') stateNode.name = node.name
      if (typeof node.dir === 'string') stateNode.dir = node.dir
      if (typeof node.path === 'string') stateNode.path = node.path
      if (typeof node.contentType === 'string') stateNode.contentType = node.contentType
      if (typeof node.size === 'number') stateNode.size = node.size
      if (node.share) {
        stateNode.share.isPublic = node.share.isPublic
        stateNode.share.uids = node.share.uids
      }
      if (node.created) stateNode.created = node.created
      if (node.updated) stateNode.updated = node.updated

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

  removeList(paths: string[]): StorageNode[] {
    const result: StorageNode[] = []
    for (const path of paths) {
      for (let i = 0; i < this.state.all.length; i++) {
        const node = this.state.all[i]
        if (node.path === path || node.dir.startsWith(path)) {
          this.state.all.splice(i--, 1)
          result.push(node)
        }
      }
    }
    return result
  }

  remove(path: string): StorageNode[] {
    const result: StorageNode[] = []
    for (let i = 0; i < this.state.all.length; i++) {
      const node = this.state.all[i]
      if (node.path === path || node.dir.startsWith(path)) {
        this.state.all.splice(i--, 1)
        result.push(node)
      }
    }
    return result
  }

  move(fromPath, toPath: string): StorageNode[] {
    fromPath = removeBothEndsSlash(fromPath)
    toPath = removeBothEndsSlash(toPath)
    const stateTarget = this.getStateNode(fromPath)
    if (!stateTarget) {
      throw new Error(`The specified node was not found: '${fromPath}'`)
    }

    if (stateTarget.nodeType === StorageNodeType.Dir) {
      // 移動先ディレクトリが移動対象のサブディレクトリでないことを確認
      // from: aaa/bbb → to: aaa/bbb/ccc/bbb [NG]
      //               → to: aaa/zzz/ccc/bbb [OK]
      if (toPath.startsWith(_path.join(fromPath, '/'))) {
        throw new Error(`The destination directory is its own subdirectory: '${fromPath}' -> '${toPath}'`)
      }
    }

    const result: StorageNode[] = []

    // 移動先ノードを取得
    // (移動先ディレクトリに移動対象と同名のノードが既に存在することがあるので)
    const existsNode = this.getStateNode(toPath)

    // 移動先ディレクトリに移動対象と同名のノードが既に存在する場合
    if (existsNode) {
      // 既存ノードを削除
      this.state.all.splice(this.state.all.indexOf(existsNode), 1)
      // 移動先と移動対象の同名の子ノードを検索
      const existsChildDict = this.getStateChildren(existsNode.path).reduce(
        (result, node) => {
          result[node.path] = node
          return result
        },
        {} as { [path: string]: StorageNode }
      )
      const removingChildPaths: string[] = []
      for (const targetChild of this.getStateChildren(fromPath)) {
        const reg = new RegExp(`^${fromPath}`)
        const existsChildPath = targetChild.path.replace(reg, toPath)
        if (existsChildDict[existsChildPath]) {
          removingChildPaths.push(existsChildPath)
        }
      }
      // 検索された子ノードを削除
      // (同名の子ノードがあった場合、移動対象の子ノードを優先し、移動先の子ノードは削除)
      this.removeList(removingChildPaths)
    }

    // 移動対象ノードのパスを移動先パスへ書き換え
    stateTarget.name = _path.basename(toPath)
    stateTarget.dir = removeStartDirChars(_path.dirname(toPath))
    stateTarget.path = toPath
    result.push(this.clone(stateTarget))

    // 移動対象ノードの子孫のパスを移動先パスへ書き換え
    if (stateTarget.nodeType === StorageNodeType.Dir) {
      const stateTargetDescendants = this.getStateDescendants(fromPath)
      for (const stateDescendant of stateTargetDescendants) {
        const reg = new RegExp(`^${fromPath}`)
        stateDescendant.dir = stateDescendant.dir.replace(reg, stateTarget.path)
        stateDescendant.path = _path.join(stateDescendant.dir, stateDescendant.name)
        result.push(this.clone(stateDescendant))
      }
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
        uids: value.share.uids ? [...value.share.uids] : undefined,
      },
      created: value.created,
      updated: value.updated,
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

    if (strA < strB) {
      return -1
    } else if (strA > strB) {
      return 1
    } else {
      return 0
    }
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  protected getStateNode(path: string): StorageNode | undefined {
    path = removeBothEndsSlash(path)
    for (const node of this.state.all) {
      if (node.path === path) return node
    }
    return undefined
  }

  protected getStateNodeById(id: string): StorageNode | undefined {
    for (const node of this.state.all) {
      if (node.id === id) return node
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
}
