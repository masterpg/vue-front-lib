import * as path from 'path'
import * as shortid from 'shortid'
import { StorageNode, StorageNodeShareSettings, StorageNodeType, StorageState } from '@/lib'
import { cloneTestStorageNode, newTestStorageDirNode, newTestStorageFileNode } from '../../../../../../helpers/common/storage'
import { BaseStorageStore } from '@/lib/logic/store/modules/storage/base'
import { Component } from 'vue-property-decorator'
import { StorageStore } from '@/lib/logic/store/types'
import { TestStore } from '../../../../../../helpers/common/store'
import dayjs from 'dayjs'
import { initLibTest } from '../../../../../../helpers/lib/init'
import { removeStartDirChars } from 'web-base-lib'
const cloneDeep = require('lodash/cloneDeep')

//========================================================================
//
//  Test helpers
//
//========================================================================

@Component
class MockStorageStore extends BaseStorageStore {}

const storageStore = (new MockStorageStore() as StorageStore) as TestStore<StorageStore, StorageState>

function getStateNode(path: string): StorageNode | undefined {
  for (const node of storageStore.state.all) {
    if (node.path === path) return node
  }
  return undefined
}

function existsStateNodes(value: StorageNode | StorageNode[]) {
  const nodes = Array.isArray(value) ? (value as StorageNode[]) : [value as StorageNode]
  for (const node of nodes) {
    const exists = getStateNode(node.path)
    if (!exists) {
      throw new Error(`The state node was not found: '${node.path}'`)
    }
  }
}

function notExistsStateNodes(value: StorageNode | StorageNode[]) {
  const nodes = Array.isArray(value) ? (value as StorageNode[]) : [value as StorageNode]
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
    if (node.nodeType === StorageNodeType.Dir) {
      expect(node.contentType).toBe('')
      expect(node.size).toBe(0)
    } else if (node.nodeType === StorageNodeType.File) {
      expect(node.contentType).toBeDefined()
      expect(node.size).toBeGreaterThan(0)
    }
    expect(node.created).toBeDefined()
    expect(node.updated).toBeDefined()
  }
  toBeSorted()
}

/**
 * 指定されたアイテムがステートのコピーであり、実態でないことを検証します。
 * @param node
 */
function toBeCopy(node: StorageNode | StorageNode[]): void {
  const nodes = Array.isArray(node) ? (node as StorageNode[]) : [node as StorageNode]
  for (const node of nodes) {
    const stateNode = getStateNode(node.path)
    expect(node).not.toBe(stateNode)
  }
}

/**
 * ステートのノードがソートされているか検証します。
 */
function toBeSorted(): void {
  const beforeAll = [...storageStore.state.all]
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
  // storageStore.initState({
  //   all: storageStore.sort(cloneDeep(STORAGE_NODES)),
  // })
})

describe('all', () => {
  it('ベーシックケース', () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const d111 = newTestStorageDirNode('d1/d11/d111')
    const f1111 = newTestStorageFileNode('d1/d11/d111/f1111.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const f11 = newTestStorageFileNode('d1/f11.txt')
    const d2 = newTestStorageDirNode('d2')
    const d21 = newTestStorageDirNode('d2/d21')
    const f211 = newTestStorageFileNode('d2/d21/f211.txt')
    const f1 = newTestStorageFileNode('f1.txt')
    storageStore.initState({
      all: storageStore.sort([d1, d11, d111, f1111, d12, f11, d2, d21, f211, f1]),
    })

    const actual = storageStore.all

    expect(actual).toEqual(storageStore.state.all)
    toBeCopy(actual)
  })
})

describe('get', () => {
  it('ベーシックケース - id検索', () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const d2 = newTestStorageDirNode('d2')
    storageStore.initState({
      all: storageStore.sort([d1, d11, f111, d12, d2]),
    })

    const actual = storageStore.get({ id: d11.id })!

    expect(actual).toEqual(d11)
    toBeCopy(actual)
  })

  it('ベーシックケース - path検索', () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const d2 = newTestStorageDirNode('d2')
    storageStore.initState({
      all: storageStore.sort([d1, d11, f111, d12, d2]),
    })

    const actual = storageStore.get({ path: d11.path })!

    expect(actual).toEqual(d11)
    toBeCopy(actual)
  })

  it('idとpath両方指定しなかった場合', () => {
    let actual!: Error
    try {
      storageStore.get({})
    } catch (err) {
      actual = err
    }

    expect(actual.message).toBe(`Either the 'id' or the 'path' must be specified.`)
  })
})

describe('getById', () => {
  it('ベーシックケース', () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const d2 = newTestStorageDirNode('d2')
    storageStore.initState({
      all: storageStore.sort([d1, d11, f111, d12, d2]),
    })

    const actual = storageStore.get({ id: d11.id })!

    expect(actual).toEqual(d11)
    toBeCopy(actual)
  })
})

