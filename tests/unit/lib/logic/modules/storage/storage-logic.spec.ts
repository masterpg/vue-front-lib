import * as td from 'testdouble'
import { EMPTY_SHARE_SETTINGS, cloneTestStorageNode, newTestStorageDirNode, newTestStorageFileNode } from '../../../../../helpers/common/storage'
import { LibAPIContainer, StorageNode, StorageNodeShareSettings, StorageNodeType, StorageState } from '@/lib'
import { AppStorageLogic } from '../../../../../../src/lib/logic/modules/storage'
import { Component } from 'vue-property-decorator'
import { StorageStore } from '@/lib'
import { TestStore } from '../../../../../helpers/common/store'
import { cloneDeep } from 'lodash'
import dayjs from 'dayjs'
import { generateFirestoreId } from '../../../../../helpers/common/base'
import { getStorageNodeURL } from '../../../../../../src/lib/logic/base'
import { initLibTest } from '../../../../../helpers/lib/init'
import { store } from '../../../../../../src/lib/logic/store'

//========================================================================
//
//  Test helpers
//
//========================================================================

@Component
class MockStorageLogic extends AppStorageLogic {
  get basePath(): string {
    return 'test'
  }

  getNodeAPI = td.func() as any
  getDirDescendantsAPI = td.func() as any
  getDescendantsAPI = td.func() as any
  getDirChildrenAPI = td.func() as any
  getChildrenAPI = td.func() as any
  getHierarchicalNodesAPI = td.func() as any
  getAncestorDirsAPI = td.func() as any
  createDirsAPI = td.func() as any
  removeDirAPI = td.func() as any
  removeFileAPI = td.func() as any
  moveDirAPI = td.func() as any
  moveFileAPI = td.func() as any
  renameDirAPI = td.func() as any
  renameFileAPI = td.func() as any
  setDirShareSettingsAPI = td.func() as any
  setFileShareSettingsAPI = td.func() as any
}

let api!: LibAPIContainer

let storageStore!: TestStore<StorageStore, StorageState>

let storageLogic!: AppStorageLogic & {
  getPaginationNodesAPI: AppStorageLogic['getPaginationNodesAPI']
}

//========================================================================
//
//  Tests
//
//========================================================================

beforeAll(async () => {
  api = td.object<LibAPIContainer>()
  await initLibTest({ api })

  storageStore = store.storage as TestStore<StorageStore, StorageState>
  storageLogic = new MockStorageLogic() as any
})

beforeEach(async () => {})

describe('sgetNode', () => {
  it('ベーシックケース - ノードIDで取得', () => {
    const d1 = newTestStorageDirNode(`d1`)
    storageStore.initState({ all: [d1] })

    const actual = storageLogic.sgetNode({ id: d1.id })

    expect(actual).toEqual(d1)
  })

  it('ベーシックケース - ノードパスで取得', () => {
    const d1 = newTestStorageDirNode(`d1`)
    storageStore.initState({ all: [d1] })

    const actual = storageLogic.sgetNode({ path: d1.path })

    expect(actual).toEqual(d1)
  })

  it('ノードが見つからない場合 - ノードIDで取得', () => {
    let actual!: Error
    try {
      storageLogic.sgetNode({ id: 'xxx' })
    } catch (err) {
      actual = err
    }
    expect(actual.message).toBe(`Storage store does not have specified node: {"id":"xxx"}`)
  })

  it('ノードが見つからない場合 - ノードIDで取得', () => {
    let actual!: Error
    try {
      storageLogic.sgetNode({ path: 'xxx/yyy' })
    } catch (err) {
      actual = err
    }
    expect(actual.message).toBe(`Storage store does not have specified node: {"path":"xxx/yyy"}`)
  })
})

describe('getHierarchicalNode', () => {
  it('ベーシックケース', () => {
    // root
    // ├d1
    // │├d11
    // ││└d111 ← dirPathに指定
    // ││  ├d1111
    // ││  │└fileA.txt
    // ││  └fileB.txt
    // │└d12
    // └d2
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const d111 = newTestStorageDirNode(`d1/d11/d111`)
    const d1111 = newTestStorageDirNode(`d1/d11/d111/d1111`)
    const fileA = newTestStorageDirNode(`d1/d11/d111/d1111/fileA.txt`)
    const fileB = newTestStorageDirNode(`d1/d11/d111/fileB.txt`)
    const d12 = newTestStorageDirNode(`d1/d12`)
    const d2 = newTestStorageDirNode(`d2`)
    const nodes = [d1, d11, d111, d1111, fileA, fileB, d12, d2]
    storageStore.initState({ all: cloneDeep(nodes) })

    const actual = storageLogic.getHierarchicalNodes(d111.path)

    expect(actual.length).toBe(3)
    expect(actual[0].path).toBe(`d1`)
    expect(actual[1].path).toBe(`d1/d11`)
    expect(actual[2].path).toBe(`d1/d11/d111`)
  })

  it('dirPathのノードは存在しないが上位は存在する場合', () => {
    // root
    // └d1
    //   └d11
    //     └d111 ← dirPathに指定するが存在しない
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    storageStore.initState({ all: cloneDeep([d1, d11]) })

    const actual = storageLogic.getHierarchicalNodes(`d1/d11/d111`)

    expect(actual.length).toBe(2)
    expect(actual[0].path).toBe(`d1`)
    expect(actual[1].path).toBe(`d1/d11`)
  })

  it('dirPathのノードも上位のノードも存在しない場合', () => {
    // root
    // └d1
    //   └d11
    //     └d111
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    storageStore.initState({ all: cloneDeep([d1, d11]) })

    const actual = storageLogic.getHierarchicalNodes(`d2/d21/211`)

    expect(actual.length).toBe(0)
  })
})

describe('fetchHierarchicalNodes', () => {
  it('ベーシックケース', async () => {
    // root
    // └dA
    //   └dB
    //     └dC
    const dA = newTestStorageDirNode(`dA`)
    const dB = newTestStorageDirNode(`dA/dB`)
    const dC = newTestStorageDirNode(`dA/dB/dC`)
    const fileC = newTestStorageDirNode(`dA/dB/dC/fileC.txt`)
    storageStore.initState({ all: cloneDeep([dA, dB, dC]) })

    td.when(storageLogic.getHierarchicalNodesAPI(`dA/dB/dC/fileC.txt`)).thenResolve(cloneDeep([dA, dB, dC, fileC]))

    const actual = await storageLogic.fetchHierarchicalNodes(fileC.path)

    // root
    // └dA
    //   └dB
    //     └dC
    //       └fileC.txt
    expect(actual).toEqual([dA, dB, dC, fileC])
    expect(storageLogic.nodes).toEqual([dA, dB, dC, fileC])
  })

  it('他端末でディレクトリ削除が行われていた場合', async () => {
    // root
    // └dA
    //   └dB
    //     └dC
    //       └fileC.txt
    const dA = newTestStorageDirNode(`dA`)
    const dB = newTestStorageDirNode(`dA/dB`)
    const dC = newTestStorageDirNode(`dA/dB/dC`)
    const fileC = newTestStorageDirNode(`dA/dB/dC/fileC.txt`)
    storageStore.initState({ all: cloneDeep([dA, dB, dC, fileC]) })

    // APIから以下の状態のノードリストが取得される
    // ・'dA/dB/dC'が削除された
    td.when(storageLogic.getHierarchicalNodesAPI(`dA/dB/dC/fileC.txt`)).thenResolve(cloneDeep([dA, dB]))

    const actual = await storageLogic.fetchHierarchicalNodes(fileC.path)

    // root
    // └dA
    //   └dB
    expect(actual).toEqual([dA, dB])
    expect(storageLogic.nodes).toEqual([dA, dB])
  })
})

