import {
  GeneralToken,
  TestUserStorageLogic,
  cloneStorageNode,
  mockStorageLogicAPIMethods,
  newStorageDirNode,
  newStorageFileNode,
  provideDependency,
} from '../../../../../helpers/app'
import { StorageArticleNodeType, StorageNode } from '@/app/logic'
import _path from 'path'
import { useConfig } from '@/app/config'

//========================================================================
//
//  Tests
//
//========================================================================

describe('AppStorageLogic', () => {
  let users: StorageNode
  let user: StorageNode
  let articles: StorageNode
  let assets: StorageNode
  let basePath: string
  let toBasePath: TestUserStorageLogic['toBasePath']
  let toBasePathNode: TestUserStorageLogic['toBasePathNode']
  let toFullPath: TestUserStorageLogic['toFullPath']

  beforeEach(async () => {
    provideDependency(({ logic }) => {
      // ベースパスをモック化
      const config = useConfig()
      basePath = _path.join(config.storage.user.rootName, GeneralToken().uid, config.storage.article.rootName)
      logic.articleStorage.basePath.value = basePath
      // ベースパスノードの作成
      users = newStorageDirNode(`${config.storage.user.rootName}`)
      user = newStorageDirNode(`${users.path}/${GeneralToken().uid}`)
      articles = newStorageDirNode(`${user.path}/${config.storage.article.rootName}`)
      assets = newStorageDirNode(`${articles.path}/${config.storage.article.assetsName}`)
      // ロジックのAPI系メソッドをモック化
      mockStorageLogicAPIMethods(logic)
      // ショートハンド用変数にメソッドを設定
      toBasePath = logic.articleStorage.toBasePath
      toBasePathNode = logic.articleStorage.toBasePathNode
      toFullPath = logic.articleStorage.toFullPath
    })
  })

  describe('fetchRoot', () => {
    it('ベーシックケース - 構成ノードが未読み込み(構成ノードは存在する)', async () => {
      const {
        logic: { articleStorage, appStorage },
      } = provideDependency()

      // モック設定
      td.when(articleStorage.getHierarchicalNodesAPI(basePath)).thenResolve([users, user, articles])
      td.when(articleStorage.getNodeAPI({ path: assets.path })).thenResolve(assets)

      // テスト対象実行
      await articleStorage.fetchRoot()

      const hierarchicalNodes = appStorage.getHierarchicalNodes(assets.path)
      expect(hierarchicalNodes.length).toBe(4)
      expect(hierarchicalNodes[0].path).toBe(users.path)
      expect(hierarchicalNodes[1].path).toBe(user.path)
      expect(hierarchicalNodes[2].path).toBe(articles.path)
      expect(hierarchicalNodes[3].path).toBe(assets.path)
    })

    it('ベーシックケース - 構成ノードが未読み込み(構成ノードが存在しない)', async () => {
      const {
        logic: { articleStorage, appStorage },
      } = provideDependency()

      // モック設定
      td.when(articleStorage.getHierarchicalNodesAPI(basePath)).thenResolve([])
      td.when(articleStorage.createHierarchicalDirsAPI([basePath])).thenResolve([users, user, articles])
      td.when(articleStorage.getNodeAPI({ path: assets.path })).thenResolve(undefined)
      td.when(articleStorage.createArticleGeneralDirAPI(assets.path)).thenResolve(assets)

      // テスト対象実行
      await articleStorage.fetchRoot()

      const hierarchicalNodes = appStorage.getHierarchicalNodes(assets.path)
      expect(hierarchicalNodes.length).toBe(4)
      expect(hierarchicalNodes[0].path).toBe(users.path)
      expect(hierarchicalNodes[1].path).toBe(user.path)
      expect(hierarchicalNodes[2].path).toBe(articles.path)
      expect(hierarchicalNodes[3].path).toBe(assets.path)
    })
  })

  describe('renameDir', () => {
    it('ベーシックケース - 記事系ノード', async () => {
      const bundle = newStorageDirNode(`${articles.path}/${StorageNode.generateId()}`, {
        version: 1,
        articleNodeName: 'バンドル',
        articleNodeType: StorageArticleNodeType.CategoryBundle,
        articleSortOrder: 1,
      })
      const {
        logic: { articleStorage, appStorage },
      } = provideDependency(({ store }) => {
        store.storage.setAll([users, user, articles, bundle])
      })

      // モック設定
      const renamed_bundle = cloneStorageNode(bundle, { articleNodeName: `Bundle`, version: bundle.version + 1 })
      td.when(articleStorage.renameArticleNodeAPI(bundle.path, bundle.articleNodeName!)).thenResolve(renamed_bundle)

      // テスト対象実行
      const [actual] = await articleStorage.renameDir(toBasePath(bundle.path), bundle.articleNodeName!)

      expect(actual.id).toBe(renamed_bundle.id)
      expect(actual.path).toBe(toBasePath(renamed_bundle.path))
      expect(actual.name).toBe(renamed_bundle.name)
      expect(actual.version).toBe(renamed_bundle.version)
      expect(actual.articleNodeName).toBe(renamed_bundle.articleNodeName)
      expect(actual.articleNodeType).toBe(renamed_bundle.articleNodeType)
      expect(actual.articleSortOrder).toBe(renamed_bundle.articleSortOrder)

      const updated_bundle = articleStorage.sgetNode({ id: renamed_bundle.id })
      expect(updated_bundle.id).toBe(renamed_bundle.id)
      expect(updated_bundle.path).toBe(toBasePath(renamed_bundle.path))
      expect(updated_bundle.name).toBe(renamed_bundle.name)
      expect(updated_bundle.version).toBe(renamed_bundle.version)
      expect(updated_bundle.articleNodeName).toBe(renamed_bundle.articleNodeName)
      expect(updated_bundle.articleNodeType).toBe(renamed_bundle.articleNodeType)
      expect(updated_bundle.articleSortOrder).toBe(renamed_bundle.articleSortOrder)

      const hierarchicalNodes = appStorage.getHierarchicalNodes(renamed_bundle.path)
      expect(hierarchicalNodes.length).toBe(4)
      expect(hierarchicalNodes[0].path).toBe(users.path)
      expect(hierarchicalNodes[1].path).toBe(user.path)
      expect(hierarchicalNodes[2].path).toBe(articles.path)
      expect(hierarchicalNodes[3].path).toBe(renamed_bundle.path)
    })

    it('ベーシックケース - 一般ノード', async () => {
      const d1 = newStorageDirNode(`${assets.path}/d1`)
      const {
        logic: { articleStorage, appStorage },
      } = provideDependency(({ store }) => {
        store.storage.setAll([users, user, articles, assets, d1])
      })

      // モック設定
      const renamed_x1 = cloneStorageNode(d1, { name: `x1`, path: `${assets.path}/x1`, version: d1.version + 1 })
      td.when(articleStorage.getNodesAPI({ ids: [renamed_x1.id] })).thenResolve([renamed_x1])

      // テスト対象実行
      const [actual] = await articleStorage.renameDir(toBasePath(d1.path), renamed_x1.name)

      expect(actual.id).toBe(renamed_x1.id)
      expect(actual.path).toBe(toBasePath(renamed_x1.path))
      expect(actual.name).toBe(renamed_x1.name)
      expect(actual.version).toBe(renamed_x1.version)
      expect(actual.articleNodeName).toBeNull()
      expect(actual.articleNodeType).toBeNull()
      expect(actual.articleSortOrder).toBeNull()

      const updated_x1 = articleStorage.sgetNode({ id: renamed_x1.id })
      expect(updated_x1.id).toBe(renamed_x1.id)
      expect(updated_x1.path).toBe(toBasePath(renamed_x1.path))
      expect(updated_x1.name).toBe(renamed_x1.name)
      expect(updated_x1.version).toBe(renamed_x1.version)
      expect(updated_x1.articleNodeName).toBeNull()
      expect(updated_x1.articleNodeType).toBeNull()
      expect(updated_x1.articleSortOrder).toBeNull()

      const hierarchicalNodes = appStorage.getHierarchicalNodes(renamed_x1.path)
      expect(hierarchicalNodes.length).toBe(5)
      expect(hierarchicalNodes[0].path).toBe(users.path)
      expect(hierarchicalNodes[1].path).toBe(user.path)
      expect(hierarchicalNodes[2].path).toBe(articles.path)
      expect(hierarchicalNodes[3].path).toBe(assets.path)
      expect(hierarchicalNodes[4].path).toBe(renamed_x1.path)

      const exp = td.explain(articleStorage.renameDirAPI.value)
      expect(exp.calls[0].args).toEqual([d1.path, renamed_x1.name])
    })
  })

  describe('renameFile', () => {
    it('ベーシックケース - 一般ノード', async () => {
      const f1 = newStorageFileNode(`${assets.path}/f1.txt`)
      const {
        logic: { articleStorage, appStorage },
      } = provideDependency(({ store }) => {
        store.storage.setAll([users, user, articles, assets, f1])
      })

      // モック設定
      const renamed_x1 = cloneStorageNode(f1, { name: `x1.txt`, path: `${assets.path}/x1.txt`, version: f1.version + 1 })
      td.when(articleStorage.renameFileAPI(f1.path, 'x1.txt')).thenResolve(renamed_x1)

      // テスト対象実行
      const actual = await articleStorage.renameFile(toBasePath(f1.path), renamed_x1.name)

      expect(actual.id).toBe(renamed_x1.id)
      expect(actual.path).toBe(toBasePath(renamed_x1.path))
      expect(actual.name).toBe(renamed_x1.name)
      expect(actual.version).toBe(renamed_x1.version)
      expect(actual.articleNodeName).toBeNull()
      expect(actual.articleNodeType).toBeNull()
      expect(actual.articleSortOrder).toBeNull()

      const updated_x1 = articleStorage.sgetNode({ id: renamed_x1.id })
      expect(updated_x1.id).toBe(renamed_x1.id)
      expect(updated_x1.path).toBe(toBasePath(renamed_x1.path))
      expect(updated_x1.name).toBe(renamed_x1.name)
      expect(updated_x1.version).toBe(renamed_x1.version)
      expect(updated_x1.articleNodeName).toBeNull()
      expect(updated_x1.articleNodeType).toBeNull()
      expect(updated_x1.articleSortOrder).toBeNull()

      const hierarchicalNodes = appStorage.getHierarchicalNodes(renamed_x1.path)
      expect(hierarchicalNodes.length).toBe(5)
      expect(hierarchicalNodes[0].path).toBe(users.path)
      expect(hierarchicalNodes[1].path).toBe(user.path)
      expect(hierarchicalNodes[2].path).toBe(articles.path)
      expect(hierarchicalNodes[3].path).toBe(assets.path)
      expect(hierarchicalNodes[4].path).toBe(renamed_x1.path)
    })
  })

  describe('createDir', () => {
    it('ベーシックケース', async () => {
      const bundle = newStorageDirNode(`${articles.path}/${StorageNode.generateId()}`, {
        articleNodeName: 'バンドル',
        articleNodeType: StorageArticleNodeType.CategoryBundle,
        articleSortOrder: 1,
      })
      const cat1 = newStorageDirNode(`${bundle.path}/${StorageNode.generateId()}`, {
        articleNodeName: 'カテゴリ1',
        articleNodeType: StorageArticleNodeType.Category,
        articleSortOrder: 1,
      })
      const art1 = newStorageDirNode(`${cat1.path}/${StorageNode.generateId()}`, {
        articleNodeName: '記事1',
        articleNodeType: StorageArticleNodeType.Article,
        articleSortOrder: 1,
      })
      const d1 = newStorageDirNode(`${art1.path}/d1`)
      const {
        logic: { articleStorage, appStorage },
      } = provideDependency(({ store }) => {
        store.storage.setAll([users, user, articles, bundle, cat1, art1])
      })

      // モック設定
      td.when(articleStorage.createArticleGeneralDirAPI(d1.path)).thenResolve(d1)

      // テスト対象実行
      const actual = await articleStorage.createDir(toBasePath(d1.path))

      expect(actual.id).toBe(d1.id)
      expect(actual.path).toBe(toBasePath(d1.path))
      expect(actual.articleNodeName).toBeNull()
      expect(actual.articleNodeType).toBeNull()
      expect(actual.articleSortOrder).toBeNull()

      const hierarchicalNodes = appStorage.getHierarchicalNodes(d1.path)
      expect(hierarchicalNodes.length).toBe(7)
      expect(hierarchicalNodes[0].path).toBe(users.path)
      expect(hierarchicalNodes[1].path).toBe(user.path)
      expect(hierarchicalNodes[2].path).toBe(articles.path)
      expect(hierarchicalNodes[3].path).toBe(bundle.path)
      expect(hierarchicalNodes[4].path).toBe(cat1.path)
      expect(hierarchicalNodes[5].path).toBe(art1.path)
      expect(hierarchicalNodes[6].path).toBe(d1.path)
    })

    it('階層を構成するノードが欠けていた場合', async () => {
      const bundle = newStorageDirNode(`${articles.path}/${StorageNode.generateId()}`, {
        articleNodeName: 'バンドル',
        articleNodeType: StorageArticleNodeType.CategoryBundle,
        articleSortOrder: 1,
      })
      const cat1 = newStorageDirNode(`${bundle.path}/${StorageNode.generateId()}`, {
        articleNodeName: 'カテゴリ1',
        articleNodeType: StorageArticleNodeType.Category,
        articleSortOrder: 1,
      })
      const art1 = newStorageDirNode(`${cat1.path}/${StorageNode.generateId()}`, {
        articleNodeName: '記事1',
        articleNodeType: StorageArticleNodeType.Article,
        articleSortOrder: 1,
      })
      const d1 = newStorageDirNode(`${art1.path}/d1`)
      const {
        logic: { articleStorage, appStorage },
      } = provideDependency(({ store }) => {
        // ※｢bundle｣が欠けているように設定
        store.storage.setAll([users, user, articles, cat1, art1])
      })

      let actual!: Error
      try {
        // テスト対象実行
        await articleStorage.createDir(toBasePath(d1.path))
      } catch (err) {
        actual = err
      }

      expect(actual.message).toBe(`One of the ancestor nodes in the path '${d1.path}' does not exist.`)
    })
  })

  describe('createArticleTypeDir', () => {
    it('ベーシックケース - バンドル作成', async () => {
      const bundle = newStorageDirNode(`${articles.path}/${StorageNode.generateId()}`, {
        articleNodeName: 'バンドル',
        articleNodeType: StorageArticleNodeType.ListBundle,
        articleSortOrder: 1,
      })
      const {
        logic: { articleStorage, appStorage },
      } = provideDependency(({ store }) => {
        store.storage.setAll([users, user, articles])
      })

      // モック設定
      td.when(
        articleStorage.createArticleTypeDirAPI({
          dir: bundle.dir,
          articleNodeName: bundle.articleNodeName!,
          articleNodeType: bundle.articleNodeType!,
        })
      ).thenResolve(bundle)

      // テスト対象実行
      const actual = await articleStorage.createArticleTypeDir({
        dir: ``,
        articleNodeName: bundle.articleNodeName!,
        articleNodeType: bundle.articleNodeType!,
      })

      expect(actual.id).toBe(bundle.id)
      expect(actual.path).toBe(toBasePath(bundle.path))
      expect(actual.articleNodeName).toBe(bundle.articleNodeName)
      expect(actual.articleNodeType).toBe(bundle.articleNodeType)
      expect(actual.articleSortOrder).toBe(bundle.articleSortOrder)

      const hierarchicalNodes = appStorage.getHierarchicalNodes(bundle.path)
      expect(hierarchicalNodes.length).toBe(4)
      expect(hierarchicalNodes[0].path).toBe(users.path)
      expect(hierarchicalNodes[1].path).toBe(user.path)
      expect(hierarchicalNodes[2].path).toBe(articles.path)
      expect(hierarchicalNodes[3].path).toBe(bundle.path)
    })

    it('ベーシックケース - 記事作成', async () => {
      const config = useConfig()
      const bundle = newStorageDirNode(`${articles.path}/${StorageNode.generateId()}`, {
        articleNodeName: 'バンドル',
        articleNodeType: StorageArticleNodeType.CategoryBundle,
        articleSortOrder: 1,
      })
      const cat1 = newStorageDirNode(`${bundle.path}/${StorageNode.generateId()}`, {
        articleNodeName: 'カテゴリ1',
        articleNodeType: StorageArticleNodeType.Category,
        articleSortOrder: 1,
      })
      const art1 = newStorageDirNode(`${cat1.path}/${StorageNode.generateId()}`, {
        articleNodeName: '記事1',
        articleNodeType: StorageArticleNodeType.Article,
        articleSortOrder: 1,
      })
      const art1Index = newStorageFileNode(`${art1.path}/${config.storage.article.fileName}`, {
        isArticleFile: true,
      })
      const {
        logic: { articleStorage, appStorage },
      } = provideDependency(({ store }) => {
        store.storage.setAll([users, user, articles, bundle, cat1])
      })

      // モック設定
      td.when(
        articleStorage.createArticleTypeDirAPI({
          dir: art1.dir,
          articleNodeName: art1.articleNodeName!,
          articleNodeType: art1.articleNodeType!,
        })
      ).thenResolve(art1)
      td.when(articleStorage.getChildrenAPI(art1.path)).thenResolve([art1Index])

      // テスト対象実行
      const actual = await articleStorage.createArticleTypeDir({
        dir: `${bundle.id}/${cat1.id}`,
        articleNodeName: art1.articleNodeName!,
        articleNodeType: art1.articleNodeType!,
      })

      expect(actual.id).toBe(art1.id)
      expect(actual.path).toBe(toBasePath(art1.path))
      expect(actual.articleNodeName).toBe(art1.articleNodeName)
      expect(actual.articleNodeType).toBe(art1.articleNodeType)
      expect(actual.articleSortOrder).toBe(art1.articleSortOrder)

      const hierarchicalNodes = appStorage.getHierarchicalNodes(art1Index.path)
      expect(hierarchicalNodes.length).toBe(7)
      expect(hierarchicalNodes[0].path).toBe(users.path)
      expect(hierarchicalNodes[1].path).toBe(user.path)
      expect(hierarchicalNodes[2].path).toBe(articles.path)
      expect(hierarchicalNodes[3].path).toBe(bundle.path)
      expect(hierarchicalNodes[4].path).toBe(cat1.path)
      expect(hierarchicalNodes[5].path).toBe(art1.path)
      expect(hierarchicalNodes[6].path).toBe(art1Index.path)
    })

    it('階層を構成するノードが欠けていた場合', async () => {
      const bundle = newStorageDirNode(`${articles.path}/${StorageNode.generateId()}`, {
        articleNodeName: 'バンドル',
        articleNodeType: StorageArticleNodeType.CategoryBundle,
        articleSortOrder: 1,
      })
      const cat1 = newStorageDirNode(`${bundle.path}/${StorageNode.generateId()}`, {
        articleNodeName: 'カテゴリ1',
        articleNodeType: StorageArticleNodeType.Category,
        articleSortOrder: 1,
      })
      const art1 = newStorageDirNode(`${cat1.path}/${StorageNode.generateId()}`, {
        articleNodeName: '記事1',
        articleNodeType: StorageArticleNodeType.Article,
        articleSortOrder: 1,
      })
      const {
        logic: { articleStorage, appStorage },
      } = provideDependency(({ store }) => {
        // ※｢bundle｣が欠けているように設定
        store.storage.setAll([users, user, articles, cat1])
      })

      let actual!: Error
      try {
        // テスト対象実行
        await articleStorage.createArticleTypeDir({
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

  describe('setArticleSortOrder', () => {
    it('ベーシックケース', async () => {
      const bundle = newStorageDirNode(`${articles.path}/${StorageNode.generateId()}`, {
        articleNodeName: 'バンドル',
        articleNodeType: StorageArticleNodeType.ListBundle,
        articleSortOrder: 1,
      })
      const art1 = newStorageDirNode(`${bundle.path}/${StorageNode.generateId()}`, {
        articleNodeName: '記事1',
        articleNodeType: StorageArticleNodeType.Article,
      })
      const art2 = newStorageDirNode(`${bundle.path}/${StorageNode.generateId()}`, {
        articleNodeName: '記事2',
        articleNodeType: StorageArticleNodeType.Article,
      })
      const {
        logic: { articleStorage, appStorage },
      } = provideDependency(({ store }) => {
        store.storage.setAll([users, user, articles, bundle, art2, art1])
      })

      // モック設定
      td.when(articleStorage.getNodesAPI({ paths: [art1.path, art2.path] })).thenResolve([art1, art2])

      // テスト対象実行
      art1.articleSortOrder = 2
      art2.articleSortOrder = 1
      const actual = await articleStorage.setArticleSortOrder(toBasePath([art1.path, art2.path]))

      // 戻り値の検証
      {
        const [_art1, _art2] = actual
        expect(_art1.path).toBe(toBasePath(art1.path))
        expect(_art1.articleSortOrder).toBe(2)
        expect(_art2.path).toBe(toBasePath(art2.path))
        expect(_art2.articleSortOrder).toBe(1)
      }
      // ストアの検証
      {
        const [_art1, _art2] = articleStorage.getNodes({ ids: [art1.id, art2.id] })
        expect(_art1.path).toBe(toBasePath(art1.path))
        expect(_art1.articleSortOrder).toBe(2)
        expect(_art2.path).toBe(toBasePath(art2.path))
        expect(_art2.articleSortOrder).toBe(1)
      }

      const exp = td.explain(articleStorage.setArticleSortOrderAPI.value)
      expect(exp.calls[0].args).toEqual([[art1.path, art2.path]])
    })

    it('大量データの場合', async () => {
      const Num = 101

      const bundle = newStorageDirNode(`${articles.path}/${StorageNode.generateId()}`, {
        articleNodeName: 'バンドル',
        articleNodeType: StorageArticleNodeType.ListBundle,
        articleSortOrder: 1,
      })
      const arts: StorageNode[] = []
      for (let i = 0; i < Num; i++) {
        arts.push(
          newStorageDirNode(`${bundle.path}/${StorageNode.generateId()}`, {
            articleNodeName: `記事${i + 1}`,
            articleNodeType: StorageArticleNodeType.Article,
          })
        )
      }
      const {
        logic: { articleStorage, appStorage },
      } = provideDependency(({ store }) => {
        store.storage.setAll([users, user, articles, bundle, ...arts])
      })

      // モック設定
      arts.forEach((art, index) => (art.articleSortOrder = Num - index))
      const art1to50 = arts.slice(0, 50)
      const art51to100 = arts.slice(50, 100)
      const art101to = arts.slice(100, Num)
      td.when(articleStorage.getNodesAPI({ paths: art1to50.map(art => art.path) })).thenResolve(art1to50)
      td.when(articleStorage.getNodesAPI({ paths: art51to100.map(art => art.path) })).thenResolve(art51to100)
      td.when(articleStorage.getNodesAPI({ paths: art101to.map(art => art.path) })).thenResolve(art101to)

      // テスト対象実行
      const actual = await articleStorage.setArticleSortOrder(toBasePath(arts.map(art => art.path)))

      // 戻り値の検証
      for (let i = 0; i < Num; i++) {
        const art = arts[i]
        const _art = actual[i]
        expect(_art.path).toBe(toBasePath(art.path))
        expect(_art.articleSortOrder).toBe(Num - i)
      }
      // ストアの検証
      for (let i = 0; i < Num; i++) {
        const art = arts[i]
        const _art = articleStorage.sgetNode({ id: art.id })
        expect(_art.path).toBe(toBasePath(art.path))
        expect(_art.articleSortOrder).toBe(Num - i)
      }

      const exp = td.explain(articleStorage.setArticleSortOrderAPI.value)
      expect(exp.calls[0].args).toEqual([arts.map(art => art.path)])
    })
  })
})