describe('getChildren', () => {
  it('ベーシックケース', () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const d2 = newTestStorageDirNode('d2')
    storageStore.initState({
      all: storageStore.sort(cloneDeep([d1, d11, f111, d12, d2])),
    })

    const actual = storageStore.getChildren(d1.path)

    expect(actual.length).toBe(2)
    expect(actual[0].path).toEqual('d1/d11')
    expect(actual[1].path).toEqual('d1/d12')
    toBeCopy(actual)
  })
})

describe('getDirChildren', () => {
  it('ベーシックケース', () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const d2 = newTestStorageDirNode('d2')
    storageStore.initState({
      all: storageStore.sort([d1, d11, f111, d12, d2]),
    })

    const actual = storageStore.getDirChildren('d1')

    expect(actual.length).toBe(3)
    expect(actual[0].path).toEqual('d1')
    expect(actual[1].path).toEqual('d1/d11')
    expect(actual[2].path).toEqual('d1/d12')
    toBeCopy(actual)
  })

  it('dirPathを指定しない場合', () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const d2 = newTestStorageDirNode('d2')
    storageStore.initState({
      all: storageStore.sort([d1, d11, f111, d12, d2]),
    })

    const actual = storageStore.getDirChildren()

    expect(actual.length).toBe(2)
    expect(actual[0].path).toEqual('d1')
    expect(actual[1].path).toEqual('d2')
    toBeCopy(actual)
  })
})

describe('getDescendants', () => {
  it('ベーシックケース', () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const d2 = newTestStorageDirNode('d2')
    storageStore.initState({
      all: storageStore.sort([d1, d11, f111, d12, d2]),
    })

    const actual = storageStore.getDescendants(d1.path)

    expect(actual.length).toBe(3)
    expect(actual[0].path).toEqual('d1/d11')
    expect(actual[1].path).toEqual('d1/d11/f111.txt')
    expect(actual[2].path).toEqual('d1/d12')
    toBeCopy(actual)
  })
})

describe('getDirDescendants', () => {
  it('ベーシックケース', () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const d2 = newTestStorageDirNode('d2')
    storageStore.initState({
      all: storageStore.sort([d1, d11, f111, d12, d2]),
    })

    const actual = storageStore.getDirDescendants(d1.path)

    expect(actual.length).toBe(4)
    expect(actual[0].path).toEqual('d1')
    expect(actual[1].path).toEqual('d1/d11')
    expect(actual[2].path).toEqual('d1/d11/f111.txt')
    expect(actual[3].path).toEqual('d1/d12')
    toBeCopy(actual)
  })

  it('dirPathを指定しない場合', () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const d2 = newTestStorageDirNode('d2')
    storageStore.initState({
      all: storageStore.sort([d1, d11, f111, d12, d2]),
    })

    const actual = storageStore.getDirDescendants()

    expect(actual.length).toBe(5)
    expect(actual[0].path).toEqual('d1')
    expect(actual[1].path).toEqual('d1/d11')
    expect(actual[2].path).toEqual('d1/d11/f111.txt')
    expect(actual[3].path).toEqual('d1/d12')
    expect(actual[4].path).toEqual('d2')
    toBeCopy(actual)
  })
})

describe('getDict', () => {
  it('ベーシックケース', () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const d2 = newTestStorageDirNode('d2')
    const d21 = newTestStorageDirNode('d2/d21')
    const f211 = newTestStorageFileNode('d2/d21/f211.txt')
    const f1 = newTestStorageFileNode('f1.txt')
    storageStore.initState({
      all: storageStore.sort([d1, d11, f111, d12, d2, d21, f211, f1]),
    })

    const actual = storageStore.getDict()

    expect(Object.keys(actual).length).toBe(8)
    expect(actual['d1']).toBeDefined()
    expect(actual['d1/d11']).toBeDefined()
    expect(actual['d1/d11/f111.txt']).toBeDefined()
    expect(actual['d1/d12']).toBeDefined()
    expect(actual['d2']).toBeDefined()
    expect(actual['d2/d21']).toBeDefined()
    expect(actual['d2/d21/f211.txt']).toBeDefined()
    expect(actual['f1.txt']).toBeDefined()
    toBeCopy(Object.values(actual))
  })
})

describe('setAll', () => {
  it('ベーシックケース', () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const d2 = newTestStorageDirNode('d2')
    const f1 = newTestStorageFileNode('f1.txt')
    storageStore.initState({
      all: storageStore.sort([d1, d11, f111, d12, d2]),
    })

    storageStore.setAll([d2, f1])

    expect(storageStore.all.length).toBe(2)
    expect(storageStore.get({ path: d2.path })).toEqual(d2)
    expect(storageStore.get({ path: f1.path })).toEqual(f1)

    verifyStateNodes()
  })
})

