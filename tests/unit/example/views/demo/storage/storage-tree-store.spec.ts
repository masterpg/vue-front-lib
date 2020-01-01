import { CompTreeNode, CompTreeView, StorageNode, StorageNodeType } from '@/lib'
import { StorageTreeStore } from '@/example/views/demo/storage/storage-tree-store'
import dayjs from 'dayjs'
import { getStorageTreeRootNodeData } from '@/example/views/demo/storage/base'
import { initExampleTest } from '../../../../../helpers/example/init'
import { mount } from '@vue/test-utils'

//========================================================================
//
//  Test data
//
//========================================================================

const d1: StorageNode = {
  nodeType: StorageNodeType.Dir,
  name: 'd1',
  dir: '',
  path: 'd1',
  created: dayjs(),
  updated: dayjs(),
}

const d11: StorageNode = {
  nodeType: StorageNodeType.Dir,
  name: 'd11',
  dir: 'd1',
  path: 'd1/d11',
  created: dayjs(),
  updated: dayjs(),
}

const fileA: StorageNode = {
  nodeType: StorageNodeType.File,
  name: 'fileA.txt',
  dir: 'd1/d11',
  path: 'd1/d11/fileA.txt',
  created: dayjs(),
  updated: dayjs(),
}

const d12: StorageNode = {
  nodeType: StorageNodeType.Dir,
  name: 'd12',
  dir: 'd1',
  path: 'd1/d12',
  created: dayjs(),
  updated: dayjs(),
}

const d2: StorageNode = {
  nodeType: StorageNodeType.Dir,
  name: 'd2',
  dir: '',
  path: 'd2',
  created: dayjs(),
  updated: dayjs(),
}

const d21: StorageNode = {
  nodeType: StorageNodeType.Dir,
  name: 'd21',
  dir: 'd2',
  path: 'd2/d21',
  created: dayjs(),
  updated: dayjs(),
}

const fileB: StorageNode = {
  nodeType: StorageNodeType.File,
  name: 'fileB.txt',
  dir: 'd2/d21',
  path: 'd2/d21/fileB.txt',
  created: dayjs(),
  updated: dayjs(),
}

const fileC: StorageNode = {
  nodeType: StorageNodeType.File,
  name: 'fileC.txt',
  dir: '',
  path: 'fileC.txt',
  created: dayjs(),
  updated: dayjs(),
}

const STORAGE_NODES: StorageNode[] = [d1, d11, fileA, d12, d2, d21, fileB, fileC]

//========================================================================
//
//  Test helpers
//
//========================================================================

let storageTreeStore!: StorageTreeStore

let treeView!: CompTreeView

function verifyParentChildRelationForTree(treeView: CompTreeView | any) {
  for (let i = 0; i < treeView.children.length; i++) {
    const node = treeView.children[i]
    // ノードの親が空であることを検証
    expect(node.parent).toBeUndefined()
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
  storageTreeStore = new StorageTreeStore()
  storageTreeStore.init(treeView)
  storageTreeStore.setNodes(STORAGE_NODES)
})

describe('init', () => {
  it('ベーシックケース', () => {
    const wrapper = mount(CompTreeView)
    const treeView = wrapper.vm as CompTreeView
    const storageTreeStore = new StorageTreeStore()

    storageTreeStore.init(treeView)

    const rootNodeData = getStorageTreeRootNodeData()
    expect(storageTreeStore.rootNode.value).toBe(rootNodeData.value)
    expect(storageTreeStore.rootNode.label).toBe(rootNodeData.label)
    expect(storageTreeStore.rootNode.icon).toBe(rootNodeData.icon)
    expect(storageTreeStore.rootNode.opened).toBe(rootNodeData.opened)
    expect(storageTreeStore.rootNode.nodeType).toBe(rootNodeData.nodeType)
  })

  it('既にルートノードが作成されている場合', () => {
    const wrapper = mount(CompTreeView)
    const treeView = wrapper.vm as CompTreeView
    const storageTreeStore = new StorageTreeStore()

    // 初期化することでルートノードが作成される
    storageTreeStore.init(treeView)
    const rootNode = storageTreeStore.rootNode

    // 再度初期化する
    storageTreeStore.init(treeView)

    // 最初に初期化したルートノードが再利用されていることを検証
    expect(storageTreeStore.rootNode).toBe(rootNode)
  })
})

