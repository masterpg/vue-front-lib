import * as path from 'path'
import { StorageNode, StorageNodeType, StorageState } from '@/lib/logic/store'
import { BaseStorageStore } from '@/lib/logic/store/modules/storage/base'
import { StorageStore } from '@/lib/logic/store/types'
import { TestStore } from '../../../../../../helpers/common/store'
import dayjs from 'dayjs'
import { initLibTest } from '../../../../../../helpers/lib/init'
import { removeStartDirChars } from 'web-base-lib'
const clone = require('lodash/clone')
const cloneDeep = require('lodash/cloneDeep')
const isArray = require('lodash/isArray')

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

class MockStorageStore extends BaseStorageStore {}
const storageStore = (new MockStorageStore() as any) as TestStore<StorageState, StorageStore>

function getStateNode(path: string): StorageNode | undefined {
  for (const node of storageStore.state.all) {
    if (node.path === path) {
      return node
    }
  }
  return undefined
}

function existsStateNodes(value: StorageNode | StorageNode[]) {
  const nodes = isArray(value) ? (value as StorageNode[]) : [value as StorageNode]
  for (const node of nodes) {
    const exists = getStateNode(node.path)
    if (!exists) {
      throw new Error(`The state node was not found: '${node.path}'`)
    }
  }
}

function notExistsStateNodes(value: StorageNode | StorageNode[]) {
  const nodes = isArray(value) ? (value as StorageNode[]) : [value as StorageNode]
  for (const node of nodes) {
    const exists = getStateNode(node.path)
    if (exists) {
      throw new Error(`The state node exists: '${node.path}'`)
    }
  }
}

function verifyStateNodes() {
  for (const node of storageStore.state.all) {
    const expectName = path.basename(node.path)
    const expectDir = removeStartDirChars(path.dirname(node.path))
    const expectPath = path.join(expectDir, expectName)
    expect(node.name).toBe(expectName)
    expect(node.dir).toBe(expectDir)
    expect(node.path).toBe(expectPath)
    expect(node.created).toBeDefined()
    expect(node.updated).toBeDefined()
  }
  toBeSorted()
}

/**
 * 指定されたノードがステートのコピーであり実態でないことを検証します。
 * @param node
 */
function toBeCopy(node: StorageNode | StorageNode[]): void {
  const nodes = isArray(node) ? (node as StorageNode[]) : [node as StorageNode]
  for (const node of nodes) {
    const stateNode = getStateNode(node.path)
    expect(node).not.toBe(stateNode)
  }
}

/**
 * ステートのノードがソートされているか検証します。
 */
function toBeSorted(): void {
  const beforeAll = clone(storageStore.state.all)
  const sortedAll = storageStore.sort(beforeAll)
  expect(storageStore.state.all).toEqual(sortedAll)
}

//========================================================================
//
//  Tests
//
//========================================================================

beforeAll(async () => {
  await initLibTest()
})

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
    created: dayjs(),
    updated: dayjs(),
  }

  const fileD: StorageNode = {
    nodeType: StorageNodeType.File,
    name: 'fileD.txt',
    dir: 'x1',
    path: 'x1/fileD.txt',
    created: dayjs(),
    updated: dayjs(),
  }

  it('ベーシックケース', () => {
    storageStore.setAll([fileD, x1])

    expect(storageStore.all.length).toBe(2)
    expect(storageStore.get(x1.path)).toEqual(x1)
    expect(storageStore.get(fileD.path)).toEqual(fileD)

    verifyStateNodes()
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

    verifyStateNodes()
    existsStateNodes(actual)
    toBeCopy(actual)
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
    path: 'd2/d22',
    created: dayjs(),
    updated: dayjs(),
  }

  const fileD: StorageNode = {
    nodeType: StorageNodeType.File,
    name: 'fileD.txt',
    dir: 'd2/d22',
    path: 'd2/d22/fileD.txt',
    created: dayjs(),
    updated: dayjs(),
  }

  it('ベーシックケース', () => {
    const actual = storageStore.addList([d22, fileD])

    expect(actual[0]).toEqual(d22)
    expect(actual[1]).toEqual(fileD)

    verifyStateNodes()
    existsStateNodes(actual)
    toBeCopy(actual)
  })
})

