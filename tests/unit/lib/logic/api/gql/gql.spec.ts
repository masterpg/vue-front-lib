import * as path from 'path'
import { api } from '../../../../../mocks/common/logic/api'
import { config } from '@/lib/config'
import { initLibTest } from '../../../../../helpers/lib/init'
const isEmpty = require('lodash/isEmpty')

//========================================================================
//
//  Test data
//
//========================================================================

const GENERAL_USER = { uid: 'yamada.one', storageDir: 'yamada.one' }

const TEST_FILES_DIR = 'test-files'

//========================================================================
//
//  Test helpers
//
//========================================================================

function getAPIErrorResponse(error: any): { statusCode: number; error: string; message: string } {
  return error.graphQLErrors[0].extensions.exception.response
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
    userStorageBasePath = path.join(config.storage.usersDir, GENERAL_USER.storageDir)
    await Promise.all([api.removeTestStorageDir(TEST_FILES_DIR), api.removeTestStorageDir(userStorageBasePath)])
  })

  describe('userStorageDirNodes', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(GENERAL_USER)
      await api.uploadTestFiles([{ filePath: `${userStorageBasePath}/docs/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])

      const actual = await api.userStorageDirNodes()

      expect(actual.length).toBe(2)
    })
  })

  describe('createUserStorageDirs', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(GENERAL_USER)

      const actual = await api.createUserStorageDirs(['dir1/dir1_1'])

      expect(actual.length).toBe(2)
      expect(actual[0].path).toBe('dir1')
      expect(actual[1].path).toBe('dir1/dir1_1')
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
      await api.createUserStorageDirs(['dir1'])

      const actual = await api.moveUserStorageDir('dir1', 'dir2')

      expect(actual.length).toBe(1)
      expect(actual[0].path).toBe('dir2')
    })
  })

  describe('moveUserStorageFile', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(GENERAL_USER)
      await api.createUserStorageDirs(['dir1', 'dir2'])
      await api.uploadTestFiles([{ filePath: `${userStorageBasePath}/dir1/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])

      const actual = await api.moveUserStorageFile('dir1/fileA.txt', 'dir2/fileA.txt')

      expect(actual.path).toBe('dir2/fileA.txt')
    })
  })

  describe('renameUserStorageDir', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(GENERAL_USER)
      await api.createUserStorageDirs(['dir1'])

      const actual = await api.renameUserStorageDir('dir1', 'dir2')

      expect(actual.length).toBe(1)
      expect(actual[0].path).toBe('dir2')
    })
  })

  describe('renameUserStorageFile', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(GENERAL_USER)
      await api.createUserStorageDirs(['dir1'])
      await api.uploadTestFiles([{ filePath: `${userStorageBasePath}/dir1/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])

      const actual = await api.moveUserStorageFile('dir1/fileA.txt', 'dir1/fileB.txt')

      expect(actual.path).toBe('dir1/fileB.txt')
    })
  })
})
