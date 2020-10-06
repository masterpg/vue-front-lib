import { APIStorageNode, CartItemAddInput, CartItemEditResponse, CartItemUpdateInput } from '@/example/logic/api'
import { APP_ADMIN_TOKEN, GENERAL_TOKEN, GENERAL_USER } from '../../../../../helpers/example/data'
import {
  AuthStatus,
  CartItem,
  Product,
  PublicProfile,
  StorageArticleNodeType,
  StorageNodeShareSettings,
  UserInfo,
  UserInfoInput,
} from '@/example/logic'
import { RawCartItem, RawProduct } from '@/example/logic/api/gql'
import { OmitEntityTimestamp } from '@/firestore-ex'
import { TestAppAPIContainer } from '../../../../../mocks/example/logic/api'
import { cloneDeep } from 'lodash'
import { config } from '@/example/config'
import dayjs from 'dayjs'
import { initExampleTest } from '../../../../../helpers/example/init'
import { sleep } from 'web-base-lib'
import { sortStorageTree } from '@/example/logic/base'

//========================================================================
//
//  Test data
//
//========================================================================

interface TestAuthData extends OmitEntityTimestamp<Omit<UserInfo, 'publicProfile'>> {
  publicProfile: OmitEntityTimestamp<PublicProfile>
}

const TEST_DIR = 'test'

const RAW_PRODUCTS: RawProduct[] = [
  { id: 'product1', title: 'iPad 4 Mini', price: 500.01, stock: 3, createdAt: '2020-01-01T00:00:00.000Z', updatedAt: '2020-01-02T00:00:00.000Z' },
  { id: 'product2', title: 'Fire HD 8 Tablet', price: 80.99, stock: 5, createdAt: '2020-01-01T00:00:00.000Z', updatedAt: '2020-01-02T00:00:00.000Z' },
  { id: 'product3', title: 'MediaPad T5 10', price: 150.8, stock: 10, createdAt: '2020-01-01T00:00:00.000Z', updatedAt: '2020-01-02T00:00:00.000Z' },
]

const PRODUCTS: Product[] = RAW_PRODUCTS.map(apiProduct => {
  const { createdAt, updatedAt, ...body } = apiProduct
  return {
    ...body,
    createdAt: dayjs(createdAt),
    updatedAt: dayjs(updatedAt),
  }
})

const RAW_CART_ITEMS: RawCartItem[] = [
  {
    id: 'cartItem1',
    uid: GENERAL_TOKEN.uid,
    productId: 'product1',
    title: 'iPad 4 Mini',
    price: 500.01,
    quantity: 1,
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2020-01-02T00:00:00.000Z',
  },
  {
    id: 'cartItem2',
    uid: GENERAL_TOKEN.uid,
    productId: 'product2',
    title: 'Fire HD 8 Tablet',
    price: 80.99,
    quantity: 2,
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2020-01-02T00:00:00.000Z',
  },
]

const CART_ITEMS: CartItem[] = RAW_CART_ITEMS.map(apiCartItem => {
  const { createdAt, updatedAt, ...body } = apiCartItem
  return {
    ...body,
    createdAt: dayjs(createdAt),
    updatedAt: dayjs(updatedAt),
  }
})

//========================================================================
//
//  Test helpers
//
//========================================================================

let api!: TestAppAPIContainer

function getAPIErrorResponse(error: any): { statusCode: number; error: string; message: string } {
  return error.graphQLErrors[0].extensions.exception.response
}

//========================================================================
//
//  Tests
//
//========================================================================

beforeAll(async () => {
  api = new TestAppAPIContainer()
  await initExampleTest({ api })
})

beforeEach(async () => {
  api.clearTestAuthUser()
})