describe('fetchAncestorDirs', () => {
  it('ベーシックケース', async () => {
    // root
    // └dA
    //   └dB
    const dA = newTestStorageDirNode(`dA`)
    const dB = newTestStorageDirNode(`dA/dB`)
    const dC = newTestStorageDirNode(`dA/dB/dC`)
    storageStore.initState({ all: cloneDeep([dA, dB]) })

    td.when(storageLogic.getAncestorDirsAPI(`dA/dB/dC/fileC.txt`)).thenResolve(cloneDeep([dA, dB, dC]))

    const actual = await storageLogic.fetchAncestorDirs(`dA/dB/dC/fileC.txt`)

    // root
    // └dA
    //   └dB
    //     └dC
    expect(actual).toEqual([dA, dB, dC])
    expect(storageLogic.nodes).toEqual([dA, dB, dC])
  })

  it('他端末でディレクトリ削除が行われていた場合', async () => {
    // root
    // └dA
    //   └dB
    //     └dC
    //       └fileC.txt
    const dA = newTestStorageDirNode(`dA`)
    const dB = newTestStorageDirNode(`dA/dB`)
    const dC = newTestStorageDirNode(`dA/dB/dC`)
    const fileC = newTestStorageDirNode(`dA/dB/dC/fileC.txt`)
    storageStore.initState({ all: cloneDeep([dA, dB, dC, fileC]) })

    // APIから以下の状態のノードリストが取得される
    // ・'dA/dB/dC'が削除された
    td.when(storageLogic.getAncestorDirsAPI(`dA/dB/dC/fileC.txt`)).thenResolve(cloneDeep([dA, dB]))

    const actual = await storageLogic.fetchAncestorDirs(fileC.path)

    // root
    // └dA
    //   └dB
    expect(actual).toEqual([dA, dB])
    expect(storageLogic.nodes).toEqual([dA, dB])
  })
})

describe('fetchDirDescendants', () => {
  it('dirPathを指定しなかった場合', async () => {
    // root
    // ├d1
    // │├d11
    // ││└f111.txt
    // │└d12
    // └d2
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const f111 = newTestStorageFileNode(`d1/d11/f111.txt`)
    const f112 = newTestStorageFileNode(`d1/d11/f112.txt`)
    const d12 = newTestStorageDirNode(`d1/d12`)
    const d2 = newTestStorageDirNode(`d2`)
    storageStore.initState({ all: cloneDeep([d1, d11, f111, d12, d2]) })

    // APIから以下の状態のノードリストが取得される
    // ・'d1/d11/f111.txt'が'f1.txt'へ移動+リネームされた
    // ・'d1/d11/f112.txt'が追加された
    // ・'d1/d12'が削除された
    const f1 = cloneTestStorageNode(f111, { dir: ``, path: `f1.txt` })
    td.when(storageLogic.getDirDescendantsAPI(undefined)).thenResolve(cloneDeep([d1, d11, f112, d2, f1]))

    const actual = await storageLogic.fetchDirDescendants()

    // root
    // ├d1
    // │└d11
    // │  └f112.txt
    // ├d2
    // └f1.txt
    expect(actual).toEqual([d1, d11, f112, d2, f1])
    expect(storageLogic.nodes).toEqual([d1, d11, f112, d2, f1])
  })

  it('dirPathを指定した場合 - ベーシックケース', async () => {
    // root
    // ├d1 ← dirPathに指定
    // │├d11
    // ││└f111.txt
    // │├d12
    // │└f11.txt
    // └d2
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const f111 = newTestStorageFileNode(`d1/d11/f111.txt`)
    const f112 = newTestStorageFileNode(`d1/d11/f112.txt`)
    const d12 = newTestStorageDirNode(`d1/d12`)
    const f11 = newTestStorageFileNode(`d1/f11.txt`)
    const d2 = newTestStorageDirNode(`d2`)
    storageStore.initState({ all: cloneDeep([d1, d11, f111, d12, f11, d2]) })

    // APIから以下の状態のノードリストが取得される
    // ・'d1/d11/f111.txt'が'f1.txt'へ移動+リネームされた
    // ・'d1/d11/f112.txt'が追加された
    // ・'d1/d12'が削除された
    // ・'d1/f11.txt'が一度削除され、その後また同じディレクトリに同じ名前でアップロードされた
    const updated_f11 = cloneTestStorageNode(f11, { id: generateFirestoreId(), updatedAt: dayjs() })
    td.when(storageLogic.getDirDescendantsAPI(d1.path)).thenResolve(cloneDeep([d1, d11, f112, updated_f11]))

    const actual = await storageLogic.fetchDirDescendants(d1.path)

    // root
    // ├d1
    // │├d11
    // ││└f112.txt
    // │└f11.txt
    // ├d2
    // └f1.txt ← 移動+リネームされても、今回の検索範囲外なのでロジックストアに反映されない
    expect(actual).toEqual([d1, d11, f112, updated_f11])
    expect(storageLogic.nodes).toEqual([d1, d11, f112, updated_f11, d2])
  })

  it('dirPathを指定した場合 - dirPathのノードが削除されていた', async () => {
    // root
    // ├d1
    // │├d11 ← dirPathに指定
    // ││└f111.txt
    // │└d12
    // └d2
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const f111 = newTestStorageFileNode(`d1/d11/f111.txt`)
    const d12 = newTestStorageDirNode(`d1/d12`)
    const d2 = newTestStorageDirNode(`d2`)
    storageStore.initState({ all: cloneDeep([d1, d11, f111, d12, d2]) })

    // APIから以下の状態のノードリストが取得される
    // ・'d1/d11'が削除され存在しない
    td.when(storageLogic.getDirDescendantsAPI(d11.path)).thenResolve([])

    const actual = await storageLogic.fetchDirDescendants(d11.path)

    // root
    // ├d1
    // │└d12
    // └d2
    expect(actual).toEqual([])
    expect(storageLogic.nodes).toEqual([d1, d12, d2])
  })
})

