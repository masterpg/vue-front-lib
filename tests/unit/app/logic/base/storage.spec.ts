import { Config, useConfig } from '@/app/config'
import { GeneralUser, newStorageDirNode, newStorageFileNode } from '../../../../helpers/app'
import { StorageArticleDirType, StorageArticleFileType, StorageNode, StorageUtil } from '@/app/logic'
import { shuffleArray } from 'web-base-lib'

describe('StorageUtil', () => {
  let config: Config

  beforeEach(() => {
    config = useConfig()
  })

  describe('sortNodes', () => {
    it('パターン①', async () => {
      // users
      // └test.general
      //   ├blog
      //   │├art1
      //   ││└index.md
      //   │└art2
      //   │  └index.md
      //   └category
      //     ├art1
      //     ├art2
      //     ├TypeScript
      //     │├art1
      //     ││└index.md
      //     │└art2
      //     │  └index.md
      //     └JavaScript
      //       ├art1
      //       │︙
      //       └art2
      //         ︙

      const articleRootPath = StorageUtil.toArticleRootPath(GeneralUser().uid)

      const blog = newStorageDirNode(`${articleRootPath}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'blog', type: StorageArticleDirType.ListBundle, sortOrder: 2 } },
      })
      const blog_art1 = newStorageDirNode(`${blog.path}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'art1', type: StorageArticleDirType.Article, sortOrder: 2 } },
      })
      const blog_art1_index = newStorageFileNode(`${blog_art1.path}/index.md`, {
        article: { file: { type: StorageArticleFileType.Index, content: '' } },
      })
      const blog_art2 = newStorageDirNode(`${blog.path}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'art2', type: StorageArticleDirType.Article, sortOrder: 1 } },
      })
      const blog_art2_index = newStorageFileNode(`${blog_art2.path}/index.md`, {
        article: { file: { type: StorageArticleFileType.Index, content: '' } },
      })

      const category = newStorageDirNode(`${articleRootPath}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'category', type: StorageArticleDirType.CategoryBundle, sortOrder: 1 } },
      })
      const category_art1 = newStorageDirNode(`${category.path}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'art1', type: StorageArticleDirType.Article, sortOrder: 4 } },
      })
      const category_art2 = newStorageDirNode(`${category.path}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'art2', type: StorageArticleDirType.Article, sortOrder: 3 } },
      })
      const category_ts = newStorageDirNode(`${category.path}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'TypeScript', type: StorageArticleDirType.Category, sortOrder: 2 } },
      })
      const category_ts_art1 = newStorageDirNode(`${category_ts.path}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'art1', type: StorageArticleDirType.Article, sortOrder: 2 } },
      })
      const category_ts_art1_index = newStorageFileNode(`${category_ts_art1.path}/index.md`, {
        article: { file: { type: StorageArticleFileType.Index, content: '' } },
      })
      const category_ts_art2 = newStorageDirNode(`${category_ts.path}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'art2', type: StorageArticleDirType.Article, sortOrder: 1 } },
      })
      const category_ts_art2_index = newStorageFileNode(`${category_ts_art2.path}/index.md`, {
        article: { file: { type: StorageArticleFileType.Index, content: '' } },
      })
      const category_js = newStorageDirNode(`${category.path}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'JavaScript', type: StorageArticleDirType.Category, sortOrder: 1 } },
      })
      const category_js_art1 = newStorageDirNode(`${category_js.path}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'art1', type: StorageArticleDirType.Article, sortOrder: 2 } },
      })
      const category_js_art2 = newStorageDirNode(`${category_js.path}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'art2', type: StorageArticleDirType.Article, sortOrder: 1 } },
      })

      const nodes = shuffleArray([
        blog,
        blog_art1,
        blog_art1_index,
        blog_art2,
        blog_art2_index,
        category,
        category_art1,
        category_art2,
        category_ts,
        category_ts_art1,
        category_ts_art1_index,
        category_ts_art2,
        category_ts_art2_index,
        category_js,
        category_js_art1,
        category_js_art2,
      ])

      // テスト対象実行
      StorageUtil.sortNodes(nodes)

      expect(nodes[0]).toBe(blog)
      expect(nodes[1]).toBe(blog_art1)
      expect(nodes[2]).toBe(blog_art1_index)
      expect(nodes[3]).toBe(blog_art2)
      expect(nodes[4]).toBe(blog_art2_index)
      expect(nodes[5]).toBe(category)
      expect(nodes[6]).toBe(category_art1)
      expect(nodes[7]).toBe(category_art2)
      expect(nodes[8]).toBe(category_ts)
      expect(nodes[9]).toBe(category_ts_art1)
      expect(nodes[10]).toBe(category_ts_art1_index)
      expect(nodes[11]).toBe(category_ts_art2)
      expect(nodes[12]).toBe(category_ts_art2_index)
      expect(nodes[13]).toBe(category_js)
      expect(nodes[14]).toBe(category_js_art1)
      expect(nodes[15]).toBe(category_js_art2)
    })

    it('パターン②', async () => {
      // ......
      //   ├art1
      //   ├art2
      //   ├TypeScript
      //   │├art1
      //   │└art2
      //   └JavaScript
      //     ├art1
      //     └art2

      const articleRootPath = StorageUtil.toArticleRootPath(GeneralUser().uid)
      const categoryPath = `${articleRootPath}/category`

      const category_art1 = newStorageDirNode(`${categoryPath}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'art1', type: StorageArticleDirType.Article, sortOrder: 4 } },
      })
      const category_art2 = newStorageDirNode(`${categoryPath}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'art2', type: StorageArticleDirType.Article, sortOrder: 3 } },
      })
      const category_ts = newStorageDirNode(`${categoryPath}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'TypeScript', type: StorageArticleDirType.Category, sortOrder: 2 } },
      })
      const category_ts_art1 = newStorageDirNode(`${category_ts.path}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'art1', type: StorageArticleDirType.Article, sortOrder: 2 } },
      })
      const category_ts_art2 = newStorageDirNode(`${category_ts.path}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'art2', type: StorageArticleDirType.Article, sortOrder: 1 } },
      })
      const category_js = newStorageDirNode(`${categoryPath}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'JavaScript', type: StorageArticleDirType.Category, sortOrder: 1 } },
      })
      const category_js_art1 = newStorageDirNode(`${category_js.path}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'art1', type: StorageArticleDirType.Article, sortOrder: 2 } },
      })
      const category_js_art2 = newStorageDirNode(`${category_js.path}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'art2', type: StorageArticleDirType.Article, sortOrder: 1 } },
      })

      // 実際は上位ディレクトリ(category)は存在するが、配列には追加されないパターン
      const nodes = shuffleArray([
        category_art1,
        category_art2,
        category_ts,
        category_ts_art1,
        category_ts_art2,
        category_js,
        category_js_art1,
        category_js_art2,
      ])

      // テスト対象実行
      StorageUtil.sortNodes(nodes)

      expect(nodes[0]).toBe(category_art1)
      expect(nodes[1]).toBe(category_art2)
      expect(nodes[2]).toBe(category_ts)
      expect(nodes[3]).toBe(category_ts_art1)
      expect(nodes[4]).toBe(category_ts_art2)
      expect(nodes[5]).toBe(category_js)
      expect(nodes[6]).toBe(category_js_art1)
      expect(nodes[7]).toBe(category_js_art2)
    })

    it('パターン③', async () => {
      // エラーも何も発生しないことを検証
      StorageUtil.sortNodes([])
    })
  })

  describe('getStorageType', () => {
    describe('タイプがarticleの場合', () => {
      it('パターン①', async () => {
        const userRootName = config.storage.user.rootName
        const articleRootName = config.storage.article.rootName

        // '/'なしで終わる
        const actual = StorageUtil.getStorageType(`${userRootName}/taro/${articleRootName}`)

        expect(actual).toBe('article')
      })

      it('パターン②', async () => {
        const userRootName = config.storage.user.rootName
        const articleRootName = config.storage.article.rootName

        // '/'で終わる
        const actual = StorageUtil.getStorageType(`${userRootName}/taro/${articleRootName}/`)

        expect(actual).toBe('article')
      })

      it('パターン③', async () => {
        const userRootName = config.storage.user.rootName
        const articleRootName = config.storage.article.rootName

        // '/'の続きがある
        const actual = StorageUtil.getStorageType(`${userRootName}/taro/${articleRootName}/aaa`)

        expect(actual).toBe('article')
      })
    })

    describe('タイプがuserの場合', () => {
      it('パターン①', async () => {
        const userRootName = config.storage.user.rootName

        // '/'なしで終わる
        const actual = StorageUtil.getStorageType(`${userRootName}/taro/aaa`)

        expect(actual).toBe('user')
      })

      it('パターン②', async () => {
        const userRootName = config.storage.user.rootName

        // '/'で終わる
        const actual = StorageUtil.getStorageType(`${userRootName}/taro/aaa/`)

        expect(actual).toBe('user')
      })
    })

    describe('タイプがappの場合', () => {
      it('パターン①', async () => {
        // '/'なしで終わる
        const actual = StorageUtil.getStorageType(`aaa`)

        expect(actual).toBe('app')
      })

      it('パターン②', async () => {
        // '/'で終わる
        const actual = StorageUtil.getStorageType(`aaa/`)

        expect(actual).toBe('app')
      })
    })
  })

  describe('isRootNode', () => {
    describe('記事ルート', () => {
      it(`'/'なしで終わる`, async () => {
        const userRootName = config.storage.user.rootName
        const articleRootName = config.storage.article.rootName

        // '/'なしで終わる
        const actual = StorageUtil.isRootNode(`${userRootName}/taro/${articleRootName}`)

        expect(actual).toBeTruthy()
      })

      it(`'/'ありで終わる`, async () => {
        const userRootName = config.storage.user.rootName
        const articleRootName = config.storage.article.rootName

        // '/'ありで終わる
        const actual = StorageUtil.isRootNode(`${userRootName}/taro/${articleRootName}/`)

        expect(actual).toBeTruthy()
      })

      it(`'/'の続きがある`, async () => {
        const userRootName = config.storage.user.rootName
        const articleRootName = config.storage.article.rootName

        // '/'ありで終わる
        const actual = StorageUtil.isRootNode(`${userRootName}/taro/${articleRootName}/aaa`)

        expect(actual).toBeFalsy()
      })
    })

    describe('ユーザールート', () => {
      it(`'/'なしで終わる`, async () => {
        const userRootName = config.storage.user.rootName

        // '/'なしで終わる
        const actual = StorageUtil.isRootNode(`${userRootName}/taro`)

        expect(actual).toBeTruthy()
      })

      it(`'/'ありで終わる`, async () => {
        const userRootName = config.storage.user.rootName

        // '/'ありで終わる
        const actual = StorageUtil.isRootNode(`${userRootName}/taro/`)

        expect(actual).toBeTruthy()
      })

      it(`'/'の続きがある`, async () => {
        const userRootName = config.storage.user.rootName

        // '/'ありで終わる
        const actual = StorageUtil.isRootNode(`${userRootName}/taro/aaa`)

        expect(actual).toBeFalsy()
      })
    })

    describe('アプリケーションルート', () => {
      it(`空文字の場合`, async () => {
        const actual = StorageUtil.isRootNode(``)
        expect(actual).toBeTruthy()
      })

      it(`undefinedの場合`, async () => {
        const actual = StorageUtil.isRootNode(undefined)
        expect(actual).toBeTruthy()
      })

      it(`'/'の場合`, async () => {
        const actual = StorageUtil.isRootNode(`/`)
        expect(actual).toBeFalsy()
      })

      it(`何かしらアプリケーションノードが指定された場合`, async () => {
        const actual = StorageUtil.isRootNode(`aaa`)
        expect(actual).toBeFalsy()
      })
    })
  })
})
