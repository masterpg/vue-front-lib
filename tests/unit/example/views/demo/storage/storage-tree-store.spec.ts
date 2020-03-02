import * as shortid from 'shortid'
import { CompTreeNode, CompTreeView, StorageNode, StorageNodeType } from '@/lib'
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

const fileA: StorageNode = {
  id: shortid.generate(),
  nodeType: StorageNodeType.File,
  name: 'fileA.txt',
  dir: 'd1/d11',
  path: 'd1/d11/fileA.txt',
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

const fileB: StorageNode = {
  id: shortid.generate(),
  nodeType: StorageNodeType.File,
  name: 'fileB.txt',
  dir: 'd2/d21',
  path: 'd2/d21/fileB.txt',
  contentType: 'text/plain; charset=utf-8',
  size: 5,
  share: cloneDeep(EMPTY_SHARE_SETTINGS),
  created: dayjs(),
  updated: dayjs(),
}

const fileC: StorageNode = {
  id: shortid.generate(),
  nodeType: StorageNodeType.File,
  name: 'fileC.txt',
  dir: '',
  path: 'fileC.txt',
  contentType: 'text/plain; charset=utf-8',
  size: 5,
  share: cloneDeep(EMPTY_SHARE_SETTINGS),
  created: dayjs(),
  updated: dayjs(),
}

const STORAGE_NODES: StorageNode[] = [d1, d11, fileA, d12, d2, d21, fileB, fileC]

//========================================================================
//
//  Test helpers
//
//========================================================================

let treeStore!: StorageTreeStore

let treeView!: CompTreeView

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

beforeEach(async () => {
  const wrapper = mount(CompTreeView)
  treeView = wrapper.vm as CompTreeView
  treeStore = newStorageTreeStore('user', logic.userStorage)
  treeStore.start(treeView)
})

describe('constructor + init', () => {
  it('ベーシックケース', () => {
    const wrapper = mount(CompTreeView)
    const treeView = wrapper.vm as CompTreeView
    const treeStore = newStorageTreeStore('user', logic.userStorage)
    treeStore.start(treeView)

    const rootNode = treeStore.rootNode
    expect(treeStore.rootNode.value).toBe('')
  })

  it('StorageTreeStoreを作成 - ユーザータイプ', () => {
    const wrapper = mount(CompTreeView)
    const treeView = wrapper.vm as CompTreeView
    const treeStore = newStorageTreeStore('user', logic.userStorage)
    treeStore.start(treeView)

    const rootNodeLabel = String(i18n.t('storage.userRootName'))
    expect(treeStore.rootNode.label).toBe(rootNodeLabel)
    expect(treeStore.rootNode.baseURL).toBe(logic.userStorage.baseURL)
  })

  it('StorageTreeStoreを作成 - アプリケーションタイプ', () => {
    const wrapper = mount(CompTreeView)
    const treeView = wrapper.vm as CompTreeView
    const treeStore = newStorageTreeStore('app', logic.appStorage)
    treeStore.start(treeView)

    const rootNodeLabel = String(i18n.t('storage.appRootName'))
    expect(treeStore.rootNode.label).toBe(rootNodeLabel)
    expect(treeStore.rootNode.baseURL).toBe(logic.appStorage.baseURL)
  })

  it('既にルートノードが作成されている場合', () => {
    const wrapper = mount(CompTreeView)
    const treeView = wrapper.vm as CompTreeView
    const treeStore = newStorageTreeStore('user', logic.userStorage)
    treeStore.start(treeView)

    // コンストラクタでルートノードが作成される
    const rootNode = treeStore.rootNode

    // 再度初期化する
    treeStore.start(treeView)

    // 最初に初期化したルートノードが再利用されていることを検証
    expect(treeStore.rootNode).toBe(rootNode)
  })
})

describe('getAllNodes', () => {
  it('ベーシックケース', () => {
    treeStore.setAllNodes(STORAGE_NODES)

    const actual = treeStore.getAllNodes()

    expect(actual.length).toBe(9)
    expect(actual[0].value).toBe(treeStore.rootNode.value)
    expect(actual[1].value).toBe('d1')
    expect(actual[2].value).toBe('d1/d11')
    expect(actual[3].value).toBe('d1/d11/fileA.txt')
    expect(actual[4].value).toBe('d1/d12')
    expect(actual[5].value).toBe('d2')
    expect(actual[6].value).toBe('d2/d21')
    expect(actual[7].value).toBe('d2/d21/fileB.txt')
    expect(actual[8].value).toBe('fileC.txt')
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
    treeStore.setAllNodes(shuffle(STORAGE_NODES))
    const actual = treeStore.getAllNodes()

    expect(actual.length).toBe(9)
    expect(actual[0].value).toBe(treeStore.rootNode.value)
    expect(actual[1].value).toBe('d1')
    expect(actual[2].value).toBe('d1/d11')
    expect(actual[3].value).toBe('d1/d11/fileA.txt')
    expect(actual[4].value).toBe('d1/d12')
    expect(actual[5].value).toBe('d2')
    expect(actual[6].value).toBe('d2/d21')
    expect(actual[7].value).toBe('d2/d21/fileB.txt')
    expect(actual[8].value).toBe('fileC.txt')

    verifyParentChildRelationForTree(treeView)
  })
})

describe('mergeAllNodes', () => {
  it('ベーシックケース', () => {
    treeStore.setAllNodes([d1, d11, fileA, d12])

    // 以下の状態のノードリストを引数に設定する
    // ・'d1/d11/fileA.txt'が'fileA.txt'へ移動された
    // ・'d/d11/fileD.txt'が追加された
    // ・'d/d12が削除された
    const newFileA: StorageNode = Object.assign(cloneDeep(fileA), {
      dir: '',
      path: 'fileA.txt',
    })
    const newFileD: StorageNode = {
      id: shortid.generate(),
      nodeType: StorageNodeType.File,
      name: 'fileD.txt',
      dir: 'd1/d11',
      path: 'd1/d11/fileD.txt',
      contentType: 'text/plain; charset=utf-8',
      size: 5,
      share: cloneDeep(EMPTY_SHARE_SETTINGS),
      created: dayjs(),
      updated: dayjs(),
    }
    treeStore.mergeAllNodes([d1, d11, newFileD, newFileA])
    const actual = treeStore.getAllNodes()

    expect(actual.length).toBe(5)
    expect(actual[0].value).toBe(treeStore.rootNode.value)
    expect(actual[1].value).toBe('d1')
    expect(actual[2].value).toBe('d1/d11')
    expect(actual[3].value).toBe('d1/d11/fileD.txt')
    expect(actual[4].value).toBe('fileA.txt')

    verifyParentChildRelationForTree(treeView)
  })
})

describe('setNode + setNodes', () => {
  it('ツリーに存在しないノードの設定', () => {
    treeStore.setNodes([d1, d11, fileA])

    // ノードが追加されたことを検証
    expect(treeStore.getNode('d1/d11')!.value).toBe('d1/d11')
    expect(treeStore.getNode('d1/d11/fileA.txt')!.value).toBe('d1/d11/fileA.txt')

    verifyParentChildRelationForTree(treeView)
  })

  it('ツリーに存在するノードの設定', () => {
    treeStore.setAllNodes([d1, d11, fileA])

    const created = dayjs('2019-12-01')
    const updated = dayjs('2019-12-02')
    const updatingD11 = Object.assign({}, d11, { created, updated })
    const updatingFileA = Object.assign({}, fileA, { created, updated })

    treeStore.setNodes([updatingD11, updatingFileA])

    expect(treeStore.getNode('d1/d11')!.createdDate).toEqual(created)
    expect(treeStore.getNode('d1/d11')!.updatedDate).toEqual(updated)
    expect(treeStore.getNode('d1/d11/fileA.txt')!.createdDate).toEqual(created)
    expect(treeStore.getNode('d1/d11/fileA.txt')!.updatedDate).toEqual(updated)
  })

  it('ソートされていないノードリストを渡した場合', () => {
    treeStore.setNodes(shuffle(STORAGE_NODES))
    const actual = treeStore.getAllNodes()

    expect(actual.length).toBe(9)
    expect(actual[0].value).toBe(treeStore.rootNode.value)
    expect(actual[1].value).toBe('d1')
    expect(actual[2].value).toBe('d1/d11')
    expect(actual[3].value).toBe('d1/d11/fileA.txt')
    expect(actual[4].value).toBe('d1/d12')
    expect(actual[5].value).toBe('d2')
    expect(actual[6].value).toBe('d2/d21')
    expect(actual[7].value).toBe('d2/d21/fileB.txt')
    expect(actual[8].value).toBe('fileC.txt')

    verifyParentChildRelationForTree(treeView)
  })
})

describe('removeNodes', () => {
  it('ベーシックケース', () => {
    treeStore.setAllNodes(STORAGE_NODES)

    treeStore.removeNodes(['d1/d11', 'd2/d21/fileB.txt'])

    expect(treeStore.getNode('d1/d11')).toBeUndefined()
    expect(treeStore.getNode('d1/d11/fileA.txt')).toBeUndefined()
    expect(treeStore.getNode('d2/d21/fileB.txt')).toBeUndefined()

    verifyParentChildRelationForTree(treeView)
  })

  it(`'d1/d11'と親である'd1'を同時に指定した場合`, () => {
    treeStore.setAllNodes(STORAGE_NODES)

    treeStore.removeNodes(['d1/d11', 'd1'])

    expect(treeStore.getNode('d1')).toBeUndefined()
    expect(treeStore.getNode('d1/d11')).toBeUndefined()
    expect(treeStore.getNode('d1/d11/fileA.txt')).toBeUndefined()
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
    treeStore.setAllNodes(STORAGE_NODES)

    treeStore.moveNode('d1', 'd2/d1')
    const actual = treeStore.getNode('d2/d1')!
    const descendants = actual.getDescendants()

    expect(actual.parent!.value).toBe('d2')
    expect(actual.value).toBe('d2/d1')
    expect(descendants.length).toBe(3)
    expect(descendants[0].value).toBe('d2/d1/d11')
    expect(descendants[1].value).toBe('d2/d1/d11/fileA.txt')
    expect(descendants[2].value).toBe('d2/d1/d12')

    verifyParentChildRelationForTree(treeView)
  })

  it('ディレクトリの移動 - ルートディレクトリへ移動', () => {
    treeStore.setAllNodes(STORAGE_NODES)

    treeStore.moveNode('d1/d12', 'd12')
    const actual = treeStore.getNode('d12')!

    expect(actual.parent!.value).toBe('')
    expect(actual.parent!.opened).toBeTruthy()
    expect(actual.value).toBe('d12')

    verifyParentChildRelationForTree(treeView)
  })

  it('ファイルの移動 - ディレクトリへ移動', () => {
    treeStore.setAllNodes(STORAGE_NODES)

    treeStore.moveNode('d1/d11/fileA.txt', 'd1/d12/fileA.txt')
    const actual = treeStore.getNode('d1/d12/fileA.txt')!

    expect(actual.parent!.value).toBe('d1/d12')
    expect(actual.value).toBe('d1/d12/fileA.txt')

    verifyParentChildRelationForTree(treeView)
  })

  it('ファイルの移動 - ルートディレクトリへ移動', () => {
    treeStore.setAllNodes(STORAGE_NODES)

    treeStore.moveNode('d1/d11/fileA.txt', 'fileA.txt')
    const actual = treeStore.getNode('fileA.txt')!

    expect(actual.parent!.value).toBe('')
    expect(actual.parent!.opened).toBeTruthy()
    expect(actual.value).toBe('fileA.txt')

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
    treeStore.setAllNodes(STORAGE_NODES)

    treeStore.renameNode('d1', 'x1')
    const actual = treeStore.getNode('x1')!
    const descendants = actual.getDescendants()

    expect(actual.value).toBe('x1')
    expect(descendants.length).toBe(3)
    expect(descendants[0].value).toBe('x1/d11')
    expect(descendants[1].value).toBe('x1/d11/fileA.txt')
    expect(descendants[2].value).toBe('x1/d12')

    verifyParentChildRelationForTree(treeView)
  })

  it('ファイルの名前変更', () => {
    treeStore.setAllNodes(STORAGE_NODES)

    treeStore.renameNode('d1/d11/fileA.txt', 'fileX.txt')
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