describe('add', () => {
  const fileD: StorageNode = {
    nodeType: StorageNodeType.File,
    name: 'fileD.txt',
    dir: 'd1/21',
    path: 'd1/21/fileD.txt',
    created: dayjs(),
    updated: dayjs(),
  }

  it('ベーシックケース', () => {
    const actual = storageStore.add(fileD)

    expect(actual).toEqual(fileD)

    verifyStateNodes()
    existsStateNodes(actual)
    toBeCopy(actual)
  })
})

describe('removeList', () => {
  it('ベーシックケース', () => {
    const actual = storageStore.removeList(['d1/d11', 'd1/d12'])

    expect(actual.length).toBe(3)
    expect(actual[0].path).toBe('d1/d11')
    expect(actual[1].path).toBe('d1/d11/fileA.txt')
    expect(actual[2].path).toBe('d1/d12')
    notExistsStateNodes(actual)
  })

  it(`'d1/d11'と親である'd1'を同時に指定した場合`, () => {
    const actual = storageStore.removeList(['d1/d11', 'd1'])

    storageStore.sort(actual)
    expect(actual.length).toBe(4)
    expect(actual[0].path).toBe('d1')
    expect(actual[1].path).toBe('d1/d11')
    expect(actual[2].path).toBe('d1/d11/fileA.txt')
    expect(actual[3].path).toBe('d1/d12')
    notExistsStateNodes(actual)
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
    notExistsStateNodes(actual)
  })
})

describe('move', () => {
  it('ディレクトリの移動 - ディレクトリへ移動', () => {
    const actual = storageStore.move('d1', 'd2/d1')

    expect(actual.length).toBe(4)
    expect(actual[0].path).toBe('d2/d1')
    expect(actual[1].path).toBe('d2/d1/d11')
    expect(actual[2].path).toBe('d2/d1/d11/fileA.txt')
    expect(actual[3].path).toBe('d2/d1/d12')

    verifyStateNodes()
    existsStateNodes(actual)
  })

  it('ディレクトリの移動 - ルートディレクトリへ移動', () => {
    const actual = storageStore.move('d1/d12', 'd12')

    expect(actual.length).toBe(1)
    expect(actual[0].path).toBe('d12')

    verifyStateNodes()
    existsStateNodes(actual)
  })

  it('ファイルの移動 - ディレクトリへ移動', () => {
    const actual = storageStore.move('d1/d11/fileA.txt', 'd1/d12/fileA.txt')

    expect(actual.length).toBe(1)
    expect(actual[0].path).toBe('d1/d12/fileA.txt')

    verifyStateNodes()
    existsStateNodes(actual)
  })

  it('ファイルの移動 - ルートディレクトリへ移動', () => {
    const actual = storageStore.move('d1/d11/fileA.txt', 'fileA.txt')

    expect(actual.length).toBe(1)
    expect(actual[0].path).toBe('fileA.txt')

    verifyStateNodes()
    existsStateNodes(actual)
  })

  it('存在しないパスを指定した場合', () => {
    let actual: Error
    try {
      storageStore.move('dXXX', 'd2/dXXX')
    } catch (err) {
      actual = err
    }

    expect(actual!.message).toBe(`The specified node was not found: 'dXXX'`)
  })

  it('移動先ディレクトリが移動元のサブディレクトリの場合', () => {
    let actual: Error
    try {
      storageStore.move('d1', 'd1/d11/d1')
    } catch (err) {
      actual = err
    }

    expect(actual!.message).toBe(`The destination directory is its own subdirectory: 'd1' -> 'd1/d11/d1'`)
  })
})

describe('rename', () => {
  it('ディレクトリの名前変更', () => {
    const actual = storageStore.rename('d1', 'x1')

    expect(actual.length).toBe(4)
    expect(actual[0].path).toBe('x1')
    expect(actual[1].path).toBe('x1/d11')
    expect(actual[2].path).toBe('x1/d11/fileA.txt')
    expect(actual[3].path).toBe('x1/d12')

    verifyStateNodes()
    existsStateNodes(actual)
  })

  it('ファイルの名前変更', () => {
    const actual = storageStore.rename('d1/d11/fileA.txt', 'fileX.txt')

    expect(actual.length).toBe(1)
    expect(actual[0].path).toBe('d1/d11/fileX.txt')

    verifyStateNodes()
    existsStateNodes(actual)
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
