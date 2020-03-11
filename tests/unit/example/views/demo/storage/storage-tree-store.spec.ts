import * as shortid from 'shortid'
import * as td from 'testdouble'
import { CompTreeNode, CompTreeView, StorageLogic, StorageNode, StorageNodeType } from '@/lib'
import { StorageTreeStore, newStorageTreeStore } from '@/example/views/demo/storage/storage-tree-store'
import { StorageNodeShareSettings } from '@/lib'
import dayjs from 'dayjs'
import { i18n } from '@/example/i18n'
import { initExampleTest } from '../../../../../helpers/example/init'
import { logic } from '@/example/logic'
import { mount } from '@vue/test-utils'
const cloneDeep = require('lodash/cloneDeep')

//========================================================================
//
//  Test data
//
//========================================================================

const EMPTY_SHARE_SETTINGS: StorageNodeShareSettings = {
  isPublic: false,
  uids: [],
}

const d1: StorageNode = {
  id: shortid.generate(),
  nodeType: StorageNodeType.Dir,
  name: 'd1',
  dir: '',
  path: 'd1',
  contentType: '',
  size: 0,
  share: cloneDeep(EMPTY_SHARE_SETTINGS),
  created: dayjs(),
  updated: dayjs(),
}

const d11: StorageNode = {
  id: shortid.generate(),
  nodeType: StorageNodeType.Dir,
  name: 'd11',
  dir: 'd1',
  path: 'd1/d11',
  contentType: '',
  size: 0,
  share: cloneDeep(EMPTY_SHARE_SETTINGS),
  created: dayjs(),
  updated: dayjs(),
}

const f111: StorageNode = {
  id: shortid.generate(),
  nodeType: StorageNodeType.File,
  name: 'f111.txt',
  dir: 'd1/d11',
  path: 'd1/d11/f111.txt',
  contentType: 'text/plain; charset=utf-8',
  size: 5,
  share: cloneDeep(EMPTY_SHARE_SETTINGS),
  created: dayjs(),
  updated: dayjs(),
}

const d12: StorageNode = {
  id: shortid.generate(),
  nodeType: StorageNodeType.Dir,
  name: 'd12',
  dir: 'd1',
  path: 'd1/d12',
  contentType: '',
  size: 0,
  share: cloneDeep(EMPTY_SHARE_SETTINGS),
  created: dayjs(),
  updated: dayjs(),
}

const f121: StorageNode = {
  id: shortid.generate(),
  nodeType: StorageNodeType.File,
  name: 'f121.txt',
  dir: 'd1/d12',
  path: 'd1/d12/f121.txt',
  contentType: 'text/plain; charset=utf-8',
  size: 5,
  share: cloneDeep(EMPTY_SHARE_SETTINGS),
  created: dayjs(),
  updated: dayjs(),
}

const f11: StorageNode = {
  id: shortid.generate(),
  nodeType: StorageNodeType.File,
  name: 'f11.txt',
  dir: 'd1',
  path: 'd1/f11.txt',
  contentType: 'text/plain; charset=utf-8',
  size: 5,
  share: cloneDeep(EMPTY_SHARE_SETTINGS),
  created: dayjs(),
  updated: dayjs(),
}

const d2: StorageNode = {
  id: shortid.generate(),
  nodeType: StorageNodeType.Dir,
  name: 'd2',
  dir: '',
  path: 'd2',
  contentType: '',
  size: 0,
  share: cloneDeep(EMPTY_SHARE_SETTINGS),
  created: dayjs(),
  updated: dayjs(),
}

const d21: StorageNode = {
  id: shortid.generate(),
  nodeType: StorageNodeType.Dir,
  name: 'd21',
  dir: 'd2',
  path: 'd2/d21',
  contentType: '',
  size: 0,
  share: cloneDeep(EMPTY_SHARE_SETTINGS),
  created: dayjs(),
  updated: dayjs(),
}

