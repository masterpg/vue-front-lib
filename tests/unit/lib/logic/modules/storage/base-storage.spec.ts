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
import { BaseStorageLogic } from '@/lib/logic/modules/storage/base-storage'
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

  protected storageDirNodes(dirPath?: string): Promise<StorageNode[]> {
    return api.storageDirNodes(dirPath)
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

describe('pullNodes', () => {
  it(`'dirPath'を指定しなかった場合`, async () => {
    td.when(api.storageDirNodes(undefined)).thenResolve(STORAGE_NODES)

    await storageLogic.pullNodes()

    expect(storageLogic.nodes).toEqual(STORAGE_NODES)
  })

  it(`'dirPath'を指定した場合`, async () => {
    storageStore.initState({ all: cloneDeep([d1]) })
    td.when(api.storageDirNodes(d11.path)).thenResolve([d11, fileA])

    await storageLogic.pullNodes(d11.path)

    expect(storageLogic.nodes).toEqual([d1, d11, fileA])
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
    storageStore.initState({ all: cloneDeep([d1, d11, fileA, d12]) })
    td.when(api.removeStorageDirs([d11.path, d12.path])).thenResolve([d11, fileA, d12])

    const actual = await storageLogic.removeDirs([d11.path, d12.path])

    expect(actual).toEqual([d11, fileA, d12])
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
    storageStore.initState({ all: cloneDeep([d1, d11, fileA, fileC]) })
    td.when(api.removeStorageFiles([fileA.path, fileC.path])).thenResolve([fileA, fileC])

    const actual = await storageLogic.removeFiles([fileA.path, fileC.path])

    expect(actual).toEqual([fileA, fileC])
    expect(storageLogic.nodes).toEqual([d1, d11])
  })

  it('存在しないファイルパスを指定した場合', async () => {
    storageStore.initState({ all: cloneDeep([d1, d11]) })
    td.when(api.removeStorageFiles([fileA.path])).thenResolve([])

    const actual = await storageLogic.removeFiles([fileA.path])

    expect(actual).toEqual([])
    expect(storageLogic.nodes).toEqual([d1, d11])
  })

  it('APIでエラーが発生した場合', async () => {
    storageStore.initState({ all: cloneDeep([fileC]) })
    td.when(api.removeStorageFiles([fileC.path])).thenThrow(new Error())

    try {
      await storageLogic.removeFiles([fileC.path])
    } catch (err) {}

    // ノード一覧に変化がないことを検証
    expect(storageLogic.nodes).toEqual([fileC])
  })
})

describe('moveDir', () => {
  it('ベーシックケース', async () => {
    storageStore.initState({ all: cloneDeep([d1, d11, fileA]) })

    const movedD12 = deepmerge(cloneDeep(d11), {
      name: 'd12',
      dir: 'd1',
      path: 'd1/d12',
      created: dayjs(),
      updated: dayjs(),
    }) as StorageNode
    const movedFileA = deepmerge(cloneDeep(fileA), {
      dir: 'd1/d12',
      path: 'd1/d12/fileA.txt',
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
    storageStore.initState({ all: cloneDeep([d1, d11, fileA, d12]) })

    const movedFileA = deepmerge(cloneDeep(fileA), {
      dir: 'd1/d12',
      path: 'd1/d12/fileA.txt',
      created: dayjs(),
      updated: dayjs(),
    }) as StorageNode
    td.when(api.moveStorageFile(fileA.path, movedFileA.path)).thenResolve(movedFileA)

    const actual = await storageLogic.moveFile(fileA.path, movedFileA.path)

    expect(actual).toEqual(movedFileA)
    expect(storageLogic.nodes).toEqual([d1, d11, d12, movedFileA])
  })

  it('APIでエラーが発生した場合', async () => {
    storageStore.initState({ all: cloneDeep([d1, d11, fileA, d12]) })

    const movedFileA = deepmerge(cloneDeep(fileA), {
      dir: 'd1/d12',
      path: 'd1/d12/fileA.txt',
      created: dayjs(),
      updated: dayjs(),
    }) as StorageNode
    td.when(api.moveStorageFile(fileA.path, movedFileA.path)).thenThrow(new Error())

    try {
      await storageLogic.moveFile(fileA.path, movedFileA.path)
    } catch (err) {}

    // ノード一覧に変化がないことを検証
    expect(storageLogic.nodes).toEqual([d1, d11, fileA, d12])
  })
})

describe('renameDir', () => {
  it('ベーシックケース', async () => {
    storageStore.initState({ all: cloneDeep([d1, d11, fileA]) })

    const renamedX11 = deepmerge(cloneDeep(d11), {
      name: 'x11',
      path: 'd1/x11',
      created: dayjs(),
      updated: dayjs(),
    }) as StorageNode
    const renamedFileA = deepmerge(cloneDeep(fileA), {
      dir: 'd1/x11',
      path: 'd1/x11/fileA.txt',
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
    storageStore.initState({ all: cloneDeep([d1, d11, fileA]) })

    const renamedFileX = deepmerge(cloneDeep(fileA), {
      name: 'fileX.txt',
      path: 'd1/d11/fileX.txt',
      created: dayjs(),
      updated: dayjs(),
    }) as StorageNode
    td.when(api.renameStorageFile(fileA.path, renamedFileX.name)).thenResolve(renamedFileX)

    const actual = await storageLogic.renameFile(fileA.path, renamedFileX.name)

    expect(actual).toEqual(renamedFileX)
    expect(storageLogic.nodes).toEqual([d1, d11, renamedFileX])
  })

  it('APIでエラーが発生した場合', async () => {
    storageStore.initState({ all: cloneDeep([d1, d11, fileA]) })

    const renamedFileX = deepmerge(cloneDeep(fileA), {
      name: 'fileX.txt',
      path: 'd1/d11/fileX.txt',
      created: dayjs(),
      updated: dayjs(),
    }) as StorageNode
    td.when(api.renameStorageFile(fileA.path, renamedFileX.name)).thenThrow(new Error())

    try {
      await storageLogic.renameFile(fileA.path, renamedFileX.name)
    } catch (err) {}

    // ノード一覧に変化がないことを検証
    expect(storageLogic.nodes).toEqual([d1, d11, fileA])
  })
})

describe('setDirShareSettings', () => {
  const NEW_SHARE_SETTINGS: StorageNodeShareSettings = {
    isPublic: true,
    uids: ['ichiro'],
  }

  it('ベーシックケース', async () => {
    storageStore.initState({ all: cloneDeep([d1, d11, fileA]) })

    const updatedX11 = deepmerge(cloneDeep(d11), {
      share: NEW_SHARE_SETTINGS,
      created: dayjs(),
      updated: dayjs(),
    }) as StorageNode
    const updatedFileA = deepmerge(cloneDeep(fileA), {
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
    storageStore.initState({ all: cloneDeep([d1, d11, fileA]) })

    const updatedFileA = deepmerge(cloneDeep(fileA), {
      share: NEW_SHARE_SETTINGS,
      created: dayjs(),
      updated: dayjs(),
    }) as StorageNode
    td.when(api.setStorageFileShareSettings(fileA.path, NEW_SHARE_SETTINGS)).thenResolve(updatedFileA)

    const actual = await storageLogic.setFileShareSettings(fileA.path, NEW_SHARE_SETTINGS)

    expect(actual).toEqual(updatedFileA)
    expect(storageLogic.nodes).toEqual([d1, d11, updatedFileA])
  })

  it('APIでエラーが発生した場合', async () => {
    storageStore.initState({ all: cloneDeep([d1, d11, fileA]) })

    td.when(api.setStorageFileShareSettings(fileA.path, NEW_SHARE_SETTINGS)).thenThrow(new Error())

    try {
      await storageLogic.setFileShareSettings(fileA.path, NEW_SHARE_SETTINGS)
    } catch (err) {}

    // ノード一覧に変化がないことを検証
    expect(storageLogic.nodes).toEqual([d1, d11, fileA])
  })
})
