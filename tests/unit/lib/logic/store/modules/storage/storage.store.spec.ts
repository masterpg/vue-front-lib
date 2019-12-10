import { StorageNode, StorageNodeType, StorageState, store } from '@/lib/logic/store'
import { StorageStore } from '@/lib/logic/store/types'
import { TestStore } from '../../../../../../helpers/common/store'
import { initLibStore } from '../../../../../../mocks/lib/logic/store'
const cloneDeep = require('lodash/cloneDeep')
const isArray = require('lodash/isArray')

initLibStore()
const storageStore = store.storage as TestStore<StorageState, StorageStore>

//========================================================================
//
//  Test data
//
//========================================================================

const d1 = {
  nodeType: StorageNodeType.Dir,
  name: 'd1',
  dir: '',
  path: 'd1',
}

const d11 = {
  nodeType: StorageNodeType.Dir,
  name: 'd11',
  dir: 'd1',
  path: 'd1/d11',
}

const fileA = {
  nodeType: StorageNodeType.File,
  name: 'fileA.txt',
  dir: 'd1/d11',
  path: 'd1/d11/fileA.txt',
}

const d12 = {
  nodeType: StorageNodeType.Dir,
  name: 'd12',
  dir: 'd1',
  path: 'd1/d12',
}

const d2 = {
  nodeType: StorageNodeType.Dir,
  name: 'd2',
  dir: '',
  path: 'd2',
}

const d21 = {
  nodeType: StorageNodeType.Dir,
  name: 'd21',
  dir: 'd2',
  path: 'd2/d21',
}

const fileB = {
  nodeType: StorageNodeType.File,
  name: 'fileB.txt',
  dir: 'd2/d21',
  path: 'd2/d21/fileB.txt',
}

const fileC = {
  nodeType: StorageNodeType.File,
  name: 'fileC.txt',
  dir: '',
  path: 'fileC.txt',
}

const STORAGE_NODES: StorageNode[] = [d1, d11, fileA, d12, d2, d21, fileB, fileC]

//========================================================================
//
//  Test helpers
//
//========================================================================

function getStateNode(path: string): StorageNode | undefined {
  for (const node of storageStore.state.all) {
    if (node.path === path) {
      return node
    }
  }
  return undefined
}

function toBeCopy(value: StorageNode | StorageNode[]): void {
  const nodes = isArray(value) ? (value as StorageNode[]) : [value as StorageNode]
  for (const node of nodes) {
    const stateNode = getStateNode(node.path)
    expect(node).not.toBe(stateNode)
  }
}

function existsNodes(value: StorageNode | StorageNode[]) {
  const nodes = isArray(value) ? (value as StorageNode[]) : [value as StorageNode]
  for (const node of nodes) {
    const exists = getStateNode(node.path)
    if (!exists) {
      throw new Error(`The state node was not found: '${node.path}'`)
    }
  }
}

function notExistsNodes(value: StorageNode | StorageNode[]) {
  const nodes = isArray(value) ? (value as StorageNode[]) : [value as StorageNode]
  for (const node of nodes) {
    const exists = getStateNode(node.path)
    if (exists) {
      throw new Error(`The state node exists: '${node.path}'`)
    }
  }
}

//========================================================================
//
//  Tests
//
//========================================================================

beforeEach(async () => {
  storageStore.initState({
    all: storageStore.sort(cloneDeep(STORAGE_NODES)),
  })
})

describe('all', () => {
  it('ベーシックケース', () => {
    const actual = storageStore.all

    expect(actual).toEqual(storageStore.state.all)
    toBeCopy(actual)
  })
})

describe('get', () => {
  it('ベーシックケース', () => {
    const d11 = getStateNode('d1/d11')!
    const actual = storageStore.get(d11.path)!

    expect(actual).toEqual(d11)
    toBeCopy(actual)
  })
})

describe('getDescendants', () => {
  it('ベーシックケース', () => {
    const actual = storageStore.getDescendants('d1')

    expect(actual.length).toBe(3)
    expect(actual[0].path).toEqual('d1/d11')
    expect(actual[1].path).toEqual('d1/d11/fileA.txt')
    expect(actual[2].path).toEqual('d1/d12')
    toBeCopy(actual)
  })
})

describe('getMap', () => {
  it('ベーシックケース', () => {
    const actual = storageStore.getMap()

    expect(Object.keys(actual).length).toBe(8)
    expect(actual['d1']).toBeDefined()
    expect(actual['d1/d11']).toBeDefined()
    expect(actual['d1/d11/fileA.txt']).toBeDefined()
    expect(actual['d1/d12']).toBeDefined()
    expect(actual['d2']).toBeDefined()
    expect(actual['d2/d21']).toBeDefined()
    expect(actual['d2/d21/fileB.txt']).toBeDefined()
    expect(actual['fileC.txt']).toBeDefined()
    toBeCopy(Object.values(actual))
  })
})

describe('setAll', () => {
  const x1: StorageNode = {
    nodeType: StorageNodeType.Dir,
    name: 'x1',
    dir: '',
    path: 'x1',
  }

  const fileD: StorageNode = {
    nodeType: StorageNodeType.File,
    name: 'fileD.txt',
    dir: 'x1',
    path: 'x1/fileD.txt',
  }

  it('ベーシックケース', () => {
    storageStore.setAll([fileD, x1])

    expect(storageStore.all.length).toBe(2)
    expect(storageStore.get(x1.path)).toEqual(x1)
    expect(storageStore.get(fileD.path)).toEqual(fileD)
    // 追加されたノードがソートされているか検証
    const sortedAll = storageStore.sort([fileD, x1])
    expect(storageStore.all).toEqual(sortedAll)
  })
})