describe('fetchDescendants', () => {
  it('dirPathを指定しなかった場合', async () => {
    // root
    // ├d1
    // │├d11
    // ││└f111.txt
    // │└d12
    // └d2
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const f111 = newTestStorageFileNode(`d1/d11/f111.txt`)
    const f112 = newTestStorageFileNode(`d1/d11/f112.txt`)
    const d12 = newTestStorageDirNode(`d1/d12`)
    const d2 = newTestStorageDirNode(`d2`)
    storageStore.initState({ all: cloneDeep([d1, d11, f111, d12, d2]) })

    // APIから以下の状態のノードリストが取得される
    // ・'d1/d11/f111.txt'が'f1.txt'へ移動+リネームされた
    // ・'d1/d11/f112.txt'が追加された
    // ・'d1/d12'が削除された
    const f1 = cloneTestStorageNode(f111, { dir: ``, path: `f1.txt` })
    td.when(storageLogic.getDescendantsAPI(undefined)).thenResolve(cloneDeep([d1, d11, f112, d2, f1]))

    const actual = await storageLogic.fetchDescendants()

    // root
    // ├d1
    // │└d11
    // │  └f112.txt
    // ├d2
    // └f1.txt
    expect(actual).toEqual([d1, d11, f112, d2, f1])
    expect(storageLogic.nodes).toEqual([d1, d11, f112, d2, f1])
  })

  it('dirPathを指定した場合 - ベーシックケース', async () => {
    // root
    // ├d1 ← dirPathに指定
    // │├d11
    // ││└f111.txt
    // │├d12
    // │└f11.txt
    // └d2
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const f111 = newTestStorageFileNode(`d1/d11/f111.txt`)
    const f112 = newTestStorageFileNode(`d1/d11/f112.txt`)
    const d12 = newTestStorageDirNode(`d1/d12`)
    const f11 = newTestStorageFileNode(`d1/f11.txt`)
    const d2 = newTestStorageDirNode(`d2`)
    storageStore.initState({ all: cloneDeep([d1, d11, f111, d12, f11, d2]) })

    // APIから以下の状態のノードリストが取得される
    // ・'d1/d11/f111.txt'が'f1.txt'へ移動+リネームされた
    // ・'d1/d11/f112.txt'が追加された
    // ・'d1/d12'が削除された
    // ・'d1/f11.txt'が一度削除され、その後また同じディレクトリに同じ名前でアップロードされた
    const updated_f11 = cloneTestStorageNode(f11, { id: generateFirestoreId(), updatedAt: dayjs() })
    td.when(storageLogic.getDescendantsAPI(d1.path)).thenResolve(cloneDeep([d11, f112, updated_f11]))

    const actual = await storageLogic.fetchDescendants(d1.path)

    // root
    // ├d1
    // │├d11
    // ││└f112.txt
    // │└f11.txt
    // ├d2
    // └f1.txt ← 移動+リネームされても、今回の検索範囲外なのでロジックストアに反映されない
    expect(actual).toEqual([d11, f112, updated_f11])
    expect(storageLogic.nodes).toEqual([d1, d11, f112, updated_f11, d2])
  })
})

describe('fetchDirChildren', () => {
  it('dirPathを指定しなかった場合', async () => {
    const d1 = newTestStorageDirNode(`d1`)
    const d2 = newTestStorageDirNode(`d2`)
    const f1 = newTestStorageFileNode(`f1.txt`)
    storageStore.initState({ all: [] })

    td.when(storageLogic.getDirChildrenAPI(undefined)).thenResolve([d1, d2, f1])

    const actual = await storageLogic.fetchDirChildren()

    // root
    // ├d1
    // ├d2
    // └f1.txt
    expect(actual).toEqual([d1, d2, f1])
    expect(storageLogic.nodes).toEqual([d1, d2, f1])
  })

  it('dirPathを指定した場合 - ベーシックケース', async () => {
    // root
    // ├d1 ← dirPathに指定
    // │├d11
    // ││└f111.txt
    // │├d12
    // ││└f121.txt
    // │└f11.txt
    // └d2
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const f111 = newTestStorageFileNode(`d1/d11/f111.txt`)
    const d12 = newTestStorageDirNode(`d1/d12`)
    const f121 = newTestStorageFileNode(`d1/d12/f121.txt`)
    const f11 = newTestStorageFileNode(`d1/f11.txt`)
    const f12 = newTestStorageFileNode(`d1/f12.txt`)
    const d2 = newTestStorageDirNode(`d2`)
    storageStore.initState({ all: cloneDeep([d1, d11, f111, d12, f121, f11, d2]) })

    // APIから以下の状態のノードリストが取得される
    // ・'d1/f11.txt'が削除され、その後また同じディレクトリに同じ名前でアップロードされた
    // ・'d1/f12.txt'が追加された
    // ・'d1/d12'が削除された
    const updated_f11 = cloneTestStorageNode(f11, { id: generateFirestoreId(), updatedAt: dayjs() })
    td.when(storageLogic.getDirChildrenAPI(d1.path)).thenResolve(cloneDeep([d1, d11, updated_f11, f12]))

    const actual = await storageLogic.fetchDirChildren(d1.path)

    // root
    // ├d1
    // │├d11
    // ││└f111.txt
    // │├f11.txt
    // │└f12.txt
    // └d2
    expect(actual).toEqual([d1, d11, updated_f11, f12])
    expect(storageLogic.nodes).toEqual([d1, d11, f111, updated_f11, f12, d2])
  })

  it('dirPathを指定した場合 - dirPathのノードが削除されていた', async () => {
    // root
    // ├d1
    // │├d11 ← dirPathに指定
    // ││└f111.txt
    // │└d12
    // └d2
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const f111 = newTestStorageFileNode(`d1/d11/f111.txt`)
    const d12 = newTestStorageDirNode(`d1/d12`)
    const d2 = newTestStorageDirNode(`d2`)
    storageStore.initState({ all: cloneDeep([d1, d11, f111, d12, d2]) })

    // APIから以下の状態のノードリストが取得される
    // ・'d1/d11'が削除され存在しない
    td.when(storageLogic.getDirChildrenAPI(d11.path)).thenResolve([])

    const actual = await storageLogic.fetchDirChildren(d11.path)

    // root
    // ├d1
    // │└d12
    // └d2
    expect(actual).toEqual([])
    expect(storageLogic.nodes).toEqual([d1, d12, d2])
  })
})