describe('setList', () => {
  it('ベーシックケース', () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const d2 = newTestStorageDirNode('d2')
    storageStore.initState({
      all: storageStore.sort([d1, d11, f111, d12, d2]),
    })

    const UPDATED = dayjs('2019-01-01')
    const NEW_SHARE_SETTINGS: StorageNodeShareSettings = {
      isPublic: true,
      uids: ['ichiro'],
    }
    const actual = storageStore.setList([
      cloneTestStorageNode(d11, { share: NEW_SHARE_SETTINGS, created: UPDATED, updated: UPDATED }),
      cloneTestStorageNode(f111, { share: NEW_SHARE_SETTINGS, created: UPDATED, updated: UPDATED }),
    ])

    expect(actual.length).toBe(2)
    expect(actual[0].id).toBe(d11.id)
    expect(actual[0].share).toEqual(NEW_SHARE_SETTINGS)
    expect(actual[0].created).toEqual(UPDATED)
    expect(actual[0].updated).toEqual(UPDATED)
    expect(actual[1].id).toBe(f111.id)
    expect(actual[1].share).toEqual(NEW_SHARE_SETTINGS)
    expect(actual[1].created).toEqual(UPDATED)
    expect(actual[1].updated).toEqual(UPDATED)

    verifyStateNodes()
    existsStateNodes(actual)
    toBeCopy(actual)
  })

  it('プロパティの変更', () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const d2 = newTestStorageDirNode('d2')
    storageStore.initState({
      all: storageStore.sort([d1, d11, f111, d12, d2]),
    })

    const UPDATED = dayjs('2019-01-01')
    const NEW_SHARE_SETTINGS: StorageNodeShareSettings = {
      isPublic: true,
      uids: ['ichiro'],
    }
    const actual = storageStore.setList([
      cloneTestStorageNode(f111, {
        name: 'new_f111.txt',
        dir: 'd1',
        path: 'd1/new_f111.txt',
        contentType: 'application/octet-stream',
        size: 99,
        share: NEW_SHARE_SETTINGS,
        created: UPDATED,
        updated: UPDATED,
      }),
    ])

    expect(actual.length).toBe(1)
    expect(actual[0].id).toBe(f111.id)
    expect(actual[0].name).toBe('new_f111.txt')
    expect(actual[0].dir).toBe('d1')
    expect(actual[0].path).toBe('d1/new_f111.txt')
    expect(actual[0].contentType).toBe('application/octet-stream')
    expect(actual[0].size).toEqual(99)
    expect(actual[0].share).toEqual(NEW_SHARE_SETTINGS)
    expect(actual[0].created).toEqual(UPDATED)
    expect(actual[0].updated).toEqual(UPDATED)
    // ---> コピーが設定されていることを検証
    expect(actual[0].share).not.toBe(NEW_SHARE_SETTINGS)
    expect(actual[0].share.uids).not.toBe(NEW_SHARE_SETTINGS.uids)
    // <---

    verifyStateNodes()
    existsStateNodes(actual)
    toBeCopy(actual)
  })

  it('プロパティの変更がない場合', () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const d2 = newTestStorageDirNode('d2')
    storageStore.initState({
      all: storageStore.sort([d1, d11, f111, d12, d2]),
    })

    const actual = storageStore.setList([
      {
        id: f111.id,
        name: f111.name,
        dir: f111.dir,
        path: f111.path,
      },
    ])

    expect(actual.length).toBe(1)
    expect(actual[0].id).toBe(f111.id)
    expect(actual[0].name).toBe(f111.name)
    expect(actual[0].dir).toBe(f111.dir)
    expect(actual[0].path).toBe(f111.path)
    expect(actual[0].contentType).toBe(f111.contentType)
    expect(actual[0].share).toEqual(f111.share)
    expect(actual[0].created).toEqual(f111.created)
    expect(actual[0].updated).toEqual(f111.updated)

    verifyStateNodes()
    existsStateNodes(actual)
    toBeCopy(actual)
  })

  it('存在しないpathを指定した場合', () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const d2 = newTestStorageDirNode('d2')
    storageStore.initState({
      all: storageStore.sort([d1, d11, f111, d12, d2]),
    })

    let actual!: Error
    const notExistsId = shortid.generate()
    try {
      storageStore.setList([{ id: notExistsId, name: `dX`, dir: ``, path: `dX` }])
    } catch (err) {
      actual = err
    }

    expect(actual.message).toBe(`The specified node was not found: '${notExistsId}'`)
  })
})

