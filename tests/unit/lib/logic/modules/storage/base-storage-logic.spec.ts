import * as shortid from 'shortid'
import * as td from 'testdouble'
import { LibAPIContainer, StorageNode, StorageNodeShareSettings, StorageNodeType, StorageState } from '@/lib'
import { BaseStorageLogic } from '@/lib/logic/modules/storage/base/base-storage-logic'
import { BaseStorageStore } from '@/lib/logic/store/modules/storage/base'
import { Component } from 'vue-property-decorator'
import { StorageStore } from '@/lib/logic/store'
import { TestStore } from '../../../../../helpers/common/store'
import { config } from '@/lib/config'
import dayjs from 'dayjs'
import deepmerge from 'deepmerge'
import { initLibTest } from '../../../../../helpers/lib/init'
import { removeEndSlash } from 'web-base-lib'
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

const f112: StorageNode = {
  id: shortid.generate(),
  nodeType: StorageNodeType.File,
  name: 'f112.txt',
  dir: 'd1/d11',
  path: 'd1/d11/f112.txt',
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

const d3: StorageNode = {
  id: shortid.generate(),
  nodeType: StorageNodeType.Dir,
  name: 'd3',
  dir: '',
  path: 'd3',
  contentType: '',
  size: 0,
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

const STORAGE_NODE_MAP = STORAGE_NODES.reduce(
  (result, node) => {
    result[node.path] = node
    return result
  },
  {} as { [path: string]: StorageNode }
)

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

describe('getNodeDict', () => {
  it('ベーシックケース', () => {
    storageStore.initState({ all: cloneDeep(STORAGE_NODES) })

    const actual = storageLogic.getNodeDict()

    expect(actual).toEqual(STORAGE_NODE_MAP)
  })
})

describe('pullDescendants', () => {
  it('dirPathを指定しなかった場合', async () => {
    // root
    // ├d1
    // │├d11
    // ││└f111.txt
    // │└d12
    // └d2
    storageStore.initState({ all: cloneDeep([d1, d11, f111, d12, d2]) })

    // APIから以下の状態のノードリストが取得される
    // ・'d1/d11/f111.txt'が'f1.txt'へ移動+リネームされた
    // ・'d1/d11/f112.txt'が追加された
    // ・'d1/d12'が削除された
    const f1: StorageNode = Object.assign(cloneDeep(f111), {
      dir: '',
      path: 'f1.txt',
    })
    td.when(storageLogic.getDirDescendantsAPI(undefined)).thenResolve([d1, d11, f112, f1, d2])

    const actual = await storageLogic.pullDescendants()

    // root
    // ├d1
    // │└d11
    // │  └f112.txt
    // ├d2
    // └f1.txt
    expect(storageLogic.nodes).toEqual([d1, d11, f112, d2, f1])

    expect(storageLogic.sortNodes(actual.added)).toEqual([f112])
    expect(storageLogic.sortNodes(actual.updated)).toEqual([d1, d11, d2, f1])
    expect(storageLogic.sortNodes(actual.removed)).toEqual([d12])
  })

  it('dirPathを指定した場合 - ベーシックケース', async () => {
    // root
    // ├d1
    // │├d11
    // ││└f111.txt
    // │└d12
    // └d2
    storageStore.initState({ all: cloneDeep([d1, d11, f111, d12, d2]) })

    // APIから以下の状態のノードリストが取得される
    // ・'d1/d11/f111.txt'が'f1.txt'へ移動+リネームされた
    // ・'d1/d11/f112.txt'が追加された
    // ・'d1/d12'が削除された
    td.when(storageLogic.getDirDescendantsAPI(d1.path)).thenResolve([d1, d11, f112])

    const actual = await storageLogic.pullDescendants(d1.path)

    // root
    // ├d1
    // │└d11
    // │  └f112.txt
    // ├d2
    // └f1.txt ← 移動+リネームされても、今回の検索範囲外なのでロジックストアに反映されない
    expect(storageLogic.nodes).toEqual([d1, d11, f112, d2])

    expect(storageLogic.sortNodes(actual.added)).toEqual([f112])
    expect(storageLogic.sortNodes(actual.updated)).toEqual([d1, d11])
    expect(storageLogic.sortNodes(actual.removed)).toEqual([f111, d12])
  })

  it('dirPathを指定した場合 - dirPathのノードが削除されていた', async () => {
    // root
    // ├d1
    // │├d11
    // ││└f111.txt
    // │└d12
    // └d2
    storageStore.initState({ all: cloneDeep([d1, d11, f111, d12, d2]) })

    // APIから以下の状態のノードリストが取得される
    // ・'d1/d11'が削除され存在しない
    td.when(storageLogic.getDirDescendantsAPI(d11.path)).thenResolve([])

    const actual = await storageLogic.pullDescendants(d11.path)

    // root
    // ├d1
    // │└d12
    // └d2
    expect(storageLogic.nodes).toEqual([d1, d12, d2])

    expect(storageLogic.sortNodes(actual.added)).toEqual([])
    expect(storageLogic.sortNodes(actual.updated)).toEqual([])
    expect(storageLogic.sortNodes(actual.removed)).toEqual([d11, f111])
  })
})

describe('pullChildren', () => {
  it('dirPathを指定しなかった場合', async () => {
    storageStore.initState({ all: [] })
    td.when(storageLogic.getChildrenAPI(undefined)).thenResolve([d1, d2, f1])

    await storageLogic.pullChildren()

    expect(storageLogic.nodes).toEqual([d1, d2, f1])
  })

  it('dirPathを指定した場合', async () => {
    // root
    // ├d1
    // │├d11
    // ││└f111.txt
    // │├d12
    // ││└f121.txt
    // │└f11.txt
    // └d2
    storageStore.initState({ all: cloneDeep([d1, d11, f111, d12, f121, f11, d2]) })

    // APIから以下の状態のノードリストが取得される
    // ・'d1/f12.txt'が追加された
    // ・'d1/d12'が削除(または移動)された
    const f12: StorageNode = {
      id: shortid.generate(),
      nodeType: StorageNodeType.File,
      name: 'f12.txt',
      dir: 'd1',
      path: 'd1/f12.txt',
      contentType: 'text/plain; charset=utf-8',
      size: 5,
      share: cloneDeep(EMPTY_SHARE_SETTINGS),
      created: dayjs(),
      updated: dayjs(),
    }
    td.when(storageLogic.getChildrenAPI(d1.path)).thenResolve([d11, f11, f12])

    const actual = await storageLogic.pullChildren(d1.path)

    // root
    // ├d1
    // │├d11
    // ││└f111.txt
    // │├f11.txt
    // │└f12.txt
    // └d2
    expect(storageLogic.nodes).toEqual([d1, d11, f111, f11, f12, d2])

    expect(storageLogic.sortNodes(actual.added)).toEqual([f12])
    expect(storageLogic.sortNodes(actual.updated)).toEqual([d11, f11])
    expect(storageLogic.sortNodes(actual.removed)).toEqual([d12, f121])
  })
})

describe('createDirs', () => {
  it('ベーシックケース', async () => {
    storageStore.initState({ all: cloneDeep([d1]) })
    td.when(storageLogic.createDirsAPI([d11.path, d12.path])).thenResolve([d11, d12])

    const actual = await storageLogic.createDirs([d11.path, d12.path])

    expect(actual).toEqual([d11, d12])
    expect(storageLogic.nodes).toEqual([d1, d11, d12])
  })

  it('APIでエラーが発生した場合', async () => {
    storageStore.initState({ all: cloneDeep([d1]) })
    td.when(storageLogic.createDirsAPI([d11.path])).thenThrow(new Error())

    try {
      await storageLogic.createDirs([d11.path, d12.path])
    } catch (err) {}

    // ノード一覧に変化がないことを検証
    expect(storageLogic.nodes).toEqual([d1])
  })
})

describe('removeDirs', () => {
  it('ベーシックケース', async () => {
    storageStore.initState({ all: cloneDeep([d1, d11, f111, d12]) })

    await storageLogic.removeDirs([d11.path, d12.path])

    expect(storageLogic.nodes).toEqual([d1])

    const exp = td.explain(storageLogic.removeDirsAPI)
    expect(exp.calls[0].args[0]).toEqual([d11.path, d12.path])
  })

  it('存在しないディレクトリパスを指定した場合', async () => {
    storageStore.initState({ all: cloneDeep([d1]) })

    await storageLogic.removeDirs([d11.path])

    expect(storageLogic.nodes).toEqual([d1])

    const exp = td.explain(storageLogic.removeDirsAPI)
    expect(exp.calls[0].args[0]).toEqual([d11.path])
  })

  it('APIでエラーが発生した場合', async () => {
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
    storageStore.initState({ all: cloneDeep([d1, d11, f111, f1]) })

    await storageLogic.removeFiles([f111.path, f1.path])

    expect(storageLogic.nodes).toEqual([d1, d11])

    const exp = td.explain(storageLogic.removeFilesAPI)
    expect(exp.calls[0].args[0]).toEqual([f111.path, f1.path])
  })

  it('存在しないファイルパスを指定した場合', async () => {
    storageStore.initState({ all: cloneDeep([d1, d11]) })

    await storageLogic.removeFiles([f111.path])

    expect(storageLogic.nodes).toEqual([d1, d11])

    const exp = td.explain(storageLogic.removeFilesAPI)
    expect(exp.calls[0].args[0]).toEqual([f111.path])
  })

  it('APIでエラーが発生した場合', async () => {
    storageStore.initState({ all: cloneDeep([f1]) })
    td.when(storageLogic.removeFilesAPI([f1.path])).thenThrow(new Error())

    try {
      await storageLogic.removeFiles([f1.path])
    } catch (err) {}

    // ノード一覧に変化がないことを検証
    expect(storageLogic.nodes).toEqual([f1])
  })
})

describe('moveDir', () => {
  it('ベーシックケース', async () => {
    storageStore.initState({ all: cloneDeep([d1, d11, f111, d2]) })

    // 'd1/d11'を'd2/d11'へ移動
    const movedD11 = deepmerge(cloneDeep(d11), {
      name: 'd11',
      dir: 'd2',
      path: 'd2/d11',
      created: dayjs(),
      updated: dayjs(),
    }) as StorageNode
    const movedF111 = deepmerge(cloneDeep(f111), {
      dir: 'd2/d11',
      path: 'd2/d11/f111.txt',
      created: dayjs(),
      updated: dayjs(),
    }) as StorageNode
    td.when(storageLogic.getDirDescendantsAPI(movedD11.path)).thenResolve([movedD11, movedF111])

    await storageLogic.moveDir(d11.path, movedD11.path)

    expect(storageLogic.nodes).toEqual([d1, d2, movedD11, movedF111])

    const exp = td.explain(storageLogic.moveDirAPI)
    expect(exp.calls[0].args[0]).toBe(d11.path)
    expect(exp.calls[0].args[1]).toBe(movedD11.path)
  })

  it('移動ノードの配下がストアに読み込まれていない場合', async () => {
    // 移動ノード'd1/d11'の配下ノードがストアに読み込まれていない状態にする
    storageStore.initState({ all: cloneDeep([d1, d11, d2]) })

    // 'd1/d11'を'd2/d11'へ移動
    const movedD11 = deepmerge(cloneDeep(d11), {
      name: 'd11',
      dir: 'd2',
      path: 'd2/d11',
      created: dayjs(),
      updated: dayjs(),
    }) as StorageNode
    const movedF111 = deepmerge(cloneDeep(f111), {
      dir: 'd2/d11',
      path: 'd2/d11/f111.txt',
      created: dayjs(),
      updated: dayjs(),
    }) as StorageNode
    td.when(storageLogic.getDirDescendantsAPI(movedD11.path)).thenResolve([movedD11, movedF111])

    await storageLogic.moveDir(d11.path, movedD11.path)

    expect(storageLogic.nodes).toEqual([d1, d2, movedD11, movedF111])

    const exp = td.explain(storageLogic.moveDirAPI)
    expect(exp.calls[0].args[0]).toBe(d11.path)
    expect(exp.calls[0].args[1]).toBe(movedD11.path)
  })

  it('APIでエラーが発生した場合', async () => {
    storageStore.initState({ all: cloneDeep([d1, d11, d2]) })

    const movedD11 = deepmerge(cloneDeep(d11), {
      name: 'd11',
      dir: 'd2',
      path: 'd2/d11',
      created: dayjs(),
      updated: dayjs(),
    }) as StorageNode
    td.when(storageLogic.moveDirAPI(d11.path, movedD11.path)).thenThrow(new Error())

    try {
      await storageLogic.moveDir(d11.path, movedD11.path)
    } catch (err) {}

    // ノード一覧に変化がないことを検証
    expect(storageLogic.nodes).toEqual([d1, d11, d2])
  })
})

describe('moveFile', () => {
  it('ベーシックケース', async () => {
    storageStore.initState({ all: cloneDeep([d1, d11, f111, d12]) })

    // 'd1/d11/f111.txt'を'd1/d12/f111.txt'へ移動
    const movedF111 = deepmerge(cloneDeep(f111), {
      dir: 'd1/d12',
      path: 'd1/d12/f111.txt',
      created: dayjs(),
      updated: dayjs(),
    }) as StorageNode
    td.when(storageLogic.getNodeAPI(movedF111.path)).thenResolve(movedF111)

    await storageLogic.moveFile(f111.path, movedF111.path)

    expect(storageLogic.nodes).toEqual([d1, d11, d12, movedF111])

    const exp = td.explain(storageLogic.moveFileAPI)
    expect(exp.calls[0].args[0]).toBe(f111.path)
    expect(exp.calls[0].args[1]).toBe(movedF111.path)
  })

  it('APIでエラーが発生した場合', async () => {
    storageStore.initState({ all: cloneDeep([d1, d11, f111, d12]) })

    const movedF111 = deepmerge(cloneDeep(f111), {
      dir: 'd1/d12',
      path: 'd1/d12/f111.txt',
      created: dayjs(),
      updated: dayjs(),
    }) as StorageNode
    td.when(storageLogic.moveFileAPI(f111.path, movedF111.path)).thenThrow(new Error())

    try {
      await storageLogic.moveFile(f111.path, movedF111.path)
    } catch (err) {}

    // ノード一覧に変化がないことを検証
    expect(storageLogic.nodes).toEqual([d1, d11, f111, d12])
  })
})

describe('renameDir', () => {
  it('ベーシックケース', async () => {
    storageStore.initState({ all: cloneDeep([d1, d11, f111]) })

    // 'd1/d11'を'd1/x11'へリネーム
    const renamedX11 = deepmerge(cloneDeep(d11), {
      name: 'x11',
      path: 'd1/x11',
      created: dayjs(),
      updated: dayjs(),
    }) as StorageNode
    const renamedF111 = deepmerge(cloneDeep(f111), {
      dir: 'd1/x11',
      path: 'd1/x11/f111.txt',
      created: dayjs(),
      updated: dayjs(),
    }) as StorageNode
    td.when(storageLogic.getDirDescendantsAPI(renamedX11.path)).thenResolve([renamedX11, renamedF111])

    await storageLogic.renameDir(d11.path, renamedX11.name)

    expect(storageLogic.nodes).toEqual([d1, renamedX11, renamedF111])

    const exp = td.explain(storageLogic.renameDirAPI)
    expect(exp.calls[0].args[0]).toBe(d11.path)
    expect(exp.calls[0].args[1]).toBe(renamedX11.name)
  })

  it('リネームノードの配下がストアに読み込まれていない場合', async () => {
    // リネームノード'd1/d11'の配下ノードがストアに読み込まれていない状態にする
    storageStore.initState({ all: cloneDeep([d1, d11]) })

    // 'd1/d11'を'd1/x11'へリネーム
    const renamedX11 = deepmerge(cloneDeep(d11), {
      name: 'x11',
      path: 'd1/x11',
      created: dayjs(),
      updated: dayjs(),
    }) as StorageNode
    const renamedF111 = deepmerge(cloneDeep(f111), {
      dir: 'd1/x11',
      path: 'd1/x11/f111.txt',
      created: dayjs(),
      updated: dayjs(),
    }) as StorageNode
    td.when(storageLogic.getDirDescendantsAPI(renamedX11.path)).thenResolve([renamedX11, renamedF111])

    await storageLogic.renameDir(d11.path, renamedX11.name)

    expect(storageLogic.nodes).toEqual([d1, renamedX11, renamedF111])

    const exp = td.explain(storageLogic.renameDirAPI)
    expect(exp.calls[0].args[0]).toBe(d11.path)
    expect(exp.calls[0].args[1]).toBe(renamedX11.name)
  })

  it('APIでエラーが発生した場合', async () => {
    storageStore.initState({ all: cloneDeep([d1, d11]) })

    const renamedX11 = deepmerge(cloneDeep(d11), {
      name: 'x11',
      path: 'd1/x11',
      created: dayjs(),
      updated: dayjs(),
    }) as StorageNode
    td.when(storageLogic.renameDirAPI(d11.path, renamedX11.name)).thenThrow(new Error())

    try {
      await storageLogic.renameDir(d11.path, renamedX11.name)
    } catch (err) {}

    // ノード一覧に変化がないことを検証
    expect(storageLogic.nodes).toEqual([d1, d11])
  })
})

describe('renameFile', () => {
  it('ベーシックケース', async () => {
    storageStore.initState({ all: cloneDeep([d1, d11, f111]) })

    // 'd1/d11/f111.txt'を'd1/d11/f11X.txt'へリネーム
    const renamedF11X = deepmerge(cloneDeep(f111), {
      name: 'f11X.txt',
      path: 'd1/d11/f11X.txt',
      created: dayjs(),
      updated: dayjs(),
    }) as StorageNode
    td.when(storageLogic.getNodeAPI(renamedF11X.path)).thenResolve(renamedF11X)

    await storageLogic.renameFile(f111.path, renamedF11X.name)

    expect(storageLogic.nodes).toEqual([d1, d11, renamedF11X])

    const exp = td.explain(storageLogic.renameFileAPI)
    expect(exp.calls[0].args[0]).toBe(f111.path)
    expect(exp.calls[0].args[1]).toBe(renamedF11X.name)
  })

  it('APIでエラーが発生した場合', async () => {
    storageStore.initState({ all: cloneDeep([d1, d11, f111]) })

    const renamedF11X = deepmerge(cloneDeep(f111), {
      name: 'fileX.txt',
      path: 'd1/d11/fileX.txt',
      created: dayjs(),
      updated: dayjs(),
    }) as StorageNode
    td.when(storageLogic.renameFileAPI(f111.path, renamedF11X.name)).thenThrow(new Error())

    try {
      await storageLogic.renameFile(f111.path, renamedF11X.name)
    } catch (err) {}

    // ノード一覧に変化がないことを検証
    expect(storageLogic.nodes).toEqual([d1, d11, f111])
  })
})

describe('setDirShareSettings', () => {
  const NEW_SHARE_SETTINGS: StorageNodeShareSettings = {
    isPublic: true,
    uids: ['ichiro'],
  }

  it('ベーシックケース', async () => {
    storageStore.initState({ all: cloneDeep([d1, d11, f111]) })

    const updatedD11 = deepmerge(cloneDeep(d11), {
      share: NEW_SHARE_SETTINGS,
      created: dayjs(),
      updated: dayjs(),
    }) as StorageNode
    td.when(storageLogic.setDirShareSettingsAPI(d11.path, NEW_SHARE_SETTINGS)).thenResolve(updatedD11)

    const actual = await storageLogic.setDirShareSettings(d11.path, NEW_SHARE_SETTINGS)

    expect(actual).toEqual(updatedD11)
    expect(storageLogic.nodes).toEqual([d1, updatedD11, f111])
  })

  it('APIでエラーが発生した場合', async () => {
    storageStore.initState({ all: cloneDeep([d1, d11]) })

    td.when(storageLogic.setDirShareSettingsAPI(d11.path, NEW_SHARE_SETTINGS)).thenThrow(new Error())

    try {
      await storageLogic.setDirShareSettings(d11.path, NEW_SHARE_SETTINGS)
    } catch (err) {}

    // ノード一覧に変化がないことを検証
    expect(storageLogic.nodes).toEqual([d1, d11])
  })
})

describe('setFileShareSettings', () => {
  const NEW_SHARE_SETTINGS: StorageNodeShareSettings = {
    isPublic: true,
    uids: ['ichiro'],
  }

  it('ベーシックケース', async () => {
    storageStore.initState({ all: cloneDeep([d1, d11, f111]) })

    const updatedFileA = deepmerge(cloneDeep(f111), {
      share: NEW_SHARE_SETTINGS,
      created: dayjs(),
      updated: dayjs(),
    }) as StorageNode
    td.when(storageLogic.setFileShareSettingsAPI(f111.path, NEW_SHARE_SETTINGS)).thenResolve(updatedFileA)

    const actual = await storageLogic.setFileShareSettings(f111.path, NEW_SHARE_SETTINGS)

    expect(actual).toEqual(updatedFileA)
    expect(storageLogic.nodes).toEqual([d1, d11, updatedFileA])
  })

  it('APIでエラーが発生した場合', async () => {
    storageStore.initState({ all: cloneDeep([d1, d11, f111]) })

    td.when(storageLogic.setFileShareSettingsAPI(f111.path, NEW_SHARE_SETTINGS)).thenThrow(new Error())

    try {
      await storageLogic.setFileShareSettings(f111.path, NEW_SHARE_SETTINGS)
    } catch (err) {}

    // ノード一覧に変化がないことを検証
    expect(storageLogic.nodes).toEqual([d1, d11, f111])
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
