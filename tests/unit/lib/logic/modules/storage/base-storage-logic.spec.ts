import * as shortid from 'shortid'
import * as td from 'testdouble'
import { EMPTY_SHARE_SETTINGS, cloneTestStorageNode, newTestStorageDirNode, newTestStorageFileNode } from '../../../../../helpers/common/storage'
import { LibAPIContainer, StorageNode, StorageNodeShareSettings, StorageNodeType, StorageState } from '@/lib'
import { BaseStorageLogic } from '@/lib/logic/modules/storage/base/base-storage-logic'
import { BaseStorageStore } from '@/lib/logic/store/modules/storage/base'
import { Component } from 'vue-property-decorator'
import { StorageStore } from '@/lib/logic/store'
import { TestStore } from '../../../../../helpers/common/store'
import { config } from '@/lib/config'
import dayjs from 'dayjs'
import { initLibTest } from '../../../../../helpers/lib/init'
import { removeEndSlash } from 'web-base-lib'
const cloneDeep = require('lodash/cloneDeep')

//========================================================================
//
//  Test helpers
//
//========================================================================

@Component
class MockStorageStore extends BaseStorageStore {}

@Component
class MockStorageLogic extends BaseStorageLogic {
  protected get storageStore(): StorageStore {
    return storageStore
  }

  get baseURL(): string {
    return `${removeEndSlash(config.api.baseURL)}/storage`
  }

  newUploadManager = td.func() as any
  getNodeAPI = td.func() as any
  getDirDescendantsAPI = td.func() as any
  getDescendantsAPI = td.func() as any
  getDirChildrenAPI = td.func() as any
  getChildrenAPI = td.func() as any
  getHierarchicalNodeAPI = td.func() as any
  getAncestorDirsAPI = td.func() as any
  handleUploadedFilesAPI = td.func() as any
  createDirsAPI = td.func() as any
  removeDirsAPI = td.func() as any
  removeFilesAPI = td.func() as any
  moveDirAPI = td.func() as any
  moveFileAPI = td.func() as any
  renameDirAPI = td.func() as any
  renameFileAPI = td.func() as any
  setDirShareSettingsAPI = td.func() as any
  setFileShareSettingsAPI = td.func() as any
}

let api!: LibAPIContainer

let storageStore!: TestStore<StorageStore, StorageState>

let storageLogic!: BaseStorageLogic & {
  getPaginationNodesAPI: BaseStorageLogic['getPaginationNodesAPI']
}

//========================================================================
//
//  Tests
//
//========================================================================

beforeAll(async () => {
  api = td.object<LibAPIContainer>()
  await initLibTest({ api })

  storageStore = (new MockStorageStore() as StorageStore) as TestStore<StorageStore, StorageState>
  storageLogic = new MockStorageLogic() as any
})

beforeEach(async () => {})

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
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const d111 = newTestStorageDirNode('d1/d11/d111')
    const d1111 = newTestStorageDirNode('d1/d11/d111/d1111')
    const fileA = newTestStorageDirNode('d1/d11/d111/d1111/fileA.txt')
    const fileB = newTestStorageDirNode('d1/d11/d111/fileB.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const d2 = newTestStorageDirNode('d2')
    const nodes = [d1, d11, d111, d1111, fileA, fileB, d12, d2]
    storageStore.initState({ all: nodes })

    const actual = storageLogic.getHierarchicalNode('d1/d11/d111')

    expect(actual.length).toBe(3)
    expect(actual[0].path).toBe('d1')
    expect(actual[1].path).toBe('d1/d11')
    expect(actual[2].path).toBe('d1/d11/d111')
  })

  it('dirPathのノードは存在しないが上位は存在する場合', () => {
    // root
    // └d1
    //   └d11
    //     └d111 ← dirPathに指定するが存在しない
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    storageStore.initState({ all: [d1, d11] })

    const actual = storageLogic.getHierarchicalNode('d1/d11/d111')

    expect(actual.length).toBe(2)
    expect(actual[0].path).toBe('d1')
    expect(actual[1].path).toBe('d1/d11')
  })

  it('dirPathのノードも上位のノードも存在しない場合', () => {
    // root
    // └d1
    //   └d11
    //     └d111
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    storageStore.initState({ all: [d1, d11] })

    const actual = storageLogic.getHierarchicalNode('d2/d21/211')

    expect(actual.length).toBe(0)
  })
})