const f211: StorageNode = {
  id: shortid.generate(),
  nodeType: StorageNodeType.File,
  name: 'f211.txt',
  dir: 'd2/d21',
  path: 'd2/d21/f211.txt',
  contentType: 'text/plain; charset=utf-8',
  size: 5,
  share: cloneDeep(EMPTY_SHARE_SETTINGS),
  created: dayjs(),
  updated: dayjs(),
}

const f1: StorageNode = {
  id: shortid.generate(),
  nodeType: StorageNodeType.File,
  name: 'f1.txt',
  dir: '',
  path: 'f1.txt',
  contentType: 'text/plain; charset=utf-8',
  size: 5,
  share: cloneDeep(EMPTY_SHARE_SETTINGS),
  created: dayjs(),
  updated: dayjs(),
}

const STORAGE_NODES: StorageNode[] = [d1, d11, f111, d12, f121, f11, d2, d21, f211, f1]

//========================================================================
//
//  Test helpers
//
//========================================================================

let treeStore!: StorageTreeStore

let treeView!: CompTreeView

let storageLogic!: StorageLogic

function verifyParentChildRelationForTree(treeView: CompTreeView | any) {
  for (let i = 0; i < treeView.children.length; i++) {
    const node = treeView.children[i]
    // ノードの親が空であることを検証
    expect(node.parent).toBeNull()
    // ノードの親子(子孫)関係の検証
    verifyParentChildRelationForNode(node)
  }
}

function verifyParentChildRelationForNode(node: CompTreeNode | any) {
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i] as CompTreeNode | any
    // ノードの親子関係を検証
    expect(child.parent).toBe(node)
    // 孫ノードの検証
    verifyParentChildRelationForNode(child)
  }
}

function shuffle<T>(array: T[]): T[] {
  const result = Object.assign([], array)
  for (let i = result.length - 1; i > 0; i--) {
    const r = Math.floor(Math.random() * (i + 1))
    const tmp = result[i]
    result[i] = result[r]
    result[r] = tmp
  }
  return result
}

//========================================================================
//
//  Tests
//
//========================================================================

beforeAll(async () => {
  await initExampleTest()
})

declare function replace(path: string, f?: any): any

beforeEach(async () => {
  const wrapper = mount(CompTreeView)
  treeView = wrapper.vm as CompTreeView

  storageLogic = td.object<StorageLogic>()
  td.replace<StorageLogic>(storageLogic, 'baseURL', logic.userStorage.baseURL)
  td.replace<StorageLogic>(storageLogic, 'sortNodes', logic.userStorage.sortNodes)

  treeStore = newStorageTreeStore('user', storageLogic)
  treeStore.setup(treeView)
})

describe('constructor + init', () => {
  it('ベーシックケース', () => {
    const wrapper = mount(CompTreeView)
    const treeView = wrapper.vm as CompTreeView
    const treeStore = newStorageTreeStore('user', logic.userStorage)
    treeStore.setup(treeView)

    expect(treeStore.rootNode.value).toBe('')
  })

  it('StorageTreeStoreを作成 - ユーザータイプ', () => {
    const wrapper = mount(CompTreeView)
    const treeView = wrapper.vm as CompTreeView
    const treeStore = newStorageTreeStore('user', logic.userStorage)
    treeStore.setup(treeView)

    const rootNodeLabel = String(i18n.t('storage.userRootName'))
    expect(treeStore.rootNode.label).toBe(rootNodeLabel)
    expect(treeStore.rootNode.baseURL).toBe(logic.userStorage.baseURL)
  })

  it('StorageTreeStoreを作成 - アプリケーションタイプ', () => {
    const wrapper = mount(CompTreeView)
    const treeView = wrapper.vm as CompTreeView
    const treeStore = newStorageTreeStore('app', logic.appStorage)
    treeStore.setup(treeView)

    const rootNodeLabel = String(i18n.t('storage.appRootName'))
    expect(treeStore.rootNode.label).toBe(rootNodeLabel)
    expect(treeStore.rootNode.baseURL).toBe(logic.appStorage.baseURL)
  })

  it('既にルートノードが作成されている場合', () => {
    const wrapper = mount(CompTreeView)
    const treeView = wrapper.vm as CompTreeView
    const treeStore = newStorageTreeStore('user', logic.userStorage)
    treeStore.setup(treeView)

    // コンストラクタでルートノードが作成される
    const rootNode = treeStore.rootNode

    // 再度初期化する
    treeStore.setup(treeView)

    // 最初に初期化したルートノードが再利用されていることを検証
    expect(treeStore.rootNode).toBe(rootNode)
  })
})