describe('addList', () => {
  it('ベーシックケース', () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const f121 = newTestStorageFileNode('d1/d12/f121.txt')
    const d2 = newTestStorageDirNode('d2')
    storageStore.initState({
      all: storageStore.sort([d1, d11, f111, d12, d2]),
    })

    const actual = storageStore.addList([d12, f121])

    expect(actual[0]).toEqual(d12)
    expect(actual[1]).toEqual(f121)

    verifyStateNodes()
    existsStateNodes(actual)
    toBeCopy(actual)
  })
})

describe('add', () => {
  it('ベーシックケース', () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const f121 = newTestStorageFileNode('d1/d12/f121.txt')
    const d2 = newTestStorageDirNode('d2')
    storageStore.initState({
      all: storageStore.sort([d1, d11, f111, d12, d2]),
    })

    const actual = storageStore.add(f121)

    expect(actual).toEqual(f121)

    verifyStateNodes()
    existsStateNodes(actual)
    toBeCopy(actual)
  })
})

describe('removeList', () => {
  describe('pathバージョン', () => {
    it('ベーシックケース', () => {
      const d1 = newTestStorageDirNode('d1')
      const d11 = newTestStorageDirNode('d1/d11')
      const f111 = newTestStorageFileNode('d1/d11/f111.txt')
      const d12 = newTestStorageDirNode('d1/d12')
      const d2 = newTestStorageDirNode('d2')
      storageStore.initState({
        all: storageStore.sort([d1, d11, f111, d12, d2]),
      })

      const actual = storageStore.removeList({ paths: [d11.path, d12.path] })

      expect(actual.length).toBe(3)
      expect(actual[0].path).toBe('d1/d11')
      expect(actual[1].path).toBe('d1/d11/f111.txt')
      expect(actual[2].path).toBe('d1/d12')
      notExistsStateNodes(actual)
    })

    it(`'d1/d11'と親である'd1'をで同時に指定した場合`, () => {
      const d1 = newTestStorageDirNode('d1')
      const d11 = newTestStorageDirNode('d1/d11')
      const f111 = newTestStorageFileNode('d1/d11/f111.txt')
      const d12 = newTestStorageDirNode('d1/d12')
      const d2 = newTestStorageDirNode('d2')
      storageStore.initState({
        all: storageStore.sort([d1, d11, f111, d12, d2]),
      })

      const actual = storageStore.removeList({ paths: [d11.path, d1.path] })

      storageStore.sort(actual)
      expect(actual.length).toBe(4)
      expect(actual[0].path).toBe('d1')
      expect(actual[1].path).toBe('d1/d11')
      expect(actual[2].path).toBe('d1/d11/f111.txt')
      expect(actual[3].path).toBe('d1/d12')
      notExistsStateNodes(actual)
    })

    it('存在しないパスを含んでいた場合', () => {
      const d1 = newTestStorageDirNode('d1')
      const d11 = newTestStorageDirNode('d1/d11')
      const f111 = newTestStorageFileNode('d1/d11/f111.txt')
      const d12 = newTestStorageDirNode('d1/d12')
      const d2 = newTestStorageDirNode('d2')
      storageStore.initState({
        all: storageStore.sort([d1, d11, f111, d12, d2]),
      })

      const actual = storageStore.removeList({ paths: [d11.path, 'dX', d12.path] })

      expect(actual.length).toBe(3)
      expect(actual[0].path).toBe('d1/d11')
      expect(actual[1].path).toBe('d1/d11/f111.txt')
      expect(actual[2].path).toBe('d1/d12')
      notExistsStateNodes(actual)
    })
  })

  describe('idバージョン', () => {
    it('ベーシックケース - idバージョン', () => {
      const d1 = newTestStorageDirNode('d1')
      const d11 = newTestStorageDirNode('d1/d11')
      const f111 = newTestStorageFileNode('d1/d11/f111.txt')
      const d12 = newTestStorageDirNode('d1/d12')
      const d2 = newTestStorageDirNode('d2')
      storageStore.initState({
        all: storageStore.sort([d1, d11, f111, d12, d2]),
      })

      const actual = storageStore.removeList({ ids: [d11.id, d12.id] })

      expect(actual.length).toBe(3)
      expect(actual[0].path).toBe('d1/d11')
      expect(actual[1].path).toBe('d1/d11/f111.txt')
      expect(actual[2].path).toBe('d1/d12')

      verifyStateNodes()
      notExistsStateNodes(actual)
    })

    it(`'d1/d11'と親である'd1'を同時に指定した場合 - idバージョン`, () => {
      const d1 = newTestStorageDirNode('d1')
      const d11 = newTestStorageDirNode('d1/d11')
      const f111 = newTestStorageFileNode('d1/d11/f111.txt')
      const d12 = newTestStorageDirNode('d1/d12')
      const d2 = newTestStorageDirNode('d2')
      storageStore.initState({
        all: storageStore.sort([d1, d11, f111, d12, d2]),
      })

      const actual = storageStore.removeList({ ids: [d11.id, d1.id] })

      storageStore.sort(actual)
      expect(actual.length).toBe(4)
      expect(actual[0].path).toBe('d1')
      expect(actual[1].path).toBe('d1/d11')
      expect(actual[2].path).toBe('d1/d11/f111.txt')
      expect(actual[3].path).toBe('d1/d12')

      verifyStateNodes()
      notExistsStateNodes(actual)
    })

    it('存在しないIDを含んでいた場合', () => {
      const d1 = newTestStorageDirNode('d1')
      const d11 = newTestStorageDirNode('d1/d11')
      const f111 = newTestStorageFileNode('d1/d11/f111.txt')
      const d12 = newTestStorageDirNode('d1/d12')
      const d2 = newTestStorageDirNode('d2')
      storageStore.initState({
        all: storageStore.sort([d1, d11, f111, d12, d2]),
      })

      const actual = storageStore.removeList({ ids: [d11.id, 'xxx', d12.id] })

      expect(actual.length).toBe(3)
      expect(actual[0].path).toBe('d1/d11')
      expect(actual[1].path).toBe('d1/d11/f111.txt')
      expect(actual[2].path).toBe('d1/d12')

      verifyStateNodes()
      notExistsStateNodes(actual)
    })
  })

  it('idsとpaths両方指定しなかった場合', () => {
    let actual!: Error
    try {
      storageStore.removeList({})
    } catch (err) {
      actual = err
    }

    expect(actual.message).toBe(`Either the 'ids' or the 'paths' must be specified.`)
  })
})