describe('getAllNodes', () => {
  it('ベーシックケース', () => {
    const actual = storageTreeStore.getAllNodes()

    expect(actual.length).toBe(9)
    expect(actual[0].value).toBe(storageTreeStore.rootNode.value)
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
    const actual = storageTreeStore.getNode('d1')!

    expect(actual.value).toBe('d1')
  })

  it('ルートノードを取得', () => {
    const actual = storageTreeStore.getNode(storageTreeStore.rootNode.value)!

    expect(actual.value).toBe(storageTreeStore.rootNode.value)
  })
})

describe('setNodes', () => {
  it('ノードが適切にソートされているか検証', () => {
    for (let i = 0; i < 10; i++) {
      const wrapper = mount(CompTreeView)
      const treeView = wrapper.vm as CompTreeView
      const storageTreeStore = new StorageTreeStore()
      storageTreeStore.init(treeView)

      // ノード配列をシャッフルして実行
      storageTreeStore.setNodes(shuffle(STORAGE_NODES))
      const actual = storageTreeStore.getAllNodes()

      // 先頭はルートノード
      expect(actual[0].value).toBe(storageTreeStore.rootNode.value)
      actual.splice(0, 1)
      // ルートノード配下のノードが適切にソートされているか検証
      for (let index = 0; index < actual.length; index++) {
        expect(actual[index].value).toBe(STORAGE_NODES[index].path)
      }

      verifyParentChildRelationForTree(treeView)
    }
  })

  it('ツリーに存在しないノードの設定', () => {
    // テスト対象のノードをツリーから削除
    storageTreeStore.removeNode('d1/d11')
    expect(storageTreeStore.getNode('d1/d11')).toBeUndefined()
    expect(storageTreeStore.getNode('d1/d11/fileA.txt')).toBeUndefined()

    storageTreeStore.setNodes([d11, fileA])

    // ノードが追加されたことを検証
    expect(storageTreeStore.getNode('d1/d11')!.value).toBe('d1/d11')
    expect(storageTreeStore.getNode('d1/d11/fileA.txt')!.value).toBe('d1/d11/fileA.txt')

    verifyParentChildRelationForTree(treeView)
  })

  it('ツリーに存在するノードの設定', () => {
    const CREATED = dayjs('2019-12-01')
    const UPDATED = dayjs('2019-12-02')
    const updatingD11 = Object.assign({}, d11, { created: CREATED, updated: UPDATED })
    const updatingFileA = Object.assign({}, fileA, { created: CREATED, updated: UPDATED })

    storageTreeStore.setNodes([updatingD11, updatingFileA])

    expect(storageTreeStore.getNode('d1/d11')!.createdDate).toEqual(CREATED)
    expect(storageTreeStore.getNode('d1/d11')!.updatedDate).toEqual(UPDATED)
    expect(storageTreeStore.getNode('d1/d11/fileA.txt')!.createdDate).toEqual(CREATED)
    expect(storageTreeStore.getNode('d1/d11/fileA.txt')!.updatedDate).toEqual(UPDATED)
  })
})

describe('removeNodes', () => {
  it('ベーシックケース', () => {
    storageTreeStore.removeNodes(['d1/d11', 'd2/d21/fileB.txt'])

    expect(storageTreeStore.getNode('d1/d11')).toBeUndefined()
    expect(storageTreeStore.getNode('d1/d11/fileA.txt')).toBeUndefined()
    expect(storageTreeStore.getNode('d2/d21/fileB.txt')).toBeUndefined()

    verifyParentChildRelationForTree(treeView)
  })

  it(`'d1/d11'と親である'd1'を同時に指定した場合`, () => {
    storageTreeStore.removeNodes(['d1/d11', 'd1'])

    expect(storageTreeStore.getNode('d1')).toBeUndefined()
    expect(storageTreeStore.getNode('d1/d11')).toBeUndefined()
    expect(storageTreeStore.getNode('d1/d11/fileA.txt')).toBeUndefined()
    expect(storageTreeStore.getNode('d1/d12')).toBeUndefined()

    verifyParentChildRelationForTree(treeView)
  })

  it('存在しないパスを指定した場合', () => {
    // 何も起こらない
    storageTreeStore.removeNodes(['dXXX'])

    verifyParentChildRelationForTree(treeView)
  })
})

