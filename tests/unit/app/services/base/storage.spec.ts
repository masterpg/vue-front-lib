import { Config, useConfig } from '@/app/config'
import { GeneralUser, newStorageDirNode, newStorageFileNode } from '../../../../helpers/app'
import { StorageHelper, StorageNode } from '@/app/services'
import { shuffleArray } from 'web-base-lib'

describe('StorageHelper', () => {
  let config: Config

  beforeEach(() => {
    config = useConfig()
  })

  describe('toFullPathNode', () => {
    it('ベーシックケース - 単一指定', async () => {
      const basePath = StorageHelper.toUserRootPath(GeneralUser().uid)
      const d1 = newStorageDirNode(`d1`)

      const actual = StorageHelper.toFullPathNode(`${basePath}`, d1)

      expect(actual.dir).toBe(`${basePath}`)
      expect(actual.path).toBe(`${basePath}/d1`)
    })

    it('ベーシックケース - 複数指定', async () => {
      const basePath = StorageHelper.toUserRootPath(GeneralUser().uid)
      const d1 = newStorageDirNode(`d1`)
      const d2 = newStorageDirNode(`d2`)

      const actual = StorageHelper.toFullPathNode(`${basePath}`, [d1, d2])

      const [_d1, _d2] = actual
      expect(_d1.dir).toBe(`${basePath}`)
      expect(_d1.path).toBe(`${basePath}/d1`)
      expect(_d2.dir).toBe(`${basePath}`)
      expect(_d2.path).toBe(`${basePath}/d2`)
    })
  })

  describe('toBasePathNode', () => {
    it('ベーシックケース', async () => {
      const basePath = StorageHelper.toUserRootPath(GeneralUser().uid)
      const d1 = newStorageDirNode(`${basePath}/d1`)

      const actual = StorageHelper.toBasePathNode(`${basePath}`, d1)!

      expect(actual.dir).toBe(``)
      expect(actual.path).toBe(`d1`)
    })

    it('指定ノードのパスがベースパスと同じ場合', async () => {
      const basePath = StorageHelper.toUserRootPath(GeneralUser().uid)
      const baseNode = newStorageDirNode(`${basePath}`)

      const actual = StorageHelper.toBasePathNode(`${basePath}`, baseNode)

      expect(actual).toBeUndefined()
    })

    it('指定ノードのパスがベースパス配下のノードでない場合', async () => {
      const basePath = StorageHelper.toUserRootPath(GeneralUser().uid)
      const d11 = newStorageDirNode(`d1/d11`)

      const actual = StorageHelper.toBasePathNode(`${basePath}`, d11)

      expect(actual).toBeUndefined()
    })
  })

  describe('toBasePathNodes', () => {
    it('ベーシックケース', async () => {
      const baseNode = newStorageDirNode(StorageHelper.toUserRootPath(GeneralUser().uid))
      const d1 = newStorageDirNode(`${baseNode.path}/d1`)
      const d2 = newStorageDirNode(`${baseNode.path}/d2`)

      const actual = StorageHelper.toBasePathNodes(`${baseNode.path}`, [d1, d2])

      const [_d1, _d2] = actual
      expect(_d1.dir).toBe(``)
      expect(_d1.path).toBe(`d1`)
      expect(_d2.dir).toBe(``)
      expect(_d2.path).toBe(`d2`)
    })

    it('指定ノードのパスがベースパスと同じ場合', async () => {
      const baseNode = newStorageDirNode(StorageHelper.toUserRootPath(GeneralUser().uid))
      const d1 = newStorageDirNode(`${baseNode.path}/d1`)
      const d2 = newStorageDirNode(`${baseNode.path}/d2`)

      const actual = StorageHelper.toBasePathNodes(`${baseNode.path}`, [baseNode, d1, d2])

      const [_d1, _d2] = actual
      expect(actual.length).toBe(2)
      expect(_d1.dir).toBe(``)
      expect(_d1.path).toBe(`d1`)
      expect(_d2.dir).toBe(``)
      expect(_d2.path).toBe(`d2`)
    })

    it('指定ノードのパスがベースパス配下のノードでない場合', async () => {
      const baseNode = newStorageDirNode(StorageHelper.toUserRootPath(GeneralUser().uid))
      const d1 = newStorageDirNode(`${baseNode.path}/d1`)
      const x1 = newStorageDirNode(`x1`)

      const actual = StorageHelper.toBasePathNodes(`${baseNode.path}`, [d1, x1])

      const [_d1] = actual
      expect(actual.length).toBe(1)
      expect(_d1.dir).toBe(``)
      expect(_d1.path).toBe(`d1`)
    })
  })

  describe('toFullPath', () => {
    it('ベーシックケース', async () => {
      const basePath = StorageHelper.toUserRootPath(GeneralUser().uid)

      const actual = StorageHelper.toFullPath(`${basePath}`, `d1`)

      expect(actual).toBe(`${basePath}/d1`)
    })

    it('パス指定しなかった場合', async () => {
      const basePath = StorageHelper.toUserRootPath(GeneralUser().uid)

      const actual = StorageHelper.toFullPath(`${basePath}`, undefined)

      expect(actual).toBe(`${basePath}`)
    })

    it('スラッシュ付き', async () => {
      const basePath = StorageHelper.toUserRootPath(GeneralUser().uid)

      const actual = StorageHelper.toFullPath(`/${basePath}/`, `/`)

      expect(actual).toBe(`${basePath}`)
    })
  })

  describe('toFullPaths', () => {
    it('ベーシックケース - 複数指定', async () => {
      const basePath = StorageHelper.toUserRootPath(GeneralUser().uid)

      const actual = StorageHelper.toFullPaths(`${basePath}`, [`d1`, `d2`])

      expect(actual[0]).toBe(`${basePath}/d1`)
      expect(actual[1]).toBe(`${basePath}/d2`)
    })
  })

  describe('toBasePath', () => {
    it('ベーシックケース', async () => {
      const basePath = StorageHelper.toUserRootPath(GeneralUser().uid)

      const actual = StorageHelper.toBasePath(`${basePath}`, `${basePath}/d1`)

      expect(actual).toBe(`d1`)
    })

    it('指定パスがベースパスと同じ場合', async () => {
      const basePath = StorageHelper.toUserRootPath(GeneralUser().uid)

      const actual = StorageHelper.toBasePath(`${basePath}`, `${basePath}`)

      expect(actual).toBe(``)
    })

    it('指定パスがベースパスと同じ場合 - ベースパスにスラッシュ付き', async () => {
      const basePath = StorageHelper.toUserRootPath(GeneralUser().uid)

      const actual = StorageHelper.toBasePath(`/${basePath}/`, `${basePath}`)

      expect(actual).toBe(``)
    })

    it('指定パスがベースパスと同じ場合 - 指定パスにスラッシュ付き', async () => {
      const basePath = StorageHelper.toUserRootPath(GeneralUser().uid)

      const actual = StorageHelper.toBasePath(`${basePath}`, `/${basePath}/`)

      expect(actual).toBe(``)
    })

    it('指定パスがベースパス配下のパスでない場合', async () => {
      const basePath = StorageHelper.toUserRootPath(GeneralUser().uid)

      const actual = StorageHelper.toBasePath(`${basePath}`, `d1/d11`)

      expect(actual).toBe(`d1/d11`) // ベースパス変換されない
    })
  })

  describe('toBasePaths', () => {
    it('ベーシックケース', async () => {
      const basePath = StorageHelper.toUserRootPath(GeneralUser().uid)

      const actual = StorageHelper.toBasePaths(`${basePath}`, [`${basePath}/d1`, `${basePath}/d2`])

      expect(actual[0]).toBe(`d1`)
      expect(actual[1]).toBe(`d2`)
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

      const userRoot = newStorageDirNode(StorageHelper.toUserRootPath(GeneralUser().uid))

      const articleRoot = newStorageDirNode(StorageHelper.toArticleRootPath(GeneralUser().uid))

      const blog = newStorageDirNode(`${articleRoot.path}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'blog', type: 'ListBundle', sortOrder: 2 } },
      })
      const blog_artA = newStorageDirNode(`${blog.path}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'art1', type: 'Article', sortOrder: 2 } },
      })
      const blog_artA_master = newStorageFileNode(StorageHelper.toArticleSrcMasterPath(blog_artA.path), {
        article: { file: { type: 'Master' } },
      })
      const blog_artA_draft = newStorageFileNode(StorageHelper.toArticleSrcMasterPath(blog_artA.path), {
        article: { file: { type: 'Draft' } },
      })
      const blog_artA_images = newStorageDirNode(`${blog_artA.path}/images`)
      const blog_artA_images_picA = newStorageFileNode(`${blog_artA_images.path}/picA.png`)
      const blog_artA_images_picB = newStorageFileNode(`${blog_artA_images.path}/picB.png`)
      const blog_artA_memo = newStorageFileNode(`${blog_artA.path}/memo.txt`)
      const blog_artB = newStorageDirNode(`${blog.path}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'art2', type: 'Article', sortOrder: 1 } },
      })
      const blog_artB_master = newStorageFileNode(StorageHelper.toArticleSrcMasterPath(blog_artB.path), {
        article: { file: { type: 'Master' } },
      })
      const blog_artB_draft = newStorageFileNode(StorageHelper.toArticleSrcMasterPath(blog_artB.path), {
        article: { file: { type: 'Draft' } },
      })

      const programming = newStorageDirNode(`${articleRoot.path}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'programming', type: 'TreeBundle', sortOrder: 1 } },
      })
      const programming_artC = newStorageDirNode(`${programming.path}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'art1', type: 'Article', sortOrder: 4 } },
      })
      const programming_artD = newStorageDirNode(`${programming.path}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'art2', type: 'Article', sortOrder: 3 } },
      })
      const programming_ts = newStorageDirNode(`${programming.path}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'TypeScript', type: 'Category', sortOrder: 2 } },
      })
      const programming_ts_artE = newStorageDirNode(`${programming_ts.path}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'art1', type: 'Article', sortOrder: 2 } },
      })
      const programming_ts_artE_master = newStorageFileNode(StorageHelper.toArticleSrcMasterPath(programming_ts_artE.path), {
        article: { file: { type: 'Master' } },
      })
      const programming_ts_artE_draft = newStorageFileNode(StorageHelper.toArticleSrcMasterPath(programming_ts_artE.path), {
        article: { file: { type: 'Draft' } },
      })
      const programming_ts_artF = newStorageDirNode(`${programming_ts.path}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'art2', type: 'Article', sortOrder: 1 } },
      })
      const programming_ts_artF_master = newStorageFileNode(StorageHelper.toArticleSrcMasterPath(programming_ts_artF.path), {
        article: { file: { type: 'Master' } },
      })
      const programming_ts_artF_draft = newStorageFileNode(StorageHelper.toArticleSrcMasterPath(programming_ts_artF.path), {
        article: { file: { type: 'Draft' } },
      })
      const programming_js = newStorageDirNode(`${programming.path}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'JavaScript', type: 'Category', sortOrder: 1 } },
      })

      const assets = newStorageDirNode(StorageHelper.toArticleAssetsPath(GeneralUser().uid))
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
      StorageHelper.sortNodes(nodes)

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

      const articleRootPath = StorageHelper.toArticleRootPath(GeneralUser().uid)
      const programmingPath = `${articleRootPath}/programming`

      const programming_art1 = newStorageDirNode(`${programmingPath}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'art1', type: 'Article', sortOrder: 4 } },
      })
      const programming_art2 = newStorageDirNode(`${programmingPath}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'art2', type: 'Article', sortOrder: 3 } },
      })
      const programming_ts = newStorageDirNode(`${programmingPath}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'TypeScript', type: 'Category', sortOrder: 2 } },
      })
      const programming_ts_art1 = newStorageDirNode(`${programming_ts.path}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'art1', type: 'Article', sortOrder: 2 } },
      })
      const programming_ts_art2 = newStorageDirNode(`${programming_ts.path}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'art2', type: 'Article', sortOrder: 1 } },
      })
      const programming_js = newStorageDirNode(`${programmingPath}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'JavaScript', type: 'Category', sortOrder: 1 } },
      })
      const programming_js_art1 = newStorageDirNode(`${programming_js.path}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'art1', type: 'Article', sortOrder: 2 } },
      })
      const programming_js_art2 = newStorageDirNode(`${programming_js.path}/${StorageNode.generateId()}`, {
        article: { dir: { name: 'art2', type: 'Article', sortOrder: 1 } },
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
      StorageHelper.sortNodes(nodes)

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
      StorageHelper.sortNodes([])
    })
  })

  describe('getStorageType', () => {
    describe('タイプがarticleの場合', () => {
      it('パターン①', async () => {
        const userRootName = config.storage.user.rootName
        const articleRootName = config.storage.article.rootName

        // '/'なしで終わる
        const actual = StorageHelper.getStorageType(`${userRootName}/taro/${articleRootName}`)

        expect(actual).toBe('article')
      })

      it('パターン②', async () => {
        const userRootName = config.storage.user.rootName
        const articleRootName = config.storage.article.rootName

        // '/'で終わる
        const actual = StorageHelper.getStorageType(`${userRootName}/taro/${articleRootName}/`)

        expect(actual).toBe('article')
      })

      it('パターン③', async () => {
        const userRootName = config.storage.user.rootName
        const articleRootName = config.storage.article.rootName

        // '/'の続きがある
        const actual = StorageHelper.getStorageType(`${userRootName}/taro/${articleRootName}/aaa`)

        expect(actual).toBe('article')
      })
    })

    describe('タイプがuserの場合', () => {
      it('パターン①', async () => {
        const userRootName = config.storage.user.rootName

        // '/'なしで終わる
        const actual = StorageHelper.getStorageType(`${userRootName}/taro/aaa`)

        expect(actual).toBe('user')
      })

      it('パターン②', async () => {
        const userRootName = config.storage.user.rootName

        // '/'で終わる
        const actual = StorageHelper.getStorageType(`${userRootName}/taro/aaa/`)

        expect(actual).toBe('user')
      })
    })

    describe('タイプがappの場合', () => {
      it('パターン①', async () => {
        // '/'なしで終わる
        const actual = StorageHelper.getStorageType(`aaa`)

        expect(actual).toBe('app')
      })

      it('パターン②', async () => {
        // '/'で終わる
        const actual = StorageHelper.getStorageType(`aaa/`)

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
        const actual = StorageHelper.isRootNode(`${userRootName}/taro/${articleRootName}`)

        expect(actual).toBeTruthy()
      })

      it(`'/'ありで終わる`, async () => {
        const userRootName = config.storage.user.rootName
        const articleRootName = config.storage.article.rootName

        // '/'ありで終わる
        const actual = StorageHelper.isRootNode(`${userRootName}/taro/${articleRootName}/`)

        expect(actual).toBeTruthy()
      })

      it(`'/'の続きがある`, async () => {
        const userRootName = config.storage.user.rootName
        const articleRootName = config.storage.article.rootName

        // '/'ありで終わる
        const actual = StorageHelper.isRootNode(`${userRootName}/taro/${articleRootName}/aaa`)

        expect(actual).toBeFalsy()
      })
    })

    describe('ユーザールート', () => {
      it(`'/'なしで終わる`, async () => {
        const userRootName = config.storage.user.rootName

        // '/'なしで終わる
        const actual = StorageHelper.isRootNode(`${userRootName}/taro`)

        expect(actual).toBeTruthy()
      })

      it(`'/'ありで終わる`, async () => {
        const userRootName = config.storage.user.rootName

        // '/'ありで終わる
        const actual = StorageHelper.isRootNode(`${userRootName}/taro/`)

        expect(actual).toBeTruthy()
      })

      it(`'/'の続きがある`, async () => {
        const userRootName = config.storage.user.rootName

        // '/'ありで終わる
        const actual = StorageHelper.isRootNode(`${userRootName}/taro/aaa`)

        expect(actual).toBeFalsy()
      })
    })

    describe('アプリケーションルート', () => {
      it(`空文字の場合`, async () => {
        const actual = StorageHelper.isRootNode(``)
        expect(actual).toBeTruthy()
      })

      it(`undefinedの場合`, async () => {
        const actual = StorageHelper.isRootNode(undefined)
        expect(actual).toBeTruthy()
      })

      it(`'/'の場合`, async () => {
        const actual = StorageHelper.isRootNode(`/`)
        expect(actual).toBeFalsy()
      })

      it(`何かしらアプリケーションノードが指定された場合`, async () => {
        const actual = StorageHelper.isRootNode(`aaa`)
        expect(actual).toBeFalsy()
      })
    })
  })
})