describe('pullInitialNodes', () => {
  it('ベーシックケース', async () => {
    // StorageLogic.pullChildren()をモック化
    td.when(storageLogic.pullChildren(td.matchers.anything())).thenReturn()
    // StorageLogic.getNodeMap()をモック化
    td.when(storageLogic.getNodeMap()).thenReturn(
      [d1, d11, f111].reduce(
        (result, node) => {
          result[node.path] = node
          return result
        },
        {} as { [path: string]: StorageNode }
      )
    )

    await treeStore.pullInitialNodes('d1/d11')
    const actual = treeStore.getAllNodes()

    // ツリービューが想定したノード構成になっているか検証
    expect(actual.length).toBe(4)
    expect(actual[0].value).toBe(treeStore.rootNode.value)
    expect(actual[1].value).toBe('d1')
    expect(actual[2].value).toBe('d1/d11')
    expect(actual[3].value).toBe('d1/d11/f111.txt')
    // ディレクトリが展開されているか検証
    expect(actual[0].opened).toBeTruthy()
    expect(actual[1].opened).toBeTruthy()
    expect(actual[2].opened).toBeTruthy()
    expect(actual[3].opened).toBeFalsy()
    // 遅延ロードの設定を検証
    expect(actual[0].lazy).toBeTruthy()
    expect(actual[1].lazy).toBeTruthy()
    expect(actual[2].lazy).toBeTruthy()
    expect(actual[3].lazy).toBeFalsy()
    // 遅延ロード完了の検証
    expect(actual[0].lazyLoadStatus).toBe('loaded')
    expect(actual[1].lazyLoadStatus).toBe('loaded')
    expect(actual[2].lazyLoadStatus).toBe('loaded')
    expect(actual[3].lazyLoadStatus).toBe('none')
    // pullChildren()が正常に呼び出されたか検証
    const pullChildren_exp = td.explain(storageLogic.pullChildren)
    expect(pullChildren_exp.calls[0].args[0]).toBe('')
    expect(pullChildren_exp.calls[1].args[0]).toBe('d1')
    expect(pullChildren_exp.calls[2].args[0]).toBe('d1/d11')
  })
})

describe('pullDescendants', () => {
  it('ベーシックケース', async () => {
    // ツリービューの初期設定
    treeStore.rootNode.lazyLoadStatus = 'loaded'
    treeStore.setNode(Object.assign(d1, { lazyLoadStatus: 'loaded' }))
    // StorageLogic.pullDescendants()をモック化
    td.when(storageLogic.pullDescendants(td.matchers.anything())).thenReturn()
    // StorageLogic.nodesをモック化
    td.replace<StorageLogic>(storageLogic, 'getNodeMap', () => {
      return [d1, d11, f111, d12, f121].reduce(
        (result, node) => {
          result[node.path] = node
          return result
        },
        {} as { [path: string]: StorageNode }
      )
    })

    await treeStore.pullDescendants('d1/d11')
    const actual = treeStore.getAllNodes()
    const [_root, _d1, _d11, _f111, _d12, _f121] = actual

    // ツリービューが想定したノード構成になっているか検証
    expect(actual.length).toBe(6)
    expect(_root.value).toBe(treeStore.rootNode.value)
    expect(_d1.value).toBe('d1')
    expect(_d11.value).toBe('d1/d11')
    expect(_f111.value).toBe('d1/d11/f111.txt')
    expect(_d12.value).toBe('d1/d12')
    expect(_f121.value).toBe('d1/d12/f121.txt')
    // 遅延ロード状態の検証
    expect(_root.lazyLoadStatus).toBe('loaded')
    expect(_d1.lazyLoadStatus).toBe('loaded')
    expect(_d11.lazyLoadStatus).toBe('loaded')
    expect(_f111.lazyLoadStatus).toBe('none')
    expect(_d12.lazyLoadStatus).toBe('none')
    expect(_f121.lazyLoadStatus).toBe('none')
    // pullDescendants()が正常に呼び出されたか検証
    const pullChildren_exp = td.explain(storageLogic.pullDescendants)
    expect(pullChildren_exp.calls[0].args[0]).toBe('d1/d11')
  })
})

