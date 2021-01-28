import {
  APIStorageNode,
  AuthStatus,
  OmitTimestamp,
  SetOwnUserInfoResultStatus,
  StorageArticleDirType,
  StorageArticleFileType,
  StorageNode,
  StorageNodeShareSettings,
  StorageUtil,
  User,
  UserInput,
} from '@/app/service'
import { AppAdminToken, GeneralToken, GeneralUser, provideDependency } from '../../../../helpers/app'
import { sleep } from 'web-base-lib'

jest.setTimeout(25000)

//========================================================================
//
//  Test data
//
//========================================================================

const TEST_DIR = 'test'

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

describe('Env API', () => {
  describe('dummyTest', () => {
    it('疎通確認', async () => {})
  })
})

describe('User API', () => {
  describe('getAuthData', () => {
    it('疎通確認', async () => {
      const { api } = provideDependency()

      // テストユーザーを登録
      await api.setTestUsers(GeneralUser())

      api.setTestAuthToken(GeneralToken())

      // 認証データの取得
      const actual = await api.getAuthData()

      expect(actual.status).toBe(AuthStatus.Available)
      expect(actual.token).toBeDefined()
      expect(actual.user).toMatchObject({
        id: GeneralUser().uid,
        email: GeneralUser().email,
        emailVerified: GeneralUser().emailVerified,
        userName: GeneralUser().userName,
        fullName: GeneralUser().fullName,
        isAppAdmin: GeneralUser().isAppAdmin,
        photoURL: GeneralUser().photoURL,
      } as OmitTimestamp<User>)
      expect(actual.user?.version).toBeGreaterThanOrEqual(1)
      expect(actual.user?.createdAt.isValid()).toBeTruthy()
      expect(actual.user?.updatedAt.isValid()).toBeTruthy()
    })

    it('サインインしていない場合', async () => {
      const { api } = provideDependency()
      api.setTestAuthToken(null)

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
      const { api } = provideDependency()

      // テストユーザーを登録
      const [user] = await api.setTestUsers(GeneralUser())

      api.setTestAuthToken(GeneralToken())

      // ユーザー情報設定
      const userInput: UserInput = {
        userName: 'john',
        fullName: 'John Doe',
        photoURL: 'https://example.com/john/user.png',
      }
      const actual = (await api.setOwnUserInfo(userInput))!

      expect(actual.status).toBe(SetOwnUserInfoResultStatus.Success)
      expect(actual.user).toMatchObject({
        id: GeneralUser().uid,
        email: GeneralUser().email,
        emailVerified: GeneralUser().emailVerified,
        userName: userInput.userName,
        fullName: userInput.fullName,
        isAppAdmin: GeneralUser().isAppAdmin,
        photoURL: userInput.photoURL,
      } as OmitTimestamp<User>)
      expect(actual.user?.version).toBeGreaterThanOrEqual(1)
      expect(actual.user?.createdAt).toEqual(user.createdAt)
      expect(actual.user?.updatedAt.isAfter(user.updatedAt)).toBeTruthy()
    })

    it('サインインしていない場合', async () => {
      const { api } = provideDependency()
      api.setTestAuthToken(null)

      let actual!: Error
      try {
        await api.setOwnUserInfo({
          userName: GeneralUser().userName,
          fullName: GeneralUser().fullName,
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
      const { api } = provideDependency()
      await api.setTestUsers(GeneralUser())

      api.setTestAuthToken(GeneralToken())

      // ユーザー削除
      const actual = await api.deleteOwnUser()

      expect(actual).toBeTruthy()
    })

    it('サインインしていない場合', async () => {
      const { api } = provideDependency()
      api.setTestAuthToken(null)

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
    const { api } = provideDependency()
    await api.removeTestUserDir(GeneralToken())
    await api.removeTestDir([TEST_DIR])

    // Cloud Storageで短い間隔のノード追加・削除を行うとエラーが発生するので間隔調整している
    await sleep(1500)
  })

  describe('getStorageNode', () => {
    beforeEach(async () => {
      const { api } = provideDependency()
      await api.uploadTestHierarchyFiles([
        {
          id: StorageNode.generateId(),
          path: `${TEST_DIR}/d1/d11/fileA.txt`,
          contentType: 'text/plain',
          data: 'test',
        },
      ])
    })

    it('疎通確認 - 対象ノードあり', async () => {
      const { api } = provideDependency()
      api.setTestAuthToken(AppAdminToken())

      const actual = (await api.getStorageNode({ path: `${TEST_DIR}/d1/d11` }))!

      expect(actual.path).toBe(`${TEST_DIR}/d1/d11`)
    })

    it('疎通確認 - 対象ノードなし', async () => {
      const { api } = provideDependency()
      api.setTestAuthToken(AppAdminToken())

      const actual = (await api.getStorageNode({ path: `${TEST_DIR}/d1/dXX` }))!

      expect(actual).toBeUndefined()
    })
  })

  describe('getStorageNodes', () => {
    beforeEach(async () => {
      const { api } = provideDependency()
      await api.uploadTestHierarchyFiles([{ id: StorageNode.generateId(), path: `${TEST_DIR}/fileA.txt`, contentType: 'text/plain', data: 'test' }])
    })

    it('疎通確認', async () => {
      const { api } = provideDependency()
      api.setTestAuthToken(AppAdminToken())

      const [testDir, fileA] = (await api.getStorageDirDescendants(`${TEST_DIR}`)).list

      const actual = await api.getStorageNodes({ ids: [testDir.id], paths: [fileA.path] })

      expect(actual[0].path).toBe(`${TEST_DIR}`)
      expect(actual[1].path).toBe(`${TEST_DIR}/fileA.txt`)
    })
  })

  describe('getStorageDirDescendants', () => {
    beforeEach(async () => {
      const { api } = provideDependency()
      await api.uploadTestHierarchyFiles([
        { id: StorageNode.generateId(), path: `${TEST_DIR}/d1/fileA.txt`, contentType: 'text/plain', data: 'test' },
        { id: StorageNode.generateId(), path: `${TEST_DIR}/d1/d11/fileB.txt`, contentType: 'text/plain', data: 'test' },
        { id: StorageNode.generateId(), path: `${TEST_DIR}/d1/d11/d111/fileC.txt`, contentType: 'text/plain', data: 'test' },
      ])
    })

    it('疎通確認 - ページングなし', async () => {
      const { api } = provideDependency()
      api.setTestAuthToken(AppAdminToken())

      const actual = await api.getStorageDirDescendants(`${TEST_DIR}/d1`)

      StorageUtil.sortNodes(actual.list)
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
      const { api } = provideDependency()
      api.setTestAuthToken(AppAdminToken())

      const actual = await api.callStoragePaginationAPI(api.getStorageDirDescendants, `${TEST_DIR}/d1`, { maxChunk: 2 })

      StorageUtil.sortNodes(actual)
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
      const { api } = provideDependency()
      await api.uploadTestHierarchyFiles([
        { id: StorageNode.generateId(), path: `${TEST_DIR}/d1/fileA.txt`, contentType: 'text/plain', data: 'test' },
        { id: StorageNode.generateId(), path: `${TEST_DIR}/d1/d11/fileB.txt`, contentType: 'text/plain', data: 'test' },
        { id: StorageNode.generateId(), path: `${TEST_DIR}/d1/d11/d111/fileC.txt`, contentType: 'text/plain', data: 'test' },
      ])
    })

    it('疎通確認 - ページングなし', async () => {
      const { api } = provideDependency()
      api.setTestAuthToken(AppAdminToken())

      const actual = await api.getStorageDescendants(`${TEST_DIR}/d1`)

      StorageUtil.sortNodes(actual.list)
      expect(actual.nextPageToken).toBeUndefined()
      expect(actual.list.length).toBe(5)
      expect(actual.list[0].path).toBe(`${TEST_DIR}/d1/d11`)
      expect(actual.list[1].path).toBe(`${TEST_DIR}/d1/d11/d111`)
      expect(actual.list[2].path).toBe(`${TEST_DIR}/d1/d11/d111/fileC.txt`)
      expect(actual.list[3].path).toBe(`${TEST_DIR}/d1/d11/fileB.txt`)
      expect(actual.list[4].path).toBe(`${TEST_DIR}/d1/fileA.txt`)
    })

    it('疎通確認 - ページングあり', async () => {
      const { api } = provideDependency()
      api.setTestAuthToken(AppAdminToken())

      const actual = await api.callStoragePaginationAPI(api.getStorageDescendants, `${TEST_DIR}/d1`, { maxChunk: 2 })

      StorageUtil.sortNodes(actual)
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
      const { api } = provideDependency()
      await api.uploadTestHierarchyFiles([
        { id: StorageNode.generateId(), path: `${TEST_DIR}/d1/fileA.txt`, contentType: 'text/plain', data: 'test' },
        { id: StorageNode.generateId(), path: `${TEST_DIR}/d1/fileB.txt`, contentType: 'text/plain', data: 'test' },
        { id: StorageNode.generateId(), path: `${TEST_DIR}/d1/d11/fileC.txt`, contentType: 'text/plain', data: 'test' },
      ])
    })

    it('疎通確認 - ページングなし', async () => {
      const { api } = provideDependency()
      api.setTestAuthToken(AppAdminToken())

      const actual = await api.getStorageDirChildren(`${TEST_DIR}/d1`)

      StorageUtil.sortNodes(actual.list)
      expect(actual.nextPageToken).toBeUndefined()
      expect(actual.list.length).toBe(4)
      expect(actual.list[0].path).toBe(`${TEST_DIR}/d1`)
      expect(actual.list[1].path).toBe(`${TEST_DIR}/d1/d11`)
      expect(actual.list[2].path).toBe(`${TEST_DIR}/d1/fileA.txt`)
      expect(actual.list[3].path).toBe(`${TEST_DIR}/d1/fileB.txt`)
    })

    it('疎通確認 - ページングあり', async () => {
      const { api } = provideDependency()
      api.setTestAuthToken(AppAdminToken())

      const actual = await api.callStoragePaginationAPI(api.getStorageDirChildren, `${TEST_DIR}/d1`, { maxChunk: 2 })

      StorageUtil.sortNodes(actual)
      expect(actual.length).toBe(4)
      expect(actual[0].path).toBe(`${TEST_DIR}/d1`)
      expect(actual[1].path).toBe(`${TEST_DIR}/d1/d11`)
      expect(actual[2].path).toBe(`${TEST_DIR}/d1/fileA.txt`)
      expect(actual[3].path).toBe(`${TEST_DIR}/d1/fileB.txt`)
    })
  })

  describe('getStorageChildren', () => {
    beforeEach(async () => {
      const { api } = provideDependency()
      await api.uploadTestHierarchyFiles([
        { id: StorageNode.generateId(), path: `${TEST_DIR}/d1/fileA.txt`, contentType: 'text/plain', data: 'test' },
        { id: StorageNode.generateId(), path: `${TEST_DIR}/d1/fileB.txt`, contentType: 'text/plain', data: 'test' },
        { id: StorageNode.generateId(), path: `${TEST_DIR}/d1/d11/fileC.txt`, contentType: 'text/plain', data: 'test' },
      ])
    })

    it('疎通確認 - ページングなし', async () => {
      const { api } = provideDependency()
      api.setTestAuthToken(AppAdminToken())

      const actual = await api.getStorageChildren(`${TEST_DIR}/d1`)

      StorageUtil.sortNodes(actual.list)
      expect(actual.nextPageToken).toBeUndefined()
      expect(actual.list.length).toBe(3)
      expect(actual.list[0].path).toBe(`${TEST_DIR}/d1/d11`)
      expect(actual.list[1].path).toBe(`${TEST_DIR}/d1/fileA.txt`)
      expect(actual.list[2].path).toBe(`${TEST_DIR}/d1/fileB.txt`)
    })

    it('疎通確認 - ページングあり', async () => {
      const { api } = provideDependency()
      api.setTestAuthToken(AppAdminToken())

      const actual = await api.callStoragePaginationAPI(api.getStorageChildren, `${TEST_DIR}/d1`, { maxChunk: 2 })

      StorageUtil.sortNodes(actual)
      expect(actual.length).toBe(3)
      expect(actual[0].path).toBe(`${TEST_DIR}/d1/d11`)
      expect(actual[1].path).toBe(`${TEST_DIR}/d1/fileA.txt`)
      expect(actual[2].path).toBe(`${TEST_DIR}/d1/fileB.txt`)
    })
  })

  describe('getStorageHierarchicalNodes', () => {
    beforeEach(async () => {
      const { api } = provideDependency()
      await api.uploadTestHierarchyFiles([
        { id: StorageNode.generateId(), path: `${TEST_DIR}/d1/d11/d111/fileA.txt`, contentType: 'text/plain', data: 'test' },
      ])
    })

    it('疎通確認', async () => {
      const { api } = provideDependency()
      api.setTestAuthToken(AppAdminToken())

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
      const { api } = provideDependency()
      await api.uploadTestHierarchyFiles([
        { id: StorageNode.generateId(), path: `${TEST_DIR}/d1/d11/d111/fileA.txt`, contentType: 'text/plain', data: 'test' },
      ])
    })

    it('疎通確認', async () => {
      const { api } = provideDependency()
      api.setTestAuthToken(AppAdminToken())

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
      const { api } = provideDependency()
      api.setTestAuthToken(AppAdminToken())

      await api.createStorageHierarchicalDirs([`${TEST_DIR}/docs`])
      const uploadItem = { id: StorageNode.generateId(), path: `${TEST_DIR}/docs/fileA.txt`, contentType: 'text/plain', data: 'test' }
      await api.uploadTestHierarchyFiles([uploadItem])

      const actual = await api.handleUploadedFile(uploadItem)

      expect(actual.path).toBe(`${TEST_DIR}/docs/fileA.txt`)
    })
  })

  describe('createStorageDir', () => {
    it('疎通確認', async () => {
      const { api } = provideDependency()
      api.setTestAuthToken(AppAdminToken())

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
      const { api } = provideDependency()
      api.setTestAuthToken(AppAdminToken())

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
      const { api } = provideDependency()
      api.setTestAuthToken(AppAdminToken())

      const actual = await api.createStorageHierarchicalDirs([`${TEST_DIR}/d1/d11`])

      expect(actual.length).toBe(3)
      expect(actual[0].path).toBe(`${TEST_DIR}`)
      expect(actual[1].path).toBe(`${TEST_DIR}/d1`)
      expect(actual[2].path).toBe(`${TEST_DIR}/d1/d11`)
    })
  })

  describe('removeStorageDir', () => {
    it('疎通確認', async () => {
      const { api } = provideDependency()
      api.setTestAuthToken(AppAdminToken())

      await api.uploadTestHierarchyFiles([
        { id: StorageNode.generateId(), path: `${TEST_DIR}/d1/file1.txt`, contentType: 'text/plain', data: 'test' },
        { id: StorageNode.generateId(), path: `${TEST_DIR}/d1/file2.txt`, contentType: 'text/plain', data: 'test' },
        { id: StorageNode.generateId(), path: `${TEST_DIR}/d1/file3.txt`, contentType: 'text/plain', data: 'test' },
        { id: StorageNode.generateId(), path: `${TEST_DIR}/d1/file4.txt`, contentType: 'text/plain', data: 'test' },
        { id: StorageNode.generateId(), path: `${TEST_DIR}/d1/file5.txt`, contentType: 'text/plain', data: 'test' },
      ])

      await api.removeStorageDir(`${TEST_DIR}/d1`)

      const d1_and_descendants = (await api.getStorageDirDescendants(`${TEST_DIR}/d1`)).list
      expect(d1_and_descendants.length).toBe(0)
    })
  })

  describe('removeStorageFile', () => {
    it('疎通確認', async () => {
      const { api } = provideDependency()
      api.setTestAuthToken(AppAdminToken())

      const uploadItem = { id: StorageNode.generateId(), path: `${TEST_DIR}/d1/fileA.txt`, contentType: 'text/plain', data: 'test' }
      await api.uploadTestHierarchyFiles([uploadItem])

      const actual = (await api.removeStorageFile(uploadItem.path))!

      expect(actual.path).toBe(`${TEST_DIR}/d1/fileA.txt`)
    })
  })

  describe('moveStorageDir', () => {
    it('疎通確認', async () => {
      const { api } = provideDependency()
      api.setTestAuthToken(AppAdminToken())

      await api.createStorageHierarchicalDirs([
        `${TEST_DIR}/d1/d11`,
        `${TEST_DIR}/d1/d12`,
        `${TEST_DIR}/d1/d13`,
        `${TEST_DIR}/d1/d14`,
        `${TEST_DIR}/d1/d15`,
        `${TEST_DIR}/d2`,
      ])

      await api.moveStorageDir(`${TEST_DIR}/d1`, `${TEST_DIR}/d2/d1`)

      const d1_and_descendants = (await api.getStorageDirDescendants(`${TEST_DIR}/d2/d1`)).list
      StorageUtil.sortNodes(d1_and_descendants)
      expect(d1_and_descendants.length).toBe(6)
      expect(d1_and_descendants[0].path).toBe(`${TEST_DIR}/d2/d1`)
      expect(d1_and_descendants[1].path).toBe(`${TEST_DIR}/d2/d1/d11`)
      expect(d1_and_descendants[2].path).toBe(`${TEST_DIR}/d2/d1/d12`)
      expect(d1_and_descendants[3].path).toBe(`${TEST_DIR}/d2/d1/d13`)
      expect(d1_and_descendants[4].path).toBe(`${TEST_DIR}/d2/d1/d14`)
      expect(d1_and_descendants[5].path).toBe(`${TEST_DIR}/d2/d1/d15`)
    })
  })

  describe('moveStorageFile', () => {
    it('疎通確認', async () => {
      const { api } = provideDependency()
      api.setTestAuthToken(AppAdminToken())

      await api.createStorageHierarchicalDirs([`${TEST_DIR}/d1`, `${TEST_DIR}/d2`])
      await api.uploadTestHierarchyFiles([
        { id: StorageNode.generateId(), path: `${TEST_DIR}/d1/fileA.txt`, contentType: 'text/plain', data: 'test' },
      ])

      const actual = await api.moveStorageFile(`${TEST_DIR}/d1/fileA.txt`, `${TEST_DIR}/d2/fileA.txt`)

      expect(actual.path).toBe(`${TEST_DIR}/d2/fileA.txt`)
    })
  })

  describe('renameStorageDir', () => {
    it('疎通確認', async () => {
      const { api } = provideDependency()
      api.setTestAuthToken(AppAdminToken())

      await api.createStorageHierarchicalDirs([
        `${TEST_DIR}/d1/d11`,
        `${TEST_DIR}/d1/d12`,
        `${TEST_DIR}/d1/d13`,
        `${TEST_DIR}/d1/d14`,
        `${TEST_DIR}/d1/d15`,
      ])

      await await api.renameStorageDir(`${TEST_DIR}/d1`, `d2`)

      const d2_and_descendants = (await api.getStorageDirDescendants(`${TEST_DIR}/d2`)).list
      StorageUtil.sortNodes(d2_and_descendants)
      expect(d2_and_descendants.length).toBe(6)
      expect(d2_and_descendants[0].path).toBe(`${TEST_DIR}/d2`)
      expect(d2_and_descendants[1].path).toBe(`${TEST_DIR}/d2/d11`)
      expect(d2_and_descendants[2].path).toBe(`${TEST_DIR}/d2/d12`)
      expect(d2_and_descendants[3].path).toBe(`${TEST_DIR}/d2/d13`)
      expect(d2_and_descendants[4].path).toBe(`${TEST_DIR}/d2/d14`)
      expect(d2_and_descendants[5].path).toBe(`${TEST_DIR}/d2/d15`)
    })
  })

  describe('renameStorageFile', () => {
    it('疎通確認', async () => {
      const { api } = provideDependency()
      api.setTestAuthToken(AppAdminToken())

      await api.createStorageHierarchicalDirs([`${TEST_DIR}/d1`])
      await api.uploadTestHierarchyFiles([
        { id: StorageNode.generateId(), path: `${TEST_DIR}/d1/fileA.txt`, contentType: 'text/plain', data: 'test' },
      ])

      const actual = await api.renameStorageFile(`${TEST_DIR}/d1/fileA.txt`, `fileB.txt`)

      expect(actual.path).toBe(`${TEST_DIR}/d1/fileB.txt`)
    })
  })

  describe('setStorageDirShareSettings', () => {
    it('疎通確認', async () => {
      const { api } = provideDependency()
      api.setTestAuthToken(AppAdminToken())
      await api.createStorageHierarchicalDirs([`${TEST_DIR}/dir1`])
      await api.uploadTestHierarchyFiles([
        { id: StorageNode.generateId(), path: `${TEST_DIR}/dir1/fileA.txt`, contentType: 'text/plain', data: 'test' },
      ])

      const actual = await api.setStorageDirShareSettings(`${TEST_DIR}/dir1`, { isPublic: true, readUIds: ['ichiro'], writeUIds: ['ichiro'] })

      expect(actual.path).toBe(`${TEST_DIR}/dir1`)
      expect(actual.share).toMatchObject<StorageNodeShareSettings>({ isPublic: true, readUIds: ['ichiro'], writeUIds: ['ichiro'] })
    })
  })

  describe('setStorageFileShareSettings', () => {
    it('疎通確認', async () => {
      const { api } = provideDependency()
      api.setTestAuthToken(AppAdminToken())
      await api.createStorageHierarchicalDirs([`${TEST_DIR}/dir1`])
      await api.uploadTestHierarchyFiles([
        { id: StorageNode.generateId(), path: `${TEST_DIR}/dir1/fileA.txt`, contentType: 'text/plain', data: 'test' },
      ])

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

  describe('createArticleTypeDir', () => {
    let articleRootPath: string
    let bundle: APIStorageNode

    async function setupArticleNodes(): Promise<void> {
      const { api } = provideDependency()
      api.setTestAuthToken(GeneralToken())

      articleRootPath = StorageUtil.toArticleRootPath(GeneralToken().uid)
      await api.createStorageHierarchicalDirs([articleRootPath])

      bundle = await api.createArticleTypeDir({
        dir: `${articleRootPath}`,
        name: 'バンドル',
        type: StorageArticleDirType.TreeBundle,
      })
    }

    it('疎通確認 - カテゴリディレクトリ', async () => {
      // ユーザーの記事ルートを事前に作成
      await setupArticleNodes()

      const { api } = provideDependency()
      api.setTestAuthToken(GeneralToken())

      const actual = await api.createArticleTypeDir({
        dir: `${bundle.path}`,
        name: 'カテゴリ1',
        type: StorageArticleDirType.Category,
      })

      expect(actual.path).toBe(`${actual.dir}/${actual.name}`)
      expect(actual.article?.dir?.name).toBe('カテゴリ1')
      expect(actual.article?.dir?.type).toBe(StorageArticleDirType.Category)
      expect(typeof actual.article?.dir?.sortOrder === 'number').toBeTruthy()
      expect(actual.article?.file).toBeUndefined()
    })

    it('疎通確認 - 記事ディレクトリ', async () => {
      // ユーザーの記事ルートを事前に作成
      await setupArticleNodes()

      const { api } = provideDependency()
      api.setTestAuthToken(GeneralToken())

      const actual = await api.createArticleTypeDir({
        dir: `${bundle.path}`,
        name: '記事1',
        type: StorageArticleDirType.Article,
      })

      expect(actual.path).toBe(`${actual.dir}/${actual.name}`)
      expect(actual.article?.dir?.name).toBe('記事1')
      expect(actual.article?.dir?.type).toBe(StorageArticleDirType.Article)
      expect(typeof actual.article?.dir?.sortOrder === 'number').toBeTruthy()
      expect(actual.article?.file).toBeUndefined()

      // 記事ソースファイルが作成されていることを検証
      const masterFileNode = (await api.getStorageChildren(actual.path)).list.find(
        node => node.article?.file?.type === StorageArticleFileType.Master
      )!
      expect(masterFileNode.article?.file?.type).toBe(StorageArticleFileType.Master)
      expect(masterFileNode.article?.dir).toBeUndefined()

      // 下書きファイルが作成されていることを検証
      const draftFileNode = (await api.getStorageChildren(actual.path)).list.find(node => node.article?.file?.type === StorageArticleFileType.Draft)!
      expect(draftFileNode.article?.file?.type).toBe(StorageArticleFileType.Draft)
      expect(draftFileNode.article?.dir).toBeUndefined()
    })
  })

  describe('createArticleGeneralDir', () => {
    let articleRootPath: string
    let bundle: APIStorageNode
    let art1: APIStorageNode

    async function setupArticleNodes(): Promise<void> {
      const { api } = provideDependency()
      api.setTestAuthToken(GeneralToken())

      articleRootPath = StorageUtil.toArticleRootPath(GeneralToken().uid)
      await api.createStorageHierarchicalDirs([articleRootPath])

      bundle = await api.createArticleTypeDir({
        dir: `${articleRootPath}`,
        name: 'バンドル',
        type: StorageArticleDirType.ListBundle,
      })

      art1 = await api.createArticleTypeDir({
        dir: `${bundle.path}`,
        name: '記事1',
        type: StorageArticleDirType.Article,
      })
    }

    it('疎通確認', async () => {
      // ユーザーの記事ルートを事前に作成
      await setupArticleNodes()

      const { api } = provideDependency()
      api.setTestAuthToken(GeneralToken())

      const tmpPath = `${art1.path}/tmp`
      const actual = await api.createArticleGeneralDir(tmpPath)

      expect(actual.path).toBe(tmpPath)
      expect(actual.article).toBeUndefined()
    })
  })

  describe('renameArticleDir', () => {
    let articleRootPath: string
    let bundle: APIStorageNode

    async function setupArticleNodes(): Promise<void> {
      const { api } = provideDependency()
      api.setTestAuthToken(GeneralToken())

      articleRootPath = StorageUtil.toArticleRootPath(GeneralToken().uid)
      await api.createStorageHierarchicalDirs([articleRootPath])

      bundle = await api.createArticleTypeDir({
        dir: `${articleRootPath}`,
        name: 'バンドル',
        type: StorageArticleDirType.ListBundle,
      })
    }

    it('疎通確認', async () => {
      // ユーザーの記事ルートを事前に作成
      await setupArticleNodes()

      const { api } = provideDependency()
      api.setTestAuthToken(GeneralToken())

      const actual = await api.renameArticleDir(`${bundle.path}`, 'Bundle')

      const expected: APIStorageNode = { ...bundle }
      expected.article!.dir!.name = 'Bundle'
      expected.version = bundle.version + 1
      expect(actual).toEqual(expected)
    })
  })

  describe('setArticleSortOrder', () => {
    let articleRootPath: string
    let bundle: APIStorageNode

    async function setupArticleNodes(): Promise<void> {
      const { api } = provideDependency()
      api.setTestAuthToken(GeneralToken())

      articleRootPath = StorageUtil.toArticleRootPath(GeneralToken().uid)
      await api.createStorageHierarchicalDirs([articleRootPath])

      bundle = await api.createArticleTypeDir({
        dir: `${articleRootPath}`,
        name: 'バンドル',
        type: StorageArticleDirType.ListBundle,
      })
    }

    it('疎通確認', async () => {
      // ユーザーの記事ルートを事前に作成
      await setupArticleNodes()

      const { api } = provideDependency()
      api.setTestAuthToken(GeneralToken())

      // 記事を作成
      const art1 = await api.createArticleTypeDir({
        dir: `${bundle.path}`,
        name: '記事1',
        type: StorageArticleDirType.Article,
      })
      const art2 = await api.createArticleTypeDir({
        dir: `${bundle.path}`,
        name: '記事2',
        type: StorageArticleDirType.Article,
      })

      await api.setArticleSortOrder([art1.path, art2.path])

      const bundle_children = (await api.getStorageChildren(bundle.path)).list
      const [_art1, _art2] = StorageUtil.sortNodes(bundle_children)
      expect(_art1.path).toBe(art1.path)
      expect(_art1.article?.dir?.sortOrder).toBe(2)
      expect(_art2.path).toBe(art2.path)
      expect(_art2.article?.dir?.sortOrder).toBe(1)
    })
  })

  describe('saveArticleSrcMasterFile', () => {
    let articleRootPath: string
    let bundle: APIStorageNode
    let art1: APIStorageNode
    let art1_master: APIStorageNode
    let art1_draft: APIStorageNode

    async function setupArticleNodes(): Promise<void> {
      const { api } = provideDependency()
      api.setTestAuthToken(GeneralToken())

      articleRootPath = StorageUtil.toArticleRootPath(GeneralToken().uid)
      await api.createStorageHierarchicalDirs([articleRootPath])

      bundle = await api.createArticleTypeDir({
        dir: `${articleRootPath}`,
        name: 'バンドル',
        type: StorageArticleDirType.ListBundle,
      })

      art1 = await api.createArticleTypeDir({
        dir: `${bundle.path}`,
        name: '記事1',
        type: StorageArticleDirType.Article,
      })

      art1_master = (await api.getStorageNode({
        path: StorageUtil.toArticleSrcMasterPath(art1.path),
      }))!

      art1_draft = (await api.getStorageNode({
        path: StorageUtil.toArticleSrcDraftPath(art1.path),
      }))!
    }

    it('疎通確認', async () => {
      await setupArticleNodes()

      const { api } = provideDependency()
      api.setTestAuthToken(GeneralToken())

      const srcContent = '#header1'
      const textContent = 'header1'
      const actual = await api.saveArticleSrcMasterFile(art1.path, srcContent, textContent)

      const { master, draft } = actual
      // ソースファイル
      expect(master.id).toBe(art1_master.id)
      expect(master.size).toBe(Buffer.byteLength(srcContent))
      expect(master.updatedAt.isAfter(art1_master.updatedAt)).toBeTruthy()
      expect(master.version).toBe(art1_master.version + 1)
      // 下書きファイル
      expect(draft.id).toBe(art1_draft.id)
      expect(draft.size).toBe(0)
      expect(draft.updatedAt.isAfter(art1_draft.updatedAt)).toBeTruthy()
      expect(draft.version).toBe(art1_draft.version + 1)
    })
  })

  describe('saveArticleSrcDraftFile', () => {
    let articleRootPath: string
    let bundle: APIStorageNode
    let art1: APIStorageNode
    let art1_draft: APIStorageNode

    async function setupArticleNodes(): Promise<void> {
      const { api } = provideDependency()
      api.setTestAuthToken(GeneralToken())

      articleRootPath = StorageUtil.toArticleRootPath(GeneralToken().uid)
      await api.createStorageHierarchicalDirs([articleRootPath])

      bundle = await api.createArticleTypeDir({
        dir: `${articleRootPath}`,
        name: 'バンドル',
        type: StorageArticleDirType.ListBundle,
      })

      art1 = await api.createArticleTypeDir({
        dir: `${bundle.path}`,
        name: '記事1',
        type: StorageArticleDirType.Article,
      })

      art1_draft = (await api.getStorageNode({
        path: StorageUtil.toArticleSrcDraftPath(art1.path),
      }))!
    }

    it('疎通確認', async () => {
      await setupArticleNodes()

      const { api } = provideDependency()
      api.setTestAuthToken(GeneralToken())

      const srcContent = '#header1'
      const actual = await api.saveArticleSrcDraftFile(art1.path, srcContent)

      expect(actual.id).toBe(art1_draft.id)
      expect(actual.size).toBe(Buffer.byteLength(srcContent))
      expect(actual.updatedAt.isAfter(art1_draft.updatedAt)).toBeTruthy()
      expect(actual.version).toBe(art1_draft.version + 1)
    })
  })

  describe('getArticleChildren', () => {
    let articleRootPath: string
    let bundle: APIStorageNode
    let art1: APIStorageNode
    let art2: APIStorageNode
    let art3: APIStorageNode

    async function setupArticleNodes(): Promise<void> {
      const { api } = provideDependency()
      api.setTestAuthToken(GeneralToken())

      articleRootPath = StorageUtil.toArticleRootPath(GeneralToken().uid)
      await api.createStorageHierarchicalDirs([articleRootPath])

      bundle = await api.createArticleTypeDir({
        dir: `${articleRootPath}`,
        name: 'バンドル',
        type: StorageArticleDirType.ListBundle,
      })

      art1 = await api.createArticleTypeDir({
        dir: `${bundle.path}`,
        name: '記事1',
        type: StorageArticleDirType.Article,
      })
      art2 = await api.createArticleTypeDir({
        dir: `${bundle.path}`,
        name: '記事2',
        type: StorageArticleDirType.Article,
      })
      art3 = await api.createArticleTypeDir({
        dir: `${bundle.path}`,
        name: '記事3',
        type: StorageArticleDirType.Article,
      })
    }

    it('疎通確認 - ページングなし', async () => {
      await setupArticleNodes()

      const { api } = provideDependency()
      api.setTestAuthToken(GeneralToken())

      const actual = await api.getArticleChildren(`${bundle.path}`, [StorageArticleDirType.Article])

      expect(actual.nextPageToken).toBeUndefined()
      expect(actual.isPaginationTimeout).toBeFalsy()
      expect(actual.list.length).toBe(3)
      expect(actual.list[0].path).toBe(`${art3.path}`)
      expect(actual.list[1].path).toBe(`${art2.path}`)
      expect(actual.list[2].path).toBe(`${art1.path}`)
    })

    it('疎通確認 - ページングあり', async () => {
      await setupArticleNodes()

      const { api } = provideDependency()
      api.setTestAuthToken(GeneralToken())

      const actual = await api.callStoragePaginationAPI(api.getArticleChildren, `${bundle.path}`, [StorageArticleDirType.Article], { maxChunk: 2 })

      expect(actual.length).toBe(3)
      expect(actual[0].path).toBe(`${art3.path}`)
      expect(actual[1].path).toBe(`${art2.path}`)
      expect(actual[2].path).toBe(`${art1.path}`)
    })
  })
})
