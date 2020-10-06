import * as path from 'path'
import * as td from 'testdouble'
import { AppStorageLogic, ArticleStorageLogicImpl } from '@/example/logic/modules/storage'
import { MockAppStorageLogic, cloneTestStorageNode, newTestStorageDirNode, newTestStorageFileNode } from '../../../../../helpers/example/storage'
import { StorageArticleNodeType, StorageNode } from '@/example/logic'
import { StorageState, StorageStore, store } from '@/example/logic/store'
import { AppAPIContainer } from '@/example/logic/api'
import { Component } from 'vue-property-decorator'
import { GENERAL_USER } from '../../../../../helpers/example/data'
import { TestStore } from '../../../../../helpers/example/store'
import { cloneDeep } from 'lodash'
import { config } from '@/example/config'
import { generateFirestoreId } from '../../../../../helpers/example/base'
import { initExampleTest } from '../../../../../helpers/example/init'

//========================================================================
//
//  Test helpers
//
//========================================================================

@Component
class MockArticleStorageLogic extends ArticleStorageLogicImpl {
  get basePath(): string {
    return path.join(config.storage.user.rootName, GENERAL_USER.uid, config.storage.article.rootName)
  }

  m_createArticleTypeDirAPI = td.func() as any
  m_createArticleGeneralDirAPI = td.func() as any
  m_renameArticleNodeAPI = td.func() as any
  m_setArticleSortOrderAPI = td.func() as any
  m_getArticleChildrenAPI = td.func() as any
}

let api!: AppAPIContainer

let storageStore!: TestStore<StorageStore, StorageState>

let storageLogic!: ArticleStorageLogicImpl & {
  appStorage: AppStorageLogic
  m_createArticleTypeDirAPI: ArticleStorageLogicImpl['m_createArticleTypeDirAPI']
  m_createArticleGeneralDirAPI: ArticleStorageLogicImpl['m_createArticleGeneralDirAPI']
  m_renameArticleNodeAPI: ArticleStorageLogicImpl['m_renameArticleNodeAPI']
  m_setArticleSortOrderAPI: ArticleStorageLogicImpl['m_setArticleSortOrderAPI']
}

function validate_validateSignedIn_called(): void {
  const explanation = td.explain(storageLogic.appStorage.validateSignedIn)
  expect(explanation.calls.length >= 1).toBeTruthy()
}

//========================================================================
//
//  Tests
//
//========================================================================

beforeAll(async () => {
  api = td.object<AppAPIContainer>()
  await initExampleTest({ api })

  storageStore = store.storage as TestStore<StorageStore, StorageState>
  storageLogic = new MockArticleStorageLogic() as any
  storageLogic.init(new MockAppStorageLogic())
})