describe('Foundation API', () => {
  describe('getAppConfig', () => {
    it('疎通確認', async () => {
      const actual = await api.getAppConfig()

      expect(actual.user).toMatchObject(config.storage.user)
      expect(actual.article).toMatchObject(config.storage.article)
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

      sortStorageTree(actual.list)
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

      sortStorageTree(actual)
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

      sortStorageTree(actual.list)
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

      sortStorageTree(actual)
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

      sortStorageTree(actual.list)
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

      sortStorageTree(actual)
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

      sortStorageTree(actual.list)
      expect(actual.nextPageToken).toBeUndefined()
      expect(actual.list.length).toBe(3)
      expect(actual.list[0].path).toBe(`${TEST_DIR}/d1/d11`)
      expect(actual.list[1].path).toBe(`${TEST_DIR}/d1/fileA.txt`)
      expect(actual.list[2].path).toBe(`${TEST_DIR}/d1/fileB.txt`)
    })

    it('疎通確認 - ページングあり', async () => {
      api.setTestAuthToken(APP_ADMIN_TOKEN)

      const actual = await api.callStoragePaginationAPI(api.getStorageChildren, `${TEST_DIR}/d1`, { maxChunk: 2 })

      sortStorageTree(actual)
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

      sortStorageTree(actual)
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

      sortStorageTree(actual)
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

      sortStorageTree(actual)
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

      sortStorageTree(actual)
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

      sortStorageTree(actual)
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

      sortStorageTree(actual)
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

  describe('createArticleTypeDir', () => {
    let articleRootPath: string

    async function setupArticleNodes(): Promise<void> {
      api.setTestAuthToken(GENERAL_TOKEN)
      articleRootPath = `${config.storage.user.rootName}/${GENERAL_TOKEN.uid}/${config.storage.article.rootName}`
      await api.createStorageHierarchicalDirs([articleRootPath])
    }

    it('疎通確認', async () => {
      // ユーザーの記事ルートを事前に作成
      await setupArticleNodes()

      const actual = await api.createArticleTypeDir({
        dir: `${articleRootPath}`,
        articleNodeName: 'バンドル',
        articleNodeType: StorageArticleNodeType.ListBundle,
      })

      expect(actual.path).toBe(`${actual.dir}/${actual.name}`)
      expect(actual.articleNodeName).toBe('バンドル')
      expect(actual.articleNodeType).toBe(StorageArticleNodeType.ListBundle)
      expect(typeof actual.articleSortOrder === 'number').toBeTruthy()
    })
  })

  describe('createArticleGeneralDir', () => {
    let articleRootPath: string
    let bundle: APIStorageNode
    let art1: APIStorageNode

    async function setupArticleNodes(): Promise<void> {
      api.setTestAuthToken(GENERAL_TOKEN)
      articleRootPath = `${config.storage.user.rootName}/${GENERAL_TOKEN.uid}/${config.storage.article.rootName}`
      await api.createStorageHierarchicalDirs([articleRootPath])
      bundle = await api.createArticleTypeDir({
        dir: `${articleRootPath}`,
        articleNodeName: 'バンドル',
        articleNodeType: StorageArticleNodeType.ListBundle,
      })
      art1 = await api.createArticleTypeDir({
        dir: `${bundle.path}`,
        articleNodeName: '記事1',
        articleNodeType: StorageArticleNodeType.Article,
      })
    }

    it('疎通確認', async () => {
      // ユーザーの記事ルートを事前に作成
      await setupArticleNodes()

      const tmpPath = `${art1.path}/tmp`
      const actual = await api.createArticleGeneralDir(tmpPath)

      expect(actual.path).toBe(tmpPath)
      expect(actual.articleNodeName).toBeNull()
      expect(actual.articleNodeType).toBeNull()
      expect(actual.articleSortOrder).toBeNull()
    })
  })

  describe('renameArticleNode', () => {
    let articleRootPath: string
    let bundle: APIStorageNode

    async function setupArticleNodes(): Promise<void> {
      api.setTestAuthToken(GENERAL_TOKEN)
      articleRootPath = `${config.storage.user.rootName}/${GENERAL_TOKEN.uid}/${config.storage.article.rootName}`
      await api.createStorageHierarchicalDirs([articleRootPath])
      bundle = await api.createArticleTypeDir({
        dir: `${articleRootPath}`,
        articleNodeName: 'バンドル',
        articleNodeType: StorageArticleNodeType.ListBundle,
      })
    }

    it('疎通確認', async () => {
      // ユーザーの記事ルートを事前に作成
      await setupArticleNodes()

      const actual = await api.renameArticleNode(`${bundle.path}`, 'Bundle')

      const expectBundle: APIStorageNode = {
        ...bundle,
        articleNodeName: 'Bundle',
        version: bundle.version + 1,
      }

      expect(actual).toEqual(expectBundle)
    })
  })

  describe('setArticleSortOrder', () => {
    let articleRootPath: string
    let bundle: APIStorageNode

    async function setupArticleNodes(): Promise<void> {
      api.setTestAuthToken(GENERAL_TOKEN)
      articleRootPath = `${config.storage.user.rootName}/${GENERAL_TOKEN.uid}/${config.storage.article.rootName}`
      await api.createStorageHierarchicalDirs([articleRootPath])
      bundle = await api.createArticleTypeDir({
        dir: `${articleRootPath}`,
        articleNodeName: 'バンドル',
        articleNodeType: StorageArticleNodeType.ListBundle,
      })
    }

    it('疎通確認', async () => {
      // ユーザーの記事ルートを事前に作成
      await setupArticleNodes()
      // 記事を作成
      const art1 = await api.createArticleTypeDir({
        dir: `${bundle.path}`,
        articleNodeName: '記事1',
        articleNodeType: StorageArticleNodeType.Article,
      })
      const art2 = await api.createArticleTypeDir({
        dir: `${bundle.path}`,
        articleNodeName: '記事2',
        articleNodeType: StorageArticleNodeType.Article,
      })

      const actual = await api.setArticleSortOrder(`${art1.path}`, {
        insertAfterNodePath: `${art2.path}`,
      })

      expect(actual.path).toBe(`${art1.path}`)
      expect(actual.articleSortOrder! < art2.articleSortOrder!).toBeTruthy()
    })
  })

  describe('getArticleChildren', () => {
    let articleRootPath: string
    let bundle: APIStorageNode
    let art1: APIStorageNode
    let art2: APIStorageNode
    let art3: APIStorageNode

    async function setupArticleNodes(): Promise<void> {
      api.setTestAuthToken(GENERAL_TOKEN)
      articleRootPath = `${config.storage.user.rootName}/${GENERAL_TOKEN.uid}/${config.storage.article.rootName}`
      await api.createStorageHierarchicalDirs([articleRootPath])
      bundle = await api.createArticleTypeDir({
        dir: `${articleRootPath}`,
        articleNodeName: 'バンドル',
        articleNodeType: StorageArticleNodeType.ListBundle,
      })
      art1 = await api.createArticleTypeDir({
        dir: `${bundle.path}`,
        articleNodeName: '記事1',
        articleNodeType: StorageArticleNodeType.Article,
      })
      art2 = await api.createArticleTypeDir({
        dir: `${bundle.path}`,
        articleNodeName: '記事2',
        articleNodeType: StorageArticleNodeType.Article,
      })
      art3 = await api.createArticleTypeDir({
        dir: `${bundle.path}`,
        articleNodeName: '記事3',
        articleNodeType: StorageArticleNodeType.Article,
      })
    }

    it('疎通確認 - ページングなし', async () => {
      await setupArticleNodes()

      const actual = await api.getArticleChildren(`${bundle.path}`, [StorageArticleNodeType.Article])

      expect(actual.nextPageToken).toBeUndefined()
      expect(actual.list.length).toBe(3)
      expect(actual.list[0].path).toBe(`${art3.path}`)
      expect(actual.list[1].path).toBe(`${art2.path}`)
      expect(actual.list[2].path).toBe(`${art1.path}`)
    })

    it('疎通確認 - ページングあり', async () => {
      await setupArticleNodes()

      const actual = await api.callStoragePaginationAPI(api.getArticleChildren, `${bundle.path}`, [StorageArticleNodeType.Article], { maxChunk: 2 })

      expect(actual.length).toBe(3)
      expect(actual[0].path).toBe(`${art3.path}`)
      expect(actual[1].path).toBe(`${art2.path}`)
      expect(actual[2].path).toBe(`${art1.path}`)
    })
  })
})

describe('Product API', () => {
  describe('getProduct', () => {
    it('疎通確認', async () => {
      await api.putTestStoreData([{ collectionName: 'products', collectionRecords: RAW_PRODUCTS }])
      const product = PRODUCTS[0]

      const actual = await api.getProduct(product.id)

      expect(actual).toMatchObject(product)
    })

    it('存在しない商品IDを指定した場合', async () => {
      await api.putTestStoreData([{ collectionName: 'products', collectionRecords: RAW_PRODUCTS }])
      const actual = await api.getProduct('productXXX')

      expect(actual).toBeUndefined()
    })
  })

  describe('getProducts', () => {
    it('疎通確認', async () => {
      await api.putTestStoreData([{ collectionName: 'products', collectionRecords: RAW_PRODUCTS }])
      const ids = [PRODUCTS[0].id, PRODUCTS[1].id]

      const actual = await api.getProducts(ids)

      expect(actual).toMatchObject([PRODUCTS[0], PRODUCTS[1]])
    })

    it('存在しない商品IDを指定した場合', async () => {
      await api.putTestStoreData([{ collectionName: 'products', collectionRecords: RAW_PRODUCTS }])
      const ids = ['productXXX', 'productYYY']

      const actual = await api.getProducts(ids)

      expect(actual.length).toBe(0)
    })
  })
})

describe('Cart API', () => {
  describe('getCartItem', () => {
    it('疎通確認', async () => {
      api.setTestAuthToken(GENERAL_TOKEN)
      await api.putTestStoreData([
        { collectionName: 'products', collectionRecords: RAW_PRODUCTS },
        { collectionName: 'cart', collectionRecords: RAW_CART_ITEMS },
      ])
      const cartItem = CART_ITEMS[0]

      const actual = await api.getCartItem(cartItem.id)

      expect(actual).toMatchObject(cartItem)
    })

    it('存在しないカートアイテムIDを指定した場合', async () => {
      api.setTestAuthToken(GENERAL_TOKEN)
      await api.putTestStoreData([
        { collectionName: 'products', collectionRecords: RAW_PRODUCTS },
        { collectionName: 'cart', collectionRecords: RAW_CART_ITEMS },
      ])
      const actual = await api.getCartItem('cartItemXXX')

      expect(actual).toBeUndefined()
    })

    it('サインインしていない場合', async () => {
      const cartItem = CART_ITEMS[0]

      let actual!: Error
      try {
        await api.getCartItem(cartItem.id)
      } catch (err) {
        actual = err
      }

      expect(getAPIErrorResponse(actual).statusCode).toBe(401)
    })
  })

  describe('getCartItems', () => {
    it('疎通確認', async () => {
      api.setTestAuthToken(GENERAL_TOKEN)
      await api.putTestStoreData([
        { collectionName: 'products', collectionRecords: RAW_PRODUCTS },
        { collectionName: 'cart', collectionRecords: RAW_CART_ITEMS },
      ])
      const ids = [CART_ITEMS[0].id, CART_ITEMS[1].id]

      const actual = await api.getCartItems(ids)

      expect(actual).toMatchObject([CART_ITEMS[0], CART_ITEMS[1]])
    })

    it('存在しない商品IDを指定した場合', async () => {
      api.setTestAuthToken(GENERAL_TOKEN)
      await api.putTestStoreData([
        { collectionName: 'products', collectionRecords: RAW_PRODUCTS },
        { collectionName: 'cart', collectionRecords: RAW_CART_ITEMS },
      ])
      const ids = ['cartItemXXX', 'cartItemYYY']

      const actual = await api.getCartItems(ids)

      expect(actual.length).toBe(0)
    })

    it('サインインしていない場合', async () => {
      const ids = [CART_ITEMS[0].id, CART_ITEMS[1].id]

      let actual!: Error
      try {
        await api.getCartItems(ids)
      } catch (err) {
        actual = err
      }

      expect(getAPIErrorResponse(actual).statusCode).toBe(401)
    })
  })

  describe('addCartItems', () => {
    const ADD_CART_ITEMS = cloneDeep(CART_ITEMS).map(item => {
      const { id, uid, createdAt, updatedAt, ...body } = item
      return body
    }) as CartItemAddInput[]

    it('疎通確認', async () => {
      api.setTestAuthToken(GENERAL_TOKEN)
      await api.putTestStoreData([
        { collectionName: 'products', collectionRecords: RAW_PRODUCTS },
        { collectionName: 'cart', collectionRecords: [] },
      ])
      const addItems = cloneDeep(ADD_CART_ITEMS)
      const expectedItems = addItems.map(addItem => {
        const product = PRODUCTS.find(product => product.id === addItem.productId)!
        return {
          ...addItem,
          product: {
            id: product.id,
            stock: product.stock - addItem.quantity,
          },
        }
      }) as CartItemEditResponse[]

      const actual = await api.addCartItems(addItems)

      expect(actual.length).toBe(addItems.length)
      for (let i = 0; i < actual.length; i++) {
        const actualItem = actual[i]
        expect(actualItem.id).toEqual(expect.anything())
        expect(actualItem.uid).toBe(GENERAL_TOKEN.uid)
        expect(actualItem).toMatchObject(expectedItems[i])
      }
    })

    it('サインインしていない場合', async () => {
      const addItems = cloneDeep(ADD_CART_ITEMS) as CartItemAddInput[]

      let actual!: Error
      try {
        await api.addCartItems(addItems)
      } catch (err) {
        actual = err
      }

      expect(getAPIErrorResponse(actual).statusCode).toBe(401)
    })
  })

  describe('updateCartItems', () => {
    it('疎通確認', async () => {
      api.setTestAuthToken(GENERAL_TOKEN)
      await api.putTestStoreData([
        { collectionName: 'products', collectionRecords: RAW_PRODUCTS },
        { collectionName: 'cart', collectionRecords: RAW_CART_ITEMS },
      ])
      const updateItems = CART_ITEMS.map(item => {
        return { ...item, quantity: item.quantity + 1 }
      })
      const expectedItems = updateItems.map(item => {
        const product = PRODUCTS.find(product => product.id === item.productId)!
        const { createdAt, updatedAt, ...itemBody } = item
        return { ...itemBody, product: { id: product.id, stock: product.stock - 1 } }
      })

      const actual = await api.updateCartItems(updateItems)

      expect(actual.length).toBe(updateItems.length)
      for (let i = 0; i < actual.length; i++) {
        expect(actual[i]).toMatchObject(expectedItems[i])
      }
    })

    it('サインインしていない場合', async () => {
      const updateItems = cloneDeep(CART_ITEMS) as CartItemUpdateInput[]

      let actual!: Error
      try {
        await api.updateCartItems(updateItems)
      } catch (err) {
        actual = err
      }

      expect(getAPIErrorResponse(actual).statusCode).toBe(401)
    })
  })

  describe('removeCartItems', () => {
    it('疎通確認', async () => {
      api.setTestAuthToken(GENERAL_TOKEN)
      await api.putTestStoreData([
        { collectionName: 'products', collectionRecords: RAW_PRODUCTS },
        { collectionName: 'cart', collectionRecords: RAW_CART_ITEMS },
      ])
      const removeIds = CART_ITEMS.map(item => item.id) as string[]
      const expectedItems = removeIds.map(id => {
        const cartItem = CART_ITEMS.find(item => item.id === id)!
        const product = PRODUCTS.find(product => product.id === cartItem.productId)!
        const { createdAt, updatedAt, ...cartItemBody } = cartItem
        return {
          ...cartItemBody,
          quantity: 0,
          product: {
            id: product.id,
            stock: product.stock + cartItem.quantity,
          },
        }
      })

      const actual = await api.removeCartItems(removeIds)

      expect(actual.length).toBe(removeIds.length)
      for (let i = 0; i < actual.length; i++) {
        expect(actual[i]).toMatchObject(expectedItems[i])
      }
    })

    it('サインインしていない場合', async () => {
      const removeIds = CART_ITEMS.map(item => item.id)

      let actual!: Error
      try {
        await api.removeCartItems(removeIds)
      } catch (err) {
        actual = err
      }

      expect(getAPIErrorResponse(actual).statusCode).toBe(401)
    })
  })

  describe('checkout', () => {
    it('ベーシックケース', async () => {
      api.setTestAuthToken(GENERAL_TOKEN)
      await api.putTestStoreData([
        { collectionName: 'products', collectionRecords: RAW_PRODUCTS },
        { collectionName: 'cart', collectionRecords: RAW_CART_ITEMS },
      ])

      const actual = await api.checkoutCart()

      expect(actual).toBeTruthy()
      // カートアイテムが削除されてることを検証
      const cartItems = await api.getCartItems()
      expect(cartItems.length).toBe(0)
    })

    it('サインインしていない場合', async () => {
      const removeIds = CART_ITEMS.map(item => item.id)

      let actual!: Error
      try {
        await api.removeCartItems(removeIds)
      } catch (err) {
        actual = err
      }

      expect(getAPIErrorResponse(actual).statusCode).toBe(401)
    })
  })
})
