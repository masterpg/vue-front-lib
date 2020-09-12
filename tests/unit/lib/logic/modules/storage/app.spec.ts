import * as td from 'testdouble'
import { EMPTY_SHARE_SETTINGS, cloneTestStorageNode, newTestStorageDirNode, newTestStorageFileNode } from '../../../../../helpers/common/storage'
import {
  LibAPIContainer,
  StorageArticleNodeType,
  StorageLogic,
  StorageNode,
  StorageNodeShareSettings,
  StorageNodeType,
  StorageState,
  StorageStore,
} from '@/lib'
import { AppStorageLogic } from '../../../../../../src/lib/logic/modules/storage'
import { Component } from 'vue-property-decorator'
import { TestStore } from '../../../../../helpers/common/store'
import { cloneDeep } from 'lodash'
import { config } from '../../../../../mocks/lib/config'
import dayjs from 'dayjs'
import { generateFirestoreId } from '../../../../../helpers/common/base'
import { getStorageNodeURL } from '../../../../../../src/lib/logic/base'
import { initLibTest } from '../../../../../helpers/lib/init'
import { shuffleArray } from 'web-base-lib'
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
  createDirAPI = td.func() as any
  createHierarchicalDirsAPI = td.func() as any
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
  m_getPaginationNodesAPI: AppStorageLogic['m_getPaginationNodesAPI']
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

describe('AppStorageLogic', () => {
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

  describe('createDir', () => {
    const SHARE_SETTINGS: StorageNodeShareSettings = {
      isPublic: true,
      readUIds: ['ichiro'],
      writeUIds: ['ichiro'],
    }

    it('ベーシックケース', async () => {
      const d1 = newTestStorageDirNode(`d1`)
      const d11 = newTestStorageDirNode(`d1/d11`, { share: SHARE_SETTINGS })
      storageStore.initState({ all: cloneDeep([d1]) })

      td.when(storageLogic.createDirAPI(d11.path, SHARE_SETTINGS)).thenResolve(cloneDeep(d11))

      const actual = await storageLogic.createDir(d11.path, SHARE_SETTINGS)

      expect(actual).toEqual(d11)
      expect(storageLogic.nodes).toEqual([d1, d11])
    })

    it('指定ディレクトリの祖先が読み込まれていない場合', async () => {
      const d1 = newTestStorageDirNode(`d1`)
      const d111 = newTestStorageDirNode(`d1/d11/d111`)
      storageStore.initState({ all: cloneDeep([d1]) })

      // 作成ディレクトリの祖先が読み込まれていない状態でディレクトリ作成
      td.when(storageLogic.createDirAPI(d111.path)).thenThrow(new Error())

      let actual!: Error
      try {
        await storageLogic.createDir(d111.path)
      } catch (err) {
        actual = err
      }

      // スローされたエラーを検証
      expect(actual.message).toBe(`One of the ancestor nodes in the path '${d111.path}' does not exist.`)
      // ノードリストに変化がないことを検証
      expect(storageLogic.nodes).toEqual([d1])
    })

    it('APIでエラーが発生した場合', async () => {
      const d1 = newTestStorageDirNode(`d1`)
      const d11 = newTestStorageDirNode(`d1/d11`)
      storageStore.initState({ all: cloneDeep([d1]) })

      td.when(storageLogic.createDirAPI(d11.path)).thenThrow(new Error())

      try {
        await storageLogic.createDir(d11.path)
      } catch (err) {}

      // ノードリストに変化がないことを検証
      expect(storageLogic.nodes).toEqual([d1])
    })
  })

  describe('createHierarchicalDirs', () => {
    it('ベーシックケース', async () => {
      const d1 = newTestStorageDirNode(`d1`)
      const d11 = newTestStorageDirNode(`d1/d11`)
      const d12 = newTestStorageDirNode(`d1/d12`)
      storageStore.initState({ all: cloneDeep([d1]) })

      td.when(storageLogic.createHierarchicalDirsAPI([d11.path, d12.path])).thenResolve(cloneDeep([d11, d12]))

      const actual = await storageLogic.createHierarchicalDirs([d11.path, d12.path])

      expect(actual).toEqual([d11, d12])
      expect(storageLogic.nodes).toEqual([d1, d11, d12])
    })

    it('APIでエラーが発生した場合', async () => {
      const d1 = newTestStorageDirNode(`d1`)
      const d11 = newTestStorageDirNode(`d1/d11`)
      const d12 = newTestStorageDirNode(`d1/d12`)
      storageStore.initState({ all: cloneDeep([d1]) })

      td.when(storageLogic.createHierarchicalDirsAPI([d11.path])).thenThrow(new Error())

      try {
        await storageLogic.createHierarchicalDirs([d11.path])
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
      // ├dC ← 他端末で｢tmp2/dA/dB｣へ移動されている
      // │└fileC.txt
      // └tmp1
      //   └dA ← 他端末で｢tmp2｣へ移動されている
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
      // └tmp2
      //   └dA
      //     ├dB
      //     │├dC
      //     ││└fileC.txt
      //     │└fileB.txt
      //     └fileA.txt
      const tmp2 = newTestStorageDirNode('tmp2')
      dA = cloneTestStorageNode(dA, { dir: 'tmp2', path: 'tmp2/dA', updatedAt: dayjs() })
      dB = cloneTestStorageNode(dB, { dir: 'tmp2/dA', path: 'tmp2/dA/dB' })
      dC = cloneTestStorageNode(dC, { dir: 'tmp2/dA/dB', path: 'tmp2/dA/dB/dC', updatedAt: dayjs() })
      fileC = cloneTestStorageNode(fileC, { dir: 'tmp2/dA/dB/dC', path: 'tmp2/dA/dB/dC/fileC.txt' })
      fileB = cloneTestStorageNode(fileB, { dir: 'tmp2/dA/dB', path: 'tmp2/dA/dB/fileB.txt' })
      fileA = cloneTestStorageNode(fileA, { dir: 'tmp2/dA', path: 'tmp2/dA/fileA.txt' })

      const actual = storageLogic.setAPINodesToStore([tmp2, dA, dB, dC, fileC, fileB, fileA])

      expect(actual).toEqual([tmp2, dA, dB, dC, fileC, fileB, fileA])
      expect(storageLogic.nodes).toEqual([tmp1, tmp2, dA, dB, dC, fileC, fileB, fileA])
    })
  })

  describe('m_getPaginationNodesAPI', () => {
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
          articleNodeName: null,
          articleNodeType: null,
          articleSortOrder: null,
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

      const actual = await storageLogic.m_getPaginationNodesAPI(api, getStorageChildren, { maxChunk: 3 }, `d1`)

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
      const actual = await storageLogic.m_getPaginationNodesAPI(api, getStorageChildren, null, `d1`)

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
      const actual = await storageLogic.m_getPaginationNodesAPI(api, getStorageChildren, null)

      expect(actual).toEqual([file01, file02, file03, file04, file05, file06, file07])
    })
  })
})