describe('fetchChildren', () => {
  it('dirPathを指定しなかった場合', async () => {
    const d1 = newTestStorageDirNode(`d1`)
    const d2 = newTestStorageDirNode(`d2`)
    const f1 = newTestStorageFileNode(`f1.txt`)
    storageStore.initState({ all: [] })

    td.when(storageLogic.getChildrenAPI(undefined)).thenResolve(cloneDeep([d1, d2, f1]))

    const actual = await storageLogic.fetchChildren()

    // root
    // ├d1
    // ├d2
    // └f1.txt
    expect(actual).toEqual([d1, d2, f1])
    expect(storageLogic.nodes).toEqual([d1, d2, f1])
  })

  it('dirPathを指定した場合', async () => {
    // root
    // ├d1 ← dirPathに指定
    // │├d11
    // ││└f111.txt
    // │├d12
    // ││└f121.txt
    // │└f11.txt
    // └d2
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const f111 = newTestStorageFileNode(`d1/d11/f111.txt`)
    const d12 = newTestStorageDirNode(`d1/d12`)
    const f121 = newTestStorageFileNode(`d1/d12/f121.txt`)
    const f11 = newTestStorageFileNode(`d1/f11.txt`)
    const f12 = newTestStorageFileNode(`d1/f12.txt`)
    const d2 = newTestStorageDirNode(`d2`)
    storageStore.initState({ all: cloneDeep([d1, d11, f111, d12, f121, f11, d2]) })

    // APIから以下の状態のノードリストが取得される
    // ・'d1/f11.txt'が削除され、その後また同じディレクトリに同じ名前でアップロードされた
    // ・'d1/f12.txt'が追加された
    // ・'d1/d12'が削除された
    const updated_f11 = cloneTestStorageNode(f11, { id: generateFirestoreId(), updatedAt: dayjs() })
    td.when(storageLogic.getChildrenAPI(d1.path)).thenResolve(cloneDeep([d11, updated_f11, f12]))

    const actual = await storageLogic.fetchChildren(d1.path)

    // root
    // ├d1
    // │├d11
    // ││└f111.txt
    // │├f11.txt
    // │└f12.txt
    // └d2
    expect(actual).toEqual([d11, updated_f11, f12])
    expect(storageLogic.nodes).toEqual([d1, d11, f111, updated_f11, f12, d2])
  })
})

describe('fetchHierarchicalDescendants', () => {
  it('dirPathを指定しなかった場合', async () => {
    // root ← ここがdirPathの対象
    // ├d1
    // │├d11
    // ││└f111.txt
    // │└d12
    // └d2
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const f111 = newTestStorageFileNode(`d1/d11/f111.txt`)
    const f112 = newTestStorageFileNode(`d1/d11/f112.txt`)
    const d12 = newTestStorageDirNode(`d1/d12`)
    const d2 = newTestStorageDirNode(`d2`)
    storageStore.initState({ all: cloneDeep([d1, d11, f111, d12, d2]) })

    // APIから以下の状態のノードリストが取得される
    // ・'d1/d11/f111.txt'が'f1.txt'へ移動+リネームされた
    // ・'d1/d11/f112.txt'が追加された
    // ・'d1/d12'が削除された
    const updated_f1 = cloneTestStorageNode(f111, { dir: ``, path: `f1.txt`, updatedAt: dayjs() })
    td.when(storageLogic.getDirDescendantsAPI(undefined)).thenResolve(cloneDeep([d1, d11, f112, d2, updated_f1]))

    const actual = await storageLogic.fetchHierarchicalDescendants()

    // root
    // ├d1
    // │└d11
    // │  └f112.txt
    // ├d2
    // └f1.txt
    expect(actual).toEqual([d1, d11, f112, d2, updated_f1])
    expect(storageLogic.nodes).toEqual([d1, d11, f112, d2, updated_f1])
  })

  it('dirPathを指定した場合', async () => {
    // root
    // ├d1
    // │├d11 ← dirPathに指定
    // ││├d111
    // │││└f1111.txt
    // ││└f111.txt
    // │└d12
    // └d2
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const d111 = newTestStorageDirNode(`d1/d11/d111`)
    const f1111 = newTestStorageFileNode(`d1/d11/d111/f1111.txt`)
    const f111 = newTestStorageFileNode(`d1/d11/f111.txt`)
    const f112 = newTestStorageFileNode(`d1/d11/f112.txt`)
    const d12 = newTestStorageDirNode(`d1/d12`)
    const d2 = newTestStorageDirNode(`d2`)
    storageStore.initState({ all: cloneDeep([d1, d11, d111, f1111, f111, d12, d2]) })

    // APIから以下の状態のノードリストが取得される
    // ・'d1/d11/d111'が削除された
    // ・'d1/d11/f111.txt'が削除され、その後また同じディレクトリに同じ名前でアップロードされた
    // ・'d1/d11/f112.txt'が追加された
    const updated_f111 = cloneTestStorageNode(f111, { id: generateFirestoreId(), updatedAt: dayjs() })
    td.when(storageLogic.getAncestorDirsAPI(d11.path)).thenResolve(cloneDeep([d1]))
    td.when(storageLogic.getDirDescendantsAPI(d11.path)).thenResolve(cloneDeep([d11, updated_f111, f112]))

    const actual = await storageLogic.fetchHierarchicalDescendants(d11.path)

    // root
    // ├d1
    // │├d11
    // ││├f111.txt
    // ││└f112.txt
    // │└d12
    // └d2
    expect(actual).toEqual([d1, d11, updated_f111, f112])
    expect(storageLogic.nodes).toEqual([d1, d11, updated_f111, f112, d12, d2])
  })

  it('dirPathを指定した場合 - dirPathのノードが削除されていた', async () => {
    // root
    // ├d1
    // │├d11
    // ││└d111 ← dirPathに指定
    // ││  └f1111.txt
    // │└d12
    // └d2
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const d111 = newTestStorageDirNode(`d1/d11/d111`)
    const f1111 = newTestStorageFileNode(`d1/d11/d111/f1111.txt`)
    const d12 = newTestStorageDirNode(`d1/d12`)
    const d2 = newTestStorageDirNode(`d2`)
    storageStore.initState({ all: cloneDeep([d1, d11, d111, f1111, d12, d2]) })

    // APIから以下の状態のノードリストが取得される
    // ・'d1/d11/d111'が削除され存在しない
    td.when(storageLogic.getAncestorDirsAPI(d111.path)).thenResolve(cloneDeep([d1, d11]))
    td.when(storageLogic.getDirDescendantsAPI(d111.path)).thenResolve([])

    const actual = await storageLogic.fetchHierarchicalDescendants(d111.path)

    // root
    // ├d1
    // │├d11
    // │└d12
    // └d2
    expect(actual).toEqual([d1, d11])
    expect(storageLogic.nodes).toEqual([d1, d11, d12, d2])
  })

  it('dirPathを指定した場合 - dirPathの上位ノードが削除されていた', async () => {
    // root
    // ├d1
    // │├d11
    // ││└d111 ← dirPathに指定
    // ││  └f1111.txt
    // │└d12
    // └d2
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const d111 = newTestStorageDirNode(`d1/d11/d111`)
    const f1111 = newTestStorageFileNode(`d1/d11/d111/f1111.txt`)
    const d12 = newTestStorageDirNode(`d1/d12`)
    const d2 = newTestStorageDirNode(`d2`)
    storageStore.initState({ all: cloneDeep([d1, d11, d111, f1111, d12, d2]) })

    // APIから以下の状態のノードリストが取得される
    // ・'d1/d11'が削除され存在しない
    td.when(storageLogic.getAncestorDirsAPI(d111.path)).thenResolve(cloneDeep([d1]))
    td.when(storageLogic.getDirDescendantsAPI(d111.path)).thenResolve([])

    const actual = await storageLogic.fetchHierarchicalDescendants(d111.path)

    // root
    // ├d1
    // │└d12
    // └d2
    expect(actual).toEqual([d1])
    expect(storageLogic.nodes).toEqual([d1, d12, d2])
  })
})

