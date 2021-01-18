import { Config, useConfig } from '@/app/config'
import { GeneralUser, newStorageDirNode, newStorageFileNode } from '../../../../helpers/app'
import { StorageArticleDirType, StorageArticleFileType, StorageNode, StorageUtil } from '@/app/logic'
import { shuffleArray } from 'web-base-lib'

describe('StorageUtil', () => {
  let config: Config

  beforeEach(() => {
    config = useConfig()
  })

  describe('toFullPathNode', () => {
    it('ベーシックケース - 単一指定', async () => {
      const basePath = StorageUtil.toUserRootPath(GeneralUser().uid)
      const d1 = newStorageDirNode(`d1`)

      const actual = StorageUtil.toFullPathNode(`${basePath}`, d1)

      expect(actual.dir).toBe(`${basePath}`)
      expect(actual.path).toBe(`${basePath}/d1`)
    })

    it('ベーシックケース - 複数指定', async () => {
      const basePath = StorageUtil.toUserRootPath(GeneralUser().uid)
      const d1 = newStorageDirNode(`d1`)
      const d2 = newStorageDirNode(`d2`)

      const actual = StorageUtil.toFullPathNode(`${basePath}`, [d1, d2])

      const [_d1, _d2] = actual
      expect(_d1.dir).toBe(`${basePath}`)
      expect(_d1.path).toBe(`${basePath}/d1`)
      expect(_d2.dir).toBe(`${basePath}`)
      expect(_d2.path).toBe(`${basePath}/d2`)
    })
  })

  describe('toBasePathNode', () => {
    it('ベーシックケース - 単一指定', async () => {
      const basePath = StorageUtil.toUserRootPath(GeneralUser().uid)
      const d1 = newStorageDirNode(`${basePath}/d1`)

      const actual = StorageUtil.toBasePathNode(`${basePath}`, d1)

      expect(actual.dir).toBe(``)
      expect(actual.path).toBe(`d1`)
    })

    it('ベーシックケース - 複数指定', async () => {
      const basePath = StorageUtil.toUserRootPath(GeneralUser().uid)
      const d1 = newStorageDirNode(`${basePath}/d1`)
      const d2 = newStorageDirNode(`${basePath}/d2`)

      const actual = StorageUtil.toBasePathNode(`${basePath}`, [d1, d2])

      const [_d1, _d2] = actual
      expect(_d1.dir).toBe(``)
      expect(_d1.path).toBe(`d1`)
      expect(_d2.dir).toBe(``)
      expect(_d2.path).toBe(`d2`)
    })

    it('指定ノードのパスがベースパスと同じ場合', async () => {
      const basePath = StorageUtil.toUserRootPath(GeneralUser().uid)
      const baseNode = newStorageDirNode(`${basePath}`)

      const actual = StorageUtil.toBasePathNode(`${basePath}`, baseNode)

      expect(actual.dir).toBe(``)
      expect(actual.path).toBe(baseNode.name)
    })

    it('指定ノードのパスがベースパス配下のノードでない場合', async () => {
      const basePath = StorageUtil.toUserRootPath(GeneralUser().uid)
      const d11 = newStorageDirNode(`d1/d11`)

      const actual = StorageUtil.toBasePathNode(`${basePath}`, d11)

      expect(actual).toEqual(d11) // ベースパス変換されない
    })
  })

  describe('toFullPath', () => {
    it('ベーシックケース - 単一指定', async () => {
      const basePath = StorageUtil.toUserRootPath(GeneralUser().uid)

      const actual = StorageUtil.toFullPath(`${basePath}`, `d1`)

      expect(actual).toBe(`${basePath}/d1`)
    })

    it('ベーシックケース - 複数指定', async () => {
      const basePath = StorageUtil.toUserRootPath(GeneralUser().uid)

      const actual = StorageUtil.toFullPath(`${basePath}`, [`d1`, `d2`])

      expect(actual[0]).toBe(`${basePath}/d1`)
      expect(actual[1]).toBe(`${basePath}/d2`)
    })

    it('スラッシュ付き', async () => {
      const basePath = StorageUtil.toUserRootPath(GeneralUser().uid)

      const actual = StorageUtil.toFullPath(`/${basePath}/`, `/`)

      expect(actual).toBe(`${basePath}`)
    })
  })

  describe('toBasePath', () => {
    it('ベーシックケース - 単一指定', async () => {
      const basePath = StorageUtil.toUserRootPath(GeneralUser().uid)

      const actual = StorageUtil.toBasePath(`${basePath}`, `${basePath}/d1`)

      expect(actual).toBe(`d1`)
    })

    it('ベーシックケース - 複数指定', async () => {
      const basePath = StorageUtil.toUserRootPath(GeneralUser().uid)

      const actual = StorageUtil.toBasePath(`${basePath}`, [`${basePath}/d1`, `${basePath}/d2`])

      expect(actual[0]).toBe(`d1`)
      expect(actual[1]).toBe(`d2`)
    })

    it('指定パスがベースパスと同じ場合', async () => {
      const basePath = StorageUtil.toUserRootPath(GeneralUser().uid)

      const actual = StorageUtil.toBasePath(`${basePath}`, `${basePath}`)

      expect(actual).toBe(``)
    })

    it('指定パスがベースパスと同じ場合 - ベースパスにスラッシュ付き', async () => {
      const basePath = StorageUtil.toUserRootPath(GeneralUser().uid)

      const actual = StorageUtil.toBasePath(`/${basePath}/`, `${basePath}`)

      expect(actual).toBe(``)
    })

    it('指定パスがベースパスと同じ場合 - 指定パスにスラッシュ付き', async () => {
      const basePath = StorageUtil.toUserRootPath(GeneralUser().uid)

      const actual = StorageUtil.toBasePath(`${basePath}`, `/${basePath}/`)

      expect(actual).toBe(``)
    })

    it('指定パスがベースパス配下のパスでない場合', async () => {
      const basePath = StorageUtil.toUserRootPath(GeneralUser().uid)

      const actual = StorageUtil.toBasePath(`${basePath}`, `d1/d11`)

      expect(actual).toBe(`d1/d11`) // ベースパス変換されない
    })
  })

  describe('sortNodes', () => {
    it('パターン①', async () => {
      // users
      // └test.general
      //   ├articles
      //   │├blog
      //   ││├artA
      //   │││├index.md
      //   │││├index.draft.md
      //   │││├images
      //   ││││├picA.png
      //   ││││└picB.png
      //   │││└memo.txt
      //   ││└artB
      //   ││  ├index.md
      //   ││  └index.draft.md
      //   │├programming
      //   ││├artC
      //   ││├artD
      //   ││├TypeScript
      //   │││├artE
      //   ││││├index.md
      //   ││││└index.draft.md
      //   │││└artF
      //   │││  ├index.md
      //   │││  └index.draft.md
      //   ││└JavaScript
      //   │└assets
      //   │  ├picC.png
      //   │  └picD.png
      //   └tmp
      //     ├d1
      //     │├f11.txt
      //     │└f12.txt
      //     ├d2
      //     └f1.txt

      const users = newStorageDirNode(config.storage.user.rootName)

      const userRoot = newStorageDirNode(StorageUtil.toUserRootPath(GeneralUser().uid))

      const articleRoot = newStorageDirNode(StorageUtil.toArticleRootPath(GeneralUser().uid))

      const blog = newStorageDirNode(`${articleRoot.path}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'blog', type: StorageArticleDirType.ListBundle, sortOrder: 2 } },
      })
      const blog_artA = newStorageDirNode(`${blog.path}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'art1', type: StorageArticleDirType.Article, sortOrder: 2 } },
      })
      const blog_artA_master = newStorageFileNode(StorageUtil.toArticleSrcMasterPath(blog_artA.path), {
        article: { file: { type: StorageArticleFileType.Master } },
      })
      const blog_artA_draft = newStorageFileNode(StorageUtil.toArticleSrcMasterPath(blog_artA.path), {
        article: { file: { type: StorageArticleFileType.Draft } },
      })
      const blog_artA_images = newStorageDirNode(`${blog_artA.path}/images`)
      const blog_artA_images_picA = newStorageFileNode(`${blog_artA_images.path}/picA.png`)
      const blog_artA_images_picB = newStorageFileNode(`${blog_artA_images.path}/picB.png`)
      const blog_artA_memo = newStorageFileNode(`${blog_artA.path}/memo.txt`)
      const blog_artB = newStorageDirNode(`${blog.path}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'art2', type: StorageArticleDirType.Article, sortOrder: 1 } },
      })
      const blog_artB_master = newStorageFileNode(StorageUtil.toArticleSrcMasterPath(blog_artB.path), {
        article: { file: { type: StorageArticleFileType.Master } },
      })
      const blog_artB_draft = newStorageFileNode(StorageUtil.toArticleSrcMasterPath(blog_artB.path), {
        article: { file: { type: StorageArticleFileType.Draft } },
      })

      const programming = newStorageDirNode(`${articleRoot.path}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'programming', type: StorageArticleDirType.TreeBundle, sortOrder: 1 } },
      })
      const programming_artC = newStorageDirNode(`${programming.path}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'art1', type: StorageArticleDirType.Article, sortOrder: 4 } },
      })
      const programming_artD = newStorageDirNode(`${programming.path}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'art2', type: StorageArticleDirType.Article, sortOrder: 3 } },
      })
      const programming_ts = newStorageDirNode(`${programming.path}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'TypeScript', type: StorageArticleDirType.Category, sortOrder: 2 } },
      })
      const programming_ts_artE = newStorageDirNode(`${programming_ts.path}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'art1', type: StorageArticleDirType.Article, sortOrder: 2 } },
      })
      const programming_ts_artE_master = newStorageFileNode(StorageUtil.toArticleSrcMasterPath(programming_ts_artE.path), {
        article: { file: { type: StorageArticleFileType.Master } },
      })
      const programming_ts_artE_draft = newStorageFileNode(StorageUtil.toArticleSrcMasterPath(programming_ts_artE.path), {
        article: { file: { type: StorageArticleFileType.Draft } },
      })
      const programming_ts_artF = newStorageDirNode(`${programming_ts.path}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'art2', type: StorageArticleDirType.Article, sortOrder: 1 } },
      })
      const programming_ts_artF_master = newStorageFileNode(StorageUtil.toArticleSrcMasterPath(programming_ts_artF.path), {
        article: { file: { type: StorageArticleFileType.Master } },
      })
      const programming_ts_artF_draft = newStorageFileNode(StorageUtil.toArticleSrcMasterPath(programming_ts_artF.path), {
        article: { file: { type: StorageArticleFileType.Draft } },
      })
      const programming_js = newStorageDirNode(`${programming.path}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'JavaScript', type: StorageArticleDirType.Category, sortOrder: 1 } },
      })

      const assets = newStorageDirNode(StorageUtil.toArticleAssetsPath(GeneralUser().uid))
      const assets_picC = newStorageFileNode(`${assets.path}/picC.png`)
      const assets_picD = newStorageFileNode(`${assets.path}/picD.png`)

      const tmp = newStorageDirNode(`${userRoot.path}/tmp`)
      const d1 = newStorageDirNode(`${tmp.path}/d1`)
      const f11 = newStorageFileNode(`${d1.path}/f11.txt`)
      const f12 = newStorageFileNode(`${d1.path}/f12.txt`)
      const d2 = newStorageDirNode(`${tmp.path}/d2`)
      const f1 = newStorageFileNode(`${tmp.path}/f1.txt`)

      const nodes = shuffleArray([
        users,
        userRoot,
        articleRoot,
        blog,
        blog_artA,
        blog_artA_master,
        blog_artA_draft,
        blog_artA_images,
        blog_artA_images_picA,
        blog_artA_images_picB,
        blog_artA_memo,
        blog_artB,
        blog_artB_master,
        blog_artB_draft,
        programming,
        programming_artC,
        programming_artD,
        programming_ts,
        programming_ts_artE,
        programming_ts_artE_master,
        programming_ts_artE_draft,
        programming_ts_artF,
        programming_ts_artF_master,
        programming_ts_artF_draft,
        programming_js,
        assets,
        assets_picC,
        assets_picD,
        tmp,
        d1,
        f11,
        f12,
        d2,
        f1,
      ])

      // テスト対象実行
      StorageUtil.sortNodes(nodes)

      expect(nodes[0]).toBe(users)
      expect(nodes[1]).toBe(userRoot)
      expect(nodes[2]).toBe(articleRoot)
      expect(nodes[3]).toBe(blog)
      expect(nodes[4]).toBe(blog_artA)
      expect(nodes[5]).toBe(blog_artA_master)
      expect(nodes[6]).toBe(blog_artA_draft)
      expect(nodes[7]).toBe(blog_artA_images)
      expect(nodes[8]).toBe(blog_artA_images_picA)
      expect(nodes[9]).toBe(blog_artA_images_picB)
      expect(nodes[10]).toBe(blog_artA_memo)
      expect(nodes[11]).toBe(blog_artB)
      expect(nodes[12]).toBe(blog_artB_master)
      expect(nodes[13]).toBe(blog_artB_draft)
      expect(nodes[14]).toBe(programming)
      expect(nodes[15]).toBe(programming_artC)
      expect(nodes[16]).toBe(programming_artD)
      expect(nodes[17]).toBe(programming_ts)
      expect(nodes[18]).toBe(programming_ts_artE)
      expect(nodes[19]).toBe(programming_ts_artE_master)
      expect(nodes[20]).toBe(programming_ts_artE_draft)
      expect(nodes[21]).toBe(programming_ts_artF)
      expect(nodes[22]).toBe(programming_ts_artF_master)
      expect(nodes[23]).toBe(programming_ts_artF_draft)
      expect(nodes[24]).toBe(programming_js)
      expect(nodes[25]).toBe(assets)
      expect(nodes[26]).toBe(assets_picC)
      expect(nodes[27]).toBe(assets_picD)
      expect(nodes[28]).toBe(tmp)
      expect(nodes[29]).toBe(d1)
      expect(nodes[30]).toBe(f11)
      expect(nodes[31]).toBe(f12)
      expect(nodes[32]).toBe(d2)
      expect(nodes[33]).toBe(f1)
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
      const programmingPath = `${articleRootPath}/programming`

      const programming_art1 = newStorageDirNode(`${programmingPath}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'art1', type: StorageArticleDirType.Article, sortOrder: 4 } },
      })
      const programming_art2 = newStorageDirNode(`${programmingPath}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'art2', type: StorageArticleDirType.Article, sortOrder: 3 } },
      })
      const programming_ts = newStorageDirNode(`${programmingPath}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'TypeScript', type: StorageArticleDirType.Category, sortOrder: 2 } },
      })
      const programming_ts_art1 = newStorageDirNode(`${programming_ts.path}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'art1', type: StorageArticleDirType.Article, sortOrder: 2 } },
      })
      const programming_ts_art2 = newStorageDirNode(`${programming_ts.path}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'art2', type: StorageArticleDirType.Article, sortOrder: 1 } },
      })
      const programming_js = newStorageDirNode(`${programmingPath}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'JavaScript', type: StorageArticleDirType.Category, sortOrder: 1 } },
      })
      const programming_js_art1 = newStorageDirNode(`${programming_js.path}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'art1', type: StorageArticleDirType.Article, sortOrder: 2 } },
      })
      const programming_js_art2 = newStorageDirNode(`${programming_js.path}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'art2', type: StorageArticleDirType.Article, sortOrder: 1 } },
      })

      // 実際は上位ディレクトリ(programming)は存在するが、配列には追加されないパターン
      const nodes = shuffleArray([
        programming_art1,
        programming_art2,
        programming_ts,
        programming_ts_art1,
        programming_ts_art2,
        programming_js,
        programming_js_art1,
        programming_js_art2,
      ])

      // テスト対象実行
      StorageUtil.sortNodes(nodes)

      expect(nodes[0]).toBe(programming_art1)
      expect(nodes[1]).toBe(programming_art2)
      expect(nodes[2]).toBe(programming_ts)
      expect(nodes[3]).toBe(programming_ts_art1)
      expect(nodes[4]).toBe(programming_ts_art2)
      expect(nodes[5]).toBe(programming_js)
      expect(nodes[6]).toBe(programming_js_art1)
      expect(nodes[7]).toBe(programming_js_art2)
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