describe('StorageLogic', () => {
  describe('sortTree', () => {
    it('パターン①', async () => {
      // root
      // ├blog
      // │├art1
      // ││└index.md
      // │└art2
      // │  └index.md
      // └category
      //   ├art1
      //   ├art2
      //   ├TypeScript
      //   │├art1
      //   ││└index.md
      //   │└art2
      //   │  └index.md
      //   └JavaScript
      //     ├art1
      //     │︙
      //     └art2
      //       ︙
      const blog = newTestStorageDirNode(`blog`, {
        articleNodeType: StorageArticleNodeType.ListBundle,
        articleSortOrder: 9,
      })
      const blog_art1 = newTestStorageDirNode(`blog/art1`, {
        articleNodeType: StorageArticleNodeType.Article,
        articleSortOrder: 99,
      })
      const blog_art1_index = newTestStorageFileNode(`blog/art1/index.md`)
      const blog_art2 = newTestStorageDirNode(`blog/art2`, {
        articleNodeType: StorageArticleNodeType.Article,
        articleSortOrder: 98,
      })
      const blog_art2_index = newTestStorageFileNode(`blog/art2/index.md`)
      const category = newTestStorageDirNode(`category`, {
        articleNodeType: StorageArticleNodeType.CategoryBundle,
        articleSortOrder: 8,
      })
      const category_art1 = newTestStorageDirNode(`category/art1`, {
        articleNodeType: StorageArticleNodeType.Article,
        articleSortOrder: 99,
      })
      const category_art2 = newTestStorageDirNode(`category/art2`, {
        articleNodeType: StorageArticleNodeType.Article,
        articleSortOrder: 98,
      })
      const category_ts = newTestStorageDirNode(`category/TypeScript`, {
        articleSortOrder: 97,
      })
      const category_ts_art1 = newTestStorageDirNode(`category/TypeScript/art1`, {
        articleNodeType: StorageArticleNodeType.Article,
        articleSortOrder: 999,
      })
      const category_ts_art1_index = newTestStorageFileNode(`category/TypeScript/art1/index.md`)
      const category_ts_art2 = newTestStorageDirNode(`category/TypeScript/art2`, {
        articleNodeType: StorageArticleNodeType.Article,
        articleSortOrder: 998,
      })
      const category_ts_art2_index = newTestStorageFileNode(`category/TypeScript/art2/index.md`)
      const category_js = newTestStorageDirNode(`category/JavaScript`)
      const category_js_art1 = newTestStorageDirNode(`category/JavaScript/art1`, {
        articleNodeType: StorageArticleNodeType.Article,
        articleSortOrder: 999,
      })
      const category_js_art2 = newTestStorageDirNode(`category/JavaScript/art2`, {
        articleNodeType: StorageArticleNodeType.Article,
        articleSortOrder: 998,
      })

      const nodes = shuffleArray([
        blog,
        blog_art1,
        blog_art1_index,
        blog_art2,
        blog_art2_index,
        category,
        category_art1,
        category_art2,
        category_ts,
        category_ts_art1,
        category_ts_art1_index,
        category_ts_art2,
        category_ts_art2_index,
        category_js,
        category_js_art1,
        category_js_art2,
      ])

      // テスト対象実行
      StorageLogic.sortTree(nodes)

      expect(nodes[0]).toBe(blog)
      expect(nodes[1]).toBe(blog_art1)
      expect(nodes[2]).toBe(blog_art1_index)
      expect(nodes[3]).toBe(blog_art2)
      expect(nodes[4]).toBe(blog_art2_index)
      expect(nodes[5]).toBe(category)
      expect(nodes[6]).toBe(category_art1)
      expect(nodes[7]).toBe(category_art2)
      expect(nodes[8]).toBe(category_ts)
      expect(nodes[9]).toBe(category_ts_art1)
      expect(nodes[10]).toBe(category_ts_art1_index)
      expect(nodes[11]).toBe(category_ts_art2)
      expect(nodes[12]).toBe(category_ts_art2_index)
      expect(nodes[13]).toBe(category_js)
      expect(nodes[14]).toBe(category_js_art1)
      expect(nodes[15]).toBe(category_js_art2)
    })

    it('パターン②', async () => {
      // ......
      //   ├art1
      //   ├art2
      //   ├TypeScript
      //   │├art1
      //   │└art2
      //   └JavaScript
      //     ├art1
      //     └art2
      const category_art1 = newTestStorageDirNode(`category/art1`, {
        articleNodeType: StorageArticleNodeType.Article,
        articleSortOrder: 99,
      })
      const category_art2 = newTestStorageDirNode(`category/art2`, {
        articleNodeType: StorageArticleNodeType.Article,
        articleSortOrder: 98,
      })
      const category_ts = newTestStorageDirNode(`category/TypeScript`, {
        articleSortOrder: 97,
      })
      const category_ts_art1 = newTestStorageDirNode(`category/TypeScript/art1`, {
        articleNodeType: StorageArticleNodeType.Article,
        articleSortOrder: 999,
      })
      const category_ts_art2 = newTestStorageDirNode(`category/TypeScript/art2`, {
        articleNodeType: StorageArticleNodeType.Article,
        articleSortOrder: 998,
      })
      const category_js = newTestStorageDirNode(`category/JavaScript`, {
        articleSortOrder: 96,
      })
      const category_js_art1 = newTestStorageDirNode(`category/JavaScript/art1`, {
        articleNodeType: StorageArticleNodeType.Article,
        articleSortOrder: 999,
      })
      const category_js_art2 = newTestStorageDirNode(`category/JavaScript/art2`, {
        articleNodeType: StorageArticleNodeType.Article,
        articleSortOrder: 998,
      })

      // 実際は上位ディレクトリ(category)は存在するが、配列には追加されないパターン
      const nodes = shuffleArray([
        category_art1,
        category_art2,
        category_ts,
        category_ts_art1,
        category_ts_art2,
        category_js,
        category_js_art1,
        category_js_art2,
      ])

      // テスト対象実行
      StorageLogic.sortTree(nodes)

      expect(nodes[0]).toBe(category_art1)
      expect(nodes[1]).toBe(category_art2)
      expect(nodes[2]).toBe(category_ts)
      expect(nodes[3]).toBe(category_ts_art1)
      expect(nodes[4]).toBe(category_ts_art2)
      expect(nodes[5]).toBe(category_js)
      expect(nodes[6]).toBe(category_js_art1)
      expect(nodes[7]).toBe(category_js_art2)
    })
  })

  describe('getStorageType', () => {
    describe('タイプがarticleの場合', () => {
      it('パターン①', async () => {
        const userRootName = config.storage.user.rootName
        const articleRootName = config.storage.article.rootName

        // '/'なしで終わる
        const actual = StorageLogic.getStorageType(`${userRootName}/taro/${articleRootName}`)

        expect(actual).toBe('article')
      })

      it('パターン②', async () => {
        const userRootName = config.storage.user.rootName
        const articleRootName = config.storage.article.rootName

        // '/'で終わる
        const actual = StorageLogic.getStorageType(`${userRootName}/taro/${articleRootName}/`)

        expect(actual).toBe('article')
      })

      it('パターン③', async () => {
        const userRootName = config.storage.user.rootName
        const articleRootName = config.storage.article.rootName

        // '/'の続きがある
        const actual = StorageLogic.getStorageType(`${userRootName}/taro/${articleRootName}/aaa`)

        expect(actual).toBe('article')
      })
    })

    describe('タイプがuserの場合', () => {
      it('パターン①', async () => {
        const userRootName = config.storage.user.rootName

        // '/'なしで終わる
        const actual = StorageLogic.getStorageType(`${userRootName}/taro/aaa`)

        expect(actual).toBe('user')
      })

      it('パターン②', async () => {
        const userRootName = config.storage.user.rootName

        // '/'で終わる
        const actual = StorageLogic.getStorageType(`${userRootName}/taro/aaa/`)

        expect(actual).toBe('user')
      })
    })

    describe('タイプがappの場合', () => {
      it('パターン①', async () => {
        // '/'なしで終わる
        const actual = StorageLogic.getStorageType(`aaa`)

        expect(actual).toBe('app')
      })

      it('パターン②', async () => {
        // '/'で終わる
        const actual = StorageLogic.getStorageType(`aaa/`)

        expect(actual).toBe('app')
      })
    })
  })

  describe('isRootNode', () => {
    describe('記事ルート', () => {
      it(`'/'なしで終わる`, async () => {
        const userRootName = config.storage.user.rootName
        const articleRootName = config.storage.article.rootName

        // '/'なしで終わる
        const actual = StorageLogic.isRootNode(`${userRootName}/taro/${articleRootName}`)

        expect(actual).toBeTruthy()
      })

      it(`'/'ありで終わる`, async () => {
        const userRootName = config.storage.user.rootName
        const articleRootName = config.storage.article.rootName

        // '/'ありで終わる
        const actual = StorageLogic.isRootNode(`${userRootName}/taro/${articleRootName}/`)

        expect(actual).toBeTruthy()
      })

      it(`'/'の続きがある`, async () => {
        const userRootName = config.storage.user.rootName
        const articleRootName = config.storage.article.rootName

        // '/'ありで終わる
        const actual = StorageLogic.isRootNode(`${userRootName}/taro/${articleRootName}/aaa`)

        expect(actual).toBeFalsy()
      })
    })

    describe('ユーザールート', () => {
      it(`'/'なしで終わる`, async () => {
        const userRootName = config.storage.user.rootName

        // '/'なしで終わる
        const actual = StorageLogic.isRootNode(`${userRootName}/taro`)

        expect(actual).toBeTruthy()
      })

      it(`'/'ありで終わる`, async () => {
        const userRootName = config.storage.user.rootName

        // '/'ありで終わる
        const actual = StorageLogic.isRootNode(`${userRootName}/taro/`)

        expect(actual).toBeTruthy()
      })

      it(`'/'の続きがある`, async () => {
        const userRootName = config.storage.user.rootName

        // '/'ありで終わる
        const actual = StorageLogic.isRootNode(`${userRootName}/taro/aaa`)

        expect(actual).toBeFalsy()
      })
    })

    describe('アプリケーションルート', () => {
      it(`空文字の場合`, async () => {
        const actual = StorageLogic.isRootNode(``)
        expect(actual).toBeTruthy()
      })

      it(`undefinedの場合`, async () => {
        const actual = StorageLogic.isRootNode(undefined)
        expect(actual).toBeTruthy()
      })

      it(`'/'の場合`, async () => {
        const actual = StorageLogic.isRootNode(`/`)
        expect(actual).toBeFalsy()
      })

      it(`何かしらアプリケーションノードが指定された場合`, async () => {
        const actual = StorageLogic.isRootNode(`aaa`)
        expect(actual).toBeFalsy()
      })
    })
  })
})
