import * as td from 'testdouble'
import { BaseStoragePage, StoragePageMixin } from '@/app/views/base/storage'
import { StorageArticleNodeType, StorageLogic, StorageType, logic } from '@/app/logic'
import { StorageRoute, router } from '@/app/router'
import { Wrapper, mount } from '@vue/test-utils'
import { newTestStorageDirNode, newTestStorageFileNode } from '../../../../../helpers/app/storage'
import { StoragePageStore } from '@/app/views/base/storage'
import { config } from '@/app/config'
import { initTestApp } from '../../../../../helpers/app/init'

//========================================================================
//
//  Test helpers
//
//=======================================================================

type TestStoragePageMixin = StoragePageMixin & {
  storageLogic: StoragePageMixin['storageLogic']
  storageRoute: StoragePageMixin['storageRoute']
  pageStore: StoragePageMixin['pageStore']
  isArticleFile: StoragePageMixin['isArticleFile']
  isArticleDescendant: StoragePageMixin['isArticleDescendant']
}

function newStoragePageMixin(params: { storageType?: StorageType }): TestStoragePageMixin {
  StoragePageStore.clear()

  const storageType = params.storageType || 'app'
  const storageLogic = td.object<StorageLogic>()
  const storageRoute = td.object<StorageRoute>()

  const storagePage = td.object<BaseStoragePage>()
  StoragePageStore.register(storageType, storagePage)

  const wrapper = mount(StoragePageMixin, {
    propsData: { storageType },
  }) as Wrapper<TestStoragePageMixin>
  const pageMixin = wrapper.vm as TestStoragePageMixin
  td.replace(pageMixin, 'storageLogic', storageLogic)
  td.replace(pageMixin, 'storageRoute', storageRoute)

  return pageMixin
}

//========================================================================
//
//  Tests
//
//========================================================================

beforeAll(async () => {
  await initTestApp()
})

beforeEach(async () => {})

