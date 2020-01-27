import * as path from 'path'
import { TestLibAPIContainer } from '../../../../../mocks/lib/logic/api'
import { config } from '@/lib/config'
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
  describe('customToken', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(GENERAL_USER)

      const actual = await api.customToken()

      expect(isEmpty(actual)).toBeFalsy()
    })
  })
})

describe('Storage API', () => {
  let userStorageBasePath!: string

  beforeEach(async () => {
    userStorageBasePath = path.join(config.storage.usersDir, GENERAL_USER.myDirName)
    await Promise.all([api.removeTestStorageDir(TEST_FILES_DIR), api.removeTestStorageDir(userStorageBasePath)])
  })

  describe('userStorageDirNodes', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(GENERAL_USER)
      await api.uploadTestFiles([{ filePath: `${userStorageBasePath}/docs/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])

      const actual = await api.userStorageDirNodes('docs')

      expect(actual.length).toBe(2)
    })
  })

  describe('createUserStorageDirs', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(GENERAL_USER)

      const actual = await api.createUserStorageDirs([`dir1/dir1_1`])

      expect(actual.length).toBe(2)
      expect(actual[0].path).toBe(`dir1`)
      expect(actual[1].path).toBe(`dir1/dir1_1`)
    })
  })

  describe('removeUserStorageFiles', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(GENERAL_USER)
      await api.uploadTestFiles([
        { filePath: `${userStorageBasePath}/docs/fileA.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `${userStorageBasePath}/docs/fileB.txt`, fileData: 'test', contentType: 'text/plain' },
      ])

      const actual = await api.removeUserStorageFiles([`docs/fileA.txt`])

      expect(actual.length).toBe(1)
      expect(actual[0].path).toBe(`docs/fileA.txt`)
    })
  })

  describe('removeUserStorageDirs', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(GENERAL_USER)
      await api.uploadTestFiles([
        { filePath: `${userStorageBasePath}/docs/fileA.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `${userStorageBasePath}/docs/fileB.txt`, fileData: 'test', contentType: 'text/plain' },
      ])

      const actual = await api.removeUserStorageDirs([`docs`])

      expect(actual.length).toBe(2)
      expect(actual[0].path).toBe(`docs/fileA.txt`)
      expect(actual[1].path).toBe(`docs/fileB.txt`)
    })
  })

  describe('moveUserStorageDir', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(GENERAL_USER)
      await api.createUserStorageDirs([`dir1`])

      const actual = await api.moveUserStorageDir(`dir1`, `dir2`)

      expect(actual.length).toBe(1)
      expect(actual[0].path).toBe(`dir2`)
    })
  })

  describe('moveUserStorageFile', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(GENERAL_USER)
      await api.createUserStorageDirs([`dir1`, `dir2`])
      await api.uploadTestFiles([{ filePath: `${userStorageBasePath}/dir1/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])

      const actual = await api.moveUserStorageFile(`dir1/fileA.txt`, `dir2/fileA.txt`)

      expect(actual.path).toBe(`dir2/fileA.txt`)
    })
  })

  describe('renameUserStorageDir', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(GENERAL_USER)
      await api.createUserStorageDirs([`dir1`])

      const actual = await api.renameUserStorageDir(`dir1`, `dir2`)

      expect(actual.length).toBe(1)
      expect(actual[0].path).toBe(`dir2`)
    })
  })

  describe('renameUserStorageFile', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(GENERAL_USER)
      await api.createUserStorageDirs([`dir1`])
      await api.uploadTestFiles([{ filePath: `${userStorageBasePath}/dir1/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])

      const actual = await api.renameUserStorageFile(`dir1/fileA.txt`, `fileB.txt`)

      expect(actual.path).toBe(`dir1/fileB.txt`)
    })
  })

  describe('setUserStorageDirShareSettings', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(GENERAL_USER)
      await api.createUserStorageDirs([`dir1`])
      await api.uploadTestFiles([{ filePath: `${userStorageBasePath}/dir1/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])

      const actual = await api.setUserStorageDirShareSettings(`dir1`, { isPublic: true, uids: ['ichiro'] })

      expect(actual.length).toBe(2)
      expect(actual[0].path).toBe(`dir1`)
      expect(actual[1].path).toBe(`dir1/fileA.txt`)
    })
  })

  describe('setUserStorageFileShareSettings', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(GENERAL_USER)
      await api.createUserStorageDirs([`dir1`])
      await api.uploadTestFiles([{ filePath: `${userStorageBasePath}/dir1/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])

      const actual = await api.setUserStorageFileShareSettings(`dir1/fileA.txt`, { isPublic: true, uids: ['ichiro'] })

      expect(actual.path).toBe(`dir1/fileA.txt`)
    })
  })

  describe('storageDirNodes', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(APP_ADMIN_USER)
      await api.uploadTestFiles([{ filePath: `${TEST_FILES_DIR}/docs/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])

      const actual = await api.storageDirNodes(`${TEST_FILES_DIR}`)

      expect(actual.length).toBe(3)
    })
  })

  describe('createStorageDirs', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(APP_ADMIN_USER)

      const actual = await api.createStorageDirs([`${TEST_FILES_DIR}/dir1/dir1_1`])

      expect(actual.length).toBe(3)
      expect(actual[0].path).toBe(`${TEST_FILES_DIR}`)
      expect(actual[1].path).toBe(`${TEST_FILES_DIR}/dir1`)
      expect(actual[2].path).toBe(`${TEST_FILES_DIR}/dir1/dir1_1`)
    })
  })

  describe('removeStorageFiles', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(APP_ADMIN_USER)
      await api.uploadTestFiles([
        { filePath: `${TEST_FILES_DIR}/docs/fileA.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `${TEST_FILES_DIR}/docs/fileB.txt`, fileData: 'test', contentType: 'text/plain' },
      ])

      const actual = await api.removeStorageFiles([`${TEST_FILES_DIR}/docs/fileA.txt`])

      expect(actual.length).toBe(1)
      expect(actual[0].path).toBe(`${TEST_FILES_DIR}/docs/fileA.txt`)
    })
  })

  describe('removeStorageDirs', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(APP_ADMIN_USER)
      await api.uploadTestFiles([
        { filePath: `${TEST_FILES_DIR}/docs/fileA.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `${TEST_FILES_DIR}/docs/fileB.txt`, fileData: 'test', contentType: 'text/plain' },
      ])

      const actual = await api.removeStorageDirs([`${TEST_FILES_DIR}/docs`])

      expect(actual.length).toBe(2)
      expect(actual[0].path).toBe(`${TEST_FILES_DIR}/docs/fileA.txt`)
      expect(actual[1].path).toBe(`${TEST_FILES_DIR}/docs/fileB.txt`)
    })
  })

  describe('moveStorageDir', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(APP_ADMIN_USER)
      await api.createStorageDirs([`${TEST_FILES_DIR}/dir1`])

      const actual = await api.moveStorageDir(`${TEST_FILES_DIR}/dir1`, `${TEST_FILES_DIR}/dir2`)

      expect(actual.length).toBe(1)
      expect(actual[0].path).toBe(`${TEST_FILES_DIR}/dir2`)
    })
  })

  describe('moveStorageFile', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(APP_ADMIN_USER)
      await api.createStorageDirs([`${TEST_FILES_DIR}/dir1`, `${TEST_FILES_DIR}/dir2`])
      await api.uploadTestFiles([{ filePath: `${TEST_FILES_DIR}/dir1/fileA.txt`, fileData: 'test', contentType: `text/plain` }])

      const actual = await api.moveStorageFile(`${TEST_FILES_DIR}/dir1/fileA.txt`, `${TEST_FILES_DIR}/dir2/fileA.txt`)

      expect(actual.path).toBe(`${TEST_FILES_DIR}/dir2/fileA.txt`)
    })
  })

  describe('renameStorageDir', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(APP_ADMIN_USER)
      await api.createStorageDirs([`${TEST_FILES_DIR}/dir1`])

      const actual = await api.renameStorageDir(`${TEST_FILES_DIR}/dir1`, `dir2`)

      expect(actual.length).toBe(1)
      expect(actual[0].path).toBe(`${TEST_FILES_DIR}/dir2`)
    })
  })

  describe('renameStorageFile', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(APP_ADMIN_USER)
      await api.createStorageDirs([`${TEST_FILES_DIR}/dir1`])
      await api.uploadTestFiles([{ filePath: `${TEST_FILES_DIR}/dir1/fileA.txt`, fileData: 'test', contentType: `text/plain` }])

      const actual = await api.renameStorageFile(`${TEST_FILES_DIR}/dir1/fileA.txt`, `fileB.txt`)

      expect(actual.path).toBe(`${TEST_FILES_DIR}/dir1/fileB.txt`)
    })
  })

  describe('setStorageDirShareSettings', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(APP_ADMIN_USER)
      await api.createStorageDirs([`${TEST_FILES_DIR}/dir1`])
      await api.uploadTestFiles([{ filePath: `${TEST_FILES_DIR}/dir1/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])

      const actual = await api.setStorageDirShareSettings(`${TEST_FILES_DIR}/dir1`, { isPublic: true, uids: ['ichiro'] })

      expect(actual.length).toBe(2)
      expect(actual[0].path).toBe(`${TEST_FILES_DIR}/dir1`)
      expect(actual[1].path).toBe(`${TEST_FILES_DIR}/dir1/fileA.txt`)
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