describe('fetchHierarchicalNode', () => {
  it('ベーシックケース', async () => {
    // root
    // └dA
    //   └dB
    //     └dC
    const dA = newTestStorageDirNode('dA')
    const dB = newTestStorageDirNode('dA/dB')
    const dC = newTestStorageDirNode('dA/dB/dC')
    const fileC = newTestStorageDirNode('dA/dB/dC/fileC.txt')
    storageStore.initState({ all: cloneDeep([dA, dB, dC]) })

    td.when(storageLogic.getHierarchicalNodeAPI('dA/dB/dC/fileC.txt')).thenResolve([dA, dB, dC, fileC])

    const actual = await storageLogic.fetchHierarchicalNode('dA/dB/dC/fileC.txt')

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
    const dA = newTestStorageDirNode('dA')
    const dB = newTestStorageDirNode('dA/dB')
    const dC = newTestStorageDirNode('dA/dB/dC')
    const fileC = newTestStorageDirNode('dA/dB/dC/fileC.txt')
    storageStore.initState({ all: cloneDeep([dA, dB, dC, fileC]) })

    // APIから以下の状態のノードリストが取得される
    // ・'dA/dB/dC'が削除された
    td.when(storageLogic.getHierarchicalNodeAPI('dA/dB/dC/fileC.txt')).thenResolve([dA, dB])

    const actual = await storageLogic.fetchHierarchicalNode('dA/dB/dC/fileC.txt')

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
    const dA = newTestStorageDirNode('dA')
    const dB = newTestStorageDirNode('dA/dB')
    const dC = newTestStorageDirNode('dA/dB/dC')
    storageStore.initState({ all: cloneDeep([dA, dB]) })

    td.when(storageLogic.getAncestorDirsAPI('dA/dB/dC/fileC.txt')).thenResolve([dA, dB, dC])

    const actual = await storageLogic.fetchAncestorDirs('dA/dB/dC/fileC.txt')

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
    const dA = newTestStorageDirNode('dA')
    const dB = newTestStorageDirNode('dA/dB')
    const dC = newTestStorageDirNode('dA/dB/dC')
    const fileC = newTestStorageDirNode('dA/dB/dC/fileC.txt')
    storageStore.initState({ all: cloneDeep([dA, dB, dC, fileC]) })

    // APIから以下の状態のノードリストが取得される
    // ・'dA/dB/dC'が削除された
    td.when(storageLogic.getAncestorDirsAPI('dA/dB/dC/fileC.txt')).thenResolve([dA, dB])

    const actual = await storageLogic.fetchAncestorDirs('dA/dB/dC/fileC.txt')

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
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const f112 = newTestStorageFileNode('d1/d11/f112.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const d2 = newTestStorageDirNode('d2')
    storageStore.initState({ all: cloneDeep([d1, d11, f111, d12, d2]) })

    // APIから以下の状態のノードリストが取得される
    // ・'d1/d11/f111.txt'が'f1.txt'へ移動+リネームされた
    // ・'d1/d11/f112.txt'が追加された
    // ・'d1/d12'が削除された
    const f1 = cloneTestStorageNode(f111, { dir: '', path: 'f1.txt' })
    td.when(storageLogic.getDirDescendantsAPI(undefined)).thenResolve([d1, d11, f112, d2, f1])

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
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const f112 = newTestStorageFileNode('d1/d11/f112.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const f11 = newTestStorageFileNode('d1/f11.txt')
    const d2 = newTestStorageDirNode('d2')
    storageStore.initState({ all: cloneDeep([d1, d11, f111, d12, f11, d2]) })

    // APIから以下の状態のノードリストが取得される
    // ・'d1/d11/f111.txt'が'f1.txt'へ移動+リネームされた
    // ・'d1/d11/f112.txt'が追加された
    // ・'d1/d12'が削除された
    // ・'d1/f11.txt'が一度削除され、その後また同じディレクトリに同じ名前でアップロードされた
    const updated_f11 = cloneTestStorageNode(f11, { id: shortid.generate(), updated: dayjs() })
    td.when(storageLogic.getDirDescendantsAPI(d1.path)).thenResolve([d1, d11, f112, updated_f11])

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
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const d2 = newTestStorageDirNode('d2')
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
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const f112 = newTestStorageFileNode('d1/d11/f112.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const d2 = newTestStorageDirNode('d2')
    storageStore.initState({ all: cloneDeep([d1, d11, f111, d12, d2]) })

    // APIから以下の状態のノードリストが取得される
    // ・'d1/d11/f111.txt'が'f1.txt'へ移動+リネームされた
    // ・'d1/d11/f112.txt'が追加された
    // ・'d1/d12'が削除された
    const f1 = cloneTestStorageNode(f111, { dir: '', path: 'f1.txt' })
    td.when(storageLogic.getDescendantsAPI(undefined)).thenResolve([d1, d11, f112, d2, f1])

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
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const f112 = newTestStorageFileNode('d1/d11/f112.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const f11 = newTestStorageFileNode('d1/f11.txt')
    const d2 = newTestStorageDirNode('d2')
    storageStore.initState({ all: cloneDeep([d1, d11, f111, d12, f11, d2]) })

    // APIから以下の状態のノードリストが取得される
    // ・'d1/d11/f111.txt'が'f1.txt'へ移動+リネームされた
    // ・'d1/d11/f112.txt'が追加された
    // ・'d1/d12'が削除された
    // ・'d1/f11.txt'が一度削除され、その後また同じディレクトリに同じ名前でアップロードされた
    const updated_f11 = cloneTestStorageNode(f11, { id: shortid.generate(), updated: dayjs() })
    td.when(storageLogic.getDescendantsAPI(d1.path)).thenResolve([d11, f112, updated_f11])

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
    const d1 = newTestStorageDirNode('d1')
    const d2 = newTestStorageDirNode('d2')
    const f1 = newTestStorageFileNode('f1.txt')
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
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const f121 = newTestStorageFileNode('d1/d12/f121.txt')
    const f11 = newTestStorageFileNode('d1/f11.txt')
    const f12 = newTestStorageFileNode('d1/f12.txt')
    const d2 = newTestStorageDirNode('d2')
    storageStore.initState({ all: cloneDeep([d1, d11, f111, d12, f121, f11, d2]) })

    // APIから以下の状態のノードリストが取得される
    // ・'d1/f11.txt'が削除され、その後また同じディレクトリに同じ名前でアップロードされた
    // ・'d1/f12.txt'が追加された
    // ・'d1/d12'が削除された
    const updated_f11 = cloneTestStorageNode(f11, { id: shortid.generate(), updated: dayjs() })
    td.when(storageLogic.getDirChildrenAPI(d1.path)).thenResolve([d1, d11, updated_f11, f12])

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
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const d2 = newTestStorageDirNode('d2')
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
    const d1 = newTestStorageDirNode('d1')
    const d2 = newTestStorageDirNode('d2')
    const f1 = newTestStorageFileNode('f1.txt')
    storageStore.initState({ all: [] })

    td.when(storageLogic.getChildrenAPI(undefined)).thenResolve([d1, d2, f1])

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
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const f121 = newTestStorageFileNode('d1/d12/f121.txt')
    const f11 = newTestStorageFileNode('d1/f11.txt')
    const f12 = newTestStorageFileNode('d1/f12.txt')
    const d2 = newTestStorageDirNode('d2')
    storageStore.initState({ all: cloneDeep([d1, d11, f111, d12, f121, f11, d2]) })

    // APIから以下の状態のノードリストが取得される
    // ・'d1/f11.txt'が削除され、その後また同じディレクトリに同じ名前でアップロードされた
    // ・'d1/f12.txt'が追加された
    // ・'d1/d12'が削除された
    const updated_f11 = cloneTestStorageNode(f11, { id: shortid.generate(), updated: dayjs() })
    td.when(storageLogic.getChildrenAPI(d1.path)).thenResolve([d11, updated_f11, f12])

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
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const f112 = newTestStorageFileNode('d1/d11/f112.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const d2 = newTestStorageDirNode('d2')
    storageStore.initState({ all: cloneDeep([d1, d11, f111, d12, d2]) })

    // APIから以下の状態のノードリストが取得される
    // ・'d1/d11/f111.txt'が'f1.txt'へ移動+リネームされた
    // ・'d1/d11/f112.txt'が追加された
    // ・'d1/d12'が削除された
    const updated_f1 = cloneTestStorageNode(f111, { dir: '', path: 'f1.txt', updated: dayjs() })
    td.when(storageLogic.getDirDescendantsAPI(undefined)).thenResolve([d1, d11, f112, d2, updated_f1])

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
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const d111 = newTestStorageDirNode('d1/d11/d111')
    const f1111 = newTestStorageFileNode('d1/d11/d111/f1111.txt')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const f112 = newTestStorageFileNode('d1/d11/f112.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const d2 = newTestStorageDirNode('d2')
    storageStore.initState({ all: cloneDeep([d1, d11, d111, f1111, f111, d12, d2]) })

    // APIから以下の状態のノードリストが取得される
    // ・'d1/d11/d111'が削除された
    // ・'d1/d11/f111.txt'が削除され、その後また同じディレクトリに同じ名前でアップロードされた
    // ・'d1/d11/f112.txt'が追加された
    const updated_f111 = cloneTestStorageNode(f111, { id: shortid.generate(), updated: dayjs() })
    td.when(storageLogic.getAncestorDirsAPI(d11.path)).thenResolve([d1])
    td.when(storageLogic.getDirDescendantsAPI(d11.path)).thenResolve([d11, updated_f111, f112])

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
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const d111 = newTestStorageDirNode('d1/d11/d111')
    const f1111 = newTestStorageFileNode('d1/d11/d111/f1111.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const d2 = newTestStorageDirNode('d2')
    storageStore.initState({ all: cloneDeep([d1, d11, d111, f1111, d12, d2]) })

    // APIから以下の状態のノードリストが取得される
    // ・'d1/d11/d111'が削除され存在しない
    td.when(storageLogic.getAncestorDirsAPI(d111.path)).thenResolve([d1, d11])
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
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const d111 = newTestStorageDirNode('d1/d11/d111')
    const f1111 = newTestStorageFileNode('d1/d11/d111/f1111.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const d2 = newTestStorageDirNode('d2')
    storageStore.initState({ all: cloneDeep([d1, d11, d111, f1111, d12, d2]) })

    // APIから以下の状態のノードリストが取得される
    // ・'d1/d11'が削除され存在しない
    td.when(storageLogic.getAncestorDirsAPI(d111.path)).thenResolve([d1])
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
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const d2 = newTestStorageDirNode('d2')
    storageStore.initState({ all: cloneDeep([d1, d11, f111, d12, d2]) })

    // APIから以下の状態のノードリストが取得される
    // ・'d1/d11/f111.txt'が'f1.txt'へ移動+リネームされた
    // ・'d2'が削除された
    const updated_f1 = cloneTestStorageNode(f111, { dir: '', path: 'f1.txt', updated: dayjs() })
    td.when(storageLogic.getDirChildrenAPI(undefined)).thenResolve([d1, d11, updated_f1])

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
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const d111 = newTestStorageDirNode('d1/d11/d111')
    const f1111 = newTestStorageFileNode('d1/d11/d111/f1111.txt')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const f112 = newTestStorageFileNode('d1/d11/f112.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const d2 = newTestStorageDirNode('d2')
    storageStore.initState({ all: cloneDeep([d1, d11, d111, f1111, f111, d12, d2]) })

    // APIから以下の状態のノードリストが取得される
    // ・'d1/d11/d111'が削除された
    // ・'d1/d11/f111.txt'が削除され、その後また同じディレクトリに同じ名前でアップロードされた
    // ・'d1/d11/f112.txt'が追加された
    const updated_f111 = cloneTestStorageNode(f111, { id: shortid.generate(), updated: dayjs() })
    td.when(storageLogic.getAncestorDirsAPI(d11.path)).thenResolve([d1])
    td.when(storageLogic.getDirChildrenAPI(d11.path)).thenResolve([d11, updated_f111, f112])

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
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const d111 = newTestStorageDirNode('d1/d11/d111')
    const f1111 = newTestStorageFileNode('d1/d11/d111/f1111.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const d2 = newTestStorageDirNode('d2')
    storageStore.initState({ all: cloneDeep([d1, d11, d111, f1111, d12, d2]) })

    // APIから以下の状態のノードリストが取得される
    // ・'d1/d11/d111'が削除され存在しない
    td.when(storageLogic.getAncestorDirsAPI(d111.path)).thenResolve([d1, d11])
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
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const d12 = newTestStorageDirNode('d1/d12')
    storageStore.initState({ all: cloneDeep([d1]) })

    td.when(storageLogic.createDirsAPI([d11.path, d12.path])).thenResolve([d11, d12])

    const actual = await storageLogic.createDirs([d11.path, d12.path])

    expect(actual).toEqual([d11, d12])
    expect(storageLogic.nodes).toEqual([d1, d11, d12])
  })

  it('APIでエラーが発生した場合', async () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const d12 = newTestStorageDirNode('d1/d12')
    storageStore.initState({ all: cloneDeep([d1]) })

    td.when(storageLogic.createDirsAPI([d11.path])).thenThrow(new Error())

    try {
      await storageLogic.createDirs([d11.path, d12.path])
    } catch (err) {}

    // ノードリストに変化がないことを検証
    expect(storageLogic.nodes).toEqual([d1])
  })
})

describe('removeDirs', () => {
  it('ベーシックケース', async () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    storageStore.initState({ all: cloneDeep([d1, d11, f111, d12]) })

    await storageLogic.removeDirs([d11.path, d12.path])

    expect(storageLogic.nodes).toEqual([d1])

    const exp = td.explain(storageLogic.removeDirsAPI)
    expect(exp.calls[0].args[0]).toEqual([d11.path, d12.path])
  })

  it('存在しないディレクトリパスを指定した場合', async () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    storageStore.initState({ all: cloneDeep([d1]) })

    await storageLogic.removeDirs([d11.path])

    expect(storageLogic.nodes).toEqual([d1])

    const exp = td.explain(storageLogic.removeDirsAPI)
    expect(exp.calls[0].args[0]).toEqual([d11.path])
  })

  it('APIでエラーが発生した場合', async () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    storageStore.initState({ all: cloneDeep([d1, d11]) })
    td.when(storageLogic.removeDirsAPI([d11.path])).thenThrow(new Error())

    try {
      await storageLogic.removeDirs([d11.path])
    } catch (err) {}

    // ノードリストに変化がないことを検証
    expect(storageLogic.nodes).toEqual([d1, d11])
  })
})

describe('removeFiles', () => {
  it('ベーシックケース', async () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const f1 = newTestStorageFileNode('f1.txt')
    storageStore.initState({ all: cloneDeep([d1, d11, f111, f1]) })

    await storageLogic.removeFiles([f111.path, f1.path])

    expect(storageLogic.nodes).toEqual([d1, d11])

    const exp = td.explain(storageLogic.removeFilesAPI)
    expect(exp.calls[0].args[0]).toEqual([f111.path, f1.path])
  })

  it('存在しないファイルパスを指定した場合', async () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    storageStore.initState({ all: cloneDeep([d1, d11]) })

    await storageLogic.removeFiles([f111.path])

    expect(storageLogic.nodes).toEqual([d1, d11])

    const exp = td.explain(storageLogic.removeFilesAPI)
    expect(exp.calls[0].args[0]).toEqual([f111.path])
  })

  it('APIでエラーが発生した場合', async () => {
    const f1 = newTestStorageFileNode('f1.txt')
    storageStore.initState({ all: cloneDeep([f1]) })
    td.when(storageLogic.removeFilesAPI([f1.path])).thenReject(new Error())

    try {
      await storageLogic.removeFiles([f1.path])
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
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const d2 = newTestStorageDirNode('d2')
    storageStore.initState({ all: cloneDeep([d1, d11, f111, d2]) })

    // 'd1/d11'を'd2'へ移動
    const moved_d11 = cloneTestStorageNode(d11, { dir: 'd2', path: 'd2/d11', updated: dayjs() })
    const moved_f111 = cloneTestStorageNode(f111, { dir: 'd2/d11', path: 'd2/d11/f111.txt' })
    td.when(storageLogic.getNodeAPI(moved_d11.path)).thenResolve(moved_d11)

    await storageLogic.moveDir(d11.path, moved_d11.path)

    // root
    // ├d1
    // └d2
    //   └d11
    //     └f111.txt ← ローカルで移動されたのみで、サーバーによる最新化はされていない
    expect(storageLogic.nodes).toEqual([d1, d2, moved_d11, moved_f111])

    const exp = td.explain(storageLogic.moveDirAPI)
    expect(exp.calls[0].args[0]).toBe(d11.path)
    expect(exp.calls[0].args[1]).toBe(moved_d11.path)
  })

  it('移動ノード配下がストアに読み込まれていない場合', async () => {
    // 移動ノード'd1/d11'の配下ノードがストアに読み込まれていない状態にする
    // root
    // ├d1
    // │└d11 ← d2へ移動
    // │  └f111.txt ← 読み込まれていないのでストアには存在しない
    // └d2
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const d2 = newTestStorageDirNode('d2')
    storageStore.initState({ all: cloneDeep([d1, d11, d2]) })

    // 'd1/d11'を'd2'へ移動
    const moved_d11 = cloneTestStorageNode(d11, { dir: 'd2', path: 'd2/d11', updated: dayjs() })
    td.when(storageLogic.getNodeAPI(moved_d11.path)).thenResolve(moved_d11)

    await storageLogic.moveDir(d11.path, moved_d11.path)

    // root
    // ├d1
    // └d2
    //   └d11
    //     └f111.txt ← 読み込みは行われないので依然としてストアには存在しない
    expect(storageLogic.nodes).toEqual([d1, d2, moved_d11])

    const exp = td.explain(storageLogic.moveDirAPI)
    expect(exp.calls[0].args[0]).toBe(d11.path)
    expect(exp.calls[0].args[1]).toBe(moved_d11.path)
  })

  it('APIでエラーが発生した場合', async () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const d2 = newTestStorageDirNode('d2')
    storageStore.initState({ all: cloneDeep([d1, d11, d2]) })

    const moved_d11 = cloneTestStorageNode(d11, { dir: 'd2', path: 'd2/d11', updated: dayjs() })
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
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    storageStore.initState({ all: cloneDeep([d1, d11, f111, d12]) })

    // 'd1/d11/f111.txt'を'd1/d12/f111.txt'へ移動
    const moved_f111 = cloneTestStorageNode(f111, { dir: 'd1/d12', path: 'd1/d12/f111.txt', updated: dayjs() })
    td.when(storageLogic.getNodeAPI(moved_f111.path)).thenResolve(moved_f111)

    await storageLogic.moveFile(f111.path, moved_f111.path)

    expect(storageLogic.nodes).toEqual([d1, d11, d12, moved_f111])

    const exp = td.explain(storageLogic.moveFileAPI)
    expect(exp.calls[0].args[0]).toBe(f111.path)
    expect(exp.calls[0].args[1]).toBe(moved_f111.path)
  })

  it('APIでエラーが発生した場合', async () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    storageStore.initState({ all: cloneDeep([d1, d11, f111, d12]) })

    const moved_f111 = cloneTestStorageNode(f111, { dir: 'd1/d12', path: 'd1/d12/f111.txt', updated: dayjs() })
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
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    storageStore.initState({ all: cloneDeep([d1, d11, f111]) })

    // 'd1/d11'を'd1/x11'へリネーム
    const renamed_x11 = cloneTestStorageNode(d11, { name: 'x11', path: 'd1/x11', updated: dayjs() })
    const renamed_f111 = cloneTestStorageNode(f111, { dir: 'd1/x11', path: 'd1/x11/f111.txt' })
    td.when(storageLogic.getNodeAPI(renamed_x11.path)).thenResolve(renamed_x11)

    await storageLogic.renameDir(d11.path, renamed_x11.name)

    expect(storageLogic.nodes).toEqual([d1, renamed_x11, renamed_f111])

    const exp = td.explain(storageLogic.renameDirAPI)
    expect(exp.calls[0].args[0]).toBe(d11.path)
    expect(exp.calls[0].args[1]).toBe(renamed_x11.name)
  })

  it('リネームノードの配下がストアに読み込まれていない場合', async () => {
    // リネームノード'd1/d11'の配下ノードがストアに読み込まれていない状態にする
    // root
    // └d1
    //   └d11
    //     └f111.txt ← 読み込まれていないのでストアには存在しない
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    storageStore.initState({ all: cloneDeep([d1, d11]) })

    // 'd1/d11'を'd1/x11'へリネーム
    const renamed_x11 = cloneTestStorageNode(d11, { name: 'x11', path: 'd1/x11', updated: dayjs() })
    td.when(storageLogic.getNodeAPI(renamed_x11.path)).thenResolve(renamed_x11)

    await storageLogic.renameDir(d11.path, renamed_x11.name)

    // root
    // └d1
    //   └x11
    //     └f111.txt ← 読み込みは行われないので依然としてストアには存在しない
    expect(storageLogic.nodes).toEqual([d1, renamed_x11])

    const exp = td.explain(storageLogic.renameDirAPI)
    expect(exp.calls[0].args[0]).toBe(d11.path)
    expect(exp.calls[0].args[1]).toBe(renamed_x11.name)
  })

  it('APIでエラーが発生した場合', async () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    storageStore.initState({ all: cloneDeep([d1, d11]) })

    const renamed_x11 = cloneTestStorageNode(d11, { name: 'x11', path: 'd1/x11', updated: dayjs() })
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
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    storageStore.initState({ all: cloneDeep([d1, d11, f111]) })

    // 'd1/d11/f111.txt'を'd1/d11/f11X.txt'へリネーム
    const renamed_f11X = cloneTestStorageNode(f111, { name: 'f11X.txt', path: 'd1/d11/f11X.txt', updated: dayjs() })
    td.when(storageLogic.getNodeAPI(renamed_f11X.path)).thenResolve(renamed_f11X)

    await storageLogic.renameFile(f111.path, renamed_f11X.name)

    expect(storageLogic.nodes).toEqual([d1, d11, renamed_f11X])

    const exp = td.explain(storageLogic.renameFileAPI)
    expect(exp.calls[0].args[0]).toBe(f111.path)
    expect(exp.calls[0].args[1]).toBe(renamed_f11X.name)
  })

  it('APIでエラーが発生した場合', async () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    storageStore.initState({ all: cloneDeep([d1, d11, f111]) })

    const renamed_f11X = cloneTestStorageNode(f111, { name: 'fileX.txt', path: 'd1/d11/fileX.txt', updated: dayjs() })
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
    uids: ['ichiro'],
  }

  it('ベーシックケース', async () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    storageStore.initState({ all: cloneDeep([d1, d11, f111]) })

    const updated_d11 = cloneTestStorageNode(d11, { share: NEW_SHARE_SETTINGS, updated: dayjs() })
    td.when(storageLogic.setDirShareSettingsAPI(d11.path, NEW_SHARE_SETTINGS)).thenResolve(updated_d11)

    const actual = await storageLogic.setDirShareSettings(d11.path, NEW_SHARE_SETTINGS)

    expect(actual).toEqual(updated_d11)
    expect(storageLogic.nodes).toEqual([d1, updated_d11, f111])
  })

  it('APIでエラーが発生した場合', async () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
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
    uids: ['ichiro'],
  }

  it('ベーシックケース', async () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    storageStore.initState({ all: cloneDeep([d1, d11, f111]) })

    const updatedFileA = cloneTestStorageNode(f111, { share: NEW_SHARE_SETTINGS, updated: dayjs() })
    td.when(storageLogic.setFileShareSettingsAPI(f111.path, NEW_SHARE_SETTINGS)).thenResolve(updatedFileA)

    const actual = await storageLogic.setFileShareSettings(f111.path, NEW_SHARE_SETTINGS)

    expect(actual).toEqual(updatedFileA)
    expect(storageLogic.nodes).toEqual([d1, d11, updatedFileA])
  })

  it('APIでエラーが発生した場合', async () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
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
    //   └dB
    //     └fileB.txt
    const dB = newTestStorageDirNode('dA/dB')
    const fileB = newTestStorageFileNode('dA/dB/fileB.txt')

    const actual = await storageLogic.setAPINodesToStore([dA, dB, fileB])

    expect(actual).toEqual([dA, dB, fileB])
    expect(storageLogic.nodes).toEqual([dA, dB, fileB])
  })

  it('他端末でディレクトリ移動が行われていた場合', async () => {
    // root
    // ├dC
    // │└fileC.txt
    // └tmp1
    //   └dA
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
    // └tmp2 ← 読み込まれていないのでストアには存在しない
    //   └dA
    //     ├dB
    //     │├dC
    //     ││└fileC.txt
    //     │└fileB.txt
    //     └fileA.txt
    dA = cloneTestStorageNode(dA, { dir: 'tmp2', path: 'tmp2/dA', updated: dayjs() })
    dB = cloneTestStorageNode(dB, { dir: 'tmp2/dA', path: 'tmp2/dA/dB' })
    dC = cloneTestStorageNode(dC, { dir: 'tmp2/dA/dB', path: 'tmp2/dA/dB/dC', updated: dayjs() })
    fileC = cloneTestStorageNode(fileC, { dir: 'tmp2/dA/dB/dC', path: 'tmp2/dA/dB/dC/fileC.txt' })
    fileB = cloneTestStorageNode(fileB, { dir: 'tmp2/dA/dB', path: 'tmp2/dA/dB/fileB.txt' })
    fileA = cloneTestStorageNode(fileA, { dir: 'tmp2/dA', path: 'tmp2/dA/fileA.txt' })

    const actual = storageLogic.setAPINodesToStore([dA, dB, dC, fileC, fileB, fileA])

    expect(actual).toEqual([dA, dB, dC, fileC, fileB, fileA])
    expect(storageLogic.nodes).toEqual([tmp1, dA, dB, dC, fileC, fileB, fileA])
  })
})

