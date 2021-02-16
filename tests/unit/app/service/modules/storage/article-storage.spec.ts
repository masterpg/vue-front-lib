/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */

import {
  GeneralToken,
  TestUserStorageService,
  cloneStorageNode,
  mockStorageServiceAPIMethods,
  newStorageDirNode,
  newStorageFileNode,
  provideDependency,
} from '../../../../../helpers/app'
import { StorageArticleDirType, StorageArticleFileType, StorageNode, StorageUtil } from '@/app/service'
import _path from 'path'
import dayjs from 'dayjs'
import { useConfig } from '@/app/config'

//========================================================================
//
//  Tests
//
//========================================================================

describe('AppStorageService', () => {
  let users: StorageNode
  let user: StorageNode
  let articles: StorageNode
  let assets: StorageNode
  let basePath: string
  let toBasePath: TestUserStorageService['toBasePath']
  let toBasePaths: TestUserStorageService['toBasePaths']
  let toBasePathNode: TestUserStorageService['toBasePathNode']
  let toFullPath: TestUserStorageService['toFullPath']

  beforeEach(async () => {
    provideDependency(({ service }) => {
      // ベースパスをモック化
      const config = useConfig()
      basePath = _path.join(config.storage.user.rootName, GeneralToken().uid, config.storage.article.rootName)
      service.articleStorage.basePath.value = basePath
      // ベースパスノードの作成
      users = newStorageDirNode(`${config.storage.user.rootName}`)
      user = newStorageDirNode(`${users.path}/${GeneralToken().uid}`)
      articles = newStorageDirNode(`${user.path}/${config.storage.article.rootName}`)
      assets = newStorageDirNode(`${articles.path}/${config.storage.article.assetsName}`)
      // サービスのAPI系メソッドをモック化
      mockStorageServiceAPIMethods(service)
      // ショートハンド用変数にメソッドを設定
      toBasePath = service.articleStorage.toBasePath
      toBasePaths = service.articleStorage.toBasePaths
      toBasePathNode = service.articleStorage.toBasePathNode
      toFullPath = service.articleStorage.toFullPath
    })
  })

  describe('fetchRoot', () => {
    it('ベーシックケース - 構成ノードが未読み込み(構成ノードは存在する)', async () => {
      const {
        service: { articleStorage, appStorage },
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
        service: { articleStorage, appStorage },
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
        article: {
          dir: {
            name: 'バンドル',
            type: 'TreeBundle',
            sortOrder: 1,
          },
        },
      })
      const {
        service: { articleStorage, appStorage },
      } = provideDependency(({ store }) => {
        store.storage.setAll([users, user, articles, bundle])
      })

      // モック設定
      const renamed_bundle = cloneStorageNode(bundle, {
        article: { dir: { name: `Bundle` } },
        version: bundle.version + 1,
      })
      td.when(articleStorage.renameArticleDirAPI(bundle.path, renamed_bundle.article?.dir?.name!)).thenResolve(renamed_bundle)

      // テスト対象実行
      const [actual] = await articleStorage.renameDir(toBasePath(bundle.path), renamed_bundle.article?.dir?.name!)

      expect(actual.id).toBe(renamed_bundle.id)
      expect(actual.path).toBe(toBasePath(renamed_bundle.path))
      expect(actual.name).toBe(renamed_bundle.name)
      expect(actual.version).toBe(renamed_bundle.version)
      expect(actual.article?.dir?.name).toBe(renamed_bundle.article?.dir?.name)
      expect(actual.article?.dir?.type).toBe(renamed_bundle.article?.dir?.type)
      expect(actual.article?.dir?.sortOrder).toBe(renamed_bundle.article?.dir?.sortOrder)

      const updated_bundle = articleStorage.sgetNode({ id: renamed_bundle.id })
      expect(updated_bundle.id).toBe(renamed_bundle.id)
      expect(updated_bundle.path).toBe(toBasePath(renamed_bundle.path))
      expect(updated_bundle.name).toBe(renamed_bundle.name)
      expect(updated_bundle.version).toBe(renamed_bundle.version)
      expect(updated_bundle.article?.dir?.name).toBe(renamed_bundle.article?.dir?.name)
      expect(updated_bundle.article?.dir?.type).toBe(renamed_bundle.article?.dir?.type)
      expect(updated_bundle.article?.dir?.sortOrder).toBe(renamed_bundle.article?.dir?.sortOrder)

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
        service: { articleStorage, appStorage },
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
      expect(actual.article).toBeUndefined()

      const updated_x1 = articleStorage.sgetNode({ id: renamed_x1.id })
      expect(updated_x1.id).toBe(renamed_x1.id)
      expect(updated_x1.path).toBe(toBasePath(renamed_x1.path))
      expect(updated_x1.name).toBe(renamed_x1.name)
      expect(updated_x1.version).toBe(renamed_x1.version)
      expect(updated_x1.article).toBeUndefined()

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
        service: { articleStorage, appStorage },
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
      expect(actual.article).toBeUndefined()

      const updated_x1 = articleStorage.sgetNode({ id: renamed_x1.id })
      expect(updated_x1.id).toBe(renamed_x1.id)
      expect(updated_x1.path).toBe(toBasePath(renamed_x1.path))
      expect(updated_x1.name).toBe(renamed_x1.name)
      expect(updated_x1.version).toBe(renamed_x1.version)
      expect(updated_x1.article).toBeUndefined()

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
        article: {
          dir: {
            name: 'バンドル',
            type: 'TreeBundle',
            sortOrder: 1,
          },
        },
      })
      const cat1 = newStorageDirNode(`${bundle.path}/${StorageNode.generateId()}`, {
        article: {
          dir: {
            name: 'カテゴリ1',
            type: 'Category',
            sortOrder: 1,
          },
        },
      })
      const art1 = newStorageDirNode(`${cat1.path}/${StorageNode.generateId()}`, {
        article: {
          dir: {
            name: '記事1',
            type: 'Article',
            sortOrder: 1,
          },
        },
      })
      const d1 = newStorageDirNode(`${art1.path}/d1`)
      const {
        service: { articleStorage, appStorage },
      } = provideDependency(({ store }) => {
        store.storage.setAll([users, user, articles, bundle, cat1, art1])
      })

      // モック設定
      td.when(articleStorage.createArticleGeneralDirAPI(d1.path)).thenResolve(d1)

      // テスト対象実行
      const actual = await articleStorage.createDir(toBasePath(d1.path))

      expect(actual.id).toBe(d1.id)
      expect(actual.path).toBe(toBasePath(d1.path))
      expect(actual.article).toBeUndefined()

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
        article: {
          dir: {
            name: 'バンドル',
            type: 'TreeBundle',
            sortOrder: 1,
          },
        },
      })
      const cat1 = newStorageDirNode(`${bundle.path}/${StorageNode.generateId()}`, {
        article: {
          dir: {
            name: 'カテゴリ1',
            type: 'Category',
            sortOrder: 1,
          },
        },
      })
      const art1 = newStorageDirNode(`${cat1.path}/${StorageNode.generateId()}`, {
        article: {
          dir: {
            name: '記事1',
            type: 'Article',
            sortOrder: 1,
          },
        },
      })
      const d1 = newStorageDirNode(`${art1.path}/d1`)
      const {
        service: { articleStorage, appStorage },
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
        article: {
          dir: {
            name: 'バンドル',
            type: 'ListBundle',
            sortOrder: 1,
          },
        },
      })
      const {
        service: { articleStorage, appStorage },
      } = provideDependency(({ store }) => {
        store.storage.setAll([users, user, articles])
      })

      // モック設定
      td.when(
        articleStorage.createArticleTypeDirAPI(
          {
            dir: bundle.dir,
            name: bundle.article?.dir?.name!,
            type: bundle.article?.dir?.type!,
          },
          undefined
        )
      ).thenResolve(bundle)

      // テスト対象実行
      const actual = await articleStorage.createArticleTypeDir({
        dir: ``,
        name: bundle.article?.dir?.name!,
        type: bundle.article?.dir?.type!,
      })

      expect(actual.id).toBe(bundle.id)
      expect(actual.path).toBe(toBasePath(bundle.path))
      expect(actual.article?.dir?.name).toBe(bundle.article?.dir?.name)
      expect(actual.article?.dir?.type).toBe(bundle.article?.dir?.type)
      expect(actual.article?.dir?.sortOrder).toBe(bundle.article?.dir?.sortOrder)

      const hierarchicalNodes = appStorage.getHierarchicalNodes(bundle.path)
      expect(hierarchicalNodes.length).toBe(4)
      expect(hierarchicalNodes[0].path).toBe(users.path)
      expect(hierarchicalNodes[1].path).toBe(user.path)
      expect(hierarchicalNodes[2].path).toBe(articles.path)
      expect(hierarchicalNodes[3].path).toBe(bundle.path)
    })

    it('ベーシックケース - 記事ディレクトリ作成', async () => {
      const bundle = newStorageDirNode(`${articles.path}/${StorageNode.generateId()}`, {
        article: {
          dir: {
            name: 'バンドル',
            type: 'TreeBundle',
            sortOrder: 1,
          },
        },
      })
      const cat1 = newStorageDirNode(`${bundle.path}/${StorageNode.generateId()}`, {
        article: {
          dir: {
            name: 'カテゴリ1',
            type: 'Category',
            sortOrder: 1,
          },
        },
      })
      const art1 = newStorageDirNode(`${cat1.path}/${StorageNode.generateId()}`, {
        article: {
          dir: {
            name: '記事1',
            type: 'Article',
            sortOrder: 1,
          },
        },
      })
      const art1_master = newStorageFileNode(StorageUtil.toArticleSrcMasterPath(art1.path), {
        article: {
          file: {
            type: 'Master',
          },
        },
      })
      const art1_draft = newStorageFileNode(StorageUtil.toArticleSrcDraftPath(art1.path), {
        article: {
          file: {
            type: 'Draft',
          },
        },
      })
      const {
        service: { articleStorage, appStorage },
      } = provideDependency(({ store }) => {
        store.storage.setAll([users, user, articles, bundle, cat1])
      })

      // モック設定
      td.when(
        articleStorage.createArticleTypeDirAPI(
          {
            dir: art1.dir,
            name: art1.article?.dir?.name!,
            type: art1.article?.dir?.type!,
          },
          undefined
        )
      ).thenResolve(art1)
      td.when(articleStorage.getChildrenAPI(art1.path)).thenResolve([art1_master, art1_draft])

      // テスト対象実行
      const actual = await articleStorage.createArticleTypeDir({
        dir: `${bundle.id}/${cat1.id}`,
        name: art1.article?.dir?.name!,
        type: art1.article?.dir?.type!,
      })

      expect(actual.id).toBe(art1.id)
      expect(actual.path).toBe(toBasePath(art1.path))
      expect(actual.article?.dir?.name).toBe(art1.article?.dir?.name)
      expect(actual.article?.dir?.type).toBe(art1.article?.dir?.type)
      expect(actual.article?.dir?.sortOrder).toBe(art1.article?.dir?.sortOrder)

      const hierarchicalNodes = appStorage.getHierarchicalNodes(art1.path)
      expect(hierarchicalNodes.length).toBe(6)
      expect(hierarchicalNodes[0].path).toBe(users.path)
      expect(hierarchicalNodes[1].path).toBe(user.path)
      expect(hierarchicalNodes[2].path).toBe(articles.path)
      expect(hierarchicalNodes[3].path).toBe(bundle.path)
      expect(hierarchicalNodes[4].path).toBe(cat1.path)
      expect(hierarchicalNodes[5].path).toBe(art1.path)

      const childNodes = appStorage.getChildren(art1.path)
      expect(childNodes.length).toBe(2)
      expect(childNodes[0].path).toBe(art1_master.path)
      expect(childNodes[1].path).toBe(art1_draft.path)
    })

    it('共有設定を指定した場合', async () => {
      const bundle = newStorageDirNode(`${articles.path}/${StorageNode.generateId()}`, {
        article: {
          dir: {
            name: 'バンドル',
            type: 'ListBundle',
            sortOrder: 1,
          },
        },
        share: { isPublic: true, readUIds: ['ichiro'], writeUIds: ['ichiro'] },
      })
      const {
        service: { articleStorage, appStorage },
      } = provideDependency(({ store }) => {
        store.storage.setAll([users, user, articles])
      })

      // モック設定
      td.when(
        articleStorage.createArticleTypeDirAPI(
          {
            dir: bundle.dir,
            name: bundle.article?.dir?.name!,
            type: bundle.article?.dir?.type!,
          },
          { share: bundle.share }
        )
      ).thenResolve(bundle)

      // テスト対象実行
      const actual = await articleStorage.createArticleTypeDir(
        {
          dir: ``,
          name: bundle.article?.dir?.name!,
          type: bundle.article?.dir?.type!,
        },
        { share: bundle.share }
      )

      expect(actual.id).toBe(bundle.id)
      expect(actual.path).toBe(toBasePath(bundle.path))
      expect(actual.article?.dir?.name).toBe(bundle.article?.dir?.name)
      expect(actual.article?.dir?.type).toBe(bundle.article?.dir?.type)
      expect(actual.article?.dir?.sortOrder).toBe(bundle.article?.dir?.sortOrder)
      expect(actual.share).toEqual(bundle.share)
    })

    it('階層を構成するノードが欠けていた場合', async () => {
      const bundle = newStorageDirNode(`${articles.path}/${StorageNode.generateId()}`, {
        article: {
          dir: {
            name: 'バンドル',
            type: 'TreeBundle',
            sortOrder: 1,
          },
        },
      })
      const cat1 = newStorageDirNode(`${bundle.path}/${StorageNode.generateId()}`, {
        article: {
          dir: {
            name: 'カテゴリ1',
            type: 'Category',
            sortOrder: 1,
          },
        },
      })
      const art1 = newStorageDirNode(`${cat1.path}/${StorageNode.generateId()}`, {
        article: {
          dir: {
            name: '記事1',
            type: 'Article',
            sortOrder: 1,
          },
        },
      })
      const {
        service: { articleStorage, appStorage },
      } = provideDependency(({ store }) => {
        // ※｢bundle｣が欠けているように設定
        store.storage.setAll([users, user, articles, cat1])
      })

      let actual!: Error
      try {
        // テスト対象実行
        await articleStorage.createArticleTypeDir({
          dir: `${bundle.id}/${cat1.id}`,
          name: art1.article?.dir?.name!,
          type: art1.article?.dir?.type!,
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
        article: {
          dir: {
            name: 'バンドル',
            type: 'ListBundle',
            sortOrder: 1,
          },
        },
      })
      const art1 = newStorageDirNode(`${bundle.path}/${StorageNode.generateId()}`, {
        article: {
          dir: {
            name: '記事1',
            type: 'Article',
            sortOrder: 1,
          },
        },
      })
      const art2 = newStorageDirNode(`${bundle.path}/${StorageNode.generateId()}`, {
        article: {
          dir: {
            name: '記事2',
            type: 'Article',
            sortOrder: 2,
          },
        },
      })
      const {
        service: { articleStorage, appStorage },
      } = provideDependency(({ store }) => {
        store.storage.setAll([users, user, articles, bundle, art2, art1])
      })

      // モック設定
      art1.article!.dir!.sortOrder = 2
      art2.article!.dir!.sortOrder = 1
      td.when(articleStorage.getNodesAPI({ paths: [art1.path, art2.path] })).thenResolve([art1, art2])

      // テスト対象実行
      const actual = await articleStorage.setArticleSortOrder(toBasePaths([art1.path, art2.path]))

      // 戻り値の検証
      {
        const [_art1, _art2] = actual
        expect(_art1.path).toBe(toBasePath(art1.path))
        expect(_art1.article?.dir?.sortOrder).toBe(2)
        expect(_art2.path).toBe(toBasePath(art2.path))
        expect(_art2.article?.dir?.sortOrder).toBe(1)
      }
      // ストアの検証
      {
        const [_art1, _art2] = articleStorage.getNodes({ ids: [art1.id, art2.id] })
        expect(_art1.path).toBe(toBasePath(art1.path))
        expect(_art1.article?.dir?.sortOrder).toBe(2)
        expect(_art2.path).toBe(toBasePath(art2.path))
        expect(_art2.article?.dir?.sortOrder).toBe(1)
      }

      const exp = td.explain(articleStorage.setArticleSortOrderAPI.value)
      expect(exp.calls[0].args).toEqual([[art1.path, art2.path]])
    })

    it('大量データの場合', async () => {
      const Num = 101

      const bundle = newStorageDirNode(`${articles.path}/${StorageNode.generateId()}`, {
        article: {
          dir: {
            name: 'バンドル',
            type: 'ListBundle',
            sortOrder: 1,
          },
        },
      })
      const arts: StorageNode[] = []
      for (let i = 0; i < Num; i++) {
        arts.push(
          newStorageDirNode(`${bundle.path}/${StorageNode.generateId()}`, {
            article: {
              dir: {
                name: `記事${i + 1}`,
                type: 'Article',
                sortOrder: -1,
              },
            },
          })
        )
      }
      const {
        service: { articleStorage, appStorage },
      } = provideDependency(({ store }) => {
        store.storage.setAll([users, user, articles, bundle, ...arts])
      })

      // モック設定
      arts.forEach((art, index) => (art.article!.dir!.sortOrder = Num - index))
      const art1to50 = arts.slice(0, 50)
      const art51to100 = arts.slice(50, 100)
      const art101to = arts.slice(100, Num)
      td.when(articleStorage.getNodesAPI({ paths: art1to50.map(art => art.path) })).thenResolve(art1to50)
      td.when(articleStorage.getNodesAPI({ paths: art51to100.map(art => art.path) })).thenResolve(art51to100)
      td.when(articleStorage.getNodesAPI({ paths: art101to.map(art => art.path) })).thenResolve(art101to)

      // テスト対象実行
      const actual = await articleStorage.setArticleSortOrder(toBasePaths(arts.map(art => art.path)))

      // 戻り値の検証
      for (let i = 0; i < Num; i++) {
        const art = arts[i]
        const _art = actual[i]
        expect(_art.path).toBe(toBasePath(art.path))
        expect(_art.article?.dir?.sortOrder).toBe(Num - i)
      }
      // ストアの検証
      for (let i = 0; i < Num; i++) {
        const art = arts[i]
        const _art = articleStorage.sgetNode({ id: art.id })
        expect(_art.path).toBe(toBasePath(art.path))
        expect(_art.article?.dir?.sortOrder).toBe(Num - i)
      }

      const exp = td.explain(articleStorage.setArticleSortOrderAPI.value)
      expect(exp.calls[0].args).toEqual([arts.map(art => art.path)])
    })
  })

  describe('saveArticleSrcMasterFile', () => {
    it('ベーシックケース', async () => {
      const bundle = newStorageDirNode(`${articles.path}/${StorageNode.generateId()}`, {
        article: {
          dir: {
            name: 'バンドル',
            type: 'ListBundle',
            sortOrder: 1,
          },
        },
      })
      const art1 = newStorageDirNode(`${bundle.path}/${StorageNode.generateId()}`, {
        article: {
          dir: {
            name: '記事1',
            type: 'Article',
            sortOrder: 1,
          },
        },
      })
      const art1_master = newStorageFileNode(StorageUtil.toArticleSrcMasterPath(art1.path), {
        article: { file: { type: 'Master' } },
      })
      const art1_draft = newStorageFileNode(StorageUtil.toArticleSrcDraftPath(art1.path), {
        article: { file: { type: 'Draft' } },
      })
      const {
        service: { articleStorage, appStorage },
      } = provideDependency(({ store }) => {
        store.storage.setAll([users, user, articles, bundle, art1, art1_master, art1_draft])
      })

      // モック設定
      const srcContent = '#header1'
      const textContent = 'header1'
      const saved_art1_master = cloneStorageNode(art1_master, {
        size: Buffer.byteLength(srcContent),
        updatedAt: dayjs(),
        version: art1_master.version + 1,
      })
      const saved_art1_draft = cloneStorageNode(art1_draft, {
        size: Buffer.byteLength(srcContent),
        updatedAt: dayjs(),
        version: art1_draft.version + 1,
      })
      td.when(articleStorage.saveArticleSrcMasterFileAPI(toFullPath(art1.path), srcContent, textContent)).thenResolve({
        master: saved_art1_master,
        draft: saved_art1_draft,
      })

      // テスト対象実行
      const actual = await articleStorage.saveArticleSrcMasterFile(art1.path, srcContent, textContent)

      // 戻り値の検証
      // ソースファイル
      expect(actual.master.id).toBe(saved_art1_master.id)
      expect(actual.master.path).toBe(toBasePath(saved_art1_master.path))
      expect(actual.master.size).toBe(saved_art1_master.size)
      expect(actual.master.updatedAt).toEqual(saved_art1_master.updatedAt)
      expect(actual.master.version).toBe(saved_art1_master.version)
      // 下書きファイル
      expect(actual.draft.id).toBe(saved_art1_draft.id)
      expect(actual.draft.path).toBe(toBasePath(saved_art1_draft.path))
      expect(actual.draft.size).toBe(saved_art1_draft.size)
      expect(actual.draft.updatedAt).toEqual(saved_art1_draft.updatedAt)
      expect(actual.draft.version).toBe(saved_art1_draft.version)

      // ストアの検証
      // ソースファイル
      const stored_art1_master = appStorage.sgetNode(saved_art1_master)
      expect(stored_art1_master.id).toBe(saved_art1_master.id)
      expect(stored_art1_master.path).toBe(saved_art1_master.path)
      expect(stored_art1_master.size).toBe(saved_art1_master.size)
      expect(stored_art1_master.updatedAt).toEqual(saved_art1_master.updatedAt)
      expect(stored_art1_master.version).toBe(saved_art1_master.version)
      // 下書きファイル
      const stored_art1_draft = appStorage.sgetNode(saved_art1_draft)
      expect(stored_art1_draft.id).toBe(saved_art1_draft.id)
      expect(stored_art1_draft.path).toBe(saved_art1_draft.path)
      expect(stored_art1_draft.size).toBe(saved_art1_draft.size)
      expect(stored_art1_draft.updatedAt).toEqual(saved_art1_draft.updatedAt)
      expect(stored_art1_draft.version).toBe(saved_art1_draft.version)
    })
  })

  describe('saveArticleSrcDraftFile', () => {
    it('ベーシックケース', async () => {
      const bundle = newStorageDirNode(`${articles.path}/${StorageNode.generateId()}`, {
        article: {
          dir: {
            name: 'バンドル',
            type: 'ListBundle',
            sortOrder: 1,
          },
        },
      })
      const art1 = newStorageDirNode(`${bundle.path}/${StorageNode.generateId()}`, {
        article: {
          dir: {
            name: '記事1',
            type: 'Article',
            sortOrder: 1,
          },
        },
      })
      const art1_master = newStorageFileNode(StorageUtil.toArticleSrcMasterPath(art1.path), {
        article: { file: { type: 'Master' } },
      })
      const art1_draft = newStorageFileNode(StorageUtil.toArticleSrcDraftPath(art1.path), {
        article: { file: { type: 'Draft' } },
      })
      const {
        service: { articleStorage, appStorage },
      } = provideDependency(({ store }) => {
        store.storage.setAll([users, user, articles, bundle, art1, art1_master, art1_draft])
      })

      // モック設定
      const srcContent = '#header1'
      const saved_art1_draft = cloneStorageNode(art1_draft, {
        size: Buffer.byteLength(srcContent),
        updatedAt: dayjs(),
        version: art1_draft.version + 1,
      })
      td.when(articleStorage.saveArticleSrcDraftFileAPI(toFullPath(art1.path), srcContent)).thenResolve(saved_art1_draft)

      // テスト対象実行
      const actual = await articleStorage.saveArticleSrcDraftFile(art1.path, srcContent)

      // 戻り値の検証
      expect(actual.id).toBe(saved_art1_draft.id)
      expect(actual.path).toBe(toBasePath(saved_art1_draft.path))
      expect(actual.size).toBe(saved_art1_draft.size)
      expect(actual.updatedAt).toEqual(saved_art1_draft.updatedAt)
      expect(actual.version).toBe(saved_art1_draft.version)

      // ストアの検証
      const stored_art1_master = appStorage.sgetNode(saved_art1_draft)
      expect(stored_art1_master.id).toBe(saved_art1_draft.id)
      expect(stored_art1_master.path).toBe(saved_art1_draft.path)
      expect(stored_art1_master.size).toBe(saved_art1_draft.size)
      expect(stored_art1_master.updatedAt).toEqual(saved_art1_draft.updatedAt)
      expect(stored_art1_master.version).toBe(saved_art1_draft.version)
    })
  })
})