describe('pullChildren', () => {
  it('ベーシックケース', async () => {
    // StorageLogic.nodesをモック化
    td.replace<StorageLogic>(storageLogic, 'nodes', [d1, d11, d12])

    await treeStore.pullChildren('d1')
    const actual = treeStore.getAllNodes()

    // ツリービューが想定したノード構成になっているか検証
    expect(actual.length).toBe(4)
    expect(actual[0].value).toBe(treeStore.rootNode.value)
    expect(actual[1].value).toBe('d1')
    expect(actual[2].value).toBe('d1/d11')
    expect(actual[3].value).toBe('d1/d12')
    // pullChildren()が正常に呼び出されたか検証
    const pullChildren_exp = td.explain(storageLogic.pullChildren)
    expect(pullChildren_exp.calls[0].args[0]).toBe('d1')
  })
})

describe('getAllNodes', () => {
  it('ベーシックケース', () => {
    treeStore.setAllNodes([d1, d11, f111, d12, d2, d21, f211, f1])

    const actual = treeStore.getAllNodes()

    expect(actual.length).toBe(9)
    expect(actual[0].value).toBe(treeStore.rootNode.value)
    expect(actual[1].value).toBe('d1')
    expect(actual[2].value).toBe('d1/d11')
    expect(actual[3].value).toBe('d1/d11/f111.txt')
    expect(actual[4].value).toBe('d1/d12')
    expect(actual[5].value).toBe('d2')
    expect(actual[6].value).toBe('d2/d21')
    expect(actual[7].value).toBe('d2/d21/f211.txt')
    expect(actual[8].value).toBe('f1.txt')
  })
})

describe('getNode', () => {
  it('ベーシックケース', () => {
    treeStore.setAllNodes(STORAGE_NODES)

    const actual = treeStore.getNode('d1')!

    expect(actual.value).toBe('d1')
  })

  it('ルートノードを取得', () => {
    treeStore.setAllNodes(STORAGE_NODES)

    const actual = treeStore.getNode(treeStore.rootNode.value)!

    expect(actual.value).toBe(treeStore.rootNode.value)
  })
})

describe('setAllNodes', () => {
  it('ソートされていないノードリストを渡した場合', () => {
    treeStore.setAllNodes(shuffle([d1, d11, f111, d12, d2, d21, f211, f1]))
    const actual = treeStore.getAllNodes()

    expect(actual.length).toBe(9)
    expect(actual[0].value).toBe(treeStore.rootNode.value)
    expect(actual[1].value).toBe('d1')
    expect(actual[2].value).toBe('d1/d11')
    expect(actual[3].value).toBe('d1/d11/f111.txt')
    expect(actual[4].value).toBe('d1/d12')
    expect(actual[5].value).toBe('d2')
    expect(actual[6].value).toBe('d2/d21')
    expect(actual[7].value).toBe('d2/d21/f211.txt')
    expect(actual[8].value).toBe('f1.txt')

    verifyParentChildRelationForTree(treeView)
  })
})

