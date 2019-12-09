import * as _path from 'path'
import { StorageModule, StorageNode, StorageNodeType, StorageState } from '../../types'
import { BaseModule } from '../../base'
import { Component } from 'vue-property-decorator'
import { NoCache } from '../../../../base/decorators'
import { removeBothEndsSlash } from 'web-base-lib'
const isString = require('lodash/isString')

@Component
export class StorageModuleImpl extends BaseModule<StorageState> implements StorageModule {
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
    for (const node of this.state.all) {
      if (node.path === path) {
        return node
      }
    }
    return undefined
  }

  getDescendants(path: string): StorageNode[] {
    path = removeBothEndsSlash(path)
    const result: StorageNode[] = []
    for (const node of this.state.all) {
      if (node.dir.startsWith(path)) {
        result.push(node)
      }
    }
    return result
  }

  getMap(): { [path: string]: StorageNode } {
    const result: { [path: string]: StorageNode } = {}
    for (const node of this.state.all) {
      result[node.path] = this.clone(node)
    }
    return result
  }

  add(value: StorageNode): StorageNode {
    return this.addList([value])[0]
  }

  addList(nodes: StorageNode[]): StorageNode[] {
    const addingNodes = nodes.map(node => {
      return this.clone(node)
    })
    this.state.all.push(...addingNodes)
    this.sort(this.state.all)
    return addingNodes
  }

  setAll(nodes: StorageNode[]): void {
    this.state.all = nodes.map(node => {
      return this.clone(node)
    })
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

  rename(path: string, newName: string): StorageNode[] {
    path = removeBothEndsSlash(path)
    const target = this.get(path)
    if (!target) {
      throw new Error(`The specified node was not found: '${path}'`)
    }

    const result: StorageNode[] = []

    target.name = newName
    target.path = _path.join(target.dir, newName)
    result.push(this.clone(target))

    if (target.nodeType === StorageNodeType.File) {
      return result
    }

    const descendants = this.getDescendants(path)
    for (const descendant of descendants) {
      const reg = new RegExp(`^${path}`)
      descendant.dir = descendant.dir.replace(reg, target.path)
      descendant.path = _path.join(descendant.dir, descendant.name)
      result.push(this.clone(descendant))
    }

    return result
  }

  set(node: Partial<Omit<StorageNode, 'path'>> & { path: string }, newPath?: string): StorageNode {
    const target = this.get(node.path)
    if (!target) {
      throw new Error(`The specified node was not found: '${node.path}'`)
    }

    if (node.nodeType) target.nodeType = node.nodeType
    if (isString(node.name)) target.name = node.name!
    if (isString(node.dir)) target.dir = node.dir!
    if (isString(newPath)) target.path = newPath!

    return this.clone(target)
  }

  clone(value: StorageNode): StorageNode {
    return {
      nodeType: value.nodeType,
      name: value.name,
      dir: value.dir,
      path: value.path,
    }
  }

  sort(values: StorageNode[]): void {
    values.sort(this.sortFunc)
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
}