describe('moveNode', () => {
  it('ディレクトリの移動 - ディレクトリへ移動', () => {
    storageTreeStore.moveNode('d1', 'd2/d1')
    const actual = storageTreeStore.getNode('d2/d1')!
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
    storageTreeStore.moveNode('d1/d12', 'd12')
    const actual = storageTreeStore.getNode('d12')!

    expect(actual.parent!.value).toBe('')
    expect(actual.parent!.opened).toBeTruthy()
    expect(actual.value).toBe('d12')

    verifyParentChildRelationForTree(treeView)
  })

  it('ファイルの移動 - ディレクトリへ移動', () => {
    storageTreeStore.moveNode('d1/d11/fileA.txt', 'd1/d12/fileA.txt')
    const actual = storageTreeStore.getNode('d1/d12/fileA.txt')!

    expect(actual.parent!.value).toBe('d1/d12')
    expect(actual.value).toBe('d1/d12/fileA.txt')

    verifyParentChildRelationForTree(treeView)
  })

  it('ファイルの移動 - ルートディレクトリへ移動', () => {
    storageTreeStore.moveNode('d1/d11/fileA.txt', 'fileA.txt')
    const actual = storageTreeStore.getNode('fileA.txt')!

    expect(actual.parent!.value).toBe('')
    expect(actual.parent!.opened).toBeTruthy()
    expect(actual.value).toBe('fileA.txt')

    verifyParentChildRelationForTree(treeView)
  })

  it('移動先に同名のディレクトリまたはファイルが存在する場合', () => {
    storageTreeStore.removeNodes(STORAGE_NODES.map(node => node.path))

    const FM_UPDATED = dayjs('2020-01-01')
    const TO_UPDATED = dayjs('2020-01-02')
    const d1: StorageNode = {
      nodeType: StorageNodeType.Dir,
      name: 'd1',
      dir: '',
      path: 'd1',
      created: dayjs(),
      updated: FM_UPDATED,
    }
    const d1_docs: StorageNode = {
      nodeType: StorageNodeType.Dir,
      name: 'docs',
      dir: 'd1',
      path: 'd1/docs',
      created: dayjs(),
      updated: FM_UPDATED,
    }
    const d1_docs_aaa: StorageNode = {
      nodeType: StorageNodeType.Dir,
      name: 'aaa',
      dir: 'd1/docs',
      path: 'd1/docs/aaa',
      created: dayjs(),
      updated: FM_UPDATED,
    }
    const d1_docs_aaa_fileA: StorageNode = {
      nodeType: StorageNodeType.File,
      name: 'fileA.txt',
      dir: 'd1/docs/aaa',
      path: 'd1/docs/aaa/fileA.txt',
      created: dayjs(),
      updated: FM_UPDATED,
    }
    const d1_docs_fileB: StorageNode = {
      nodeType: StorageNodeType.File,
      name: 'fileB.txt',
      dir: 'd1/docs',
      path: 'd1/docs/fileB.txt',
      created: dayjs(),
      updated: FM_UPDATED,
    }
    const d1_docs_fileC: StorageNode = {
      nodeType: StorageNodeType.File,
      name: 'fileC.txt',
      dir: 'd1/docs',
      path: 'd1/docs/fileC.txt',
      created: dayjs(),
      updated: FM_UPDATED,
    }
    const docs: StorageNode = {
      nodeType: StorageNodeType.Dir,
      name: 'docs',
      dir: '',
      path: 'docs',
      created: dayjs(),
      updated: FM_UPDATED,
    }
    const docs_aaa: StorageNode = {
      nodeType: StorageNodeType.Dir,
      name: 'aaa',
      dir: 'docs',
      path: 'docs/aaa',
      created: dayjs(),
      updated: TO_UPDATED,
    }
    const docs_aaa_fileA: StorageNode = {
      nodeType: StorageNodeType.File,
      name: 'fileA.txt',
      dir: 'docs/aaa',
      path: 'docs/aaa/fileA.txt',
      created: dayjs(),
      updated: TO_UPDATED,
    }
    const docs_fileB: StorageNode = {
      nodeType: StorageNodeType.File,
      name: 'fileB.txt',
      dir: 'docs',
      path: 'docs/fileB.txt',
      created: dayjs(),
      updated: TO_UPDATED,
    }
    const docs_fileD: StorageNode = {
      nodeType: StorageNodeType.File,
      name: 'fileD.txt',
      dir: 'docs',
      path: 'docs/fileD.txt',
      created: dayjs(),
      updated: TO_UPDATED,
    }
    const docs_fileE: StorageNode = {
      nodeType: StorageNodeType.File,
      name: 'fileE.txt',
      dir: 'docs',
      path: 'docs/fileE.txt',
      created: dayjs(),
      updated: TO_UPDATED,
    }
    storageTreeStore.setNodes([
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
    storageTreeStore.moveNode('d1/docs', 'docs')

    const allNodePaths = storageTreeStore.getAllNodes().map(node => node.value)
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
    expect(storageTreeStore.getNode('docs')!.updatedDate).toEqual(FM_UPDATED)
    expect(storageTreeStore.getNode('docs/aaa')!.updatedDate).toEqual(FM_UPDATED)
    expect(storageTreeStore.getNode('docs/aaa/fileA.txt')!.updatedDate).toEqual(FM_UPDATED)
    expect(storageTreeStore.getNode('docs/fileB.txt')!.updatedDate).toEqual(FM_UPDATED)
    expect(storageTreeStore.getNode('docs/fileC.txt')!.updatedDate).toEqual(FM_UPDATED)
    // 次の2ファイルは移動先にもとからあったので更新日に変化はない
    expect(storageTreeStore.getNode('docs/fileD.txt')!.updatedDate).toEqual(TO_UPDATED)
    expect(storageTreeStore.getNode('docs/fileE.txt')!.updatedDate).toEqual(TO_UPDATED)

    verifyParentChildRelationForTree(treeView)
  })

  it('存在しないパスを指定した場合', () => {
    let actual: Error
    try {
      storageTreeStore.moveNode('dXXX', 'd2/dXXX')
    } catch (err) {
      actual = err
    }

    expect(actual!.message).toBe(`The specified node was not found: 'dXXX'`)
  })

  it('移動先ディレクトリが移動元のサブディレクトリの場合', () => {
    let actual: Error
    try {
      storageTreeStore.moveNode('d1', 'd1/d11/d1')
    } catch (err) {
      actual = err
    }

    expect(actual!.message).toBe(`The destination directory is its own subdirectory: 'd1' -> 'd1/d11/d1'`)
  })
})

describe('renameNode', () => {
  it('ディレクトリの名前変更', () => {
    storageTreeStore.renameNode('d1', 'x1')
    const actual = storageTreeStore.getNode('x1')!
    const descendants = actual.getDescendants()

    expect(actual.value).toBe('x1')
    expect(descendants.length).toBe(3)
    expect(descendants[0].value).toBe('x1/d11')
    expect(descendants[1].value).toBe('x1/d11/fileA.txt')
    expect(descendants[2].value).toBe('x1/d12')

    verifyParentChildRelationForTree(treeView)
  })

  it('ファイルの名前変更', () => {
    storageTreeStore.renameNode('d1/d11/fileA.txt', 'fileX.txt')
    const actual = storageTreeStore.getNode('d1/d11/fileX.txt')!

    expect(actual.value).toBe('d1/d11/fileX.txt')

    verifyParentChildRelationForTree(treeView)
  })

  it('存在しないパスを指定した場合', () => {
    let actual: Error
    try {
      storageTreeStore.renameNode('dXXX', 'x1')
    } catch (err) {
      actual = err
    }

    expect(actual!.message).toBe(`The specified node was not found: 'dXXX'`)
  })
})