describe('fetchHierarchicalChildren', () => {
  it('dirPathを指定しなかった場合', async () => {
    // root ← ここがdirPathの対象
    // ├d1
    // │├d11
    // ││└f111.txt
    // │└d12
    // └d2
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const f111 = newTestStorageFileNode(`d1/d11/f111.txt`)
    const d12 = newTestStorageDirNode(`d1/d12`)
    const d2 = newTestStorageDirNode(`d2`)
    storageStore.initState({ all: cloneDeep([d1, d11, f111, d12, d2]) })

    // APIから以下の状態のノードリストが取得される
    // ・'d1/d11/f111.txt'が'f1.txt'へ移動+リネームされた
    // ・'d2'が削除された
    const updated_f1 = cloneTestStorageNode(f111, { dir: ``, path: `f1.txt`, updatedAt: dayjs() })
    td.when(storageLogic.getDirChildrenAPI(undefined)).thenResolve(cloneDeep([d1, d11, updated_f1]))

    const actual = await storageLogic.fetchHierarchicalChildren()

    // root
    // ├d1
    // │├d11
    // │└d12
    // └f1.txt
    expect(actual).toEqual([d1, d11, updated_f1])
    expect(storageLogic.nodes).toEqual([d1, d11, d12, updated_f1])
  })

  it('dirPathを指定した場合', async () => {
    // root
    // ├d1
    // │├d11 ← dirPathに指定
    // ││├d111
    // │││└f1111.txt
    // ││└f111.txt
    // │└d12
    // └d2
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const d111 = newTestStorageDirNode(`d1/d11/d111`)
    const f1111 = newTestStorageFileNode(`d1/d11/d111/f1111.txt`)
    const f111 = newTestStorageFileNode(`d1/d11/f111.txt`)
    const f112 = newTestStorageFileNode(`d1/d11/f112.txt`)
    const d12 = newTestStorageDirNode(`d1/d12`)
    const d2 = newTestStorageDirNode(`d2`)
    storageStore.initState({ all: cloneDeep([d1, d11, d111, f1111, f111, d12, d2]) })

    // APIから以下の状態のノードリストが取得される
    // ・'d1/d11/d111'が削除された
    // ・'d1/d11/f111.txt'が削除され、その後また同じディレクトリに同じ名前でアップロードされた
    // ・'d1/d11/f112.txt'が追加された
    const updated_f111 = cloneTestStorageNode(f111, { id: generateFirestoreId(), updatedAt: dayjs() })
    td.when(storageLogic.getAncestorDirsAPI(d11.path)).thenResolve(cloneDeep([d1]))
    td.when(storageLogic.getDirChildrenAPI(d11.path)).thenResolve(cloneDeep([d11, updated_f111, f112]))

    const actual = await storageLogic.fetchHierarchicalChildren(d11.path)

    // root
    // ├d1
    // │├d11
    // ││├f111.txt
    // ││└f112.txt
    // │└d12
    // └d2
    expect(actual).toEqual([d1, d11, updated_f111, f112])
    expect(storageLogic.nodes).toEqual([d1, d11, updated_f111, f112, d12, d2])
  })

  it('dirPathを指定した場合 - dirPathのノードが削除されていた', async () => {
    // root
    // ├d1
    // │├d11
    // ││└d111 ← dirPathに指定
    // ││  └f1111.txt
    // │└d12
    // └d2
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const d111 = newTestStorageDirNode(`d1/d11/d111`)
    const f1111 = newTestStorageFileNode(`d1/d11/d111/f1111.txt`)
    const d12 = newTestStorageDirNode(`d1/d12`)
    const d2 = newTestStorageDirNode(`d2`)
    storageStore.initState({ all: cloneDeep([d1, d11, d111, f1111, d12, d2]) })

    // APIから以下の状態のノードリストが取得される
    // ・'d1/d11/d111'が削除され存在しない
    td.when(storageLogic.getAncestorDirsAPI(d111.path)).thenResolve(cloneDeep([d1, d11]))
    td.when(storageLogic.getDirChildrenAPI(d111.path)).thenResolve([])

    const actual = await storageLogic.fetchHierarchicalChildren(d111.path)

    // root
    // ├d1
    // │├d11
    // │└d12
    // └d2
    expect(actual).toEqual([d1, d11])
    expect(storageLogic.nodes).toEqual([d1, d11, d12, d2])
  })
})

describe('createDirs', () => {
  it('ベーシックケース', async () => {
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const d12 = newTestStorageDirNode(`d1/d12`)
    storageStore.initState({ all: cloneDeep([d1]) })

    td.when(storageLogic.createDirsAPI([d11.path, d12.path])).thenResolve(cloneDeep([d11, d12]))

    const actual = await storageLogic.createDirs([d11.path, d12.path])

    expect(actual).toEqual([d11, d12])
    expect(storageLogic.nodes).toEqual([d1, d11, d12])
  })

  it('APIでエラーが発生した場合', async () => {
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const d12 = newTestStorageDirNode(`d1/d12`)
    storageStore.initState({ all: cloneDeep([d1]) })

    td.when(storageLogic.createDirsAPI([d11.path])).thenThrow(new Error())

    try {
      await storageLogic.createDirs([d11.path])
    } catch (err) {}

    // ノードリストに変化がないことを検証
    expect(storageLogic.nodes).toEqual([d1])
  })
})

describe('removeDir', () => {
  it('ベーシックケース', async () => {
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const f111 = newTestStorageFileNode(`d1/d11/f111.txt`)
    const d12 = newTestStorageDirNode(`d1/d12`)
    storageStore.initState({ all: cloneDeep([d1, d11, f111, d12]) })

    await storageLogic.removeDir(d11.path)

    expect(storageLogic.nodes).toEqual([d1, d12])

    const exp = td.explain(storageLogic.removeDirAPI)
    expect(exp.calls[0].args[0]).toEqual(d11.path)
  })

  it('存在しないディレクトリパスを指定した場合', async () => {
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    storageStore.initState({ all: cloneDeep([d1]) })

    await storageLogic.removeDir(d11.path)

    expect(storageLogic.nodes).toEqual([d1])

    const exp = td.explain(storageLogic.removeDirAPI)
    expect(exp.calls[0].args[0]).toEqual(d11.path)
  })

  it('APIでエラーが発生した場合', async () => {
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    storageStore.initState({ all: cloneDeep([d1, d11]) })
    td.when(storageLogic.removeDirAPI(d11.path)).thenThrow(new Error())

    try {
      await storageLogic.removeDir(d11.path)
    } catch (err) {}

    // ノードリストに変化がないことを検証
    expect(storageLogic.nodes).toEqual([d1, d11])
  })
})