describe('mergeAllNodes', () => {
  it('ベーシックケース', () => {
    // root
    // ├d1
    // │├d11
    // ││└f111.txt
    // │└d12
    // └d2
    treeStore.setAllNodes([d1, d11, f111, d12, d2])

    // 以下の状態のノードリストを引数に設定する
    // ・'d1/d11/f111.txt'が'fA.txt'へ移動+リネームされた
    // ・'d1/d11/f11A.txt'が追加された
    // ・'d1/d12'が削除された
    const fA: StorageNode = Object.assign(cloneDeep(f111), {
      dir: '',
      path: 'fA.txt',
    })
    const f11A: StorageNode = {
      id: shortid.generate(),
      nodeType: StorageNodeType.File,
      name: 'f11A.txt',
      dir: 'd1/d11',
      path: 'd1/d11/f11A.txt',
      contentType: 'text/plain; charset=utf-8',
      size: 5,
      share: cloneDeep(EMPTY_SHARE_SETTINGS),
      created: dayjs(),
      updated: dayjs(),
    }
    treeStore.mergeAllNodes([d1, d11, f11A, fA, d2])
    const actual = treeStore.getAllNodes()

    // root
    // ├d1
    // │└d11
    // │  └f11A.txt
    // ├d2
    // └fA.txt
    expect(actual.length).toBe(6)
    expect(actual[0].value).toBe(treeStore.rootNode.value)
    expect(actual[1].value).toBe('d1')
    expect(actual[2].value).toBe('d1/d11')
    expect(actual[3].value).toBe('d1/d11/f11A.txt')
    expect(actual[4].value).toBe('d2')
    expect(actual[5].value).toBe('fA.txt')

    verifyParentChildRelationForTree(treeView)
  })
})

describe('setNode + setNodes', () => {
  it('ツリーに存在しないノードの設定', () => {
    treeStore.setNodes([d1, d11, f111])

    // ノードが追加されたことを検証
    expect(treeStore.getNode('d1/d11')!.value).toBe('d1/d11')
    expect(treeStore.getNode('d1/d11/f111.txt')!.value).toBe('d1/d11/f111.txt')

    verifyParentChildRelationForTree(treeView)
  })

  it('ツリーに存在するノードの設定', () => {
    treeStore.setAllNodes([d1, d11, f111])

    const created = dayjs('2019-12-01')
    const updated = dayjs('2019-12-02')
    const updatingD11 = Object.assign({}, d11, { created, updated })
    const updatingFileA = Object.assign({}, f111, { created, updated })

    treeStore.setNodes([updatingD11, updatingFileA])

    expect(treeStore.getNode('d1/d11')!.createdDate).toEqual(created)
    expect(treeStore.getNode('d1/d11')!.updatedDate).toEqual(updated)
    expect(treeStore.getNode('d1/d11/f111.txt')!.createdDate).toEqual(created)
    expect(treeStore.getNode('d1/d11/f111.txt')!.updatedDate).toEqual(updated)
  })

  it('ソートされていないノードリストを渡した場合', () => {
    treeStore.setNodes(shuffle([d1, d11, f111, d12, d2, d21, f211, f1]))
    const actual = treeStore.getAllNodes()

    expect(actual.length).toBe(9)
    expect(actual[0].value).toBe(treeStore.rootNode.value)
    expect(actual[1].value).toBe('d1')
    expect(actual[2].value).toBe('d1/d11')
    expect(actual[3].value).toBe('d1/d11/f111.txt')
    expect(actual[4].value).toBe('d1/d12')
    expect(actual[5].value).toBe('d2')
    expect(actual[6].value).toBe('d2/d21')
    expect(actual[7].value).toBe('d2/d21/f211.txt')
    expect(actual[8].value).toBe('f1.txt')

    verifyParentChildRelationForTree(treeView)
  })
})

