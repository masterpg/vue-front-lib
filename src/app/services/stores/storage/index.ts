import { ComputedRef, computed, reactive } from '@vue/composition-api'
import { DeepReadonly, arrayToDict, removeBothEndsSlash, removeStartDirChars, splitHierarchicalPaths } from 'web-base-lib'
import { StorageNode, StorageNodeGetKeyInput, StorageNodeGetKeysInput, StorageNodeGetUnderInput } from '@/app/services/base'
import { StorageHelper } from '@/app/services/helpers'
import _path from 'path'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface StorageStore {
  readonly all: ComputedRef<DeepReadonly<StorageNode>[]>

  get(key: StorageNodeGetKeyInput): StorageNode | undefined

  getList(keys: StorageNodeGetKeysInput): StorageNode[]

  getDescendants(key: StorageNodeGetUnderInput): StorageNode[]

  getChildren(key: StorageNodeGetUnderInput): StorageNode[]

  getHierarchical(targetPath: string): StorageNode[]

  getAncestors(targetPath: string): StorageNode[]

  add(node: StorageNode): StorageNode

  addList(nodes: StorageNode[]): StorageNode[]

  set(node: StorageNodeForSet): StorageNode

  setList(nodes: StorageNodeForSet[]): StorageNode[]

  setAll(nodes: StorageNode[]): void

  remove(key: StorageNodeGetKeyInput): StorageNode[]

  removeList(keys: StorageNodeGetKeysInput): StorageNode[]

  removeAll(): StorageNode[]

  move(fromPath: string, toPath: string): StorageNode[]

  rename(path: string, newName: string): StorageNode[]

  sort(): void
}

type StorageNodeForSet = DeepReadonly<
  Partial<Omit<StorageNode, 'nodeType'>> & {
    id: string
    name: string
    dir: string
    path: string
  }
>