describe('removeFile', () => {
  it('ベーシックケース', async () => {
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const f111 = newTestStorageFileNode(`d1/d11/f111.txt`)
    const f1 = newTestStorageFileNode(`f1.txt`)
    storageStore.initState({ all: cloneDeep([d1, d11, f111, f1]) })

    await storageLogic.removeFile(f111.path)

    expect(storageLogic.nodes).toEqual([d1, d11, f1])

    const exp = td.explain(storageLogic.removeFileAPI)
    expect(exp.calls[0].args[0]).toEqual(f111.path)
  })

  it('存在しないファイルパスを指定した場合', async () => {
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const f111 = newTestStorageFileNode(`d1/d11/f111.txt`)
    storageStore.initState({ all: cloneDeep([d1, d11]) })

    await storageLogic.removeFile(f111.path)

    expect(storageLogic.nodes).toEqual([d1, d11])

    const exp = td.explain(storageLogic.removeFileAPI)
    expect(exp.calls[0].args[0]).toEqual(f111.path)
  })

  it('APIでエラーが発生した場合', async () => {
    const f1 = newTestStorageFileNode(`f1.txt`)
    storageStore.initState({ all: cloneDeep([f1]) })
    td.when(storageLogic.removeFileAPI(f1.path)).thenReject(new Error())

    try {
      await storageLogic.removeFile(f1.path)
    } catch (err) {}

    // ノードリストに変化がないことを検証
    expect(storageLogic.nodes).toEqual([f1])
  })
})

describe('moveDir', () => {
  it('ベーシックケース', async () => {
    // root
    // ├d1
    // │└d11 ← d2へ移動
    // │  └f111.txt
    // └d2
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const f111 = newTestStorageFileNode(`d1/d11/f111.txt`)
    const d2 = newTestStorageDirNode(`d2`)
    storageStore.initState({ all: cloneDeep([d1, d11, f111, d2]) })

    // モック設定
    const moved_d11 = cloneTestStorageNode(d11, { dir: `d2`, path: `d2/d11`, updatedAt: dayjs() })
    const moved_f111 = cloneTestStorageNode(f111, { dir: `d2/d11`, path: `d2/d11/f111.txt` })
    td.when(storageLogic.moveDirAPI(d11.path, moved_d11.path)).thenResolve(cloneDeep([moved_d11, moved_f111]))

    // 'd1/d11'を'd2'へ移動
    const actual = await storageLogic.moveDir(d11.path, moved_d11.path)

    expect(actual[0]).toEqual(moved_d11)
    expect(actual[1]).toEqual(moved_f111)

    // root
    // ├d1
    // └d2
    //   └d11
    //     └f111.txt
    expect(storageLogic.nodes).toEqual([d1, d2, moved_d11, moved_f111])
  })

  it('移動ノード配下がストアに読み込まれていない場合', async () => {
    // 移動ノード'd1/d11'の配下ノードがストアに読み込まれていない状態にする
    // root
    // ├d1
    // │└d11 ← d2へ移動
    // │  └f111.txt ← 読み込まれていないのでストアには存在しない
    // └d2
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const d2 = newTestStorageDirNode(`d2`)
    storageStore.initState({ all: cloneDeep([d1, d11, d2]) })

    // モック設定
    const moved_d11 = cloneTestStorageNode(d11, { dir: `d2`, path: `d2/d11`, updatedAt: dayjs() })
    const moved_f111 = newTestStorageFileNode(`d2/d11/f111.txt`)
    td.when(storageLogic.moveDirAPI(d11.path, moved_d11.path)).thenResolve(cloneDeep([moved_d11, moved_f111]))

    // 'd1/d11'を'd2'へ移動
    const actual = await storageLogic.moveDir(d11.path, moved_d11.path)

    expect(actual[0]).toEqual(moved_d11)
    expect(actual[1]).toEqual(moved_f111)

    // root
    // ├d1
    // └d2
    //   └d11
    //     └f111.txt ← 移動が行われたことにより追加された
    expect(storageLogic.nodes).toEqual([d1, d2, moved_d11, moved_f111])
  })

  it('APIでエラーが発生した場合', async () => {
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const d2 = newTestStorageDirNode(`d2`)
    storageStore.initState({ all: cloneDeep([d1, d11, d2]) })

    // モック設定
    const moved_d11 = cloneTestStorageNode(d11, { dir: `d2`, path: `d2/d11`, updatedAt: dayjs() })
    td.when(storageLogic.moveDirAPI(d11.path, moved_d11.path)).thenReject(new Error())

    try {
      await storageLogic.moveDir(d11.path, moved_d11.path)
    } catch (err) {}

    // ノードリストに変化がないことを検証
    expect(storageLogic.nodes).toEqual([d1, d11, d2])
  })
})

describe('moveFile', () => {
  it('ベーシックケース', async () => {
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const f111 = newTestStorageFileNode(`d1/d11/f111.txt`)
    const d12 = newTestStorageDirNode(`d1/d12`)
    storageStore.initState({ all: cloneDeep([d1, d11, f111, d12]) })

    // モック設定
    const moved_f111 = cloneTestStorageNode(f111, { dir: `d1/d12`, path: `d1/d12/f111.txt`, updatedAt: dayjs() })
    td.when(storageLogic.moveFileAPI(f111.path, moved_f111.path)).thenResolve(cloneDeep(moved_f111))

    // 'd1/d11/f111.txt'を'd1/d12/f111.txt'へ移動
    const actual = await storageLogic.moveFile(f111.path, moved_f111.path)

    expect(actual).toEqual(moved_f111)

    expect(storageLogic.nodes).toEqual([d1, d11, d12, moved_f111])
  })

  it('APIでエラーが発生した場合', async () => {
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const f111 = newTestStorageFileNode(`d1/d11/f111.txt`)
    const d12 = newTestStorageDirNode(`d1/d12`)
    storageStore.initState({ all: cloneDeep([d1, d11, f111, d12]) })

    // モック設定
    const moved_f111 = cloneTestStorageNode(f111, { dir: `d1/d12`, path: `d1/d12/f111.txt`, updatedAt: dayjs() })
    td.when(storageLogic.moveFileAPI(f111.path, moved_f111.path)).thenReject(new Error())

    try {
      await storageLogic.moveFile(f111.path, moved_f111.path)
    } catch (err) {}

    // ノードリストに変化がないことを検証
    expect(storageLogic.nodes).toEqual([d1, d11, f111, d12])
  })
})

