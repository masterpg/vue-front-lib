import { APP_ADMIN_TOKEN, GENERAL_TOKEN, GENERAL_USER } from '../../../../../helpers/common/data'
import { AuthStatus, PublicProfile, StorageArticleNodeType, StorageNodeShareSettings, UserInfo, UserInfoInput } from '@/lib'
import { OmitEntityTimestamp } from '@/firestore-ex'
import { TestLibAPIContainer } from '../../../../../mocks/lib/logic/api'
import { config } from '@/example/config'
import { initLibTest } from '../../../../../helpers/lib/init'
import { sleep } from 'web-base-lib'
import { sortStorageNodes } from '../../../../../../src/lib/logic/base'

//========================================================================
//
//  Test data
//
//========================================================================

interface TestAuthData extends OmitEntityTimestamp<Omit<UserInfo, 'publicProfile'>> {
  publicProfile: OmitEntityTimestamp<PublicProfile>
}

const TEST_DIR = 'test'

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

describe('Foundation API', () => {
  describe('getAppConfig', () => {
    it('疎通確認', async () => {
      const actual = await api.getAppConfig()

      expect(actual.users).toMatchObject(config.storage.users)
      expect(actual.articles).toMatchObject(config.storage.articles)
    })
  })
})

describe('User API', () => {
  describe('getAuthData', () => {
    it('疎通確認', async () => {
      // テストユーザーを登録
      await api.setTestUsers(GENERAL_USER)

      api.setTestAuthToken(GENERAL_TOKEN)

      // 認証データの取得
      const actual = await api.getAuthData()

      expect(actual.status).toBe(AuthStatus.Available)
      expect(actual.token).toBeDefined()
      expect(actual.user).toMatchObject({
        id: GENERAL_USER.uid,
        fullName: GENERAL_USER.fullName,
        email: GENERAL_USER.email,
        emailVerified: GENERAL_USER.emailVerified,
        isAppAdmin: GENERAL_USER.customClaims!.isAppAdmin,
        publicProfile: {
          id: GENERAL_USER.uid,
          displayName: GENERAL_USER.displayName,
          photoURL: GENERAL_USER.photoURL,
        },
      } as TestAuthData)
      expect(actual.user!.createdAt.isValid()).toBeTruthy()
      expect(actual.user!.updatedAt.isValid()).toBeTruthy()
      expect(actual.user!.publicProfile.createdAt.isValid()).toBeTruthy()
      expect(actual.user!.publicProfile.updatedAt.isValid()).toBeTruthy()
    })

    it('サインインしていない場合', async () => {
      let actual!: Error
      try {
        await api.getAuthData()
      } catch (err) {
        actual = err
      }

      expect(getAPIErrorResponse(actual).statusCode).toBe(401)
    })
  })

  describe('setOwnUserInfo', () => {
    it('疎通確認', async () => {
      // テストユーザーを登録
      const [user] = (await api.setTestUsers(GENERAL_USER))!

      api.setTestAuthToken(GENERAL_TOKEN)

      // ユーザー情報設定
      const userInfoInput: UserInfoInput = { displayName: 'john', fullName: 'John Doe' }
      const actual = (await api.setOwnUserInfo(userInfoInput))!

      expect(actual).toMatchObject({
        id: GENERAL_USER.uid,
        fullName: userInfoInput.fullName,
        email: GENERAL_USER.email,
        emailVerified: GENERAL_USER.emailVerified,
        isAppAdmin: GENERAL_USER.customClaims!.isAppAdmin,
        publicProfile: {
          id: GENERAL_USER.uid,
          displayName: userInfoInput.displayName,
          photoURL: GENERAL_USER.photoURL,
        },
      } as TestAuthData)
      expect(actual.createdAt).toEqual(user.createdAt)
      expect(actual.updatedAt.isAfter(user.updatedAt)).toBeTruthy()
      expect(actual.publicProfile.createdAt).toEqual(user.publicProfile.createdAt)
      expect(actual.publicProfile.updatedAt.isAfter(user.publicProfile.updatedAt)).toBeTruthy()
    })

    it('サインインしていない場合', async () => {
      let actual!: Error
      try {
        await api.setOwnUserInfo({
          displayName: GENERAL_USER.displayName,
          fullName: GENERAL_USER.fullName,
        })
      } catch (err) {
        actual = err
      }

      expect(getAPIErrorResponse(actual).statusCode).toBe(401)
    })
  })

  describe('deleteOwnUser', () => {
    it('疎通確認', async () => {
      // テストユーザーを登録
      await api.setTestUsers(GENERAL_USER)

      api.setTestAuthToken(GENERAL_TOKEN)

      // ユーザー削除
      const actual = await api.deleteOwnUser()

      expect(actual).toBeTruthy()
    })

    it('サインインしていない場合', async () => {
      let actual!: Error
      try {
        await api.deleteOwnUser()
      } catch (err) {
        actual = err
      }

      expect(getAPIErrorResponse(actual).statusCode).toBe(401)
    })
  })
})