describe('removeNodes', () => {
  it('ベーシックケース', () => {
    treeStore.setAllNodes([d1, d11, f111, d2, d21, f211])

    treeStore.removeNodes(['d1/d11', 'd2/d21/f211.txt'])

    expect(treeStore.getNode('d1/d11')).toBeUndefined()
    expect(treeStore.getNode('d1/d11/f111.txt')).toBeUndefined()
    expect(treeStore.getNode('d2/d21/f211.txt')).toBeUndefined()

    verifyParentChildRelationForTree(treeView)
  })

  it(`'d1/d11'と親である'd1'を同時に指定した場合`, () => {
    treeStore.setAllNodes([d1, d11, f111, d12])

    treeStore.removeNodes(['d1/d11', 'd1'])

    expect(treeStore.getNode('d1')).toBeUndefined()
    expect(treeStore.getNode('d1/d11')).toBeUndefined()
    expect(treeStore.getNode('d1/d11/f111.txt')).toBeUndefined()
    expect(treeStore.getNode('d1/d12')).toBeUndefined()

    verifyParentChildRelationForTree(treeView)
  })

  it('存在しないパスを指定した場合', () => {
    treeStore.setAllNodes(STORAGE_NODES)

    // 何も起こらない
    treeStore.removeNodes(['dXXX'])

    verifyParentChildRelationForTree(treeView)
  })
})