describe('remove', () => {
  it('ベーシックケース - pathバージョン', () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const d2 = newTestStorageDirNode('d2')
    storageStore.initState({
      all: storageStore.sort([d1, d11, f111, d12, d2]),
    })

    const actual = storageStore.remove({ path: d11.path })

    expect(actual.length).toBe(2)
    expect(actual[0].path).toBe('d1/d11')
    expect(actual[1].path).toBe('d1/d11/f111.txt')

    verifyStateNodes()
    notExistsStateNodes(actual)
  })

  it('ベーシックケース - idバージョン', () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const d2 = newTestStorageDirNode('d2')
    storageStore.initState({
      all: storageStore.sort([d1, d11, f111, d12, d2]),
    })

    const actual = storageStore.remove({ id: d11.id })

    expect(actual.length).toBe(2)
    expect(actual[0].path).toBe('d1/d11')
    expect(actual[1].path).toBe('d1/d11/f111.txt')

    verifyStateNodes()
    notExistsStateNodes(actual)
  })

  it(`ディレクトリ名があるディレクトリ名をベースにしている場合（'d1'と'd1_bk'のように）`, () => {
    // root
    // └d1
    //  ├d11 ← 削除
    //  │├d111
    //  ││└fileA.txt
    //  │└fileB.txt
    //  └d11_bk
    //     └fileC.txt
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const d111 = newTestStorageDirNode('d1/d11/d111')
    const fileA = newTestStorageDirNode('d1/d11/d111/fileA.txt')
    const fileB = newTestStorageDirNode('d1/d11/fileB.txt')
    const d11_bk = newTestStorageDirNode('d1/d11_bk')
    const fileC = newTestStorageDirNode('d1/d11_bk/fileC.txt')
    storageStore.initState({
      all: storageStore.sort([d1, d11, d111, fileA, fileB, d11_bk, fileC]),
    })

    const actual = storageStore.remove({ path: 'd1/d11' })

    expect(actual.length).toBe(4)
    expect(actual[0].path).toBe('d1/d11')
    expect(actual[1].path).toBe('d1/d11/d111')
    expect(actual[2].path).toBe('d1/d11/d111/fileA.txt')
    expect(actual[3].path).toBe('d1/d11/fileB.txt')

    verifyStateNodes()
    notExistsStateNodes(actual)
  })

  it('存在しないパスを指定した場合', () => {
    const d1 = newTestStorageDirNode('d1')
    storageStore.initState({
      all: storageStore.sort([d1]),
    })

    const actual = storageStore.remove({ path: 'dXXX' })

    expect(actual.length).toBe(0)
  })

  it('存在しないIDを指定した場合', () => {
    const d1 = newTestStorageDirNode('d1')
    storageStore.initState({
      all: storageStore.sort([d1]),
    })

    const actual = storageStore.remove({ id: 'xxx' })

    expect(actual.length).toBe(0)
  })
})