describe('getPaginationNodesAPI', () => {
  const [file01, file02, file03, file04, file05, file06, file07] = (() => {
    const result: StorageNode[] = []
    for (let i = 1; i <= 10; i++) {
      result.push({
        id: shortid.generate(),
        nodeType: StorageNodeType.Dir,
        name: `file${i.toString().padStart(2, '0')}.txt`,
        dir: 'd1',
        path: `d1/file${i.toString().padStart(2, '0')}.txt`,
        contentType: '',
        size: 0,
        share: cloneDeep(EMPTY_SHARE_SETTINGS),
        created: dayjs(),
        updated: dayjs(),
      })
    }
    return result
  })()

  it('ベーシックケース', async () => {
    const getStorageChildren = td.replace(api, 'getStorageChildren')
    td.when(
      getStorageChildren(
        {
          maxResults: 3,
          pageToken: undefined,
        },
        `d1`
      )
    ).thenResolve({ list: [file01, file02, file03], nextPageToken: 'next-token-1' })
    td.when(
      getStorageChildren(
        {
          maxResults: 3,
          pageToken: 'next-token-1',
        },
        `d1`
      )
    ).thenResolve({ list: [file04, file05, file06], nextPageToken: 'next-token-2' })
    td.when(
      getStorageChildren(
        {
          maxResults: 3,
          pageToken: 'next-token-2',
        },
        `d1`
      )
    ).thenResolve({ list: [file07] })

    const actual = await storageLogic.getPaginationNodesAPI(api, getStorageChildren, { maxResults: 3 }, `d1`)

    expect(actual).toEqual([file01, file02, file03, file04, file05, file06, file07])
  })

  it('optionsを指定しない場合', async () => {
    const getStorageChildren = td.replace(api, 'getStorageChildren')
    td.when(
      getStorageChildren(
        {
          maxResults: undefined,
          pageToken: undefined,
        },
        `d1`
      )
    ).thenResolve({ list: [file01, file02, file03], nextPageToken: 'next-token-1' })
    td.when(
      getStorageChildren(
        {
          maxResults: undefined,
          pageToken: 'next-token-1',
        },
        `d1`
      )
    ).thenResolve({ list: [file04, file05, file06], nextPageToken: 'next-token-2' })
    td.when(
      getStorageChildren(
        {
          maxResults: undefined,
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
    const getStorageChildren = td.replace(api, 'getStorageChildren')
    td.when(
      getStorageChildren({
        maxResults: undefined,
        pageToken: undefined,
      })
    ).thenResolve({ list: [file01, file02, file03], nextPageToken: 'next-token-1' })
    td.when(
      getStorageChildren({
        maxResults: undefined,
        pageToken: 'next-token-1',
      })
    ).thenResolve({ list: [file04, file05, file06], nextPageToken: 'next-token-2' })
    td.when(
      getStorageChildren({
        maxResults: undefined,
        pageToken: 'next-token-2',
      })
    ).thenResolve({ list: [file07] })

    // 引数を全て指定せずに実行
    const actual = await storageLogic.getPaginationNodesAPI(api, getStorageChildren, null)

    expect(actual).toEqual([file01, file02, file03, file04, file05, file06, file07])
  })
})
