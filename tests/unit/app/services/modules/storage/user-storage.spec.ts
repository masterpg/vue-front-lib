import {
  GeneralToken,
  TestUserStorageService,
  cloneStorageNode,
  mockStorageServiceAPIMethods,
  newStorageDirNode,
  newStorageFileNode,
  provideDependency,
} from '../../../../../helpers/app'
import { StorageNode, StorageNodeShareSettings } from '@/app/services'
import _path from 'path'
import dayjs from 'dayjs'
import firebase from 'firebase'
import { splitHierarchicalPaths } from 'web-base-lib'
import { useConfig } from '@/app/config'

//========================================================================
//
//  Tests
//
//========================================================================

describe('UserStorageService', () => {
  let basePath: string
  let basePathRoot: StorageNode
  let basePathNodes: StorageNode[]
  let toBasePath: TestUserStorageService['toBasePath']
  let toBasePaths: TestUserStorageService['toBasePaths']
  let toBasePathNode: TestUserStorageService['toBasePathNode']
  let toBasePathNodes: TestUserStorageService['toBasePathNodes']
  let toFullPath: TestUserStorageService['toFullPath']
  let toFullPaths: TestUserStorageService['toFullPaths']

  beforeEach(async () => {
    provideDependency(({ services, helpers }) => {
      // Firebaseの認証状態が変化した際の処理は実行されたくないので無効化
      services.auth.firebaseOnAuthStateChanged.value = async user => {}
      // ベースパスをモック化
      const config = useConfig()
      basePath = _path.join(config.storage.user.rootName, GeneralToken().uid)
      services.userStorage.basePath.value = basePath
      // ベースパスノードの作成
      basePathNodes = []
      for (const dirPath of splitHierarchicalPaths(basePath)) {
        basePathNodes.push(newStorageDirNode(dirPath))
      }
      basePathRoot = basePathNodes[basePathNodes.length - 1]
      // サービスのAPI系メソッドをモック化
      mockStorageServiceAPIMethods(services)
      // ショートハンド用変数にメソッドを設定
      toBasePath = services.userStorage.toBasePath
      toBasePaths = services.userStorage.toBasePaths
      toBasePathNode = services.userStorage.toBasePathNode
      toBasePathNodes = services.userStorage.toBasePathNodes
      toFullPath = services.userStorage.toFullPath
      toFullPaths = services.userStorage.toFullPaths
    })
  })

  describe('getAllNodes', () => {
    it('ベーシックケース', () => {
      // basePathRoot
      // ├d1
      // │├d11
      // ││└f111.txt
      // │└d12
      // └d2
      const d1 = newStorageDirNode(`${basePath}/d1`)
      const d11 = newStorageDirNode(`${basePath}/d1/d11`)
      const f111 = newStorageFileNode(`${basePath}/d1/d11/f111.txt`)
      const d12 = newStorageDirNode(`${basePath}/d1/d12`)
      const d2 = newStorageDirNode(`${basePath}/d2`)
      const {
        services: { userStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([...basePathNodes, d1, d11, f111, d12, d2])
      })

      const actual = userStorage.getAllNodes()

      expect(actual.length).toBe(5)
      expect(actual).toEqual(toBasePathNodes([d1, d11, f111, d12, d2]))
    })
  })

  describe('getNode', () => {
    it('ベーシックケース - ノードIDで取得', () => {
      const d1 = newStorageDirNode(`${basePath}/d1`)
      const {
        services: { userStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1])
      })

      const actual = userStorage.getNode({ id: d1.id })

      expect(actual).toEqual(toBasePathNode(d1))
    })

    it('ベーシックケース - ノードパスで取得', () => {
      const d1 = newStorageDirNode(`${basePath}/d1`)
      const {
        services: { userStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([...basePathNodes, d1])
      })

      const actual = userStorage.getNode({ path: toBasePath(d1.path) })

      expect(actual).toEqual(toBasePathNode(d1))
    })

    it('ベースパスを指定した場合', () => {
      const d1 = newStorageDirNode(`${basePath}/d1`)
      const {
        services: { userStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([...basePathNodes, d1])
      })

      const actual = userStorage.getNode({ path: `` })

      // ベースパスノードは取得されない
      expect(actual).toBeUndefined()
    })
  })

  describe('sgetNode', () => {
    it('ベーシックケース - ノードIDで取得', () => {
      const d1 = newStorageDirNode(`${basePath}/d1`)
      const {
        services: { userStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1])
      })

      const actual = userStorage.sgetNode({ id: d1.id })

      expect(actual).toEqual(toBasePathNode(d1))
    })

    it('ベーシックケース - ノードパスで取得', () => {
      const d1 = newStorageDirNode(`${basePath}/d1`)
      const {
        services: { userStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([...basePathNodes, d1])
      })

      const actual = userStorage.sgetNode({ path: toBasePath(d1.path) })

      expect(actual).toEqual(toBasePathNode(d1))
    })
  })

  describe('getDescendants', () => {
    it('ベーシックケース', async () => {
      // basePathRoot
      // ├d1 ← 対象ノードに指定
      // │├d11
      // ││└f111.txt
      // │└d12
      // └d2
      const d1 = newStorageDirNode(`${basePath}/d1`)
      const d11 = newStorageDirNode(`${basePath}/d1/d11`)
      const f111 = newStorageFileNode(`${basePath}/d1/d11/f111.txt`)
      const d12 = newStorageDirNode(`${basePath}/d1/d12`)
      const d2 = newStorageDirNode(`${basePath}/d2`)
      const {
        services: { userStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([...basePathNodes, d1, d11, f111, d12, d2])
      })

      const actual = userStorage.getDescendants({ path: toBasePath(d1.path), includeBase: true })

      expect(actual).toEqual(toBasePathNodes([d1, d11, f111, d12]))
    })

    it('ベースパス配下の検索', async () => {
      // basePathRoot
      // ├d1
      // │├d11
      // ││└f111.txt
      // │└d12
      // └d2
      const d1 = newStorageDirNode(`${basePath}/d1`)
      const d11 = newStorageDirNode(`${basePath}/d1/d11`)
      const f111 = newStorageFileNode(`${basePath}/d1/d11/f111.txt`)
      const d12 = newStorageDirNode(`${basePath}/d1/d12`)
      const d2 = newStorageDirNode(`${basePath}/d2`)
      const {
        services: { userStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([...basePathNodes, d1, d11, f111, d12, d2])
      })

      const actual = userStorage.getDescendants({ path: `` })

      expect(actual).toEqual(toBasePathNodes([d1, d11, f111, d12, d2]))
    })
  })

  describe('getChildren', () => {
    it('ベーシックケース', async () => {
      // basePathRoot
      // ├d1 ← 対象ノードに指定
      // │├d11
      // ││└f111.txt
      // │└d12
      // └d2
      const d1 = newStorageDirNode(`${basePath}/d1`)
      const d11 = newStorageDirNode(`${basePath}/d1/d11`)
      const f111 = newStorageFileNode(`${basePath}/d1/d11/f111.txt`)
      const d12 = newStorageDirNode(`${basePath}/d1/d12`)
      const d2 = newStorageDirNode(`${basePath}/d2`)
      const {
        services: { userStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([...basePathNodes, d1, d11, f111, d12, d2])
      })

      const actual = userStorage.getChildren({ path: toBasePath(d1.path), includeBase: true })

      expect(actual).toEqual(toBasePathNodes([d1, d11, d12]))
    })

    it('対象ノードを指定しなかった場合', async () => {
      // basePathRoot
      // ├d1
      // │├d11
      // ││└f111.txt
      // │└d12
      // └d2
      const d1 = newStorageDirNode(`${basePath}/d1`)
      const d11 = newStorageDirNode(`${basePath}/d1/d11`)
      const f111 = newStorageFileNode(`${basePath}/d1/d11/f111.txt`)
      const d12 = newStorageDirNode(`${basePath}/d1/d12`)
      const d2 = newStorageDirNode(`${basePath}/d2`)
      const {
        services: { userStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([...basePathNodes, d1, d11, f111, d12, d2])
      })

      const actual = userStorage.getChildren({ path: `` })

      expect(actual).toEqual(toBasePathNodes([d1, d2]))
    })
  })

  describe('getHierarchicalNodes', () => {
    it('ベーシックケース', async () => {
      // basePathRoot
      // ├d1
      // │├d11
      // ││└f111.txt ← 対象ノードに指定
      // │└d12
      // └d2
      const d1 = newStorageDirNode(`${basePath}/d1`)
      const d11 = newStorageDirNode(`${basePath}/d1/d11`)
      const f111 = newStorageFileNode(`${basePath}/d1/d11/f111.txt`)
      const d12 = newStorageDirNode(`${basePath}/d1/d12`)
      const d2 = newStorageDirNode(`${basePath}/d2`)
      const {
        services: { userStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([...basePathNodes, d1, d11, f111, d12, d2])
      })

      const actual = userStorage.getHierarchicalNodes(toBasePath(f111.path))

      expect(actual).toEqual(toBasePathNodes([d1, d11, f111]))
    })

    it('対象ノードに空文字を指定した場合', async () => {
      const {
        services: { userStorage },
      } = provideDependency()

      const actual = userStorage.getHierarchicalNodes('')

      expect(actual).toEqual([])
    })
  })

  describe('getInheritedShare', () => {
    it('ベーシックケース', async () => {
      // basePathRoot
      // └d1
      //   └d11
      //     └f111.txt
      const d1 = newStorageDirNode(`${basePath}/d1`)
      const d11 = newStorageDirNode(`${basePath}/d1/d11`)
      const f111 = newStorageFileNode(`${basePath}/d1/d11/f111.txt`, {
        share: {
          isPublic: true,
          readUIds: ['saburo'],
          writeUIds: ['saburo'],
        },
      })
      const {
        services: { userStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([...basePathNodes, d1, d11, f111])
      })

      const actual = userStorage.getInheritedShare(toBasePath(f111.path))

      expect(actual).toEqual({
        isPublic: true,
        readUIds: ['saburo'],
        writeUIds: ['saburo'],
      })
    })

    it('対象ノードにベースパスルートを指定した場合', async () => {
      const {
        services: { userStorage },
      } = provideDependency()

      let actual!: Error
      try {
        await userStorage.getInheritedShare('')
      } catch (err) {
        actual = err
      }

      expect(actual.message).toBe(`Base path root is set for 'nodePath'.`)
    })
  })

  describe('fetchRoot', () => {
    it('ベーシックケース - 構成ノードが未読み込み(構成ノードは存在する)', async () => {
      const {
        services: { userStorage, appStorage },
      } = provideDependency()

      // モック設定
      td.when(userStorage.getHierarchicalNodesAPI(basePath)).thenResolve([...basePathNodes])

      // テスト対象実行
      await userStorage.fetchRoot()

      expect(appStorage.getAllNodes()).toEqual([...basePathNodes])
    })

    it('ベーシックケース - 構成ノードが未読み込み(構成ノードが存在しない)', async () => {
      const {
        services: { userStorage, appStorage },
      } = provideDependency()

      // モック設定
      td.when(userStorage.getHierarchicalNodesAPI(basePath)).thenResolve([])
      td.when(userStorage.createHierarchicalDirsAPI([basePath])).thenResolve([...basePathNodes])

      // テスト対象実行
      await userStorage.fetchRoot()

      expect(appStorage.getAllNodes()).toEqual([...basePathNodes])
    })
  })

  describe('fetchNode', () => {
    it('ベーシックケース - パス検索', async () => {
      // basePathRoot
      // ├d1 ← 対象ノードに指定
      // │├d11
      // ││└f111.txt
      // │└f11.txt
      // └d2
      const d1 = newStorageDirNode(`${basePath}/d1`)
      const d11 = newStorageDirNode(`${basePath}/d1/d11`)
      const f111 = newStorageFileNode(`${basePath}/d1/d11/f111.txt`)
      const f11 = newStorageFileNode(`${basePath}/d1/f11.txt`)
      const d2 = newStorageDirNode(`${basePath}/d2`)
      const {
        services: { userStorage, appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([...basePathNodes, d1, d11, f111, f11, d2])
      })

      // APIから以下の状態のノードリストが取得される
      // ・'d1'が更新された
      const updated_d1 = cloneStorageNode(d1, { updatedAt: dayjs() })
      td.when(userStorage.getNodeAPI({ path: d1.path })).thenResolve(updated_d1)

      const actual = await userStorage.fetchNode({ path: toBasePath(d1.path) })

      // basePathRoot
      // ├d1
      // │├d11
      // ││└f112.txt
      // │└d12
      // └d2
      expect(actual).toEqual(toBasePathNode(updated_d1))
      expect(appStorage.getAllNodes()).toEqual([...basePathNodes, updated_d1, d11, f111, f11, d2])
    })

    it('ベースパスルートを指定した場合', async () => {
      // basePathRoot ← 対象ノードに指定
      // └d1
      const d1 = newStorageDirNode(`${basePath}/d1`)
      const {
        services: { userStorage, appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([...basePathNodes, d1])
      })

      const actual = await userStorage.fetchNode({ path: `` })

      // basePathRoot
      // └d1
      expect(actual).toBeUndefined()
      expect(appStorage.getAllNodes()).toEqual([...basePathNodes, d1])
    })
  })

  describe('fetchNodes', () => {
    it('ベーシックケース - パス検索', async () => {
      // basePathRoot
      // ├d1 ← 対象ノードに指定
      // │├d11
      // ││└f111.txt
      // │└f11.txt
      // └d2
      const d1 = newStorageDirNode(`${basePath}/d1`)
      const d11 = newStorageDirNode(`${basePath}/d1/d11`)
      const f111 = newStorageFileNode(`${basePath}/d1/d11/f111.txt`)
      const f11 = newStorageFileNode(`${basePath}/d1/f11.txt`)
      const d2 = newStorageDirNode(`${basePath}/d2`)
      const {
        services: { userStorage, appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([...basePathNodes, d1, d11, f111, f11, d2])
      })

      // APIから以下の状態のノードリストが取得される
      // ・'d1'が更新された
      const updated_d1 = cloneStorageNode(d1, { updatedAt: dayjs() })
      td.when(userStorage.getNodesAPI({ paths: [d1.path] })).thenResolve([updated_d1])

      const actual = await userStorage.fetchNodes({ paths: toBasePaths([d1.path]) })

      // basePathRoot
      // ├d1
      // │├d11
      // ││└f112.txt
      // │└d12
      // └d2
      expect(actual).toEqual(toBasePathNodes([updated_d1]))
      expect(appStorage.getAllNodes()).toEqual([...basePathNodes, updated_d1, d11, f111, f11, d2])
    })

    it('ベースパスルートを指定した場合', async () => {
      // basePathRoot ← 対象ノードに指定
      // └d1
      const d1 = newStorageDirNode(`${basePath}/d1`)
      const {
        services: { userStorage, appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([...basePathNodes, d1])
      })

      td.when(userStorage.getNodesAPI({ paths: [] })).thenResolve([])

      const actual = await userStorage.fetchNodes({ paths: [``] })

      // basePathRoot
      // └d1
      expect(actual).toEqual([])
      expect(appStorage.getAllNodes()).toEqual([...basePathNodes, d1])
    })
  })

  describe('fetchHierarchicalNodes', () => {
    it('ベーシックケース', async () => {
      // basePathRoot
      // └dA
      //   └[dB]
      //     └[dC]
      //       └[fileC.txt] ← 対象ノードに指定
      const dA = newStorageDirNode(`${basePath}/dA`)
      const dB = newStorageDirNode(`${basePath}/dA/dB`)
      const dC = newStorageDirNode(`${basePath}/dA/dB/dC`)
      const fileC = newStorageDirNode(`${basePath}/dA/dB/dC/fileC.txt`)
      const {
        services: { userStorage, appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([...basePathNodes, dA])
      })

      td.when(userStorage.getHierarchicalNodesAPI(fileC.path)).thenResolve([...basePathNodes, dA, dB, dC, fileC])

      const actual = await userStorage.fetchHierarchicalNodes(toBasePath(fileC.path))

      // basePathRoot
      // └dA
      //   └dB
      //     └dC
      //       └fileC.txt
      expect(actual).toEqual(toBasePathNodes([dA, dB, dC, fileC]))
      expect(appStorage.getAllNodes()).toEqual([...basePathNodes, dA, dB, dC, fileC])
    })

    it('ベースパスルートを指定した場合', async () => {
      const {
        services: { userStorage, appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([...basePathNodes])
      })

      td.when(userStorage.getHierarchicalNodesAPI(basePath)).thenResolve([...basePathNodes])

      const actual = await userStorage.fetchHierarchicalNodes(``)

      expect(actual).toEqual(toBasePathNodes([]))
      expect(appStorage.getAllNodes()).toEqual([...basePathNodes])
    })
  })

  describe('fetchAncestorDirs', () => {
    it('ベーシックケース', async () => {
      // basePathRoot
      // └dA
      //   └[dB]
      //     └[dC]
      //       └[fileC.txt] ← 対象ノードに指定
      const dA = newStorageDirNode(`${basePath}/dA`)
      const dB = newStorageDirNode(`${basePath}/dA/dB`)
      const dC = newStorageDirNode(`${basePath}/dA/dB/dC`)
      const {
        services: { userStorage, appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([...basePathNodes, dA])
      })

      td.when(userStorage.getAncestorDirsAPI(toFullPath(`dA/dB/dC/fileC.txt`))).thenResolve([...basePathNodes, dA, dB, dC])

      const actual = await userStorage.fetchAncestorDirs(`dA/dB/dC/fileC.txt`)

      // basePathRoot
      // └dA
      //   └dB
      //     └dC
      expect(actual).toEqual(toBasePathNodes([dA, dB, dC]))
      expect(appStorage.getAllNodes()).toEqual([...basePathNodes, dA, dB, dC])
    })

    it('ベースパスルートを指定した場合', async () => {
      // [basePathRoot] ← 対象ノードに指定
      // └[dA]
      const {
        services: { userStorage, appStorage },
      } = provideDependency()

      const basePathAncestors = basePathNodes.filter(node => node.path != basePath)
      td.when(userStorage.getAncestorDirsAPI(basePath)).thenResolve([...basePathAncestors])

      const actual = await userStorage.fetchAncestorDirs(``)

      // basePathRoot
      // └dA
      expect(actual).toEqual(toBasePathNodes([]))
      expect(appStorage.getAllNodes()).toEqual([...basePathAncestors])
    })
  })

  describe('fetchDirDescendants', () => {
    it('ベーシックケース', async () => {
      // basePathRoot
      // ├[d1] ← 対象ノードに指定
      // │├[d11]
      // ││└[f111.txt]
      // │└[d12]
      // └d2
      const d1 = newStorageDirNode(`${basePath}/d1`)
      const d11 = newStorageDirNode(`${basePath}/d1/d11`)
      const f111 = newStorageFileNode(`${basePath}/d1/d11/f111.txt`)
      const d12 = newStorageDirNode(`${basePath}/d1/d12`)
      const d2 = newStorageDirNode(`${basePath}/d2`)
      const {
        services: { userStorage, appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([...basePathNodes, d2])
      })

      td.when(userStorage.getDescendantsAPI({ path: d1.path, includeBase: true })).thenResolve([d1, d11, f111, d12])

      const actual = await userStorage.fetchDescendants({ path: toBasePath(d1.path), includeBase: true })

      // basePathRoot
      // ├d1
      // │├d11
      // ││└f112.txt
      // │└d12
      // └d2
      expect(actual).toEqual(toBasePathNodes([d1, d11, f111, d12]))
      expect(appStorage.getAllNodes()).toEqual([...basePathNodes, d1, d11, f111, d12, d2])
    })

    it('ベースパス配下の検索', async () => {
      // [basePathRoot] ← 対象ノードに指定
      // └[d1]
      //   ├[d11]
      //   │└[f111.txt]
      //   └[d12]
      const d1 = newStorageDirNode(`${basePath}/d1`)
      const d11 = newStorageDirNode(`${basePath}/d1/d11`)
      const f111 = newStorageFileNode(`${basePath}/d1/d11/f111.txt`)
      const d12 = newStorageDirNode(`${basePath}/d1/d12`)
      const {
        services: { userStorage, appStorage },
      } = provideDependency()

      // ベースパスルートを指定してAPIリクエストするので、ベースパスルートを含んだノードリストが取得される
      td.when(userStorage.getDescendantsAPI({ path: basePath })).thenResolve([...basePathNodes, d1, d11, f111, d12])

      const actual = await userStorage.fetchDescendants({ path: `` })

      // basePathRoot
      // └d1
      //   ├d11
      //   │└f111.txt
      //   └d12
      // 戻り値にはベースパスルートが含まれないことに注意
      expect(actual).toEqual(toBasePathNodes([d1, d11, f111, d12]))
      expect(appStorage.getAllNodes()).toEqual([...basePathNodes, d1, d11, f111, d12])
    })
  })

  describe('fetchChildren', () => {
    it('ベーシックケース', async () => {
      // basePathRoot
      // ├[d1] ← 対象ノードに指定
      // │├[d11]
      // │└[d12]
      // └d2
      const d1 = newStorageDirNode(`${basePath}/d1`)
      const d11 = newStorageDirNode(`${basePath}/d1/d11`)
      const d12 = newStorageDirNode(`${basePath}/d1/d12`)
      const d2 = newStorageDirNode(`${basePath}/d2`)
      const {
        services: { userStorage, appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([...basePathNodes, d2])
      })

      td.when(userStorage.getChildrenAPI({ path: d1.path, includeBase: true })).thenResolve([d1, d11, d12])

      const actual = await userStorage.fetchChildren({ path: toBasePath(d1.path), includeBase: true })

      // basePathRoot
      // ├d1
      // │├d11
      // │└d12
      // └d2
      expect(actual).toEqual(toBasePathNodes([d1, d11, d12]))
      expect(appStorage.getAllNodes()).toEqual([...basePathNodes, d1, d11, d12, d2])
    })

    it('ベースパス配下の検索', async () => {
      // [basePathRoot] ← 対象ノードに指定
      // ├[d1]
      // └[d2]
      const d1 = newStorageDirNode(`${basePath}/d1`)
      const d2 = newStorageDirNode(`${basePath}/d2`)
      const {
        services: { userStorage, appStorage },
      } = provideDependency()

      // ベースパスルートを指定してAPIリクエストするので、ベースパスルートを含んだノードリストが取得される
      td.when(userStorage.getChildrenAPI({ path: basePath })).thenResolve([...basePathNodes, d1, d2])

      const actual = await userStorage.fetchChildren({ path: `` })

      // basePathRoot ← 対象ノードに指定
      // ├d1
      // └d2
      // 戻り値にはベースパスルートが含まれないことに注意
      expect(actual).toEqual(toBasePathNodes([d1, d2]))
      expect(appStorage.getAllNodes()).toEqual([...basePathNodes, d1, d2])
    })
  })

  describe('fetchHierarchicalDescendants', () => {
    it('対象ノードを指定した場合', async () => {
      // [basePathRoot]
      // └[d1]
      //   └[d11] ← 対象ノードに指定
      //     ├[d111]
      //     │└[f1111.txt]
      //     └[f111.txt]
      const d1 = newStorageDirNode(`${basePath}/d1`)
      const d11 = newStorageDirNode(`${basePath}/d1/d11`)
      const d111 = newStorageDirNode(`${basePath}/d1/d11/d111`)
      const f1111 = newStorageFileNode(`${basePath}/d1/d11/d111/f1111.txt`)
      const f111 = newStorageFileNode(`${basePath}/d1/d11/f111.txt`)
      const {
        services: { userStorage, appStorage },
      } = provideDependency()

      td.when(userStorage.getHierarchicalNodesAPI(d11.path)).thenResolve([...basePathNodes, d1, d11])
      td.when(userStorage.getDescendantsAPI({ path: d11.path })).thenResolve([d111, f1111, f111])

      const actual = await userStorage.fetchHierarchicalDescendants(toBasePath(d11.path))

      // basePathRoot
      // └d1
      //   └d11
      //     ├d111
      //     │└f1111.txt
      //     └f111.txt
      // 戻り値にはベースパスルートが含まれないことに注意
      expect(actual).toEqual(toBasePathNodes([d1, d11, d111, f1111, f111]))
      expect(appStorage.getAllNodes()).toEqual([...basePathNodes, d1, d11, d111, f1111, f111])
    })

    it('ベースパスルートを指定した場合', async () => {
      // [basePathRoot] ← 対象ノードに指定
      // └[d1]
      //   └[d11]
      //     ├[d111]
      //     │└[f1111.txt]
      //     └[f111.txt]
      const d1 = newStorageDirNode(`${basePath}/d1`)
      const d11 = newStorageDirNode(`${basePath}/d1/d11`)
      const d111 = newStorageDirNode(`${basePath}/d1/d11/d111`)
      const f1111 = newStorageFileNode(`${basePath}/d1/d11/d111/f1111.txt`)
      const f111 = newStorageFileNode(`${basePath}/d1/d11/f111.txt`)
      const {
        services: { userStorage, appStorage },
      } = provideDependency()

      // ベースパスルートを指定してAPIリクエストするので、ベースパスルートを含んだノードリストが取得される
      td.when(userStorage.getDescendantsAPI({ path: basePath })).thenResolve([...basePathNodes, d1, d11, d111, f1111, f111])

      const actual = await userStorage.fetchHierarchicalDescendants(``)

      // basePathRoot
      // └d1
      //   └d11
      //     ├d111
      //     │└f1111.txt
      //     └f111.txt
      // 戻り値にはベースパスルートが含まれないことに注意
      expect(actual).toEqual(toBasePathNodes([d1, d11, d111, f1111, f111]))
      expect(appStorage.getAllNodes()).toEqual([...basePathNodes, d1, d11, d111, f1111, f111])
    })
  })

  describe('fetchHierarchicalChildren', () => {
    it('ベーシックケース', async () => {
      // [basePathRoot]
      // └[d1]
      //   └[d11] ← 対象ノードに指定
      //     ├[d111]
      //     └[f111.txt]
      const d1 = newStorageDirNode(`${basePath}/d1`)
      const d11 = newStorageDirNode(`${basePath}/d1/d11`)
      const d111 = newStorageDirNode(`${basePath}/d1/d11/d111`)
      const f111 = newStorageFileNode(`${basePath}/d1/d11/f111.txt`)
      const {
        services: { userStorage, appStorage },
      } = provideDependency()

      td.when(userStorage.getHierarchicalNodesAPI(d11.path)).thenResolve([...basePathNodes, d1, d11])
      td.when(userStorage.getChildrenAPI({ path: d11.path })).thenResolve([d111, f111])

      const actual = await userStorage.fetchHierarchicalChildren(toBasePath(d11.path))

      // basePathRoot
      // └d1
      //   └d11
      //     ├d111
      //     └f111.txt
      // 戻り値にはベースパスルートが含まれないことに注意
      expect(actual).toEqual(toBasePathNodes([d1, d11, d111, f111]))
      expect(appStorage.getAllNodes()).toEqual([...basePathNodes, d1, d11, d111, f111])
    })

    it('バケットルートを指定した 場合', async () => {
      // [basePathRoot] ← 対象ノードに指定
      // └[d1]
      //   └[d11]
      //     ├[d111]
      //     └[f111.txt]
      const d1 = newStorageDirNode(`${basePath}/d1`)
      const d11 = newStorageDirNode(`${basePath}/d1/d11`)
      const d111 = newStorageDirNode(`${basePath}/d1/d11/d111`)
      const f111 = newStorageFileNode(`${basePath}/d1/d11/f111.txt`)
      const {
        services: { userStorage, appStorage },
      } = provideDependency()

      td.when(userStorage.getChildrenAPI({ path: basePath })).thenResolve([...basePathNodes, d1, d11, d111, f111])

      const actual = await userStorage.fetchHierarchicalChildren(``)

      // basePathRoot
      // └d1
      //   └d11
      //     ├d111
      //     └f111.txt
      // 戻り値にはベースパスルートが含まれないことに注意
      expect(actual).toEqual(toBasePathNodes([d1, d11, d111, f111]))
      expect(appStorage.getAllNodes()).toEqual([...basePathNodes, d1, d11, d111, f111])
    })
  })

  describe('createDir', () => {
    it('ベーシックケース', async () => {
      // basePathRoot
      // └d1
      //   └[d11] ← 作成
      const d1 = newStorageDirNode(`${basePath}/d1`)
      const d11 = newStorageDirNode(`${basePath}/d1/d11`)
      const {
        services: { userStorage, appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([...basePathNodes, d1])
      })

      td.when(userStorage.createDirAPI(d11.path, undefined)).thenResolve(d11)

      const actual = await userStorage.createDir(toBasePath(d11.path))

      // basePathRoot
      // └d1
      //   └d11
      expect(actual).toEqual(toBasePathNode(d11))
      expect(appStorage.getAllNodes()).toEqual([...basePathNodes, d1, d11])
    })
  })

  describe('createHierarchicalDirs', () => {
    it('ベーシックケース', async () => {
      // [basePathRoot]
      // └[d1]
      //   ├[d11]
      //   │└[d111] ← 作成
      //   └[d12] ← 作成
      const d1 = newStorageDirNode(`${basePath}/d1`)
      const d11 = newStorageDirNode(`${basePath}/d1/d11`)
      const d111 = newStorageDirNode(`${basePath}/d1/d11/d111`)
      const d12 = newStorageDirNode(`${basePath}/d1/d12`)
      const {
        services: { userStorage, appStorage },
      } = provideDependency()

      td.when(userStorage.createHierarchicalDirsAPI([d111.path, d12.path])).thenResolve([...basePathNodes, d1, d11, d111, d12])

      const actual = await userStorage.createHierarchicalDirs(toBasePaths([d111.path, d12.path]))

      // basePathRoot ← 上位ノードも作成される
      // └d1 ← 上位ノードも作成される
      //   ├d11 ← 上位ノードも作成される
      //   │└d111
      //   └d12
      expect(actual).toEqual(toBasePathNodes([d1, d11, d111, d12]))
      expect(appStorage.getAllNodes()).toEqual([...basePathNodes, d1, d11, d111, d12])
    })
  })

  describe('removeDir', () => {
    it('ベーシックケース', async () => {
      // basePathRoot
      // └d1
      //   ├d11 ← 削除
      //   │└f111.txt
      //   └d12
      const d1 = newStorageDirNode(`${basePath}/d1`)
      const d11 = newStorageDirNode(`${basePath}/d1/d11`)
      const f111 = newStorageFileNode(`${basePath}/d1/d11/f111.txt`)
      const d12 = newStorageDirNode(`${basePath}/d1/d12`)
      const {
        services: { userStorage, appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([...basePathNodes, d1, d11, f111, d12])
      })

      await userStorage.removeDir(toBasePath(d11.path))

      // basePathRoot
      // └d1
      //   └d12
      expect(appStorage.getAllNodes()).toEqual([...basePathNodes, d1, d12])

      const exp = td.explain(userStorage.removeDirAPI.value)
      expect(exp.calls[0].args[0]).toEqual(d11.path)
    })
  })

  describe('removeFile', () => {
    it('ベーシックケース', async () => {
      // basePathRoot
      // ├d1
      // │└d11
      // │  └f111.txt ← 削除
      // └f1.txt
      const d1 = newStorageDirNode(`${basePath}/d1`)
      const d11 = newStorageDirNode(`${basePath}/d1/d11`)
      const f111 = newStorageFileNode(`${basePath}/d1/d11/f111.txt`)
      const f1 = newStorageFileNode(`${basePath}/f1.txt`)
      const {
        services: { userStorage, appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([...basePathNodes, d1, d11, f111, f1])
      })

      await userStorage.removeFile(toBasePath(f111.path))

      // basePathRoot
      // ├d1
      // │└d11
      // └f1.txt
      expect(appStorage.getAllNodes()).toEqual([...basePathNodes, d1, d11, f1])

      const exp = td.explain(userStorage.removeFileAPI.value)
      expect(exp.calls[0].args[0]).toEqual(f111.path)
    })
  })

  describe('moveDir', () => {
    it('ベーシックケース', async () => {
      // basePathRoot
      // ├d1
      // │└d11 ← d2へ移動
      // │  └f111.txt
      // └d2
      const d1 = newStorageDirNode(`${basePath}/d1`)
      const d11 = newStorageDirNode(`${basePath}/d1/d11`)
      const f111 = newStorageFileNode(`${basePath}/d1/d11/f111.txt`)
      const d2 = newStorageDirNode(`${basePath}/d2`)
      const {
        services: { userStorage, appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([...basePathNodes, d1, d11, f111, d2])
      })

      // モック設定
      const moved_d11 = cloneStorageNode(d11, { dir: `${basePath}/d2`, path: `${basePath}/d2/d11`, updatedAt: dayjs() })
      const moved_f111 = cloneStorageNode(f111, { dir: `${basePath}/d2/d11`, path: `${basePath}/d2/d11/f111.txt` })
      td.when(userStorage.getNodesAPI({ ids: [moved_d11.id, moved_f111.id] })).thenResolve([moved_d11, moved_f111])

      // 'd1/d11'を'd2'へ移動
      const actual = await userStorage.moveDir(toBasePath(d11.path), toBasePath(moved_d11.path))

      // basePathRoot
      // ├d1
      // └d2
      //   └d11
      //     └f111.txt
      expect(actual.length).toBe(2)
      expect(actual[0]).toEqual(toBasePathNode(moved_d11))
      expect(actual[1]).toEqual(toBasePathNode(moved_f111))
      expect(appStorage.getAllNodes()).toEqual([...basePathNodes, d1, d2, moved_d11, moved_f111])

      const exp = td.explain(userStorage.moveDirAPI.value)
      expect(exp.calls[0].args).toEqual([d11.path, moved_d11.path])
    })

    it('移動先ディレクトリが読み込まれていない場合', async () => {
      // basePathRoot
      // ├d1
      // │└d11 ← d2へ移動
      // │  └f111.txt
      // └d2 ← 読み込まれていないのでストアには存在しない
      const d1 = newStorageDirNode(`${basePath}/d1`)
      const d11 = newStorageDirNode(`${basePath}/d1/d11`)
      const f111 = newStorageFileNode(`${basePath}/d1/d11/f111.txt`)
      const d2 = newStorageDirNode(`${basePath}/d2`)
      const {
        services: { userStorage, appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([...basePathNodes, d1, d11, f111])
      })

      // モック設定
      const moved_d11 = cloneStorageNode(d11, { dir: `${basePath}/d2`, path: `${basePath}/d2/d11`, updatedAt: dayjs() })
      const moved_f111 = cloneStorageNode(f111, { dir: `${basePath}/d2/d11`, path: `${basePath}/d2/d11/f111.txt` })
      td.when(userStorage.getHierarchicalNodesAPI(d2.path)).thenResolve([...basePathNodes, d2])
      td.when(userStorage.getNodesAPI({ ids: [moved_d11.id, moved_f111.id] })).thenResolve([moved_d11, moved_f111])

      // 'd1/d11'を'd2'へ移動
      const actual = await userStorage.moveDir(toBasePath(d11.path), toBasePath(moved_d11.path))

      // basePathRoot
      // ├d1
      // └d2 ← 読み込まれたのでストアに存在する
      //   └d11
      //     └f111.txt
      expect(actual.length).toBe(2)
      expect(actual[0]).toEqual(toBasePathNode(moved_d11))
      expect(actual[1]).toEqual(toBasePathNode(moved_f111))
      expect(appStorage.getAllNodes()).toEqual([...basePathNodes, d1, d2, moved_d11, moved_f111])

      const exp = td.explain(userStorage.moveDirAPI.value)
      expect(exp.calls[0].args).toEqual([d11.path, moved_d11.path])
    })
  })

  describe('moveFile', () => {
    it('ベーシックケース', async () => {
      // basePathRoot
      // └d1
      //   ├d11
      //   │└f111.txt ← d12へ移動
      //   └d12
      const d1 = newStorageDirNode(`${basePath}/d1`)
      const d11 = newStorageDirNode(`${basePath}/d1/d11`)
      const f111 = newStorageFileNode(`${basePath}/d1/d11/f111.txt`)
      const d12 = newStorageDirNode(`${basePath}/d1/d12`)
      const {
        services: { userStorage, appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([...basePathNodes, d1, d11, f111, d12])
      })

      // モック設定
      const moved_f111 = cloneStorageNode(f111, { dir: `${basePath}/d1/d12`, path: `${basePath}/d1/d12/f111.txt`, updatedAt: dayjs() })
      td.when(userStorage.moveFileAPI(f111.path, moved_f111.path)).thenResolve(moved_f111)

      // 'd1/d11/f111.txt'を'd1/d12/f111.txt'へ移動
      const actual = await userStorage.moveFile(toBasePath(f111.path), toBasePath(moved_f111.path))

      // basePathRoot
      // └d1
      //   ├d11
      //   └d12
      //     └f111.txt
      expect(actual).toEqual(toBasePathNode(moved_f111))
      expect(appStorage.getAllNodes()).toEqual([...basePathNodes, d1, d11, d12, moved_f111])
    })
  })

  describe('renameDir', () => {
    it('ベーシックケース', async () => {
      // basePathRoot
      // └d1
      //   └d11 ← x11へリネーム
      //     └f111.txt
      const d1 = newStorageDirNode(`${basePath}/d1`)
      const d11 = newStorageDirNode(`${basePath}/d1/d11`)
      const f111 = newStorageFileNode(`${basePath}/d1/d11/f111.txt`)
      const {
        services: { userStorage, appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([...basePathNodes, d1, d11, f111])
      })

      // モック設定
      const renamed_x11 = cloneStorageNode(d11, { name: `${basePath}/x11`, path: `${basePath}/d1/x11`, updatedAt: dayjs() })
      const renamed_f111 = cloneStorageNode(f111, { dir: `${basePath}/d1/x11`, path: `${basePath}/d1/x11/f111.txt` })
      td.when(userStorage.getNodesAPI({ ids: [renamed_x11.id, renamed_f111.id] })).thenResolve([renamed_x11, renamed_f111])

      // 'd1/d11'を'd1/x11'へリネーム
      const actual = await userStorage.renameDir(toBasePath(d11.path), renamed_x11.name)

      // basePathRoot
      // └d1
      //   └x11
      //     └f111.txt
      expect(actual.length).toBe(2)
      expect(actual[0]).toEqual(toBasePathNode(renamed_x11))
      expect(actual[1]).toEqual(toBasePathNode(renamed_f111))
      expect(appStorage.getAllNodes()).toEqual([...basePathNodes, d1, renamed_x11, renamed_f111])

      const exp = td.explain(userStorage.renameDirAPI.value)
      expect(exp.calls[0].args).toEqual([d11.path, renamed_x11.name])
    })
  })

  describe('renameFile', () => {
    it('ベーシックケース', async () => {
      // basePathRoot
      // └d1
      //   └d11
      //     └f111.txt ← f11X.txtへリネーム
      const d1 = newStorageDirNode(`${basePath}/d1`)
      const d11 = newStorageDirNode(`${basePath}/d1/d11`)
      const f111 = newStorageFileNode(`${basePath}/d1/d11/f111.txt`)
      const {
        services: { userStorage, appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([...basePathNodes, d1, d11, f111])
      })

      // モック設定
      const renamed_f11X = cloneStorageNode(f111, { name: `${basePath}/f11X.txt`, path: `${basePath}/d1/d11/f11X.txt`, updatedAt: dayjs() })
      td.when(userStorage.renameFileAPI(f111.path, renamed_f11X.name)).thenResolve(renamed_f11X)

      // 'd1/d11/f111.txt'を'd1/d11/f11X.txt'へリネーム
      const actual = await userStorage.renameFile(toBasePath(f111.path), renamed_f11X.name)

      // basePathRoot
      // └d1
      //   └d11
      //     └f11X.txt
      expect(actual).toEqual(toBasePathNode(renamed_f11X))
      expect(appStorage.getAllNodes()).toEqual([...basePathNodes, d1, d11, renamed_f11X])
    })
  })

  describe('setDirShareSettings', () => {
    const NewShareSettings: StorageNodeShareSettings = {
      isPublic: true,
      readUIds: ['ichiro'],
      writeUIds: ['ichiro'],
    }

    it('ベーシックケース', async () => {
      const d1 = newStorageDirNode(`${basePath}/d1`)
      const d11 = newStorageDirNode(`${basePath}/d1/d11`)
      const f111 = newStorageFileNode(`${basePath}/d1/d11/f111.txt`)
      const {
        services: { userStorage, appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([...basePathNodes, d1, d11, f111])
      })

      const updated_d11 = cloneStorageNode(d11, { share: NewShareSettings, updatedAt: dayjs() })
      td.when(userStorage.setDirShareSettingsAPI(d11.path, NewShareSettings)).thenResolve(updated_d11)

      const actual = await userStorage.setDirShareSettings(toBasePath(d11.path), NewShareSettings)

      expect(actual).toEqual(toBasePathNode(updated_d11))
      expect(appStorage.getAllNodes()).toEqual([...basePathNodes, d1, updated_d11, f111])
    })
  })

  describe('setFileShareSettings', () => {
    const NewShareSettings: StorageNodeShareSettings = {
      isPublic: true,
      readUIds: ['ichiro'],
      writeUIds: ['ichiro'],
    }

    it('ベーシックケース', async () => {
      const d1 = newStorageDirNode(`${basePath}/d1`)
      const d11 = newStorageDirNode(`${basePath}/d1/d11`)
      const f111 = newStorageFileNode(`${basePath}/d1/d11/f111.txt`)
      const {
        services: { userStorage, appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([...basePathNodes, d1, d11, f111])
      })

      const updatedFileA = cloneStorageNode(f111, { share: NewShareSettings, updatedAt: dayjs() })
      td.when(userStorage.setFileShareSettingsAPI(f111.path, NewShareSettings)).thenResolve(updatedFileA)

      const actual = await userStorage.setFileShareSettings(toBasePath(f111.path), NewShareSettings)

      expect(actual).toEqual(toBasePathNode(updatedFileA))
      expect(appStorage.getAllNodes()).toEqual([...basePathNodes, d1, d11, updatedFileA])
    })
  })

  describe('handleUploadedFile', () => {
    it('ベーシックケース', async () => {
      const d1 = newStorageDirNode(`${basePath}/d1`)
      const f11 = newStorageFileNode(`${basePath}/d1/f11.txt`)
      const {
        services: { userStorage, appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([...basePathNodes, d1, f11])
      })

      // モック設定
      td.when(userStorage.handleUploadedFileAPI({ id: f11.id, path: f11.path })).thenResolve(f11)

      // テスト対象実行
      const actual = await userStorage.handleUploadedFile({ id: f11.id, path: toBasePath(f11.path) })

      expect(actual).toEqual(toBasePathNode(f11))
      expect(appStorage.getAllNodes()).toEqual([...basePathNodes, d1, f11])
    })
  })

  describe('setFileAccessAuthClaims', () => {
    it('ベーシックケース', async () => {
      // Firebaseのモック設定
      const authFunc = td.replace(require('firebase/app'), 'auth')
      const authObject = td.object<firebase.auth.Auth>()
      td.when(authFunc()).thenReturn<firebase.auth.Auth>(authObject)

      const d1 = newStorageDirNode(`${basePath}/d1`)
      const f11 = newStorageFileNode(`${basePath}/d1/f11.txt`)
      const {
        services: { userStorage, appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([...basePathNodes, d1, f11])
      })

      // モック設定
      td.when(userStorage.setFileAccessAuthClaimsAPI({ id: f11.id, path: f11.path })).thenResolve('xxx')

      // テスト対象実行
      await userStorage.setFileAccessAuthClaims({ id: f11.id, path: toBasePath(f11.path) })

      const exp = td.explain(authObject.signInWithCustomToken)
      expect(exp.calls.length).toBe(1)
      expect(exp.calls[0].args).toEqual(['xxx'])
    })
  })

  describe('removeFileAccessAuthClaims', () => {
    it('ベーシックケース', async () => {
      // Firebaseのモック設定
      const authFunc = td.replace(require('firebase/app'), 'auth')
      const authObject = td.object<firebase.auth.Auth>()
      td.when(authFunc()).thenReturn<firebase.auth.Auth>(authObject)

      const d1 = newStorageDirNode(`${basePath}/d1`)
      const f11 = newStorageFileNode(`${basePath}/d1/f11.txt`)
      const {
        services: { userStorage, appStorage },
      } = provideDependency(({ stores }) => {
        stores.storage.setAll([...basePathNodes, d1, f11])
      })

      // モック設定
      td.when(userStorage.removeFileAccessAuthClaimsAPI()).thenResolve('xxx')

      // テスト対象実行
      await userStorage.removeFileAccessAuthClaims()

      const exp = td.explain(authObject.signInWithCustomToken)
      expect(exp.calls.length).toBe(1)
      expect(exp.calls[0].args).toEqual(['xxx'])
    })
  })
})