describe('move', () => {
  it('ディレクトリの移動 - ディレクトリへ移動', () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const d2 = newTestStorageDirNode('d2')
    storageStore.initState({
      all: storageStore.sort([d1, d11, f111, d12, d2]),
    })

    const actual = storageStore.move('d1', 'd2/d1')

    expect(actual.length).toBe(4)
    expect(actual[0].path).toBe('d2/d1')
    expect(actual[1].path).toBe('d2/d1/d11')
    expect(actual[2].path).toBe('d2/d1/d11/f111.txt')
    expect(actual[3].path).toBe('d2/d1/d12')

    verifyStateNodes()
    existsStateNodes(actual)
  })

  it('ディレクトリの移動 - ルートディレクトリへ移動', () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const d2 = newTestStorageDirNode('d2')
    storageStore.initState({
      all: storageStore.sort([d1, d11, f111, d12, d2]),
    })

    const actual = storageStore.move('d1/d12', 'd12')

    expect(actual.length).toBe(1)
    expect(actual[0].path).toBe('d12')

    verifyStateNodes()
    existsStateNodes(actual)
  })

  it('ファイルの移動 - ディレクトリへ移動', () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const d2 = newTestStorageDirNode('d2')
    storageStore.initState({
      all: storageStore.sort([d1, d11, f111, d12, d2]),
    })

    const actual = storageStore.move('d1/d11/f111.txt', 'd1/d12/f111.txt')

    expect(actual.length).toBe(1)
    expect(actual[0].path).toBe('d1/d12/f111.txt')

    verifyStateNodes()
    existsStateNodes(actual)
  })

  it('ファイルの移動 - ルートディレクトリへ移動', () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const d2 = newTestStorageDirNode('d2')
    storageStore.initState({
      all: storageStore.sort([d1, d11, f111, d12, d2]),
    })

    const actual = storageStore.move('d1/d11/f111.txt', 'f111.txt')

    expect(actual.length).toBe(1)
    expect(actual[0].path).toBe('f111.txt')

    verifyStateNodes()
    existsStateNodes(actual)
  })

  it('移動先に同名のディレクトリまたはファイルが存在する場合', async () => {
    // root
    // ├dA
    // │└d1 ← 移動するノード
    // │  ├d11
    // │  │└d111
    // │  │  ├fileA.txt
    // │  │  └fileB.txt
    // │  ├d12
    // │  ├fileX.txt
    // │  └fileY.txt
    // └dB
    //   └d1 ← ここへ上書き移動
    //     ├d11
    //     │└d111
    //     │  ├fileA.txt
    //     │  └fileC.txt
    //     ├d13
    //     ├fileX.txt
    //     └fileZ.txt
    const dA = newTestStorageDirNode('dA')
    const dA_d1 = newTestStorageDirNode('dA/d1')
    const dA_d11 = newTestStorageDirNode('dA/d1/d11')
    const dA_d111 = newTestStorageDirNode('dA/d1/d11/d111')
    const dA_fileA = newTestStorageFileNode('dA/d1/d11/d111/fileA.txt')
    const dA_fileB = newTestStorageFileNode('dA/d1/d11/d111/fileB.txt')
    const dA_d12 = newTestStorageDirNode('dA/d1/d12')
    const dA_fileX = newTestStorageFileNode('dA/d1/fileX.txt')
    const dA_fileY = newTestStorageFileNode('dA/d1/fileY.txt')
    const dB = newTestStorageDirNode('dB')
    const dB_d1 = newTestStorageDirNode('dB/d1')
    const dB_d11 = newTestStorageDirNode('dB/d1/d11')
    const dB_d111 = newTestStorageDirNode('dB/d1/d11/d111')
    const dB_fileA = newTestStorageFileNode('dB/d1/d11/d111/fileA.txt')
    const dB_fileC = newTestStorageFileNode('dB/d1/d11/d111/fileC.txt')
    const dB_d13 = newTestStorageDirNode('dB/d1/d13')
    const dB_fileX = newTestStorageFileNode('dB/d1/fileX.txt')
    const dB_fileZ = newTestStorageFileNode('dB/d1/fileZ.txt')
    storageStore.initState({
      all: storageStore.sort([
        dA,
        dA_d1,
        dA_d11,
        dA_d111,
        dA_fileA,
        dA_fileB,
        dA_d12,
        dA_fileX,
        dA_fileY,
        dB,
        dB_d1,
        dB_d11,
        dB_d111,
        dB_fileA,
        dB_fileC,
        dB_d13,
        dB_fileX,
        dB_fileZ,
      ]),
    })

    // 'dA/d1'を'dB'へ移動
    const actual = storageStore.move('dA/d1', 'dB/d1')

    // root
    // ├dA
    // └dB
    //   └d1
    //     ├d11
    //     │└d111
    //     │  ├fileA.txt
    //     │  ├fileB.txt
    //     │  └fileC.txt
    //     ├d12
    //     ├d13
    //     ├fileX.txt
    //     ├fileY.txt
    //     └fileZ.txt

    // 戻り値の検証
    expect(actual.map(node => node.path)).toEqual([
      'dB/d1',
      'dB/d1/d11',
      'dB/d1/d11/d111',
      'dB/d1/d11/d111/fileA.txt',
      'dB/d1/d11/d111/fileB.txt',
      'dB/d1/d12',
      'dB/d1/fileX.txt',
      'dB/d1/fileY.txt',
    ])

    // 全ノードを取得し、移動後に想定したノードリストとなっているか検証
    const [_dA, _dB, _d1, _d11, _d111, _fileA, _fileB, _fileC, _d12, _d13, _fileX, _fileY, _fileZ] = storageStore.all
    expect(storageStore.all.length).toBe(13)
    expect(_dA.path).toBe('dA')
    expect(_dB.path).toBe('dB')
    expect(_d1.path).toBe('dB/d1')
    expect(_d11.path).toBe('dB/d1/d11')
    expect(_d111.path).toBe('dB/d1/d11/d111')
    expect(_fileA.path).toBe('dB/d1/d11/d111/fileA.txt')
    expect(_fileB.path).toBe('dB/d1/d11/d111/fileB.txt')
    expect(_fileC.path).toBe('dB/d1/d11/d111/fileC.txt')
    expect(_d12.path).toBe('dB/d1/d12')
    expect(_d13.path).toBe('dB/d1/d13')
    expect(_fileX.path).toBe('dB/d1/fileX.txt')
    expect(_fileY.path).toBe('dB/d1/fileY.txt')
    expect(_fileZ.path).toBe('dB/d1/fileZ.txt')

    // 移動したノードの検証
    // ※移動されたのか、上書きされたのか、もとからあったのか
    expect(_d1.updated).toEqual(dA_d1.updated) // ← 上書き
    expect(_d11.updated).toEqual(dA_d11.updated) // ← 上書き
    expect(_d111.updated).toEqual(dA_d111.updated) // ← 上書き
    expect(_fileA.updated).toEqual(dA_fileA.updated) // ← 上書き
    expect(_fileB.updated).toEqual(dA_fileB.updated) // ← 移動
    expect(_fileC.updated).toEqual(dB_fileC.updated) // ← もとから
    expect(_d12.updated).toEqual(dA_d12.updated) // ← 移動
    expect(_d13.updated).toEqual(dB_d13.updated) // ← もとから
    expect(_fileX.updated).toEqual(dA_fileX.updated) // ← 上書き
    expect(_fileY.updated).toEqual(dA_fileY.updated) // ← 移動
    expect(_fileZ.updated).toEqual(dB_fileZ.updated) // ← もとから

    verifyStateNodes()
    existsStateNodes(actual)
    toBeCopy(actual)
  })

  it('aaa', async () => {
    // root
    // ├dA
    // │└d1 ← 移動するノード
    // │  ├d11
    // │  │└d111
    // │  │  ├fileA.txt
    // │  │  └fileB.txt
    // │  ├d12
    // │  ├fileX.txt
    // │  └fileY.txt
    // └dB
    //   └d1 ← ここへ上書き移動
    //     ├d11
    //     │└d111
    //     │  ├fileA.txt
    //     │  └fileC.txt
    //     ├d13
    //     ├fileX.txt
    //     └fileZ.txt
    const dA = newTestStorageDirNode('dA')
    const dA_d1 = newTestStorageDirNode('dA/d1')
    const dA_d11 = newTestStorageDirNode('dA/d1/d11')
    const dA_fileA = newTestStorageFileNode('dA/d1/d11/fileA.txt')
    const dA_fileB = newTestStorageFileNode('dA/d1/d11/fileB.txt')
    const dB = newTestStorageDirNode('dB')
    const dB_d1 = newTestStorageDirNode('dB/d1')
    const dB_d11 = newTestStorageDirNode('dB/d1/d11')
    const dB_fileA = newTestStorageFileNode('dB/d1/d11/fileA.txt')
    const dB_fileC = newTestStorageFileNode('dB/d1/d11/fileC.txt')
    storageStore.initState({
      all: storageStore.sort([dA, dA_d1, dA_d11, dA_fileA, dA_fileB, dB, dB_d1, dB_d11, dB_fileA, dB_fileC]),
    })

    // 'dA/d1'を'dB'へ移動
    const actual = storageStore.move('dA/d1', 'dB/d1')
  })

  it('存在しないパスを指定した場合', () => {
    const d1 = newTestStorageDirNode('d1')
    const d2 = newTestStorageDirNode('d2')
    storageStore.initState({
      all: storageStore.sort(cloneDeep([d1, d2])),
    })

    let actual!: Error
    try {
      storageStore.move('dXXX', 'd2/dXXX')
    } catch (err) {
      actual = err
    }

    expect(actual.message).toBe(`The specified node was not found: 'dXXX'`)
  })

  it('移動先ディレクトリが移動元のサブディレクトリの場合', () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const d2 = newTestStorageDirNode('d2')
    storageStore.initState({
      all: storageStore.sort(cloneDeep([d1, d11, f111, d12, d2])),
    })

    let actual!: Error
    try {
      storageStore.move('d1', 'd1/d11/d1')
    } catch (err) {
      actual = err
    }

    expect(actual.message).toBe(`The destination directory is its own subdirectory: 'd1' -> 'd1/d11/d1'`)
  })
})

