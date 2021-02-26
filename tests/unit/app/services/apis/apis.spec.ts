import {
  APIStorageNode,
  AuthStatus,
  OmitTimestamp,
  SetUserInfoResultStatus,
  StorageArticleDirType,
  StorageArticleFileType,
  StorageNode,
  StorageNodeKeyInput,
  StorageNodeShareSettings,
  StorageUtil,
  User,
  UserInput,
} from '@/app/services'
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

describe('Storage API', () => {
  beforeAll(async () => {
    const { apis } = provideDependency()

    // テストユーザーを登録
    await apis.setTestUsers(GeneralUser())
  })

  beforeEach(async () => {
    const { apis } = provideDependency()
    await apis.removeTestUserDir(GeneralToken())
    await apis.removeTestDir([TEST_DIR])

    // Cloud Storageで短い間隔のノード追加・削除を行うとエラーが発生するので間隔調整している
    await sleep(1500)
  })

  describe('getStorageNode', () => {
    beforeEach(async () => {
      const { apis } = provideDependency()
      await apis.uploadTestHierarchyFiles([
        {
          id: StorageNode.generateId(),
          path: `${TEST_DIR}/d1/d11/fileA.txt`,
          contentType: 'text/plain',
          data: 'test',
        },
      ])
    })

    it('疎通確認 - 対象ノードあり', async () => {
      const { apis } = provideDependency()
      apis.setTestAuthToken(AppAdminToken())

      const actual = (await apis.getStorageNode({ path: `${TEST_DIR}/d1/d11` }))!

      expect(actual.path).toBe(`${TEST_DIR}/d1/d11`)
    })

    it('疎通確認 - 対象ノードなし', async () => {
      const { apis } = provideDependency()
      apis.setTestAuthToken(AppAdminToken())

      const actual = (await apis.getStorageNode({ path: `${TEST_DIR}/d1/dXX` }))!

      expect(actual).toBeUndefined()
    })
  })

  describe('getStorageNodes', () => {
    beforeEach(async () => {
      const { apis } = provideDependency()
      await apis.uploadTestHierarchyFiles([{ id: StorageNode.generateId(), path: `${TEST_DIR}/fileA.txt`, contentType: 'text/plain', data: 'test' }])
    })

    it('疎通確認', async () => {
      const { apis } = provideDependency()
      apis.setTestAuthToken(AppAdminToken())

      const [testDir, fileA] = (await apis.getStorageDescendants({ path: `${TEST_DIR}`, includeBase: true })).list

      const actual = await apis.getStorageNodes({ ids: [testDir.id], paths: [fileA.path] })

      expect(actual[0].path).toBe(`${TEST_DIR}`)
      expect(actual[1].path).toBe(`${TEST_DIR}/fileA.txt`)
    })
  })

  describe('getStorageDescendants', () => {
    beforeEach(async () => {
      const { apis } = provideDependency()
      await apis.uploadTestHierarchyFiles([
        { id: StorageNode.generateId(), path: `${TEST_DIR}/d1/fileA.txt`, contentType: 'text/plain', data: 'test' },
        { id: StorageNode.generateId(), path: `${TEST_DIR}/d1/d11/fileB.txt`, contentType: 'text/plain', data: 'test' },
        { id: StorageNode.generateId(), path: `${TEST_DIR}/d1/d11/d111/fileC.txt`, contentType: 'text/plain', data: 'test' },
      ])
    })

    it('疎通確認 - ページングなし', async () => {
      const { apis } = provideDependency()
      apis.setTestAuthToken(AppAdminToken())

      const actual = await apis.getStorageDescendants({ path: `${TEST_DIR}/d1`, includeBase: true })

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
      const { apis } = provideDependency()
      apis.setTestAuthToken(AppAdminToken())

      const actual = await apis.callStoragePaginationAPI(apis.getStorageDescendants, { path: `${TEST_DIR}/d1`, includeBase: true }, { maxChunk: 2 })

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

  describe('getStorageDirChildren', () => {
    beforeEach(async () => {
      const { apis } = provideDependency()
      await apis.uploadTestHierarchyFiles([
        { id: StorageNode.generateId(), path: `${TEST_DIR}/d1/fileA.txt`, contentType: 'text/plain', data: 'test' },
        { id: StorageNode.generateId(), path: `${TEST_DIR}/d1/fileB.txt`, contentType: 'text/plain', data: 'test' },
        { id: StorageNode.generateId(), path: `${TEST_DIR}/d1/d11/fileC.txt`, contentType: 'text/plain', data: 'test' },
      ])
    })

    it('疎通確認 - ページングなし', async () => {
      const { apis } = provideDependency()
      apis.setTestAuthToken(AppAdminToken())

      const actual = await apis.getStorageChildren({ path: `${TEST_DIR}/d1`, includeBase: true })

      StorageUtil.sortNodes(actual.list)
      expect(actual.nextPageToken).toBeUndefined()
      expect(actual.list.length).toBe(4)
      expect(actual.list[0].path).toBe(`${TEST_DIR}/d1`)
      expect(actual.list[1].path).toBe(`${TEST_DIR}/d1/d11`)
      expect(actual.list[2].path).toBe(`${TEST_DIR}/d1/fileA.txt`)
      expect(actual.list[3].path).toBe(`${TEST_DIR}/d1/fileB.txt`)
    })

    it('疎通確認 - ページングあり', async () => {
      const { apis } = provideDependency()
      apis.setTestAuthToken(AppAdminToken())

      const actual = await apis.callStoragePaginationAPI(apis.getStorageChildren, { path: `${TEST_DIR}/d1`, includeBase: true }, { maxChunk: 2 })

      StorageUtil.sortNodes(actual)
      expect(actual.length).toBe(4)
      expect(actual[0].path).toBe(`${TEST_DIR}/d1`)
      expect(actual[1].path).toBe(`${TEST_DIR}/d1/d11`)
      expect(actual[2].path).toBe(`${TEST_DIR}/d1/fileA.txt`)
      expect(actual[3].path).toBe(`${TEST_DIR}/d1/fileB.txt`)
    })
  })

  describe('getStorageHierarchicalNodes', () => {
    beforeEach(async () => {
      const { apis } = provideDependency()
      await apis.uploadTestHierarchyFiles([
        { id: StorageNode.generateId(), path: `${TEST_DIR}/d1/d11/d111/fileA.txt`, contentType: 'text/plain', data: 'test' },
      ])
    })

    it('疎通確認', async () => {
      const { apis } = provideDependency()
      apis.setTestAuthToken(AppAdminToken())

      const actual = await apis.getStorageHierarchicalNodes(`${TEST_DIR}/d1/d11/d111/fileA.txt`)

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
      const { apis } = provideDependency()
      await apis.uploadTestHierarchyFiles([
        { id: StorageNode.generateId(), path: `${TEST_DIR}/d1/d11/d111/fileA.txt`, contentType: 'text/plain', data: 'test' },
      ])
    })

    it('疎通確認', async () => {
      const { apis } = provideDependency()
      apis.setTestAuthToken(AppAdminToken())

      const actual = await apis.getStorageAncestorDirs(`${TEST_DIR}/d1/d11/d111/fileA.txt`)

      expect(actual.length).toBe(4)
      expect(actual[0].path).toBe(`${TEST_DIR}`)
      expect(actual[1].path).toBe(`${TEST_DIR}/d1`)
      expect(actual[2].path).toBe(`${TEST_DIR}/d1/d11`)
      expect(actual[3].path).toBe(`${TEST_DIR}/d1/d11/d111`)
    })
  })

  describe('createStorageDir', () => {
    it('疎通確認', async () => {
      const { apis } = provideDependency()
      apis.setTestAuthToken(AppAdminToken())

      // 祖先ディレクトリを事前に作成
      await apis.createStorageHierarchicalDirs([`${TEST_DIR}`])

      const actual = await apis.createStorageDir(`${TEST_DIR}/d1`)

      expect(actual.path).toBe(`${TEST_DIR}/d1`)
      expect(actual.share).toMatchObject({
        isPublic: null,
        readUIds: null,
        writeUIds: null,
      } as StorageNodeShareSettings)
    })

    it('疎通確認 + 共有設定', async () => {
      const { apis } = provideDependency()
      apis.setTestAuthToken(AppAdminToken())

      // 祖先ディレクトリを事前に作成
      await apis.createStorageHierarchicalDirs([`${TEST_DIR}`])

      const actual = await apis.createStorageDir(`${TEST_DIR}/d1`, { share: { isPublic: true } })

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
      const { apis } = provideDependency()
      apis.setTestAuthToken(AppAdminToken())

      const actual = await apis.createStorageHierarchicalDirs([`${TEST_DIR}/d1/d11`])

      expect(actual.length).toBe(3)
      expect(actual[0].path).toBe(`${TEST_DIR}`)
      expect(actual[1].path).toBe(`${TEST_DIR}/d1`)
      expect(actual[2].path).toBe(`${TEST_DIR}/d1/d11`)
    })
  })

  describe('removeStorageDir', () => {
    it('疎通確認', async () => {
      const { apis } = provideDependency()
      apis.setTestAuthToken(AppAdminToken())

      await apis.uploadTestHierarchyFiles([
        { id: StorageNode.generateId(), path: `${TEST_DIR}/d1/file1.txt`, contentType: 'text/plain', data: 'test' },
        { id: StorageNode.generateId(), path: `${TEST_DIR}/d1/file2.txt`, contentType: 'text/plain', data: 'test' },
        { id: StorageNode.generateId(), path: `${TEST_DIR}/d1/file3.txt`, contentType: 'text/plain', data: 'test' },
        { id: StorageNode.generateId(), path: `${TEST_DIR}/d1/file4.txt`, contentType: 'text/plain', data: 'test' },
        { id: StorageNode.generateId(), path: `${TEST_DIR}/d1/file5.txt`, contentType: 'text/plain', data: 'test' },
      ])

      await apis.removeStorageDir(`${TEST_DIR}/d1`)

      const d1_and_descendants = (await apis.getStorageDescendants({ path: `${TEST_DIR}/d1`, includeBase: true })).list
      expect(d1_and_descendants.length).toBe(0)
    })
  })

  describe('removeStorageFile', () => {
    it('疎通確認', async () => {
      const { apis } = provideDependency()
      apis.setTestAuthToken(AppAdminToken())

      const uploadItem = { id: StorageNode.generateId(), path: `${TEST_DIR}/d1/fileA.txt`, contentType: 'text/plain', data: 'test' }
      await apis.uploadTestHierarchyFiles([uploadItem])

      const actual = (await apis.removeStorageFile(uploadItem.path))!

      expect(actual.path).toBe(`${TEST_DIR}/d1/fileA.txt`)
    })
  })

  describe('moveStorageDir', () => {
    it('疎通確認', async () => {
      const { apis } = provideDependency()
      apis.setTestAuthToken(AppAdminToken())

      await apis.createStorageHierarchicalDirs([
        `${TEST_DIR}/d1/d11`,
        `${TEST_DIR}/d1/d12`,
        `${TEST_DIR}/d1/d13`,
        `${TEST_DIR}/d1/d14`,
        `${TEST_DIR}/d1/d15`,
        `${TEST_DIR}/d2`,
      ])

      await apis.moveStorageDir(`${TEST_DIR}/d1`, `${TEST_DIR}/d2/d1`)

      const d1_and_descendants = (await apis.getStorageDescendants({ path: `${TEST_DIR}/d2/d1`, includeBase: true })).list
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
      const { apis } = provideDependency()
      apis.setTestAuthToken(AppAdminToken())

      await apis.createStorageHierarchicalDirs([`${TEST_DIR}/d1`, `${TEST_DIR}/d2`])
      await apis.uploadTestHierarchyFiles([
        { id: StorageNode.generateId(), path: `${TEST_DIR}/d1/fileA.txt`, contentType: 'text/plain', data: 'test' },
      ])

      const actual = await apis.moveStorageFile(`${TEST_DIR}/d1/fileA.txt`, `${TEST_DIR}/d2/fileA.txt`)

      expect(actual.path).toBe(`${TEST_DIR}/d2/fileA.txt`)
    })
  })

  describe('renameStorageDir', () => {
    it('疎通確認', async () => {
      const { apis } = provideDependency()
      apis.setTestAuthToken(AppAdminToken())

      await apis.createStorageHierarchicalDirs([
        `${TEST_DIR}/d1/d11`,
        `${TEST_DIR}/d1/d12`,
        `${TEST_DIR}/d1/d13`,
        `${TEST_DIR}/d1/d14`,
        `${TEST_DIR}/d1/d15`,
      ])

      await await apis.renameStorageDir(`${TEST_DIR}/d1`, `d2`)

      const d2_and_descendants = (await apis.getStorageDescendants({ path: `${TEST_DIR}/d2`, includeBase: true })).list
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
      const { apis } = provideDependency()
      apis.setTestAuthToken(AppAdminToken())

      await apis.createStorageHierarchicalDirs([`${TEST_DIR}/d1`])
      await apis.uploadTestHierarchyFiles([
        { id: StorageNode.generateId(), path: `${TEST_DIR}/d1/fileA.txt`, contentType: 'text/plain', data: 'test' },
      ])

      const actual = await apis.renameStorageFile(`${TEST_DIR}/d1/fileA.txt`, `fileB.txt`)

      expect(actual.path).toBe(`${TEST_DIR}/d1/fileB.txt`)
    })
  })

  describe('setStorageDirShareSettings', () => {
    it('疎通確認', async () => {
      const { apis } = provideDependency()
      apis.setTestAuthToken(AppAdminToken())
      await apis.createStorageHierarchicalDirs([`${TEST_DIR}/dir1`])
      await apis.uploadTestHierarchyFiles([
        { id: StorageNode.generateId(), path: `${TEST_DIR}/dir1/fileA.txt`, contentType: 'text/plain', data: 'test' },
      ])

      const actual = await apis.setStorageDirShareSettings(`${TEST_DIR}/dir1`, { isPublic: true, readUIds: ['ichiro'], writeUIds: ['ichiro'] })

      expect(actual.path).toBe(`${TEST_DIR}/dir1`)
      expect(actual.share).toMatchObject<StorageNodeShareSettings>({ isPublic: true, readUIds: ['ichiro'], writeUIds: ['ichiro'] })
    })
  })

  describe('setStorageFileShareSettings', () => {
    it('疎通確認', async () => {
      const { apis } = provideDependency()
      apis.setTestAuthToken(AppAdminToken())
      await apis.createStorageHierarchicalDirs([`${TEST_DIR}/dir1`])
      await apis.uploadTestHierarchyFiles([
        { id: StorageNode.generateId(), path: `${TEST_DIR}/dir1/fileA.txt`, contentType: 'text/plain', data: 'test' },
      ])

      const actual = await apis.setStorageFileShareSettings(`${TEST_DIR}/dir1/fileA.txt`, {
        isPublic: true,
        readUIds: ['ichiro'],
        writeUIds: ['ichiro'],
      })

      expect(actual.path).toBe(`${TEST_DIR}/dir1/fileA.txt`)
    })
  })

  describe('handleUploadedFile', () => {
    it('疎通確認', async () => {
      const { apis } = provideDependency()
      apis.setTestAuthToken(AppAdminToken())

      await apis.createStorageHierarchicalDirs([`${TEST_DIR}/docs`])
      const uploadItem = { id: StorageNode.generateId(), path: `${TEST_DIR}/docs/fileA.txt`, contentType: 'text/plain', data: 'test' }
      await apis.uploadTestHierarchyFiles([uploadItem])

      const actual = await apis.handleUploadedFile(uploadItem)

      expect(actual.path).toBe(`${TEST_DIR}/docs/fileA.txt`)
    })
  })

  describe('setFileAccessAuthClaims', () => {
    it('疎通確認', async () => {
      const { apis } = provideDependency()
      const fileNodeKey: StorageNodeKeyInput = { id: StorageNode.generateId(), path: `${TEST_DIR}/d1/fileA.txt` }
      await apis.uploadTestHierarchyFiles([{ ...fileNodeKey, contentType: 'text/plain', data: 'test' }])
      apis.setTestAuthToken(AppAdminToken())

      const actual = await apis.setFileAccessAuthClaims(fileNodeKey)

      expect(actual.length).toBeGreaterThan(0)
    })
  })

  describe('removeFileAccessAuthClaims', () => {
    it('疎通確認', async () => {
      const { apis } = provideDependency()
      const fileNodeKey: StorageNodeKeyInput = { id: StorageNode.generateId(), path: `${TEST_DIR}/d1/fileA.txt` }
      await apis.uploadTestHierarchyFiles([{ ...fileNodeKey, contentType: 'text/plain', data: 'test' }])
      apis.setTestAuthToken(AppAdminToken())

      const actual = await apis.removeFileAccessAuthClaims()

      expect(actual.length).toBeGreaterThan(0)
    })
  })

  //--------------------------------------------------
  //  Article
  //--------------------------------------------------

  describe('createArticleTypeDir', () => {
    let articleRootPath: string
    let bundle: APIStorageNode

    async function setupArticleNodes(): Promise<void> {
      const { apis } = provideDependency()
      apis.setTestAuthToken(GeneralToken())

      articleRootPath = StorageUtil.toArticleRootPath(GeneralToken().uid)
      await apis.createStorageHierarchicalDirs([articleRootPath])

      bundle = await apis.createArticleTypeDir({
        dir: `${articleRootPath}`,
        name: 'バンドル',
        type: 'TreeBundle',
      })
    }

    it('疎通確認 - カテゴリディレクトリ', async () => {
      // ユーザーの記事ルートを事前に作成
      await setupArticleNodes()

      const { apis } = provideDependency()
      apis.setTestAuthToken(GeneralToken())

      const actual = await apis.createArticleTypeDir({
        dir: `${bundle.path}`,
        name: 'カテゴリ1',
        type: 'Category',
      })

      expect(actual.path).toBe(`${actual.dir}/${actual.name}`)
      expect(actual.article?.dir?.name).toBe('カテゴリ1')
      expect(actual.article?.dir?.type).toBe<StorageArticleDirType>('Category')
      expect(typeof actual.article?.dir?.sortOrder === 'number').toBeTruthy()
      expect(actual.article?.file).toBeUndefined()
    })

    it('疎通確認 - 記事ディレクトリ', async () => {
      // ユーザーの記事ルートを事前に作成
      await setupArticleNodes()

      const { apis } = provideDependency()
      apis.setTestAuthToken(GeneralToken())

      const actual = await apis.createArticleTypeDir({
        dir: `${bundle.path}`,
        name: '記事1',
        type: 'Article',
      })

      expect(actual.path).toBe(`${actual.dir}/${actual.name}`)
      expect(actual.article?.dir?.name).toBe('記事1')
      expect(actual.article?.dir?.type).toBe<StorageArticleDirType>('Article')
      expect(typeof actual.article?.dir?.sortOrder === 'number').toBeTruthy()
      expect(actual.article?.file).toBeUndefined()

      // 記事ソースファイルが作成されていることを検証
      const masterFileNode = (await apis.getStorageChildren({ path: actual.path })).list.find(node => node.article?.file?.type === 'Master')!
      expect(masterFileNode.article?.file?.type).toBe<StorageArticleFileType>('Master')
      expect(masterFileNode.article?.dir).toBeUndefined()

      // 下書きファイルが作成されていることを検証
      const draftFileNode = (await apis.getStorageChildren({ path: actual.path })).list.find(node => node.article?.file?.type === 'Draft')!
      expect(draftFileNode.article?.file?.type).toBe<StorageArticleFileType>('Draft')
      expect(draftFileNode.article?.dir).toBeUndefined()
    })
  })

  describe('createArticleGeneralDir', () => {
    let articleRootPath: string
    let bundle: APIStorageNode
    let art1: APIStorageNode

    async function setupArticleNodes(): Promise<void> {
      const { apis } = provideDependency()
      apis.setTestAuthToken(GeneralToken())

      articleRootPath = StorageUtil.toArticleRootPath(GeneralToken().uid)
      await apis.createStorageHierarchicalDirs([articleRootPath])

      bundle = await apis.createArticleTypeDir({
        dir: `${articleRootPath}`,
        name: 'バンドル',
        type: 'ListBundle',
      })

      art1 = await apis.createArticleTypeDir({
        dir: `${bundle.path}`,
        name: '記事1',
        type: 'Article',
      })
    }

    it('疎通確認', async () => {
      // ユーザーの記事ルートを事前に作成
      await setupArticleNodes()

      const { apis } = provideDependency()
      apis.setTestAuthToken(GeneralToken())

      const tmpPath = `${art1.path}/tmp`
      const actual = await apis.createArticleGeneralDir(tmpPath)

      expect(actual.path).toBe(tmpPath)
      expect(actual.article).toBeUndefined()
    })
  })

  describe('renameArticleDir', () => {
    let articleRootPath: string
    let bundle: APIStorageNode

    async function setupArticleNodes(): Promise<void> {
      const { apis } = provideDependency()
      apis.setTestAuthToken(GeneralToken())

      articleRootPath = StorageUtil.toArticleRootPath(GeneralToken().uid)
      await apis.createStorageHierarchicalDirs([articleRootPath])

      bundle = await apis.createArticleTypeDir({
        dir: `${articleRootPath}`,
        name: 'バンドル',
        type: 'ListBundle',
      })
    }

    it('疎通確認', async () => {
      // ユーザーの記事ルートを事前に作成
      await setupArticleNodes()

      const { apis } = provideDependency()
      apis.setTestAuthToken(GeneralToken())

      const actual = await apis.renameArticleDir(`${bundle.path}`, 'Bundle')

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
      const { apis } = provideDependency()
      apis.setTestAuthToken(GeneralToken())

      articleRootPath = StorageUtil.toArticleRootPath(GeneralToken().uid)
      await apis.createStorageHierarchicalDirs([articleRootPath])

      bundle = await apis.createArticleTypeDir({
        dir: `${articleRootPath}`,
        name: 'バンドル',
        type: 'ListBundle',
      })
    }

    it('疎通確認', async () => {
      // ユーザーの記事ルートを事前に作成
      await setupArticleNodes()

      const { apis } = provideDependency()
      apis.setTestAuthToken(GeneralToken())

      // 記事を作成
      const art1 = await apis.createArticleTypeDir({
        dir: `${bundle.path}`,
        name: '記事1',
        type: 'Article',
      })
      const art2 = await apis.createArticleTypeDir({
        dir: `${bundle.path}`,
        name: '記事2',
        type: 'Article',
      })

      await apis.setArticleSortOrder([art1.path, art2.path])

      const bundle_children = (await apis.getStorageChildren({ path: bundle.path })).list
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
      const { apis } = provideDependency()
      apis.setTestAuthToken(GeneralToken())

      articleRootPath = StorageUtil.toArticleRootPath(GeneralToken().uid)
      await apis.createStorageHierarchicalDirs([articleRootPath])

      bundle = await apis.createArticleTypeDir({
        dir: `${articleRootPath}`,
        name: 'バンドル',
        type: 'ListBundle',
      })

      art1 = await apis.createArticleTypeDir({
        dir: `${bundle.path}`,
        name: '記事1',
        type: 'Article',
      })

      art1_master = (await apis.getStorageNode({
        path: StorageUtil.toArticleSrcMasterPath(art1.path),
      }))!

      art1_draft = (await apis.getStorageNode({
        path: StorageUtil.toArticleSrcDraftPath(art1.path),
      }))!
    }

    it('疎通確認', async () => {
      await setupArticleNodes()

      const { apis } = provideDependency()
      apis.setTestAuthToken(GeneralToken())

      const srcContent = '#header1'
      const textContent = 'header1'
      const actual = await apis.saveArticleSrcMasterFile(art1.path, srcContent, textContent)

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
      const { apis } = provideDependency()
      apis.setTestAuthToken(GeneralToken())

      articleRootPath = StorageUtil.toArticleRootPath(GeneralToken().uid)
      await apis.createStorageHierarchicalDirs([articleRootPath])

      bundle = await apis.createArticleTypeDir({
        dir: `${articleRootPath}`,
        name: 'バンドル',
        type: 'ListBundle',
      })

      art1 = await apis.createArticleTypeDir({
        dir: `${bundle.path}`,
        name: '記事1',
        type: 'Article',
      })

      art1_draft = (await apis.getStorageNode({
        path: StorageUtil.toArticleSrcDraftPath(art1.path),
      }))!
    }

    it('疎通確認', async () => {
      await setupArticleNodes()

      const { apis } = provideDependency()
      apis.setTestAuthToken(GeneralToken())

      const srcContent = '#header1'
      const actual = await apis.saveArticleSrcDraftFile(art1.path, srcContent)

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
      const { apis } = provideDependency()
      apis.setTestAuthToken(GeneralToken())

      articleRootPath = StorageUtil.toArticleRootPath(GeneralToken().uid)
      await apis.createStorageHierarchicalDirs([articleRootPath])

      bundle = await apis.createArticleTypeDir({
        dir: `${articleRootPath}`,
        name: 'バンドル',
        type: 'ListBundle',
      })

      art1 = await apis.createArticleTypeDir({
        dir: `${bundle.path}`,
        name: '記事1',
        type: 'Article',
      })
      art2 = await apis.createArticleTypeDir({
        dir: `${bundle.path}`,
        name: '記事2',
        type: 'Article',
      })
      art3 = await apis.createArticleTypeDir({
        dir: `${bundle.path}`,
        name: '記事3',
        type: 'Article',
      })
    }

    it('疎通確認 - ページングなし', async () => {
      await setupArticleNodes()

      const { apis } = provideDependency()
      apis.setTestAuthToken(GeneralToken())

      const actual = await apis.getArticleChildren({ dirPath: `${bundle.path}`, types: ['Article'] })

      expect(actual.nextPageToken).toBeUndefined()
      expect(actual.isPaginationTimeout).toBeFalsy()
      expect(actual.list.length).toBe(3)
      expect(actual.list[0].path).toBe(`${art3.path}`)
      expect(actual.list[1].path).toBe(`${art2.path}`)
      expect(actual.list[2].path).toBe(`${art1.path}`)
    })

    it('疎通確認 - ページングあり', async () => {
      await setupArticleNodes()

      const { apis } = provideDependency()
      apis.setTestAuthToken(GeneralToken())

      const actual = await apis.callStoragePaginationAPI(apis.getArticleChildren, { dirPath: `${bundle.path}`, types: ['Article'] }, { maxChunk: 2 })

      expect(actual.length).toBe(3)
      expect(actual[0].path).toBe(`${art3.path}`)
      expect(actual[1].path).toBe(`${art2.path}`)
      expect(actual[2].path).toBe(`${art1.path}`)
    })
  })

  describe('getArticleTableOfContents', () => {
    let articleRootPath: string
    let bundle: APIStorageNode
    let cat1: APIStorageNode
    let art1: APIStorageNode

    async function setupArticleNodes(): Promise<void> {
      const { apis } = provideDependency()
      apis.setTestAuthToken(GeneralToken())

      articleRootPath = StorageUtil.toArticleRootPath(GeneralToken().uid)
      await apis.createStorageHierarchicalDirs([articleRootPath])

      bundle = await apis.createArticleTypeDir({
        dir: `${articleRootPath}`,
        name: 'バンドル',
        type: 'TreeBundle',
      })

      cat1 = await apis.createArticleTypeDir(
        {
          dir: `${bundle.path}`,
          name: 'カテゴリ1',
          type: 'Category',
        },
        { share: { isPublic: true } }
      )

      art1 = await apis.createArticleTypeDir({
        dir: `${cat1.path}`,
        name: '記事1',
        type: 'Article',
      })
    }

    it('疎通確認', async () => {
      await setupArticleNodes()

      const { apis } = provideDependency()
      apis.setTestAuthToken(GeneralToken())

      const actual = await apis.getArticleTableOfContents(GeneralUser().userName)

      expect(actual.length).toBe(3)
      expect(actual[0].id).toBe(`${bundle.id}`)
      expect(actual[1].id).toBe(`${cat1.id}`)
      expect(actual[2].id).toBe(`${art1.id}`)
    })
  })
})

describe('User API', () => {
  describe('getAuthData', () => {
    it('疎通確認', async () => {
      const { apis } = provideDependency()

      // テストユーザーを登録
      await apis.setTestUsers(GeneralUser())

      apis.setTestAuthToken(GeneralToken())

      // 認証データの取得
      const actual = await apis.getAuthData()

      expect(actual.status).toBe<AuthStatus>('Available')
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
      const { apis } = provideDependency()
      apis.setTestAuthToken(null)

      let actual!: Error
      try {
        await apis.getAuthData()
      } catch (err) {
        actual = err
      }

      expect(getAPIErrorResponse(actual).statusCode).toBe(401)
    })
  })

  describe('setUserInfo', () => {
    it('疎通確認', async () => {
      const { apis } = provideDependency()

      // テストユーザーを登録
      const [user] = await apis.setTestUsers(GeneralUser())

      apis.setTestAuthToken(GeneralToken())

      // ユーザー情報設定
      const userInput: UserInput = {
        userName: 'john',
        fullName: 'John Doe',
        photoURL: 'https://example.com/john/user.png',
      }
      const actual = (await apis.setUserInfo(user.id, userInput))!

      expect(actual.status).toBe<SetUserInfoResultStatus>('Success')
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
      const { apis } = provideDependency()
      apis.setTestAuthToken(null)

      let actual!: Error
      try {
        await apis.setUserInfo(GeneralUser().uid, {
          userName: GeneralUser().userName,
          fullName: GeneralUser().fullName,
        })
      } catch (err) {
        actual = err
      }

      expect(getAPIErrorResponse(actual).statusCode).toBe(401)
    })
  })

  describe('deleteUser', () => {
    it('疎通確認', async () => {
      // テストユーザーを登録
      const { apis } = provideDependency()
      await apis.setTestUsers(GeneralUser())

      apis.setTestAuthToken(GeneralToken())

      // ユーザー削除
      const actual = await apis.deleteUser(GeneralUser().uid)

      expect(actual).toBeTruthy()
    })

    it('サインインしていない場合', async () => {
      const { apis } = provideDependency()
      apis.setTestAuthToken(null)

      let actual!: Error
      try {
        await apis.deleteUser(GeneralUser().uid)
      } catch (err) {
        actual = err
      }

      expect(getAPIErrorResponse(actual).statusCode).toBe(401)
    })
  })
})
