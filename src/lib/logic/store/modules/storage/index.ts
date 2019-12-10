import * as _path from 'path'
import { StorageModule, StorageNode, StorageNodeForSet, StorageNodeType, StorageState } from '../../types'
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
    const stateNode = this.getStateNode(path)
    if (stateNode) {
      return this.clone(stateNode)
    }
    return undefined
  }

  getDescendants(path: string): StorageNode[] {
    const descendants = this.getStateDescendants(path)
    return descendants.map(descendant => this.clone(descendant))
  }

  getMap(): { [path: string]: StorageNode } {
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

    const stateNodeMap: { [path: string]: StorageNode } = {}
    nodes.forEach(node => {
      const stateNode = this.getStateNode(node.path)
      if (!stateNode) {
        throw new Error(`The specified node was not found: '${node.path}'`)
      }
      stateNodeMap[node.path] = stateNode
    })

    for (const node of nodes) {
      const stateNode = stateNodeMap[node.path]

      if (node.nodeType) stateNode.nodeType = node.nodeType
      if (isString(node.newPath)) {
        stateNode.name = _path.basename(node.newPath!)
        // ｢./｣で始まっている場合は除去
        stateNode.dir = _path.dirname(node.newPath!).replace(/^\.*\/*/, '')
        stateNode.path = node.newPath!
      }

      result.push(this.clone(stateNode))
    }

    this.sort(this.state.all)

    return result
  }

  set(node: StorageNodeForSet, newPath?: string): StorageNode {
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

  rename(path: string, newName: string): StorageNode[] {
    path = removeBothEndsSlash(path)
    const stateNode = this.getStateNode(path)
    if (!stateNode) {
      throw new Error(`The specified node was not found: '${path}'`)
    }

    const result: StorageNode[] = []

    stateNode.name = newName
    stateNode.path = _path.join(stateNode.dir, newName)
    result.push(this.clone(stateNode))

    if (stateNode.nodeType === StorageNodeType.File) {
      return result
    }

    const stateDescendants = this.getStateDescendants(path)
    for (const stateDescendant of stateDescendants) {
      const reg = new RegExp(`^${path}`)
      stateDescendant.dir = stateDescendant.dir.replace(reg, stateNode.path)
      stateDescendant.path = _path.join(stateDescendant.dir, stateDescendant.name)
      result.push(this.clone(stateDescendant))
    }

    this.sort(this.state.all)

    return result
  }

  clone(value: StorageNode): StorageNode {
    return {
      nodeType: value.nodeType,
      name: value.name,
      dir: value.dir,
      path: value.path,
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
    for (const node of this.state.all) {
      if (node.path === path) {
        return node
      }
    }
    return undefined
  }

  protected getStateDescendants(path: string): StorageNode[] {
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