describe('rename', () => {
  it('ディレクトリのリネーム - ベーシックケース', () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const d2 = newTestStorageDirNode('d2')
    storageStore.initState({
      all: storageStore.sort(cloneDeep([d1, d11, f111, d12, d2])),
    })

    const actual = storageStore.rename('d1', 'x1')

    expect(actual.length).toBe(4)
    expect(actual[0].path).toBe('x1')
    expect(actual[1].path).toBe('x1/d11')
    expect(actual[2].path).toBe('x1/d11/f111.txt')
    expect(actual[3].path).toBe('x1/d12')

    verifyStateNodes()
    existsStateNodes(actual)
  })

  it('ディレクトリのリネーム - 既存のディレクトリ名に文字を付け加える形でリネームをした場合', () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const d2 = newTestStorageDirNode('d2')
    storageStore.initState({
      all: storageStore.sort(cloneDeep([d1, d11, f111, d12, d2])),
    })

    // 'd1'を'd1XXX'へリネーム
    const actual = storageStore.rename('d1', 'd1XXX')

    expect(actual.length).toBe(4)
    expect(actual[0].path).toBe('d1XXX')
    expect(actual[1].path).toBe('d1XXX/d11')
    expect(actual[2].path).toBe('d1XXX/d11/f111.txt')
    expect(actual[3].path).toBe('d1XXX/d12')

    verifyStateNodes()
    existsStateNodes(actual)
  })

  it('ファイルのリネーム', () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    storageStore.initState({
      all: storageStore.sort(cloneDeep([d1, d11, f111])),
    })

    const actual = storageStore.rename('d1/d11/f111.txt', 'fileX.txt')

    expect(actual.length).toBe(1)
    expect(actual[0].path).toBe('d1/d11/fileX.txt')

    verifyStateNodes()
    existsStateNodes(actual)
  })

  it('存在しないパスを指定した場合', () => {
    const d1 = newTestStorageDirNode('d1')
    const d2 = newTestStorageDirNode('d2')
    storageStore.initState({
      all: storageStore.sort(cloneDeep([d1, d2])),
    })

    let actual!: Error
    try {
      storageStore.rename('dXXX', 'x1')
    } catch (err) {
      actual = err
    }

    expect(actual.message).toBe(`The specified node was not found: 'dXXX'`)
  })
})