describe('setList', () => {
  it('pathを変更', () => {
    const actual = storageStore.setList([
      { path: 'd1', newPath: 'x1' },
      { path: 'd1/d11', newPath: 'x1/x11' },
      { path: 'd1/d11/fileA.txt', newPath: 'x1/x11/fileA.txt' },
    ])

    expect(actual.length).toBe(3)
    expect(actual[0].name).toEqual('x1')
    expect(actual[0].dir).toEqual('')
    expect(actual[0].path).toEqual('x1')
    expect(actual[1].name).toEqual('x11')
    expect(actual[1].dir).toEqual('x1')
    expect(actual[1].path).toEqual('x1/x11')
    expect(actual[2].name).toEqual('fileA.txt')
    expect(actual[2].dir).toEqual('x1/x11')
    expect(actual[2].path).toEqual('x1/x11/fileA.txt')
    existsNodes(actual)
    toBeCopy(actual)
    // 変更されたノードがソートされているか検証
    const sortedAll = storageStore.sort(storageStore.all)
    expect(storageStore.all).toEqual(sortedAll)
  })

  it('存在しないpathを指定した場合', () => {
    let actual: Error
    try {
      storageStore.setList([{ path: 'dXXX', newPath: 'dYYY' }])
    } catch (err) {
      actual = err
    }

    expect(actual!.message).toBe(`The specified node was not found: 'dXXX'`)
  })
})

describe('addList', () => {
  const d22: StorageNode = {
    nodeType: StorageNodeType.Dir,
    name: 'd22',
    dir: 'd2',
    path: 'd2/22',
  }

  const fileD: StorageNode = {
    nodeType: StorageNodeType.File,
    name: 'fileD.txt',
    dir: 'd2/22',
    path: 'd2/22/fileD.txt',
  }

  it('ベーシックケース', () => {
    const actual = storageStore.addList([d22, fileD])

    expect(actual[0]).toEqual(d22)
    expect(actual[1]).toEqual(fileD)
    existsNodes(actual)
    toBeCopy(actual)
    // 追加されたノードがソートされているか検証
    const sortedAll = storageStore.sort([...STORAGE_NODES, d22, fileD])
    expect(storageStore.all).toEqual(sortedAll)
  })
})

describe('add', () => {
  const fileD: StorageNode = {
    nodeType: StorageNodeType.File,
    name: 'fileD.txt',
    dir: 'd1/21',
    path: 'd1/21/fileD.txt',
  }

  it('ベーシックケース', () => {
    const actual = storageStore.add(fileD)

    expect(actual).toEqual(fileD)
    existsNodes(actual)
    toBeCopy(actual)
    // 追加されたノードがソートされているか検証
    const sortedAll = storageStore.sort([...STORAGE_NODES, fileD])
    expect(storageStore.all).toEqual(sortedAll)
  })
})

describe('removeList', () => {
  it('ベーシックケース', () => {
    const actual = storageStore.removeList(['d1/d11', 'd1/d12'])

    expect(actual.length).toBe(3)
    expect(actual[0].path).toBe('d1/d11')
    expect(actual[1].path).toBe('d1/d11/fileA.txt')
    expect(actual[2].path).toBe('d1/d12')
    notExistsNodes(actual)
  })

  it(`'d1/d11'と親である'd1'を同時に指定した場合`, () => {
    const actual = storageStore.removeList(['d1/d11', 'd1'])

    storageStore.sort(actual)
    expect(actual.length).toBe(4)
    expect(actual[0].path).toBe('d1')
    expect(actual[1].path).toBe('d1/d11')
    expect(actual[2].path).toBe('d1/d11/fileA.txt')
    expect(actual[3].path).toBe('d1/d12')
    notExistsNodes(actual)
  })

  it('存在しないパスを指定した場合', () => {
    const actual = storageStore.removeList(['dXXX'])

    expect(actual.length).toBe(0)
  })
})

describe('remove', () => {
  it('ベーシックケース', () => {
    const actual = storageStore.remove('d1/d11')

    expect(actual.length).toBe(2)
    expect(actual[0].path).toBe('d1/d11')
    expect(actual[1].path).toBe('d1/d11/fileA.txt')
    notExistsNodes(actual)
  })
})

describe('rename', () => {
  it('ベーシックケース', () => {
    const actual = storageStore.rename('d1', 'x1')

    expect(actual.length).toBe(4)
    expect(actual[0].path).toBe('x1')
    expect(actual[1].path).toBe('x1/d11')
    expect(actual[2].path).toBe('x1/d11/fileA.txt')
    expect(actual[3].path).toBe('x1/d12')
    existsNodes(actual)
  })

  it('存在しないパスを指定した場合', () => {
    let actual: Error
    try {
      storageStore.rename('dXXX', 'x1')
    } catch (err) {
      actual = err
    }

    expect(actual!.message).toBe(`The specified node was not found: 'dXXX'`)
  })
})

describe('sort', () => {
  it('ベーシックケース', () => {
    const actual = storageStore.sort([fileA, fileB, fileC, d1, d2, d11, d12, d21])

    expect(actual[0]).toEqual(d1)
    expect(actual[1]).toEqual(d11)
    expect(actual[2]).toEqual(fileA)
    expect(actual[3]).toEqual(d12)
    expect(actual[4]).toEqual(d2)
    expect(actual[5]).toEqual(d21)
    expect(actual[6]).toEqual(fileB)
    expect(actual[7]).toEqual(fileC)
  })
})
