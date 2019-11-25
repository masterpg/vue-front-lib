import { StorageModule, StorageNode, StorageNodeType, StorageState } from '../../types'
import { BaseModule } from '../../base'
import { Component } from 'vue-property-decorator'
import { NoCache } from '../../../../base/decorators'

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

  clone(value: StorageNode): StorageNode {
    return {
      nodeType: value.nodeType,
      name: value.name,
      dir: value.dir,
      path: value.path,
    }
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
