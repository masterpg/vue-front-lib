import { TestLibAPIContainer } from '../../../../../mocks/lib/logic/api'
import { initLibTest } from '../../../../../helpers/lib/init'
const isEmpty = require('lodash/isEmpty')

//========================================================================
//
//  Test data
//
//========================================================================

const GENERAL_USER = { uid: 'general.user', myDirName: 'general.user' }

const APP_ADMIN_USER = { uid: 'app.admin.user', myDirName: 'app.admin.user', isAppAdmin: true }

const TEST_FILES_DIR = 'test-files'

//========================================================================
//
//  Test helpers
//
//========================================================================

let api!: TestLibAPIContainer

function getAPIErrorResponse(error: any): { statusCode: number; error: string; message: string } {
  return error.graphQLErrors[0].extensions.exception.response
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  }) as Promise<void>
}

//========================================================================
//
//  Tests
//
//========================================================================

beforeAll(async () => {
  api = new TestLibAPIContainer()
  await initLibTest({ api })
})

beforeEach(async () => {
  api.clearTestAuthUser()
})

describe('App API', () => {
  describe('getCustomToken', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(GENERAL_USER)

      const actual = await api.getCustomToken()

      expect(isEmpty(actual)).toBeFalsy()
    })
  })
})

describe('Storage API', () => {
  let userStorageBasePath!: string

  beforeEach(async () => {
    await api.removeUserBaseTestDir(GENERAL_USER)
    await api.removeTestDir([TEST_FILES_DIR])

    // Cloud Storageで短い間隔のノード追加・削除を行うとエラーが発生するので間隔調整している
    await sleep(2500)
  })

  //--------------------------------------------------
  //  User
  //--------------------------------------------------

  describe('getUserStorageNode', () => {
    beforeEach(async () => {
      await api.uploadUserTestFiles(GENERAL_USER, [{ filePath: `d1/d11/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])
    })

    it('疎通確認 - 対象ノードあり', async () => {
      api.setTestAuthUser(GENERAL_USER)

      const actual = (await api.getUserStorageNode(`d1/d11`))!

      expect(actual.path).toBe(`d1/d11`)
    })

    it('疎通確認 - 対象ノードなし', async () => {
      api.setTestAuthUser(GENERAL_USER)

      const actual = (await api.getUserStorageNode(`d1/dXX`))!

      expect(actual).toBeUndefined()
    })
  })

  describe('getUserStorageDirDescendants', () => {
    beforeEach(async () => {
      await api.uploadUserTestFiles(GENERAL_USER, [
        { filePath: `d1/fileA.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `d1/d11/fileB.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `d1/d11/d111/fileC.txt`, fileData: 'test', contentType: 'text/plain' },
      ])
    })

    it('疎通確認 - ページングなし', async () => {
      api.setTestAuthUser(GENERAL_USER)

      const actual = await api.getUserStorageDirDescendants(null, `d1`)

      expect(actual.nextPageToken).toBeUndefined()
      expect(actual.list.length).toBe(6)
      expect(actual.list[0].path).toBe(`d1`)
      expect(actual.list[1].path).toBe(`d1/d11`)
      expect(actual.list[2].path).toBe(`d1/d11/d111`)
      expect(actual.list[3].path).toBe(`d1/d11/d111/fileC.txt`)
      expect(actual.list[4].path).toBe(`d1/d11/fileB.txt`)
      expect(actual.list[5].path).toBe(`d1/fileA.txt`)
    })

    it('疎通確認 - ページングあり', async () => {
      api.setTestAuthUser(GENERAL_USER)

      const actual = await api.getUserStorageDirDescendants({ maxResults: 2 }, `d1`)

      expect(actual.nextPageToken!.length).toBeGreaterThan(0)
      expect(actual.list.length).toBeLessThanOrEqual(2)
    })
  })

  describe('getUserStorageDescendants', () => {
    beforeEach(async () => {
      await api.uploadUserTestFiles(GENERAL_USER, [
        { filePath: `d1/fileA.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `d1/d11/fileB.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `d1/d11/d111/fileC.txt`, fileData: 'test', contentType: 'text/plain' },
      ])
    })

    it('疎通確認 - ページングなし', async () => {
      api.setTestAuthUser(GENERAL_USER)

      const actual = await api.getUserStorageDescendants(null, `d1`)

      expect(actual.nextPageToken).toBeUndefined()
      expect(actual.list.length).toBe(5)
      expect(actual.list[0].path).toBe(`d1/d11`)
      expect(actual.list[1].path).toBe(`d1/d11/d111`)
      expect(actual.list[2].path).toBe(`d1/d11/d111/fileC.txt`)
      expect(actual.list[3].path).toBe(`d1/d11/fileB.txt`)
      expect(actual.list[4].path).toBe(`d1/fileA.txt`)
    })

    it('疎通確認 - ページングあり', async () => {
      api.setTestAuthUser(GENERAL_USER)

      const actual = await api.getUserStorageDescendants({ maxResults: 2 }, `d1`)

      expect(actual.nextPageToken!.length).toBeGreaterThan(0)
      expect(actual.list.length).toBeLessThanOrEqual(2)
    })
  })

  describe('getUserStorageDirChildren', () => {
    beforeEach(async () => {
      await api.uploadUserTestFiles(GENERAL_USER, [
        { filePath: `d1/fileA.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `d1/fileB.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `d1/d11/fileC.txt`, fileData: 'test', contentType: 'text/plain' },
      ])
    })

    it('疎通確認 - ページングなし', async () => {
      api.setTestAuthUser(GENERAL_USER)

      const actual = await api.getUserStorageDirChildren(null, `d1`)

      expect(actual.nextPageToken).toBeUndefined()
      expect(actual.list.length).toBe(4)
      expect(actual.list[0].path).toBe(`d1`)
      expect(actual.list[1].path).toBe(`d1/d11`)
      expect(actual.list[2].path).toBe(`d1/fileA.txt`)
      expect(actual.list[3].path).toBe(`d1/fileB.txt`)
    })

    it('疎通確認 - ページングあり', async () => {
      api.setTestAuthUser(GENERAL_USER)

      const actual = await api.getUserStorageDirChildren({ maxResults: 2 }, `d1`)

      expect(actual.nextPageToken!.length).toBeGreaterThan(0)
      expect(actual.list.length).toBeLessThanOrEqual(2)
    })
  })

  describe('getUserStorageChildren', () => {
    beforeEach(async () => {
      await api.uploadUserTestFiles(GENERAL_USER, [
        { filePath: `d1/fileA.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `d1/fileB.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `d1/d11/fileC.txt`, fileData: 'test', contentType: 'text/plain' },
      ])
    })

    it('疎通確認 - ページングなし', async () => {
      api.setTestAuthUser(GENERAL_USER)

      const actual = await api.getUserStorageChildren(null, `d1`)

      expect(actual.nextPageToken).toBeUndefined()
      expect(actual.list.length).toBe(3)
      expect(actual.list[0].path).toBe(`d1/d11`)
      expect(actual.list[1].path).toBe(`d1/fileA.txt`)
      expect(actual.list[2].path).toBe(`d1/fileB.txt`)
    })

    it('疎通確認 - ページングあり', async () => {
      api.setTestAuthUser(GENERAL_USER)

      const actual = await api.getUserStorageChildren({ maxResults: 2 }, `d1`)

      expect(actual.nextPageToken!.length).toBeGreaterThan(0)
      expect(actual.list.length).toBeLessThanOrEqual(2)
    })
  })

  describe('getUserStorageHierarchicalNode', () => {
    beforeEach(async () => {
      await api.uploadUserTestFiles(GENERAL_USER, [{ filePath: `d1/d11/d111/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])
    })

    it('疎通確認', async () => {
      api.setTestAuthUser(GENERAL_USER)

      const actual = await api.getUserStorageHierarchicalNode(`d1/d11/d111/fileA.txt`)

      expect(actual.length).toBe(4)
      expect(actual[0].path).toBe(`d1`)
      expect(actual[1].path).toBe(`d1/d11`)
      expect(actual[2].path).toBe(`d1/d11/d111`)
      expect(actual[3].path).toBe(`d1/d11/d111/fileA.txt`)
    })
  })

  describe('getUserStorageAncestorDirs', () => {
    beforeEach(async () => {
      await api.uploadUserTestFiles(GENERAL_USER, [{ filePath: `d1/d11/d111/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])
    })

    it('疎通確認', async () => {
      api.setTestAuthUser(GENERAL_USER)

      const actual = await api.getUserStorageAncestorDirs(`d1/d11/d111/fileA.txt`)

      expect(actual.length).toBe(3)
      expect(actual[0].path).toBe(`d1`)
      expect(actual[1].path).toBe(`d1/d11`)
      expect(actual[2].path).toBe(`d1/d11/d111`)
    })
  })

  describe('handleUploadedUserFiles', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(GENERAL_USER)

      await api.createUserStorageDirs([`docs`])
      await api.uploadUserTestFiles(GENERAL_USER, [{ filePath: `docs/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])

      await api.handleUploadedUserFiles([`docs/fileA.txt`])
    })
  })

  describe('createUserStorageDirs', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(GENERAL_USER)

      const actual = await api.createUserStorageDirs([`d1/d11`])

      expect(actual.length).toBe(2)
      expect(actual[0].path).toBe(`d1`)
      expect(actual[1].path).toBe(`d1/d11`)
    })
  })

  describe('removeUserStorageDirs', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(GENERAL_USER)

      await api.uploadUserTestFiles(GENERAL_USER, [
        { filePath: `d1/fileA.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `d1/fileB.txt`, fileData: 'test', contentType: 'text/plain' },
      ])

      await api.removeUserStorageDirs([`d1`])
      const actual = (await api.getUserStorageDirChildren(null, `d1`)).list

      expect(actual.length).toBe(0)
    })
  })

  describe('removeUserStorageFiles', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(GENERAL_USER)

      await api.uploadUserTestFiles(GENERAL_USER, [
        { filePath: `d1/fileA.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `d1/fileB.txt`, fileData: 'test', contentType: 'text/plain' },
      ])

      await api.removeUserStorageFiles([`d1/fileA.txt`])
      const actual = (await api.getUserStorageDirChildren(null, `d1`)).list

      expect(actual.length).toBe(2)
      expect(actual[0].path).toBe(`d1`)
      expect(actual[1].path).toBe(`d1/fileB.txt`)
    })
  })

  describe('moveUserStorageDir', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(GENERAL_USER)

      await api.createUserStorageDirs([`d1`, `d2`])

      await api.moveUserStorageDir(`d1`, `d2/d1`)
      const actual = (await api.getUserStorageDescendants(null)).list

      expect(actual.length).toBe(2)
      expect(actual[0].path).toBe(`d2`)
      expect(actual[1].path).toBe(`d2/d1`)
    })
  })

  describe('moveUserStorageFile', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(GENERAL_USER)

      await api.createUserStorageDirs([`d1`, `d2`])
      await api.uploadUserTestFiles(GENERAL_USER, [{ filePath: `d1/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])

      await api.moveUserStorageFile(`d1/fileA.txt`, `d2/fileA.txt`)
      const actual = (await api.getUserStorageDescendants(null)).list

      expect(actual.length).toBe(3)
      expect(actual[0].path).toBe(`d1`)
      expect(actual[1].path).toBe(`d2`)
      expect(actual[2].path).toBe(`d2/fileA.txt`)
    })
  })

  describe('renameUserStorageDir', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(GENERAL_USER)

      await api.createUserStorageDirs([`d1`])

      await api.renameUserStorageDir(`d1`, `d2`)
      const actual = (await api.getUserStorageDescendants(null)).list

      expect(actual.length).toBe(1)
      expect(actual[0].path).toBe(`d2`)
    })
  })

  describe('renameUserStorageFile', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(GENERAL_USER)

      await api.createUserStorageDirs([`d1`])
      await api.uploadUserTestFiles(GENERAL_USER, [{ filePath: `d1/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])

      await api.renameUserStorageFile(`d1/fileA.txt`, `fileB.txt`)
      const actual = (await api.getUserStorageDescendants(null)).list

      expect(actual.length).toBe(2)
      expect(actual[0].path).toBe(`d1`)
      expect(actual[1].path).toBe(`d1/fileB.txt`)
    })
  })

  describe('setUserStorageDirShareSettings', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(GENERAL_USER)

      await api.createUserStorageDirs([`d1`])
      await api.uploadUserTestFiles(GENERAL_USER, [{ filePath: `d1/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])

      const actual = await api.setUserStorageDirShareSettings(`d1`, { isPublic: true, uids: ['ichiro'] })

      expect(actual.path).toBe(`d1`)
      expect(actual.share).toMatchObject({ isPublic: true, uids: ['ichiro'] })
    })
  })

  describe('setUserStorageFileShareSettings', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(GENERAL_USER)

      await api.createUserStorageDirs([`d1`])
      await api.uploadUserTestFiles(GENERAL_USER, [{ filePath: `d1/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])

      const actual = await api.setUserStorageFileShareSettings(`d1/fileA.txt`, { isPublic: true, uids: ['ichiro'] })

      expect(actual.path).toBe(`d1/fileA.txt`)
    })
  })

  //--------------------------------------------------
  //  Application
  //--------------------------------------------------

  describe('getStorageNode', () => {
    beforeEach(async () => {
      await api.uploadTestFiles([{ filePath: `${TEST_FILES_DIR}/d1/d11/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])
    })

    it('疎通確認 - 対象ノードあり', async () => {
      api.setTestAuthUser(APP_ADMIN_USER)

      const actual = (await api.getStorageNode(`${TEST_FILES_DIR}/d1/d11`))!

      expect(actual.path).toBe(`${TEST_FILES_DIR}/d1/d11`)
    })

    it('疎通確認 - 対象ノードなし', async () => {
      api.setTestAuthUser(APP_ADMIN_USER)

      const actual = (await api.getStorageNode(`${TEST_FILES_DIR}/d1/dXX`))!

      expect(actual).toBeUndefined()
    })
  })

  describe('getStorageDirDescendants', () => {
    beforeEach(async () => {
      await api.uploadTestFiles([
        { filePath: `${TEST_FILES_DIR}/d1/fileA.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `${TEST_FILES_DIR}/d1/d11/fileB.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `${TEST_FILES_DIR}/d1/d11/d111/fileC.txt`, fileData: 'test', contentType: 'text/plain' },
      ])
    })

    it('疎通確認 - ページングなし', async () => {
      expect(true).toBe(true)

      api.setTestAuthUser(APP_ADMIN_USER)

      const actual = await api.getStorageDirDescendants(null, `${TEST_FILES_DIR}/d1`)

      expect(actual.nextPageToken).toBeUndefined()
      expect(actual.list.length).toBe(6)
      expect(actual.list[0].path).toBe(`${TEST_FILES_DIR}/d1`)
      expect(actual.list[1].path).toBe(`${TEST_FILES_DIR}/d1/d11`)
      expect(actual.list[2].path).toBe(`${TEST_FILES_DIR}/d1/d11/d111`)
      expect(actual.list[3].path).toBe(`${TEST_FILES_DIR}/d1/d11/d111/fileC.txt`)
      expect(actual.list[4].path).toBe(`${TEST_FILES_DIR}/d1/d11/fileB.txt`)
      expect(actual.list[5].path).toBe(`${TEST_FILES_DIR}/d1/fileA.txt`)
    })

    it('疎通確認 - ページングあり', async () => {
      api.setTestAuthUser(APP_ADMIN_USER)

      const actual = await api.getStorageDirDescendants({ maxResults: 2 }, `${TEST_FILES_DIR}/d1`)

      expect(actual.nextPageToken!.length).toBeGreaterThan(0)
      expect(actual.list.length).toBeLessThanOrEqual(2)
    })
  })

  describe('getStorageDescendants', () => {
    beforeEach(async () => {
      await api.uploadTestFiles([
        { filePath: `${TEST_FILES_DIR}/d1/fileA.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `${TEST_FILES_DIR}/d1/d11/fileB.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `${TEST_FILES_DIR}/d1/d11/d111/fileC.txt`, fileData: 'test', contentType: 'text/plain' },
      ])
    })

    it('疎通確認 - ページングなし', async () => {
      api.setTestAuthUser(APP_ADMIN_USER)

      const actual = await api.getStorageDescendants(null, `${TEST_FILES_DIR}/d1`)

      expect(actual.nextPageToken).toBeUndefined()
      expect(actual.list.length).toBe(5)
      expect(actual.list[0].path).toBe(`${TEST_FILES_DIR}/d1/d11`)
      expect(actual.list[1].path).toBe(`${TEST_FILES_DIR}/d1/d11/d111`)
      expect(actual.list[2].path).toBe(`${TEST_FILES_DIR}/d1/d11/d111/fileC.txt`)
      expect(actual.list[3].path).toBe(`${TEST_FILES_DIR}/d1/d11/fileB.txt`)
      expect(actual.list[4].path).toBe(`${TEST_FILES_DIR}/d1/fileA.txt`)
    })

    it('疎通確認 - ページングあり', async () => {
      api.setTestAuthUser(APP_ADMIN_USER)

      const actual = await api.getStorageDescendants({ maxResults: 2 }, `${TEST_FILES_DIR}/d1`)

      expect(actual.nextPageToken!.length).toBeGreaterThan(0)
      expect(actual.list.length).toBeLessThanOrEqual(2)
    })
  })

  describe('getStorageDirChildren', () => {
    beforeEach(async () => {
      await api.uploadTestFiles([
        { filePath: `${TEST_FILES_DIR}/d1/fileA.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `${TEST_FILES_DIR}/d1/fileB.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `${TEST_FILES_DIR}/d1/d11/fileC.txt`, fileData: 'test', contentType: 'text/plain' },
      ])
    })

    it('疎通確認 - ページングなし', async () => {
      api.setTestAuthUser(APP_ADMIN_USER)

      const actual = await api.getStorageDirChildren(null, `${TEST_FILES_DIR}/d1`)

      expect(actual.nextPageToken).toBeUndefined()
      expect(actual.list.length).toBe(4)
      expect(actual.list[0].path).toBe(`${TEST_FILES_DIR}/d1`)
      expect(actual.list[1].path).toBe(`${TEST_FILES_DIR}/d1/d11`)
      expect(actual.list[2].path).toBe(`${TEST_FILES_DIR}/d1/fileA.txt`)
      expect(actual.list[3].path).toBe(`${TEST_FILES_DIR}/d1/fileB.txt`)
    })

    it('疎通確認 - ページングあり', async () => {
      api.setTestAuthUser(APP_ADMIN_USER)

      const actual = await api.getStorageDirChildren({ maxResults: 2 }, `${TEST_FILES_DIR}/d1`)

      expect(actual.nextPageToken!.length).toBeGreaterThan(0)
      expect(actual.list.length).toBeLessThanOrEqual(2)
    })
  })

  describe('getStorageChildren', () => {
    beforeEach(async () => {
      await api.uploadTestFiles([
        { filePath: `${TEST_FILES_DIR}/d1/fileA.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `${TEST_FILES_DIR}/d1/fileB.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `${TEST_FILES_DIR}/d1/d11/fileC.txt`, fileData: 'test', contentType: 'text/plain' },
      ])
    })

    it('疎通確認 - ページングなし', async () => {
      api.setTestAuthUser(APP_ADMIN_USER)

      const actual = await api.getStorageChildren(null, `${TEST_FILES_DIR}/d1`)

      expect(actual.nextPageToken).toBeUndefined()
      expect(actual.list.length).toBe(3)
      expect(actual.list[0].path).toBe(`${TEST_FILES_DIR}/d1/d11`)
      expect(actual.list[1].path).toBe(`${TEST_FILES_DIR}/d1/fileA.txt`)
      expect(actual.list[2].path).toBe(`${TEST_FILES_DIR}/d1/fileB.txt`)
    })

    it('疎通確認 - ページングあり', async () => {
      api.setTestAuthUser(APP_ADMIN_USER)

      const actual = await api.getStorageChildren({ maxResults: 2 }, `${TEST_FILES_DIR}/d1`)

      expect(actual.nextPageToken!.length).toBeGreaterThan(0)
      expect(actual.list.length).toBeLessThanOrEqual(2)
    })
  })

  describe('getStorageHierarchicalNode', () => {
    beforeEach(async () => {
      await api.uploadTestFiles([{ filePath: `${TEST_FILES_DIR}/d1/d11/d111/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])
    })

    it('疎通確認', async () => {
      api.setTestAuthUser(APP_ADMIN_USER)

      const actual = await api.getStorageHierarchicalNode(`${TEST_FILES_DIR}/d1/d11/d111/fileA.txt`)

      expect(actual.length).toBe(5)
      expect(actual[0].path).toBe(`${TEST_FILES_DIR}`)
      expect(actual[1].path).toBe(`${TEST_FILES_DIR}/d1`)
      expect(actual[2].path).toBe(`${TEST_FILES_DIR}/d1/d11`)
      expect(actual[3].path).toBe(`${TEST_FILES_DIR}/d1/d11/d111`)
      expect(actual[4].path).toBe(`${TEST_FILES_DIR}/d1/d11/d111/fileA.txt`)
    })
  })

  describe('getStorageAncestorDirs', () => {
    beforeEach(async () => {
      await api.uploadTestFiles([{ filePath: `${TEST_FILES_DIR}/d1/d11/d111/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])
    })

    it('疎通確認', async () => {
      api.setTestAuthUser(APP_ADMIN_USER)

      const actual = await api.getStorageAncestorDirs(`${TEST_FILES_DIR}/d1/d11/d111/fileA.txt`)

      expect(actual.length).toBe(4)
      expect(actual[0].path).toBe(`${TEST_FILES_DIR}`)
      expect(actual[1].path).toBe(`${TEST_FILES_DIR}/d1`)
      expect(actual[2].path).toBe(`${TEST_FILES_DIR}/d1/d11`)
      expect(actual[3].path).toBe(`${TEST_FILES_DIR}/d1/d11/d111`)
    })
  })

  describe('handleUploadedFiles', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(APP_ADMIN_USER)
      await api.createStorageDirs([`${TEST_FILES_DIR}/docs`])
      await api.uploadTestFiles([{ filePath: `${TEST_FILES_DIR}/docs/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])

      await api.handleUploadedFiles([`${TEST_FILES_DIR}/docs/fileA.txt`])
    })
  })

  describe('createStorageDirs', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(APP_ADMIN_USER)

      const actual = await api.createStorageDirs([`${TEST_FILES_DIR}/d1/d11`])

      expect(actual.length).toBe(3)
      expect(actual[0].path).toBe(`${TEST_FILES_DIR}`)
      expect(actual[1].path).toBe(`${TEST_FILES_DIR}/d1`)
      expect(actual[2].path).toBe(`${TEST_FILES_DIR}/d1/d11`)
    })
  })

  describe('removeStorageDirs', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(APP_ADMIN_USER)

      await api.uploadTestFiles([
        { filePath: `${TEST_FILES_DIR}/d1/fileA.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `${TEST_FILES_DIR}/d1/fileB.txt`, fileData: 'test', contentType: 'text/plain' },
      ])

      await api.removeStorageDirs([`${TEST_FILES_DIR}/d1`])
      const actual = (await api.getStorageDirChildren(null, `${TEST_FILES_DIR}/d1`)).list

      expect(actual.length).toBe(0)
    })
  })

  describe('removeStorageFiles', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(APP_ADMIN_USER)

      await api.uploadTestFiles([
        { filePath: `${TEST_FILES_DIR}/d1/fileA.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `${TEST_FILES_DIR}/d1/fileB.txt`, fileData: 'test', contentType: 'text/plain' },
      ])

      await api.removeStorageFiles([`${TEST_FILES_DIR}/d1/fileA.txt`])
      const actual = (await api.getStorageDirChildren(null, `${TEST_FILES_DIR}/d1`)).list

      expect(actual.length).toBe(2)
      expect(actual[0].path).toBe(`${TEST_FILES_DIR}/d1`)
      expect(actual[1].path).toBe(`${TEST_FILES_DIR}/d1/fileB.txt`)
    })
  })

  describe('moveStorageDir', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(APP_ADMIN_USER)

      await api.createStorageDirs([`${TEST_FILES_DIR}/d1`, `${TEST_FILES_DIR}/d2`])

      await api.moveStorageDir(`${TEST_FILES_DIR}/d1`, `${TEST_FILES_DIR}/d2/d1`)
      const actual = (await api.getStorageDescendants(null, `${TEST_FILES_DIR}`)).list

      expect(actual.length).toBe(2)
      expect(actual[0].path).toBe(`${TEST_FILES_DIR}/d2`)
      expect(actual[1].path).toBe(`${TEST_FILES_DIR}/d2/d1`)
    })
  })

  describe('moveStorageFile', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(APP_ADMIN_USER)

      await api.createStorageDirs([`${TEST_FILES_DIR}/d1`, `${TEST_FILES_DIR}/d2`])
      await api.uploadTestFiles([{ filePath: `${TEST_FILES_DIR}/d1/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])

      await api.moveStorageFile(`${TEST_FILES_DIR}/d1/fileA.txt`, `${TEST_FILES_DIR}/d2/fileA.txt`)
      const actual = (await api.getStorageDescendants(null, `${TEST_FILES_DIR}`)).list

      expect(actual.length).toBe(3)
      expect(actual[0].path).toBe(`${TEST_FILES_DIR}/d1`)
      expect(actual[1].path).toBe(`${TEST_FILES_DIR}/d2`)
      expect(actual[2].path).toBe(`${TEST_FILES_DIR}/d2/fileA.txt`)
    })
  })

  describe('renameStorageDir', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(APP_ADMIN_USER)

      await api.createStorageDirs([`${TEST_FILES_DIR}/d1`])

      await api.renameStorageDir(`${TEST_FILES_DIR}/d1`, `d2`)
      const actual = (await api.getStorageDescendants(null, `${TEST_FILES_DIR}`)).list

      expect(actual.length).toBe(1)
      expect(actual[0].path).toBe(`${TEST_FILES_DIR}/d2`)
    })
  })

  describe('renameStorageFile', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(APP_ADMIN_USER)

      await api.createStorageDirs([`${TEST_FILES_DIR}/d1`])
      await api.uploadTestFiles([{ filePath: `${TEST_FILES_DIR}/d1/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])

      await api.renameStorageFile(`${TEST_FILES_DIR}/d1/fileA.txt`, `fileB.txt`)
      const actual = (await api.getStorageDescendants(null, `${TEST_FILES_DIR}`)).list

      expect(actual.length).toBe(2)
      expect(actual[0].path).toBe(`${TEST_FILES_DIR}/d1`)
      expect(actual[1].path).toBe(`${TEST_FILES_DIR}/d1/fileB.txt`)
    })
  })

  describe('setStorageDirShareSettings', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(APP_ADMIN_USER)
      await api.createStorageDirs([`${TEST_FILES_DIR}/dir1`])
      await api.uploadTestFiles([{ filePath: `${TEST_FILES_DIR}/dir1/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])

      const actual = await api.setStorageDirShareSettings(`${TEST_FILES_DIR}/dir1`, { isPublic: true, uids: ['ichiro'] })

      expect(actual.path).toBe(`${TEST_FILES_DIR}/dir1`)
      expect(actual.share).toMatchObject({ isPublic: true, uids: ['ichiro'] })
    })
  })

  describe('setStorageFileShareSettings', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(APP_ADMIN_USER)
      await api.createStorageDirs([`${TEST_FILES_DIR}/dir1`])
      await api.uploadTestFiles([{ filePath: `${TEST_FILES_DIR}/dir1/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])

      const actual = await api.setStorageFileShareSettings(`${TEST_FILES_DIR}/dir1/fileA.txt`, { isPublic: true, uids: ['ichiro'] })

      expect(actual.path).toBe(`${TEST_FILES_DIR}/dir1/fileA.txt`)
    })
  })
})
