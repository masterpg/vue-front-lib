import * as shortid from 'shortid'
import * as td from 'testdouble'
import {
  LibAPIContainer,
  StorageNode,
  StorageNodeShareSettings,
  StorageNodeShareSettingsInput,
  StorageNodeType,
  StorageState,
  StorageUploadManager,
} from '@/lib'
import { BaseStorageLogic } from '@/lib/logic/modules/storage/base-storage-logic'
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
    const baseStorageURL = `${removeEndSlash(config.api.baseURL)}/storage`
    return `${baseStorageURL}`
  }

  newUploadManager(owner: Element): StorageUploadManager {
    return {} as any
  }

  protected getHierarchicalStorageDescendants(dirPath?: string): Promise<StorageNode[]> {
    return api.getHierarchicalStorageDescendants(dirPath)
  }

  protected getHierarchicalStorageChildren(dirPath?: string): Promise<StorageNode[]> {
    return api.getHierarchicalStorageChildren(dirPath)
  }

  protected getStorageChildren(dirPath?: string): Promise<StorageNode[]> {
    return api.getStorageChildren(dirPath)
  }

  protected createStorageDirs(dirPaths: string[]): Promise<StorageNode[]> {
    return api.createStorageDirs(dirPaths)
  }

  protected removeStorageDirs(dirPaths: string[]): Promise<StorageNode[]> {
    return api.removeStorageDirs(dirPaths)
  }

  protected removeStorageFiles(filePaths: string[]): Promise<StorageNode[]> {
    return api.removeStorageFiles(filePaths)
  }

  protected moveStorageDir(fromDirPath: string, toDirPath: string): Promise<StorageNode[]> {
    return api.moveStorageDir(fromDirPath, toDirPath)
  }

  protected moveStorageFile(fromFilePath: string, toFilePath: string): Promise<StorageNode> {
    return api.moveStorageFile(fromFilePath, toFilePath)
  }

  protected renameStorageDir(dirPath: string, newName: string): Promise<StorageNode[]> {
    return api.renameStorageDir(dirPath, newName)
  }

  protected renameStorageFile(filePath: string, newName: string): Promise<StorageNode> {
    return api.renameStorageFile(filePath, newName)
  }

  protected setStorageDirShareSettings(dirPath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode[]> {
    return api.setStorageDirShareSettings(dirPath, settings)
  }

  protected setStorageFileShareSettings(filePath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode> {
    return api.setStorageFileShareSettings(filePath, settings)
  }
}

let api!: LibAPIContainer

let storageStore!: TestStore<StorageStore, StorageState>

let storageLogic!: BaseStorageLogic

//========================================================================
//
//  Tests
//
//========================================================================

beforeAll(async () => {
  api = td.object<LibAPIContainer>()
  await initLibTest({ api })

  storageStore = (new MockStorageStore() as StorageStore) as TestStore<StorageStore, StorageState>
  storageLogic = new MockStorageLogic()
})

beforeEach(async () => {})

describe('getNodeMap', () => {
  it('ベーシックケース', () => {
    storageStore.initState({ all: cloneDeep(STORAGE_NODES) })

    const actual = storageLogic.getNodeMap()

    expect(actual).toEqual(STORAGE_NODE_MAP)
  })
})

describe('pullDescendants', () => {
  it('dirPathを指定しなかった場合', async () => {
    storageStore.initState({ all: [] })
    td.when(api.getHierarchicalStorageDescendants(undefined)).thenResolve(STORAGE_NODES)

    await storageLogic.pullDescendants()

    expect(storageLogic.nodes).toEqual(STORAGE_NODES)
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
    td.when(api.getHierarchicalStorageDescendants(d1.path)).thenResolve([d1, d11, f11A, fA])

    await storageLogic.pullDescendants(d1.path)

    // root
    // ├d1
    // │└d11
    // │  └f11A.txt
    // ├d2
    // └fA.txt
    expect(storageLogic.nodes).toEqual([d1, d11, f11A, d2, fA])
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
    td.when(api.getHierarchicalStorageDescendants(d11.path)).thenResolve([d1])

    await storageLogic.pullDescendants(d11.path)

    // root
    // ├d1
    // │└d12
    // └d2
    expect(storageLogic.nodes).toEqual([d1, d12, d2])
  })

  it('dirPathを指定した場合 - dirPathの上位ノードが削除されていた', async () => {
    // root
    // ├d1
    // │├d11
    // ││└f111.txt
    // │└d12
    // └d2
    storageStore.initState({ all: cloneDeep([d1, d11, f111, d12, d2]) })

    // APIから以下の状態のノードリストが取得される
    // ・'d1/d11'の上位である'd1'が削除され存在しない
    td.when(api.getHierarchicalStorageDescendants(d11.path)).thenResolve([])

    await storageLogic.pullDescendants(d11.path)

    // root
    // └d2
    expect(storageLogic.nodes).toEqual([d2])
  })
})

describe('pullChildren', () => {
  it('dirPathを指定しなかった場合', async () => {
    storageStore.initState({ all: [] })
    td.when(api.getStorageChildren(undefined)).thenResolve([d1, d2, f1])

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
    td.when(api.getStorageChildren(d1.path)).thenResolve([d11, f11, f12])

    await storageLogic.pullChildren(d1.path)

    // root
    // ├d1
    // │├d11
    // ││└f111.txt
    // │├f11.txt
    // │└f12.txt
    // └d2
    expect(storageLogic.nodes).toEqual([d1, d11, f111, f11, f12, d2])
  })
})

describe('createDirs', () => {
  it('ベーシックケース', async () => {
    storageStore.initState({ all: cloneDeep([d1]) })
    td.when(api.createStorageDirs([d11.path, d12.path])).thenResolve([d11, d12])

    const actual = await storageLogic.createDirs([d11.path, d12.path])

    expect(actual).toEqual([d11, d12])
    expect(storageLogic.nodes).toEqual([d1, d11, d12])
  })

  it('APIでエラーが発生した場合', async () => {
    storageStore.initState({ all: cloneDeep([d1]) })
    td.when(api.createStorageDirs([d11.path])).thenThrow(new Error())

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
    td.when(api.removeStorageDirs([d11.path, d12.path])).thenResolve([d11, f111, d12])

    const actual = await storageLogic.removeDirs([d11.path, d12.path])

    expect(actual).toEqual([d11, f111, d12])
    expect(storageLogic.nodes).toEqual([d1])
  })

  it('存在しないディレクトリパスを指定した場合', async () => {
    storageStore.initState({ all: cloneDeep([d1]) })
    td.when(api.removeStorageDirs([d11.path])).thenResolve([])

    const actual = await storageLogic.removeDirs([d11.path])

    expect(actual).toEqual([])
    expect(storageLogic.nodes).toEqual([d1])
  })

  it('APIでエラーが発生した場合', async () => {
    storageStore.initState({ all: cloneDeep([d1, d11]) })
    td.when(api.removeStorageDirs([d11.path])).thenThrow(new Error())

    try {
      await storageLogic.removeDirs([d11.path])
    } catch (err) {}

    // ノード一覧に変化がないことを検証
    expect(storageLogic.nodes).toEqual([d1, d11])
  })
})

describe('removeFiles', () => {
  it('ベーシックケース', async () => {
    storageStore.initState({ all: cloneDeep([d1, d11, f111, f1]) })
    td.when(api.removeStorageFiles([f111.path, f1.path])).thenResolve([f111, f1])

    const actual = await storageLogic.removeFiles([f111.path, f1.path])

    expect(actual).toEqual([f111, f1])
    expect(storageLogic.nodes).toEqual([d1, d11])
  })

  it('存在しないファイルパスを指定した場合', async () => {
    storageStore.initState({ all: cloneDeep([d1, d11]) })
    td.when(api.removeStorageFiles([f111.path])).thenResolve([])

    const actual = await storageLogic.removeFiles([f111.path])

    expect(actual).toEqual([])
    expect(storageLogic.nodes).toEqual([d1, d11])
  })

  it('APIでエラーが発生した場合', async () => {
    storageStore.initState({ all: cloneDeep([f1]) })
    td.when(api.removeStorageFiles([f1.path])).thenThrow(new Error())

    try {
      await storageLogic.removeFiles([f1.path])
    } catch (err) {}

    // ノード一覧に変化がないことを検証
    expect(storageLogic.nodes).toEqual([f1])
  })
})

describe('moveDir', () => {
  it('ベーシックケース', async () => {
    storageStore.initState({ all: cloneDeep([d1, d11, f111]) })

    const movedD12 = deepmerge(cloneDeep(d11), {
      name: 'd12',
      dir: 'd1',
      path: 'd1/d12',
      created: dayjs(),
      updated: dayjs(),
    }) as StorageNode
    const movedFileA = deepmerge(cloneDeep(f111), {
      dir: 'd1/d12',
      path: 'd1/d12/f111.txt',
      created: dayjs(),
      updated: dayjs(),
    }) as StorageNode
    td.when(api.moveStorageDir(d11.path, movedD12.path)).thenResolve([movedD12, movedFileA])

    const actual = await storageLogic.moveDir(d11.path, movedD12.path)

    expect(actual).toEqual([movedD12, movedFileA])
    expect(storageLogic.nodes).toEqual([d1, movedD12, movedFileA])
  })

  it('移動ノードの配下がストアに読み込まれていない場合', async () => {
    // 移動ノード'd1/d11'の配下ノードがストアに読み込まれていない状態にする
    storageStore.initState({ all: cloneDeep([d1, d11]) })

    const movedD12 = deepmerge(cloneDeep(d11), {
      name: 'd12',
      dir: 'd1',
      path: 'd1/d12',
      created: dayjs(),
      updated: dayjs(),
    }) as StorageNode
    const movedFileA = deepmerge(cloneDeep(f111), {
      dir: 'd1/d12',
      path: 'd1/d12/f111.txt',
      created: dayjs(),
      updated: dayjs(),
    }) as StorageNode
    td.when(api.moveStorageDir(d11.path, movedD12.path)).thenResolve([movedD12, movedFileA])

    const actual = await storageLogic.moveDir(d11.path, movedD12.path)

    expect(actual).toEqual([movedD12, movedFileA])
    expect(storageLogic.nodes).toEqual([d1, movedD12, movedFileA])
  })

  it('APIでエラーが発生した場合', async () => {
    storageStore.initState({ all: cloneDeep([d1, d11]) })

    const movedD12 = deepmerge(cloneDeep(d11), {
      dir: 'd1',
      path: 'd1/d12',
      created: dayjs(),
      updated: dayjs(),
    }) as StorageNode
    td.when(api.moveStorageDir(d11.path, movedD12.path)).thenThrow(new Error())

    try {
      await storageLogic.moveDir(d11.path, movedD12.path)
    } catch (err) {}

    // ノード一覧に変化がないことを検証
    expect(storageLogic.nodes).toEqual([d1, d11])
  })
})

describe('moveFile', () => {
  it('ベーシックケース', async () => {
    storageStore.initState({ all: cloneDeep([d1, d11, f111, d12]) })

    const movedFileA = deepmerge(cloneDeep(f111), {
      dir: 'd1/d12',
      path: 'd1/d12/f111.txt',
      created: dayjs(),
      updated: dayjs(),
    }) as StorageNode
    td.when(api.moveStorageFile(f111.path, movedFileA.path)).thenResolve(movedFileA)

    const actual = await storageLogic.moveFile(f111.path, movedFileA.path)

    expect(actual).toEqual(movedFileA)
    expect(storageLogic.nodes).toEqual([d1, d11, d12, movedFileA])
  })

  it('APIでエラーが発生した場合', async () => {
    storageStore.initState({ all: cloneDeep([d1, d11, f111, d12]) })

    const movedFileA = deepmerge(cloneDeep(f111), {
      dir: 'd1/d12',
      path: 'd1/d12/f111.txt',
      created: dayjs(),
      updated: dayjs(),
    }) as StorageNode
    td.when(api.moveStorageFile(f111.path, movedFileA.path)).thenThrow(new Error())

    try {
      await storageLogic.moveFile(f111.path, movedFileA.path)
    } catch (err) {}

    // ノード一覧に変化がないことを検証
    expect(storageLogic.nodes).toEqual([d1, d11, f111, d12])
  })
})

describe('renameDir', () => {
  it('ベーシックケース', async () => {
    storageStore.initState({ all: cloneDeep([d1, d11, f111]) })

    const renamedX11 = deepmerge(cloneDeep(d11), {
      name: 'x11',
      path: 'd1/x11',
      created: dayjs(),
      updated: dayjs(),
    }) as StorageNode
    const renamedFileA = deepmerge(cloneDeep(f111), {
      dir: 'd1/x11',
      path: 'd1/x11/f111.txt',
      created: dayjs(),
      updated: dayjs(),
    }) as StorageNode
    td.when(api.renameStorageDir(d11.path, renamedX11.name)).thenResolve([renamedX11, renamedFileA])

    const actual = await storageLogic.renameDir(d11.path, renamedX11.name)

    expect(actual).toEqual([renamedX11, renamedFileA])
    expect(storageLogic.nodes).toEqual([d1, renamedX11, renamedFileA])
  })

  it('リネームノードの配下がストアに読み込まれていない場合', async () => {
    // リネームノード'd1/d11'の配下ノードがストアに読み込まれていない状態にする
    storageStore.initState({ all: cloneDeep([d1, d11]) })

    const renamedX11 = deepmerge(cloneDeep(d11), {
      name: 'x11',
      path: 'd1/x11',
      created: dayjs(),
      updated: dayjs(),
    }) as StorageNode
    const renamedFileA = deepmerge(cloneDeep(f111), {
      dir: 'd1/x11',
      path: 'd1/x11/f111.txt',
      created: dayjs(),
      updated: dayjs(),
    }) as StorageNode
    td.when(api.renameStorageDir(d11.path, renamedX11.name)).thenResolve([renamedX11, renamedFileA])

    const actual = await storageLogic.renameDir(d11.path, renamedX11.name)

    expect(actual).toEqual([renamedX11, renamedFileA])
    expect(storageLogic.nodes).toEqual([d1, renamedX11, renamedFileA])
  })

  it('APIでエラーが発生した場合', async () => {
    storageStore.initState({ all: cloneDeep([d1, d11]) })

    const renamedX11 = deepmerge(cloneDeep(d11), {
      name: 'x11',
      path: 'd1/x11',
      created: dayjs(),
      updated: dayjs(),
    }) as StorageNode
    td.when(api.renameStorageDir(d11.path, renamedX11.name)).thenThrow(new Error())

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

    const renamedFileX = deepmerge(cloneDeep(f111), {
      name: 'fileX.txt',
      path: 'd1/d11/fileX.txt',
      created: dayjs(),
      updated: dayjs(),
    }) as StorageNode
    td.when(api.renameStorageFile(f111.path, renamedFileX.name)).thenResolve(renamedFileX)

    const actual = await storageLogic.renameFile(f111.path, renamedFileX.name)

    expect(actual).toEqual(renamedFileX)
    expect(storageLogic.nodes).toEqual([d1, d11, renamedFileX])
  })

  it('APIでエラーが発生した場合', async () => {
    storageStore.initState({ all: cloneDeep([d1, d11, f111]) })

    const renamedFileX = deepmerge(cloneDeep(f111), {
      name: 'fileX.txt',
      path: 'd1/d11/fileX.txt',
      created: dayjs(),
      updated: dayjs(),
    }) as StorageNode
    td.when(api.renameStorageFile(f111.path, renamedFileX.name)).thenThrow(new Error())

    try {
      await storageLogic.renameFile(f111.path, renamedFileX.name)
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

    const updatedX11 = deepmerge(cloneDeep(d11), {
      share: NEW_SHARE_SETTINGS,
      created: dayjs(),
      updated: dayjs(),
    }) as StorageNode
    const updatedFileA = deepmerge(cloneDeep(f111), {
      share: NEW_SHARE_SETTINGS,
      created: dayjs(),
      updated: dayjs(),
    }) as StorageNode
    td.when(api.setStorageDirShareSettings(d11.path, NEW_SHARE_SETTINGS)).thenResolve([updatedX11, updatedFileA])

    const actual = await storageLogic.setDirShareSettings(d11.path, NEW_SHARE_SETTINGS)

    expect(actual).toEqual([updatedX11, updatedFileA])
    expect(storageLogic.nodes).toEqual([d1, updatedX11, updatedFileA])
  })

  it('共有設定ノードの配下がストアに読み込まれていない場合', async () => {
    // 共有設定ノード'd1/d11'の配下ノードがストアに読み込まれていない状態にする
    storageStore.initState({ all: cloneDeep([d1, d11]) })

    const updatedX11 = deepmerge(cloneDeep(d11), {
      share: NEW_SHARE_SETTINGS,
      created: dayjs(),
      updated: dayjs(),
    }) as StorageNode
    const updatedFileA = deepmerge(cloneDeep(f111), {
      share: NEW_SHARE_SETTINGS,
      created: dayjs(),
      updated: dayjs(),
    }) as StorageNode
    td.when(api.setStorageDirShareSettings(d11.path, NEW_SHARE_SETTINGS)).thenResolve([updatedX11, updatedFileA])

    const actual = await storageLogic.setDirShareSettings(d11.path, NEW_SHARE_SETTINGS)

    expect(actual).toEqual([updatedX11, updatedFileA])
    expect(storageLogic.nodes).toEqual([d1, updatedX11, updatedFileA])
  })

  it('APIでエラーが発生した場合', async () => {
    storageStore.initState({ all: cloneDeep([d1, d11]) })

    td.when(api.setStorageDirShareSettings(d11.path, NEW_SHARE_SETTINGS)).thenThrow(new Error())

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
    td.when(api.setStorageFileShareSettings(f111.path, NEW_SHARE_SETTINGS)).thenResolve(updatedFileA)

    const actual = await storageLogic.setFileShareSettings(f111.path, NEW_SHARE_SETTINGS)

    expect(actual).toEqual(updatedFileA)
    expect(storageLogic.nodes).toEqual([d1, d11, updatedFileA])
  })

  it('APIでエラーが発生した場合', async () => {
    storageStore.initState({ all: cloneDeep([d1, d11, f111]) })

    td.when(api.setStorageFileShareSettings(f111.path, NEW_SHARE_SETTINGS)).thenThrow(new Error())

    try {
      await storageLogic.setFileShareSettings(f111.path, NEW_SHARE_SETTINGS)
    } catch (err) {}

    // ノード一覧に変化がないことを検証
    expect(storageLogic.nodes).toEqual([d1, d11, f111])
  })
})