describe('ArticleStorageLogic', () => {
  let users: StorageNode
  let user: StorageNode
  let articles: StorageNode
  let assets: StorageNode

  beforeEach(async () => {
    storageStore.initState({ all: cloneDeep([]) })

    users = newTestStorageDirNode(`${config.storage.user.rootName}`)
    user = newTestStorageDirNode(`${users.path}/${GENERAL_USER.uid}`)
    articles = newTestStorageDirNode(`${user.path}/${config.storage.article.rootName}`)
    assets = newTestStorageDirNode(`${articles.path}/${config.storage.article.assetsName}`)
  })

  describe('fetchRoot', () => {
    it('ベーシックケース - 構成ノードが未読み込み(構成ノードは存在する)', async () => {
      td.when(storageLogic.appStorage.getHierarchicalNodesAPI(storageLogic.basePath)).thenResolve(cloneDeep([users, user, articles]))
      td.when(storageLogic.appStorage.getNodeAPI({ path: assets.path })).thenResolve(cloneDeep(assets))

      // テスト対象実行
      await storageLogic.fetchRoot()

      const hierarchicalNodes = storageLogic.appStorage.getHierarchicalNodes(assets.path)
      expect(hierarchicalNodes.length).toBe(4)
      expect(hierarchicalNodes[0].path).toBe(users.path)
      expect(hierarchicalNodes[1].path).toBe(user.path)
      expect(hierarchicalNodes[2].path).toBe(articles.path)
      expect(hierarchicalNodes[3].path).toBe(assets.path)

      validate_validateSignedIn_called()
    })

    it('ベーシックケース - 構成ノードが未読み込み(構成ノードが存在しない)', async () => {
      td.when(storageLogic.appStorage.getHierarchicalNodesAPI(storageLogic.basePath)).thenResolve([])
      td.when(storageLogic.appStorage.createHierarchicalDirsAPI([storageLogic.basePath])).thenResolve(cloneDeep([users, user, articles]))
      td.when(storageLogic.appStorage.getNodeAPI({ path: assets.path })).thenResolve(undefined)
      td.when(storageLogic.m_createArticleGeneralDirAPI(assets.path)).thenResolve(assets)

      // テスト対象実行
      await storageLogic.fetchRoot()

      const hierarchicalNodes = storageLogic.appStorage.getHierarchicalNodes(assets.path)
      expect(hierarchicalNodes.length).toBe(4)
      expect(hierarchicalNodes[0].path).toBe(users.path)
      expect(hierarchicalNodes[1].path).toBe(user.path)
      expect(hierarchicalNodes[2].path).toBe(articles.path)
      expect(hierarchicalNodes[3].path).toBe(assets.path)

      validate_validateSignedIn_called()
    })
  })

  describe('renameDir', () => {
    it('ベーシックケース - 記事系ノード', async () => {
      const bundle = newTestStorageDirNode(`${articles.path}/${generateFirestoreId()}`, {
        version: 2,
        articleNodeName: 'バンドル',
        articleNodeType: StorageArticleNodeType.CategoryBundle,
        articleSortOrder: 1,
      })
      storageStore.initState({ all: cloneDeep([users, user, articles, bundle]) })

      // モック設定
      const renamed_bundle = cloneTestStorageNode(bundle, { articleNodeName: `Bundle`, version: bundle.version + 1 })
      td.when(storageLogic.m_renameArticleNodeAPI(bundle.path, bundle.articleNodeName!)).thenResolve(renamed_bundle)

      // テスト対象実行
      const bundleRelativePath = `${bundle.id}`
      const [actual] = await storageLogic.renameDir(bundleRelativePath, bundle.articleNodeName!)

      expect(actual.id).toBe(renamed_bundle.id)
      expect(actual.path).toBe(`${renamed_bundle.id}`)
      expect(actual.name).toBe(renamed_bundle.name)
      expect(actual.version).toBe(renamed_bundle.version)
      expect(actual.articleNodeName).toBe(renamed_bundle.articleNodeName)
      expect(actual.articleNodeType).toBe(renamed_bundle.articleNodeType)
      expect(actual.articleSortOrder).toBe(renamed_bundle.articleSortOrder)

      const updated_bundle = storageLogic.sgetNode({ id: renamed_bundle.id })
      expect(updated_bundle.id).toBe(renamed_bundle.id)
      expect(updated_bundle.path).toBe(`${renamed_bundle.id}`)
      expect(updated_bundle.name).toBe(renamed_bundle.name)
      expect(updated_bundle.version).toBe(renamed_bundle.version)
      expect(updated_bundle.articleNodeName).toBe(renamed_bundle.articleNodeName)
      expect(updated_bundle.articleNodeType).toBe(renamed_bundle.articleNodeType)
      expect(updated_bundle.articleSortOrder).toBe(renamed_bundle.articleSortOrder)

      const hierarchicalNodes = storageLogic.appStorage.getHierarchicalNodes(renamed_bundle.path)
      expect(hierarchicalNodes.length).toBe(4)
      expect(hierarchicalNodes[0].path).toBe(users.path)
      expect(hierarchicalNodes[1].path).toBe(user.path)
      expect(hierarchicalNodes[2].path).toBe(articles.path)
      expect(hierarchicalNodes[3].path).toBe(renamed_bundle.path)

      validate_validateSignedIn_called()
    })

    it('ベーシックケース - 一般ノード', async () => {
      const d1 = newTestStorageDirNode(`${assets.path}/d1`)
      storageStore.initState({ all: cloneDeep([users, user, articles, assets, d1]) })

      // モック設定
      const renamed_x1 = cloneTestStorageNode(d1, { name: `x1`, path: `${assets.path}/x1`, version: d1.version + 1 })
      td.when(storageLogic.appStorage.renameDirAPI(d1.path, 'x1')).thenResolve([renamed_x1])

      // テスト対象実行
      const d1RelativePath = `${assets.name}/${d1.name}`
      const [actual] = await storageLogic.renameDir(d1RelativePath, renamed_x1.name)

      expect(actual.id).toBe(renamed_x1.id)
      expect(actual.path).toBe(`${assets.name}/${renamed_x1.name}`)
      expect(actual.name).toBe(renamed_x1.name)
      expect(actual.version).toBe(renamed_x1.version)
      expect(actual.articleNodeName).toBeNull()
      expect(actual.articleNodeType).toBeNull()
      expect(actual.articleSortOrder).toBeNull()

      const updated_x1 = storageLogic.sgetNode({ id: renamed_x1.id })
      expect(updated_x1.id).toBe(renamed_x1.id)
      expect(updated_x1.path).toBe(`${assets.name}/${renamed_x1.name}`)
      expect(updated_x1.name).toBe(renamed_x1.name)
      expect(updated_x1.version).toBe(renamed_x1.version)
      expect(updated_x1.articleNodeName).toBeNull()
      expect(updated_x1.articleNodeType).toBeNull()
      expect(updated_x1.articleSortOrder).toBeNull()

      const hierarchicalNodes = storageLogic.appStorage.getHierarchicalNodes(renamed_x1.path)
      expect(hierarchicalNodes.length).toBe(5)
      expect(hierarchicalNodes[0].path).toBe(users.path)
      expect(hierarchicalNodes[1].path).toBe(user.path)
      expect(hierarchicalNodes[2].path).toBe(articles.path)
      expect(hierarchicalNodes[3].path).toBe(assets.path)
      expect(hierarchicalNodes[4].path).toBe(renamed_x1.path)

      validate_validateSignedIn_called()
    })
  })

  describe('renameFile', () => {
    it('ベーシックケース - 一般ノード', async () => {
      const f1 = newTestStorageFileNode(`${assets.path}/f1.txt`)
      storageStore.initState({ all: cloneDeep([users, user, articles, assets, f1]) })

      // モック設定
      const renamed_x1 = cloneTestStorageNode(f1, { name: `x1.txt`, path: `${assets.path}/x1.txt`, version: f1.version + 1 })
      td.when(storageLogic.appStorage.renameFileAPI(f1.path, 'x1.txt')).thenResolve(renamed_x1)

      // テスト対象実行
      const f1RelativePath = `${assets.name}/${f1.name}`
      const actual = await storageLogic.renameFile(f1RelativePath, renamed_x1.name)

      expect(actual.id).toBe(renamed_x1.id)
      expect(actual.path).toBe(`${assets.name}/${renamed_x1.name}`)
      expect(actual.name).toBe(renamed_x1.name)
      expect(actual.version).toBe(renamed_x1.version)
      expect(actual.articleNodeName).toBeNull()
      expect(actual.articleNodeType).toBeNull()
      expect(actual.articleSortOrder).toBeNull()

      const updated_x1 = storageLogic.sgetNode({ id: renamed_x1.id })
      expect(updated_x1.id).toBe(renamed_x1.id)
      expect(updated_x1.path).toBe(`${assets.name}/${renamed_x1.name}`)
      expect(updated_x1.name).toBe(renamed_x1.name)
      expect(updated_x1.version).toBe(renamed_x1.version)
      expect(updated_x1.articleNodeName).toBeNull()
      expect(updated_x1.articleNodeType).toBeNull()
      expect(updated_x1.articleSortOrder).toBeNull()

      const hierarchicalNodes = storageLogic.appStorage.getHierarchicalNodes(renamed_x1.path)
      expect(hierarchicalNodes.length).toBe(5)
      expect(hierarchicalNodes[0].path).toBe(users.path)
      expect(hierarchicalNodes[1].path).toBe(user.path)
      expect(hierarchicalNodes[2].path).toBe(articles.path)
      expect(hierarchicalNodes[3].path).toBe(assets.path)
      expect(hierarchicalNodes[4].path).toBe(renamed_x1.path)

      validate_validateSignedIn_called()
    })
  })

  describe('createArticleTypeDir', () => {
    it('ベーシックケース - バンドル作成', async () => {
      const bundle = newTestStorageDirNode(`${articles.path}/${generateFirestoreId()}`, {
        articleNodeName: 'バンドル',
        articleNodeType: StorageArticleNodeType.ListBundle,
        articleSortOrder: 1,
      })

      storageStore.initState({ all: cloneDeep([users, user, articles]) })

      // モック設定
      td.when(
        storageLogic.m_createArticleTypeDirAPI({
          dir: bundle.dir,
          articleNodeName: bundle.articleNodeName!,
          articleNodeType: bundle.articleNodeType!,
        })
      ).thenResolve(cloneDeep(bundle))

      // テスト対象実行
      const actual = await storageLogic.createArticleTypeDir({
        dir: ``,
        articleNodeName: bundle.articleNodeName!,
        articleNodeType: bundle.articleNodeType!,
      })

      expect(actual.id).toBe(bundle.id)
      expect(actual.path).toBe(`${bundle.id}`)
      expect(actual.articleNodeName).toBe(bundle.articleNodeName)
      expect(actual.articleNodeType).toBe(bundle.articleNodeType)
      expect(actual.articleSortOrder).toBe(bundle.articleSortOrder)

      const hierarchicalNodes = storageLogic.appStorage.getHierarchicalNodes(bundle.path)
      expect(hierarchicalNodes.length).toBe(4)
      expect(hierarchicalNodes[0].path).toBe(users.path)
      expect(hierarchicalNodes[1].path).toBe(user.path)
      expect(hierarchicalNodes[2].path).toBe(articles.path)
      expect(hierarchicalNodes[3].path).toBe(bundle.path)

      validate_validateSignedIn_called()
    })

    it('ベーシックケース - 記事作成', async () => {
      const bundle = newTestStorageDirNode(`${articles.path}/${generateFirestoreId()}`, {
        articleNodeName: 'バンドル',
        articleNodeType: StorageArticleNodeType.CategoryBundle,
        articleSortOrder: 1,
      })
      const cat1 = newTestStorageDirNode(`${bundle.path}/${generateFirestoreId()}`, {
        articleNodeName: 'カテゴリ1',
        articleNodeType: StorageArticleNodeType.Category,
        articleSortOrder: 1,
      })
      const art1 = newTestStorageDirNode(`${cat1.path}/${generateFirestoreId()}`, {
        articleNodeName: '記事1',
        articleNodeType: StorageArticleNodeType.Article,
        articleSortOrder: 1,
      })
      const art1Index = newTestStorageFileNode(`${art1.path}/${config.storage.article.fileName}`)

      storageStore.initState({ all: cloneDeep([users, user, articles, bundle, cat1]) })

      // モック設定
      td.when(
        storageLogic.m_createArticleTypeDirAPI({
          dir: art1.dir,
          articleNodeName: art1.articleNodeName!,
          articleNodeType: art1.articleNodeType!,
        })
      ).thenResolve(cloneDeep(art1))
      td.when(storageLogic.appStorage.getChildrenAPI(art1.path)).thenResolve(cloneDeep([art1Index]))

      // テスト対象実行
      const actual = await storageLogic.createArticleTypeDir({
        dir: `${bundle.id}/${cat1.id}`,
        articleNodeName: art1.articleNodeName!,
        articleNodeType: art1.articleNodeType!,
      })

      expect(actual.id).toBe(art1.id)
      expect(actual.path).toBe(`${bundle.id}/${cat1.id}/${art1.id}`)
      expect(actual.articleNodeName).toBe(art1.articleNodeName)
      expect(actual.articleNodeType).toBe(art1.articleNodeType)
      expect(actual.articleSortOrder).toBe(art1.articleSortOrder)

      const hierarchicalNodes = storageLogic.appStorage.getHierarchicalNodes(art1Index.path)
      expect(hierarchicalNodes.length).toBe(7)
      expect(hierarchicalNodes[0].path).toBe(users.path)
      expect(hierarchicalNodes[1].path).toBe(user.path)
      expect(hierarchicalNodes[2].path).toBe(articles.path)
      expect(hierarchicalNodes[3].path).toBe(bundle.path)
      expect(hierarchicalNodes[4].path).toBe(cat1.path)
      expect(hierarchicalNodes[5].path).toBe(art1.path)
      expect(hierarchicalNodes[6].path).toBe(art1Index.path)

      validate_validateSignedIn_called()
    })

    it('階層を構成するノードが欠けていた場合', async () => {
      const bundle = newTestStorageDirNode(`${articles.path}/${generateFirestoreId()}`, {
        articleNodeName: 'バンドル',
        articleNodeType: StorageArticleNodeType.CategoryBundle,
        articleSortOrder: 1,
      })
      const cat1 = newTestStorageDirNode(`${bundle.path}/${generateFirestoreId()}`, {
        articleNodeName: 'カテゴリ1',
        articleNodeType: StorageArticleNodeType.Category,
        articleSortOrder: 1,
      })
      const art1 = newTestStorageDirNode(`${cat1.path}/${generateFirestoreId()}`, {
        articleNodeName: '記事1',
        articleNodeType: StorageArticleNodeType.Article,
        articleSortOrder: 1,
      })

      // ※｢bundle｣が欠けているように設定
      storageStore.initState({ all: cloneDeep([users, user, articles, cat1]) })

      let actual!: Error
      try {
        // テスト対象実行
        await storageLogic.createArticleTypeDir({
          dir: `${bundle.id}/${cat1.id}`,
          articleNodeName: art1.articleNodeName!,
          articleNodeType: art1.articleNodeType!,
        })
      } catch (err) {
        actual = err
      }

      expect(actual.message).toBe(`One of the nodes in the path '${art1.dir}' does not exist.`)
    })
  })

  describe('createDir', () => {
    it('ベーシックケース', async () => {
      const bundle = newTestStorageDirNode(`${articles.path}/${generateFirestoreId()}`, {
        articleNodeName: 'バンドル',
        articleNodeType: StorageArticleNodeType.CategoryBundle,
        articleSortOrder: 1,
      })
      const cat1 = newTestStorageDirNode(`${bundle.path}/${generateFirestoreId()}`, {
        articleNodeName: 'カテゴリ1',
        articleNodeType: StorageArticleNodeType.Category,
        articleSortOrder: 1,
      })
      const art1 = newTestStorageDirNode(`${cat1.path}/${generateFirestoreId()}`, {
        articleNodeName: '記事1',
        articleNodeType: StorageArticleNodeType.Article,
        articleSortOrder: 1,
      })
      const d1 = newTestStorageDirNode(`${art1.path}/d1`)

      storageStore.initState({ all: cloneDeep([users, user, articles, bundle, cat1, art1]) })

      // モック設定
      td.when(storageLogic.m_createArticleGeneralDirAPI(d1.path)).thenResolve(cloneDeep(d1))

      // テスト対象実行
      const actual = await storageLogic.createDir(`${bundle.id}/${cat1.id}/${art1.id}/${d1.name}`)

      expect(actual.id).toBe(d1.id)
      expect(actual.path).toBe(`${bundle.id}/${cat1.id}/${art1.id}/${d1.name}`)
      expect(actual.articleNodeName).toBeNull()
      expect(actual.articleNodeType).toBeNull()
      expect(actual.articleSortOrder).toBeNull()

      const hierarchicalNodes = storageLogic.appStorage.getHierarchicalNodes(d1.path)
      expect(hierarchicalNodes.length).toBe(7)
      expect(hierarchicalNodes[0].path).toBe(users.path)
      expect(hierarchicalNodes[1].path).toBe(user.path)
      expect(hierarchicalNodes[2].path).toBe(articles.path)
      expect(hierarchicalNodes[3].path).toBe(bundle.path)
      expect(hierarchicalNodes[4].path).toBe(cat1.path)
      expect(hierarchicalNodes[5].path).toBe(art1.path)
      expect(hierarchicalNodes[6].path).toBe(d1.path)

      validate_validateSignedIn_called()
    })

    it('階層を構成するノードが欠けていた場合', async () => {
      const bundle = newTestStorageDirNode(`${articles.path}/${generateFirestoreId()}`, {
        articleNodeName: 'バンドル',
        articleNodeType: StorageArticleNodeType.CategoryBundle,
        articleSortOrder: 1,
      })
      const cat1 = newTestStorageDirNode(`${bundle.path}/${generateFirestoreId()}`, {
        articleNodeName: 'カテゴリ1',
        articleNodeType: StorageArticleNodeType.Category,
        articleSortOrder: 1,
      })
      const art1 = newTestStorageDirNode(`${cat1.path}/${generateFirestoreId()}`, {
        articleNodeName: '記事1',
        articleNodeType: StorageArticleNodeType.Article,
        articleSortOrder: 1,
      })
      const d1 = newTestStorageDirNode(`${art1.path}/d1`)

      // ※｢bundle｣が欠けているように設定
      storageStore.initState({ all: cloneDeep([users, user, articles, cat1, art1]) })

      let actual!: Error
      try {
        // テスト対象実行
        await storageLogic.createDir(`${bundle.id}/${cat1.id}/${art1.id}/${d1.name}`)
      } catch (err) {
        actual = err
      }

      expect(actual.message).toBe(`One of the ancestor nodes in the path '${d1.path}' does not exist.`)
    })
  })
})
