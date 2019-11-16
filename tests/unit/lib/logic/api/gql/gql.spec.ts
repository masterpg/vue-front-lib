import { api, initAPI } from '../../../../../mocks/logic/api'
const isEmpty = require('lodash/isEmpty')

jest.setTimeout(25000)
initAPI()

const GENERAL_USER = { uid: 'yamada.one' }
const TEST_FILES_DIR = 'test-files'

function getAPIErrorResponse(error: any): { statusCode: number; error: string; message: string } {
  return error.graphQLErrors[0].extensions.exception.response
}

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

    it('サインインしていない場合', async () => {
      let actual!: Error
      try {
        await api.customToken()
      } catch (err) {
        actual = err
      }

      expect(getAPIErrorResponse(actual).statusCode).toBe(403)
    })
  })
})

describe('Storage API', () => {
  let userStorageBasePath!: string

  beforeEach(async () => {
    if (!userStorageBasePath) {
      api.setTestAuthUser(GENERAL_USER)
      userStorageBasePath = await api.userStorageBasePath()
      api.clearTestAuthUser()
    }
    await Promise.all([api.removeTestStorageDir(TEST_FILES_DIR), api.removeTestStorageDir(userStorageBasePath)])
  })

  describe('userStorageBasePath', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(GENERAL_USER)

      const actual = await api.userStorageBasePath()

      expect(isEmpty(actual)).toBeFalsy()
    })

    it('サインインしていない場合', async () => {
      let actual!: Error
      try {
        await api.userStorageBasePath()
      } catch (err) {
        actual = err
      }

      expect(getAPIErrorResponse(actual).statusCode).toBe(403)
    })
  })

  describe('userStorageDirNodes', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(GENERAL_USER)
      await api.uploadTestFiles([{ filePath: `${userStorageBasePath}/docs/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])

      const actual = await api.userStorageDirNodes()

      expect(actual.length).toBe(2)
    })

    it('サインインしていない場合', async () => {
      let actual!: Error
      try {
        await api.userStorageDirNodes()
      } catch (err) {
        actual = err
      }

      expect(getAPIErrorResponse(actual).statusCode).toBe(403)
    })
  })

  describe('createUserStorageDirs', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(GENERAL_USER)

      const actual = await api.createUserStorageDirs(['dir1/dir1_1'])

      expect(actual.length).toBe(2)
      expect(actual[0].path).toBe('dir1')
      expect(actual[1].path).toBe('dir1/dir1_1')

      const nodes = await api.userStorageDirNodes()

      expect(nodes.length).toBe(2)
      expect(nodes[0].path).toBe('dir1')
      expect(nodes[1].path).toBe('dir1/dir1_1')
    })

    it('サインインしていない場合', async () => {
      let actual!: Error
      try {
        await await api.createUserStorageDirs(['dir1/dir1_1'])
      } catch (err) {
        actual = err
      }

      expect(getAPIErrorResponse(actual).statusCode).toBe(403)
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

      const nodes = await api.userStorageDirNodes()

      expect(nodes.length).toBe(2)
      expect(nodes[0].path).toBe('docs')
      expect(nodes[1].path).toBe(`docs/fileB.txt`)
    })

    it('サインインしていない場合', async () => {
      let actual!: Error
      try {
        await await api.removeUserStorageFiles([`docs/fileA.txt`])
      } catch (err) {
        actual = err
      }

      expect(getAPIErrorResponse(actual).statusCode).toBe(403)
    })
  })

  describe('removeUserStorageDir', () => {
    it('疎通確認', async () => {
      api.setTestAuthUser(GENERAL_USER)
      await api.uploadTestFiles([
        { filePath: `${userStorageBasePath}/docs/fileA.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `${userStorageBasePath}/docs/fileB.txt`, fileData: 'test', contentType: 'text/plain' },
      ])

      const actual = await api.removeUserStorageDir(`docs`)

      expect(actual.length).toBe(2)
      expect(actual[0].path).toBe(`docs/fileA.txt`)
      expect(actual[1].path).toBe(`docs/fileB.txt`)

      const nodes = await api.userStorageDirNodes()

      expect(nodes.length).toBe(0)
    })

    it('サインインしていない場合', async () => {
      let actual!: Error
      try {
        await await api.removeUserStorageDir(`docs/fileA.txt`)
      } catch (err) {
        actual = err
      }

      expect(getAPIErrorResponse(actual).statusCode).toBe(403)
    })
  })
})