describe('renameDir', () => {
  it('ベーシックケース', async () => {
    // root
    // └d1
    //   └d11 ← x11へリネーム
    //     └f111.txt
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const f111 = newTestStorageFileNode(`d1/d11/f111.txt`)
    storageStore.initState({ all: cloneDeep([d1, d11, f111]) })

    // モック設定
    const renamed_x11 = cloneTestStorageNode(d11, { name: `x11`, path: `d1/x11`, updatedAt: dayjs() })
    const renamed_f111 = cloneTestStorageNode(f111, { dir: `d1/x11`, path: `d1/x11/f111.txt` })
    td.when(storageLogic.renameDirAPI(d11.path, renamed_x11.name)).thenResolve(cloneDeep([renamed_x11, renamed_f111]))

    // 'd1/d11'を'd1/x11'へリネーム
    const actual = await storageLogic.renameDir(d11.path, renamed_x11.name)

    expect(actual[0]).toEqual(renamed_x11)
    expect(actual[1]).toEqual(renamed_f111)

    expect(storageLogic.nodes).toEqual([d1, renamed_x11, renamed_f111])
  })

  it('リネームノードの配下がストアに読み込まれていない場合', async () => {
    // リネームノード'd1/d11'の配下ノードがストアに読み込まれていない状態にする
    // root
    // └d1
    //   └d11
    //     └f111.txt ← 読み込まれていないのでストアには存在しない
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    storageStore.initState({ all: cloneDeep([d1, d11]) })

    // モック設定
    const renamed_x11 = cloneTestStorageNode(d11, { name: `x11`, path: `d1/x11`, updatedAt: dayjs() })
    const renamed_f111 = newTestStorageFileNode(`d1/x11/f111.txt`)
    td.when(storageLogic.renameDirAPI(d11.path, renamed_x11.name)).thenResolve(cloneDeep([renamed_x11, renamed_f111]))

    // 'd1/d11'を'd1/x11'へリネーム
    const actual = await storageLogic.renameDir(d11.path, renamed_x11.name)

    expect(actual[0]).toEqual(renamed_x11)
    expect(actual[1]).toEqual(renamed_f111)

    // root
    // └d1
    //   └x11
    //     └f111.txt ← リネームが行われたことにより読み込まれた
    expect(storageLogic.nodes).toEqual([d1, renamed_x11, renamed_f111])
  })

  it('APIでエラーが発生した場合', async () => {
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    storageStore.initState({ all: cloneDeep([d1, d11]) })

    // モック設定
    const renamed_x11 = cloneTestStorageNode(d11, { name: `x11`, path: `d1/x11`, updatedAt: dayjs() })
    td.when(storageLogic.renameDirAPI(d11.path, renamed_x11.name)).thenReject(new Error())

    try {
      await storageLogic.renameDir(d11.path, renamed_x11.name)
    } catch (err) {}

    // ノードリストに変化がないことを検証
    expect(storageLogic.nodes).toEqual([d1, d11])
  })
})

describe('renameFile', () => {
  it('ベーシックケース', async () => {
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const f111 = newTestStorageFileNode(`d1/d11/f111.txt`)
    storageStore.initState({ all: cloneDeep([d1, d11, f111]) })

    // モック設定
    const renamed_f11X = cloneTestStorageNode(f111, { name: `f11X.txt`, path: `d1/d11/f11X.txt`, updatedAt: dayjs() })
    td.when(storageLogic.renameFileAPI(f111.path, renamed_f11X.name)).thenResolve(cloneDeep(renamed_f11X))

    // 'd1/d11/f111.txt'を'd1/d11/f11X.txt'へリネーム
    const actual = await storageLogic.renameFile(f111.path, renamed_f11X.name)

    expect(actual).toEqual(renamed_f11X)

    expect(storageLogic.nodes).toEqual([d1, d11, renamed_f11X])
  })

  it('APIでエラーが発生した場合', async () => {
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const f111 = newTestStorageFileNode(`d1/d11/f111.txt`)
    storageStore.initState({ all: cloneDeep([d1, d11, f111]) })

    // モック設定
    const renamed_f11X = cloneTestStorageNode(f111, { name: `fileX.txt`, path: `d1/d11/fileX.txt`, updatedAt: dayjs() })
    td.when(storageLogic.renameFileAPI(f111.path, renamed_f11X.name)).thenReject(new Error())

    try {
      await storageLogic.renameFile(f111.path, renamed_f11X.name)
    } catch (err) {}

    // ノードリストに変化がないことを検証
    expect(storageLogic.nodes).toEqual([d1, d11, f111])
  })
})

describe('setDirShareSettings', () => {
  const NEW_SHARE_SETTINGS: StorageNodeShareSettings = {
    isPublic: true,
    readUIds: ['ichiro'],
    writeUIds: ['ichiro'],
  }

  it('ベーシックケース', async () => {
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const f111 = newTestStorageFileNode(`d1/d11/f111.txt`)
    storageStore.initState({ all: cloneDeep([d1, d11, f111]) })

    const updated_d11 = cloneTestStorageNode(d11, { share: NEW_SHARE_SETTINGS, updatedAt: dayjs() })
    td.when(storageLogic.setDirShareSettingsAPI(d11.path, NEW_SHARE_SETTINGS)).thenResolve(cloneDeep(updated_d11))

    const actual = await storageLogic.setDirShareSettings(d11.path, NEW_SHARE_SETTINGS)

    expect(actual).toEqual(updated_d11)
    expect(storageLogic.nodes).toEqual([d1, updated_d11, f111])
  })

  it('APIでエラーが発生した場合', async () => {
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    storageStore.initState({ all: cloneDeep([d1, d11]) })

    td.when(storageLogic.setDirShareSettingsAPI(d11.path, NEW_SHARE_SETTINGS)).thenReject(new Error())

    try {
      await storageLogic.setDirShareSettings(d11.path, NEW_SHARE_SETTINGS)
    } catch (err) {}

    // ノードリストに変化がないことを検証
    expect(storageLogic.nodes).toEqual([d1, d11])
  })
})

describe('setFileShareSettings', () => {
  const NEW_SHARE_SETTINGS: StorageNodeShareSettings = {
    isPublic: true,
    readUIds: ['ichiro'],
    writeUIds: ['ichiro'],
  }

  it('ベーシックケース', async () => {
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const f111 = newTestStorageFileNode(`d1/d11/f111.txt`)
    storageStore.initState({ all: cloneDeep([d1, d11, f111]) })

    const updatedFileA = cloneTestStorageNode(f111, { share: NEW_SHARE_SETTINGS, updatedAt: dayjs() })
    td.when(storageLogic.setFileShareSettingsAPI(f111.path, NEW_SHARE_SETTINGS)).thenResolve(cloneDeep(updatedFileA))

    const actual = await storageLogic.setFileShareSettings(f111.path, NEW_SHARE_SETTINGS)

    expect(actual).toEqual(updatedFileA)
    expect(storageLogic.nodes).toEqual([d1, d11, updatedFileA])
  })

  it('APIでエラーが発生した場合', async () => {
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const f111 = newTestStorageFileNode(`d1/d11/f111.txt`)
    storageStore.initState({ all: cloneDeep([d1, d11, f111]) })

    td.when(storageLogic.setFileShareSettingsAPI(f111.path, NEW_SHARE_SETTINGS)).thenReject(new Error())

    try {
      await storageLogic.setFileShareSettings(f111.path, NEW_SHARE_SETTINGS)
    } catch (err) {}

    // ノードリストに変化がないことを検証
    expect(storageLogic.nodes).toEqual([d1, d11, f111])
  })
})

