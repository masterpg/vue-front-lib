import { APP_ADMIN_TOKEN, GENERAL_TOKEN, GENERAL_USER } from '../../../../../helpers/common/data'
import { AuthStatus, PublicProfile, StorageNodeShareSettings, UserInfo, UserInfoInput } from '@/lib'
import { OmitEntityTimestamp } from '@/firestore-ex'
import { TestLibAPIContainer } from '../../../../../mocks/lib/logic/api'
import { initLibTest } from '../../../../../helpers/lib/init'
import { isEmpty } from 'lodash'

//========================================================================
//
//  Test data
//
//========================================================================

interface TestAuthData extends OmitEntityTimestamp<Omit<UserInfo, 'publicProfile'>> {
  publicProfile: OmitEntityTimestamp<PublicProfile>
}

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
      api.setTestAuthToken(GENERAL_TOKEN)

      const actual = await api.getCustomToken()

      expect(isEmpty(actual)).toBeFalsy()
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
        myDirName: GENERAL_USER.customClaims!.myDirName,
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
        myDirName: GENERAL_USER.customClaims!.myDirName,
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
    await api.removeUserBaseTestDir(GENERAL_TOKEN)
    await api.removeTestDir([TEST_FILES_DIR])

    // Cloud Storageで短い間隔のノード追加・削除を行うとエラーが発生するので間隔調整している
    await sleep(2500)
  })

  //--------------------------------------------------
  //  Storage (User)
  //--------------------------------------------------

  describe('getUserStorageNode', () => {
    beforeEach(async () => {
      await api.uploadTestUserFiles(GENERAL_TOKEN, [{ filePath: `d1/d11/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])
    })

    it('疎通確認 - 対象ノードあり', async () => {
      api.setTestAuthToken(GENERAL_TOKEN)

      const actual = (await api.getUserStorageNode(`d1/d11`))!

      expect(actual.path).toBe(`d1/d11`)
    })

    it('疎通確認 - 対象ノードなし', async () => {
      api.setTestAuthToken(GENERAL_TOKEN)

      const actual = (await api.getUserStorageNode(`d1/dXX`))!

      expect(actual).toBeUndefined()
    })
  })

  describe('getUserStorageDirDescendants', () => {
    beforeEach(async () => {
      await api.uploadTestUserFiles(GENERAL_TOKEN, [
        { filePath: `d1/fileA.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `d1/d11/fileB.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `d1/d11/d111/fileC.txt`, fileData: 'test', contentType: 'text/plain' },
      ])
    })

    it('疎通確認 - ページングなし', async () => {
      api.setTestAuthToken(GENERAL_TOKEN)

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
      api.setTestAuthToken(GENERAL_TOKEN)

      const actual = await api.callStoragePaginationAPI(api.getUserStorageDirDescendants, { maxChunk: 2 }, `d1`)

      expect(actual.length).toBe(6)
      expect(actual[0].path).toBe(`d1`)
      expect(actual[1].path).toBe(`d1/d11`)
      expect(actual[2].path).toBe(`d1/d11/d111`)
      expect(actual[3].path).toBe(`d1/d11/d111/fileC.txt`)
      expect(actual[4].path).toBe(`d1/d11/fileB.txt`)
      expect(actual[5].path).toBe(`d1/fileA.txt`)
    })
  })

  describe('getUserStorageDescendants', () => {
    beforeEach(async () => {
      await api.uploadTestUserFiles(GENERAL_TOKEN, [
        { filePath: `d1/fileA.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `d1/d11/fileB.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `d1/d11/d111/fileC.txt`, fileData: 'test', contentType: 'text/plain' },
      ])
    })

    it('疎通確認 - ページングなし', async () => {
      api.setTestAuthToken(GENERAL_TOKEN)

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
      api.setTestAuthToken(GENERAL_TOKEN)

      const actual = await api.callStoragePaginationAPI(api.getUserStorageDescendants, { maxChunk: 2 }, `d1`)

      expect(actual.length).toBe(5)
      expect(actual[0].path).toBe(`d1/d11`)
      expect(actual[1].path).toBe(`d1/d11/d111`)
      expect(actual[2].path).toBe(`d1/d11/d111/fileC.txt`)
      expect(actual[3].path).toBe(`d1/d11/fileB.txt`)
      expect(actual[4].path).toBe(`d1/fileA.txt`)
    })
  })

  describe('getUserStorageDirChildren', () => {
    beforeEach(async () => {
      await api.uploadTestUserFiles(GENERAL_TOKEN, [
        { filePath: `d1/fileA.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `d1/fileB.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `d1/d11/fileC.txt`, fileData: 'test', contentType: 'text/plain' },
      ])
    })

    it('疎通確認 - ページングなし', async () => {
      api.setTestAuthToken(GENERAL_TOKEN)

      const actual = await api.getUserStorageDirChildren(null, `d1`)

      expect(actual.nextPageToken).toBeUndefined()
      expect(actual.list.length).toBe(4)
      expect(actual.list[0].path).toBe(`d1`)
      expect(actual.list[1].path).toBe(`d1/d11`)
      expect(actual.list[2].path).toBe(`d1/fileA.txt`)
      expect(actual.list[3].path).toBe(`d1/fileB.txt`)
    })

    it('疎通確認 - ページングあり', async () => {
      api.setTestAuthToken(GENERAL_TOKEN)

      const actual = await api.callStoragePaginationAPI(api.getUserStorageDirChildren, { maxChunk: 2 }, `d1`)

      expect(actual.length).toBe(4)
      expect(actual[0].path).toBe(`d1`)
      expect(actual[1].path).toBe(`d1/d11`)
      expect(actual[2].path).toBe(`d1/fileA.txt`)
      expect(actual[3].path).toBe(`d1/fileB.txt`)
    })
  })

  describe('getUserStorageChildren', () => {
    beforeEach(async () => {
      await api.uploadTestUserFiles(GENERAL_TOKEN, [
        { filePath: `d1/fileA.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `d1/fileB.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `d1/d11/fileC.txt`, fileData: 'test', contentType: 'text/plain' },
      ])
    })

    it('疎通確認 - ページングなし', async () => {
      api.setTestAuthToken(GENERAL_TOKEN)

      const actual = await api.getUserStorageChildren(null, `d1`)

      expect(actual.nextPageToken).toBeUndefined()
      expect(actual.list.length).toBe(3)
      expect(actual.list[0].path).toBe(`d1/d11`)
      expect(actual.list[1].path).toBe(`d1/fileA.txt`)
      expect(actual.list[2].path).toBe(`d1/fileB.txt`)
    })

    it('疎通確認 - ページングあり', async () => {
      api.setTestAuthToken(GENERAL_TOKEN)

      const actual = await api.callStoragePaginationAPI(api.getUserStorageChildren, { maxChunk: 2 }, `d1`)

      expect(actual.length).toBe(3)
      expect(actual[0].path).toBe(`d1/d11`)
      expect(actual[1].path).toBe(`d1/fileA.txt`)
      expect(actual[2].path).toBe(`d1/fileB.txt`)
    })
  })

  describe('getUserStorageHierarchicalNodes', () => {
    beforeEach(async () => {
      await api.uploadTestUserFiles(GENERAL_TOKEN, [{ filePath: `d1/d11/d111/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])
    })

    it('疎通確認', async () => {
      api.setTestAuthToken(GENERAL_TOKEN)

      const actual = await api.getUserStorageHierarchicalNodes(`d1/d11/d111/fileA.txt`)

      expect(actual.length).toBe(4)
      expect(actual[0].path).toBe(`d1`)
      expect(actual[1].path).toBe(`d1/d11`)
      expect(actual[2].path).toBe(`d1/d11/d111`)
      expect(actual[3].path).toBe(`d1/d11/d111/fileA.txt`)
    })
  })

  describe('getUserStorageAncestorDirs', () => {
    beforeEach(async () => {
      await api.uploadTestUserFiles(GENERAL_TOKEN, [{ filePath: `d1/d11/d111/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])
    })

    it('疎通確認', async () => {
      api.setTestAuthToken(GENERAL_TOKEN)

      const actual = await api.getUserStorageAncestorDirs(`d1/d11/d111/fileA.txt`)

      expect(actual.length).toBe(3)
      expect(actual[0].path).toBe(`d1`)
      expect(actual[1].path).toBe(`d1/d11`)
      expect(actual[2].path).toBe(`d1/d11/d111`)
    })
  })

  describe('handleUploadedUserFile', () => {
    it('疎通確認', async () => {
      api.setTestAuthToken(GENERAL_TOKEN)

      await api.createUserStorageDirs([`docs`])
      await api.uploadTestUserFiles(GENERAL_TOKEN, [{ filePath: `docs/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])

      const actual = await api.handleUploadedUserFile(`docs/fileA.txt`)

      expect(actual.path).toBe(`docs/fileA.txt`)
    })
  })

  describe('createUserStorageDirs', () => {
    it('疎通確認', async () => {
      api.setTestAuthToken(GENERAL_TOKEN)

      const actual = await api.createUserStorageDirs([`d1/d11`])

      expect(actual.length).toBe(2)
      expect(actual[0].path).toBe(`d1`)
      expect(actual[1].path).toBe(`d1/d11`)
    })
  })

  describe('removeUserStorageDir', () => {
    it('疎通確認 - ページングなし', async () => {
      api.setTestAuthToken(GENERAL_TOKEN)

      await api.uploadTestUserFiles(GENERAL_TOKEN, [
        { filePath: `d1/file1.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `d1/file2.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `d1/file3.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `d1/file4.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `d1/file5.txt`, fileData: 'test', contentType: 'text/plain' },
      ])

      const actual = (await api.removeUserStorageDir(null, `d1`)).list

      expect(actual.length).toBe(6)
      expect(actual[0].path).toBe(`d1`)
      expect(actual[1].path).toBe(`d1/file1.txt`)
      expect(actual[2].path).toBe(`d1/file2.txt`)
      expect(actual[3].path).toBe(`d1/file3.txt`)
      expect(actual[4].path).toBe(`d1/file4.txt`)
      expect(actual[5].path).toBe(`d1/file5.txt`)
    })

    it('疎通確認 - ページングあり', async () => {
      api.setTestAuthToken(GENERAL_TOKEN)

      await api.uploadTestUserFiles(GENERAL_TOKEN, [
        { filePath: `d1/file1.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `d1/file2.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `d1/file3.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `d1/file4.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `d1/file5.txt`, fileData: 'test', contentType: 'text/plain' },
      ])

      const actual = await api.callStoragePaginationAPI(api.removeUserStorageDir, { maxChunk: 2 }, `d1`)

      expect(actual.length).toBe(6)
      expect(actual[0].path).toBe(`d1`)
      expect(actual[1].path).toBe(`d1/file1.txt`)
      expect(actual[2].path).toBe(`d1/file2.txt`)
      expect(actual[3].path).toBe(`d1/file3.txt`)
      expect(actual[4].path).toBe(`d1/file4.txt`)
      expect(actual[5].path).toBe(`d1/file5.txt`)
    })
  })

  describe('removeUserStorageFile', () => {
    it('疎通確認', async () => {
      api.setTestAuthToken(GENERAL_TOKEN)

      await api.uploadTestUserFiles(GENERAL_TOKEN, [{ filePath: `d1/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])

      const actual = (await api.removeUserStorageFile(`d1/fileA.txt`))!

      expect(actual.path).toBe(`d1/fileA.txt`)
    })
  })

  describe('moveUserStorageDir', () => {
    it('疎通確認 - ページングなし', async () => {
      api.setTestAuthToken(GENERAL_TOKEN)

      await api.createUserStorageDirs([`d1/d11`, `d1/d12`, `d1/d13`, `d1/d14`, `d1/d15`, `d2`])

      const actual = (await api.moveUserStorageDir(null, `d1`, `d2/d1`)).list

      expect(actual.length).toBe(6)
      expect(actual[0].path).toBe(`d2/d1`)
      expect(actual[1].path).toBe(`d2/d1/d11`)
      expect(actual[2].path).toBe(`d2/d1/d12`)
      expect(actual[3].path).toBe(`d2/d1/d13`)
      expect(actual[4].path).toBe(`d2/d1/d14`)
      expect(actual[5].path).toBe(`d2/d1/d15`)
    })

    it('疎通確認 - ページングあり', async () => {
      api.setTestAuthToken(GENERAL_TOKEN)

      await api.createUserStorageDirs([`d1/d11`, `d1/d12`, `d1/d13`, `d1/d14`, `d1/d15`, `d2`])

      const actual = await api.callStoragePaginationAPI(api.moveUserStorageDir, { maxChunk: 2 }, `d1`, `d2/d1`)

      expect(actual.length).toBe(6)
      expect(actual[0].path).toBe(`d2/d1`)
      expect(actual[1].path).toBe(`d2/d1/d11`)
      expect(actual[2].path).toBe(`d2/d1/d12`)
      expect(actual[3].path).toBe(`d2/d1/d13`)
      expect(actual[4].path).toBe(`d2/d1/d14`)
      expect(actual[5].path).toBe(`d2/d1/d15`)
    })
  })

  describe('moveUserStorageFile', () => {
    it('疎通確認', async () => {
      api.setTestAuthToken(GENERAL_TOKEN)

      await api.createUserStorageDirs([`d1`, `d2`])
      await api.uploadTestUserFiles(GENERAL_TOKEN, [{ filePath: `d1/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])

      const actual = await api.moveUserStorageFile(`d1/fileA.txt`, `d2/fileA.txt`)

      expect(actual.path).toBe(`d2/fileA.txt`)
    })
  })

  describe('renameUserStorageDir', () => {
    it('疎通確認 - ページングなし', async () => {
      api.setTestAuthToken(GENERAL_TOKEN)

      await api.createUserStorageDirs([`d1/d11`, `d1/d12`, `d1/d13`, `d1/d14`, `d1/d15`])

      const actual = (await api.renameUserStorageDir(null, `d1`, `d2`)).list

      expect(actual.length).toBe(6)
      expect(actual[0].path).toBe(`d2`)
      expect(actual[1].path).toBe(`d2/d11`)
      expect(actual[2].path).toBe(`d2/d12`)
      expect(actual[3].path).toBe(`d2/d13`)
      expect(actual[4].path).toBe(`d2/d14`)
      expect(actual[5].path).toBe(`d2/d15`)
    })

    it('疎通確認 - ページングあり', async () => {
      api.setTestAuthToken(GENERAL_TOKEN)

      await api.createUserStorageDirs([`d1/d11`, `d1/d12`, `d1/d13`, `d1/d14`, `d1/d15`])

      const actual = await api.callStoragePaginationAPI(api.renameUserStorageDir, { maxChunk: 2 }, `d1`, `d2`)

      expect(actual.length).toBe(6)
      expect(actual[0].path).toBe(`d2`)
      expect(actual[1].path).toBe(`d2/d11`)
      expect(actual[2].path).toBe(`d2/d12`)
      expect(actual[3].path).toBe(`d2/d13`)
      expect(actual[4].path).toBe(`d2/d14`)
      expect(actual[5].path).toBe(`d2/d15`)
    })
  })

  describe('renameUserStorageFile', () => {
    it('疎通確認', async () => {
      api.setTestAuthToken(GENERAL_TOKEN)

      await api.createUserStorageDirs([`d1`])
      await api.uploadTestUserFiles(GENERAL_TOKEN, [{ filePath: `d1/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])

      const actual = await api.renameUserStorageFile(`d1/fileA.txt`, `fileB.txt`)

      expect(actual.path).toBe(`d1/fileB.txt`)
    })
  })

  describe('setUserStorageDirShareSettings', () => {
    it('疎通確認', async () => {
      api.setTestAuthToken(GENERAL_TOKEN)

      await api.createUserStorageDirs([`d1`])
      await api.uploadTestUserFiles(GENERAL_TOKEN, [{ filePath: `d1/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])

      const actual = await api.setUserStorageDirShareSettings(`d1`, { isPublic: true, readUIds: ['ichiro'], writeUIds: ['ichiro'] })

      expect(actual.path).toBe(`d1`)
      expect(actual.share).toMatchObject<StorageNodeShareSettings>({ isPublic: true, readUIds: ['ichiro'], writeUIds: ['ichiro'] })
    })
  })

  describe('setUserStorageFileShareSettings', () => {
    it('疎通確認', async () => {
      api.setTestAuthToken(GENERAL_TOKEN)

      await api.createUserStorageDirs([`d1`])
      await api.uploadTestUserFiles(GENERAL_TOKEN, [{ filePath: `d1/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])

      const actual = await api.setUserStorageFileShareSettings(`d1/fileA.txt`, { isPublic: true, readUIds: ['ichiro'], writeUIds: ['ichiro'] })

      expect(actual.path).toBe(`d1/fileA.txt`)
    })
  })

  //--------------------------------------------------
  //  Storage (Application)
  //--------------------------------------------------

  describe('getStorageNode', () => {
    beforeEach(async () => {
      await api.uploadTestFiles([{ filePath: `${TEST_FILES_DIR}/d1/d11/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])
    })

    it('疎通確認 - 対象ノードあり', async () => {
      api.setTestAuthToken(APP_ADMIN_TOKEN)

      const actual = (await api.getStorageNode(`${TEST_FILES_DIR}/d1/d11`))!

      expect(actual.path).toBe(`${TEST_FILES_DIR}/d1/d11`)
    })

    it('疎通確認 - 対象ノードなし', async () => {
      api.setTestAuthToken(APP_ADMIN_TOKEN)

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

      api.setTestAuthToken(APP_ADMIN_TOKEN)

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
      api.setTestAuthToken(APP_ADMIN_TOKEN)

      const actual = await api.callStoragePaginationAPI(api.getStorageDirDescendants, { maxChunk: 2 }, `${TEST_FILES_DIR}/d1`)

      expect(actual.length).toBe(6)
      expect(actual[0].path).toBe(`${TEST_FILES_DIR}/d1`)
      expect(actual[1].path).toBe(`${TEST_FILES_DIR}/d1/d11`)
      expect(actual[2].path).toBe(`${TEST_FILES_DIR}/d1/d11/d111`)
      expect(actual[3].path).toBe(`${TEST_FILES_DIR}/d1/d11/d111/fileC.txt`)
      expect(actual[4].path).toBe(`${TEST_FILES_DIR}/d1/d11/fileB.txt`)
      expect(actual[5].path).toBe(`${TEST_FILES_DIR}/d1/fileA.txt`)
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
      api.setTestAuthToken(APP_ADMIN_TOKEN)

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
      api.setTestAuthToken(APP_ADMIN_TOKEN)

      const actual = await api.callStoragePaginationAPI(api.getStorageDescendants, { maxChunk: 2 }, `${TEST_FILES_DIR}/d1`)

      expect(actual.length).toBe(5)
      expect(actual[0].path).toBe(`${TEST_FILES_DIR}/d1/d11`)
      expect(actual[1].path).toBe(`${TEST_FILES_DIR}/d1/d11/d111`)
      expect(actual[2].path).toBe(`${TEST_FILES_DIR}/d1/d11/d111/fileC.txt`)
      expect(actual[3].path).toBe(`${TEST_FILES_DIR}/d1/d11/fileB.txt`)
      expect(actual[4].path).toBe(`${TEST_FILES_DIR}/d1/fileA.txt`)
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
      api.setTestAuthToken(APP_ADMIN_TOKEN)

      const actual = await api.getStorageDirChildren(null, `${TEST_FILES_DIR}/d1`)

      expect(actual.nextPageToken).toBeUndefined()
      expect(actual.list.length).toBe(4)
      expect(actual.list[0].path).toBe(`${TEST_FILES_DIR}/d1`)
      expect(actual.list[1].path).toBe(`${TEST_FILES_DIR}/d1/d11`)
      expect(actual.list[2].path).toBe(`${TEST_FILES_DIR}/d1/fileA.txt`)
      expect(actual.list[3].path).toBe(`${TEST_FILES_DIR}/d1/fileB.txt`)
    })

    it('疎通確認 - ページングあり', async () => {
      api.setTestAuthToken(APP_ADMIN_TOKEN)

      const actual = await api.callStoragePaginationAPI(api.getStorageDirChildren, { maxChunk: 2 }, `${TEST_FILES_DIR}/d1`)

      expect(actual.length).toBe(4)
      expect(actual[0].path).toBe(`${TEST_FILES_DIR}/d1`)
      expect(actual[1].path).toBe(`${TEST_FILES_DIR}/d1/d11`)
      expect(actual[2].path).toBe(`${TEST_FILES_DIR}/d1/fileA.txt`)
      expect(actual[3].path).toBe(`${TEST_FILES_DIR}/d1/fileB.txt`)
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
      api.setTestAuthToken(APP_ADMIN_TOKEN)

      const actual = await api.getStorageChildren(null, `${TEST_FILES_DIR}/d1`)

      expect(actual.nextPageToken).toBeUndefined()
      expect(actual.list.length).toBe(3)
      expect(actual.list[0].path).toBe(`${TEST_FILES_DIR}/d1/d11`)
      expect(actual.list[1].path).toBe(`${TEST_FILES_DIR}/d1/fileA.txt`)
      expect(actual.list[2].path).toBe(`${TEST_FILES_DIR}/d1/fileB.txt`)
    })

    it('疎通確認 - ページングあり', async () => {
      api.setTestAuthToken(APP_ADMIN_TOKEN)

      const actual = await api.callStoragePaginationAPI(api.getStorageChildren, { maxChunk: 2 }, `${TEST_FILES_DIR}/d1`)

      expect(actual.length).toBe(3)
      expect(actual[0].path).toBe(`${TEST_FILES_DIR}/d1/d11`)
      expect(actual[1].path).toBe(`${TEST_FILES_DIR}/d1/fileA.txt`)
      expect(actual[2].path).toBe(`${TEST_FILES_DIR}/d1/fileB.txt`)
    })
  })

  describe('getStorageHierarchicalNodes', () => {
    beforeEach(async () => {
      await api.uploadTestFiles([{ filePath: `${TEST_FILES_DIR}/d1/d11/d111/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])
    })

    it('疎通確認', async () => {
      api.setTestAuthToken(APP_ADMIN_TOKEN)

      const actual = await api.getStorageHierarchicalNodes(`${TEST_FILES_DIR}/d1/d11/d111/fileA.txt`)

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
      api.setTestAuthToken(APP_ADMIN_TOKEN)

      const actual = await api.getStorageAncestorDirs(`${TEST_FILES_DIR}/d1/d11/d111/fileA.txt`)

      expect(actual.length).toBe(4)
      expect(actual[0].path).toBe(`${TEST_FILES_DIR}`)
      expect(actual[1].path).toBe(`${TEST_FILES_DIR}/d1`)
      expect(actual[2].path).toBe(`${TEST_FILES_DIR}/d1/d11`)
      expect(actual[3].path).toBe(`${TEST_FILES_DIR}/d1/d11/d111`)
    })
  })

  describe('handleUploadedFile', () => {
    it('疎通確認', async () => {
      api.setTestAuthToken(APP_ADMIN_TOKEN)
      await api.createStorageDirs([`${TEST_FILES_DIR}/docs`])
      await api.uploadTestFiles([{ filePath: `${TEST_FILES_DIR}/docs/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])

      const actual = await api.handleUploadedFile(`${TEST_FILES_DIR}/docs/fileA.txt`)

      expect(actual.path).toBe(`${TEST_FILES_DIR}/docs/fileA.txt`)
    })
  })

  describe('createStorageDirs', () => {
    it('疎通確認', async () => {
      api.setTestAuthToken(APP_ADMIN_TOKEN)

      const actual = await api.createStorageDirs([`${TEST_FILES_DIR}/d1/d11`])

      expect(actual.length).toBe(3)
      expect(actual[0].path).toBe(`${TEST_FILES_DIR}`)
      expect(actual[1].path).toBe(`${TEST_FILES_DIR}/d1`)
      expect(actual[2].path).toBe(`${TEST_FILES_DIR}/d1/d11`)
    })
  })

  describe('removeStorageDir', () => {
    it('疎通確認 - ページングなし', async () => {
      api.setTestAuthToken(APP_ADMIN_TOKEN)

      await api.uploadTestFiles([
        { filePath: `${TEST_FILES_DIR}/d1/file1.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `${TEST_FILES_DIR}/d1/file2.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `${TEST_FILES_DIR}/d1/file3.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `${TEST_FILES_DIR}/d1/file4.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `${TEST_FILES_DIR}/d1/file5.txt`, fileData: 'test', contentType: 'text/plain' },
      ])

      const actual = (await api.removeStorageDir(null, `${TEST_FILES_DIR}/d1`)).list

      expect(actual.length).toBe(6)
      expect(actual[0].path).toBe(`${TEST_FILES_DIR}/d1`)
      expect(actual[1].path).toBe(`${TEST_FILES_DIR}/d1/file1.txt`)
      expect(actual[2].path).toBe(`${TEST_FILES_DIR}/d1/file2.txt`)
      expect(actual[3].path).toBe(`${TEST_FILES_DIR}/d1/file3.txt`)
      expect(actual[4].path).toBe(`${TEST_FILES_DIR}/d1/file4.txt`)
      expect(actual[5].path).toBe(`${TEST_FILES_DIR}/d1/file5.txt`)
    })

    it('疎通確認 - ページングあり', async () => {
      api.setTestAuthToken(APP_ADMIN_TOKEN)

      await api.uploadTestFiles([
        { filePath: `${TEST_FILES_DIR}/d1/file1.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `${TEST_FILES_DIR}/d1/file2.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `${TEST_FILES_DIR}/d1/file3.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `${TEST_FILES_DIR}/d1/file4.txt`, fileData: 'test', contentType: 'text/plain' },
        { filePath: `${TEST_FILES_DIR}/d1/file5.txt`, fileData: 'test', contentType: 'text/plain' },
      ])

      const actual = await api.callStoragePaginationAPI(api.removeStorageDir, { maxChunk: 2 }, `${TEST_FILES_DIR}/d1`)

      expect(actual.length).toBe(6)
      expect(actual[0].path).toBe(`${TEST_FILES_DIR}/d1`)
      expect(actual[1].path).toBe(`${TEST_FILES_DIR}/d1/file1.txt`)
      expect(actual[2].path).toBe(`${TEST_FILES_DIR}/d1/file2.txt`)
      expect(actual[3].path).toBe(`${TEST_FILES_DIR}/d1/file3.txt`)
      expect(actual[4].path).toBe(`${TEST_FILES_DIR}/d1/file4.txt`)
      expect(actual[5].path).toBe(`${TEST_FILES_DIR}/d1/file5.txt`)
    })
  })

  describe('removeStorageFile', () => {
    it('疎通確認', async () => {
      api.setTestAuthToken(APP_ADMIN_TOKEN)

      await api.uploadTestFiles([{ filePath: `${TEST_FILES_DIR}/d1/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])

      const actual = (await api.removeStorageFile(`${TEST_FILES_DIR}/d1/fileA.txt`))!

      expect(actual.path).toBe(`${TEST_FILES_DIR}/d1/fileA.txt`)
    })
  })

  describe('moveStorageDir', () => {
    it('疎通確認 - ページングなし', async () => {
      api.setTestAuthToken(APP_ADMIN_TOKEN)

      await api.createStorageDirs([
        `${TEST_FILES_DIR}/d1/d11`,
        `${TEST_FILES_DIR}/d1/d12`,
        `${TEST_FILES_DIR}/d1/d13`,
        `${TEST_FILES_DIR}/d1/d14`,
        `${TEST_FILES_DIR}/d1/d15`,
        `${TEST_FILES_DIR}/d2`,
      ])

      const actual = (await api.moveStorageDir(null, `${TEST_FILES_DIR}/d1`, `${TEST_FILES_DIR}/d2/d1`)).list

      expect(actual.length).toBe(6)
      expect(actual[0].path).toBe(`${TEST_FILES_DIR}/d2/d1`)
      expect(actual[1].path).toBe(`${TEST_FILES_DIR}/d2/d1/d11`)
      expect(actual[2].path).toBe(`${TEST_FILES_DIR}/d2/d1/d12`)
      expect(actual[3].path).toBe(`${TEST_FILES_DIR}/d2/d1/d13`)
      expect(actual[4].path).toBe(`${TEST_FILES_DIR}/d2/d1/d14`)
      expect(actual[5].path).toBe(`${TEST_FILES_DIR}/d2/d1/d15`)
    })

    it('疎通確認 - ページングあり', async () => {
      api.setTestAuthToken(APP_ADMIN_TOKEN)

      await api.createStorageDirs([
        `${TEST_FILES_DIR}/d1/d11`,
        `${TEST_FILES_DIR}/d1/d12`,
        `${TEST_FILES_DIR}/d1/d13`,
        `${TEST_FILES_DIR}/d1/d14`,
        `${TEST_FILES_DIR}/d1/d15`,
        `${TEST_FILES_DIR}/d2`,
      ])

      const actual = await api.callStoragePaginationAPI(api.moveStorageDir, { maxChunk: 2 }, `${TEST_FILES_DIR}/d1`, `${TEST_FILES_DIR}/d2/d1`)

      expect(actual.length).toBe(6)
      expect(actual[0].path).toBe(`${TEST_FILES_DIR}/d2/d1`)
      expect(actual[1].path).toBe(`${TEST_FILES_DIR}/d2/d1/d11`)
      expect(actual[2].path).toBe(`${TEST_FILES_DIR}/d2/d1/d12`)
      expect(actual[3].path).toBe(`${TEST_FILES_DIR}/d2/d1/d13`)
      expect(actual[4].path).toBe(`${TEST_FILES_DIR}/d2/d1/d14`)
      expect(actual[5].path).toBe(`${TEST_FILES_DIR}/d2/d1/d15`)
    })
  })

  describe('moveStorageFile', () => {
    it('疎通確認', async () => {
      api.setTestAuthToken(APP_ADMIN_TOKEN)

      await api.createStorageDirs([`${TEST_FILES_DIR}/d1`, `${TEST_FILES_DIR}/d2`])
      await api.uploadTestFiles([{ filePath: `${TEST_FILES_DIR}/d1/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])

      const actual = await api.moveStorageFile(`${TEST_FILES_DIR}/d1/fileA.txt`, `${TEST_FILES_DIR}/d2/fileA.txt`)

      expect(actual.path).toBe(`${TEST_FILES_DIR}/d2/fileA.txt`)
    })
  })

  describe('renameStorageDir', () => {
    it('疎通確認 - ページングなし', async () => {
      api.setTestAuthToken(APP_ADMIN_TOKEN)

      await api.createStorageDirs([
        `${TEST_FILES_DIR}/d1/d11`,
        `${TEST_FILES_DIR}/d1/d12`,
        `${TEST_FILES_DIR}/d1/d13`,
        `${TEST_FILES_DIR}/d1/d14`,
        `${TEST_FILES_DIR}/d1/d15`,
      ])

      const actual = (await api.renameStorageDir(null, `${TEST_FILES_DIR}/d1`, `d2`)).list

      expect(actual.length).toBe(6)
      expect(actual[0].path).toBe(`${TEST_FILES_DIR}/d2`)
      expect(actual[1].path).toBe(`${TEST_FILES_DIR}/d2/d11`)
      expect(actual[2].path).toBe(`${TEST_FILES_DIR}/d2/d12`)
      expect(actual[3].path).toBe(`${TEST_FILES_DIR}/d2/d13`)
      expect(actual[4].path).toBe(`${TEST_FILES_DIR}/d2/d14`)
      expect(actual[5].path).toBe(`${TEST_FILES_DIR}/d2/d15`)
    })

    it('疎通確認 - ページングあり', async () => {
      api.setTestAuthToken(APP_ADMIN_TOKEN)

      await api.createStorageDirs([
        `${TEST_FILES_DIR}/d1/d11`,
        `${TEST_FILES_DIR}/d1/d12`,
        `${TEST_FILES_DIR}/d1/d13`,
        `${TEST_FILES_DIR}/d1/d14`,
        `${TEST_FILES_DIR}/d1/d15`,
      ])

      const actual = await api.callStoragePaginationAPI(api.renameStorageDir, { maxChunk: 2 }, `${TEST_FILES_DIR}/d1`, `d2`)

      expect(actual.length).toBe(6)
      expect(actual[0].path).toBe(`${TEST_FILES_DIR}/d2`)
      expect(actual[1].path).toBe(`${TEST_FILES_DIR}/d2/d11`)
      expect(actual[2].path).toBe(`${TEST_FILES_DIR}/d2/d12`)
      expect(actual[3].path).toBe(`${TEST_FILES_DIR}/d2/d13`)
      expect(actual[4].path).toBe(`${TEST_FILES_DIR}/d2/d14`)
      expect(actual[5].path).toBe(`${TEST_FILES_DIR}/d2/d15`)
    })
  })

  describe('renameStorageFile', () => {
    it('疎通確認', async () => {
      api.setTestAuthToken(APP_ADMIN_TOKEN)

      await api.createStorageDirs([`${TEST_FILES_DIR}/d1`])
      await api.uploadTestFiles([{ filePath: `${TEST_FILES_DIR}/d1/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])

      const actual = await api.renameStorageFile(`${TEST_FILES_DIR}/d1/fileA.txt`, `fileB.txt`)

      expect(actual.path).toBe(`${TEST_FILES_DIR}/d1/fileB.txt`)
    })
  })

  describe('setStorageDirShareSettings', () => {
    it('疎通確認', async () => {
      api.setTestAuthToken(APP_ADMIN_TOKEN)
      await api.createStorageDirs([`${TEST_FILES_DIR}/dir1`])
      await api.uploadTestFiles([{ filePath: `${TEST_FILES_DIR}/dir1/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])

      const actual = await api.setStorageDirShareSettings(`${TEST_FILES_DIR}/dir1`, { isPublic: true, readUIds: ['ichiro'], writeUIds: ['ichiro'] })

      expect(actual.path).toBe(`${TEST_FILES_DIR}/dir1`)
      expect(actual.share).toMatchObject<StorageNodeShareSettings>({ isPublic: true, readUIds: ['ichiro'], writeUIds: ['ichiro'] })
    })
  })

  describe('setStorageFileShareSettings', () => {
    it('疎通確認', async () => {
      api.setTestAuthToken(APP_ADMIN_TOKEN)
      await api.createStorageDirs([`${TEST_FILES_DIR}/dir1`])
      await api.uploadTestFiles([{ filePath: `${TEST_FILES_DIR}/dir1/fileA.txt`, fileData: 'test', contentType: 'text/plain' }])

      const actual = await api.setStorageFileShareSettings(`${TEST_FILES_DIR}/dir1/fileA.txt`, {
        isPublic: true,
        readUIds: ['ichiro'],
        writeUIds: ['ichiro'],
      })

      expect(actual.path).toBe(`${TEST_FILES_DIR}/dir1/fileA.txt`)
    })
  })
})
