import {
  GENERAL_TOKEN,
  TestUserStorageLogic,
  cloneTestStorageNode,
  mockStorageLogicAPIMethods,
  newTestStorageDirNode,
  newTestStorageFileNode,
  provideDependency,
} from '../../../../../helpers/app'
import { StorageNode, StorageNodeShareSettings } from '@/app/logic'
import _path from 'path'
import dayjs from 'dayjs'
import { splitHierarchicalPaths } from 'web-base-lib'
import { useConfig } from '@/app/config'

//========================================================================
//
//  Tests
//
//========================================================================

describe('AppStorageLogic', () => {
  let basePath: string
  let basePathRoot: StorageNode
  let basePathNodes: StorageNode[]
  let toBasePath: TestUserStorageLogic['toBasePath']
  let toBasePathNode: TestUserStorageLogic['toBasePathNode']
  let toFullPath: TestUserStorageLogic['toFullPath']

  beforeEach(async () => {
    provideDependency(({ logic }) => {
      // ベースパスをモック化
      const config = useConfig()
      basePath = _path.join(config.storage.user.rootName, GENERAL_TOKEN.uid)
      logic.userStorage.basePath.value = basePath
      // ベースパスノードの作成
      basePathNodes = []
      for (const dirPath of splitHierarchicalPaths(basePath)) {
        basePathNodes.push(newTestStorageDirNode(dirPath))
      }
      basePathRoot = basePathNodes[basePathNodes.length - 1]
      // ロジックのAPI系メソッドをモック化
      mockStorageLogicAPIMethods(logic)
      // ショートハンド用変数にメソッドを設定
      toBasePath = logic.userStorage.toBasePath
      toBasePathNode = logic.userStorage.toBasePathNode
      toFullPath = logic.userStorage.toFullPath
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
      const d1 = newTestStorageDirNode(`${basePath}/d1`)
      const d11 = newTestStorageDirNode(`${basePath}/d1/d11`)
      const f111 = newTestStorageFileNode(`${basePath}/d1/d11/f111.txt`)
      const d12 = newTestStorageDirNode(`${basePath}/d1/d12`)
      const d2 = newTestStorageDirNode(`${basePath}/d2`)
      const {
        logic: { userStorage },
      } = provideDependency(({ store }) => {
        store.storage.setAll([...basePathNodes, d1, d11, f111, d12, d2])
      })

      const actual = userStorage.getAllNodes()

      expect(actual.length).toBe(5)
      expect(actual).toEqual(toBasePathNode([d1, d11, f111, d12, d2]))
    })
  })

  describe('getNode', () => {
    it('ベーシックケース', () => {
      const d1 = newTestStorageDirNode(`${basePath}/d1`)
      const {
        logic: { userStorage },
      } = provideDependency(({ store }) => {
        store.storage.setAll([...basePathNodes, d1])
      })

      const actual = userStorage.getNode({ path: toBasePath(d1.path) })

      expect(actual).toEqual(toBasePathNode(d1))
    })
  })

  describe('sgetNode', () => {
    it('ベーシックケース - ノードIDで取得', () => {
      const d1 = newTestStorageDirNode(`${basePath}/d1`)
      const {
        logic: { userStorage },
      } = provideDependency(({ store }) => {
        store.storage.setAll([d1])
      })

      const actual = userStorage.sgetNode({ id: d1.id })

      expect(actual).toEqual(toBasePathNode(d1))
    })

    it('ベーシックケース - ノードパスで取得', () => {
      const d1 = newTestStorageDirNode(`${basePath}/d1`)
      const {
        logic: { userStorage },
      } = provideDependency(({ store }) => {
        store.storage.setAll([...basePathNodes, d1])
      })

      const actual = userStorage.sgetNode({ path: toBasePath(d1.path) })

      expect(actual).toEqual(toBasePathNode(d1))
    })
  })

  describe('getDirDescendants', () => {
    it('ベーシックケース', async () => {
      // basePathRoot
      // ├d1 ← 対象ノードに指定
      // │├d11
      // ││└f111.txt
      // │└d12
      // └d2
      const d1 = newTestStorageDirNode(`${basePath}/d1`)
      const d11 = newTestStorageDirNode(`${basePath}/d1/d11`)
      const f111 = newTestStorageFileNode(`${basePath}/d1/d11/f111.txt`)
      const d12 = newTestStorageDirNode(`${basePath}/d1/d12`)
      const d2 = newTestStorageDirNode(`${basePath}/d2`)
      const {
        logic: { userStorage },
      } = provideDependency(({ store }) => {
        store.storage.setAll([...basePathNodes, d1, d11, f111, d12, d2])
      })

      const actual = userStorage.getDirDescendants(toBasePath(d1.path))

      expect(actual).toEqual(toBasePathNode([d1, d11, f111, d12]))
    })

    it('対象ノードを指定しなかった場合', async () => {
      // basePathRoot
      // ├d1
      // │├d11
      // ││└f111.txt
      // │└d12
      // └d2
      const d1 = newTestStorageDirNode(`${basePath}/d1`)
      const d11 = newTestStorageDirNode(`${basePath}/d1/d11`)
      const f111 = newTestStorageFileNode(`${basePath}/d1/d11/f111.txt`)
      const d12 = newTestStorageDirNode(`${basePath}/d1/d12`)
      const d2 = newTestStorageDirNode(`${basePath}/d2`)
      const {
        logic: { userStorage },
      } = provideDependency(({ store }) => {
        store.storage.setAll([...basePathNodes, d1, d11, f111, d12, d2])
      })

      const actual = userStorage.getDirDescendants()

      expect(actual).toEqual(toBasePathNode([d1, d11, f111, d12, d2]))
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
      const d1 = newTestStorageDirNode(`${basePath}/d1`)
      const d11 = newTestStorageDirNode(`${basePath}/d1/d11`)
      const f111 = newTestStorageFileNode(`${basePath}/d1/d11/f111.txt`)
      const d12 = newTestStorageDirNode(`${basePath}/d1/d12`)
      const d2 = newTestStorageDirNode(`${basePath}/d2`)
      const {
        logic: { userStorage },
      } = provideDependency(({ store }) => {
        store.storage.setAll([...basePathNodes, d1, d11, f111, d12, d2])
      })

      const actual = userStorage.getDescendants(toBasePath(d1.path))

      expect(actual).toEqual(toBasePathNode([d11, f111, d12]))
    })

    it('対象ノードを指定しなかった場合', async () => {
      // basePathRoot
      // ├d1
      // │├d11
      // ││└f111.txt
      // │└d12
      // └d2
      const d1 = newTestStorageDirNode(`${basePath}/d1`)
      const d11 = newTestStorageDirNode(`${basePath}/d1/d11`)
      const f111 = newTestStorageFileNode(`${basePath}/d1/d11/f111.txt`)
      const d12 = newTestStorageDirNode(`${basePath}/d1/d12`)
      const d2 = newTestStorageDirNode(`${basePath}/d2`)
      const {
        logic: { userStorage },
      } = provideDependency(({ store }) => {
        store.storage.setAll([...basePathNodes, d1, d11, f111, d12, d2])
      })

      const actual = userStorage.getDescendants()

      expect(actual).toEqual(toBasePathNode([d1, d11, f111, d12, d2]))
    })
  })

  describe('getDirChildren', () => {
    it('ベーシックケース', async () => {
      // basePathRoot
      // ├d1 ← 対象ノードに指定
      // │├d11
      // ││└f111.txt
      // │└d12
      // └d2
      const d1 = newTestStorageDirNode(`${basePath}/d1`)
      const d11 = newTestStorageDirNode(`${basePath}/d1/d11`)
      const f111 = newTestStorageFileNode(`${basePath}/d1/d11/f111.txt`)
      const d12 = newTestStorageDirNode(`${basePath}/d1/d12`)
      const d2 = newTestStorageDirNode(`${basePath}/d2`)
      const {
        logic: { userStorage },
      } = provideDependency(({ store }) => {
        store.storage.setAll([...basePathNodes, d1, d11, f111, d12, d2])
      })

      const actual = userStorage.getDirChildren(toBasePath(d1.path))

      expect(actual).toEqual(toBasePathNode([d1, d11, d12]))
    })

    it('対象ノードを指定しなかった場合', async () => {
      // basePathRoot
      // ├d1
      // │├d11
      // ││└f111.txt
      // │└d12
      // └d2
      const d1 = newTestStorageDirNode(`${basePath}/d1`)
      const d11 = newTestStorageDirNode(`${basePath}/d1/d11`)
      const f111 = newTestStorageFileNode(`${basePath}/d1/d11/f111.txt`)
      const d12 = newTestStorageDirNode(`${basePath}/d1/d12`)
      const d2 = newTestStorageDirNode(`${basePath}/d2`)
      const {
        logic: { userStorage },
      } = provideDependency(({ store }) => {
        store.storage.setAll([...basePathNodes, d1, d11, f111, d12, d2])
      })

      const actual = userStorage.getDirChildren()

      expect(actual).toEqual(toBasePathNode([d1, d2]))
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
      const d1 = newTestStorageDirNode(`${basePath}/d1`)
      const d11 = newTestStorageDirNode(`${basePath}/d1/d11`)
      const f111 = newTestStorageFileNode(`${basePath}/d1/d11/f111.txt`)
      const d12 = newTestStorageDirNode(`${basePath}/d1/d12`)
      const d2 = newTestStorageDirNode(`${basePath}/d2`)
      const {
        logic: { userStorage },
      } = provideDependency(({ store }) => {
        store.storage.setAll([...basePathNodes, d1, d11, f111, d12, d2])
      })

      const actual = userStorage.getChildren(toBasePath(d1.path))

      expect(actual).toEqual(toBasePathNode([d11, d12]))
    })

    it('対象ノードを指定しなかった場合', async () => {
      // basePathRoot
      // ├d1
      // │├d11
      // ││└f111.txt
      // │└d12
      // └d2
      const d1 = newTestStorageDirNode(`${basePath}/d1`)
      const d11 = newTestStorageDirNode(`${basePath}/d1/d11`)
      const f111 = newTestStorageFileNode(`${basePath}/d1/d11/f111.txt`)
      const d12 = newTestStorageDirNode(`${basePath}/d1/d12`)
      const d2 = newTestStorageDirNode(`${basePath}/d2`)
      const {
        logic: { userStorage },
      } = provideDependency(({ store }) => {
        store.storage.setAll([...basePathNodes, d1, d11, f111, d12, d2])
      })

      const actual = userStorage.getChildren()

      expect(actual).toEqual(toBasePathNode([d1, d2]))
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
      const d1 = newTestStorageDirNode(`${basePath}/d1`)
      const d11 = newTestStorageDirNode(`${basePath}/d1/d11`)
      const f111 = newTestStorageFileNode(`${basePath}/d1/d11/f111.txt`)
      const d12 = newTestStorageDirNode(`${basePath}/d1/d12`)
      const d2 = newTestStorageDirNode(`${basePath}/d2`)
      const {
        logic: { userStorage },
      } = provideDependency(({ store }) => {
        store.storage.setAll([...basePathNodes, d1, d11, f111, d12, d2])
      })

      const actual = userStorage.getHierarchicalNodes(toBasePath(f111.path))

      expect(actual).toEqual(toBasePathNode([d1, d11, f111]))
    })

    it('対象ノードに空文字を指定した場合', async () => {
      const {
        logic: { userStorage },
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
      const d1 = newTestStorageDirNode(`${basePath}/d1`)
      const d11 = newTestStorageDirNode(`${basePath}/d1/d11`)
      const f111 = newTestStorageFileNode(`${basePath}/d1/d11/f111.txt`, {
        share: {
          isPublic: true,
          readUIds: ['saburo'],
          writeUIds: ['saburo'],
        },
      })
      const {
        logic: { userStorage },
      } = provideDependency(({ store }) => {
        store.storage.setAll([...basePathNodes, d1, d11, f111])
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
        logic: { userStorage },
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

  describe('fetchHierarchicalNodes', () => {
    it('ベーシックケース', async () => {
      // basePathRoot
      // └dA
      //   └[dB]
      //     └[dC]
      //       └[fileC.txt] ← 対象ノードに指定
      const dA = newTestStorageDirNode(`${basePath}/dA`)
      const dB = newTestStorageDirNode(`${basePath}/dA/dB`)
      const dC = newTestStorageDirNode(`${basePath}/dA/dB/dC`)
      const fileC = newTestStorageDirNode(`${basePath}/dA/dB/dC/fileC.txt`)
      const {
        logic: { userStorage, appStorage },
      } = provideDependency(({ store }) => {
        store.storage.setAll([...basePathNodes, dA])
      })

      td.when(userStorage.getHierarchicalNodesAPI(fileC.path)).thenResolve([...basePathNodes, dA, dB, dC, fileC])

      const actual = await userStorage.fetchHierarchicalNodes(toBasePath(fileC.path))

      // basePathRoot
      // └dA
      //   └dB
      //     └dC
      //       └fileC.txt
      expect(actual).toEqual(toBasePathNode([dA, dB, dC, fileC]))
      expect(appStorage.getAllNodes()).toEqual([...basePathNodes, dA, dB, dC, fileC])
    })

    it('ベースパスルートを指定した場合', async () => {
      const {
        logic: { userStorage, appStorage },
      } = provideDependency(({ store }) => {
        store.storage.setAll([...basePathNodes])
      })

      td.when(userStorage.getHierarchicalNodesAPI(basePath)).thenResolve([...basePathNodes])

      const actual = await userStorage.fetchHierarchicalNodes(``)

      expect(actual).toEqual(toBasePathNode([]))
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
      const dA = newTestStorageDirNode(`${basePath}/dA`)
      const dB = newTestStorageDirNode(`${basePath}/dA/dB`)
      const dC = newTestStorageDirNode(`${basePath}/dA/dB/dC`)
      const {
        logic: { userStorage, appStorage },
      } = provideDependency(({ store }) => {
        store.storage.setAll([...basePathNodes, dA])
      })

      td.when(userStorage.getAncestorDirsAPI(toFullPath(`dA/dB/dC/fileC.txt`))).thenResolve([...basePathNodes, dA, dB, dC])

      const actual = await userStorage.fetchAncestorDirs(`dA/dB/dC/fileC.txt`)

      // basePathRoot
      // └dA
      //   └dB
      //     └dC
      expect(actual).toEqual(toBasePathNode([dA, dB, dC]))
      expect(appStorage.getAllNodes()).toEqual([...basePathNodes, dA, dB, dC])
    })

    it('ベースパスルートを指定した場合', async () => {
      // [basePathRoot] ← 対象ノードに指定
      // └[dA]
      const {
        logic: { userStorage, appStorage },
      } = provideDependency()

      const basePathAncestors = basePathNodes.filter(node => node.path != basePath)
      td.when(userStorage.getAncestorDirsAPI(basePath)).thenResolve([...basePathAncestors])

      const actual = await userStorage.fetchAncestorDirs(``)

      // basePathRoot
      // └dA
      expect(actual).toEqual(toBasePathNode([]))
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
      const d1 = newTestStorageDirNode(`${basePath}/d1`)
      const d11 = newTestStorageDirNode(`${basePath}/d1/d11`)
      const f111 = newTestStorageFileNode(`${basePath}/d1/d11/f111.txt`)
      const d12 = newTestStorageDirNode(`${basePath}/d1/d12`)
      const d2 = newTestStorageDirNode(`${basePath}/d2`)
      const {
        logic: { userStorage, appStorage },
      } = provideDependency(({ store }) => {
        store.storage.setAll([...basePathNodes, d2])
      })

      td.when(userStorage.getDirDescendantsAPI(d1.path)).thenResolve([d1, d11, f111, d12])

      const actual = await userStorage.fetchDirDescendants(toBasePath(d1.path))

      // basePathRoot
      // ├d1
      // │├d11
      // ││└f112.txt
      // │└d12
      // └d2
      expect(actual).toEqual(toBasePathNode([d1, d11, f111, d12]))
      expect(appStorage.getAllNodes()).toEqual([...basePathNodes, d1, d11, f111, d12, d2])
    })

    it('ベースパスルートを指定した場合', async () => {
      // [basePathRoot] ← 対象ノードに指定
      // └[d1]
      //   ├[d11]
      //   │└[f111.txt]
      //   └[d12]
      const d1 = newTestStorageDirNode(`${basePath}/d1`)
      const d11 = newTestStorageDirNode(`${basePath}/d1/d11`)
      const f111 = newTestStorageFileNode(`${basePath}/d1/d11/f111.txt`)
      const d12 = newTestStorageDirNode(`${basePath}/d1/d12`)
      const {
        logic: { userStorage, appStorage },
      } = provideDependency()

      // ベースパスルートを指定してAPIリクエストするので、ベースパスルートを含んだノードリストが取得される
      td.when(userStorage.getDirDescendantsAPI(basePath)).thenResolve([...basePathNodes, d1, d11, f111, d12])

      const actual = await userStorage.fetchDirDescendants()

      // basePathRoot
      // └d1
      //   ├d11
      //   │└f111.txt
      //   └d12
      // 戻り値にはベースパスルートが含まれないことに注意
      expect(actual).toEqual(toBasePathNode([d1, d11, f111, d12]))
      expect(appStorage.getAllNodes()).toEqual([...basePathNodes, d1, d11, f111, d12])
    })
  })

  describe('fetchDescendants', () => {
    it('ベーシックケース', async () => {
      // basePathRoot
      // ├d1 ← 対象ノードに指定
      // │├[d11]
      // ││└[f111.txt]
      // │└[d12]
      // └d2
      const d1 = newTestStorageDirNode(`${basePath}/d1`)
      const d11 = newTestStorageDirNode(`${basePath}/d1/d11`)
      const f111 = newTestStorageFileNode(`${basePath}/d1/d11/f111.txt`)
      const d12 = newTestStorageDirNode(`${basePath}/d1/d12`)
      const d2 = newTestStorageDirNode(`${basePath}/d2`)
      const {
        logic: { userStorage, appStorage },
      } = provideDependency(({ store }) => {
        store.storage.setAll([...basePathNodes, d1, d2])
      })

      td.when(userStorage.getDescendantsAPI(d1.path)).thenResolve([d11, f111, d12])

      const actual = await userStorage.fetchDescendants(toBasePath(d1.path))

      // basePathRoot
      // ├d1
      // │├d11
      // ││└f112.txt
      // │└d12
      // └d2
      expect(actual).toEqual(toBasePathNode([d11, f111, d12]))
      expect(appStorage.getAllNodes()).toEqual([...basePathNodes, d1, d11, f111, d12, d2])
    })

    it('ベースパスルートを指定した場合', async () => {
      // basePathRoot ← 対象ノードに指定
      // └[d1]
      //   ├[d11]
      //   │└[f111.txt]
      //   └[d12]
      const d1 = newTestStorageDirNode(`${basePath}/d1`)
      const d11 = newTestStorageDirNode(`${basePath}/d1/d11`)
      const f111 = newTestStorageFileNode(`${basePath}/d1/d11/f111.txt`)
      const d12 = newTestStorageDirNode(`${basePath}/d1/d12`)
      const {
        logic: { userStorage, appStorage },
      } = provideDependency(({ store }) => {
        store.storage.setAll([...basePathNodes])
      })

      td.when(userStorage.getDescendantsAPI(basePath)).thenResolve([d1, d11, f111, d12])

      const actual = await userStorage.fetchDescendants()

      // basePathRoot
      // └d1
      //   ├d11
      //   │└f111.txt
      //   └d12
      expect(actual).toEqual(toBasePathNode([d1, d11, f111, d12]))
      expect(appStorage.getAllNodes()).toEqual([...basePathNodes, d1, d11, f111, d12])
    })
  })

  describe('fetchDirChildren', () => {
    it('ベーシックケース', async () => {
      // basePathRoot
      // ├[d1] ← 対象ノードに指定
      // │├[d11]
      // │└[d12]
      // └d2
      const d1 = newTestStorageDirNode(`${basePath}/d1`)
      const d11 = newTestStorageDirNode(`${basePath}/d1/d11`)
      const d12 = newTestStorageDirNode(`${basePath}/d1/d12`)
      const d2 = newTestStorageDirNode(`${basePath}/d2`)
      const {
        logic: { userStorage, appStorage },
      } = provideDependency(({ store }) => {
        store.storage.setAll([...basePathNodes, d2])
      })

      td.when(userStorage.getDirChildrenAPI(d1.path)).thenResolve([d1, d11, d12])

      const actual = await userStorage.fetchDirChildren(toBasePath(d1.path))

      // basePathRoot
      // ├d1
      // │├d11
      // │└d12
      // └d2
      expect(actual).toEqual(toBasePathNode([d1, d11, d12]))
      expect(appStorage.getAllNodes()).toEqual([...basePathNodes, d1, d11, d12, d2])
    })

    it('ベースパスルートを指定した場合', async () => {
      // [basePathRoot] ← 対象ノードに指定
      // ├[d1]
      // └[d2]
      const d1 = newTestStorageDirNode(`${basePath}/d1`)
      const d2 = newTestStorageDirNode(`${basePath}/d2`)
      const {
        logic: { userStorage, appStorage },
      } = provideDependency()

      // ベースパスルートを指定してAPIリクエストするので、ベースパスルートを含んだノードリストが取得される
      td.when(userStorage.getDirChildrenAPI(basePath)).thenResolve([...basePathNodes, d1, d2])

      const actual = await userStorage.fetchDirChildren()

      // basePathRoot ← 対象ノードに指定
      // ├d1
      // └d2
      // 戻り値にはベースパスルートが含まれないことに注意
      expect(actual).toEqual(toBasePathNode([d1, d2]))
      expect(appStorage.getAllNodes()).toEqual([...basePathNodes, d1, d2])
    })
  })

  describe('fetchChildren', () => {
    it('ベーシックケース', async () => {
      // basePathRoot
      // ├[d1] ← 対象ノードに指定
      // │├[d11]
      // │└[d12]
      // └d2
      const d1 = newTestStorageDirNode(`${basePath}/d1`)
      const d11 = newTestStorageDirNode(`${basePath}/d1/d11`)
      const d12 = newTestStorageDirNode(`${basePath}/d1/d12`)
      const d2 = newTestStorageDirNode(`${basePath}/d2`)
      const {
        logic: { userStorage, appStorage },
      } = provideDependency(({ store }) => {
        store.storage.setAll([...basePathNodes, d1, d2])
      })

      td.when(userStorage.getChildrenAPI(d1.path)).thenResolve([d11, d12])

      const actual = await userStorage.fetchChildren(toBasePath(d1.path))

      // basePathRoot
      // ├d1
      // │├d11
      // │└d12
      // └d2
      expect(actual).toEqual(toBasePathNode([d11, d12]))
      expect(appStorage.getAllNodes()).toEqual([...basePathNodes, d1, d11, d12, d2])
    })

    it('ベースパスルートを指定した場合', async () => {
      // basePathRoot ← 対象ノードに指定
      // ├[d1]
      // └[d2]
      const d1 = newTestStorageDirNode(`${basePath}/d1`)
      const d2 = newTestStorageDirNode(`${basePath}/d2`)
      const {
        logic: { userStorage, appStorage },
      } = provideDependency(({ store }) => {
        store.storage.setAll([...basePathNodes])
      })

      td.when(userStorage.getChildrenAPI(basePath)).thenResolve([d1, d2])

      const actual = await userStorage.fetchChildren()

      // 戻り値にはベースパスルートが含まれないことに注意
      expect(actual).toEqual(toBasePathNode([d1, d2]))
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
      const d1 = newTestStorageDirNode(`${basePath}/d1`)
      const d11 = newTestStorageDirNode(`${basePath}/d1/d11`)
      const d111 = newTestStorageDirNode(`${basePath}/d1/d11/d111`)
      const f1111 = newTestStorageFileNode(`${basePath}/d1/d11/d111/f1111.txt`)
      const f111 = newTestStorageFileNode(`${basePath}/d1/d11/f111.txt`)
      const {
        logic: { userStorage, appStorage },
      } = provideDependency()

      td.when(userStorage.getHierarchicalNodesAPI(d11.path)).thenResolve([...basePathNodes, d1, d11])
      td.when(userStorage.getDescendantsAPI(d11.path)).thenResolve([d111, f1111, f111])

      const actual = await userStorage.fetchHierarchicalDescendants(toBasePath(d11.path))

      // basePathRoot
      // └d1
      //   └d11
      //     ├d111
      //     │└f1111.txt
      //     └f111.txt
      // 戻り値にはベースパスルートが含まれないことに注意
      expect(actual).toEqual(toBasePathNode([d1, d11, d111, f1111, f111]))
      expect(appStorage.getAllNodes()).toEqual([...basePathNodes, d1, d11, d111, f1111, f111])
    })

    it('ベースパスルートを指定した場合', async () => {
      // [basePathRoot] ← 対象ノードに指定
      // └[d1]
      //   └[d11]
      //     ├[d111]
      //     │└[f1111.txt]
      //     └[f111.txt]
      const d1 = newTestStorageDirNode(`${basePath}/d1`)
      const d11 = newTestStorageDirNode(`${basePath}/d1/d11`)
      const d111 = newTestStorageDirNode(`${basePath}/d1/d11/d111`)
      const f1111 = newTestStorageFileNode(`${basePath}/d1/d11/d111/f1111.txt`)
      const f111 = newTestStorageFileNode(`${basePath}/d1/d11/f111.txt`)
      const {
        logic: { userStorage, appStorage },
      } = provideDependency()

      // ベースパスルートを指定してAPIリクエストするので、ベースパスルートを含んだノードリストが取得される
      td.when(userStorage.getDirDescendantsAPI(basePath)).thenResolve([...basePathNodes, d1, d11, d111, f1111, f111])

      const actual = await userStorage.fetchHierarchicalDescendants()

      // basePathRoot
      // └d1
      //   └d11
      //     ├d111
      //     │└f1111.txt
      //     └f111.txt
      // 戻り値にはベースパスルートが含まれないことに注意
      expect(actual).toEqual(toBasePathNode([d1, d11, d111, f1111, f111]))
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
      const d1 = newTestStorageDirNode(`${basePath}/d1`)
      const d11 = newTestStorageDirNode(`${basePath}/d1/d11`)
      const d111 = newTestStorageDirNode(`${basePath}/d1/d11/d111`)
      const f111 = newTestStorageFileNode(`${basePath}/d1/d11/f111.txt`)
      const {
        logic: { userStorage, appStorage },
      } = provideDependency()

      td.when(userStorage.getHierarchicalNodesAPI(d11.path)).thenResolve([...basePathNodes, d1, d11])
      td.when(userStorage.getChildrenAPI(d11.path)).thenResolve([d111, f111])

      const actual = await userStorage.fetchHierarchicalChildren(toBasePath(d11.path))

      // basePathRoot
      // └d1
      //   └d11
      //     ├d111
      //     └f111.txt
      // 戻り値にはベースパスルートが含まれないことに注意
      expect(actual).toEqual(toBasePathNode([d1, d11, d111, f111]))
      expect(appStorage.getAllNodes()).toEqual([...basePathNodes, d1, d11, d111, f111])
    })

    it('バケットルートを指定した 場合', async () => {
      // [basePathRoot] ← 対象ノードに指定
      // └[d1]
      //   └[d11]
      //     ├[d111]
      //     └[f111.txt]
      const d1 = newTestStorageDirNode(`${basePath}/d1`)
      const d11 = newTestStorageDirNode(`${basePath}/d1/d11`)
      const d111 = newTestStorageDirNode(`${basePath}/d1/d11/d111`)
      const f111 = newTestStorageFileNode(`${basePath}/d1/d11/f111.txt`)
      const {
        logic: { userStorage, appStorage },
      } = provideDependency()

      td.when(userStorage.getDirChildrenAPI(basePath)).thenResolve([...basePathNodes, d1, d11, d111, f111])

      const actual = await userStorage.fetchHierarchicalChildren()

      // basePathRoot
      // └d1
      //   └d11
      //     ├d111
      //     └f111.txt
      // 戻り値にはベースパスルートが含まれないことに注意
      expect(actual).toEqual(toBasePathNode([d1, d11, d111, f111]))
      expect(appStorage.getAllNodes()).toEqual([...basePathNodes, d1, d11, d111, f111])
    })
  })

  describe('createDir', () => {
    it('ベーシックケース', async () => {
      // basePathRoot
      // └d1
      //   └[d11] ← 作成
      const d1 = newTestStorageDirNode(`${basePath}/d1`)
      const d11 = newTestStorageDirNode(`${basePath}/d1/d11`)
      const {
        logic: { userStorage, appStorage },
      } = provideDependency(({ store }) => {
        store.storage.setAll([...basePathNodes, d1])
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
      const d1 = newTestStorageDirNode(`${basePath}/d1`)
      const d11 = newTestStorageDirNode(`${basePath}/d1/d11`)
      const d111 = newTestStorageDirNode(`${basePath}/d1/d11/d111`)
      const d12 = newTestStorageDirNode(`${basePath}/d1/d12`)
      const {
        logic: { userStorage, appStorage },
      } = provideDependency()

      td.when(userStorage.createHierarchicalDirsAPI([d111.path, d12.path])).thenResolve([...basePathNodes, d1, d11, d111, d12])

      const actual = await userStorage.createHierarchicalDirs(toBasePath([d111.path, d12.path]))

      // basePathRoot ← 上位ノードも作成される
      // └d1 ← 上位ノードも作成される
      //   ├d11 ← 上位ノードも作成される
      //   │└d111
      //   └d12
      expect(actual).toEqual(toBasePathNode([d1, d11, d111, d12]))
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
      const d1 = newTestStorageDirNode(`${basePath}/d1`)
      const d11 = newTestStorageDirNode(`${basePath}/d1/d11`)
      const f111 = newTestStorageFileNode(`${basePath}/d1/d11/f111.txt`)
      const d12 = newTestStorageDirNode(`${basePath}/d1/d12`)
      const {
        logic: { userStorage, appStorage },
      } = provideDependency(({ store }) => {
        store.storage.setAll([...basePathNodes, d1, d11, f111, d12])
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
      const d1 = newTestStorageDirNode(`${basePath}/d1`)
      const d11 = newTestStorageDirNode(`${basePath}/d1/d11`)
      const f111 = newTestStorageFileNode(`${basePath}/d1/d11/f111.txt`)
      const f1 = newTestStorageFileNode(`${basePath}/f1.txt`)
      const {
        logic: { userStorage, appStorage },
      } = provideDependency(({ store }) => {
        store.storage.setAll([...basePathNodes, d1, d11, f111, f1])
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
      const d1 = newTestStorageDirNode(`${basePath}/d1`)
      const d11 = newTestStorageDirNode(`${basePath}/d1/d11`)
      const f111 = newTestStorageFileNode(`${basePath}/d1/d11/f111.txt`)
      const d2 = newTestStorageDirNode(`${basePath}/d2`)
      const {
        logic: { userStorage, appStorage },
      } = provideDependency(({ store }) => {
        store.storage.setAll([...basePathNodes, d1, d11, f111, d2])
      })

      // モック設定
      const moved_d11 = cloneTestStorageNode(d11, { dir: `${basePath}/d2`, path: `${basePath}/d2/d11`, updatedAt: dayjs() })
      const moved_f111 = cloneTestStorageNode(f111, { dir: `${basePath}/d2/d11`, path: `${basePath}/d2/d11/f111.txt` })
      td.when(userStorage.moveDirAPI(d11.path, moved_d11.path)).thenResolve([moved_d11, moved_f111])

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
    })
  })

  describe('moveFile', () => {
    it('ベーシックケース', async () => {
      // basePathRoot
      // └d1
      //   ├d11
      //   │└f111.txt ← d12へ移動
      //   └d12
      const d1 = newTestStorageDirNode(`${basePath}/d1`)
      const d11 = newTestStorageDirNode(`${basePath}/d1/d11`)
      const f111 = newTestStorageFileNode(`${basePath}/d1/d11/f111.txt`)
      const d12 = newTestStorageDirNode(`${basePath}/d1/d12`)
      const {
        logic: { userStorage, appStorage },
      } = provideDependency(({ store }) => {
        store.storage.setAll([...basePathNodes, d1, d11, f111, d12])
      })

      // モック設定
      const moved_f111 = cloneTestStorageNode(f111, { dir: `${basePath}/d1/d12`, path: `${basePath}/d1/d12/f111.txt`, updatedAt: dayjs() })
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
      const d1 = newTestStorageDirNode(`${basePath}/d1`)
      const d11 = newTestStorageDirNode(`${basePath}/d1/d11`)
      const f111 = newTestStorageFileNode(`${basePath}/d1/d11/f111.txt`)
      const {
        logic: { userStorage, appStorage },
      } = provideDependency(({ store }) => {
        store.storage.setAll([...basePathNodes, d1, d11, f111])
      })

      // モック設定
      const renamed_x11 = cloneTestStorageNode(d11, { name: `${basePath}/x11`, path: `${basePath}/d1/x11`, updatedAt: dayjs() })
      const renamed_f111 = cloneTestStorageNode(f111, { dir: `${basePath}/d1/x11`, path: `${basePath}/d1/x11/f111.txt` })
      td.when(userStorage.renameDirAPI(d11.path, renamed_x11.name)).thenResolve([renamed_x11, renamed_f111])

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
    })
  })

  describe('renameFile', () => {
    it('ベーシックケース', async () => {
      // basePathRoot
      // └d1
      //   └d11
      //     └f111.txt ← f11X.txtへリネーム
      const d1 = newTestStorageDirNode(`${basePath}/d1`)
      const d11 = newTestStorageDirNode(`${basePath}/d1/d11`)
      const f111 = newTestStorageFileNode(`${basePath}/d1/d11/f111.txt`)
      const {
        logic: { userStorage, appStorage },
      } = provideDependency(({ store }) => {
        store.storage.setAll([...basePathNodes, d1, d11, f111])
      })

      // モック設定
      const renamed_f11X = cloneTestStorageNode(f111, { name: `${basePath}/f11X.txt`, path: `${basePath}/d1/d11/f11X.txt`, updatedAt: dayjs() })
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
    const NEW_SHARE_SETTINGS: StorageNodeShareSettings = {
      isPublic: true,
      readUIds: ['ichiro'],
      writeUIds: ['ichiro'],
    }

    it('ベーシックケース', async () => {
      const d1 = newTestStorageDirNode(`${basePath}/d1`)
      const d11 = newTestStorageDirNode(`${basePath}/d1/d11`)
      const f111 = newTestStorageFileNode(`${basePath}/d1/d11/f111.txt`)
      const {
        logic: { userStorage, appStorage },
      } = provideDependency(({ store }) => {
        store.storage.setAll([...basePathNodes, d1, d11, f111])
      })

      const updated_d11 = cloneTestStorageNode(d11, { share: NEW_SHARE_SETTINGS, updatedAt: dayjs() })
      td.when(userStorage.setDirShareSettingsAPI(d11.path, NEW_SHARE_SETTINGS)).thenResolve(updated_d11)

      const actual = await userStorage.setDirShareSettings(toBasePath(d11.path), NEW_SHARE_SETTINGS)

      expect(actual).toEqual(toBasePathNode(updated_d11))
      expect(appStorage.getAllNodes()).toEqual([...basePathNodes, d1, updated_d11, f111])
    })
  })

  describe('setFileShareSettings', () => {
    const NEW_SHARE_SETTINGS: StorageNodeShareSettings = {
      isPublic: true,
      readUIds: ['ichiro'],
      writeUIds: ['ichiro'],
    }

    it('ベーシックケース', async () => {
      const d1 = newTestStorageDirNode(`${basePath}/d1`)
      const d11 = newTestStorageDirNode(`${basePath}/d1/d11`)
      const f111 = newTestStorageFileNode(`${basePath}/d1/d11/f111.txt`)
      const {
        logic: { userStorage, appStorage },
      } = provideDependency(({ store }) => {
        store.storage.setAll([...basePathNodes, d1, d11, f111])
      })

      const updatedFileA = cloneTestStorageNode(f111, { share: NEW_SHARE_SETTINGS, updatedAt: dayjs() })
      td.when(userStorage.setFileShareSettingsAPI(f111.path, NEW_SHARE_SETTINGS)).thenResolve(updatedFileA)

      const actual = await userStorage.setFileShareSettings(toBasePath(f111.path), NEW_SHARE_SETTINGS)

      expect(actual).toEqual(toBasePathNode(updatedFileA))
      expect(appStorage.getAllNodes()).toEqual([...basePathNodes, d1, d11, updatedFileA])
    })
  })

  describe('fetchRoot', () => {
    it('ベーシックケース - 構成ノードが未読み込み(構成ノードは存在する)', async () => {
      const {
        logic: { userStorage, appStorage },
      } = provideDependency()

      // モック設定
      td.when(userStorage.getHierarchicalNodesAPI(basePath)).thenResolve([...basePathNodes])

      // テスト対象実行
      await userStorage.fetchRoot()

      expect(appStorage.getAllNodes()).toEqual([...basePathNodes])
    })

    it('ベーシックケース - 構成ノードが未読み込み(構成ノードが存在しない)', async () => {
      const {
        logic: { userStorage, appStorage },
      } = provideDependency()

      // モック設定
      td.when(userStorage.getHierarchicalNodesAPI(basePath)).thenResolve([])
      td.when(userStorage.createHierarchicalDirsAPI([basePath])).thenResolve([...basePathNodes])

      // テスト対象実行
      await userStorage.fetchRoot()

      expect(appStorage.getAllNodes()).toEqual([...basePathNodes])
    })
  })
})