describe('setAPINodesToStore', () => {
  it('ベーシックケース', async () => {
    // root
    // └dA
    const dA = newTestStorageDirNode('dA')
    storageStore.initState({ all: cloneDeep([dA]) })

    // root
    // └dA
    //   └dB ← 追加された
    //     └fileB.txt
    const dB = newTestStorageDirNode('dA/dB')
    const fileB = newTestStorageFileNode('dA/dB/fileB.txt')

    const actual = await storageLogic.setAPINodesToStore([dA, dB, fileB])

    expect(actual).toEqual([dA, dB, fileB])
    expect(storageLogic.nodes).toEqual([dA, dB, fileB])
  })

  it('他端末でディレクトリ移動が行われていた場合', async () => {
    // root
    // ├dC ← 他端末で移動されている
    // │└fileC.txt
    // └tmp1
    //   └dA ← 他端末で移動されている
    //     ├dB
    //     │└fileB.txt
    //     └fileA.txt
    let dC = newTestStorageDirNode('dC')
    let fileC = newTestStorageFileNode('dC/fileC.txt')
    const tmp1 = newTestStorageDirNode('tmp1')
    let dA = newTestStorageDirNode('tmp1/dA')
    let dB = newTestStorageDirNode('tmp1/dA/dB')
    let fileB = newTestStorageFileNode('tmp1/dA/dB/fileB.txt')
    let fileA = newTestStorageFileNode('tmp1/dA/fileA.txt')
    storageStore.initState({ all: cloneDeep([dC, fileC, tmp1, dA, dB, fileB, fileA]) })

    // root
    // ├tmp1
    // └tmp2 ← 読み込まれないためストアに出てこないことに注意
    //   └dA
    //     ├dB
    //     │├dC
    //     ││└fileC.txt
    //     │└fileB.txt
    //     └fileA.txt
    dA = cloneTestStorageNode(dA, { dir: 'tmp2', path: 'tmp2/dA', updatedAt: dayjs() })
    dB = cloneTestStorageNode(dB, { dir: 'tmp2/dA', path: 'tmp2/dA/dB' })
    dC = cloneTestStorageNode(dC, { dir: 'tmp2/dA/dB', path: 'tmp2/dA/dB/dC', updatedAt: dayjs() })
    fileC = cloneTestStorageNode(fileC, { dir: 'tmp2/dA/dB/dC', path: 'tmp2/dA/dB/dC/fileC.txt' })
    fileB = cloneTestStorageNode(fileB, { dir: 'tmp2/dA/dB', path: 'tmp2/dA/dB/fileB.txt' })
    fileA = cloneTestStorageNode(fileA, { dir: 'tmp2/dA', path: 'tmp2/dA/fileA.txt' })

    // 'tmp2'は読み込まれない
    const actual = storageLogic.setAPINodesToStore([dA, dB, dC, fileC, fileB, fileA])

    // 'tmp2'は読み込まれなかったので出てこないことに注意
    expect(actual).toEqual([dA, dB, dC, fileC, fileB, fileA])
    expect(storageLogic.nodes).toEqual([tmp1, dA, dB, dC, fileC, fileB, fileA])
  })
})

describe('getPaginationNodesAPI', () => {
  function newTestNodes(): StorageNode[] {
    const result: StorageNode[] = []
    for (let i = 1; i <= 10; i++) {
      const nodeId = generateFirestoreId()
      result.push({
        id: nodeId,
        nodeType: StorageNodeType.Dir,
        name: `file${i.toString().padStart(2, '0')}.txt`,
        dir: 'd1',
        path: `d1/file${i.toString().padStart(2, '0')}.txt`,
        url: getStorageNodeURL(nodeId),
        contentType: '',
        size: 0,
        share: cloneDeep(EMPTY_SHARE_SETTINGS),
        docBundleType: null,
        isDoc: null,
        docSortOrder: null,
        version: 1,
        createdAt: dayjs(),
        updatedAt: dayjs(),
      })
    }
    return result
  }

  it('ベーシックケース', async () => {
    const [file01, file02, file03, file04, file05, file06, file07] = newTestNodes()
    const getStorageChildren = td.replace(api, 'getStorageChildren')
    td.when(
      getStorageChildren(
        {
          maxChunk: 3,
          pageToken: undefined,
        },
        `d1`
      )
    ).thenResolve({ list: [file01, file02, file03], nextPageToken: 'next-token-1' })
    td.when(
      getStorageChildren(
        {
          maxChunk: 3,
          pageToken: 'next-token-1',
        },
        `d1`
      )
    ).thenResolve({ list: [file04, file05, file06], nextPageToken: 'next-token-2' })
    td.when(
      getStorageChildren(
        {
          maxChunk: 3,
          pageToken: 'next-token-2',
        },
        `d1`
      )
    ).thenResolve({ list: [file07] })

    const actual = await storageLogic.getPaginationNodesAPI(api, getStorageChildren, { maxChunk: 3 }, `d1`)

    expect(actual).toEqual([file01, file02, file03, file04, file05, file06, file07])
  })

  it('optionsを指定しない場合', async () => {
    const [file01, file02, file03, file04, file05, file06, file07] = newTestNodes()
    const getStorageChildren = td.replace(api, 'getStorageChildren')
    td.when(
      getStorageChildren(
        {
          maxChunk: undefined,
          pageToken: undefined,
        },
        `d1`
      )
    ).thenResolve({ list: [file01, file02, file03], nextPageToken: 'next-token-1' })
    td.when(
      getStorageChildren(
        {
          maxChunk: undefined,
          pageToken: 'next-token-1',
        },
        `d1`
      )
    ).thenResolve({ list: [file04, file05, file06], nextPageToken: 'next-token-2' })
    td.when(
      getStorageChildren(
        {
          maxChunk: undefined,
          pageToken: 'next-token-2',
        },
        `d1`
      )
    ).thenResolve({ list: [file07] })

    // optionsを指定せずに実行
    const actual = await storageLogic.getPaginationNodesAPI(api, getStorageChildren, null, `d1`)

    expect(actual).toEqual([file01, file02, file03, file04, file05, file06, file07])
  })

  it('引数を全て指定しない場合', async () => {
    const [file01, file02, file03, file04, file05, file06, file07] = newTestNodes()
    const getStorageChildren = td.replace(api, 'getStorageChildren')
    td.when(
      getStorageChildren({
        maxChunk: undefined,
        pageToken: undefined,
      })
    ).thenResolve({ list: [file01, file02, file03], nextPageToken: 'next-token-1' })
    td.when(
      getStorageChildren({
        maxChunk: undefined,
        pageToken: 'next-token-1',
      })
    ).thenResolve({ list: [file04, file05, file06], nextPageToken: 'next-token-2' })
    td.when(
      getStorageChildren({
        maxChunk: undefined,
        pageToken: 'next-token-2',
      })
    ).thenResolve({ list: [file07] })

    // 引数を全て指定せずに実行
    const actual = await storageLogic.getPaginationNodesAPI(api, getStorageChildren, null)

    expect(actual).toEqual([file01, file02, file03, file04, file05, file06, file07])
  })
})