describe('moveNode', () => {
  it('ディレクトリの移動 - ディレクトリへ移動', () => {
    treeStore.setAllNodes([d1, d11, f111, d12, d2])

    treeStore.moveNode('d1', 'd2/d1')
    const actual = treeStore.getNode('d2/d1')!
    const descendants = actual.getDescendants()

    expect(actual.parent!.value).toBe('d2')
    expect(actual.value).toBe('d2/d1')
    expect(descendants.length).toBe(3)
    expect(descendants[0].value).toBe('d2/d1/d11')
    expect(descendants[1].value).toBe('d2/d1/d11/f111.txt')
    expect(descendants[2].value).toBe('d2/d1/d12')

    verifyParentChildRelationForTree(treeView)
  })

  it('ディレクトリの移動 - ルートディレクトリへ移動', () => {
    treeStore.setAllNodes(STORAGE_NODES)

    treeStore.moveNode('d1/d12', 'd12')
    const actual = treeStore.getNode('d12')!

    expect(actual.parent!.value).toBe('')
    expect(actual.value).toBe('d12')

    verifyParentChildRelationForTree(treeView)
  })

  it('ファイルの移動 - ディレクトリへ移動', () => {
    treeStore.setAllNodes(STORAGE_NODES)

    treeStore.moveNode('d1/d11/f111.txt', 'd1/d12/f111.txt')
    const actual = treeStore.getNode('d1/d12/f111.txt')!

    expect(actual.parent!.value).toBe('d1/d12')
    expect(actual.value).toBe('d1/d12/f111.txt')

    verifyParentChildRelationForTree(treeView)
  })

  it('ファイルの移動 - ルートディレクトリへ移動', () => {
    treeStore.setAllNodes(STORAGE_NODES)

    treeStore.moveNode('d1/d11/f111.txt', 'f111.txt')
    const actual = treeStore.getNode('f111.txt')!

    expect(actual.parent!.value).toBe('')
    expect(actual.value).toBe('f111.txt')

    verifyParentChildRelationForTree(treeView)
  })

  it('移動先に同名のディレクトリまたはファイルが存在する場合', () => {
    const FM_UPDATED = dayjs('2020-01-01')
    const TO_UPDATED = dayjs('2020-01-02')
    const d1: StorageNode = {
      id: shortid.generate(),
      nodeType: StorageNodeType.Dir,
      name: 'd1',
      dir: '',
      path: 'd1',
      contentType: '',
      size: 0,
      share: cloneDeep(EMPTY_SHARE_SETTINGS),
      created: dayjs(),
      updated: FM_UPDATED,
    }
    const d1_docs: StorageNode = {
      id: shortid.generate(),
      nodeType: StorageNodeType.Dir,
      name: 'docs',
      dir: 'd1',
      path: 'd1/docs',
      contentType: '',
      size: 0,
      share: cloneDeep(EMPTY_SHARE_SETTINGS),
      created: dayjs(),
      updated: FM_UPDATED,
    }
    const d1_docs_aaa: StorageNode = {
      id: shortid.generate(),
      nodeType: StorageNodeType.Dir,
      name: 'aaa',
      dir: 'd1/docs',
      path: 'd1/docs/aaa',
      contentType: '',
      size: 0,
      share: cloneDeep(EMPTY_SHARE_SETTINGS),
      created: dayjs(),
      updated: FM_UPDATED,
    }
    const d1_docs_aaa_fileA: StorageNode = {
      id: shortid.generate(),
      nodeType: StorageNodeType.File,
      name: 'fileA.txt',
      dir: 'd1/docs/aaa',
      path: 'd1/docs/aaa/fileA.txt',
      contentType: 'text/plain; charset=utf-8',
      size: 5,
      share: cloneDeep(EMPTY_SHARE_SETTINGS),
      created: dayjs(),
      updated: FM_UPDATED,
    }
    const d1_docs_fileB: StorageNode = {
      id: shortid.generate(),
      nodeType: StorageNodeType.File,
      name: 'fileB.txt',
      dir: 'd1/docs',
      path: 'd1/docs/fileB.txt',
      contentType: 'text/plain; charset=utf-8',
      size: 5,
      share: cloneDeep(EMPTY_SHARE_SETTINGS),
      created: dayjs(),
      updated: FM_UPDATED,
    }
    const d1_docs_fileC: StorageNode = {
      id: shortid.generate(),
      nodeType: StorageNodeType.File,
      name: 'fileC.txt',
      dir: 'd1/docs',
      path: 'd1/docs/fileC.txt',
      contentType: 'text/plain; charset=utf-8',
      size: 5,
      share: cloneDeep(EMPTY_SHARE_SETTINGS),
      created: dayjs(),
      updated: FM_UPDATED,
    }
    const docs: StorageNode = {
      id: shortid.generate(),
      nodeType: StorageNodeType.Dir,
      name: 'docs',
      dir: '',
      path: 'docs',
      contentType: '',
      size: 0,
      share: cloneDeep(EMPTY_SHARE_SETTINGS),
      created: dayjs(),
      updated: FM_UPDATED,
    }
    const docs_aaa: StorageNode = {
      id: shortid.generate(),
      nodeType: StorageNodeType.Dir,
      name: 'aaa',
      dir: 'docs',
      path: 'docs/aaa',
      contentType: '',
      size: 0,
      share: cloneDeep(EMPTY_SHARE_SETTINGS),
      created: dayjs(),
      updated: TO_UPDATED,
    }
    const docs_aaa_fileA: StorageNode = {
      id: shortid.generate(),
      nodeType: StorageNodeType.File,
      name: 'fileA.txt',
      dir: 'docs/aaa',
      path: 'docs/aaa/fileA.txt',
      contentType: 'text/plain; charset=utf-8',
      size: 5,
      share: cloneDeep(EMPTY_SHARE_SETTINGS),
      created: dayjs(),
      updated: TO_UPDATED,
    }
    const docs_fileB: StorageNode = {
      id: shortid.generate(),
      nodeType: StorageNodeType.File,
      name: 'fileB.txt',
      dir: 'docs',
      path: 'docs/fileB.txt',
      contentType: 'text/plain; charset=utf-8',
      size: 5,
      share: cloneDeep(EMPTY_SHARE_SETTINGS),
      created: dayjs(),
      updated: TO_UPDATED,
    }
    const docs_fileD: StorageNode = {
      id: shortid.generate(),
      nodeType: StorageNodeType.File,
      name: 'fileD.txt',
      dir: 'docs',
      path: 'docs/fileD.txt',
      contentType: 'text/plain; charset=utf-8',
      size: 5,
      share: cloneDeep(EMPTY_SHARE_SETTINGS),
      created: dayjs(),
      updated: TO_UPDATED,
    }
    const docs_fileE: StorageNode = {
      id: shortid.generate(),
      nodeType: StorageNodeType.File,
      name: 'fileE.txt',
      dir: 'docs',
      path: 'docs/fileE.txt',
      contentType: 'text/plain; charset=utf-8',
      size: 5,
      share: cloneDeep(EMPTY_SHARE_SETTINGS),
      created: dayjs(),
      updated: TO_UPDATED,
    }
    treeStore.setAllNodes([
      d1,
      d1_docs,
      d1_docs_aaa,
      d1_docs_aaa_fileA,
      d1_docs_fileB,
      d1_docs_fileC,
      docs,
      docs_aaa,
      docs_aaa_fileA,
      docs_fileB,
      docs_fileD,
      docs_fileE,
    ])

    // 'd1/docs'をルート直下の'docs'へ移動
    // (ルート直下にはdocsが既に存在している)
    treeStore.moveNode('d1/docs', 'docs')

    const allNodePaths = treeStore.getAllNodes().map(node => node.value)
    // 補足: 空文字''はルートノード
    expect(allNodePaths).toEqual([
      '',
      'd1',
      'docs',
      'docs/aaa',
      'docs/aaa/fileA.txt',
      'docs/fileB.txt',
      'docs/fileC.txt',
      'docs/fileD.txt',
      'docs/fileE.txt',
    ])

    // 移動したノードの検証(移動または上書きされたか、もとからあったのか)
    expect(treeStore.getNode('docs')!.updatedDate).toEqual(FM_UPDATED)
    expect(treeStore.getNode('docs/aaa')!.updatedDate).toEqual(FM_UPDATED)
    expect(treeStore.getNode('docs/aaa/fileA.txt')!.updatedDate).toEqual(FM_UPDATED)
    expect(treeStore.getNode('docs/fileB.txt')!.updatedDate).toEqual(FM_UPDATED)
    expect(treeStore.getNode('docs/fileC.txt')!.updatedDate).toEqual(FM_UPDATED)
    // 次の2ファイルは移動先にもとからあったので更新日に変化はない
    expect(treeStore.getNode('docs/fileD.txt')!.updatedDate).toEqual(TO_UPDATED)
    expect(treeStore.getNode('docs/fileE.txt')!.updatedDate).toEqual(TO_UPDATED)

    verifyParentChildRelationForTree(treeView)
  })

  it('存在しないパスを指定した場合', () => {
    treeStore.setAllNodes(STORAGE_NODES)

    let actual: Error
    try {
      treeStore.moveNode('dXXX', 'd2/dXXX')
    } catch (err) {
      actual = err
    }

    expect(actual!.message).toBe(`The specified node was not found: 'dXXX'`)
  })

  it('移動先ディレクトリが移動元のサブディレクトリの場合', () => {
    treeStore.setAllNodes(STORAGE_NODES)

    let actual: Error
    try {
      treeStore.moveNode('d1', 'd1/d11/d1')
    } catch (err) {
      actual = err
    }

    expect(actual!.message).toBe(`The destination directory is its own subdirectory: 'd1' -> 'd1/d11/d1'`)
  })
})