describe('StoragePageMixin', () => {
  describe('constructor', () => {
    function newStoragePageMixin(params: { storageType?: StorageType }): TestStoragePageMixin {
      StoragePageStore.clear()

      const storageType = params.storageType || 'app'

      const storagePage = td.object<BaseStoragePage>()
      StoragePageStore.register(storageType, storagePage)

      const wrapper = mount(StoragePageMixin, {
        propsData: { storageType },
      }) as Wrapper<TestStoragePageMixin>

      return wrapper.vm as TestStoragePageMixin
    }

    it('アプリケーションストレージ', async () => {
      const actual = newStoragePageMixin({ storageType: 'app' })

      expect(actual.storageLogic).toBe(logic.appStorage)
      expect(actual.storageRoute).toBe(router.views.demo.appStorage)
    })

    it('ユーザーストレージ', async () => {
      const actual = newStoragePageMixin({ storageType: 'user' })

      expect(actual.storageLogic).toBe(logic.userStorage)
      expect(actual.storageRoute).toBe(router.views.demo.userStorage)
    })

    it('記事ストレージ', async () => {
      const actual = newStoragePageMixin({ storageType: 'article' })

      expect(actual.storageLogic).toBe(logic.articleStorage)
      expect(actual.storageRoute).toBe(router.views.admin.article)
    })
  })

  describe('isArticleFile', () => {
    it('記事ファイルを指定', () => {
      const pageMixin = newStoragePageMixin({ storageType: 'article' })
      const articleFileName = config.storage.article.fileName

      // users
      // └john
      //   └articles
      //     └blog
      //       └art1
      //         └index.md ← 指定
      const blog = newTestStorageDirNode(`blog`, { articleNodeType: StorageArticleNodeType.ListBundle })
      const art1 = newTestStorageDirNode(`blog/art1`, { articleNodeType: StorageArticleNodeType.Article })
      const index = newTestStorageFileNode(`blog/art1/${articleFileName}`, {
        articleNodeType: StorageArticleNodeType.Article,
      })

      // モック設定
      td.when(pageMixin.storageLogic.getNode({ path: `${index.path}` })).thenReturn(index)
      td.when(pageMixin.storageLogic.getNode({ path: `${art1.path}` })).thenReturn(art1)

      const actual = pageMixin.isArticleFile(`${index.path}`)

      expect(actual).toBeTruthy()
    })

    it('記事ファイル以外を指定した場合', () => {
      const pageMixin = newStoragePageMixin({ storageType: 'app' })
      const articleFileName = config.storage.article.fileName

      // users
      // └john
      //   └articles
      //     └blog
      //       └art1 ← 指定
      //         └index.md
      const blog = newTestStorageDirNode(`blog`, { articleNodeType: StorageArticleNodeType.ListBundle })
      const art1 = newTestStorageDirNode(`blog/art1`, { articleNodeType: StorageArticleNodeType.Article })
      const index = newTestStorageFileNode(`blog/art1/${articleFileName}`, {
        articleNodeType: StorageArticleNodeType.Article,
      })

      // モック設定
      td.when(pageMixin.storageLogic.getNode({ path: `${art1.path}` })).thenReturn(art1)
      td.when(pageMixin.storageLogic.getNode({ path: `${blog.path}` })).thenReturn(blog)

      const actual = pageMixin.isArticleFile(`${art1.path}`)

      expect(actual).toBeFalsy()
    })
  })

  describe('isArticleDescendant', () => {
    it('ベーシックケース', () => {
      const pageMixin = newStoragePageMixin({ storageType: 'article' })

      // blog
      // └art1
      //   └d1
      //     └d11
      //       └f111.txt
      const blog = newTestStorageDirNode(`blog`, { articleNodeType: StorageArticleNodeType.ListBundle })
      const art1 = newTestStorageDirNode(`blog/art1`, { articleNodeType: StorageArticleNodeType.Article })
      const d1 = newTestStorageDirNode(`blog/art1/d1`)
      const d11 = newTestStorageDirNode(`blog/art1/d1/d11`)
      const f111 = newTestStorageFileNode(`blog/art1/d1/d11/f111.txt`)

      // モック設定
      td.when(pageMixin.storageLogic.getNode({ path: `${f111.path}` })).thenReturn(f111)
      td.when(pageMixin.storageLogic.getNode({ path: `${d11.path}` })).thenReturn(d11)
      td.when(pageMixin.storageLogic.getNode({ path: `${d1.path}` })).thenReturn(d1)
      td.when(pageMixin.storageLogic.getNode({ path: `${art1.path}` })).thenReturn(art1)

      const actual = pageMixin.isArticleDescendant(`${f111.path}`)

      expect(actual).toBeTruthy()
    })

    it('祖先に記事がない場合', () => {
      const pageMixin = newStoragePageMixin({ storageType: 'article' })

      // blog
      // └d1
      //   └d11
      //     └f111.txt
      const blog = newTestStorageDirNode(`blog`, { articleNodeType: StorageArticleNodeType.ListBundle })
      const d1 = newTestStorageDirNode(`blog/d1`)
      const d11 = newTestStorageDirNode(`blog/d1/d11`)
      const f111 = newTestStorageFileNode(`blog/d1/d11/f111.txt`)

      // モック設定
      td.when(pageMixin.storageLogic.getNode({ path: `${f111.path}` })).thenReturn(f111)
      td.when(pageMixin.storageLogic.getNode({ path: `${d11.path}` })).thenReturn(d11)
      td.when(pageMixin.storageLogic.getNode({ path: `${d1.path}` })).thenReturn(d1)
      td.when(pageMixin.storageLogic.getNode({ path: `${blog.path}` })).thenReturn(blog)

      const actual = pageMixin.isArticleDescendant(`${f111.path}`)

      expect(actual).toBeFalsy()
    })
  })
})