describe('Storage API', () => {
  beforeEach(async () => {
    await api.removeTestUserDir(GENERAL_TOKEN)
    await api.removeTestDir([TEST_DIR])

    // Cloud Storageで短い間隔のノード追加・削除を行うとエラーが発生するので間隔調整している
    await sleep(1500)
  })

  describe('getStorageNode', () => {
    beforeEach(async () => {
      await api.uploadTestFiles([{ filePath: `${TEST_DIR}/d1/d11/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])
    })

    it('疎通確認 - 対象ノードあり', async () => {
      api.setTestAuthToken(APP_ADMIN_TOKEN)

      const actual = (await api.getStorageNode({ path: `${TEST_DIR}/d1/d11` }))!

      expect(actual.path).toBe(`${TEST_DIR}/d1/d11`)
    })

    it('疎通確認 - 対象ノードなし', async () => {
      api.setTestAuthToken(APP_ADMIN_TOKEN)

      const actual = (await api.getStorageNode({ path: `${TEST_DIR}/d1/dXX` }))!

      expect(actual).toBeUndefined()
    })
  })

  describe('getStorageDirDescendants', () => {
    beforeEach(async () => {
      await api.uploadTestFiles([
        { filePath: `${TEST_DIR}/d1/fileA.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `${TEST_DIR}/d1/d11/fileB.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `${TEST_DIR}/d1/d11/d111/fileC.txt`, fileData: 'test', contentType: 'text/plain' },
      ])
    })

    it('疎通確認 - ページングなし', async () => {
      expect(true).toBe(true)

      api.setTestAuthToken(APP_ADMIN_TOKEN)

      const actual = await api.getStorageDirDescendants(`${TEST_DIR}/d1`)

      sortStorageNodes(actual.list)
      expect(actual.nextPageToken).toBeUndefined()
      expect(actual.list.length).toBe(6)
      expect(actual.list[0].path).toBe(`${TEST_DIR}/d1`)
      expect(actual.list[1].path).toBe(`${TEST_DIR}/d1/d11`)
      expect(actual.list[2].path).toBe(`${TEST_DIR}/d1/d11/d111`)
      expect(actual.list[3].path).toBe(`${TEST_DIR}/d1/d11/d111/fileC.txt`)
      expect(actual.list[4].path).toBe(`${TEST_DIR}/d1/d11/fileB.txt`)
      expect(actual.list[5].path).toBe(`${TEST_DIR}/d1/fileA.txt`)
    })

    it('疎通確認 - ページングあり', async () => {
      api.setTestAuthToken(APP_ADMIN_TOKEN)

      const actual = await api.callStoragePaginationAPI(api.getStorageDirDescendants, `${TEST_DIR}/d1`, { maxChunk: 2 })

      sortStorageNodes(actual)
      expect(actual.length).toBe(6)
      expect(actual[0].path).toBe(`${TEST_DIR}/d1`)
      expect(actual[1].path).toBe(`${TEST_DIR}/d1/d11`)
      expect(actual[2].path).toBe(`${TEST_DIR}/d1/d11/d111`)
      expect(actual[3].path).toBe(`${TEST_DIR}/d1/d11/d111/fileC.txt`)
      expect(actual[4].path).toBe(`${TEST_DIR}/d1/d11/fileB.txt`)
      expect(actual[5].path).toBe(`${TEST_DIR}/d1/fileA.txt`)
    })
  })

  describe('getStorageDescendants', () => {
    beforeEach(async () => {
      await api.uploadTestFiles([
        { filePath: `${TEST_DIR}/d1/fileA.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `${TEST_DIR}/d1/d11/fileB.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `${TEST_DIR}/d1/d11/d111/fileC.txt`, fileData: 'test', contentType: 'text/plain' },
      ])
    })

    it('疎通確認 - ページングなし', async () => {
      api.setTestAuthToken(APP_ADMIN_TOKEN)

      const actual = await api.getStorageDescendants(`${TEST_DIR}/d1`)

      sortStorageNodes(actual.list)
      expect(actual.nextPageToken).toBeUndefined()
      expect(actual.list.length).toBe(5)
      expect(actual.list[0].path).toBe(`${TEST_DIR}/d1/d11`)
      expect(actual.list[1].path).toBe(`${TEST_DIR}/d1/d11/d111`)
      expect(actual.list[2].path).toBe(`${TEST_DIR}/d1/d11/d111/fileC.txt`)
      expect(actual.list[3].path).toBe(`${TEST_DIR}/d1/d11/fileB.txt`)
      expect(actual.list[4].path).toBe(`${TEST_DIR}/d1/fileA.txt`)
    })

    it('疎通確認 - ページングあり', async () => {
      api.setTestAuthToken(APP_ADMIN_TOKEN)

      const actual = await api.callStoragePaginationAPI(api.getStorageDescendants, `${TEST_DIR}/d1`, { maxChunk: 2 })

      sortStorageNodes(actual)
      expect(actual.length).toBe(5)
      expect(actual[0].path).toBe(`${TEST_DIR}/d1/d11`)
      expect(actual[1].path).toBe(`${TEST_DIR}/d1/d11/d111`)
      expect(actual[2].path).toBe(`${TEST_DIR}/d1/d11/d111/fileC.txt`)
      expect(actual[3].path).toBe(`${TEST_DIR}/d1/d11/fileB.txt`)
      expect(actual[4].path).toBe(`${TEST_DIR}/d1/fileA.txt`)
    })
  })

  describe('getStorageDirChildren', () => {
    beforeEach(async () => {
      await api.uploadTestFiles([
        { filePath: `${TEST_DIR}/d1/fileA.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `${TEST_DIR}/d1/fileB.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `${TEST_DIR}/d1/d11/fileC.txt`, fileData: 'test', contentType: 'text/plain' },
      ])
    })

    it('疎通確認 - ページングなし', async () => {
      api.setTestAuthToken(APP_ADMIN_TOKEN)

      const actual = await api.getStorageDirChildren(`${TEST_DIR}/d1`)

      sortStorageNodes(actual.list)
      expect(actual.nextPageToken).toBeUndefined()
      expect(actual.list.length).toBe(4)
      expect(actual.list[0].path).toBe(`${TEST_DIR}/d1`)
      expect(actual.list[1].path).toBe(`${TEST_DIR}/d1/d11`)
      expect(actual.list[2].path).toBe(`${TEST_DIR}/d1/fileA.txt`)
      expect(actual.list[3].path).toBe(`${TEST_DIR}/d1/fileB.txt`)
    })

    it('疎通確認 - ページングあり', async () => {
      api.setTestAuthToken(APP_ADMIN_TOKEN)

      const actual = await api.callStoragePaginationAPI(api.getStorageDirChildren, `${TEST_DIR}/d1`, { maxChunk: 2 })

      sortStorageNodes(actual)
      expect(actual.length).toBe(4)
      expect(actual[0].path).toBe(`${TEST_DIR}/d1`)
      expect(actual[1].path).toBe(`${TEST_DIR}/d1/d11`)
      expect(actual[2].path).toBe(`${TEST_DIR}/d1/fileA.txt`)
      expect(actual[3].path).toBe(`${TEST_DIR}/d1/fileB.txt`)
    })
  })

  describe('getStorageChildren', () => {
    beforeEach(async () => {
      await api.uploadTestFiles([
        { filePath: `${TEST_DIR}/d1/fileA.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `${TEST_DIR}/d1/fileB.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `${TEST_DIR}/d1/d11/fileC.txt`, fileData: 'test', contentType: 'text/plain' },
      ])
    })

    it('疎通確認 - ページングなし', async () => {
      api.setTestAuthToken(APP_ADMIN_TOKEN)

      const actual = await api.getStorageChildren(`${TEST_DIR}/d1`)

      sortStorageNodes(actual.list)
      expect(actual.nextPageToken).toBeUndefined()
      expect(actual.list.length).toBe(3)
      expect(actual.list[0].path).toBe(`${TEST_DIR}/d1/d11`)
      expect(actual.list[1].path).toBe(`${TEST_DIR}/d1/fileA.txt`)
      expect(actual.list[2].path).toBe(`${TEST_DIR}/d1/fileB.txt`)
    })

    it('疎通確認 - ページングあり', async () => {
      api.setTestAuthToken(APP_ADMIN_TOKEN)

      const actual = await api.callStoragePaginationAPI(api.getStorageChildren, `${TEST_DIR}/d1`, { maxChunk: 2 })

      sortStorageNodes(actual)
      expect(actual.length).toBe(3)
      expect(actual[0].path).toBe(`${TEST_DIR}/d1/d11`)
      expect(actual[1].path).toBe(`${TEST_DIR}/d1/fileA.txt`)
      expect(actual[2].path).toBe(`${TEST_DIR}/d1/fileB.txt`)
    })
  })

  describe('getStorageHierarchicalNodes', () => {
    beforeEach(async () => {
      await api.uploadTestFiles([{ filePath: `${TEST_DIR}/d1/d11/d111/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])
    })

    it('疎通確認', async () => {
      api.setTestAuthToken(APP_ADMIN_TOKEN)

      const actual = await api.getStorageHierarchicalNodes(`${TEST_DIR}/d1/d11/d111/fileA.txt`)

      expect(actual.length).toBe(5)
      expect(actual[0].path).toBe(`${TEST_DIR}`)
      expect(actual[1].path).toBe(`${TEST_DIR}/d1`)
      expect(actual[2].path).toBe(`${TEST_DIR}/d1/d11`)
      expect(actual[3].path).toBe(`${TEST_DIR}/d1/d11/d111`)
      expect(actual[4].path).toBe(`${TEST_DIR}/d1/d11/d111/fileA.txt`)
    })
  })

  describe('getStorageAncestorDirs', () => {
    beforeEach(async () => {
      await api.uploadTestFiles([{ filePath: `${TEST_DIR}/d1/d11/d111/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])
    })

    it('疎通確認', async () => {
      api.setTestAuthToken(APP_ADMIN_TOKEN)

      const actual = await api.getStorageAncestorDirs(`${TEST_DIR}/d1/d11/d111/fileA.txt`)

      expect(actual.length).toBe(4)
      expect(actual[0].path).toBe(`${TEST_DIR}`)
      expect(actual[1].path).toBe(`${TEST_DIR}/d1`)
      expect(actual[2].path).toBe(`${TEST_DIR}/d1/d11`)
      expect(actual[3].path).toBe(`${TEST_DIR}/d1/d11/d111`)
    })
  })

  describe('handleUploadedFile', () => {
    it('疎通確認', async () => {
      api.setTestAuthToken(APP_ADMIN_TOKEN)
      await api.createStorageHierarchicalDirs([`${TEST_DIR}/docs`])
      await api.uploadTestFiles([{ filePath: `${TEST_DIR}/docs/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])

      const actual = await api.handleUploadedFile(`${TEST_DIR}/docs/fileA.txt`)

      expect(actual.path).toBe(`${TEST_DIR}/docs/fileA.txt`)
    })
  })

  describe('createStorageDir', () => {
    it('疎通確認', async () => {
      api.setTestAuthToken(APP_ADMIN_TOKEN)

      // 祖先ディレクトリを事前に作成
      await api.createStorageHierarchicalDirs([`${TEST_DIR}`])

      const actual = await api.createStorageDir(`${TEST_DIR}/d1`)

      expect(actual.path).toBe(`${TEST_DIR}/d1`)
      expect(actual.share).toMatchObject({
        isPublic: null,
        readUIds: null,
        writeUIds: null,
      } as StorageNodeShareSettings)
    })

    it('疎通確認 + 共有設定', async () => {
      api.setTestAuthToken(APP_ADMIN_TOKEN)

      // 祖先ディレクトリを事前に作成
      await api.createStorageHierarchicalDirs([`${TEST_DIR}`])

      const actual = await api.createStorageDir(`${TEST_DIR}/d1`, { isPublic: true })

      expect(actual.path).toBe(`${TEST_DIR}/d1`)
      expect(actual.share).toMatchObject({
        isPublic: true,
        readUIds: null,
        writeUIds: null,
      } as StorageNodeShareSettings)
    })
  })

  describe('createStorageHierarchicalDirs', () => {
    it('疎通確認', async () => {
      api.setTestAuthToken(APP_ADMIN_TOKEN)

      const actual = await api.createStorageHierarchicalDirs([`${TEST_DIR}/d1/d11`])

      expect(actual.length).toBe(3)
      expect(actual[0].path).toBe(`${TEST_DIR}`)
      expect(actual[1].path).toBe(`${TEST_DIR}/d1`)
      expect(actual[2].path).toBe(`${TEST_DIR}/d1/d11`)
    })
  })

  describe('removeStorageDir', () => {
    it('疎通確認 - ページングなし', async () => {
      api.setTestAuthToken(APP_ADMIN_TOKEN)

      await api.uploadTestFiles([
        { filePath: `${TEST_DIR}/d1/file1.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `${TEST_DIR}/d1/file2.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `${TEST_DIR}/d1/file3.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `${TEST_DIR}/d1/file4.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `${TEST_DIR}/d1/file5.txt`, fileData: 'test', contentType: 'text/plain' },
      ])

      const actual = (await api.removeStorageDir(`${TEST_DIR}/d1`)).list

      sortStorageNodes(actual)
      expect(actual.length).toBe(6)
      expect(actual[0].path).toBe(`${TEST_DIR}/d1`)
      expect(actual[1].path).toBe(`${TEST_DIR}/d1/file1.txt`)
      expect(actual[2].path).toBe(`${TEST_DIR}/d1/file2.txt`)
      expect(actual[3].path).toBe(`${TEST_DIR}/d1/file3.txt`)
      expect(actual[4].path).toBe(`${TEST_DIR}/d1/file4.txt`)
      expect(actual[5].path).toBe(`${TEST_DIR}/d1/file5.txt`)
    })

    it('疎通確認 - ページングあり', async () => {
      api.setTestAuthToken(APP_ADMIN_TOKEN)

      await api.uploadTestFiles([
        { filePath: `${TEST_DIR}/d1/file1.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `${TEST_DIR}/d1/file2.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `${TEST_DIR}/d1/file3.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `${TEST_DIR}/d1/file4.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `${TEST_DIR}/d1/file5.txt`, fileData: 'test', contentType: 'text/plain' },
      ])

      const actual = await api.callStoragePaginationAPI(api.removeStorageDir, `${TEST_DIR}/d1`, { maxChunk: 2 })

      sortStorageNodes(actual)
      expect(actual.length).toBe(6)
      expect(actual[0].path).toBe(`${TEST_DIR}/d1`)
      expect(actual[1].path).toBe(`${TEST_DIR}/d1/file1.txt`)
      expect(actual[2].path).toBe(`${TEST_DIR}/d1/file2.txt`)
      expect(actual[3].path).toBe(`${TEST_DIR}/d1/file3.txt`)
      expect(actual[4].path).toBe(`${TEST_DIR}/d1/file4.txt`)
      expect(actual[5].path).toBe(`${TEST_DIR}/d1/file5.txt`)
    })
  })

  describe('removeStorageFile', () => {
    it('疎通確認', async () => {
      api.setTestAuthToken(APP_ADMIN_TOKEN)

      await api.uploadTestFiles([{ filePath: `${TEST_DIR}/d1/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])

      const actual = (await api.removeStorageFile(`${TEST_DIR}/d1/fileA.txt`))!

      expect(actual.path).toBe(`${TEST_DIR}/d1/fileA.txt`)
    })
  })

  describe('moveStorageDir', () => {
    it('疎通確認 - ページングなし', async () => {
      api.setTestAuthToken(APP_ADMIN_TOKEN)

      await api.createStorageHierarchicalDirs([
        `${TEST_DIR}/d1/d11`,
        `${TEST_DIR}/d1/d12`,
        `${TEST_DIR}/d1/d13`,
        `${TEST_DIR}/d1/d14`,
        `${TEST_DIR}/d1/d15`,
        `${TEST_DIR}/d2`,
      ])

      const actual = (await api.moveStorageDir(`${TEST_DIR}/d1`, `${TEST_DIR}/d2/d1`)).list

      sortStorageNodes(actual)
      expect(actual.length).toBe(6)
      expect(actual[0].path).toBe(`${TEST_DIR}/d2/d1`)
      expect(actual[1].path).toBe(`${TEST_DIR}/d2/d1/d11`)
      expect(actual[2].path).toBe(`${TEST_DIR}/d2/d1/d12`)
      expect(actual[3].path).toBe(`${TEST_DIR}/d2/d1/d13`)
      expect(actual[4].path).toBe(`${TEST_DIR}/d2/d1/d14`)
      expect(actual[5].path).toBe(`${TEST_DIR}/d2/d1/d15`)
    })

    it('疎通確認 - ページングあり', async () => {
      api.setTestAuthToken(APP_ADMIN_TOKEN)

      await api.createStorageHierarchicalDirs([
        `${TEST_DIR}/d1/d11`,
        `${TEST_DIR}/d1/d12`,
        `${TEST_DIR}/d1/d13`,
        `${TEST_DIR}/d1/d14`,
        `${TEST_DIR}/d1/d15`,
        `${TEST_DIR}/d2`,
      ])

      const actual = await api.callStoragePaginationAPI(api.moveStorageDir, `${TEST_DIR}/d1`, `${TEST_DIR}/d2/d1`, { maxChunk: 2 })

      sortStorageNodes(actual)
      expect(actual.length).toBe(6)
      expect(actual[0].path).toBe(`${TEST_DIR}/d2/d1`)
      expect(actual[1].path).toBe(`${TEST_DIR}/d2/d1/d11`)
      expect(actual[2].path).toBe(`${TEST_DIR}/d2/d1/d12`)
      expect(actual[3].path).toBe(`${TEST_DIR}/d2/d1/d13`)
      expect(actual[4].path).toBe(`${TEST_DIR}/d2/d1/d14`)
      expect(actual[5].path).toBe(`${TEST_DIR}/d2/d1/d15`)
    })
  })

  describe('moveStorageFile', () => {
    it('疎通確認', async () => {
      api.setTestAuthToken(APP_ADMIN_TOKEN)

      await api.createStorageHierarchicalDirs([`${TEST_DIR}/d1`, `${TEST_DIR}/d2`])
      await api.uploadTestFiles([{ filePath: `${TEST_DIR}/d1/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])

      const actual = await api.moveStorageFile(`${TEST_DIR}/d1/fileA.txt`, `${TEST_DIR}/d2/fileA.txt`)

      expect(actual.path).toBe(`${TEST_DIR}/d2/fileA.txt`)
    })
  })

  describe('renameStorageDir', () => {
    it('疎通確認 - ページングなし', async () => {
      api.setTestAuthToken(APP_ADMIN_TOKEN)

      await api.createStorageHierarchicalDirs([
        `${TEST_DIR}/d1/d11`,
        `${TEST_DIR}/d1/d12`,
        `${TEST_DIR}/d1/d13`,
        `${TEST_DIR}/d1/d14`,
        `${TEST_DIR}/d1/d15`,
      ])

      const actual = (await api.renameStorageDir(`${TEST_DIR}/d1`, `d2`)).list

      sortStorageNodes(actual)
      expect(actual.length).toBe(6)
      expect(actual[0].path).toBe(`${TEST_DIR}/d2`)
      expect(actual[1].path).toBe(`${TEST_DIR}/d2/d11`)
      expect(actual[2].path).toBe(`${TEST_DIR}/d2/d12`)
      expect(actual[3].path).toBe(`${TEST_DIR}/d2/d13`)
      expect(actual[4].path).toBe(`${TEST_DIR}/d2/d14`)
      expect(actual[5].path).toBe(`${TEST_DIR}/d2/d15`)
    })

    it('疎通確認 - ページングあり', async () => {
      api.setTestAuthToken(APP_ADMIN_TOKEN)

      await api.createStorageHierarchicalDirs([
        `${TEST_DIR}/d1/d11`,
        `${TEST_DIR}/d1/d12`,
        `${TEST_DIR}/d1/d13`,
        `${TEST_DIR}/d1/d14`,
        `${TEST_DIR}/d1/d15`,
      ])

      const actual = await api.callStoragePaginationAPI(api.renameStorageDir, `${TEST_DIR}/d1`, `d2`, { maxChunk: 2 })

      sortStorageNodes(actual)
      expect(actual.length).toBe(6)
      expect(actual[0].path).toBe(`${TEST_DIR}/d2`)
      expect(actual[1].path).toBe(`${TEST_DIR}/d2/d11`)
      expect(actual[2].path).toBe(`${TEST_DIR}/d2/d12`)
      expect(actual[3].path).toBe(`${TEST_DIR}/d2/d13`)
      expect(actual[4].path).toBe(`${TEST_DIR}/d2/d14`)
      expect(actual[5].path).toBe(`${TEST_DIR}/d2/d15`)
    })
  })

  describe('renameStorageFile', () => {
    it('疎通確認', async () => {
      api.setTestAuthToken(APP_ADMIN_TOKEN)

      await api.createStorageHierarchicalDirs([`${TEST_DIR}/d1`])
      await api.uploadTestFiles([{ filePath: `${TEST_DIR}/d1/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])

      const actual = await api.renameStorageFile(`${TEST_DIR}/d1/fileA.txt`, `fileB.txt`)

      expect(actual.path).toBe(`${TEST_DIR}/d1/fileB.txt`)
    })
  })

  describe('setStorageDirShareSettings', () => {
    it('疎通確認', async () => {
      api.setTestAuthToken(APP_ADMIN_TOKEN)
      await api.createStorageHierarchicalDirs([`${TEST_DIR}/dir1`])
      await api.uploadTestFiles([{ filePath: `${TEST_DIR}/dir1/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])

      const actual = await api.setStorageDirShareSettings(`${TEST_DIR}/dir1`, { isPublic: true, readUIds: ['ichiro'], writeUIds: ['ichiro'] })

      expect(actual.path).toBe(`${TEST_DIR}/dir1`)
      expect(actual.share).toMatchObject<StorageNodeShareSettings>({ isPublic: true, readUIds: ['ichiro'], writeUIds: ['ichiro'] })
    })
  })

  describe('setStorageFileShareSettings', () => {
    it('疎通確認', async () => {
      api.setTestAuthToken(APP_ADMIN_TOKEN)
      await api.createStorageHierarchicalDirs([`${TEST_DIR}/dir1`])
      await api.uploadTestFiles([{ filePath: `${TEST_DIR}/dir1/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])

      const actual = await api.setStorageFileShareSettings(`${TEST_DIR}/dir1/fileA.txt`, {
        isPublic: true,
        readUIds: ['ichiro'],
        writeUIds: ['ichiro'],
      })

      expect(actual.path).toBe(`${TEST_DIR}/dir1/fileA.txt`)
    })
  })

  //--------------------------------------------------
  //  Article
  //--------------------------------------------------

  describe('createArticleDir', () => {
    let articlesPath: string
    let bundlePath: string

    async function setupArticleNodes(): Promise<void> {
      api.setTestAuthToken(GENERAL_TOKEN)
      articlesPath = `${config.storage.users.dir}/${GENERAL_TOKEN.uid}/${config.storage.articles.dir}`
      await api.createStorageHierarchicalDirs([articlesPath])
    }

    it('疎通確認', async () => {
      // ユーザーの記事ルートを事前に作成
      await setupArticleNodes()

      const actual = await api.createArticleDir(`${articlesPath}/blog`, {
        articleNodeType: StorageArticleNodeType.ListBundle,
      })

      expect(actual.path).toBe(`${articlesPath}/blog`)
      expect(actual.articleNodeType).toBe(StorageArticleNodeType.ListBundle)
      expect(typeof actual.articleSortOrder === 'number').toBeTruthy()
    })
  })

  describe('setArticleSortOrder', () => {
    let articlesPath: string
    let bundlePath: string

    async function setupArticleNodes(): Promise<void> {
      api.setTestAuthToken(GENERAL_TOKEN)
      articlesPath = `${config.storage.users.dir}/${GENERAL_TOKEN.uid}/${config.storage.articles.dir}`
      await api.createStorageHierarchicalDirs([articlesPath])
      bundlePath = `${articlesPath}/blog`
      await api.createArticleDir(`${bundlePath}`, { articleNodeType: StorageArticleNodeType.ListBundle })
    }

    it('疎通確認', async () => {
      // ユーザーの記事ルートを事前に作成
      await setupArticleNodes()
      // 記事を作成
      const art1Dir = await api.createArticleDir(`${bundlePath}/art1`, {
        articleNodeType: StorageArticleNodeType.ArticleDir,
      })
      const art2Dir = await api.createArticleDir(`${bundlePath}/art2`, {
        articleNodeType: StorageArticleNodeType.ArticleDir,
      })

      const actual = await api.setArticleSortOrder(`${art1Dir.path}`, {
        insertAfterNodePath: `${art2Dir.path}`,
      })

      expect(actual.path).toBe(`${bundlePath}/art1`)
      expect(actual.articleSortOrder! < art2Dir.articleSortOrder!).toBeTruthy()
    })
  })

  describe('getArticleChildren', () => {
    let articlesPath: string
    let bundlePath: string

    async function setupArticleNodes(): Promise<void> {
      api.setTestAuthToken(GENERAL_TOKEN)
      articlesPath = `${config.storage.users.dir}/${GENERAL_TOKEN.uid}/${config.storage.articles.dir}`
      await api.createStorageHierarchicalDirs([articlesPath])
      bundlePath = `${articlesPath}/blog`
      await api.createArticleDir(`${bundlePath}`, { articleNodeType: StorageArticleNodeType.ListBundle })
      await api.createArticleDir(`${bundlePath}/art1`, { articleNodeType: StorageArticleNodeType.ArticleDir })
      await api.createArticleDir(`${bundlePath}/art2`, { articleNodeType: StorageArticleNodeType.ArticleDir })
      await api.createArticleDir(`${bundlePath}/art3`, { articleNodeType: StorageArticleNodeType.ArticleDir })
    }

    it('疎通確認 - ページングなし', async () => {
      await setupArticleNodes()

      const actual = await api.getArticleChildren(`${bundlePath}`)

      expect(actual.nextPageToken).toBeUndefined()
      expect(actual.list.length).toBe(3)
      expect(actual.list[0].path).toBe(`${bundlePath}/art3`)
      expect(actual.list[1].path).toBe(`${bundlePath}/art2`)
      expect(actual.list[2].path).toBe(`${bundlePath}/art1`)
    })

    it('疎通確認 - ページングあり', async () => {
      await setupArticleNodes()

      const actual = await api.callStoragePaginationAPI(api.getArticleChildren, `${bundlePath}`, { maxChunk: 2 })

      expect(actual.length).toBe(3)
      expect(actual[0].path).toBe(`${bundlePath}/art3`)
      expect(actual[1].path).toBe(`${bundlePath}/art2`)
      expect(actual[2].path).toBe(`${bundlePath}/art1`)
    })
  })
})