interface StorageState {
  all: StorageNode[]
}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace StorageStore {
  export function newInstance(): StorageStore {
    return newRawInstance()
  }

  export function newRawInstance() {
    //----------------------------------------------------------------------
    //
    //  Variables
    //
    //----------------------------------------------------------------------

    const state = reactive({
      all: [],
    } as StorageState)

    //----------------------------------------------------------------------
    //
    //  Properties
    //
    //----------------------------------------------------------------------

    const all = computed(() => [...state.all])

    //----------------------------------------------------------------------
    //
    //  Methods
    //
    //----------------------------------------------------------------------

    const get: StorageStore['get'] = key => {
      const stateNode = getStateNode(key)
      return StorageNode.clone(stateNode)
    }

    const getList: StorageStore['getList'] = keys => {
      const idDict: { [id: string]: StorageNode } = {}
      const pathDict: { [path: string]: StorageNode } = {}
      all.value.forEach(node => {
        idDict[node.id] = node
        pathDict[node.path] = node
      })

      const stateNodes: StorageNode[] = []
      ;(keys.ids ?? []).forEach(id => {
        idDict[id] && stateNodes.push(idDict[id])
      })
      ;(keys.paths ?? []).forEach(path => {
        pathDict[path] && stateNodes.push(pathDict[path])
      })

      return StorageNode.clone(stateNodes)
    }

    const getDescendants: StorageStore['getDescendants'] = key => {
      const descendants = getStateDescendants(key)
      return descendants.map(descendant => StorageNode.clone(descendant))
    }

    const getChildren: StorageStore['getChildren'] = key => {
      const children = getStateChildren(key)
      return children.map(child => StorageNode.clone(child))
    }

    const getHierarchical: StorageStore['getHierarchical'] = targetPath => {
      const result: StorageNode[] = []
      const nodePaths = splitHierarchicalPaths(targetPath)
      for (const nodePath of nodePaths) {
        const node = get({ path: nodePath })
        node && result.push(node)
      }
      return result
    }

    const getAncestors: StorageStore['getAncestors'] = targetPath => {
      const result: StorageNode[] = []
      const nodePaths = splitHierarchicalPaths(targetPath).filter(nodePath => nodePath !== targetPath)
      for (const nodePath of nodePaths) {
        const node = get({ path: nodePath })
        node && result.push(node)
      }
      return result
    }

    const set: StorageStore['set'] = node => {
      // id検索が必要な理由:
      //   他端末でノード移動するとidは変わらないがpathは変化する。
      //   この状況でpath検索を行うと、対象のノードを見つけられないためid検索する必要がある。
      // path検索が必要な理由:
      //   他端末で'd1/d11'を削除してからまた同じパスの'd1/d11'が作成された場合、
      //   元のidと再作成されたidが異なり、パスは同じでもidが異なる状況が発生する。
      //   この場合id検索しても対象ノードが見つからないため、path検索する必要がある。
      const stateNode = getStateNode({ id: node.id, path: node.path })
      if (!stateNode) {
        throw new Error(`The specified node was not found: '${node.id}'`)
      }

      return StorageNode.clone(StorageNode.populate(node, stateNode))
    }

    const setList: StorageStore['setList'] = nodes => {
      return nodes.map(node => set(node))
    }

    const setAll: StorageStore['setAll'] = nodes => {
      removeAll()
      for (const node of nodes) {
        state.all.push(StorageNode.clone(node))
      }
    }

    const add: StorageStore['add'] = node => {
      const stateNode = StorageNode.clone(node)
      state.all.push(stateNode)
      return StorageNode.clone(stateNode)
    }

    const addList: StorageStore['addList'] = nodes => {
      return nodes.map(node => add(node))
    }

    const remove: StorageStore['remove'] = key => {
      const stateNode = getStateNode(key)
      if (!stateNode) return []

      const result: StorageNode[] = []
      for (let i = 0; i < state.all.length; i++) {
        const node = state.all[i]
        if (node.path === stateNode.path || node.path.startsWith(`${stateNode.path}/`)) {
          state.all.splice(i--, 1)
          result.push(node)
        }
      }
      return StorageNode.clone(result)
    }

    const removeList: StorageStore['removeList'] = keys => {
      if (!keys.ids && !keys.paths) {
        throw new Error(`Either 'ids' or 'paths' must be specified.`)
      }

      const result: StorageNode[] = []
      if (keys.ids) {
        for (const id of keys.ids) {
          result.push(...remove({ id }))
        }
      } else if (keys.paths) {
        for (const path of keys.paths) {
          result.push(...remove({ path }))
        }
      }

      return result
    }

    const removeAll: StorageStore['removeAll'] = () => {
      return state.all.splice(0)
    }

    const move: StorageStore['move'] = (fromPath, toPath) => {
      fromPath = removeBothEndsSlash(fromPath)
      toPath = removeBothEndsSlash(toPath)

      const targetTopNode = getStateNode({ path: fromPath })

      if (!targetTopNode) {
        throw new Error(`The specified node was not found: '${fromPath}'`)
      }

      if (targetTopNode.nodeType === 'Dir') {
        // 移動先ディレクトリが移動対象のサブディレクトリでないことを確認
        // from: aaa/bbb → to: aaa/bbb/ccc/bbb [NG]
        //               → to: aaa/zzz/ccc/bbb [OK]
        if (toPath.startsWith(_path.join(fromPath, '/'))) {
          throw new Error(`The destination directory is its own subdirectory: '${fromPath}' -> '${toPath}'`)
        }
      }

      const result: StorageNode[] = []
      const targetNodes = [targetTopNode, ...getStateDescendants({ path: targetTopNode.path })]

      // 移動先の同名ノード＋配下ノードを取得(ない場合もある)
      const existsTopNode = getStateNode({ path: toPath })
      const existsNodeDict: { [path: string]: StorageNode } = {}
      if (existsTopNode) {
        const existsNodes = [existsTopNode, ...getStateDescendants({ path: existsTopNode.path })]
        Object.assign(existsNodeDict, arrayToDict(existsNodes, 'path'))
      }

      // 移動ノード＋配下ノードのパスを移動先パスへ書き換え
      for (const targetNode of targetNodes) {
        const reg = new RegExp(`^${fromPath}`)
        const newTargetNodePath = targetNode.path.replace(reg, toPath)
        targetNode.name = _path.basename(newTargetNodePath)
        targetNode.dir = removeStartDirChars(_path.dirname(newTargetNodePath))
        targetNode.path = newTargetNodePath
        result.push(StorageNode.clone(targetNode))
      }

      // 移動先に同名ノードが存在する場合、そのノードを削除
      for (const targetNode of targetNodes) {
        const existsNode = existsNodeDict[targetNode.path]
        existsNode && removeSpecifiedNode({ id: existsNode.id })
      }

      return result
    }

    const rename: StorageStore['rename'] = (path, newName) => {
      path = removeBothEndsSlash(path)
      const reg = new RegExp(`${_path.basename(path)}$`)
      const toPath = path.replace(reg, newName)
      return move(path, toPath)
    }

    const sort: StorageStore['sort'] = () => {
      StorageHelper.sortNodes(state.all)
    }

    //----------------------------------------------------------------------
    //
    //  Internal methods
    //
    //----------------------------------------------------------------------

    function getStateNode({ id, path }: StorageNodeGetKeyInput): StorageNode | undefined {
      if (!id && typeof path !== 'string') {
        return undefined
      }

      if (typeof path === 'string') {
        path = removeBothEndsSlash(path)
      }
      for (const node of state.all) {
        if (id && node.id === id) return node
        if (typeof path === 'string' && node.path === path) return node
      }
      return undefined
    }

    function getStateDescendants(key: StorageNodeGetUnderInput): StorageNode[] {
      if (!key.id && typeof key.path !== 'string') {
        throw new Error(`Either 'id' or 'path' must be specified.`)
      }

      let path = removeBothEndsSlash(key.path)
      if (key.id) {
        const node = getStateNode({ id: key.id })
        node && (path = node.path)
      }
      if (path === '') return state.all

      const result: StorageNode[] = []
      for (const node of state.all) {
        if (key.includeBase && node.path === path) {
          result.push(node)
          continue
        }
        if (node.dir === path || node.dir.startsWith(`${path}/`)) {
          result.push(node)
        }
      }
      return result
    }

    function getStateChildren(key: StorageNodeGetUnderInput): StorageNode[] {
      if (!key.id && typeof key.path !== 'string') {
        throw new Error(`Either 'id' or 'path' must be specified.`)
      }

      let path = removeBothEndsSlash(key.path)
      if (key.id) {
        const node = getStateNode({ id: key.id })
        node && (path = node.path)
      }

      const result: StorageNode[] = []
      for (const node of state.all) {
        if (key.includeBase && node.path === path) {
          result.push(node)
          continue
        }
        if (node.dir === path) {
          result.push(node)
        }
      }
      return result
    }

    function removeSpecifiedNode(key: StorageNodeGetKeyInput): StorageNode | undefined {
      if (!key.id && !key.path) {
        throw new Error(`Either 'id' or 'path' must be specified.`)
      }

      for (let i = 0; i < state.all.length; i++) {
        const node = state.all[i]
        if (typeof key.id === 'string') {
          if (node.id === key.id) {
            state.all.splice(i--, 1)
            return node
          }
        } else if (typeof key.path === 'string') {
          if (node.path === key.path) {
            state.all.splice(i--, 1)
            return node
          }
        }
      }

      return undefined
    }

    //----------------------------------------------------------------------
    //
    //  Result
    //
    //----------------------------------------------------------------------

    return {
      all,
      get,
      getList,
      getChildren,
      getDescendants,
      getHierarchical,
      getAncestors,
      add,
      addList,
      set,
      setList,
      setAll,
      remove,
      removeList,
      removeAll,
      move,
      rename,
      sort,
      state,
    }
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { StorageNodeForSet, StorageStore }