describe('renameNode', () => {
  it('ディレクトリの名前変更', () => {
    treeStore.setAllNodes([d1, d11, f111, d12, f11])

    treeStore.renameNode('d1', 'x1')
    const actual = treeStore.getNode('x1')!
    const descendants = actual.getDescendants()

    expect(actual.value).toBe('x1')
    expect(descendants.length).toBe(4)
    expect(descendants[0].value).toBe('x1/d11')
    expect(descendants[1].value).toBe('x1/d11/f111.txt')
    expect(descendants[2].value).toBe('x1/d12')
    expect(descendants[3].value).toBe('x1/f11.txt')

    verifyParentChildRelationForTree(treeView)
  })

  it('ファイルの名前変更', () => {
    treeStore.setAllNodes(STORAGE_NODES)

    treeStore.renameNode('d1/d11/f111.txt', 'fileX.txt')
    const actual = treeStore.getNode('d1/d11/fileX.txt')!

    expect(actual.value).toBe('d1/d11/fileX.txt')

    verifyParentChildRelationForTree(treeView)
  })

  it('存在しないパスを指定した場合', () => {
    treeStore.setAllNodes(STORAGE_NODES)

    let actual: Error
    try {
      treeStore.renameNode('dXXX', 'x1')
    } catch (err) {
      actual = err
    }

    expect(actual!.message).toBe(`The specified node was not found: 'dXXX'`)
  })
})
