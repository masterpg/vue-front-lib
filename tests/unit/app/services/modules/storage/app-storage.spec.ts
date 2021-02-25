import { StorageNode, StorageNodeShareSettings } from '@/app/services'
import { cloneStorageNode, mockStorageServiceAPIMethods, newStorageDirNode, newStorageFileNode, provideDependency } from '../../../../../helpers/app'
import dayjs from 'dayjs'

//========================================================================
//
//  Tests
//
//========================================================================

describe('AppStorageService', () => {
  beforeEach(async () => {
    provideDependency(({ services }) => {
      mockStorageServiceAPIMethods(services)
    })
  })

  describe('getAllNodes', () => {
    it('ベーシックケース', () => {
      // bucketRoot
      // ├d1
      // │├d11
      // ││└f111.txt
      // │└d12
      // └d2
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const f111 = newStorageFileNode(`d1/d11/f111.txt`)
      const d12 = newStorageDirNode(`d1/d12`)
      const d2 = newStorageDirNode(`d2`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, d12, d2])
      })

      const actual = appStorage.getAllNodes()

      expect(actual.length).toBe(5)
      expect(actual).toEqual([d1, d11, f111, d12, d2])
    })
  })

  describe('getNode', () => {
    it('ベーシックケース - ノードパスで取得', () => {
      const d1 = newStorageDirNode(`d1`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1])
      })

      const actual = appStorage.getNode({ path: d1.path })

      expect(actual).toEqual(d1)
    })
  })

  describe('sgetNode', () => {
    it('ベーシックケース - ノードIDで取得', () => {
      const d1 = newStorageDirNode(`d1`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1])
      })

      const actual = appStorage.sgetNode({ id: d1.id })

      expect(actual).toEqual(d1)
    })

    it('ベーシックケース - ノードパスで取得', () => {
      const d1 = newStorageDirNode(`d1`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores, services }) => {
        stores.storage.setAll([d1])
      })

      const actual = appStorage.sgetNode({ path: d1.path })

      expect(actual).toEqual(d1)
    })

    it('ノードが見つからない場合 - ノードIDで取得', () => {
      const {
        services: { appStorage },
      } = provideDependency()

      let actual!: Error
      try {
        appStorage.sgetNode({ id: 'xxx' })
      } catch (err) {
        actual = err
      }

      expect(actual.message).toBe(`Storage store does not have specified node: {"id":"xxx"}`)
    })

    it('ノードが見つからない場合 - ノードパスで取得', () => {
      const {
        services: { appStorage },
      } = provideDependency()

      let actual!: Error
      try {
        appStorage.sgetNode({ path: 'xxx/yyy' })
      } catch (err) {
        actual = err
      }

      expect(actual.message).toBe(`Storage store does not have specified node: {"path":"xxx/yyy"}`)
    })
  })

  describe('getNodes', () => {
    it('ベーシックケース', () => {
      const d1 = newStorageDirNode(`d1`)
      const d2 = newStorageDirNode(`d2`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d2])
      })

      const actual = appStorage.getNodes({ ids: [d1.id], paths: [d2.path] })

      expect(actual).toEqual([d1, d2])
    })
  })

  describe('getDescendants', () => {
    it('ベーシックケース - ID検索', async () => {
      // bucketRoot
      // ├d1 ← 対象ノードに指定
      // │├d11
      // ││└f111.txt
      // │└d12
      // └d2
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const f111 = newStorageFileNode(`d1/d11/f111.txt`)
      const d12 = newStorageDirNode(`d1/d12`)
      const d2 = newStorageDirNode(`d2`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, d12, d2])
      })

      const actual = appStorage.getDescendants({ id: d1.id, includeBase: true })

      expect(actual).toEqual([d1, d11, f111, d12])
    })

    it('ベーシックケース - パス検索', async () => {
      // bucketRoot
      // ├d1 ← 対象ノードに指定
      // │├d11
      // ││└f111.txt
      // │└d12
      // └d2
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const f111 = newStorageFileNode(`d1/d11/f111.txt`)
      const d12 = newStorageDirNode(`d1/d12`)
      const d2 = newStorageDirNode(`d2`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, d12, d2])
      })

      const actual = appStorage.getDescendants({ path: d1.path, includeBase: true })

      expect(actual).toEqual([d1, d11, f111, d12])
    })

    it('ベースノードを含める場合', async () => {
      // bucketRoot
      // └d1 ← 対象ノードに指定
      //   └d11
      //     └f111.txt
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const f111 = newStorageFileNode(`d1/d11/f111.txt`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111])
      })

      const actual = appStorage.getDescendants({ path: d1.path, includeBase: true })

      expect(actual).toEqual([d1, d11, f111])
    })

    it('ベースノードを含めない場合', async () => {
      // bucketRoot
      // └d1 ← 対象ノードに指定
      //   └d11
      //     └f111.txt
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const f111 = newStorageFileNode(`d1/d11/f111.txt`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111])
      })

      const actual = appStorage.getDescendants({ path: d1.path })

      expect(actual).toEqual([d11, f111])
    })

    it('ベースパス配下の検索', async () => {
      // bucketRoot ← 対象ノードに指定
      // ├d1
      // │├d11
      // ││└f111.txt
      // │└d12
      // └d2
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const f111 = newStorageFileNode(`d1/d11/f111.txt`)
      const d12 = newStorageDirNode(`d1/d12`)
      const d2 = newStorageDirNode(`d2`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, d12, d2])
      })

      const actual = appStorage.getDescendants({ path: '' })

      expect(actual).toEqual([d1, d11, f111, d12, d2])
    })

    it('IDとパス両方指定しなかった場合', async () => {
      const {
        services: { appStorage },
      } = provideDependency()

      let actual!: Error
      try {
        appStorage.getDescendants({})
      } catch (err) {
        actual = err
      }

      expect(actual.message).toBe(`Either 'id' or 'path' must be specified.`)
    })
  })

  describe('getChildren', () => {
    it('ベーシックケース - ID検索', async () => {
      // bucketRoot
      // ├d1 ← 対象ノードに指定
      // │├d11
      // ││└f111.txt
      // │└d12
      // └d2
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const f111 = newStorageFileNode(`d1/d11/f111.txt`)
      const d12 = newStorageDirNode(`d1/d12`)
      const d2 = newStorageDirNode(`d2`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, d12, d2])
      })

      const actual = appStorage.getChildren({ id: d1.id, includeBase: true })

      expect(actual).toEqual([d1, d11, d12])
    })

    it('ベーシックケース - パス検索', async () => {
      // bucketRoot
      // ├d1 ← 対象ノードに指定
      // │├d11
      // ││└f111.txt
      // │└d12
      // └d2
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const f111 = newStorageFileNode(`d1/d11/f111.txt`)
      const d12 = newStorageDirNode(`d1/d12`)
      const d2 = newStorageDirNode(`d2`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, d12, d2])
      })

      const actual = appStorage.getChildren({ path: d1.path, includeBase: true })

      expect(actual).toEqual([d1, d11, d12])
    })

    it('ベースノードを含める場合', async () => {
      // bucketRoot
      // └d1 ← 対象ノードに指定
      //   └d11
      //     └f111.txt
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const f111 = newStorageFileNode(`d1/d11/f111.txt`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111])
      })

      const actual = appStorage.getChildren({ path: d1.path, includeBase: true })

      expect(actual).toEqual([d1, d11])
    })

    it('ベースノードを含めない場合', async () => {
      // bucketRoot
      // └d1 ← 対象ノードに指定
      //   └d11
      //     └f111.txt
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const f111 = newStorageFileNode(`d1/d11/f111.txt`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111])
      })

      const actual = appStorage.getChildren({ path: d1.path })

      expect(actual).toEqual([d11])
    })

    it('ベースパス直下の検索', async () => {
      // bucketRoot ← 対象ノードに指定
      // ├d1
      // │├d11
      // ││└f111.txt
      // │└d12
      // └d2
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const f111 = newStorageFileNode(`d1/d11/f111.txt`)
      const d12 = newStorageDirNode(`d1/d12`)
      const d2 = newStorageDirNode(`d2`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, d12, d2])
      })

      const actual = appStorage.getChildren({ path: '' })

      expect(actual).toEqual([d1, d2])
    })

    it('IDとパス両方指定しなかった場合', async () => {
      const {
        services: { appStorage },
      } = provideDependency()

      let actual!: Error
      try {
        appStorage.getChildren({})
      } catch (err) {
        actual = err
      }

      expect(actual.message).toBe(`Either 'id' or 'path' must be specified.`)
    })
  })

  describe('getHierarchicalNodes', () => {
    it('ベーシックケース', async () => {
      // bucketRoot
      // ├d1
      // │├d11
      // ││└f111.txt ← 対象ノードに指定
      // │└d12
      // └d2
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const f111 = newStorageFileNode(`d1/d11/f111.txt`)
      const d12 = newStorageDirNode(`d1/d12`)
      const d2 = newStorageDirNode(`d2`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, d12, d2])
      })

      const actual = appStorage.getHierarchicalNodes(f111.path)

      expect(actual).toEqual([d1, d11, f111])
    })

    it('対象ノードに空文字を指定した場合', async () => {
      const {
        services: { appStorage },
      } = provideDependency()

      const actual = appStorage.getHierarchicalNodes('')

      expect(actual).toEqual([])
    })
  })

  describe('getInheritedShare', () => {
    it('対象ノードに共有設定がある場合', async () => {
      // bucketRoot
      // └d1
      //   └d11
      //     └f111.txt
      const d1 = newStorageDirNode(`d1`, {
        share: {
          isPublic: false,
          readUIds: ['ichiro'],
          writeUIds: ['ichiro'],
        },
      })
      const d11 = newStorageDirNode(`d1/d11`, {
        share: {
          isPublic: false,
          readUIds: ['jiro'],
          writeUIds: ['jiro'],
        },
      })
      const f111 = newStorageFileNode(`d1/d11/f111.txt`, {
        share: {
          isPublic: true,
          readUIds: ['saburo'],
          writeUIds: ['saburo'],
        },
      })
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111])
      })

      const actual = appStorage.getInheritedShare(f111.path)

      // 祖先ノードより対象ノードの共有設定が優先されていることを検証
      expect(actual).toEqual({
        isPublic: true,
        readUIds: ['saburo'],
        writeUIds: ['saburo'],
      })
    })

    it('祖先ノードに共有設定がある場合', async () => {
      // bucketRoot
      // └d1
      //   └d11
      //     └f111.txt
      const d1 = newStorageDirNode(`d1`, {
        share: {
          isPublic: true,
          readUIds: ['ichiro'],
        },
      })
      const d11 = newStorageDirNode(`d1/d11`, {
        share: {
          writeUIds: ['jiro'],
        },
      })
      const f111 = newStorageFileNode(`d1/d11/f111.txt`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111])
      })

      const actual = appStorage.getInheritedShare(f111.path)

      // 祖先ノードの共有設定を継承していることを検証
      expect(actual).toEqual({
        isPublic: true,
        readUIds: ['ichiro'],
        writeUIds: ['jiro'],
      })
    })

    it('対象ノードにベースパスルートを指定した場合', async () => {
      const {
        services: { appStorage },
      } = provideDependency()

      let actual!: Error
      try {
        await appStorage.getInheritedShare('')
      } catch (err) {
        actual = err
      }

      expect(actual.message).toBe(`Base path root is set for 'nodePath'.`)
    })
  })

  describe('fetchNode', () => {
    it('ベーシックケース - ID検索', async () => {
      // bucketRoot
      // ├d1 ← 対象ノードに指定
      // │├d11
      // ││└f111.txt
      // │└f11.txt
      // └d2
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const f111 = newStorageFileNode(`d1/d11/f111.txt`)
      const f11 = newStorageFileNode(`d1/f11.txt`)
      const d2 = newStorageDirNode(`d2`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, f11, d2])
      })

      // APIから以下の状態のノードリストが取得される
      // ・'d1'が更新された
      const updated_d1 = cloneStorageNode(d1, { updatedAt: dayjs() })
      td.when(appStorage.getNodeAPI({ id: d1.id })).thenResolve(updated_d1)

      const actual = await appStorage.fetchNode({ id: d1.id })

      // bucketRoot
      // ├d1
      // │├d11
      // ││└f111.txt
      // │└f11.txt
      // └d2
      expect(actual).toEqual(updated_d1)
      expect(appStorage.getAllNodes()).toEqual([updated_d1, d11, f111, f11, d2])
    })

    it('ベーシックケース - パス検索', async () => {
      // bucketRoot
      // ├d1 ← 対象ノードに指定
      // │├d11
      // ││└f111.txt
      // │└f11.txt
      // └d2
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const f111 = newStorageFileNode(`d1/d11/f111.txt`)
      const f11 = newStorageFileNode(`d1/f11.txt`)
      const d2 = newStorageDirNode(`d2`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, f11, d2])
      })

      // APIから以下の状態のノードリストが取得される
      // ・'d1'が更新された
      const updated_d1 = cloneStorageNode(d1, { updatedAt: dayjs() })
      td.when(appStorage.getNodeAPI({ path: d1.path })).thenResolve(updated_d1)

      const actual = await appStorage.fetchNode({ path: d1.path })

      // bucketRoot
      // ├d1
      // │├d11
      // ││└f111.txt
      // │└f11.txt
      // └d2
      expect(actual).toEqual(updated_d1)
      expect(appStorage.getAllNodes()).toEqual([updated_d1, d11, f111, f11, d2])
    })

    it('バケットルートを指定した場合', async () => {
      // bucketRoot ← 対象ノードに指定
      // └d1
      const d1 = newStorageDirNode(`d1`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1])
      })

      const actual = await appStorage.fetchNode({ path: `` })

      // bucketRoot
      // └d1
      expect(actual).toBeUndefined()
      expect(appStorage.getAllNodes()).toEqual([d1])
    })

    it('他端末でディレクトリが削除されていた場合', async () => {
      // bucketRoot
      // ├d1 ← 対象ノードに指定
      // │├d11
      // ││└f111.txt
      // │└f11.txt
      // └d2
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const f111 = newStorageFileNode(`d1/d11/f111.txt`)
      const f11 = newStorageFileNode(`d1/f11.txt`)
      const d2 = newStorageDirNode(`d2`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, f11, d2])
      })

      // APIから以下の状態のノードリストが取得される
      // ・'d1'が削除された
      td.when(appStorage.getNodeAPI({ id: d1.id, path: '' })).thenResolve(undefined)

      const actual = await appStorage.fetchNode({ id: d1.id })

      // bucketRoot
      // └d2
      expect(actual).toBeUndefined()
      expect(appStorage.getAllNodes()).toEqual([d2])
    })
  })

  describe('fetchNodes', () => {
    it('ベーシックケース - ID検索', async () => {
      // bucketRoot
      // ├d1 ← 対象ノードに指定
      // │├d11
      // ││└f111.txt
      // │└f11.txt
      // └d2
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const f111 = newStorageFileNode(`d1/d11/f111.txt`)
      const f11 = newStorageFileNode(`d1/f11.txt`)
      const d2 = newStorageDirNode(`d2`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, f11, d2])
      })

      // APIから以下の状態のノードリストが取得される
      // ・'d1'が更新された
      const updated_d1 = cloneStorageNode(d1, { updatedAt: dayjs() })
      td.when(appStorage.getNodesAPI({ ids: [d1.id] })).thenResolve([updated_d1])

      const actual = await appStorage.fetchNodes({ ids: [d1.id] })

      // bucketRoot
      // ├d1
      // │├d11
      // ││└f111.txt
      // │└f11.txt
      // └d2
      expect(actual).toEqual([updated_d1])
      expect(appStorage.getAllNodes()).toEqual([updated_d1, d11, f111, f11, d2])
    })

    it('ベーシックケース - パス検索', async () => {
      // bucketRoot
      // ├d1 ← 対象ノードに指定
      // │├d11
      // ││└f111.txt
      // │└f11.txt
      // └d2
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const f111 = newStorageFileNode(`d1/d11/f111.txt`)
      const f11 = newStorageFileNode(`d1/f11.txt`)
      const d2 = newStorageDirNode(`d2`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, f11, d2])
      })

      // APIから以下の状態のノードリストが取得される
      // ・'d1'が更新された
      const updated_d1 = cloneStorageNode(d1, { updatedAt: dayjs() })
      td.when(appStorage.getNodesAPI({ paths: [d1.path] })).thenResolve([updated_d1])

      const actual = await appStorage.fetchNodes({ paths: [d1.path] })

      // bucketRoot
      // ├d1
      // │├d11
      // ││└f111.txt
      // │└f11.txt
      // └d2
      expect(actual).toEqual([updated_d1])
      expect(appStorage.getAllNodes()).toEqual([updated_d1, d11, f111, f11, d2])
    })

    it('バケットルートを指定した場合', async () => {
      // bucketRoot ← 対象ノードに指定
      // └d1
      const d1 = newStorageDirNode(`d1`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1])
      })

      td.when(appStorage.getNodesAPI({ paths: [] })).thenResolve([])

      const actual = await appStorage.fetchNodes({ paths: [``] })

      // bucketRoot
      // └d1
      expect(actual).toEqual([])
      expect(appStorage.getAllNodes()).toEqual([d1])
    })

    it('他端末でディレクトリが削除されていた場合', async () => {
      // bucketRoot
      // ├d1 ← 対象ノードに指定
      // │├d11
      // ││└f111.txt
      // │└f11.txt
      // └d2
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const f111 = newStorageFileNode(`d1/d11/f111.txt`)
      const f11 = newStorageFileNode(`d1/f11.txt`)
      const d2 = newStorageDirNode(`d2`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, f11, d2])
      })

      // APIから以下の状態のノードリストが取得される
      // ・'d1'が削除された
      td.when(appStorage.getNodesAPI({ ids: [d1.id] })).thenResolve([])

      const actual = await appStorage.fetchNodes({ ids: [d1.id] })

      // bucketRoot
      // └d2
      expect(actual).toEqual([])
      expect(appStorage.getAllNodes()).toEqual([d2])
    })
  })

  describe('fetchHierarchicalNodes', () => {
    it('ベーシックケース', async () => {
      // bucketRoot
      // └dA
      //   └[dB]
      //     └[dC]
      //       └[fileC.txt] ← 対象ノードに指定
      const dA = newStorageDirNode(`dA`)
      const dB = newStorageDirNode(`dA/dB`)
      const dC = newStorageDirNode(`dA/dB/dC`)
      const fileC = newStorageDirNode(`dA/dB/dC/fileC.txt`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([dA])
      })

      td.when(appStorage.getHierarchicalNodesAPI(`dA/dB/dC/fileC.txt`)).thenResolve([dA, dB, dC, fileC])

      const actual = await appStorage.fetchHierarchicalNodes(fileC.path)

      // bucketRoot
      // └dA
      //   └dB
      //     └dC
      //       └fileC.txt
      expect(actual).toEqual([dA, dB, dC, fileC])
      expect(appStorage.getAllNodes()).toEqual([dA, dB, dC, fileC])
    })

    it('他端末でディレクトリ削除が行われていた場合', async () => {
      // bucketRoot
      // └dA
      //   └dB
      //     └dC
      //       └fileC.txt ← 対象ノードに指定
      const dA = newStorageDirNode(`dA`)
      const dB = newStorageDirNode(`dA/dB`)
      const dC = newStorageDirNode(`dA/dB/dC`)
      const fileC = newStorageDirNode(`dA/dB/dC/fileC.txt`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([dA, dB, dC, fileC])
      })

      // APIから以下の状態のノードリストが取得される
      // ・'dA/dB/dC'が削除された
      td.when(appStorage.getHierarchicalNodesAPI(`dA/dB/dC/fileC.txt`)).thenResolve([dA, dB])

      const actual = await appStorage.fetchHierarchicalNodes(fileC.path)

      // bucketRoot
      // └dA
      //   └dB
      expect(actual).toEqual([dA, dB])
      expect(appStorage.getAllNodes()).toEqual([dA, dB])
    })
  })

  describe('fetchAncestorDirs', () => {
    it('ベーシックケース', async () => {
      // bucketRoot
      // └dA
      //   └[dB]
      //     └[dC]
      //       └[fileC.txt] ← 対象ノードに指定
      const dA = newStorageDirNode(`dA`)
      const dB = newStorageDirNode(`dA/dB`)
      const dC = newStorageDirNode(`dA/dB/dC`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([dA])
      })

      td.when(appStorage.getAncestorDirsAPI(`dA/dB/dC/fileC.txt`)).thenResolve([dA, dB, dC])

      const actual = await appStorage.fetchAncestorDirs(`dA/dB/dC/fileC.txt`)

      // bucketRoot
      // └dA
      //   └dB
      //     └dC
      expect(actual).toEqual([dA, dB, dC])
      expect(appStorage.getAllNodes()).toEqual([dA, dB, dC])
    })

    it('他端末でディレクトリ削除が行われていた場合', async () => {
      // bucketRoot
      // └dA
      //   └dB
      //     └dC
      //       └fileC.txt ← 対象ノードに指定
      const dA = newStorageDirNode(`dA`)
      const dB = newStorageDirNode(`dA/dB`)
      const dC = newStorageDirNode(`dA/dB/dC`)
      const fileC = newStorageDirNode(`dA/dB/dC/fileC.txt`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([dA, dB, dC, fileC])
      })

      // APIから以下の状態のノードリストが取得される
      // ・'dA/dB/dC'が削除された
      td.when(appStorage.getAncestorDirsAPI(`dA/dB/dC/fileC.txt`)).thenResolve([dA, dB])

      const actual = await appStorage.fetchAncestorDirs(fileC.path)

      // bucketRoot
      // └dA
      //   └dB
      expect(actual).toEqual([dA, dB])
      expect(appStorage.getAllNodes()).toEqual([dA, dB])
    })
  })

  describe('fetchDescendants', () => {
    it('ベーシックケース - ID検索', async () => {
      // bucketRoot
      // ├[d1] ← 対象ノードに指定
      // │├[d11]
      // ││└[f111.txt]
      // │└[d12]
      // └d2
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const f111 = newStorageFileNode(`d1/d11/f111.txt`)
      const f112 = newStorageFileNode(`d1/d11/f112.txt`)
      const d12 = newStorageDirNode(`d1/d12`)
      const d2 = newStorageDirNode(`d2`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d2])
      })

      // APIからノードリストが取得される
      td.when(appStorage.getDescendantsAPI({ id: d1.id, includeBase: true })).thenResolve([d1, d11, f111, f112, d12])

      const actual = await appStorage.fetchDescendants({ id: d1.id, includeBase: true })

      // bucketRoot
      // ├d1 ← 対象ノードに指定
      // │├d11
      // ││└f111.txt
      // │└d12
      // └d2
      expect(actual).toEqual([d1, d11, f111, f112, d12])
      expect(appStorage.getAllNodes()).toEqual([d1, d11, f111, f112, d12, d2])
    })

    it('ベーシックケース - パス検索', async () => {
      // bucketRoot
      // ├[d1] ← 対象ノードに指定
      // │├[d11]
      // ││└[f111.txt]
      // │└[d12]
      // └d2
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const f111 = newStorageFileNode(`d1/d11/f111.txt`)
      const f112 = newStorageFileNode(`d1/d11/f112.txt`)
      const d12 = newStorageDirNode(`d1/d12`)
      const d2 = newStorageDirNode(`d2`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d2])
      })

      // APIからノードリストが取得される
      td.when(appStorage.getDescendantsAPI({ path: d1.path, includeBase: true })).thenResolve([d1, d11, f111, f112, d12])

      const actual = await appStorage.fetchDescendants({ path: d1.path, includeBase: true })

      // bucketRoot
      // ├d1 ← 対象ノードに指定
      // │├d11
      // ││└f111.txt
      // │└d12
      // └d2
      expect(actual).toEqual([d1, d11, f111, f112, d12])
      expect(appStorage.getAllNodes()).toEqual([d1, d11, f111, f112, d12, d2])
    })

    it('ベースノードを含める場合', async () => {
      // bucketRoot
      // └[d1] ← 対象ノードに指定
      //   └[d11]
      //     └[f111.txt]
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const f111 = newStorageFileNode(`d1/d11/f111.txt`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([])
      })

      // APIからノードリストが取得される
      td.when(appStorage.getDescendantsAPI({ path: d1.path, includeBase: true })).thenResolve([d1, d11, f111])

      const actual = await appStorage.fetchDescendants({ path: d1.path, includeBase: true })

      // bucketRoot
      // └d1
      //   └d11
      //     └f111.txt
      expect(actual).toEqual([d1, d11, f111])
      expect(appStorage.getAllNodes()).toEqual([d1, d11, f111])
    })

    it('ベースノードを含めない場合', async () => {
      // bucketRoot
      // └d1 ← 対象ノードに指定
      //   └[d11]
      //     └[f111.txt]
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const f111 = newStorageFileNode(`d1/d11/f111.txt`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1])
      })

      // APIからノードリストが取得される
      td.when(appStorage.getDescendantsAPI({ path: d1.path })).thenResolve([d11, f111])

      const actual = await appStorage.fetchDescendants({ path: d1.path })

      // bucketRoot
      // └d1
      //   └d11
      //     └f111.txt
      expect(actual).toEqual([d11, f111])
      expect(appStorage.getAllNodes()).toEqual([d1, d11, f111])
    })

    it('様々なケースを想定したパターン', async () => {
      // bucketRoot
      // ├d1 ← 対象ノードに指定
      // │├d11
      // ││└f111.txt
      // │├d12
      // │└f11.txt
      // └d2
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const f111 = newStorageFileNode(`d1/d11/f111.txt`)
      const f112 = newStorageFileNode(`d1/d11/f112.txt`)
      const d12 = newStorageDirNode(`d1/d12`)
      const f11 = newStorageFileNode(`d1/f11.txt`)
      const d2 = newStorageDirNode(`d2`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, d12, f11, d2])
      })

      // APIから以下の状態のノードリストが取得される
      // ・'d1/d11/f111.txt'が'f1.txt'へ移動+リネームされた
      // ・'d1/d11/f112.txt'が追加された
      // ・'d1/d12'が削除された
      // ・'d1/f11.txt'が一度削除され、その後また同じディレクトリに同じ名前でアップロードされた
      const updated_f11 = cloneStorageNode(f11, { id: StorageNode.generateId(), updatedAt: dayjs() })
      td.when(appStorage.getDescendantsAPI({ path: d1.path, includeBase: true })).thenResolve([d1, d11, f112, updated_f11])

      const actual = await appStorage.fetchDescendants({ path: d1.path, includeBase: true })

      // bucketRoot
      // ├d1
      // │├d11
      // ││└f112.txt
      // │└f11.txt
      // ├d2
      // └f1.txt ← 移動+リネームされても、今回の検索範囲外なのでストアに反映されない
      expect(actual).toEqual([d1, d11, f112, updated_f11])
      expect(appStorage.getAllNodes()).toEqual([d1, d11, f112, updated_f11, d2])
    })

    it('対象ノードが削除されていた', async () => {
      // bucketRoot
      // ├d1
      // │├d11 ← 対象ノードに指定
      // ││└f111.txt
      // │└d12
      // └d2
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const f111 = newStorageFileNode(`d1/d11/f111.txt`)
      const d12 = newStorageDirNode(`d1/d12`)
      const d2 = newStorageDirNode(`d2`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, d12, d2])
      })

      // APIから以下の状態のノードリストが取得される
      // ・'d1/d11'が削除され存在しない
      td.when(appStorage.getDescendantsAPI({ path: d11.path, includeBase: true })).thenResolve([])

      const actual = await appStorage.fetchDescendants({ path: d11.path, includeBase: true })

      // bucketRoot
      // ├d1
      // │└d12
      // └d2
      expect(actual).toEqual([])
      expect(appStorage.getAllNodes()).toEqual([d1, d12, d2])
    })

    it('ベースパス配下の検索', async () => {
      // bucketRoot ← 対象ノードに指定
      // ├d1
      // │├d11
      // ││└f111.txt
      // │└d12
      // └d2
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const f111 = newStorageFileNode(`d1/d11/f111.txt`)
      const f112 = newStorageFileNode(`d1/d11/f112.txt`)
      const d12 = newStorageDirNode(`d1/d12`)
      const d2 = newStorageDirNode(`d2`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, d12, d2])
      })

      // APIから以下の状態のノードリストが取得される
      // ・'d1/d11/f111.txt'が'f1.txt'へ移動+リネームされた
      // ・'d1/d11/f112.txt'が追加された
      // ・'d1/d12'が削除された
      const f1 = cloneStorageNode(f111, { dir: ``, path: `f1.txt` })
      td.when(appStorage.getDescendantsAPI({ path: `` })).thenResolve([d1, d11, f112, d2, f1])

      const actual = await appStorage.fetchDescendants({ path: `` })

      // bucketRoot
      // ├d1
      // │└d11
      // │  └f112.txt
      // ├d2
      // └f1.txt
      expect(actual).toEqual([d1, d11, f112, d2, f1])
      expect(appStorage.getAllNodes()).toEqual([d1, d11, f112, d2, f1])
    })
  })

  describe('fetchChildren', () => {
    it('ベーシックケース - ID検索', async () => {
      // bucketRoot
      // ├[d1] ← 対象ノードに指定
      // │├[d11]
      // ││└[f111.txt]
      // │└[d12]
      // └d2
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const f111 = newStorageFileNode(`d1/d11/f111.txt`)
      const d12 = newStorageDirNode(`d1/d12`)
      const d2 = newStorageDirNode(`d2`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d2])
      })

      // APIからノードリストが取得される
      td.when(appStorage.getChildrenAPI({ id: d1.id, includeBase: true })).thenResolve([d1, d11, f111, d12])

      const actual = await appStorage.fetchChildren({ id: d1.id, includeBase: true })

      // bucketRoot
      // ├d1
      // │├d11
      // ││└f111.txt
      // │└d12
      // └d2
      expect(actual).toEqual([d1, d11, f111, d12])
      expect(appStorage.getAllNodes()).toEqual([d1, d11, f111, d12, d2])
    })

    it('ベーシックケース - パス検索', async () => {
      // bucketRoot
      // ├[d1] ← 対象ノードに指定
      // │├[d11]
      // ││└[f111.txt]
      // │└[d12]
      // └d2
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const f111 = newStorageFileNode(`d1/d11/f111.txt`)
      const d12 = newStorageDirNode(`d1/d12`)
      const d2 = newStorageDirNode(`d2`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d2])
      })

      // APIからノードリストが取得される
      td.when(appStorage.getChildrenAPI({ path: d1.path, includeBase: true })).thenResolve([d1, d11, f111, d12])

      const actual = await appStorage.fetchChildren({ path: d1.path, includeBase: true })

      // bucketRoot
      // ├d1
      // │├d11
      // ││└f111.txt
      // │└d12
      // └d2
      expect(actual).toEqual([d1, d11, f111, d12])
      expect(appStorage.getAllNodes()).toEqual([d1, d11, f111, d12, d2])
    })

    it('ベースノードを含める場合', async () => {
      // bucketRoot
      // └[d1] ← 対象ノードに指定
      //   └[d11]
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([])
      })

      // APIからノードリストが取得される
      td.when(appStorage.getChildrenAPI({ path: d1.path, includeBase: true })).thenResolve([d1, d11])

      const actual = await appStorage.fetchChildren({ path: d1.path, includeBase: true })

      // bucketRoot
      // └d1
      //   └d11
      expect(actual).toEqual([d1, d11])
      expect(appStorage.getAllNodes()).toEqual([d1, d11])
    })

    it('ベースノードを含めない場合', async () => {
      // bucketRoot
      // └d1 ← 対象ノードに指定
      //   └[d11]
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1])
      })

      // APIからノードリストが取得される
      td.when(appStorage.getChildrenAPI({ path: d1.path })).thenResolve([d11])

      const actual = await appStorage.fetchChildren({ path: d1.path })

      // bucketRoot
      // └d1
      //   └d11
      expect(actual).toEqual([d11])
      expect(appStorage.getAllNodes()).toEqual([d1, d11])
    })

    it('様々なケースを想定したパターン', async () => {
      // bucketRoot
      // ├d1 ← 対象ノードに指定
      // │├d11
      // ││└f111.txt
      // │├d12
      // ││└f121.txt
      // │└f11.txt
      // └d2
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const f111 = newStorageFileNode(`d1/d11/f111.txt`)
      const d12 = newStorageDirNode(`d1/d12`)
      const f121 = newStorageFileNode(`d1/d12/f121.txt`)
      const f11 = newStorageFileNode(`d1/f11.txt`)
      const f12 = newStorageFileNode(`d1/f12.txt`)
      const d2 = newStorageDirNode(`d2`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, d12, f121, f11, d2])
      })

      // APIから以下の状態のノードリストが取得される
      // ・'d1/f11.txt'が削除され、その後また同じディレクトリに同じ名前でアップロードされた
      // ・'d1/f12.txt'が追加された
      // ・'d1/d12'が削除された
      const updated_f11 = cloneStorageNode(f11, { id: StorageNode.generateId(), updatedAt: dayjs() })
      td.when(appStorage.getChildrenAPI({ path: d1.path, includeBase: true })).thenResolve([d1, d11, updated_f11, f12])

      const actual = await appStorage.fetchChildren({ path: d1.path, includeBase: true })

      // bucketRoot
      // ├d1
      // │├d11
      // ││└f111.txt
      // │├f11.txt
      // │└f12.txt
      // └d2
      expect(actual).toEqual([d1, d11, updated_f11, f12])
      expect(appStorage.getAllNodes()).toEqual([d1, d11, f111, updated_f11, f12, d2])
    })

    it('対象ノードが削除されていた', async () => {
      // bucketRoot
      // ├d1
      // │├d11 ← 対象ノードに指定
      // ││└f111.txt
      // │└d12
      // └d2
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const f111 = newStorageFileNode(`d1/d11/f111.txt`)
      const d12 = newStorageDirNode(`d1/d12`)
      const d2 = newStorageDirNode(`d2`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, d12, d2])
      })

      // APIから以下の状態のノードリストが取得される
      // ・'d1/d11'が削除され存在しない
      td.when(appStorage.getChildrenAPI({ path: d11.path, includeBase: true })).thenResolve([])

      const actual = await appStorage.fetchChildren({ path: d11.path, includeBase: true })

      // bucketRoot
      // ├d1
      // │└d12
      // └d2
      expect(actual).toEqual([])
      expect(appStorage.getAllNodes()).toEqual([d1, d12, d2])
    })

    it('ベースパス直下を検索', async () => {
      // bucketRoot ← 対象ノードに指定
      // ├[d1]
      // ├[d2]
      // └[f1.txt]
      const d1 = newStorageDirNode(`d1`)
      const d2 = newStorageDirNode(`d2`)
      const f1 = newStorageFileNode(`f1.txt`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([])
      })

      td.when(appStorage.getChildrenAPI({ path: `` })).thenResolve([d1, d2, f1])

      const actual = await appStorage.fetchChildren({ path: `` })

      // bucketRoot
      // ├d1
      // ├d2
      // └f1.txt
      expect(actual).toEqual([d1, d2, f1])
      expect(appStorage.getAllNodes()).toEqual([d1, d2, f1])
    })
  })

  describe('fetchHierarchicalDescendants', () => {
    it('対象ノードを指定した場合', async () => {
      // bucketRoot
      // ├d1
      // │├d11 ← 対象ノードに指定
      // ││├d111
      // │││└f1111.txt
      // ││└f111.txt
      // │└d12
      // └d2
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const d111 = newStorageDirNode(`d1/d11/d111`)
      const f1111 = newStorageFileNode(`d1/d11/d111/f1111.txt`)
      const f111 = newStorageFileNode(`d1/d11/f111.txt`)
      const f112 = newStorageFileNode(`d1/d11/f112.txt`)
      const d12 = newStorageDirNode(`d1/d12`)
      const d2 = newStorageDirNode(`d2`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, d111, f1111, f111, d12, d2])
      })

      // APIから以下の状態のノードリストが取得される
      // ・'d1/d11/d111'が削除された
      // ・'d1/d11/f111.txt'が削除され、その後また同じディレクトリに同じ名前でアップロードされた
      // ・'d1/d11/f112.txt'が追加された
      const updated_f111 = cloneStorageNode(f111, { id: StorageNode.generateId(), updatedAt: dayjs() })
      td.when(appStorage.getHierarchicalNodesAPI(d11.path)).thenResolve([d1, d11])
      td.when(appStorage.getDescendantsAPI({ path: d11.path })).thenResolve([updated_f111, f112])

      const actual = await appStorage.fetchHierarchicalDescendants(d11.path)

      // bucketRoot
      // ├d1
      // │├d11
      // ││├f111.txt
      // ││└f112.txt
      // │└d12
      // └d2
      expect(actual).toEqual([d1, d11, updated_f111, f112])
      expect(appStorage.getAllNodes()).toEqual([d1, d11, updated_f111, f112, d12, d2])
    })

    it('対象ノードを指定した場合 - 対象ノードが削除されていた', async () => {
      // bucketRoot
      // ├d1
      // │├d11
      // ││└d111 ← 対象ノードに指定
      // ││  └f1111.txt
      // │└d12
      // └d2
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const d111 = newStorageDirNode(`d1/d11/d111`)
      const f1111 = newStorageFileNode(`d1/d11/d111/f1111.txt`)
      const d12 = newStorageDirNode(`d1/d12`)
      const d2 = newStorageDirNode(`d2`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, d111, f1111, d12, d2])
      })

      // APIから以下の状態のノードリストが取得される
      // ・'d1/d11/d111'が削除され存在しない
      td.when(appStorage.getHierarchicalNodesAPI(d111.path)).thenResolve([d1, d11])
      td.when(appStorage.getDescendantsAPI({ path: d111.path })).thenResolve([])

      const actual = await appStorage.fetchHierarchicalDescendants(d111.path)

      // bucketRoot
      // ├d1
      // │├d11
      // │└d12
      // └d2
      expect(actual).toEqual([d1, d11])
      expect(appStorage.getAllNodes()).toEqual([d1, d11, d12, d2])
    })

    it('対象ノードを指定した場合 - 対象ノードの上位ノードが削除されていた', async () => {
      // bucketRoot
      // ├d1
      // │├d11
      // ││└d111 ← 対象ノードに指定
      // ││  └f1111.txt
      // │└d12
      // └d2
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const d111 = newStorageDirNode(`d1/d11/d111`)
      const f1111 = newStorageFileNode(`d1/d11/d111/f1111.txt`)
      const d12 = newStorageDirNode(`d1/d12`)
      const d2 = newStorageDirNode(`d2`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, d111, f1111, d12, d2])
      })

      // APIから以下の状態のノードリストが取得される
      // ・'d1/d11'が削除され存在しない
      td.when(appStorage.getHierarchicalNodesAPI(d111.path)).thenResolve([d1])
      td.when(appStorage.getDescendantsAPI({ path: d111.path })).thenResolve([])

      const actual = await appStorage.fetchHierarchicalDescendants(d111.path)

      // bucketRoot
      // ├d1
      // │└d12
      // └d2
      expect(actual).toEqual([d1])
      expect(appStorage.getAllNodes()).toEqual([d1, d12, d2])
    })

    it('バケットルートを指定した場合', async () => {
      // bucketRoot ← 対象ノードに指定
      // ├d1
      // │├d11
      // ││└f111.txt
      // │└d12
      // └d2
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const f111 = newStorageFileNode(`d1/d11/f111.txt`)
      const f112 = newStorageFileNode(`d1/d11/f112.txt`)
      const d12 = newStorageDirNode(`d1/d12`)
      const d2 = newStorageDirNode(`d2`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, d12, d2])
      })

      // APIから以下の状態のノードリストが取得される
      // ・'d1/d11/f111.txt'が'f1.txt'へ移動+リネームされた
      // ・'d1/d11/f112.txt'が追加された
      // ・'d1/d12'が削除された
      const updated_f1 = cloneStorageNode(f111, { dir: ``, path: `f1.txt`, updatedAt: dayjs() })
      td.when(appStorage.getDescendantsAPI({ path: `` })).thenResolve([d1, d11, f112, d2, updated_f1])

      const actual = await appStorage.fetchHierarchicalDescendants(``)

      // bucketRoot
      // ├d1
      // │└d11
      // │  └f112.txt
      // ├d2
      // └f1.txt
      expect(actual).toEqual([d1, d11, f112, d2, updated_f1])
      expect(appStorage.getAllNodes()).toEqual([d1, d11, f112, d2, updated_f1])
    })
  })

  describe('fetchHierarchicalChildren', () => {
    it('対象ノードを指定した場合', async () => {
      // bucketRoot
      // ├d1
      // │├d11 ← 対象ノードに指定
      // ││├d111
      // │││└f1111.txt
      // ││└f111.txt
      // │└d12
      // └d2
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const d111 = newStorageDirNode(`d1/d11/d111`)
      const f1111 = newStorageFileNode(`d1/d11/d111/f1111.txt`)
      const f111 = newStorageFileNode(`d1/d11/f111.txt`)
      const f112 = newStorageFileNode(`d1/d11/f112.txt`)
      const d12 = newStorageDirNode(`d1/d12`)
      const d2 = newStorageDirNode(`d2`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, d111, f1111, f111, d12, d2])
      })

      // APIから以下の状態のノードリストが取得される
      // ・'d1/d11/d111'が削除された
      // ・'d1/d11/f111.txt'が削除され、その後また同じディレクトリに同じ名前でアップロードされた
      // ・'d1/d11/f112.txt'が追加された
      const updated_f111 = cloneStorageNode(f111, { id: StorageNode.generateId(), updatedAt: dayjs() })
      td.when(appStorage.getHierarchicalNodesAPI(d11.path)).thenResolve([d1, d11])
      td.when(appStorage.getChildrenAPI({ path: d11.path })).thenResolve([updated_f111, f112])

      const actual = await appStorage.fetchHierarchicalChildren(d11.path)

      // bucketRoot
      // ├d1
      // │├d11
      // ││├f111.txt
      // ││└f112.txt
      // │└d12
      // └d2
      expect(actual).toEqual([d1, d11, updated_f111, f112])
      expect(appStorage.getAllNodes()).toEqual([d1, d11, updated_f111, f112, d12, d2])
    })

    it('対象ノードを指定した場合 - 対象ノードが削除されていた', async () => {
      // bucketRoot
      // ├d1
      // │├d11
      // ││└d111 ← 対象ノードに指定
      // ││  └f1111.txt
      // │└d12
      // └d2
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const d111 = newStorageDirNode(`d1/d11/d111`)
      const f1111 = newStorageFileNode(`d1/d11/d111/f1111.txt`)
      const d12 = newStorageDirNode(`d1/d12`)
      const d2 = newStorageDirNode(`d2`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, d111, f1111, d12, d2])
      })

      // APIから以下の状態のノードリストが取得される
      // ・'d1/d11/d111'が削除され存在しない
      td.when(appStorage.getHierarchicalNodesAPI(d111.path)).thenResolve([d1, d11])
      td.when(appStorage.getChildrenAPI({ path: d111.path })).thenResolve([])

      const actual = await appStorage.fetchHierarchicalChildren(d111.path)

      // bucketRoot
      // ├d1
      // │├d11
      // │└d12
      // └d2
      expect(actual).toEqual([d1, d11])
      expect(appStorage.getAllNodes()).toEqual([d1, d11, d12, d2])
    })

    it('バケットルートを指定した 場合', async () => {
      // bucketRoot ← 対象ノードに指定
      // ├d1
      // │├d11
      // ││└f111.txt
      // │└d12
      // └d2
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const f111 = newStorageFileNode(`d1/d11/f111.txt`)
      const d12 = newStorageDirNode(`d1/d12`)
      const d2 = newStorageDirNode(`d2`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, d12, d2])
      })

      // APIから以下の状態のノードリストが取得される
      // ・'d1/d11/f111.txt'が'f1.txt'へ移動+リネームされた
      // ・'d2'が削除された
      const updated_f1 = cloneStorageNode(f111, { dir: ``, path: `f1.txt`, updatedAt: dayjs() })
      td.when(appStorage.getChildrenAPI({ path: `` })).thenResolve([d1, d11, updated_f1])

      const actual = await appStorage.fetchHierarchicalChildren(``)

      // bucketRoot
      // ├d1
      // │├d11
      // │└d12
      // └f1.txt
      expect(actual).toEqual([d1, d11, updated_f1])
      expect(appStorage.getAllNodes()).toEqual([d1, d11, d12, updated_f1])
    })
  })

  describe('createDir', () => {
    const ShareSettings: StorageNodeShareSettings = {
      isPublic: true,
      readUIds: ['ichiro'],
      writeUIds: ['ichiro'],
    }

    it('ベーシックケース', async () => {
      // bucketRoot
      // └d1
      //   └[d11] ← 作成
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`, { share: ShareSettings })
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1])
      })

      td.when(appStorage.createDirAPI(d11.path, { share: ShareSettings })).thenResolve(d11)

      const actual = await appStorage.createDir(d11.path, { share: ShareSettings })

      // bucketRoot
      // └d1
      //   └d11
      expect(actual).toEqual(d11)
      expect(appStorage.getAllNodes()).toEqual([d1, d11])
    })

    it('指定ディレクトリの祖先が読み込まれていない場合', async () => {
      // bucketRoot
      // └d1
      //   └[d11] ← 読み込まれていない
      //     └[d111] ← 作成
      const d1 = newStorageDirNode(`d1`)
      const d111 = newStorageDirNode(`d1/d11/d111`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1])
      })

      // 作成ディレクトリの祖先が読み込まれていない状態でディレクトリ作成
      td.when(appStorage.createDirAPI(d111.path)).thenReject(new Error())

      let actual!: Error
      try {
        await appStorage.createDir(d111.path)
      } catch (err) {
        actual = err
      }

      // スローされたエラーを検証
      expect(actual.message).toBe(`One of the ancestor nodes in the path '${d111.path}' does not exist.`)
      // ノードリストに変化がないことを検証
      expect(appStorage.getAllNodes()).toEqual([d1])
    })

    it('APIでエラーが発生した場合', async () => {
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1])
      })

      td.when(appStorage.createDirAPI(d11.path)).thenReject(new Error())

      try {
        await appStorage.createDir(d11.path)
      } catch (err) {}

      // ノードリストに変化がないことを検証
      expect(appStorage.getAllNodes()).toEqual([d1])
    })
  })

  describe('createHierarchicalDirs', () => {
    it('ベーシックケース', async () => {
      // bucketRoot
      // └d1
      //   ├[d11]
      //   │└[d111] ← 作成
      //   └[d12] ← 作成
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const d111 = newStorageDirNode(`d1/d11/d111`)
      const d12 = newStorageDirNode(`d1/d12`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1])
      })

      td.when(appStorage.createHierarchicalDirsAPI([d111.path, d12.path])).thenResolve([d11, d111, d12])

      const actual = await appStorage.createHierarchicalDirs([d111.path, d12.path])

      // bucketRoot
      // └d1 ← 上位ノードも作成される
      //   ├d11 ← 上位ノードも作成される
      //   │└d111
      //   └d12
      expect(actual).toEqual([d11, d111, d12])
      expect(appStorage.getAllNodes()).toEqual([d1, d11, d111, d12])
    })

    it('バケットルートを指定した場合', async () => {
      const {
        services: { appStorage },
      } = provideDependency()

      let actual!: Error
      try {
        await appStorage.createHierarchicalDirs([''])
      } catch (err) {
        actual = err
      }

      // スローされたエラーを検証
      expect(actual.message).toBe(`Base path root is set for 'dirPaths'.`)
    })

    it('APIでエラーが発生した場合', async () => {
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1])
      })

      td.when(appStorage.createHierarchicalDirsAPI([d11.path])).thenReject(new Error())

      try {
        await appStorage.createHierarchicalDirs([d11.path])
      } catch (err) {}

      // ノードリストに変化がないことを検証
      expect(appStorage.getAllNodes()).toEqual([d1])
    })
  })

  describe('removeDir', () => {
    // bucketRoot
    // └d1
    //   ├d11 ← 削除
    //   │└f111.txt
    //   └d12
    it('ベーシックケース', async () => {
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const f111 = newStorageFileNode(`d1/d11/f111.txt`)
      const d12 = newStorageDirNode(`d1/d12`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, d12])
      })

      await appStorage.removeDir(d11.path)

      // bucketRoot
      // └d1
      //   └d12
      expect(appStorage.getAllNodes()).toEqual([d1, d12])

      const exp = td.explain(appStorage.removeDirAPI.value)
      expect(exp.calls[0].args[0]).toEqual(d11.path)
    })

    it('存在しないディレクトリパスを指定した場合', async () => {
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1])
      })

      await appStorage.removeDir(d11.path)

      expect(appStorage.getAllNodes()).toEqual([d1])

      const exp = td.explain(appStorage.removeDirAPI.value)
      expect(exp.calls[0].args[0]).toEqual(d11.path)
    })

    it('APIでエラーが発生した場合', async () => {
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11])
      })

      td.when(appStorage.removeDirAPI(d11.path)).thenReject(new Error())

      try {
        await appStorage.removeDir(d11.path)
      } catch (err) {}

      // ノードリストに変化がないことを検証
      expect(appStorage.getAllNodes()).toEqual([d1, d11])
    })
  })

  describe('removeFile', () => {
    it('ベーシックケース', async () => {
      // bucketRoot
      // ├d1
      // │└d11
      // │  └f111.txt ← 削除
      // └f1.txt
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const f111 = newStorageFileNode(`d1/d11/f111.txt`)
      const f1 = newStorageFileNode(`f1.txt`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, f1])
      })

      await appStorage.removeFile(f111.path)

      // bucketRoot
      // ├d1
      // │└d11
      // └f1.txt
      const exp = td.explain(appStorage.removeFileAPI.value)
      expect(appStorage.getAllNodes()).toEqual([d1, d11, f1])

      expect(exp.calls[0].args[0]).toEqual(f111.path)
    })

    it('存在しないファイルパスを指定した場合', async () => {
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const f111 = newStorageFileNode(`d1/d11/f111.txt`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11])
      })

      await appStorage.removeFile(f111.path)

      expect(appStorage.getAllNodes()).toEqual([d1, d11])

      const exp = td.explain(appStorage.removeFileAPI.value)
      expect(exp.calls[0].args[0]).toEqual(f111.path)
    })

    it('APIでエラーが発生した場合', async () => {
      const f1 = newStorageFileNode(`f1.txt`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([f1])
      })

      td.when(appStorage.removeFileAPI(f1.path)).thenReject(new Error())

      try {
        await appStorage.removeFile(f1.path)
      } catch (err) {}

      // ノードリストに変化がないことを検証
      expect(appStorage.getAllNodes()).toEqual([f1])
    })
  })

  describe('moveDir', () => {
    it('ベーシックケース', async () => {
      // bucketRoot
      // ├d1
      // │└d11 ← d2へ移動
      // │  └f111.txt
      // └d2
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const f111 = newStorageFileNode(`d1/d11/f111.txt`)
      const d2 = newStorageDirNode(`d2`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, d2])
      })

      // モック設定
      const moved_d11 = cloneStorageNode(d11, { dir: `d2`, path: `d2/d11`, updatedAt: dayjs() })
      const moved_f111 = cloneStorageNode(f111, { dir: `d2/d11`, path: `d2/d11/f111.txt` })
      td.when(appStorage.getNodesAPI({ ids: [moved_d11.id, moved_f111.id] })).thenResolve([moved_d11, moved_f111])

      // 'd1/d11'を'd2'へ移動
      const actual = await appStorage.moveDir(d11.path, moved_d11.path)

      // bucketRoot
      // ├d1
      // └d2
      //   └d11
      //     └f111.txt
      expect(actual.length).toBe(2)
      expect(actual[0]).toEqual(moved_d11)
      expect(actual[1]).toEqual(moved_f111)
      expect(appStorage.getAllNodes()).toEqual([d1, d2, moved_d11, moved_f111])

      const exp = td.explain(appStorage.moveDirAPI.value)
      expect(exp.calls[0].args).toEqual([d11.path, moved_d11.path])
    })

    it('移動先ディレクトリが読み込まれていない場合', async () => {
      // bucketRoot
      // ├d1
      // │└d11 ← d2へ移動
      // │  └f111.txt
      // └d2 ← 読み込まれていないのでストアには存在しない
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const f111 = newStorageFileNode(`d1/d11/f111.txt`)
      const d2 = newStorageDirNode(`d2`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111])
      })

      // モック設定
      const moved_d11 = cloneStorageNode(d11, { dir: `d2`, path: `d2/d11`, updatedAt: dayjs() })
      const moved_f111 = cloneStorageNode(f111, { dir: `d2/d11`, path: `d2/d11/f111.txt` })
      td.when(appStorage.getHierarchicalNodesAPI(d2.path)).thenResolve([d2])
      td.when(appStorage.getNodesAPI({ ids: [moved_d11.id, moved_f111.id] })).thenResolve([moved_d11, moved_f111])

      // 'd1/d11'を'd2'へ移動
      const actual = await appStorage.moveDir(d11.path, moved_d11.path)

      // bucketRoot
      // ├d1
      // └d2 ← 読み込まれたのでストアに存在する
      //   └d11
      //     └f111.txt
      expect(actual.length).toBe(2)
      expect(actual[0]).toEqual(moved_d11)
      expect(actual[1]).toEqual(moved_f111)
      expect(appStorage.getAllNodes()).toEqual([d1, d2, moved_d11, moved_f111])

      const exp = td.explain(appStorage.moveDirAPI.value)
      expect(exp.calls[0].args).toEqual([d11.path, moved_d11.path])
    })

    it('APIでエラーが発生した場合', async () => {
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const d2 = newStorageDirNode(`d2`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, d2])
      })

      // モック設定
      const moved_d11 = cloneStorageNode(d11, { dir: `d2`, path: `d2/d11`, updatedAt: dayjs() })
      td.when(appStorage.moveDirAPI(d11.path, moved_d11.path)).thenReject(new Error())

      try {
        await appStorage.moveDir(d11.path, moved_d11.path)
      } catch (err) {}

      // ノードリストに変化がないことを検証
      expect(appStorage.getAllNodes()).toEqual([d1, d11, d2])
    })
  })

  describe('moveFile', () => {
    it('ベーシックケース', async () => {
      // bucketRoot
      // └d1
      //   ├d11
      //   │└f111.txt ← d12へ移動
      //   └d12
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const f111 = newStorageFileNode(`d1/d11/f111.txt`)
      const d12 = newStorageDirNode(`d1/d12`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, d12])
      })

      // モック設定
      const moved_f111 = cloneStorageNode(f111, { dir: `d1/d12`, path: `d1/d12/f111.txt`, updatedAt: dayjs() })
      td.when(appStorage.moveFileAPI(f111.path, moved_f111.path)).thenResolve(moved_f111)

      // 'd1/d11/f111.txt'を'd1/d12/f111.txt'へ移動
      const actual = await appStorage.moveFile(f111.path, moved_f111.path)

      // bucketRoot
      // └d1
      //   ├d11
      //   └d12
      //     └f111.txt
      expect(actual).toEqual(moved_f111)
      expect(appStorage.getAllNodes()).toEqual([d1, d11, d12, moved_f111])
    })

    it('APIでエラーが発生した場合', async () => {
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const f111 = newStorageFileNode(`d1/d11/f111.txt`)
      const d12 = newStorageDirNode(`d1/d12`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, d12])
      })

      // モック設定
      const moved_f111 = cloneStorageNode(f111, { dir: `d1/d12`, path: `d1/d12/f111.txt`, updatedAt: dayjs() })
      td.when(appStorage.moveFileAPI(f111.path, moved_f111.path)).thenReject(new Error())

      try {
        await appStorage.moveFile(f111.path, moved_f111.path)
      } catch (err) {}

      // ノードリストに変化がないことを検証
      expect(appStorage.getAllNodes()).toEqual([d1, d11, f111, d12])
    })
  })

  describe('renameDir', () => {
    it('ベーシックケース', async () => {
      // bucketRoot
      // └d1
      //   └d11 ← x11へリネーム
      //     └f111.txt
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const f111 = newStorageFileNode(`d1/d11/f111.txt`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111])
      })

      // モック設定
      const renamed_x11 = cloneStorageNode(d11, { name: `x11`, path: `d1/x11`, updatedAt: dayjs() })
      const renamed_f111 = cloneStorageNode(f111, { dir: `d1/x11`, path: `d1/x11/f111.txt` })
      td.when(appStorage.getNodesAPI({ ids: [renamed_x11.id, renamed_f111.id] })).thenResolve([renamed_x11, renamed_f111])

      // 'd1/d11'を'd1/x11'へリネーム
      const actual = await appStorage.renameDir(d11.path, renamed_x11.name)

      // bucketRoot
      // └d1
      //   └x11
      //     └f111.txt
      expect(actual.length).toBe(2)
      expect(actual[0]).toEqual(renamed_x11)
      expect(actual[1]).toEqual(renamed_f111)
      expect(appStorage.getAllNodes()).toEqual([d1, renamed_x11, renamed_f111])

      const exp = td.explain(appStorage.renameDirAPI.value)
      expect(exp.calls[0].args).toEqual([d11.path, renamed_x11.name])
    })

    it('APIでエラーが発生した場合', async () => {
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11])
      })

      // モック設定
      const renamed_x11 = cloneStorageNode(d11, { name: `x11`, path: `d1/x11`, updatedAt: dayjs() })
      td.when(appStorage.renameDirAPI(d11.path, renamed_x11.name)).thenReject(new Error())

      try {
        await appStorage.renameDir(d11.path, renamed_x11.name)
      } catch (err) {}

      // ノードリストに変化がないことを検証
      expect(appStorage.getAllNodes()).toEqual([d1, d11])
    })
  })

  describe('renameFile', () => {
    it('ベーシックケース', async () => {
      // bucketRoot
      // └d1
      //   └d11
      //     └f111.txt ← f11X.txtへリネーム
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const f111 = newStorageFileNode(`d1/d11/f111.txt`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111])
      })

      // モック設定
      const renamed_f11X = cloneStorageNode(f111, { name: `f11X.txt`, path: `d1/d11/f11X.txt`, updatedAt: dayjs() })
      td.when(appStorage.renameFileAPI(f111.path, renamed_f11X.name)).thenResolve(renamed_f11X)

      // 'd1/d11/f111.txt'を'd1/d11/f11X.txt'へリネーム
      const actual = await appStorage.renameFile(f111.path, renamed_f11X.name)

      // bucketRoot
      // └d1
      //   └d11
      //     └f11X.txt
      expect(actual).toEqual(renamed_f11X)
      expect(appStorage.getAllNodes()).toEqual([d1, d11, renamed_f11X])
    })

    it('APIでエラーが発生した場合', async () => {
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const f111 = newStorageFileNode(`d1/d11/f111.txt`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111])
      })

      // モック設定
      const renamed_f11X = cloneStorageNode(f111, { name: `fileX.txt`, path: `d1/d11/fileX.txt`, updatedAt: dayjs() })
      td.when(appStorage.renameFileAPI(f111.path, renamed_f11X.name)).thenReject(new Error())

      try {
        await appStorage.renameFile(f111.path, renamed_f11X.name)
      } catch (err) {}

      // ノードリストに変化がないことを検証
      expect(appStorage.getAllNodes()).toEqual([d1, d11, f111])
    })
  })

  describe('setDirShareSettings', () => {
    const NEW_SHARE_SETTINGS: StorageNodeShareSettings = {
      isPublic: true,
      readUIds: ['ichiro'],
      writeUIds: ['ichiro'],
    }

    it('ベーシックケース', async () => {
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const f111 = newStorageFileNode(`d1/d11/f111.txt`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111])
      })

      const updated_d11 = cloneStorageNode(d11, { share: NEW_SHARE_SETTINGS, updatedAt: dayjs() })
      td.when(appStorage.setDirShareSettingsAPI(d11.path, NEW_SHARE_SETTINGS)).thenResolve(updated_d11)

      const actual = await appStorage.setDirShareSettings(d11.path, NEW_SHARE_SETTINGS)

      expect(actual).toEqual(updated_d11)
      expect(appStorage.getAllNodes()).toEqual([d1, updated_d11, f111])
    })

    it('APIでエラーが発生した場合', async () => {
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11])
      })

      td.when(appStorage.setDirShareSettingsAPI(d11.path, NEW_SHARE_SETTINGS)).thenReject(new Error())

      try {
        await appStorage.setDirShareSettings(d11.path, NEW_SHARE_SETTINGS)
      } catch (err) {}

      // ノードリストに変化がないことを検証
      expect(appStorage.getAllNodes()).toEqual([d1, d11])
    })
  })

  describe('setFileShareSettings', () => {
    const NEW_SHARE_SETTINGS: StorageNodeShareSettings = {
      isPublic: true,
      readUIds: ['ichiro'],
      writeUIds: ['ichiro'],
    }

    it('ベーシックケース', async () => {
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const f111 = newStorageFileNode(`d1/d11/f111.txt`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111])
      })

      const updatedFileA = cloneStorageNode(f111, { share: NEW_SHARE_SETTINGS, updatedAt: dayjs() })
      td.when(appStorage.setFileShareSettingsAPI(f111.path, NEW_SHARE_SETTINGS)).thenResolve(updatedFileA)

      const actual = await appStorage.setFileShareSettings(f111.path, NEW_SHARE_SETTINGS)

      expect(actual).toEqual(updatedFileA)
      expect(appStorage.getAllNodes()).toEqual([d1, d11, updatedFileA])
    })

    it('APIでエラーが発生した場合', async () => {
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const f111 = newStorageFileNode(`d1/d11/f111.txt`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111])
      })

      td.when(appStorage.setFileShareSettingsAPI(f111.path, NEW_SHARE_SETTINGS)).thenReject(new Error())

      try {
        await appStorage.setFileShareSettings(f111.path, NEW_SHARE_SETTINGS)
      } catch (err) {}

      // ノードリストに変化がないことを検証
      expect(appStorage.getAllNodes()).toEqual([d1, d11, f111])
    })
  })

  describe('handleUploadedFile', () => {
    it('ベーシックケース', async () => {
      // bucketRoot
      // └d1
      //   └d11
      //     └[f111.txt] ← アップロード後の処理が必要
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const f111 = newStorageFileNode(`d1/d11/f111.txt`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11])
      })

      td.when(appStorage.handleUploadedFileAPI({ id: f111.id, path: f111.path })).thenResolve(f111)

      const actual = await appStorage.handleUploadedFile({ id: f111.id, path: f111.path })

      // bucketRoot
      // └d1
      //   └d11
      //     └f111.txt
      expect(actual).toEqual(f111)
      expect(appStorage.getAllNodes()).toEqual([d1, d11, f111])
    })

    it('APIでエラーが発生した場合', async () => {
      const d1 = newStorageDirNode(`d1`)
      const d11 = newStorageDirNode(`d1/d11`)
      const f111 = newStorageFileNode(`d1/d11/f111.txt`)
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11])
      })

      td.when(appStorage.handleUploadedFileAPI({ id: f111.id, path: f111.path })).thenReject(new Error())

      try {
        await appStorage.handleUploadedFile({ id: f111.id, path: f111.path })
      } catch (err) {}

      // ノードリストに変化がないことを検証
      expect(appStorage.getAllNodes()).toEqual([d1, d11])
    })
  })

  describe('setAPINodesToStore', () => {
    it('ベーシックケース', async () => {
      // bucketRoot
      // └dA
      const dA = newStorageDirNode('dA')
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([dA])
      })

      // bucketRoot
      // └dA
      //   └dB ← 追加された
      //     └fileB.txt
      const dB = newStorageDirNode('dA/dB')
      const fileB = newStorageFileNode('dA/dB/fileB.txt')

      const actual = await appStorage.setAPINodesToStore([dA, dB, fileB])

      expect(actual).toEqual([dA, dB, fileB])
      expect(appStorage.getAllNodes()).toEqual([dA, dB, fileB])
    })

    it('他端末でディレクトリ移動が行われていた場合', async () => {
      // bucketRoot
      // ├dC ← 他端末で｢tmp2/dA/dB｣へ移動されている
      // │└fileC.txt
      // └tmp1
      //   └dA ← 他端末で｢tmp2｣へ移動されている
      //     ├dB
      //     │└fileB.txt
      //     └fileA.txt
      let dC = newStorageDirNode('dC')
      let fileC = newStorageFileNode('dC/fileC.txt')
      const tmp1 = newStorageDirNode('tmp1')
      let dA = newStorageDirNode('tmp1/dA')
      let dB = newStorageDirNode('tmp1/dA/dB')
      let fileB = newStorageFileNode('tmp1/dA/dB/fileB.txt')
      let fileA = newStorageFileNode('tmp1/dA/fileA.txt')
      const {
        services: { appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([dC, fileC, tmp1, dA, dB, fileB, fileA])
      })

      // bucketRoot
      // ├tmp1
      // └tmp2
      //   └dA
      //     ├dB
      //     │├dC
      //     ││└fileC.txt
      //     │└fileB.txt
      //     └fileA.txt
      const tmp2 = newStorageDirNode('tmp2')
      dA = cloneStorageNode(dA, { dir: 'tmp2', path: 'tmp2/dA', updatedAt: dayjs() })
      dB = cloneStorageNode(dB, { dir: 'tmp2/dA', path: 'tmp2/dA/dB' })
      dC = cloneStorageNode(dC, { dir: 'tmp2/dA/dB', path: 'tmp2/dA/dB/dC', updatedAt: dayjs() })
      fileC = cloneStorageNode(fileC, { dir: 'tmp2/dA/dB/dC', path: 'tmp2/dA/dB/dC/fileC.txt' })
      fileB = cloneStorageNode(fileB, { dir: 'tmp2/dA/dB', path: 'tmp2/dA/dB/fileB.txt' })
      fileA = cloneStorageNode(fileA, { dir: 'tmp2/dA', path: 'tmp2/dA/fileA.txt' })

      const actual = appStorage.setAPINodesToStore([tmp2, dA, dB, dC, fileC, fileB, fileA])

      expect(actual).toEqual([tmp2, dA, dB, dC, fileC, fileB, fileA])
      expect(appStorage.getAllNodes()).toEqual([tmp1, tmp2, dA, dB, dC, fileC, fileB, fileA])
    })
  })
})