describe('clear', () => {
  it('ベーシックケース', () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const d2 = newTestStorageDirNode('d2')
    storageStore.initState({
      all: storageStore.sort(cloneDeep([d1, d11, f111, d12, d2])),
    })

    const beforeAll = storageStore.all

    storageStore.clear()

    expect(storageStore.all.length).toBe(0)
    notExistsStateNodes(beforeAll)
  })
})

describe('clone', () => {
  it('ベーシックケース', () => {
    const d1 = newTestStorageDirNode('d1')

    const actual = storageStore.clone(d1)

    expect(actual).not.toBe(d1)
    expect(actual.share).not.toBe(d1.share)
    expect(actual.share.uids).not.toBe(d1.share.uids)
    expect(actual).toEqual(d1)
  })
})

describe('sort', () => {
  it('ベーシックケース', () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const f121 = newTestStorageFileNode('d1/d12/f121.txt')
    const d2 = newTestStorageDirNode('d2')
    const d21 = newTestStorageDirNode('d2/d21')
    const f1 = newTestStorageFileNode('f1.txt')

    const actual = storageStore.sort([f111, f121, f1, d1, d2, d11, d12, d21])

    expect(actual[0]).toEqual(d1)
    expect(actual[1]).toEqual(d11)
    expect(actual[2]).toEqual(f111)
    expect(actual[3]).toEqual(d12)
    expect(actual[4]).toEqual(f121)
    expect(actual[5]).toEqual(d2)
    expect(actual[6]).toEqual(d21)
    expect(actual[7]).toEqual(f1)
  })
})
