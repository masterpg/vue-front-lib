/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */

import { ArticleStorageService, StorageService } from '@/app/service/modules/storage'
import {
  CreateArticleTypeDirInput,
  StorageArticleDirType,
  StorageNode,
  StorageNodeShareSettings,
  StorageNodeType,
  StorageType,
  StorageUtil,
} from '@/app/service'
import { GeneralUser, NewTestStorageNodeData, TestServiceContainer, newStorageDirNode, newStorageFileNode } from '../../../../../helpers/app'
import { Ref, computed, ref } from '@vue/composition-api'
import { StoragePageService, StorageTreeNodeFilter } from '@/app/views/base/storage'
import { StorageTreeNodeData, StorageTreeNodeInput } from '@/app/views/base/storage/base'
import { TreeNode, TreeView, TreeViewImpl } from '@/app/components/tree-view'
import { AuthService } from '@/app/service/modules/auth'
import { StorageTreeNode } from '@/app/views/base/storage/storage-tree-node.vue'
import { UploadEndedEvent } from '@/app/components/storage'
import { VueRouter } from 'vue-router/types/router'
import dayjs from 'dayjs'
import { merge } from 'lodash'
import { mount } from '@vue/test-utils'
import { shuffleArray } from 'web-base-lib'
import { useConfig } from '@/app/config'
import { useI18n } from '@/app/i18n'

const { EmptyShareSettings } = StorageUtil

//========================================================================
//
//  Test interfaces
//
//=======================================================================

type RawStoragePageService = ReturnType<typeof StoragePageService['newRawInstance']>

type TestStorageTreeView = TreeViewImpl<StorageTreeNode, StorageTreeNodeData>

type NewTreeDirNodeInputData = NewTestStorageNodeData & Pick<StorageTreeNodeInput, 'opened' | 'lazyLoadStatus'>

type NewTreeFileNodeInputData = NewTestStorageNodeData

//========================================================================
//
//  Test helpers
//
//=======================================================================

/**
 * テスト用のストレージページサービスのインスタンスを生成します。
 * @param params
 */
function newStoragePageService(
  params: {
    storageType?: StorageType
    nodeFilter?: (node: StorageNode) => boolean
  } = {}
): { pageService: RawStoragePageService; treeView: TestStorageTreeView; storageService: StorageService } {
  // ストレージサービスをモック化
  const service = td.object<TestServiceContainer>()
  td.replace(require('@/app/service'), 'injectService', () => service)
  const { storageType, storageService, nodeFilter } = (() => {
    let result: { storageType: StorageType; storageService: StorageService; nodeFilter: (node: StorageNode) => boolean }
    switch (params.storageType) {
      case 'app': {
        const basePath = ''
        service.appStorage.toFullPath = nodePath => StorageUtil.toFullPath(basePath, nodePath)
        service.appStorage.toFullPaths = nodePaths => StorageUtil.toFullPaths(basePath, nodePaths)
        result = {
          storageType: 'app',
          storageService: service.appStorage,
          nodeFilter: StorageTreeNodeFilter.DirFilter,
        }
        break
      }
      case 'user': {
        const basePath = StorageUtil.toUserRootPath(GeneralUser().uid)
        service.userStorage.toFullPath = nodePath => StorageUtil.toFullPath(basePath, nodePath)
        service.userStorage.toFullPaths = nodePaths => StorageUtil.toFullPaths(basePath, nodePaths)
        result = {
          storageType: 'user',
          storageService: service.userStorage,
          nodeFilter: StorageTreeNodeFilter.DirFilter,
        }
        break
      }
      case 'article': {
        const basePath = StorageUtil.toArticleRootPath(GeneralUser().uid)
        service.articleStorage.toFullPath = nodePath => StorageUtil.toFullPath(basePath, nodePath)
        service.articleStorage.toFullPaths = nodePaths => StorageUtil.toFullPaths(basePath, nodePaths)
        result = {
          storageType: 'article',
          storageService: service.articleStorage,
          nodeFilter: StorageTreeNodeFilter.ArticleFilter,
        }
        break
      }
      default: {
        const basePath = ''
        service.appStorage.toFullPath = nodePath => StorageUtil.toFullPath(basePath, nodePath)
        service.appStorage.toFullPaths = nodePaths => StorageUtil.toFullPaths(basePath, nodePaths)
        result = {
          storageType: 'app',
          storageService: service.appStorage,
          nodeFilter: StorageTreeNodeFilter.AllFilter,
        }
        break
      }
    }
    params.nodeFilter && (result.nodeFilter = params.nodeFilter)
    return result
  })()

  // サインイン済みに設定
  td.replace<AuthService, 'isSignedIn'>(
    service.auth,
    'isSignedIn',
    computed(() => true)
  )

  // ルーターをモック化
  const router = td.object<VueRouter>()
  td.replace(require('@/app/router'), 'default', router)

  // ツリービューのインスタンス化
  const wrapper = mount(TreeView.clazz)
  const treeView = (wrapper.vm as any) as TestStorageTreeView
  const treeViewRef = ref(treeView) as Ref<TestStorageTreeView>

  // ストレージページサービスをインスタンス化
  const pageService = StoragePageService.newInstance({ storageType, nodeFilter, treeViewRef }) as RawStoragePageService

  // ストレージノードの初回｢未｣読み込みに設定
  pageService.store.isFetchedInitialStorage.value = false

  return { pageService, treeView, storageService }
}

/**
 * ツリービューを構成するノードの親子関係を検証します。
 * @param treeView
 */
function verifyParentChildRelationForTree(treeView: TreeView) {
  for (let i = 0; i < treeView.children.length; i++) {
    const node = treeView.children[i]
    // ノードの親が空であることを検証
    expect(node.parent).toBeNull()
    // ノードの親子(子孫)関係の検証
    verifyParentChildRelationForNode(node)
  }
}

/**
 * ノードの親子関係を検証します。
 * @param node
 */
function verifyParentChildRelationForNode(node: TreeNode) {
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i]
    // ノードの親子関係を検証
    expect(child.parent).toBe(node)
    // 孫ノードの検証
    verifyParentChildRelationForNode(child)
  }
}

/**
 * ディレクトリツリーノード追加/更新用データを作成します。
 * @param dirPath
 * @param data
 */
function newTreeDirNodeInput(dirPath: string, data?: NewTreeDirNodeInputData): StorageTreeNodeInput {
  return Object.assign(newStorageDirNode(dirPath, data), {
    opened: data?.opened,
    lazyLoadStatus: data?.lazyLoadStatus,
  })
}

/**
 * ファイルツリーノード追加/更新用データを作成します。
 * @param filePath
 * @param data
 */
function newTreeFileNodeInput(filePath: string, data?: NewTreeFileNodeInputData): StorageTreeNodeInput {
  return Object.assign(newStorageFileNode(filePath, data), {})
}

function cloneTreeNodeInput(source: StorageTreeNodeInput, input: Partial<StorageTreeNodeInput>): StorageTreeNodeInput {
  return merge({}, source, input)
}

/**
 * ツリーノード追加/更新用データである`StorageTreeNodeInput`を`StorageNode`へ変換します。
 * @param source
 */
function toStorageNode(source: StorageTreeNodeInput): StorageNode

/**
 * ツリーノード追加/更新用データである`StorageTreeNodeInput`を`StorageNode`へ変換します。
 * @param source
 */
function toStorageNode(source: StorageTreeNodeInput[]): StorageNode[]

function toStorageNode(source: StorageTreeNodeInput | StorageTreeNodeInput[]): StorageNode | StorageNode[] {
  function to(source: StorageTreeNodeInput): StorageNode {
    const result = { ...source }
    delete result.opened
    delete result.lazyLoadStatus
    return result
  }

  if (Array.isArray(source)) {
    const list = source as StorageTreeNodeInput[]
    return list.map(item => to(item)) as StorageNode[]
  } else {
    const item = source as StorageTreeNodeInput
    return to(item) as StorageNode
  }
}

/**
 * テスト用にリストバンドル系のノード群を作成します。
 * ```
 * ブログ
 * ├記事2
 * │└index.md
 * └記事1
 *   └index.md
 * ```
 */
function newListBundleFamilyNodes() {
  const config = useConfig()
  const assets = newStorageDirNode(`${config.storage.article.assetsName}`)
  const blog = newStorageDirNode(`${StorageNode.generateId()}`, {
    article: {
      dir: {
        name: 'ブログ',
        type: 'ListBundle',
        sortOrder: 1,
      },
    },
  })
  const art2 = newStorageDirNode(`${blog.path}/${StorageNode.generateId()}`, {
    article: {
      dir: {
        name: '記事2',
        type: 'Article',
        sortOrder: 2,
      },
    },
  })
  const art2_master = newStorageDirNode(StorageUtil.toArticleSrcMasterPath(art2.path), {
    article: { file: { type: 'Master' } },
  })
  const art2_draft = newStorageDirNode(StorageUtil.toArticleSrcDraftPath(art2.path), {
    article: { file: { type: 'Draft' } },
  })
  const art1 = newStorageDirNode(`${blog.path}/${StorageNode.generateId()}`, {
    article: {
      dir: {
        name: '記事1',
        type: 'Article',
        sortOrder: 1,
      },
    },
  })
  const art1_master = newStorageDirNode(StorageUtil.toArticleSrcMasterPath(art1.path), {
    article: { file: { type: 'Master' } },
  })
  const art1_draft = newStorageDirNode(StorageUtil.toArticleSrcDraftPath(art1.path), {
    article: { file: { type: 'Draft' } },
  })

  return { assets, blog, art2, art2_master, art2_draft, art1, art1_master, art1_draft }
}

/**
 * テスト用にカテゴリバンドル系のノード群を作成します。
 * ```
 * プログラミング
 * └TypeScript
 *   ├変数
 *   │└index.md
 *   └クラス
 *     └index.md
 * ```
 */
function newTreeBundleFamilyNodes() {
  const config = useConfig()
  const assets = newStorageDirNode(`${config.storage.article.assetsName}`)
  const programming = newStorageDirNode(`${StorageNode.generateId()}`, {
    article: {
      dir: {
        name: 'プログラミング',
        type: 'TreeBundle',
        sortOrder: 1,
      },
    },
  })
  const ts = newStorageDirNode(`${programming.path}/${StorageNode.generateId()}`, {
    article: {
      dir: {
        name: 'TypeScript',
        type: 'Category',
        sortOrder: 1,
      },
    },
  })
  const variable = newStorageDirNode(`${ts.path}/${StorageNode.generateId()}`, {
    article: {
      dir: {
        name: '変数',
        type: 'Article',
        sortOrder: 2,
      },
    },
  })
  const variable_master = newStorageDirNode(StorageUtil.toArticleSrcMasterPath(variable.path), {
    article: { file: { type: 'Master' } },
  })
  const variable_draft = newStorageDirNode(StorageUtil.toArticleSrcDraftPath(variable.path), {
    article: { file: { type: 'Draft' } },
  })
  const clazz = newStorageDirNode(`${ts.path}/${StorageNode.generateId()}`, {
    article: {
      dir: {
        name: 'クラス',
        type: 'Article',
        sortOrder: 1,
      },
    },
  })
  const clazz_master = newStorageDirNode(StorageUtil.toArticleSrcMasterPath(clazz.path), {
    article: { file: { type: 'Master' } },
  })
  const clazz_draft = newStorageDirNode(StorageUtil.toArticleSrcDraftPath(clazz.path), {
    article: { file: { type: 'Draft' } },
  })

  return { assets, programming, ts, variable, variable_master, variable_draft, clazz, clazz_master, clazz_draft }
}

//========================================================================
//
//  Tests
//
//========================================================================

describe('StoragePageService', () => {
  describe('getAllTreeNodes', () => {
    it('ベーシックケース', () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      const d1 = newTreeDirNodeInput(`d1`)
      const d11 = newTreeDirNodeInput(`d1/d11`)
      const f111 = newTreeFileNodeInput(`d1/d11/f111.txt`)
      const d12 = newTreeDirNodeInput(`d1/d12`)
      const d2 = newTreeDirNodeInput(`d2`)
      const d21 = newTreeDirNodeInput(`d2/d21`)
      const f211 = newTreeFileNodeInput(`d2/d21/f211.txt`)
      const f1 = newTreeFileNodeInput(`f1.txt`)
      pageService.setAllTreeNodes([d1, d11, f111, d12, d2, d21, f211, f1])

      const actual = pageService.getAllTreeNodes()

      expect(actual.length).toBe(9)
      expect(actual[0].path).toBe(``)
      expect(actual[1].path).toBe(`d1`)
      expect(actual[2].path).toBe(`d1/d11`)
      expect(actual[3].path).toBe(`d1/d11/f111.txt`)
      expect(actual[4].path).toBe(`d1/d12`)
      expect(actual[5].path).toBe(`d2`)
      expect(actual[6].path).toBe(`d2/d21`)
      expect(actual[7].path).toBe(`d2/d21/f211.txt`)
      expect(actual[8].path).toBe(`f1.txt`)
    })
  })

  describe('getTreeNode', () => {
    it('ベーシックケース', () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      const d1 = newTreeDirNodeInput(`d1`)
      const d2 = newTreeDirNodeInput(`d2`)
      pageService.setAllTreeNodes([d1, d2])

      const actual = pageService.getTreeNode(`d1`)!

      expect(actual.path).toBe(`d1`)
    })

    it('ルートノードを取得', () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      const d1 = newTreeDirNodeInput(`d1`)
      const d2 = newTreeDirNodeInput(`d2`)
      pageService.setAllTreeNodes([d1, d2])

      const actual = pageService.getTreeNode(``)!

      expect(actual.path).toBe(``)
    })
  })

  describe('setAllTreeNodes', () => {
    it('ソートされていないノードリストを渡した場合', () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      // root
      // ├d1
      // │├d11
      // ││└f111.txt
      // │└d12
      // ├d2
      // │└d21
      // │  └f211.txt
      // └f1.txt
      const d1 = newTreeDirNodeInput(`d1`)
      const d11 = newTreeDirNodeInput(`d1/d11`)
      const f111 = newTreeFileNodeInput(`d1/d11/f111.txt`)
      const d12 = newTreeDirNodeInput(`d1/d12`)
      const d2 = newTreeDirNodeInput(`d2`)
      const d21 = newTreeDirNodeInput(`d2/d21`)
      const f211 = newTreeFileNodeInput(`d2/d21/f211.txt`)
      const f1 = newTreeFileNodeInput(`f1.txt`)

      pageService.setAllTreeNodes(shuffleArray([d1, d11, f111, d12, d2, d21, f211, f1]))
      const actual = pageService.getAllTreeNodes()

      expect(actual.length).toBe(9)
      expect(actual[0].path).toBe(``)
      expect(actual[1].path).toBe(`d1`)
      expect(actual[2].path).toBe(`d1/d11`)
      expect(actual[3].path).toBe(`d1/d11/f111.txt`)
      expect(actual[4].path).toBe(`d1/d12`)
      expect(actual[5].path).toBe(`d2`)
      expect(actual[6].path).toBe(`d2/d21`)
      expect(actual[7].path).toBe(`d2/d21/f211.txt`)
      expect(actual[8].path).toBe(`f1.txt`)

      verifyParentChildRelationForTree(treeView)
    })
  })

  describe('mergeAllTreeNodes', () => {
    it('ベーシックケース', () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      // root
      // ├d1
      // │├d11
      // ││└f111.txt
      // │└d12
      // └d2
      const d1 = newTreeDirNodeInput(`d1`)
      const d11 = newTreeDirNodeInput(`d1/d11`)
      const f111 = newTreeFileNodeInput(`d1/d11/f111.txt`)
      const d12 = newTreeDirNodeInput(`d1/d12`)
      const d2 = newTreeDirNodeInput(`d2`)
      pageService.setAllTreeNodes([d1, d11, f111, d12, d2])

      // 以下の状態のノードリストを引数に設定する
      // ・'d1/d11/f111.txt'が'fA.txt'へ移動+リネームされた
      // ・'d1/d11/f11A.txt'が追加された
      // ・'d1/d12'が削除された
      const fA = cloneTreeNodeInput(f111, { dir: ``, path: `fA.txt` })
      const f11A = newTreeFileNodeInput(`d1/d11/f11A.txt`)
      pageService.mergeAllTreeNodes([d1, d11, f11A, fA, d2])
      const actual = pageService.getAllTreeNodes()

      // root
      // ├d1
      // │└d11
      // │  └f11A.txt
      // ├d2
      // └fA.txt
      expect(actual.length).toBe(6)
      expect(actual[0].path).toBe(``)
      expect(actual[1].path).toBe(`d1`)
      expect(actual[2].path).toBe(`d1/d11`)
      expect(actual[3].path).toBe(`d1/d11/f11A.txt`)
      expect(actual[4].path).toBe(`d2`)
      expect(actual[5].path).toBe(`fA.txt`)

      verifyParentChildRelationForTree(treeView)
    })
  })

  describe('mergeTreeDirDescendants', () => {
    it('ベーシックケース', () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      // root
      // ├d1 ← 対象ノードに指定
      // │├d11
      // ││└f111.txt
      // │└d12
      // │  └f121.txt
      // └d2
      const d1 = newTreeDirNodeInput(`d1`)
      const d11 = newTreeDirNodeInput(`d1/d11`)
      const f111 = newTreeFileNodeInput(`d1/d11/f111.txt`)
      const f112 = newTreeFileNodeInput(`d1/d11/f112.txt`)
      const d12 = newTreeDirNodeInput(`d1/d12`)
      const f121 = newTreeFileNodeInput(`d1/d12/f121.txt`)
      const f11 = newTreeFileNodeInput(`d1/f11.txt`)
      const d2 = newTreeDirNodeInput(`d2`)
      pageService.setAllTreeNodes([d1, d11, f111, d12, f121, d2])

      // ストアから以下の状態のノードリストが取得される
      // ・'d1/d11/f112.txt'が追加された
      // ・'d1/f11.txt'が追加された
      // ・'d1/d12'が削除(または移動)された
      td.when(storageService.getDirDescendants(d1.path)).thenReturn(toStorageNode([d1, d11, f111, f112, f11]))

      pageService.mergeTreeDirDescendants(d1.path)
      const actual = pageService.getAllTreeNodes()

      // root
      // ├d1
      // │├d11
      // ││├f111.txt
      // ││└f112.txt
      // │└f11.txt
      // └d2
      expect(actual.length).toBe(7)
      expect(actual[0].path).toBe(``)
      expect(actual[1].path).toBe(`d1`)
      expect(actual[2].path).toBe(`d1/d11`)
      expect(actual[3].path).toBe(`d1/d11/f111.txt`)
      expect(actual[4].path).toBe(`d1/d11/f112.txt`)
      expect(actual[5].path).toBe(`d1/f11.txt`)
      expect(actual[6].path).toBe(`d2`)

      verifyParentChildRelationForTree(treeView)
    })

    it('引数ディレクトリが削除されていた', () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      // root
      // ├d1 ← 対象ノードに指定
      // │└d11
      // │  └f111.txt
      // └d2
      const d1 = newTreeDirNodeInput(`d1`)
      const d11 = newTreeDirNodeInput(`d1/d11`)
      const f111 = newTreeFileNodeInput(`d1/d11/f111.txt`)
      const d2 = newTreeDirNodeInput(`d2`)
      pageService.setAllTreeNodes([d1, d11, f111, d2])

      // ストアから以下の状態のノードリストが取得される
      // ・'d1'が削除された
      td.when(storageService.getDirDescendants(d1.path)).thenReturn([])

      pageService.mergeTreeDirDescendants(d1.path)
      const actual = pageService.getAllTreeNodes()

      // root
      // └d2
      expect(actual.length).toBe(2)
      expect(actual[0].path).toBe(``)
      expect(actual[1].path).toBe(`d2`)

      verifyParentChildRelationForTree(treeView)
    })

    it('nodeFilterが機能しているか検証', () => {
      const { pageService, storageService, treeView } = newStoragePageService({ nodeFilter: StorageTreeNodeFilter.DirFilter })

      // root
      // └d1 ← 対象ノードに指定
      //   └d11
      const d1 = newTreeDirNodeInput(`d1`)
      const d11 = newTreeDirNodeInput(`d1/d11`)
      const f111 = newTreeFileNodeInput(`d1/d11/f111.txt`)
      pageService.setAllTreeNodes([d1, d11])

      // ストアから以下の状態のノードリストが取得される
      // ・'d1/d11/f111.txt'が追加された
      td.when(storageService.getDirDescendants(d1.path)).thenReturn(toStorageNode([d1, d11, f111]))

      pageService.mergeTreeDirDescendants(d1.path)
      const actual = pageService.getAllTreeNodes()

      // root
      // └d1
      //   └d11
      //      └f111.txt ← nodeFilterで除外されるのでツリーには存在しない
      expect(actual.length).toBe(3)
      expect(actual[0].path).toBe(``)
      expect(actual[1].path).toBe(`d1`)
      expect(actual[2].path).toBe(`d1/d11`)

      verifyParentChildRelationForTree(treeView)
    })
  })

  describe('mergeTreeDirChildren', () => {
    it('ベーシックケース', () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      // root
      // ├d1 ← 対象ノードに指定
      // │├d11
      // ││└f111.txt
      // │└d12
      // │  └f121.txt
      // └d2
      const d1 = newTreeDirNodeInput(`d1`)
      const d11 = newTreeDirNodeInput(`d1/d11`)
      const f111 = newTreeFileNodeInput(`d1/d11/f111.txt`)
      const f112 = newTreeFileNodeInput(`d1/d11/f112.txt`)
      const d12 = newTreeDirNodeInput(`d1/d12`)
      const f121 = newTreeFileNodeInput(`d1/d12/f121.txt`)
      const f11 = newTreeFileNodeInput(`d1/f11.txt`)
      const d2 = newTreeDirNodeInput(`d2`)
      pageService.setAllTreeNodes([d1, d11, f111, d12, f121, d2])

      // ストアから以下の状態のノードリストが取得される
      // ・'d1/d11/f112.txt'が追加された
      // ・'d1/f11.txt'が追加された
      // ・'d1/d12'が削除された
      td.when(storageService.getDirChildren(d1.path)).thenReturn(toStorageNode([d1, d11, f112, f11]))

      pageService.mergeTreeDirChildren(d1.path)
      const actual = pageService.getAllTreeNodes()

      // root
      // ├d1
      // │├d11
      // ││├f111.txt
      // ││└f112.txt
      // │└f11.txt
      // └d2
      expect(actual.length).toBe(7)
      expect(actual[0].path).toBe(``)
      expect(actual[1].path).toBe(`d1`)
      expect(actual[2].path).toBe(`d1/d11`)
      expect(actual[3].path).toBe(`d1/d11/f111.txt`)
      expect(actual[4].path).toBe(`d1/d11/f112.txt`)
      expect(actual[5].path).toBe(`d1/f11.txt`)
      expect(actual[6].path).toBe(`d2`)

      verifyParentChildRelationForTree(treeView)
    })

    it('引数ディレクトリが削除されていた', () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      // root
      // ├d1 ← 対象ノードに指定
      // │└d11
      // │  └f111.txt
      // └d2
      const d1 = newTreeDirNodeInput(`d1`)
      const d11 = newTreeDirNodeInput(`d1/d11`)
      const f111 = newTreeFileNodeInput(`d1/d11/f111.txt`)
      const d2 = newTreeDirNodeInput(`d2`)
      pageService.setAllTreeNodes([d1, d11, f111, d2])

      // ストアから以下の状態のノードリストが取得される
      // ・'d1'が削除(または移動)された
      td.when(storageService.getDirChildren(d1.path)).thenReturn([])

      pageService.mergeTreeDirChildren(d1.path)
      const actual = pageService.getAllTreeNodes()

      // root
      // └d2
      expect(actual.length).toBe(2)
      expect(actual[0].path).toBe(``)
      expect(actual[1].path).toBe(`d2`)

      verifyParentChildRelationForTree(treeView)
    })

    it('nodeFilterが機能しているか検証', () => {
      const { pageService, storageService, treeView } = newStoragePageService({ nodeFilter: StorageTreeNodeFilter.DirFilter })

      // root
      // └d1 ← 対象ノードに指定
      //   └d11
      const d1 = newTreeDirNodeInput(`d1`)
      const d11 = newTreeDirNodeInput(`d1/d11`)
      const f11 = newTreeFileNodeInput(`d1/f11.txt`)
      pageService.setAllTreeNodes([d1, d11])

      // ストアから以下の状態のノードリストが取得される
      // ・'d1/f11.txt'が追加された
      td.when(storageService.getDirChildren(d1.path)).thenReturn(toStorageNode([d1, d11, f11]))

      pageService.mergeTreeDirChildren(d1.path)
      const actual = pageService.getAllTreeNodes()

      // root
      // └d1
      //   ├d11
      //   └f1.txt ← nodeFilterで除外されるのでツリーには存在しない
      expect(actual.length).toBe(3)
      expect(actual[0].path).toBe(``)
      expect(actual[1].path).toBe(`d1`)
      expect(actual[2].path).toBe(`d1/d11`)

      verifyParentChildRelationForTree(treeView)
    })
  })

  describe('setTreeNode + setTreeNodes', () => {
    it('ツリーに存在しないノードの設定', async () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      pageService.setAllTreeNodes([])

      const d1 = newTreeDirNodeInput('d1')
      const d11 = newTreeDirNodeInput('d1/d11')
      const f111 = newTreeFileNodeInput('d1/d11/f111.txt')
      pageService.setTreeNodes([d1, d11, f111])

      // ノードが追加されたことを検証
      expect(pageService.getTreeNode(`d1/d11`)!.path).toBe(`d1/d11`)
      expect(pageService.getTreeNode(`d1/d11/f111.txt`)!.path).toBe(`d1/d11/f111.txt`)

      verifyParentChildRelationForTree(treeView)
    })

    it('ツリーに存在するノードの設定', () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      const d1 = newTreeDirNodeInput(`d1`)
      const d11 = newTreeDirNodeInput(`d1/d11`)
      const f111 = newTreeFileNodeInput(`d1/d11/f111.txt`)
      const d2 = newTreeDirNodeInput(`d2`)
      pageService.setAllTreeNodes([d1, d11, f111, d2])

      const createdAt = dayjs('2019-12-01')
      const updatedAt = dayjs('2019-12-02')
      const updatingD11 = Object.assign({}, d11, { createdAt, updatedAt })
      const updatingFileA = Object.assign({}, f111, { createdAt, updatedAt })

      pageService.setTreeNodes([updatingD11, updatingFileA])

      expect(pageService.getTreeNode(`d1/d11`)!.createdAt).toEqual(createdAt)
      expect(pageService.getTreeNode(`d1/d11`)!.updatedAt).toEqual(updatedAt)
      expect(pageService.getTreeNode(`d1/d11/f111.txt`)!.createdAt).toEqual(createdAt)
      expect(pageService.getTreeNode(`d1/d11/f111.txt`)!.updatedAt).toEqual(updatedAt)
    })

    it('ツリーに存在するノードの設定 - 親が変わっていた場合', () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      const d1 = newTreeDirNodeInput(`d1`)
      const d11 = newTreeDirNodeInput(`d1/d11`)
      const f111 = newTreeFileNodeInput(`d1/d11/f111.txt`)
      const d2 = newTreeDirNodeInput(`d2`)
      pageService.setAllTreeNodes([d1, d11, f111, d2])

      // 'd1/d11'が移動+リネームで'd2/d21'となった
      const updatedAt = dayjs()
      const d21_from_d11 = cloneTreeNodeInput(d11, { name: `d21`, dir: `d2`, path: `d2/d21`, updatedAt })
      const f211_from_f111 = cloneTreeNodeInput(f111, { name: `f211.txt`, dir: `d2/d21`, path: `d2/d21/f211.txt`, updatedAt })
      pageService.setTreeNodes([d21_from_d11, f211_from_f111])

      const _d21 = pageService.getTreeNode(`d2/d21`)!
      expect(_d21.parent!.path).toBe(`d2`)
      expect(_d21.updatedAt).toEqual(updatedAt)
      const _f211 = pageService.getTreeNode(`d2/d21/f211.txt`)!
      expect(_f211.parent!.path).toBe(`d2/d21`)
      expect(_f211.updatedAt).toEqual(updatedAt)

      verifyParentChildRelationForTree(treeView)
    })

    it('ツリーに存在するノードの設定 - リネームされていた場合', () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      const d1 = newTreeDirNodeInput(`d1`)
      const d11 = newTreeDirNodeInput(`d1/d11`)
      const f111 = newTreeFileNodeInput(`d1/d11/f111.txt`)
      const f112 = newTreeFileNodeInput(`d1/d11/f112.txt`)
      pageService.setAllTreeNodes([d1, d11, f111, f112])

      // 'd1/d11/f112.txt'がリネームされて'd1/d11/f110.txt'となった
      const updatedAt = dayjs()
      const f110_from_f112 = cloneTreeNodeInput(f112, { name: `f110.txt`, dir: `d1/d11`, path: `d1/d11/f110.txt`, updatedAt })
      pageService.setTreeNodes([f110_from_f112])

      const _d11 = treeView.getNode(`d1/d11`)!
      const [_f110, _f111] = _d11.children as StorageTreeNode[]
      expect(_f110.path).toBe(`d1/d11/f110.txt`)
      expect(_f110.name).toBe(`f110.txt`)
      expect(_f110.updatedAt).toEqual(updatedAt)
      expect(_f111.path).toBe(`d1/d11/f111.txt`)
      expect(_f111.name).toBe(`f111.txt`)

      verifyParentChildRelationForTree(treeView)
    })

    it('ディレクトリ削除後また同じディレクトリに同じ名前のディレクトリが作成された場合', () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      const d1 = newTreeDirNodeInput(`d1`)
      const d11 = newTreeDirNodeInput(`d1/d11`)
      pageService.setAllTreeNodes([d1, d11])

      // 'd1/d11'が削除後また同じディレクトリに同じ名前で作成された
      const created_d11 = cloneTreeNodeInput(d11, { id: StorageNode.generateId(), createdAt: dayjs(), updatedAt: dayjs() })
      pageService.setTreeNodes([created_d11])

      const _d11 = pageService.getTreeNode(`d1/d11`)!
      expect(_d11.id).toEqual(created_d11.id)
      expect(_d11.createdAt).toEqual(created_d11.createdAt)
      expect(_d11.updatedAt).toEqual(created_d11.updatedAt)

      verifyParentChildRelationForTree(treeView)
    })

    it('ファイル削除後また同じディレクトリに同じ名前でファイルがアップロードされた場合', () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      const d1 = newTreeDirNodeInput(`d1`)
      const d11 = newTreeDirNodeInput(`d1/d11`)
      const f111 = newTreeFileNodeInput(`d1/d11/f111.txt`)
      const f112 = newTreeFileNodeInput(`d1/d11/f112.txt`)
      pageService.setAllTreeNodes([d1, d11, f111, f112])

      // 'd1/d11/f111.txt'が削除後また同じディレクトリに同じ名前でアップロードされた
      const created_f111 = cloneTreeNodeInput(f111, { id: StorageNode.generateId(), createdAt: dayjs(), updatedAt: dayjs() })
      pageService.setTreeNodes([created_f111])

      const _f111 = pageService.getTreeNode(`d1/d11/f111.txt`)!
      expect(_f111.id).toEqual(created_f111.id)
      expect(_f111.createdAt).toEqual(created_f111.createdAt)
      expect(_f111.updatedAt).toEqual(created_f111.updatedAt)

      verifyParentChildRelationForTree(treeView)
    })

    it('ソートされていないノードリストを渡した場合', () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      pageService.setAllTreeNodes([])

      const d1 = newTreeDirNodeInput(`d1`)
      const d11 = newTreeDirNodeInput(`d1/d11`)
      const f111 = newTreeFileNodeInput(`d1/d11/f111.txt`)
      const d12 = newTreeDirNodeInput(`d1/d12`)
      const d2 = newTreeDirNodeInput(`d2`)
      const d21 = newTreeDirNodeInput(`d2/d21`)
      const f211 = newTreeFileNodeInput(`d2/d21/f211.txt`)
      const f1 = newTreeFileNodeInput(`f1.txt`)
      pageService.setTreeNodes(shuffleArray([d1, d11, f111, d12, d2, d21, f211, f1]))
      const actual = pageService.getAllTreeNodes()

      expect(actual.length).toBe(9)
      expect(actual[0].path).toBe(``)
      expect(actual[1].path).toBe(`d1`)
      expect(actual[2].path).toBe(`d1/d11`)
      expect(actual[3].path).toBe(`d1/d11/f111.txt`)
      expect(actual[4].path).toBe(`d1/d12`)
      expect(actual[5].path).toBe(`d2`)
      expect(actual[6].path).toBe(`d2/d21`)
      expect(actual[7].path).toBe(`d2/d21/f211.txt`)
      expect(actual[8].path).toBe(`f1.txt`)

      verifyParentChildRelationForTree(treeView)
    })
  })

  describe('removeTreeNodes', () => {
    it('ベーシックケース', () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      const d1 = newTreeDirNodeInput(`d1`)
      const d11 = newTreeDirNodeInput(`d1/d11`)
      const f111 = newTreeFileNodeInput(`d1/d11/f111.txt`)
      const d2 = newTreeDirNodeInput(`d2`)
      const d21 = newTreeDirNodeInput(`d2/d21`)
      const f211 = newTreeFileNodeInput(`d2/d21/f211.txt`)
      pageService.setAllTreeNodes([d1, d11, f111, d2, d21, f211])

      pageService.removeTreeNodes([`d1/d11`, `d2/d21/f211.txt`])

      expect(pageService.getTreeNode(`d1/d11`)).toBeUndefined()
      expect(pageService.getTreeNode(`d1/d11/f111.txt`)).toBeUndefined()
      expect(pageService.getTreeNode(`d2/d21/f211.txt`)).toBeUndefined()

      verifyParentChildRelationForTree(treeView)
    })

    it(`'d1/d11'と親である'd1'を同時に指定した場合`, () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      const d1 = newTreeDirNodeInput(`d1`)
      const d11 = newTreeDirNodeInput(`d1/d11`)
      const f111 = newTreeFileNodeInput(`d1/d11/f111.txt`)
      const d12 = newTreeDirNodeInput(`d1/d12`)
      pageService.setAllTreeNodes([d1, d11, f111, d12])

      pageService.removeTreeNodes([`d1/d11`, `d1`])

      expect(pageService.getTreeNode(`d1`)).toBeUndefined()
      expect(pageService.getTreeNode(`d1/d11`)).toBeUndefined()
      expect(pageService.getTreeNode(`d1/d11/f111.txt`)).toBeUndefined()
      expect(pageService.getTreeNode(`d1/d12`)).toBeUndefined()

      verifyParentChildRelationForTree(treeView)
    })

    it('存在しないパスを指定した場合', () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      const d1 = newTreeDirNodeInput(`d1`)
      const d2 = newTreeDirNodeInput(`d2`)
      pageService.setAllTreeNodes([d1, d2])

      // 何も起こらない
      pageService.removeTreeNodes([`dXXX`])

      verifyParentChildRelationForTree(treeView)
    })

    it('削除により選択ノードがなくなった場合', () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      const d1 = newTreeDirNodeInput(`d1`)
      const d11 = newTreeDirNodeInput(`d1/d11`)
      const f111 = newTreeFileNodeInput(`d1/d11/f111.txt`)
      pageService.setAllTreeNodes([d1, d11, f111])
      // 'd1/d11/f111.txt'を選択ノードに設定
      pageService.selectedTreeNode.value = pageService.getTreeNode(f111.path)!

      pageService.removeTreeNodes([`d1/d11`])

      expect(pageService.getTreeNode(`d1/d11`)).toBeUndefined()
      expect(pageService.getTreeNode(`d1/d11/f111.txt`)).toBeUndefined()
      // 選択ノードがルートノードになっていることを検証
      expect(pageService.selectedTreeNode.value).toBe(pageService.getRootTreeNode())

      verifyParentChildRelationForTree(treeView)
    })
  })

  describe('moveTreeNode', () => {
    it('ディレクトリの移動', async () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      // root
      // ├dev
      // │└projects ← workへ移動
      // │  └blog
      // │    └src
      // │      └index.html
      // └work
      //   ├assets
      //   └users
      const dev = newTreeDirNodeInput(`dev`)
      const projects = newTreeDirNodeInput(`dev/projects`)
      const blog = newTreeDirNodeInput(`dev/projects/blog`)
      const src = newTreeDirNodeInput(`dev/projects/blog/src`)
      const index = newTreeFileNodeInput(`dev/projects/blog/src/index.html`)
      const work = newTreeDirNodeInput(`work`)
      const assets = newTreeDirNodeInput(`work/assets`)
      const users = newTreeDirNodeInput(`work/users`)
      pageService.setAllTreeNodes([dev, projects, blog, src, index, work, assets, users])

      // 'dev/projects'を'work'へ移動
      await pageService.moveTreeNode(`dev/projects`, `work/projects`)

      // root
      // ├dev
      // └work
      //   ├assets
      //   ├projects
      //   │└blog
      //   │  └src
      //   │    └index.html
      //   └users

      const _dev = pageService.getTreeNode(`dev`)!
      expect(_dev.getDescendants().length).toBe(0)

      const _work = pageService.getTreeNode(`work`)!
      const _work_descendants = _work.getDescendants()
      const [_assets, _projects, _blog, _src, _index, _users] = _work_descendants
      expect(_work_descendants.length).toBe(6)
      expect(_assets.path).toBe(`work/assets`)
      expect(_projects.path).toBe(`work/projects`)
      expect(_blog.path).toBe(`work/projects/blog`)
      expect(_src.path).toBe(`work/projects/blog/src`)
      expect(_index.path).toBe(`work/projects/blog/src/index.html`)
      expect(_users.path).toBe(`work/users`)

      verifyParentChildRelationForTree(treeView)
    })

    it('ファイルの移動', async () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      // root
      // ├d1
      // │├fileA.txt
      // │└fileC.txt
      // └fileB.txt ← d1へ移動
      const d1 = newTreeDirNodeInput(`d1`)
      const fileA = newTreeFileNodeInput(`d1/fileA.txt`)
      const fileC = newTreeFileNodeInput(`d1/fileC.txt`)
      const fileB = newTreeFileNodeInput(`fileB.txt`)
      pageService.setAllTreeNodes([d1, fileA, fileC, fileB])

      // 'fileB.txt'を'd1'へ移動
      await pageService.moveTreeNode(`fileB.txt`, `d1/fileB.txt`)

      // root
      // └d1
      //  ├fileA.txt
      //  ├fileB.txt
      //  └fileC.txt
      const _d1 = pageService.getTreeNode(`d1`)!
      const _d1_descendants = _d1.getDescendants()
      const [_fileA, _fileB, _fileC] = _d1_descendants
      expect(_d1_descendants.length).toBe(3)
      expect(_fileA.path).toBe(`d1/fileA.txt`)
      expect(_fileB.path).toBe(`d1/fileB.txt`)
      expect(_fileC.path).toBe(`d1/fileC.txt`)

      verifyParentChildRelationForTree(treeView)
    })

    it('ディレクトリのリネーム', async () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      // root
      // ├d1
      // ├d2
      // └d3 ← d0へリネーム
      const d1 = newTreeDirNodeInput(`d1`)
      const d2 = newTreeDirNodeInput(`d2`)
      const d3 = newTreeDirNodeInput(`d3`)
      pageService.setAllTreeNodes([d1, d2, d3])

      // 'd3'を'd0'へリネーム
      await pageService.moveTreeNode(`d3`, `d0`)

      // root
      // ├d0
      // ├d1
      // └d2
      const [_d0, _d1, _d2] = pageService.getRootTreeNode().getDescendants()
      expect(_d0.path).toBe(`d0`)
      expect(_d1.path).toBe(`d1`)
      expect(_d2.path).toBe(`d2`)

      verifyParentChildRelationForTree(treeView)
    })

    it('ファイルのリネーム', async () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      // root
      // ├file1.txt
      // ├file2.txt
      // └file3.txt ← file0.txtへリネーム
      const file1 = newTreeDirNodeInput(`file1.txt`)
      const file2 = newTreeDirNodeInput(`file2.txt`)
      const file3 = newTreeDirNodeInput(`file3.txt`)
      pageService.setAllTreeNodes([file1, file2, file3])

      // 'file3.txt'を'file0.txt'へリネーム
      await pageService.moveTreeNode(`file3.txt`, `file0.txt`)

      // root
      // ├file0.txt
      // ├file1.txt
      // └file2.txt
      const [_file0, _file1, _file2] = pageService.getRootTreeNode().getDescendants()
      expect(_file0.path).toBe(`file0.txt`)
      expect(_file1.path).toBe(`file1.txt`)
      expect(_file2.path).toBe(`file2.txt`)

      verifyParentChildRelationForTree(treeView)
    })

    it('ルートディレクトリへ移動', async () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      // root
      // └dB
      //   ├dA
      //   │└fileA.txt
      //   └fileB.txt
      const dB = newTreeDirNodeInput(`dB`)
      const dA = newTreeDirNodeInput(`dB/dA`)
      const fileA = newTreeFileNodeInput(`dB/dA/fileA.txt`)
      const fileB = newTreeFileNodeInput(`dB/fileB.txt`)
      pageService.setAllTreeNodes([dB, dA, fileA, fileB])

      // 'dB/dA'をルートノードへ移動
      await pageService.moveTreeNode(`dB/dA`, `dA`)

      // root
      // ├dA
      // │└fileA.txt
      // └dB
      //   └fileB.txt
      const _root = pageService.getTreeNode(``)!
      const [_dA, _fileA, _dB, _fileB] = _root.getDescendants()
      expect(_root.getDescendants().length).toBe(4)
      expect(_dA.path).toBe(`dA`)
      expect(_fileA.path).toBe(`dA/fileA.txt`)
      expect(_dB.path).toBe(`dB`)
      expect(_fileB.path).toBe(`dB/fileB.txt`)

      verifyParentChildRelationForTree(treeView)
    })

    it('移動先に同名のディレクトリまたはファイルが存在する場合', async () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      // root
      // ├dA
      // │└d1 ← 移動するノード
      // │  ├d11
      // │  │└d111
      // │  │  ├fileA.txt
      // │  │  └fileB.txt
      // │  ├d12
      // │  ├fileX.txt
      // │  └fileY.txt
      // └dB
      //   └d1 ← ここへ上書き移動
      //     ├d11
      //     │└d111
      //     │  ├fileA.txt
      //     │  └fileC.txt
      //     ├d13
      //     ├fileX.txt
      //     └fileZ.txt
      const dA = newTreeDirNodeInput(`dA`)
      const dA_d1 = newTreeDirNodeInput(`dA/d1`)
      const dA_d11 = newTreeDirNodeInput(`dA/d1/d11`)
      const dA_d111 = newTreeDirNodeInput(`dA/d1/d11/d111`)
      const dA_fileA = newTreeFileNodeInput(`dA/d1/d11/d111/fileA.txt`)
      const dA_fileB = newTreeFileNodeInput(`dA/d1/d11/d111/fileB.txt`)
      const dA_d12 = newTreeDirNodeInput(`dA/d1/d12`)
      const dA_fileX = newTreeFileNodeInput(`dA/d1/fileX.txt`)
      const dA_fileY = newTreeFileNodeInput(`dA/d1/fileY.txt`)
      const dB = newTreeDirNodeInput(`dB`)
      const dB_d1 = newTreeDirNodeInput(`dB/d1`)
      const dB_d11 = newTreeDirNodeInput(`dB/d1/d11`)
      const dB_d111 = newTreeDirNodeInput(`dB/d1/d11/d111`)
      const dB_fileA = newTreeFileNodeInput(`dB/d1/d11/d111/fileA.txt`)
      const dB_fileC = newTreeFileNodeInput(`dB/d1/d11/d111/fileC.txt`)
      const dB_d13 = newTreeDirNodeInput(`dB/d1/d13`)
      const dB_fileX = newTreeFileNodeInput(`dB/d1/fileX.txt`)
      const dB_fileZ = newTreeFileNodeInput(`dB/d1/fileZ.txt`)
      pageService.setAllTreeNodes([
        dA,
        dA_d1,
        dA_d11,
        dA_d111,
        dA_fileA,
        dA_fileB,
        dA_d12,
        dA_fileX,
        dA_fileY,
        dB,
        dB_d1,
        dB_d11,
        dB_d111,
        dB_fileA,
        dB_fileC,
        dB_d13,
        dB_fileX,
        dB_fileZ,
      ])

      // 'dA/d1'を'dB'へ移動
      await pageService.moveTreeNode(`dA/d1`, `dB/d1`)

      // root
      // ├dA
      // └dB
      //   └d1
      //     ├d11
      //     │└d111
      //     │  ├fileA.txt
      //     │  ├fileB.txt
      //     │  └fileC.txt
      //     ├d12
      //     ├d13
      //     ├fileX.txt
      //     ├fileY.txt
      //     └fileZ.txt

      const _dA = pageService.getTreeNode(`dA`)!
      expect(_dA.getDescendants().length).toBe(0)

      const _dB = pageService.getTreeNode(`dB`)!
      const [_d1, _d11, _d111, _fileA, _fileB, _fileC, _d12, _d13, _fileX, _fileY, _fileZ] = _dB.getDescendants()
      expect(_dB.getDescendants().length).toBe(11)
      expect(_d1.path).toBe(`dB/d1`)
      expect(_d11.path).toBe(`dB/d1/d11`)
      expect(_d111.path).toBe(`dB/d1/d11/d111`)
      expect(_fileA.path).toBe(`dB/d1/d11/d111/fileA.txt`)
      expect(_fileB.path).toBe(`dB/d1/d11/d111/fileB.txt`)
      expect(_fileC.path).toBe(`dB/d1/d11/d111/fileC.txt`)
      expect(_d12.path).toBe(`dB/d1/d12`)
      expect(_d13.path).toBe(`dB/d1/d13`)
      expect(_fileX.path).toBe(`dB/d1/fileX.txt`)
      expect(_fileY.path).toBe(`dB/d1/fileY.txt`)
      expect(_fileZ.path).toBe(`dB/d1/fileZ.txt`)

      verifyParentChildRelationForTree(treeView)
    })
  })

  describe('fetchInitialStorage', () => {
    it('ストレージの初期読み込みが行われていない場合', async () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      // ストレージの初期読み込みが行われていない状態に設定
      pageService.store.isFetchedInitialStorage.value = false

      // root
      // ├[d1]
      // │└[d11] ← 対象ノードに指定
      // │  └[f111.txt]
      // └[d2]
      const d1 = newTreeDirNodeInput(`d1`)
      const d11 = newTreeDirNodeInput(`d1/d11`)
      const f111 = newTreeFileNodeInput(`d1/d11/f111.txt`)
      const d2 = newTreeDirNodeInput(`d2`)

      // APIから以下の状態のノードリストが取得される
      // ・'d1'
      // ・'d1/d11'
      // ・'d1/d11/f111.txt'
      // ・'d2'
      td.when(storageService.fetchChildren(``)).thenResolve(toStorageNode([d1, d2]))
      td.when(storageService.fetchChildren(d1.path)).thenResolve(toStorageNode([d11]))
      td.when(storageService.fetchChildren(d11.path)).thenResolve(toStorageNode([f111]))

      await pageService.fetchInitialStorage(d11.path)
      const actual = pageService.getAllTreeNodes()

      // root
      // ├d1
      // │└d11
      // │  └f111.txt
      // └d2
      expect(actual.length).toBe(5)
      expect(actual[0].path).toBe(``)
      expect(actual[1].path).toBe(`d1`)
      expect(actual[2].path).toBe(`d1/d11`)
      expect(actual[3].path).toBe(`d1/d11/f111.txt`)
      expect(actual[4].path).toBe(`d2`)
      // ディレクトリが展開されているか検証
      expect(actual[0].opened).toBeTruthy()
      expect(actual[1].opened).toBeTruthy()
      expect(actual[2].opened).toBeFalsy()
      expect(actual[3].opened).toBeFalsy()
      expect(actual[4].opened).toBeFalsy()
      // 遅延ロードの設定を検証
      expect(actual[0].lazy).toBeTruthy()
      expect(actual[1].lazy).toBeTruthy()
      expect(actual[2].lazy).toBeTruthy()
      expect(actual[3].lazy).toBeFalsy()
      expect(actual[4].lazy).toBeTruthy()
      // 遅延ロード状態の検証
      expect(actual[0].lazyLoadStatus).toBe('loaded')
      expect(actual[1].lazyLoadStatus).toBe('loaded')
      expect(actual[2].lazyLoadStatus).toBe('loaded')
      expect(actual[3].lazyLoadStatus).toBe('none')
      expect(actual[4].lazyLoadStatus).toBe('none')
      // fetchRoot()が正常に呼び出されたか検証
      const exp = td.explain(storageService.fetchRoot)
      expect(exp.calls.length).toBe(1)

      verifyParentChildRelationForTree(treeView)
    })

    it('ストレージの初期読み込みが行われている場合', async () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      // ストレージの初期読み込みが行われている状態に設定
      pageService.store.isFetchedInitialStorage.value = true

      // root
      // ├d1
      // │└d11 ← 対象ノードに指定
      // │  └f111.txt
      // └d2
      const d1 = newTreeDirNodeInput(`d1`)
      const d11 = newTreeDirNodeInput(`d1/d11`)
      const f111 = newTreeFileNodeInput(`d1/d11/f111.txt`)
      const d2 = newTreeDirNodeInput(`d2`)

      // ストアから以下の状態のノードリストが取得される
      // ・'d1'
      // ・'d1/d11'
      // ・'d1/d11/f111.txt'
      // ・'d2'
      td.when(storageService.getChildren(``)).thenReturn(toStorageNode([d1, d2]))
      td.when(storageService.getChildren(d1.path)).thenReturn(toStorageNode([d11]))
      td.when(storageService.getChildren(d11.path)).thenReturn(toStorageNode([f111]))

      await pageService.fetchInitialStorage(d11.path)
      const actual = pageService.getAllTreeNodes()

      // root
      // ├d1
      // │└d11
      // │  └f111.txt
      // └d2
      expect(actual.length).toBe(5)
      expect(actual[0].path).toBe(``)
      expect(actual[1].path).toBe(`d1`)
      expect(actual[2].path).toBe(`d1/d11`)
      expect(actual[3].path).toBe(`d1/d11/f111.txt`)
      expect(actual[4].path).toBe(`d2`)
      // ディレクトリが展開されているか検証
      expect(actual[0].opened).toBeTruthy()
      expect(actual[1].opened).toBeTruthy()
      expect(actual[2].opened).toBeFalsy()
      expect(actual[3].opened).toBeFalsy()
      expect(actual[4].opened).toBeFalsy()
      // 遅延ロードの設定を検証
      expect(actual[0].lazy).toBeTruthy()
      expect(actual[1].lazy).toBeTruthy()
      expect(actual[2].lazy).toBeTruthy()
      expect(actual[3].lazy).toBeFalsy()
      expect(actual[4].lazy).toBeTruthy()
      // 遅延ロード状態の検証
      expect(actual[0].lazyLoadStatus).toBe('loaded')
      expect(actual[1].lazyLoadStatus).toBe('loaded')
      expect(actual[2].lazyLoadStatus).toBe('loaded')
      expect(actual[3].lazyLoadStatus).toBe('none')
      expect(actual[4].lazyLoadStatus).toBe('none')
      // APIが呼び出されていないことを検証
      const exp1 = td.explain(storageService.fetchRoot)
      expect(exp1.calls.length).toBe(0)
      const exp2 = td.explain(storageService.fetchChildren)
      expect(exp2.calls.length).toBe(0)

      verifyParentChildRelationForTree(treeView)
    })

    it('nodeFilterが機能しているか検証', async () => {
      const { pageService, storageService, treeView } = newStoragePageService({ nodeFilter: StorageTreeNodeFilter.DirFilter })

      // root
      // ├[d1]
      // └[f1.txt]
      const d1 = newTreeDirNodeInput(`d1`)
      const f1 = newTreeFileNodeInput(`f1.txt`)

      // APIから以下の状態のノードリストが取得される
      // ・'d1'
      // ・'f1.txt'
      td.when(storageService.fetchChildren(``)).thenResolve(toStorageNode([d1, f1]))

      await pageService.fetchInitialStorage()
      const actual = pageService.getAllTreeNodes()

      // root
      // ├d1
      // └f1.txt ← nodeFilterで除外されるのでツリーには存在しない
      expect(actual.length).toBe(2)
      expect(actual[0].path).toBe(``)
      expect(actual[1].path).toBe(`d1`)

      verifyParentChildRelationForTree(treeView)
    })
  })

  describe('fetchStorageChildren', () => {
    it('対象ノードを指定した場合 - ルートノードを指定', async () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      // root ← 対象ノードに指定
      // ├d1
      // └d3
      const d1 = newTreeDirNodeInput(`d1`)
      const d2 = newTreeDirNodeInput(`d2`)
      const d3 = newTreeDirNodeInput(`d3`)
      pageService.setAllTreeNodes([d1, d3])

      // APIから以下の状態のノードリストが取得される
      // ・'d2'が追加された
      // ・'d3'が削除(または移動)された
      td.when(storageService.fetchChildren(``)).thenResolve(toStorageNode([d1, d2]))

      await pageService.fetchStorageChildren(``)
      const actual = pageService.getAllTreeNodes()
      const [_root, _d1, _d2] = actual

      // root
      // ├d1
      // └d2
      expect(actual.length).toBe(3)
      expect(_root.path).toBe(``)
      expect(_d1.path).toBe(`d1`)
      expect(_d2.path).toBe(`d2`)
      // 遅延ロード状態の検証
      expect(_root.lazyLoadStatus).toBe('loaded')
      expect(_d1.lazyLoadStatus).toBe('none')
      expect(_d2.lazyLoadStatus).toBe('none')

      verifyParentChildRelationForTree(treeView)
    })

    it('対象ノードを指定した場合 - ルートノード配下のディレクトリを指定', async () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      // root
      // └d1 ← 対象ノードに指定
      //   ├d11
      //   └d13
      const d1 = newTreeDirNodeInput(`d1`, { lazyLoadStatus: 'none' })
      const d11 = newTreeDirNodeInput(`d1/d11`)
      const d12 = newTreeDirNodeInput(`d1/d12`)
      const d13 = newTreeDirNodeInput(`d1/d13`)
      pageService.setAllTreeNodes([d1, d11, d13])

      // APIから以下の状態のノードリストが取得される
      // ・'d12'が追加された
      // ・'d13'が削除(または移動)された
      td.when(storageService.fetchChildren(d1.path)).thenResolve(toStorageNode([d11, d12]))

      await pageService.fetchStorageChildren(d1.path)
      const actual = pageService.getAllTreeNodes()
      const [_root, _d1, _d11, _d12] = actual

      // root
      // └d1
      //   ├d11
      //   └d12
      expect(actual.length).toBe(4)
      expect(_root.path).toBe(``)
      expect(_d1.path).toBe(`d1`)
      expect(_d11.path).toBe(`d1/d11`)
      expect(_d12.path).toBe(`d1/d12`)
      // 遅延ロード状態の検証
      expect(_d1.lazyLoadStatus).toBe('loaded')
      expect(_d11.lazyLoadStatus).toBe('none')
      expect(_d12.lazyLoadStatus).toBe('none')

      verifyParentChildRelationForTree(treeView)
    })

    it('nodeFilterが機能しているか検証', async () => {
      const { pageService, storageService, treeView } = newStoragePageService({ nodeFilter: StorageTreeNodeFilter.DirFilter })

      // root ← 対象ノードに指定
      // └d1
      const d1 = newTreeDirNodeInput(`d1`)
      const f1 = newTreeFileNodeInput(`f1.txt`)
      pageService.setAllTreeNodes([d1])

      // APIから以下の状態のノードリストが取得される
      // ・'f1.txt'が追加された
      td.when(storageService.fetchChildren(``)).thenResolve(toStorageNode([d1, f1]))

      await pageService.fetchStorageChildren(``)
      const actual = pageService.getAllTreeNodes()
      const [_root, _d1] = actual

      // root
      // ├d1
      // └f1.txt ← nodeFilterで除外されるのでツリーには存在しない
      expect(actual.length).toBe(2)
      expect(_root.path).toBe(``)
      expect(_d1.path).toBe(`d1`)

      verifyParentChildRelationForTree(treeView)
    })
  })

  describe('reloadStorageDir', () => {
    describe('deep: false', () => {
      it('対象ノードにルートノードを指定', async () => {
        const { pageService, storageService, treeView } = newStoragePageService()

        // root ← 対象ノードに指定
        // ├d1
        // │└d11
        // │  └f111.txt
        // ├d2
        // └f1.txt
        const d1 = newTreeDirNodeInput(`d1`, { lazyLoadStatus: 'none' })
        const d11 = newTreeDirNodeInput(`d1/d11`, { lazyLoadStatus: 'loaded' })
        const f111 = newStorageFileNode(`d1/d11/f111.txt`)
        const d2 = newTreeDirNodeInput(`d2`, { lazyLoadStatus: 'none' })
        const f1 = newStorageFileNode(`f1.txt`)
        const f2 = newStorageFileNode(`f2.txt`)
        pageService.setAllTreeNodes([d1, d11, f111, d2, f1])

        // 以下の状態のノードリストを再現する
        // ・'d2'が削除された
        // ・'f2.txt'が追加された
        // StorageService.getDirChildren()をモック化
        td.when(storageService.getDirChildren(``)).thenReturn(toStorageNode([d1, f1, f2]))

        // ルートノードを指定して実行
        await pageService.reloadStorageDir(``)
        const actual = pageService.getAllTreeNodes()
        const [_root, _d1, _d11, _f111, _f1, _f2] = actual

        // root
        // ├d1
        // │└d11
        // │  └f111.txt
        // ├f1.txt
        // └f2.txt
        expect(actual.length).toBe(6)
        expect(_root.path).toBe(``)
        expect(_d1.path).toBe(`d1`)
        expect(_d11.path).toBe(`d1/d11`)
        expect(_f111.path).toBe(`d1/d11/f111.txt`)
        expect(_f1.path).toBe(`f1.txt`)
        expect(_f2.path).toBe(`f2.txt`)
        // 遅延ロード状態の検証
        expect(_root.lazyLoadStatus).toBe('loaded')
        expect(_d1.lazyLoadStatus).toBe('none')
        expect(_d11.lazyLoadStatus).toBe('loaded')
        expect(_f111.lazyLoadStatus).toBe('none')
        expect(_f1.lazyLoadStatus).toBe('none')
        expect(_f2.lazyLoadStatus).toBe('none')
        // fetchHierarchicalChildren()が正常に呼び出されたか検証
        const exp = td.explain(storageService.fetchHierarchicalChildren)
        expect(exp.calls[0].args[0]).toBe(``)

        verifyParentChildRelationForTree(treeView)
      })

      it('対象ノードにルートノード配下のディレクトリを指定', async () => {
        const { pageService, storageService, treeView } = newStoragePageService()

        // root
        // ├d1
        // │├d11 ← 対象ノードに指定
        // ││├d111
        // │││├f1111.txt
        // │││└f1112.txt
        // ││└f111.txt
        // │└d12
        // └d2
        const d1 = newTreeDirNodeInput(`d1`, { lazyLoadStatus: 'none' })
        const d11 = newTreeDirNodeInput(`d1/d11`, { lazyLoadStatus: 'none' })
        const d111 = newTreeDirNodeInput(`d1/d11/d111`, { lazyLoadStatus: 'none' })
        const f1111 = newTreeFileNodeInput(`d1/d11/d111/f1111.txt`)
        const f1112 = newTreeFileNodeInput(`d1/d11/d111/f1112.txt`)
        const d112 = newTreeDirNodeInput(`d1/d11/d112`, { lazyLoadStatus: 'none' })
        const f111 = newTreeFileNodeInput(`d1/d11/f111.txt`)
        const f112 = newTreeFileNodeInput(`d1/d11/f112.txt`)
        const d12 = newTreeDirNodeInput(`d1/d12`, { lazyLoadStatus: 'none' })
        const d2 = newTreeDirNodeInput(`d2`, { lazyLoadStatus: 'none' })
        pageService.setAllTreeNodes([d1, d11, d111, f1111, f1112, f111, d12, d2], {
          lazyLoadStatus: 'none',
        })

        // 以下の状態のノードリストを再現する
        // ・'d1/d11/d111'が削除された
        // ・'d1/d11/d112'が追加された
        // ・'d1/d11/d111/f1112.txt'が'd1/d11/f113.txt'へ移動+リネームされた
        // ・'d1/d11/f111.txt'が削除され、その後また同じディレクトリに同じ名前でアップロードされた
        // ・'d1/d11/f112.txt'が追加された
        const renamed_f113 = cloneTreeNodeInput(f1112, { name: 'f113.txt', dir: `d1/d11`, path: `d1/d11/f113.txt` })
        const updated_f111 = cloneTreeNodeInput(f111, { id: StorageNode.generateId() })
        // StorageService.getNode()をモック化
        td.when(storageService.getNode({ path: d1.path })).thenReturn(toStorageNode(d1))
        // StorageService.getDirChildren()をモック化
        td.when(storageService.getDirChildren(d11.path)).thenReturn(toStorageNode([d11, d112, updated_f111, f112, renamed_f113]))

        // 'd1/d11'を指定して実行
        await pageService.reloadStorageDir(d11.path)
        const actual = pageService.getAllTreeNodes()
        const [_root, _d1, _d11, _d112, _f111, _f112, _f113, _d12, _d2] = actual

        // root
        // ├d1
        // │├d11
        // ││├d112
        // ││├f111.txt
        // ││├f112.txt
        // ││└f113.txt
        // │└d12
        // └d2
        expect(actual.length).toBe(9)
        expect(_root.path).toBe(``)
        expect(_d1.path).toBe(`d1`)
        expect(_d11.path).toBe(`d1/d11`)
        expect(_d112.path).toBe(`d1/d11/d112`)
        expect(_f111.path).toBe(`d1/d11/f111.txt`)
        expect(_f112.path).toBe(`d1/d11/f112.txt`)
        expect(_f113.path).toBe(`d1/d11/f113.txt`)
        expect(_d12.path).toBe(`d1/d12`)
        expect(_d2.path).toBe(`d2`)
        // 遅延ロード状態の検証
        // ・対象ノードに指定されたディレクトリと配下ディレクトリの遅延ロード状態が完了であることを確認
        // ・それ以外は遅延ロード状態に変化がないことを確認
        expect(_root.lazyLoadStatus).toBe('none')
        expect(_d1.lazyLoadStatus).toBe('none')
        expect(_d11.lazyLoadStatus).toBe('loaded')
        expect(_d112.lazyLoadStatus).toBe('none')
        expect(_f111.lazyLoadStatus).toBe('none')
        expect(_f112.lazyLoadStatus).toBe('none')
        expect(_f113.lazyLoadStatus).toBe('none')
        expect(_d12.lazyLoadStatus).toBe('none')
        expect(_d2.lazyLoadStatus).toBe('none')
        // StorageService.fetchHierarchicalChildren()が正常に呼び出されたか検証
        const exp = td.explain(storageService.fetchHierarchicalChildren)
        expect(exp.calls[0].args[0]).toBe(d11.path)

        verifyParentChildRelationForTree(treeView)
      })
    })

    describe('deep: false', () => {
      it('対象ノードにルートノードを指定', async () => {
        const { pageService, storageService, treeView } = newStoragePageService()

        // root ← 対象ノードに指定
        // ├d1
        // │├d11
        // ││└f111.txt
        // │└d12
        // └d2
        const d1 = newTreeDirNodeInput(`d1`, { lazyLoadStatus: 'none' })
        const d11 = newTreeDirNodeInput(`d1/d11`, { lazyLoadStatus: 'none' })
        const f111 = newStorageFileNode(`d1/d11/f111.txt`)
        const f112 = newStorageFileNode(`d1/d11/f112.txt`)
        const d12 = newTreeDirNodeInput(`d1/d12`, { lazyLoadStatus: 'none' })
        const d2 = newTreeDirNodeInput(`d2`, { lazyLoadStatus: 'none' })
        pageService.setAllTreeNodes([d1, d11, f111, d12, d2])

        // 以下の状態のノードリストを再現する
        // ・'d1/d11/f112.txt'が追加された
        // ・'d1/d12'が削除された
        // StorageService.getDirDescendants()をモック化
        td.when(storageService.getDirDescendants(``)).thenReturn(toStorageNode([d1, d11, f111, f112, d2]))

        // ルートノードを指定して実行
        await pageService.reloadStorageDir(``, { deep: true })
        const actual = pageService.getAllTreeNodes()
        const [_root, _d1, _d11, _f111, _f112, _d2] = actual

        // root
        // ├d1
        // │└d11
        // │  ├f111.txt
        // │  └f112.txt
        // └d2
        expect(actual.length).toBe(6)
        expect(_root.path).toBe(``)
        expect(_d1.path).toBe(`d1`)
        expect(_d11.path).toBe(`d1/d11`)
        expect(_f111.path).toBe(`d1/d11/f111.txt`)
        expect(_f112.path).toBe(`d1/d11/f112.txt`)
        expect(_d2.path).toBe(`d2`)
        // 遅延ロード状態の検証
        expect(_root.lazyLoadStatus).toBe('loaded')
        expect(_d1.lazyLoadStatus).toBe('loaded')
        expect(_d11.lazyLoadStatus).toBe('loaded')
        expect(_f111.lazyLoadStatus).toBe('none')
        expect(_f112.lazyLoadStatus).toBe('none')
        expect(_d2.lazyLoadStatus).toBe('loaded')
        // fetchHierarchicalDescendants()が正常に呼び出されたか検証
        const exp = td.explain(storageService.fetchHierarchicalDescendants)
        expect(exp.calls[0].args[0]).toBe(``)

        verifyParentChildRelationForTree(treeView)
      })

      it('対象ノードにルートノード配下のディレクトリを指定', async () => {
        const { pageService, storageService, treeView } = newStoragePageService()

        // root
        // ├d1
        // │├d11 ← 対象ノードに指定
        // ││├d111
        // │││├f1111.txt
        // │││└f1112.txt
        // ││└f111.txt
        // │└d12
        // └d2
        const d1 = newTreeDirNodeInput(`d1`, { lazyLoadStatus: 'none' })
        const d11 = newTreeDirNodeInput(`d1/d11`, { lazyLoadStatus: 'none' })
        const d111 = newTreeDirNodeInput(`d1/d11/d111`, { lazyLoadStatus: 'none' })
        const f1111 = newTreeFileNodeInput(`d1/d11/d111/f1111.txt`)
        const f1112 = newTreeFileNodeInput(`d1/d11/d111/f1112.txt`)
        const d112 = newTreeDirNodeInput(`d1/d11/d112`, { lazyLoadStatus: 'none' })
        const f111 = newTreeFileNodeInput(`d1/d11/f111.txt`)
        const f112 = newTreeFileNodeInput(`d1/d11/f112.txt`)
        const d12 = newTreeDirNodeInput(`d1/d12`, { lazyLoadStatus: 'none' })
        const d2 = newTreeDirNodeInput(`d2`, { lazyLoadStatus: 'none' })
        pageService.setAllTreeNodes([d1, d11, d111, f1111, f1112, f111, d12, d2], {
          lazyLoadStatus: 'none',
        })

        // 以下の状態のノードリストを再現する
        // ・'d1/d11/d111'が削除された
        // ・'d1/d11/d112'が追加された
        // ・'d1/d11/d111/f1112.txt'が'd1/d11/f113.txt'へ移動+リネームされた
        // ・'d1/d11/f111.txt'が削除され、その後また同じディレクトリに同じ名前でアップロードされた
        // ・'d1/d11/f112.txt'が追加された
        const renamed_f113 = cloneTreeNodeInput(f1112, { name: 'f113.txt', dir: `d1/d11`, path: `d1/d11/f113.txt` })
        const updated_f111 = cloneTreeNodeInput(f111, { id: StorageNode.generateId() })
        // StorageService.getNode()をモック化
        td.when(storageService.getNode({ path: d1.path })).thenReturn(toStorageNode(d1))
        // StorageService.getDirDescendants()をモック化
        td.when(storageService.getDirDescendants(d11.path)).thenReturn(toStorageNode([d11, d112, updated_f111, f112, renamed_f113]))

        // 'd1/d11'を指定して実行
        await pageService.reloadStorageDir(d11.path, { deep: true })
        const actual = pageService.getAllTreeNodes()
        const [_root, _d1, _d11, _d112, _f111, _f112, _f113, _d12, _d2] = actual

        // root
        // ├d1
        // │├d11
        // ││├d112
        // ││├f111.txt
        // ││├f112.txt
        // ││└f113.txt
        // │└d12
        // └d2
        expect(actual.length).toBe(9)
        expect(_root.path).toBe(``)
        expect(_d1.path).toBe(`d1`)
        expect(_d11.path).toBe(`d1/d11`)
        expect(_d112.path).toBe(`d1/d11/d112`)
        expect(_f111.path).toBe(`d1/d11/f111.txt`)
        expect(_f112.path).toBe(`d1/d11/f112.txt`)
        expect(_f113.path).toBe(`d1/d11/f113.txt`)
        expect(_d12.path).toBe(`d1/d12`)
        expect(_d2.path).toBe(`d2`)
        // 遅延ロード状態の検証
        // ・対象ノードに指定されたディレクトリと配下ディレクトリの遅延ロード状態が完了であることを確認
        // ・それ以外は遅延ロード状態に変化がないことを確認
        expect(_root.lazyLoadStatus).toBe('none')
        expect(_d1.lazyLoadStatus).toBe('none')
        expect(_d11.lazyLoadStatus).toBe('loaded')
        expect(_d112.lazyLoadStatus).toBe('loaded')
        expect(_f111.lazyLoadStatus).toBe('none')
        expect(_f112.lazyLoadStatus).toBe('none')
        expect(_f113.lazyLoadStatus).toBe('none')
        expect(_d12.lazyLoadStatus).toBe('none')
        expect(_d2.lazyLoadStatus).toBe('none')
        // StorageService.fetchHierarchicalDescendants()が正常に呼び出されたか検証
        const exp = td.explain(storageService.fetchHierarchicalDescendants)
        expect(exp.calls[0].args[0]).toBe(d11.path)

        verifyParentChildRelationForTree(treeView)
      })
    })

    it('対象ノードが削除されていた場合', async () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      // root
      // ├d1
      // │├d11
      // ││└d111 ← 対象ノードに指定
      // ││  └f1111.txt
      // │└d12
      // └d2
      const d1 = newTreeDirNodeInput(`d1`, { lazyLoadStatus: 'none' })
      const d11 = newTreeDirNodeInput(`d1/d11`, { lazyLoadStatus: 'none' })
      const d111 = newTreeDirNodeInput(`d1/d11/d111`, { lazyLoadStatus: 'none' })
      const f1111 = newTreeFileNodeInput(`d1/d11/d111/f1111.txt`)
      const d12 = newTreeDirNodeInput(`d1/d12`, { lazyLoadStatus: 'none' })
      const d2 = newTreeDirNodeInput(`d2`, { lazyLoadStatus: 'none' })
      pageService.setAllTreeNodes([d1, d11, d111, f1111, d12, d2])

      // 以下の状態のノードリストを再現する
      // ・'d1/d11/d111'が削除され存在しない
      // StorageService.getNode()をモック化
      td.when(storageService.getNode({ path: d1.path })).thenReturn(toStorageNode(d1))
      td.when(storageService.getNode({ path: d11.path })).thenReturn(toStorageNode(d11))
      td.when(storageService.getNode({ path: d111.path })).thenReturn(undefined)
      // StorageService.getDirDescendants()をモック化
      td.when(storageService.getDirDescendants(d111.path)).thenReturn([])

      // 'd1/d11/d111'を指定して実行
      await pageService.reloadStorageDir(d111.path, { deep: true })
      const actual = pageService.getAllTreeNodes()
      const [_root, _d1, _d11, _d12, _d2] = actual

      // root
      // ├d1
      // │├d11
      // │└d12
      // └d2
      expect(actual.length).toBe(5)
      expect(_root.path).toBe(``)
      expect(_d1.path).toBe(`d1`)
      expect(_d11.path).toBe(`d1/d11`)
      expect(_d12.path).toBe(`d1/d12`)
      expect(_d2.path).toBe(`d2`)
      // 遅延ロード状態の検証
      expect(_root.lazyLoadStatus).toBe('none')
      expect(_d1.lazyLoadStatus).toBe('none')
      expect(_d11.lazyLoadStatus).toBe('none')
      expect(_d12.lazyLoadStatus).toBe('none')
      expect(_d2.lazyLoadStatus).toBe('none')
      // StorageService.fetchHierarchicalDescendants()が正常に呼び出されたか検証
      const exp = td.explain(storageService.fetchHierarchicalDescendants)
      expect(exp.calls[0].args[0]).toBe(d111.path)

      verifyParentChildRelationForTree(treeView)
    })

    it('対象ノードの上位ノードが削除されていた場合', async () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      // root
      // ├d1
      // │├d11
      // ││└d111 ← 対象ノードに指定
      // ││  └f1111.txt
      // │└d12
      // └d2
      const d1 = newTreeDirNodeInput(`d1`, { lazyLoadStatus: 'none' })
      const d11 = newTreeDirNodeInput(`d1/d11`, { lazyLoadStatus: 'none' })
      const d111 = newTreeDirNodeInput(`d1/d11/d111`, { lazyLoadStatus: 'none' })
      const f1111 = newTreeFileNodeInput(`d1/d11/d111/f1111.txt`)
      const d12 = newTreeDirNodeInput(`d1/d12`, { lazyLoadStatus: 'none' })
      const d2 = newTreeDirNodeInput(`d2`, { lazyLoadStatus: 'none' })
      pageService.setAllTreeNodes([d1, d11, d111, f1111, d12, d2])

      // 以下の状態のノードリストを再現する
      // ・'d1/d11'が削除され存在しない
      // StorageService.getNode()をモック化
      td.when(storageService.getNode({ path: d1.path })).thenReturn(toStorageNode(d1))
      td.when(storageService.getNode({ path: d11.path })).thenReturn(undefined)
      td.when(storageService.getNode({ path: d111.path })).thenReturn(undefined)
      // StorageService.getDirDescendants()をモック化
      td.when(storageService.getDirDescendants(d111.path)).thenReturn([])

      // 'd1/d11/d111'を指定して実行
      await pageService.reloadStorageDir(d111.path, { deep: true })
      const actual = pageService.getAllTreeNodes()
      const [_root, _d1, _d12, _d2] = actual

      // root
      // ├d1
      // │└d12
      // └d2
      expect(actual.length).toBe(4)
      expect(_root.path).toBe(``)
      expect(_d1.path).toBe(`d1`)
      expect(_d12.path).toBe(`d1/d12`)
      expect(_d2.path).toBe(`d2`)
      // 遅延ロード状態の検証
      expect(_root.lazyLoadStatus).toBe('none')
      expect(_d1.lazyLoadStatus).toBe('none')
      expect(_d12.lazyLoadStatus).toBe('none')
      expect(_d2.lazyLoadStatus).toBe('none')
      // StorageService.fetchHierarchicalDescendants()が正常に呼び出されたか検証
      const exp = td.explain(storageService.fetchHierarchicalDescendants)
      expect(exp.calls[0].args[0]).toBe(d111.path)

      verifyParentChildRelationForTree(treeView)
    })

    it('nodeFilterが機能しているか検証', async () => {
      const { pageService, storageService, treeView } = newStoragePageService({ nodeFilter: StorageTreeNodeFilter.DirFilter })

      // root ←対象ノードに指定
      // └d1
      const d1 = newTreeDirNodeInput(`d1`)
      const f1 = newTreeFileNodeInput(`f1.txt`)
      pageService.setAllTreeNodes([d1])

      // 以下の状態のノードリストを再現する
      // ・'f1.txt'が追加された
      // StorageService.getDirDescendants()をモック化
      td.when(storageService.getDirDescendants(``)).thenReturn([d1, f1])

      // ルートノードを指定して実行
      await pageService.reloadStorageDir(``, { deep: true })
      const actual = pageService.getAllTreeNodes()
      const [_root, _d1] = actual

      // root
      // ├d1
      // └f1.txt ← nodeFilterで除外されるのでツリーには存在しない
      expect(actual.length).toBe(2)
      expect(_root.path).toBe(``)
      expect(_d1.path).toBe(`d1`)

      verifyParentChildRelationForTree(treeView)
    })
  })

  describe('createStorageDir', () => {
    it('ベーシックケース', async () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      // root
      // └d1
      //   └d12
      const d1 = newTreeDirNodeInput(`d1`)
      const d12 = newTreeDirNodeInput(`d1/d12`)
      pageService.setAllTreeNodes([d1, d12])

      // モック設定
      {
        const d11 = newTreeDirNodeInput(`d1/d11`)

        td.when(storageService.createDir(`d1/d11`)).thenResolve(toStorageNode(d11))
      }

      // 'd1/d11'を作成
      await pageService.createStorageDir(`d1/d11`)

      // root
      // └d1
      //   └d11
      const _d1 = pageService.getTreeNode(`d1`)!
      const _d1_descendants = _d1.getDescendants()
      const [_d11, _d12] = _d1_descendants
      expect(_d1_descendants.length).toBe(2)
      expect(_d11.path).toBe(`d1/d11`)
      expect(_d12.path).toBe(`d1/d12`)

      expect(_d11.lazyLoadStatus).toBe('loaded')

      verifyParentChildRelationForTree(treeView)
    })

    it('ルートディレクトリ直下に作成', async () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      // root
      // └d2
      const d2 = newTreeDirNodeInput(`d2`)
      pageService.setAllTreeNodes([d2])

      // モック設定
      {
        const d1 = newTreeDirNodeInput(`d1`)

        td.when(storageService.createDir(`d1`)).thenResolve(toStorageNode(d1))
      }

      // 'd1'を作成
      await pageService.createStorageDir(`d1`)

      // root
      // ├d1
      // └d2
      const _root = pageService.getTreeNode(``)!
      const _root_descendants = _root.getDescendants()
      const [_d1, _d2] = _root_descendants
      expect(_root_descendants.length).toBe(2)
      expect(_d1.path).toBe(`d1`)
      expect(_d2.path).toBe(`d2`)

      expect(_d1.lazyLoadStatus).toBe('loaded')

      verifyParentChildRelationForTree(treeView)
    })

    it('APIでエラーが発生した場合', async () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      pageService.setAllTreeNodes([])

      td.when(storageService.createDir(`dA`)).thenReject(new Error())

      await pageService.createStorageDir(`dA`)

      // ノードリストに変化がないことを検証
      expect(pageService.getAllTreeNodes()).toEqual([pageService.getRootTreeNode()])
    })
  })

  describe('createArticleTypeDir', () => {
    it('バンドルの作成', async () => {
      const { pageService, storageService, treeView } = newStoragePageService({ storageType: 'article' })
      const articleService = storageService as ArticleStorageService

      // articles
      // └[バンドル]
      const bundle = newTreeDirNodeInput(`${StorageNode.generateId()}`, {
        article: {
          dir: {
            type: 'TreeBundle',
            name: 'バンドル',
            sortOrder: 1,
          },
        },
        lazyLoadStatus: 'none',
      })
      pageService.setAllTreeNodes([])

      const bundleInput: CreateArticleTypeDirInput = {
        dir: bundle.dir,
        name: bundle.article?.dir?.name!,
        type: bundle.article?.dir?.type!,
      }

      // モック設定
      td.when(articleService.createArticleTypeDir(bundleInput)).thenResolve(toStorageNode(bundle))

      // 'バンドル'を作成
      await pageService.createArticleTypeDir(bundleInput)

      // articles
      // └バンドル
      const _bundle = pageService.getTreeNode(bundle.path)!
      expect(_bundle.path).toBe(bundle.path)

      expect(_bundle.lazyLoadStatus).toBe('loaded')

      verifyParentChildRelationForTree(treeView)
    })

    it('カテゴリの作成', async () => {
      const { pageService, storageService, treeView } = newStoragePageService({ storageType: 'article' })
      const articleService = storageService as ArticleStorageService

      // articles
      // └バンドル
      //   └[カテゴリ1]
      const bundle = newTreeDirNodeInput(`${StorageNode.generateId()}`, {
        article: {
          dir: {
            type: 'TreeBundle',
            name: 'バンドル',
            sortOrder: 1,
          },
        },
        lazyLoadStatus: 'loaded',
      })
      const cat1 = newTreeDirNodeInput(`${bundle.path}/${StorageNode.generateId()}`, {
        article: {
          dir: {
            type: 'Category',
            name: 'カテゴリ1',
            sortOrder: 1,
          },
        },
        lazyLoadStatus: 'none',
      })
      pageService.setAllTreeNodes([bundle])

      const cat1Input: CreateArticleTypeDirInput = {
        dir: cat1.dir,
        name: cat1.article?.dir?.name!,
        type: cat1.article?.dir?.type!,
      }

      // モック設定
      td.when(articleService.createArticleTypeDir(cat1Input)).thenResolve(toStorageNode(cat1))

      // 'バンドル/カテゴリ1'を作成
      await pageService.createArticleTypeDir(cat1Input)

      // articles
      // └バンドル
      //   └カテゴリ1
      const _bundle = pageService.getTreeNode(bundle.path)!
      const _bundle_descendants = _bundle.getDescendants()
      const [_cat1] = _bundle_descendants
      expect(_bundle_descendants.length).toBe(1)
      expect(_cat1.path).toBe(cat1.path)

      expect(_bundle.lazyLoadStatus).toBe('loaded')
      expect(_cat1.lazyLoadStatus).toBe('loaded')

      verifyParentChildRelationForTree(treeView)
    })

    it('記事の作成', async () => {
      const { pageService, storageService, treeView } = newStoragePageService({ storageType: 'article' })
      const articleService = storageService as ArticleStorageService
      const config = useConfig()

      // articles
      // └バンドル
      //   └[記事1]
      //     ├[index1.md]
      //     └[index1.draft.md]
      const bundle = newTreeDirNodeInput(`${StorageNode.generateId()}`, {
        article: {
          dir: {
            type: 'TreeBundle',
            name: 'バンドル',
            sortOrder: 1,
          },
        },
        lazyLoadStatus: 'loaded',
      })
      const art1 = newTreeDirNodeInput(`${bundle.path}/${StorageNode.generateId()}`, {
        article: {
          dir: {
            type: 'Article',
            name: '記事1',
            sortOrder: 1,
          },
        },
        lazyLoadStatus: 'none',
      })
      const art1_master = newTreeFileNodeInput(StorageUtil.toArticleSrcMasterPath(art1.path), {
        article: { file: { type: 'Master' } },
      })
      const art1_draft = newTreeFileNodeInput(StorageUtil.toArticleSrcDraftPath(art1.path), {
        article: { file: { type: 'Draft' } },
      })
      pageService.setAllTreeNodes([bundle])

      const art1Input: CreateArticleTypeDirInput = {
        dir: art1.dir,
        name: art1.article?.dir?.name!,
        type: art1.article?.dir?.type!,
      }

      // モック設定
      td.when(articleService.createArticleTypeDir(art1Input)).thenResolve(toStorageNode(art1))
      td.when(articleService.getChildren(art1.path)).thenReturn(toStorageNode([art1_master, art1_draft]))

      // 'バンドル/記事1'を作成
      await pageService.createArticleTypeDir(art1Input)

      // articles
      // └バンドル
      //   └カテゴリ1
      //     ├index1.md
      //     └[index1.draft.md] ← 下書きはツリーには表示されない
      const _bundle = pageService.getTreeNode(bundle.path)!
      const _bundle_descendants = _bundle.getDescendants()
      const [_art1, _art1_master, _art1_draft] = _bundle_descendants
      expect(_bundle_descendants.length).toBe(2)
      expect(_art1.path).toBe(art1.path)
      expect(_art1_master.path).toBe(art1_master.path)

      expect(_bundle.lazyLoadStatus).toBe('loaded')
      expect(_art1.lazyLoadStatus).toBe('loaded')

      verifyParentChildRelationForTree(treeView)
    })

    it('APIでエラーが発生した場合', async () => {
      const { pageService, storageService, treeView } = newStoragePageService({ storageType: 'article' })
      const articleService = storageService as ArticleStorageService

      const bundle = newTreeDirNodeInput(`${StorageNode.generateId()}`, {
        article: {
          dir: {
            type: 'TreeBundle',
            name: 'バンドル',
            sortOrder: 1,
          },
        },
        lazyLoadStatus: 'none',
      })
      pageService.setAllTreeNodes([])

      const bundleInput: CreateArticleTypeDirInput = {
        dir: bundle.dir,
        name: bundle.article?.dir?.name!,
        type: bundle.article?.dir?.type!,
      }

      td.when(articleService.createArticleTypeDir(bundleInput)).thenReject(new Error())

      await pageService.createArticleTypeDir(bundleInput)

      // ノードリストに変化がないことを検証
      expect(pageService.getAllTreeNodes()).toEqual([pageService.getRootTreeNode()])
    })

    it('ストレージタイプが｢記事｣以外で実行した場合', async () => {
      const { pageService, storageService, treeView } = newStoragePageService({ storageType: 'app' })

      const bundle = newTreeDirNodeInput(`${StorageNode.generateId()}`, {
        article: {
          dir: {
            type: 'TreeBundle',
            name: 'バンドル',
            sortOrder: 1,
          },
        },
        lazyLoadStatus: 'none',
      })
      pageService.setAllTreeNodes([])

      const bundleInput: CreateArticleTypeDirInput = {
        dir: bundle.dir,
        name: bundle.article?.dir?.name!,
        type: bundle.article?.dir?.type!,
      }

      let actual!: Error
      try {
        await pageService.createArticleTypeDir(bundleInput)
      } catch (err) {
        actual = err
      }

      expect(actual.message).toBe(`This method cannot be executed by storageType 'app'.`)
    })
  })

  describe('removeStorageNodes', () => {
    it('ベーシックケース', async () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      // root
      // ├dev
      // │├projects ← 削除
      // ││└blog
      // ││  └src
      // ││    └index.html
      // │└memo.txt ← 削除
      // └work
      const dev = newTreeDirNodeInput(`dev`)
      const projects = newTreeDirNodeInput(`dev/projects`)
      const blog = newTreeDirNodeInput(`dev/projects/blog`)
      const src = newTreeDirNodeInput(`dev/projects/blog/src`)
      const index = newTreeFileNodeInput(`dev/projects/blog/src/index.html`)
      const memo = newTreeFileNodeInput(`dev/memo.txt`)
      const work = newTreeDirNodeInput(`work`)
      pageService.setAllTreeNodes([dev, projects, blog, src, index, memo, work])

      // モック設定
      td.when(storageService.sgetNode({ path: `dev/projects` })).thenReturn(toStorageNode(projects))
      td.when(storageService.sgetNode({ path: `dev/memo.txt` })).thenReturn(toStorageNode(memo))

      // 'dev/projects'と'dev/memo.txt'を削除
      await pageService.removeStorageNodes([`dev/projects`, `dev/memo.txt`])

      // root
      // ├dev
      // └work
      const _roo_descendants = pageService.getRootTreeNode().getDescendants()
      expect(_roo_descendants.length).toBe(2)
      expect(_roo_descendants[0].path).toBe(`dev`)
      expect(_roo_descendants[1].path).toBe(`work`)

      const exp1 = td.explain(storageService.removeDir)
      expect(exp1.calls[0].args[0]).toBe(`dev/projects`)
      const exp2 = td.explain(storageService.removeFile)
      expect(exp2.calls[0].args[0]).toBe(`dev/memo.txt`)

      verifyParentChildRelationForTree(treeView)
    })

    it('ルートディレクトリ直下のノードを削除', async () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      // root
      // ├dev
      // │├projects
      // ││└blog
      // ││  └src
      // ││    └index.html
      // │└memo.txt
      // └work
      const dev = newTreeDirNodeInput(`dev`)
      const projects = newTreeDirNodeInput(`dev/projects`)
      const blog = newTreeDirNodeInput(`dev/projects/blog`)
      const src = newTreeDirNodeInput(`dev/projects/blog/src`)
      const index = newTreeFileNodeInput(`dev/projects/blog/src/index.html`)
      const memo = newTreeFileNodeInput(`dev/memo.txt`)
      const work = newTreeDirNodeInput(`work`)
      pageService.setAllTreeNodes([dev, projects, blog, src, index, memo, work])

      // モック設定
      td.when(storageService.sgetNode({ path: `dev` })).thenReturn(toStorageNode(dev))

      // 'dev'を削除
      await pageService.removeStorageNodes([`dev`])

      // root
      // └work
      const _roo_descendants = pageService.getRootTreeNode().getDescendants()
      expect(_roo_descendants.length).toBe(1)
      expect(_roo_descendants[0].path).toBe(`work`)

      const exp = td.explain(storageService.removeDir)
      expect(exp.calls[0].args[0]).toBe(`dev`)

      verifyParentChildRelationForTree(treeView)
    })

    it('存在しないパスを指定した場合', async () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      pageService.setAllTreeNodes([])

      // モック設定
      const expected = new Error()
      td.when(storageService.sgetNode({ path: `dXXX` })).thenThrow(expected)

      let actual!: Error
      try {
        await pageService.removeStorageNodes([`dXXX`])
      } catch (err) {
        actual = err
      }

      expect(actual).toBe(expected)
    })

    it('APIでエラーが発生した場合', async () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      // root
      // ├dev
      // │├projects ← 削除
      // ││└blog
      // ││  └src
      // ││    └index.html
      // │└memo.txt ← 削除
      // └work
      const dev = newTreeDirNodeInput(`dev`)
      const projects = newTreeDirNodeInput(`dev/projects`)
      const blog = newTreeDirNodeInput(`dev/projects/blog`)
      const src = newTreeDirNodeInput(`dev/projects/blog/src`)
      const index = newTreeFileNodeInput(`dev/projects/blog/src/index.html`)
      const memo = newTreeFileNodeInput(`dev/memo.txt`)
      const work = newTreeDirNodeInput(`work`)
      pageService.setAllTreeNodes([dev, projects, blog, src, index, memo, work])

      // モック設定
      {
        td.when(storageService.sgetNode({ path: `dev/projects` })).thenReturn(toStorageNode(projects))
        td.when(storageService.sgetNode({ path: `dev/memo.txt` })).thenReturn(toStorageNode(memo))
        // 'dev/projects'の削除でAPIエラーを発生させる
        td.when(storageService.removeDir(`dev/projects`)).thenReject(new Error())
        td.when(storageService.removeFile(`dev/memo.txt`)).thenResolve()
      }

      // 'dev/projects'と'dev/memo.txt'を削除
      await pageService.removeStorageNodes([`dev/projects`, `dev/memo.txt`])

      // root
      // ├dev
      // │└projects ← 削除されなかった
      // │  └blog
      // │    └src
      // │      └index.html
      // └work
      const _root_children = pageService.getRootTreeNode().children
      expect(_root_children[0].path).toBe(`dev`)
      expect(_root_children[1].path).toBe(`work`)

      // 'dev/projects'は削除されていないことを検証
      // ※'dev/memo.txt'は削除されている
      const _projects = pageService.getTreeNode(`dev/projects`)!
      const _projects_descendants = _projects.getDescendants()
      expect(_projects_descendants.length).toBe(3)
      expect(_projects_descendants[0].path).toBe(`dev/projects/blog`)
      expect(_projects_descendants[1].path).toBe(`dev/projects/blog/src`)
      expect(_projects_descendants[2].path).toBe(`dev/projects/blog/src/index.html`)

      verifyParentChildRelationForTree(treeView)
    })
  })

  describe('moveStorageNodes', () => {
    it('ベーシックケース', async () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      // root
      // ├dev
      // │├projects ← workへ移動
      // ││└blog
      // ││  └src
      // │└memo.txt ← workへ移動
      // └work ← クライアントに読み込まれていない
      const dev = newTreeDirNodeInput(`dev`, { lazyLoadStatus: 'loaded' })
      const projects = newTreeDirNodeInput(`dev/projects`, { lazyLoadStatus: 'loaded' })
      const blog = newTreeDirNodeInput(`dev/projects/blog`, { lazyLoadStatus: 'loaded' })
      const src = newTreeDirNodeInput(`dev/projects/blog/src`)
      const memo = newTreeFileNodeInput(`dev/memo.txt`)
      const work = newTreeDirNodeInput(`work`)
      pageService.setAllTreeNodes([dev, projects, blog, src, memo])

      // モック設定
      {
        const to_projects = cloneTreeNodeInput(projects, { dir: `work`, path: `work/projects` })
        const to_blog = cloneTreeNodeInput(blog, { dir: `work/projects`, path: `work/projects/blog` })
        const to_src = cloneTreeNodeInput(src, { dir: `work/projects/blog`, path: `work/projects/blog/src` })
        const to_memo = cloneTreeNodeInput(memo, { dir: `work`, path: `work/memo.txt` })

        // 0. 対象ノードの取得
        td.when(storageService.sgetNode({ path: `dev/projects` })).thenReturn(toStorageNode(projects))
        td.when(storageService.sgetNode({ path: `dev/memo.txt` })).thenReturn(toStorageNode(memo))

        // 1. APIによる移動処理を実行
        td.when(storageService.moveDir(`dev/projects`, `work/projects`)).thenResolve(toStorageNode([to_projects, to_blog, to_src]))
        td.when(storageService.moveFile(`dev/memo.txt`, `work/memo.txt`)).thenResolve(toStorageNode(to_memo))

        // 2. 移動先ディレクトリとその上位ディレクトリ階層の取得
        td.when(storageService.getHierarchicalNodes(`work`)).thenResolve(toStorageNode([work]))
      }

      // 'dev/projects'と'dev/memo.txt'を'work'へ移動
      await pageService.moveStorageNodes([`dev/projects`, `dev/memo.txt`], `work`)

      // root
      // ├dev
      // └work
      //   ├projects
      //   │└blog
      //   │  └src
      //   └memo.txt

      // 'dev'の階層構造の検証
      {
        const _dev = pageService.getTreeNode(`dev`)!
        // 子孫ノードの検証
        expect(_dev.getDescendants().length).toBe(0)
      }
      // 'work'の階層構造の検証
      {
        const _work = pageService.getTreeNode(`work`)!
        // 子孫ノードの検証
        const _work_descendants = _work.getDescendants()
        const [_projects, _blog, _src, _memo] = _work_descendants
        expect(_work_descendants.length).toBe(4)
        expect(_projects.path).toBe(`work/projects`)
        expect(_blog.path).toBe(`work/projects/blog`)
        expect(_src.path).toBe(`work/projects/blog/src`)
        expect(_memo.path).toBe(`work/memo.txt`)
        // ディレクトリノードの遅延ロード状態の検証
        expect(_work.lazyLoadStatus).toBe('none')
        expect(_projects.lazyLoadStatus).toBe('loaded')
        expect(_blog.lazyLoadStatus).toBe('loaded')
        expect(_src.lazyLoadStatus).toBe('none')
      }

      verifyParentChildRelationForTree(treeView)
    })

    it('ルートディレクトリへ移動', async () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      // root
      // └dB
      //   ├dA ← ルートディレクトリへ移動
      //   │└fileA.txt
      //   └fileB.txt ← ルートディレクトリへ移動
      const dB = newTreeDirNodeInput(`dB`, { lazyLoadStatus: 'loaded' })
      const dA = newTreeDirNodeInput(`dB/dA`, { lazyLoadStatus: 'loaded' })
      const fileA = newTreeFileNodeInput(`dB/dA/fileA.txt`)
      const fileB = newTreeFileNodeInput(`dB/fileB.txt`)
      pageService.setAllTreeNodes([dB, dA, fileA, fileB])

      // モック設定
      {
        const to_dA = cloneTreeNodeInput(dA, { dir: ``, path: `dA` })
        const to_fileA = cloneTreeNodeInput(fileA, { dir: `dA`, path: `dA/fileA.txt` })
        const to_fileB = cloneTreeNodeInput(fileB, { dir: ``, path: `fileB.txt` })

        // 0. 対象ノードの取得
        td.when(storageService.sgetNode({ path: `dB/dA` })).thenReturn(toStorageNode(dA))
        td.when(storageService.sgetNode({ path: `dB/fileB.txt` })).thenReturn(toStorageNode(fileB))

        // 1. APIによる移動処理を実行
        td.when(storageService.moveDir(`dB/dA`, `dA`)).thenResolve(toStorageNode([to_dA, to_fileA]))
        td.when(storageService.moveFile(`dB/fileB.txt`, `fileB.txt`)).thenResolve(toStorageNode(to_fileB))

        // 2. 移動先ディレクトリとその上位ディレクトリ階層の取得
        td.when(storageService.getHierarchicalNodes(``)).thenResolve([])
      }

      // 'dB/dA'と'dB/fileB.txt'をルートノードへ移動
      await pageService.moveStorageNodes([`dB/dA`, `dB/fileB.txt`], ``)

      // root
      // ├dA
      // │└fileA.txt
      // ├dB
      // └fileB.txt

      // 'root'の階層構造の検証
      {
        const _root = pageService.getTreeNode(``)!
        // 子孫ノードの検証
        expect(_root.children.length).toBe(3)
        const [_dA, _dB, _fileB] = _root.children
        expect(_dA.path).toBe(`dA`)
        expect(_dB.path).toBe(`dB`)
        expect(_fileB.path).toBe(`fileB.txt`)
      }
      // 'dA'の階層構造の検証
      {
        const _dA = pageService.getTreeNode(`dA`)!
        // 子孫ノードの検証
        expect(_dA.children.length).toBe(1)
        const [_fileA] = _dA.children
        expect(_fileA.path).toBe(`dA/fileA.txt`)
        // ディレクトリノードの遅延ロード状態の検証
        expect(_dA.lazyLoadStatus).toBe('loaded')
      }
      // 'dB'の階層構造の検証
      {
        const _dB = pageService.getTreeNode(`dB`)!
        // 子孫ノードの検証
        expect(_dB.children.length).toBe(0)
      }

      verifyParentChildRelationForTree(treeView)
    })

    it('移動先に同名のディレクトリまたはファイルが存在する場合', async () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      // root
      // ├dA
      // │└d1 ← 移動するノード
      // │  ├d11
      // │  │└d111
      // │  │  ├fileA.txt
      // │  │  └fileB.txt
      // │  ├d12
      // │  ├d14
      // │  ├fileX.txt
      // │  └fileY.txt
      // └dB
      //   └d1 ← ここへ上書き移動
      //     ├d11
      //     │└d111
      //     │  ├fileA.txt
      //     │  └fileC.txt
      //     ├d13
      //     ├d14
      //     ├fileX.txt
      //     └fileZ.txt
      const dA = newTreeDirNodeInput(`dA`, { lazyLoadStatus: 'loaded' })
      const dA_d1 = newTreeDirNodeInput(`dA/d1`, { lazyLoadStatus: 'loaded' })
      const dA_d11 = newTreeDirNodeInput(`dA/d1/d11`, { lazyLoadStatus: 'loaded' })
      const dA_d111 = newTreeDirNodeInput(`dA/d1/d11/d111`, { lazyLoadStatus: 'loaded' })
      const dA_fileA = newTreeFileNodeInput(`dA/d1/d11/d111/fileA.txt`)
      const dA_fileB = newTreeFileNodeInput(`dA/d1/d11/d111/fileB.txt`)
      const dA_d12 = newTreeDirNodeInput(`dA/d1/d12`)
      const dA_d14 = newTreeDirNodeInput(`dA/d1/d14`, { lazyLoadStatus: 'loaded' })
      const dA_fileX = newTreeFileNodeInput(`dA/d1/fileX.txt`)
      const dA_fileY = newTreeFileNodeInput(`dA/d1/fileY.txt`)
      const dB = newTreeDirNodeInput(`dB`)
      const dB_d1 = newTreeDirNodeInput(`dB/d1`, { lazyLoadStatus: 'loaded' })
      const dB_d11 = newTreeDirNodeInput(`dB/d1/d11`, { lazyLoadStatus: 'loaded' })
      const dB_d111 = newTreeDirNodeInput(`dB/d1/d11/d111`, { lazyLoadStatus: 'loaded' })
      const dB_fileA = newTreeFileNodeInput(`dB/d1/d11/d111/fileA.txt`)
      const dB_fileC = newTreeFileNodeInput(`dB/d1/d11/d111/fileC.txt`)
      const dB_d13 = newTreeDirNodeInput(`dB/d1/d13`)
      const dB_d14 = newTreeDirNodeInput(`dB/d1/d14`)
      const dB_fileX = newTreeFileNodeInput(`dB/d1/fileX.txt`)
      const dB_fileZ = newTreeFileNodeInput(`dB/d1/fileZ.txt`)
      pageService.setAllTreeNodes([
        dA,
        dA_d1,
        dA_d11,
        dA_d111,
        dA_fileA,
        dA_fileB,
        dA_d12,
        dA_d14,
        dA_fileX,
        dA_fileY,
        dB,
        dB_d1,
        dB_d11,
        dB_d111,
        dB_fileA,
        dB_fileC,
        dB_d13,
        dB_d14,
        dB_fileX,
        dB_fileZ,
      ])

      // モック設定
      {
        const to_dB_d1 = cloneTreeNodeInput(dA_d1, { dir: `dB`, path: `dB/d1` })
        const to_dB_d11 = cloneTreeNodeInput(dA_d11, { dir: `dB/d1`, path: `dB/d1/d11` })
        const to_dB_d111 = cloneTreeNodeInput(dA_d111, { dir: `dB/d1/d11`, path: `dB/d1/d11/d111` })
        const to_dB_fileA = cloneTreeNodeInput(dA_fileA, { dir: `dB/d1/d11/d111`, path: `dB/d1/d11/d111/fileA.txt` })
        const to_dB_fileB = cloneTreeNodeInput(dA_fileB, { dir: `dB/d1/d11/d111`, path: `dB/d1/d11/d111/fileB.txt` })
        const to_dB_d12 = cloneTreeNodeInput(dA_d12, { dir: `dB/d1`, path: `dB/d1/d12` })
        const to_dB_d14 = cloneTreeNodeInput(dA_d14, { dir: `dB/d1`, path: `dB/d1/d14` })
        const to_dB_fileX = cloneTreeNodeInput(dA_fileX, { dir: `dB/d1`, path: `dB/d1/fileX.txt` })
        const to_dB_fileY = cloneTreeNodeInput(dA_fileY, { dir: `dB/d1`, path: `dB/d1/fileY.txt` })

        // 0. 対象ノードの取得
        td.when(storageService.sgetNode({ path: `dA/d1` })).thenReturn(toStorageNode(dA_d1))

        // 1. APIによる移動処理を実行
        td.when(storageService.moveDir(`dA/d1`, `dB/d1`)).thenResolve(
          toStorageNode([
            to_dB_d1,
            to_dB_d11,
            to_dB_d111,
            to_dB_fileA,
            to_dB_fileB,
            dB_fileC,
            to_dB_d12,
            dB_d13,
            to_dB_d14,
            to_dB_fileX,
            to_dB_fileY,
            dB_fileZ,
          ])
        )

        // 2. 移動先ディレクトリとその上位ディレクトリ階層の取得
        td.when(storageService.getHierarchicalNodes(`dB`)).thenResolve(toStorageNode([dB]))
      }

      // 'dA/d1'を'dB'へ移動
      await pageService.moveStorageNodes([`dA/d1`], `dB`)

      // root
      // ├dA
      // └dB
      //   └d1
      //     ├d11
      //     │└d111
      //     │  ├fileA.txt
      //     │  └fileB.txt
      //     │  └fileC.txt
      //     ├d12
      //     ├d13
      //     ├d14
      //     ├fileX.txt
      //     ├fileY.txt
      //     └fileZ.txt

      // 'dA'の階層構造の検証
      {
        const _dA = pageService.getTreeNode(`dA`)!
        // 子孫ノードの検証
        expect(_dA.getDescendants().length).toBe(0)
      }
      // 'dB'の階層構造の検証
      {
        const _dB = pageService.getTreeNode(`dB`)!
        // 子孫ノードの検証
        const _dB_descendants = _dB.getDescendants()
        const [_d1, _d11, _d111, _fileA, _fileB, _fileC, _d12, _d13, _d14, _fileX, _fileY, _fileZ] = _dB_descendants
        expect(_dB_descendants.length).toBe(12)
        expect(_d1.path).toBe(`dB/d1`)
        expect(_d11.path).toBe(`dB/d1/d11`)
        expect(_d111.path).toBe(`dB/d1/d11/d111`)
        expect(_fileA.path).toBe(`dB/d1/d11/d111/fileA.txt`)
        expect(_fileB.path).toBe(`dB/d1/d11/d111/fileB.txt`)
        expect(_fileC.path).toBe(`dB/d1/d11/d111/fileC.txt`)
        expect(_d12.path).toBe(`dB/d1/d12`)
        expect(_d13.path).toBe(`dB/d1/d13`)
        expect(_d14.path).toBe(`dB/d1/d14`)
        expect(_fileX.path).toBe(`dB/d1/fileX.txt`)
        expect(_fileY.path).toBe(`dB/d1/fileY.txt`)
        expect(_fileZ.path).toBe(`dB/d1/fileZ.txt`)
        // ディレクトリノードの遅延ロード状態の検証
        expect(_d1.lazyLoadStatus).toBe('loaded')
        expect(_d11.lazyLoadStatus).toBe('loaded')
        expect(_d111.lazyLoadStatus).toBe('loaded')
        expect(_d12.lazyLoadStatus).toBe('none')
        expect(_d13.lazyLoadStatus).toBe('none')
        expect(_d14.lazyLoadStatus).toBe('none')
      }

      verifyParentChildRelationForTree(treeView)
    })

    it('ルートディレクトリを指定した場合', async () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      const d1 = newTreeDirNodeInput(`d1`)
      const d2 = newTreeDirNodeInput(`d2`)
      pageService.setAllTreeNodes([d1, d2])

      let actual!: Error
      try {
        await pageService.moveStorageNodes([``], `tmp`)
      } catch (err) {
        actual = err
      }

      expect(actual.message).toBe(`The root node cannot be moved.`)
    })

    it('存在しないパスを指定した場合', async () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      const tmp = newTreeDirNodeInput(`tmp`)
      pageService.setAllTreeNodes([tmp])

      // モック設定
      const expected = new Error()
      td.when(storageService.sgetNode({ path: `dXXX` })).thenThrow(expected)

      let actual!: Error
      try {
        await pageService.moveStorageNodes([`dXXX`], `tmp`)
      } catch (err) {
        actual = err
      }

      expect(actual).toBe(expected)
    })

    it('移動先ディレクトリが移動元のサブディレクトリの場合', async () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      const d1 = newTreeDirNodeInput(`d1`)
      const d2 = newTreeDirNodeInput(`d2`)
      pageService.setAllTreeNodes([d1, d2])

      // モック設定
      td.when(storageService.sgetNode({ path: `d1` })).thenReturn(toStorageNode(d1))

      let actual!: Error
      try {
        await pageService.moveStorageNodes([`d1`], `d1/d11/d1`)
      } catch (err) {
        actual = err
      }

      expect(actual.message).toBe(`The destination directory is its own subdirectory: 'd1' -> 'd1/d11/d1'`)
    })

    it('APIでエラーが発生した場合', async () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      // root
      // ├dev
      // │├projects ← workへ移動
      // ││└blog
      // ││  └src
      // │└memo.txt ← workへ移動
      // └work
      const dev = newTreeDirNodeInput(`dev`, { lazyLoadStatus: 'loaded' })
      const projects = newTreeDirNodeInput(`dev/projects`, { lazyLoadStatus: 'loaded' })
      const blog = newTreeDirNodeInput(`dev/projects/blog`, { lazyLoadStatus: 'loaded' })
      const src = newTreeDirNodeInput(`dev/projects/blog/src`)
      const memo = newTreeFileNodeInput(`dev/memo.txt`)
      const work = newTreeDirNodeInput(`work`)
      pageService.setAllTreeNodes([dev, projects, blog, src, memo, work])

      // モック設定
      {
        const to_memo = cloneTreeNodeInput(memo, { dir: `work`, path: `work/memo.txt` })

        // 0. 対象ノードの取得
        td.when(storageService.sgetNode({ path: `dev/projects` })).thenReturn(toStorageNode(projects))
        td.when(storageService.sgetNode({ path: `dev/memo.txt` })).thenReturn(toStorageNode(memo))

        // 1. APIによる移動処理を実行
        // 'dev/projects'の移動でAPIエラーを発生させる
        td.when(storageService.moveDir(`dev/projects`, `work/projects`)).thenReject(new Error())
        td.when(storageService.moveFile(`dev/memo.txt`, `work/memo.txt`)).thenResolve(toStorageNode(to_memo))

        // 2. 移動先ディレクトリとその上位ディレクトリ階層の取得
        td.when(storageService.getHierarchicalNodes(`work`)).thenResolve(toStorageNode([work]))
      }

      // 'dev/projects'と'dev/memo.txt'を'work'へ移動
      await pageService.moveStorageNodes([`dev/projects`, `dev/memo.txt`], `work`)

      // root
      // ├dev
      // │└projects ← 移動されなかった
      // │  └blog
      // │    └src
      // └work
      //   └memo.txt ← 移動された

      // 'dev'の階層構造の検証
      {
        const _dev = pageService.getTreeNode(`dev`)!
        // 子孫ノードの検証
        const _dev_descendants = _dev.getDescendants()
        const [_projects, _blog, _src, _memo] = _dev_descendants
        expect(_dev_descendants.length).toBe(3)
        expect(_projects.path).toBe(`dev/projects`)
        expect(_blog.path).toBe(`dev/projects/blog`)
        expect(_src.path).toBe(`dev/projects/blog/src`)
      }
      // 'work'の階層構造の検証
      {
        const _work = pageService.getTreeNode(`work`)!
        // 子孫ノードの検証
        const _work_descendants = _work.getDescendants()
        const [_memo] = _work_descendants
        expect(_work_descendants.length).toBe(1)
        expect(_memo.path).toBe(`work/memo.txt`)
      }

      verifyParentChildRelationForTree(treeView)
    })

    it('nodeFilterが機能しているか検証', async () => {
      const { pageService, storageService, treeView } = newStoragePageService({ nodeFilter: StorageTreeNodeFilter.DirFilter })

      // root
      // ├dev
      // │├projects ← workへ移動
      // │└memo.txt ← workへ移動 - nodeFilterで除外されるのでツリーには存在しない
      // └work ← クライアントに読み込まれていない
      const dev = newTreeDirNodeInput(`dev`)
      const projects = newTreeDirNodeInput(`dev/projects`)
      const memo = newTreeFileNodeInput(`dev/memo.txt`)
      const work = newTreeDirNodeInput(`work`)
      pageService.setAllTreeNodes([dev, projects])

      // モック設定
      {
        const to_projects = cloneTreeNodeInput(projects, { dir: `work`, path: `work/projects` })
        const to_memo = cloneTreeNodeInput(memo, { dir: `work`, path: `work/memo.txt` })

        // 0. 対象ノードの取得
        td.when(storageService.sgetNode({ path: `dev/projects` })).thenReturn(toStorageNode(projects))
        td.when(storageService.sgetNode({ path: `dev/memo.txt` })).thenReturn(toStorageNode(memo))

        // 1. APIによる移動処理を実行
        td.when(storageService.moveDir(`dev/projects`, `work/projects`)).thenResolve(toStorageNode([to_projects]))
        td.when(storageService.moveFile(`dev/memo.txt`, `work/memo.txt`)).thenResolve(toStorageNode(to_memo))

        // 2. 移動先ディレクトリとその上位ディレクトリ階層の取得
        td.when(storageService.getHierarchicalNodes(`work`)).thenResolve(toStorageNode([work]))
      }

      // 'dev/projects'と'dev/memo.txt'を'work'へ移動
      await pageService.moveStorageNodes([`dev/projects`, `dev/memo.txt`], `work`)

      // root
      // ├dev
      // └work
      //   ├projects
      //   └memo.txt ← nodeFilterで除外されるのでツリーには存在しない

      // 'dev'の階層構造の検証
      {
        const _dev = pageService.getTreeNode(`dev`)!
        // 子孫ノードの検証
        expect(_dev.getDescendants().length).toBe(0)
      }
      // 'work'の階層構造の検証
      {
        const _work = pageService.getTreeNode(`work`)!
        // 子孫ノードの検証
        const _work_descendants = _work.getDescendants()
        const [_projects] = _work_descendants
        expect(_work_descendants.length).toBe(1)
        expect(_projects.path).toBe(`work/projects`)
      }

      verifyParentChildRelationForTree(treeView)
    })
  })

  describe('renameStorageNode', () => {
    it('ディレクトリのリネーム - ベーシックケース', async () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      // root
      // └dA
      //   └d1 ← x1へリネーム
      //     ├d11
      //     │└fileA.txt
      //     ├d12
      //     └fileB.txt
      const dA = newTreeDirNodeInput(`dA`, { lazyLoadStatus: 'loaded' })
      const d1 = newTreeDirNodeInput(`dA/d1`, { lazyLoadStatus: 'loaded' })
      const d11 = newTreeDirNodeInput(`dA/d1/d11`, { lazyLoadStatus: 'loaded' })
      const fileA = newTreeFileNodeInput(`dA/d1/d11/fileA.txt`)
      const d12 = newTreeDirNodeInput(`dA/d1/d12`)
      const fileB = newTreeFileNodeInput(`dA/d1/fileB.txt`)
      pageService.setAllTreeNodes([dA, d1, d11, fileA, d12, fileB])

      // ディレクトリの子ノード読み込みの検証準備
      pageService.getTreeNode(`dA/d1`)!.lazyLoadStatus = 'loaded'
      pageService.getTreeNode(`dA/d1/d11`)!.lazyLoadStatus = 'loaded'
      pageService.getTreeNode(`dA/d1/d12`)!.lazyLoadStatus = 'none'

      // モック設定
      {
        const to_x1 = cloneTreeNodeInput(d1, { name: `x1`, dir: `dA`, path: `dA/x1` })
        const to_d11 = cloneTreeNodeInput(d11, { dir: `dA/x1`, path: `dA/x1/d11` })
        const to_fileA = cloneTreeNodeInput(fileA, { dir: `dA/x1/d11`, path: `dA/x1/d11/fileA.txt` })
        const to_d12 = cloneTreeNodeInput(d12, { dir: `dA/x1`, path: `dA/x1/d12` })
        const to_fileB = cloneTreeNodeInput(fileB, { dir: `dA/x1`, path: `dA/x1/fileB.txt` })

        // 0. 対象ノードの取得
        td.when(storageService.sgetNode({ path: `dA/d1` })).thenReturn(d1)

        // 1. APIによる移動処理を実行
        td.when(storageService.renameDir(`dA/d1`, `x1`)).thenResolve(toStorageNode([to_x1, to_d11, to_fileA, to_d12, to_fileB]))
      }

      // 'dA/d1'を'dA/x1'へリネーム
      await pageService.renameStorageNode(`dA/d1`, `x1`)

      // root
      // └dA
      //   └x1
      //     ├d11
      //     │└fileA.txt
      //     ├d12
      //     └fileB.txt
      const _x1 = pageService.getTreeNode(`dA/x1`)!
      const _x1_descendants = _x1.getDescendants()
      const [_d11, _fileA, _d12, _fileB] = _x1_descendants

      expect(_x1_descendants.length).toBe(4)
      expect(_d11.path).toBe(`dA/x1/d11`)
      expect(_fileA.path).toBe(`dA/x1/d11/fileA.txt`)
      expect(_d12.path).toBe(`dA/x1/d12`)
      expect(_fileB.path).toBe(`dA/x1/fileB.txt`)

      // ディレクトリノードの遅延ロード状態の検証
      expect(_x1.lazyLoadStatus).toBe('loaded')
      expect(_d11.lazyLoadStatus).toBe('loaded')
      expect(_d12.lazyLoadStatus).toBe('none')

      verifyParentChildRelationForTree(treeView)
    })

    it('ディレクトリのリネーム - 既存のディレクトリ名に文字を付け加える形でリネームをした場合', async () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      // root
      // └dA
      //   └d1 ← d1XXXへリネーム
      //     ├d11
      //     │└fileA.txt
      //     ├d12
      //     └fileB.txt
      const dA = newTreeDirNodeInput(`dA`, { lazyLoadStatus: 'loaded' })
      const d1 = newTreeDirNodeInput(`dA/d1`, { lazyLoadStatus: 'loaded' })
      const d11 = newTreeDirNodeInput(`dA/d1/d11`, { lazyLoadStatus: 'loaded' })
      const fileA = newTreeFileNodeInput(`dA/d1/d11/fileA.txt`)
      const d12 = newTreeDirNodeInput(`dA/d1/d12`)
      const fileB = newTreeFileNodeInput(`dA/d1/fileB.txt`)
      pageService.setAllTreeNodes([dA, d1, d11, fileA, d12, fileB])

      // モック設定
      {
        const to_d1XXX = cloneTreeNodeInput(d1, { name: `d1XXX`, dir: `dA`, path: `dA/d1XXX` })
        const to_d11 = cloneTreeNodeInput(d11, { dir: `dA/d1XXX`, path: `dA/d1XXX/d11` })
        const to_fileA = cloneTreeNodeInput(fileA, { dir: `dA/d1XXX/d11`, path: `dA/d1XXX/d11/fileA.txt` })
        const to_d12 = cloneTreeNodeInput(d12, { dir: `dA/d1XXX`, path: `dA/d1XXX/d12` })
        const to_fileB = cloneTreeNodeInput(fileB, { dir: `dA/d1XXX`, path: `dA/d1XXX/fileB.txt` })

        // 0. 対象ノードの取得
        td.when(storageService.sgetNode({ path: `dA/d1` })).thenReturn(d1)

        // 1. APIによる移動処理を実行
        td.when(storageService.renameDir(`dA/d1`, `d1XXX`)).thenResolve(toStorageNode([to_d1XXX, to_d11, to_fileA, to_d12, to_fileB]))
      }

      // 'dA/d1'を'dA/d1XXX'へリネーム
      await pageService.renameStorageNode(`dA/d1`, `d1XXX`)

      // root
      // └dA
      //   └d1XXX
      //     ├d11
      //     │└fileA.txt
      //     ├d12
      //     └fileB.txt
      const _d1XXX = pageService.getTreeNode(`dA/d1XXX`)!
      const _d1XXX_descendants = _d1XXX.getDescendants()
      const [_d11, _fileA, _d12, _fileB] = _d1XXX_descendants

      expect(_d1XXX_descendants.length).toBe(4)
      expect(_d11.path).toBe(`dA/d1XXX/d11`)
      expect(_fileA.path).toBe(`dA/d1XXX/d11/fileA.txt`)
      expect(_d12.path).toBe(`dA/d1XXX/d12`)
      expect(_fileB.path).toBe(`dA/d1XXX/fileB.txt`)

      // ディレクトリノードの遅延ロード状態の検証
      expect(_d1XXX.lazyLoadStatus).toBe('loaded')
      expect(_d11.lazyLoadStatus).toBe('loaded')
      expect(_d12.lazyLoadStatus).toBe('none')

      verifyParentChildRelationForTree(treeView)
    })

    it('ファイルのリネーム', async () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      // root
      // ├dA
      // │└fileA.txt ← fileX.txtへリネーム
      // └dB
      //   └fileB.txt
      const dA = newTreeDirNodeInput(`dA`)
      const fileA = newTreeFileNodeInput(`dA/fileA.txt`)
      const dB = newTreeDirNodeInput(`dB`)
      const fileB = newTreeFileNodeInput(`dB/fileB.txt`)
      pageService.setAllTreeNodes([dA, fileA, dB, fileB])

      // モック設定
      {
        const to_fileX = cloneTreeNodeInput(fileA, { name: `fileX`, path: `dA/fileX.txt` })

        // 0. 対象ノードの取得
        td.when(storageService.sgetNode({ path: `dA/fileA.txt` })).thenReturn(fileA)

        // 1. APIによる移動処理を実行
        td.when(storageService.renameFile(`dA/fileA.txt`, `fileX.txt`)).thenResolve(toStorageNode(to_fileX))
      }

      // 'dA/fileA.txt'を'dA/fileX.txt'へリネーム
      await pageService.renameStorageNode(`dA/fileA.txt`, `fileX.txt`)

      // root
      // ├dA
      // │└fileX.txt
      // └dB
      //   └fileB.txt
      const actual = pageService.getTreeNode(`dA/fileX.txt`)!
      expect(actual.path).toBe(`dA/fileX.txt`)

      verifyParentChildRelationForTree(treeView)
    })

    it('ルートディレクトリ直下のノードをリネーム', async () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      // root
      // ├dA ← dXへリネーム
      // │└fileA.txt
      // └dB
      //   └fileB.txt
      const dA = newTreeDirNodeInput(`dA`)
      const fileA = newTreeFileNodeInput(`dA/fileA.txt`)
      const dB = newTreeDirNodeInput(`dB`)
      const fileB = newTreeFileNodeInput(`dB/fileB.txt`)
      pageService.setAllTreeNodes([dA, fileA, dB, fileB])

      // ディレクトリの子ノード読み込みの検証準備
      // 詳細な検証は他のテストケースで行うため、
      // ここではエラーが発生しないようなモック化を行う
      td.replace(pageService, 'fetchStorageChildren')

      // モック設定
      {
        const to_dX = cloneTreeNodeInput(dA, { name: `dX`, path: `dX` })
        const to_fileA = cloneTreeNodeInput(fileA, { dir: `dX`, path: `dX/fileA.txt` })

        // 0. 対象ノードの取得
        td.when(storageService.sgetNode({ path: `dA` })).thenReturn(dA)

        // 1. APIによる移動処理を実行
        td.when(storageService.renameDir(`dA`, `dX`)).thenResolve(toStorageNode([to_dX, to_fileA]))
      }

      // 'dA'を'dX'へリネーム
      await pageService.renameStorageNode(`dA`, `dX`)

      // root
      // ├dB
      // │└fileB.txt
      // └dX
      //   └fileA.txt
      const _dX = pageService.getTreeNode(`dX`)!
      const _dX_descendants = _dX.getDescendants()
      const [_fileA] = _dX_descendants

      expect(_dX_descendants.length).toBe(1)
      expect(_fileA.path).toBe(`dX/fileA.txt`)

      verifyParentChildRelationForTree(treeView)
    })

    it('ルートディレクトリを指定した場合', async () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      const d1 = newTreeDirNodeInput(`d1`)
      const d2 = newTreeDirNodeInput(`d2`)
      pageService.setAllTreeNodes([d1, d2])

      let actual!: Error
      try {
        await pageService.renameStorageNode(``, `tmp`)
      } catch (err) {
        actual = err
      }

      expect(actual.message).toBe(`The root node cannot be renamed.`)
    })

    it('存在しないパスを指定した場合', async () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      pageService.setAllTreeNodes([])

      // モック設定
      const expected = new Error()
      td.when(storageService.sgetNode({ path: `dXXX` })).thenThrow(expected)

      let actual!: Error
      try {
        await pageService.renameStorageNode(`dXXX`, `x1`)
      } catch (err) {
        actual = err
      }

      expect(actual).toBe(expected)
    })

    it('APIでエラーが発生した場合', async () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      // root
      // └dA
      //   └d1 ← x1へリネーム
      //     └fileA.txt
      const dA = newTreeDirNodeInput(`dA`)
      const d1 = newTreeDirNodeInput(`dA/d1`)
      const fileA = newTreeFileNodeInput(`dA/d1/fileA.txt`)
      pageService.setAllTreeNodes([dA, d1, fileA])

      // モック設定
      {
        const to_x1 = cloneTreeNodeInput(d1, { name: `x1`, dir: `dA`, path: `dA/x1` })
        const to_fileA = cloneTreeNodeInput(fileA, { dir: `dA/x1/d11`, path: `dA/x1/fileA.txt` })

        // 0. 対象ノードの取得
        td.when(storageService.sgetNode({ path: `dA/d1` })).thenReturn(d1)

        // 1. APIによる移動処理を実行
        td.when(storageService.renameDir(`dA/d1`, `x1`)).thenReject(new Error())
      }

      // 'dA/d1'を'dA/x1'へリネーム
      await pageService.renameStorageNode(`dA/d1`, `x1`)

      // root
      // └dA
      //   └d1 ← リネームされなかった
      //     └fileA.txt
      const _d1 = pageService.getTreeNode(`dA/d1`)!
      const _d1_descendants = _d1.getDescendants()
      const [_fileA] = _d1_descendants

      expect(_d1_descendants.length).toBe(1)
      expect(_fileA.path).toBe(`dA/d1/fileA.txt`)

      verifyParentChildRelationForTree(treeView)
    })
  })

  describe('setStorageNodeShareSettings', () => {
    const InitialShareSettings = () => {
      return {
        isPublic: true,
        readUIds: ['ichiro'],
        writeUIds: ['ichiro'],
      } as StorageNodeShareSettings
    }

    it('ベーシックケース', async () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      // root
      // └dA
      //   ├d1 ← 設定対象
      //   │└d11
      //   │  └fileA.txt
      //   ├fileB.txt ← 設定対象
      //   └fileC.txt
      const dA = newTreeDirNodeInput(`dA`)
      const d1 = newTreeDirNodeInput(`dA/d1`)
      const d11 = newTreeDirNodeInput(`dA/d1/d11`)
      const fileA = newTreeFileNodeInput(`dA/d1/d11/fileA.txt`)
      const fileB = newTreeFileNodeInput(`dA/fileB.txt`)
      const fileC = newTreeFileNodeInput(`dA/fileC.txt`)
      pageService.setAllTreeNodes([dA, d1, d11, fileA, fileB, fileC])

      // モック設定
      {
        const to_d1 = cloneTreeNodeInput(d1, { share: InitialShareSettings() })
        const to_fileB = cloneTreeNodeInput(fileB, { share: InitialShareSettings() })

        td.when(storageService.sgetNode({ path: `dA/d1` })).thenReturn(toStorageNode(d1))
        td.when(storageService.sgetNode({ path: `dA/fileB.txt` })).thenReturn(toStorageNode(fileB))

        td.when(storageService.setDirShareSettings(to_d1.path, InitialShareSettings())).thenResolve(toStorageNode(to_d1))
        td.when(storageService.setFileShareSettings(to_fileB.path, InitialShareSettings())).thenResolve(toStorageNode(to_fileB))
      }

      // 'dA/d1'と'dA/fileB.txt'に共有設定
      await pageService.setStorageNodeShareSettings([`dA/d1`, `dA/fileB.txt`], InitialShareSettings())

      const _dA = pageService.getTreeNode(`dA`)!
      const _dA_descendants = _dA.getDescendants()
      const [_d1, _d11, _fileA, _fileB, _fileC] = _dA_descendants
      expect(_dA_descendants.length).toBe(5)
      expect(_d1.share).toEqual(InitialShareSettings())
      expect(_d11.share).toEqual(EmptyShareSettings())
      expect(_fileA.share).toEqual(EmptyShareSettings())
      expect(_fileB.share).toEqual(InitialShareSettings())
      expect(_fileC.share).toEqual(EmptyShareSettings())

      verifyParentChildRelationForTree(treeView)
    })

    it('ルートディレクトリを指定した場合', async () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      const d1 = newTreeDirNodeInput(`d1`)
      const d2 = newTreeDirNodeInput(`d2`)
      pageService.setAllTreeNodes([d1, d2])

      let actual!: Error
      try {
        await pageService.setStorageNodeShareSettings([``], InitialShareSettings())
      } catch (err) {
        actual = err
      }

      expect(actual.message).toBe(`The root node cannot be set share settings.`)
    })

    it('存在しないパスを指定した場合', async () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      pageService.setAllTreeNodes([])

      // モック設定
      const expected = new Error()
      td.when(storageService.sgetNode({ path: `dXXX` })).thenThrow(expected)

      let actual!: Error
      try {
        await pageService.setStorageNodeShareSettings([`dXXX`], InitialShareSettings())
      } catch (err) {
        actual = err
      }

      expect(actual).toBe(expected)
    })

    it('APIでエラーが発生した場合', async () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      // root
      // └dA
      //   ├d1 ← 設定対象
      //   │└d11
      //   │  └fileA.txt
      //   ├fileB.txt ← 設定対象
      //   └fileC.txt
      const dA = newTreeDirNodeInput(`dA`)
      const d1 = newTreeDirNodeInput(`dA/d1`)
      const d11 = newTreeDirNodeInput(`dA/d1/d11`)
      const fileA = newTreeFileNodeInput(`dA/d1/d11/fileA.txt`)
      const fileB = newTreeFileNodeInput(`dA/fileB.txt`)
      const fileC = newTreeFileNodeInput(`dA/fileC.txt`)
      pageService.setAllTreeNodes([dA, d1, d11, fileA, fileB, fileC])

      // モック設定
      {
        const to_d1 = cloneTreeNodeInput(d1, { share: InitialShareSettings() })
        const to_fileB = cloneTreeNodeInput(fileB, { share: InitialShareSettings() })

        td.when(storageService.sgetNode({ path: `dA/d1` })).thenReturn(toStorageNode(d1))
        td.when(storageService.sgetNode({ path: `dA/fileB.txt` })).thenReturn(toStorageNode(fileB))

        // 'dA/d1'の共有設定でAPIエラーを発生させる
        td.when(storageService.setDirShareSettings(to_d1.path, InitialShareSettings())).thenReject(new Error())
        td.when(storageService.setFileShareSettings(to_fileB.path, InitialShareSettings())).thenResolve(toStorageNode(to_fileB))
      }

      // 'dA/d1'と'dA/fileB.txt'に共有設定
      await pageService.setStorageNodeShareSettings([`dA/d1`, `dA/fileB.txt`], InitialShareSettings())

      // root
      // └dA
      //   ├d1 ← 設定されなかった
      //   │└d11
      //   │  └fileA.txt
      //   ├fileB.txt ← 設定された
      //   └fileC.txt
      const _dA = pageService.getTreeNode(`dA`)!
      const _dA_descendants = _dA.getDescendants()
      const [_d1, _d11, _fileA, _fileB, _fileC] = _dA_descendants
      expect(_dA_descendants.length).toBe(5)
      expect(_d1.share).toEqual(EmptyShareSettings())
      expect(_d11.share).toEqual(EmptyShareSettings())
      expect(_fileA.share).toEqual(EmptyShareSettings())
      expect(_fileB.share).toEqual(InitialShareSettings())
      expect(_fileC.share).toEqual(EmptyShareSettings())

      verifyParentChildRelationForTree(treeView)
    })

    it('nodeFilterが機能しているか検証', async () => {
      const { pageService, storageService, treeView } = newStoragePageService({ nodeFilter: StorageTreeNodeFilter.DirFilter })

      // root
      // ├d1 ← 設定対象
      // └f1.txt ← 設定対象 - nodeFilterで除外されるのでツリーには存在しない
      const d1 = newTreeDirNodeInput(`d1`)
      const f1 = newTreeFileNodeInput(`f1.txt`)
      pageService.setAllTreeNodes([d1])

      // モック設定
      {
        const to_d1 = cloneTreeNodeInput(d1, { share: InitialShareSettings() })
        const to_f1 = cloneTreeNodeInput(f1, { share: InitialShareSettings() })

        td.when(storageService.sgetNode({ path: `d1` })).thenReturn(toStorageNode(d1))
        td.when(storageService.sgetNode({ path: `f1.txt` })).thenReturn(toStorageNode(f1))

        td.when(storageService.setDirShareSettings(to_d1.path, InitialShareSettings())).thenResolve(toStorageNode(to_d1))
        td.when(storageService.setFileShareSettings(to_f1.path, InitialShareSettings())).thenResolve(toStorageNode(to_f1))
      }

      // 'd1'と'f1.txt'に共有設定
      await pageService.setStorageNodeShareSettings([`d1`, `f1.txt`], InitialShareSettings())

      // root
      // ├d1
      // └f1.txt ← nodeFilterで除外されるのでツリーには存在しない
      const _descendants = pageService.getRootTreeNode().getDescendants()
      const [_d1] = _descendants
      expect(_descendants.length).toBe(1)
      expect(_d1.share).toEqual(InitialShareSettings())

      verifyParentChildRelationForTree(treeView)
    })
  })

  describe('setArticleSortOrder', () => {
    it('ベーシックケース', async () => {
      const { pageService, storageService, treeView } = newStoragePageService({ storageType: 'article' })
      const articleService = storageService as ArticleStorageService
      const config = useConfig()

      // articles
      // ├バンドル1
      // ├バンドル2
      // └アセット
      const bundle1 = newTreeDirNodeInput(`${StorageNode.generateId()}`, {
        article: {
          dir: {
            type: 'TreeBundle',
            name: 'バンドル1',
            sortOrder: 2,
          },
        },
      })
      const bundle2 = newTreeDirNodeInput(`${StorageNode.generateId()}`, {
        article: {
          dir: {
            type: 'TreeBundle',
            name: 'バンドル2',
            sortOrder: 1,
          },
        },
      })
      const assets = newStorageDirNode(`${config.storage.article.assetsName}`)
      pageService.setAllTreeNodes([bundle1, bundle2, assets])

      // モック設定
      {
        td.when(articleService.sgetNode({ path: bundle2.path })).thenReturn(toStorageNode(bundle2))
        td.when(articleService.sgetNode({ path: bundle1.path })).thenReturn(toStorageNode(bundle1))

        bundle1.article!.dir!.sortOrder = 1
        bundle2.article!.dir!.sortOrder = 2
        td.when(articleService.setArticleSortOrder([bundle2.path, bundle1.path])).thenResolve(toStorageNode([bundle2, bundle1]))
      }

      // ソート順の設定
      await pageService.setArticleSortOrder([bundle2.path, bundle1.path])

      // articles
      // ├バンドル2
      // ├バンドル1
      // └アセット
      const [_root, _bundle2, _bundle1, _assets] = pageService.getAllTreeNodes()
      expect(_bundle2.path).toBe(bundle2.path)
      expect(_bundle2.article?.dir?.sortOrder).toBe(bundle2.article?.dir?.sortOrder)
      expect(_bundle1.path).toBe(bundle1.path)
      expect(_bundle1.article?.dir?.sortOrder).toBe(bundle1.article?.dir?.sortOrder)
      expect(_assets.path).toBe(assets.path)

      verifyParentChildRelationForTree(treeView)
    })

    it('ソート順を設定できないノードにソート順を設定しようとした場合', async () => {
      const { pageService, storageService, treeView } = newStoragePageService({ storageType: 'article' })
      const articleService = storageService as ArticleStorageService
      const config = useConfig()

      // articles
      // ├バンドル1
      // ├バンドル2
      // └アセット
      const bundle1 = newTreeDirNodeInput(`${StorageNode.generateId()}`, {
        article: {
          dir: {
            type: 'TreeBundle',
            name: 'バンドル1',
            sortOrder: 2,
          },
        },
      })
      const bundle2 = newTreeDirNodeInput(`${StorageNode.generateId()}`, {
        article: {
          dir: {
            type: 'TreeBundle',
            name: 'バンドル2',
            sortOrder: 1,
          },
        },
      })
      const assets = newStorageDirNode(`${config.storage.article.assetsName}`)
      pageService.setAllTreeNodes([bundle1, bundle2, assets])

      // モック設定
      {
        td.when(articleService.sgetNode({ path: bundle2.path })).thenReturn(toStorageNode(bundle2))
        td.when(articleService.sgetNode({ path: bundle1.path })).thenReturn(toStorageNode(bundle1))
        td.when(articleService.sgetNode({ path: assets.path })).thenReturn(toStorageNode(assets))
      }

      let actual!: Error
      try {
        // ソート順の設定
        // ※ソート順を設定できない｢アセット｣を指定
        await pageService.setArticleSortOrder([bundle2.path, bundle1.path, assets.path])
      } catch (err) {
        actual = err
      }

      expect(actual.message).toMatch(/^A node is specified for which the sort order cannot be set:/)
    })
  })

  describe('saveArticleSrcMasterFile', () => {
    it('ベーシックケース', async () => {
      const { pageService, storageService, treeView } = newStoragePageService({ storageType: 'article' })
      const articleService = storageService as ArticleStorageService

      // articles
      // └ブログ
      //   └記事1
      //     ├index.md
      //     └[index.draft.md] ← 下書きはツリーには表示されない
      const { blog, art1, art1_master, art1_draft } = newListBundleFamilyNodes()
      pageService.setAllTreeNodes([blog, art1, art1_master])

      // モック設定
      const now = dayjs()
      const srcContent = '#header1'
      const textContent = 'header1'
      const saved_art1_master = cloneTreeNodeInput(art1_master, {
        size: Buffer.byteLength(srcContent),
        updatedAt: now,
        version: art1_master.version + 1,
      })
      const saved_art1_draft = cloneTreeNodeInput(art1_draft, {
        size: 0,
        updatedAt: now,
        version: art1_draft.version + 1,
      })
      td.when(articleService.saveArticleSrcMasterFile(art1.path, srcContent, textContent)).thenResolve({
        master: saved_art1_master,
        draft: saved_art1_draft,
      })

      // 記事ソースの保存
      const actual = await pageService.saveArticleSrcMasterFile(art1.path, srcContent, textContent)

      // 戻り値の検証
      const { master, draft } = actual
      expect(master).toEqual(saved_art1_master)
      expect(draft).toEqual(saved_art1_draft)

      // articles
      // └ブログ
      //   └記事1
      //     ├index.md
      //     └[index1.draft.md] ← 下書きはツリーには表示されない
      const tree_art1 = pageService.getTreeNode(art1.path)!
      const tree_art1_descendants = tree_art1.getDescendants()
      expect(tree_art1_descendants.length).toBe(1)

      const [tree_art1_master] = tree_art1_descendants
      expect(tree_art1_master.id).toBe(saved_art1_master.id)
      expect(tree_art1_master.size).toBe(saved_art1_master.size)
      expect(tree_art1_master.updatedAt).toEqual(saved_art1_master.updatedAt)
      expect(tree_art1_master.version).toBe(saved_art1_master.version)
    })
  })

  describe('saveArticleSrcDraftFile', () => {
    it('ベーシックケース', async () => {
      const { pageService, storageService, treeView } = newStoragePageService({ storageType: 'article' })
      const articleService = storageService as ArticleStorageService

      // articles
      // └ブログ
      //   └記事1
      //     ├index.md
      //     └[index.draft.md] ← 下書きはツリーには表示されない
      const { blog, art1, art1_master, art1_draft } = newListBundleFamilyNodes()
      pageService.setAllTreeNodes([blog, art1, art1_master])

      // モック設定
      const now = dayjs()
      const srcContent = 'test'
      const saved_art1_draft = cloneTreeNodeInput(art1_draft, {
        size: 0,
        updatedAt: now,
        version: art1_draft.version + 1,
      })
      td.when(articleService.saveArticleSrcDraftFile(art1.path, srcContent)).thenResolve(saved_art1_draft)

      // 記事ソースの保存
      const actual = await pageService.saveArticleSrcDraftFile(art1.path, srcContent)

      // 戻り値の検証
      expect(actual).toEqual(saved_art1_draft)

      // articles
      // └ブログ
      //   └記事1
      //     ├index.md
      //     └[index1.draft.md] ← 下書きはツリーには表示されない
      const tree_art1 = pageService.getTreeNode(art1.path)!
      const tree_art1_descendants = tree_art1.getDescendants()
      expect(tree_art1_descendants.length).toBe(1)
      const [tree_art1_master] = tree_art1_descendants
      expect(tree_art1_master.id).toBe(art1_master.id)
    })
  })

  describe('onUploaded', () => {
    it('ベーシックケース', async () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      // root
      // └d1 ← 今回アップロード ※既に存在するディレクトリをアップロード
      //   ├d11
      //   │├[d111] ← 今回アップロード
      //   ││└[fileA.txt] ← 今回アップロード
      //   │└fileB.txt
      //   ├[d12] ← 今回アップロード
      //   │└[fileC.txt] ← 今回アップロード
      //   └[fileD.txt] ← 今回アップロード
      const d1 = newTreeDirNodeInput(`d1`, { lazyLoadStatus: 'loaded' })
      const d11 = newTreeDirNodeInput(`d1/d11`, { lazyLoadStatus: 'loaded' })
      const d111 = newTreeDirNodeInput(`d1/d11/d111`, { lazyLoadStatus: 'none' })
      const fileA = newTreeFileNodeInput(`d1/d11/d111/fileA.txt`)
      const fileB = newTreeFileNodeInput(`d1/d11/fileB.txt`)
      const d12 = newTreeDirNodeInput(`d1/d12`, { lazyLoadStatus: 'none' })
      const fileC = newTreeFileNodeInput(`d1/d12/fileC.txt`)
      const fileD = newTreeFileNodeInput(`d1/fileD.txt`)
      pageService.setAllTreeNodes([d1, d11, fileB, d12])

      const e: UploadEndedEvent = {
        uploadDirPath: d1.path,
        uploadedFiles: [fileA, fileC, fileD],
      }

      // モック設定
      td.when(storageService.getNode({ path: d1.path })).thenReturn(toStorageNode(d1))
      td.when(storageService.getNode({ path: d11.path })).thenReturn(toStorageNode(d11))
      td.when(storageService.getNode({ path: d111.path })).thenReturn(toStorageNode(d111))
      td.when(storageService.getNode({ path: fileA.path })).thenReturn(toStorageNode(fileA))
      td.when(storageService.getNode({ path: d12.path })).thenReturn(toStorageNode(d12))
      td.when(storageService.getNode({ path: fileC.path })).thenReturn(toStorageNode(fileC))
      td.when(storageService.getNode({ path: fileD.path })).thenReturn(toStorageNode(fileD))

      // アップロードが行われた後のツリーの更新処理を実行
      await pageService.onUploaded(e)

      // root
      // └d1
      //   ├d11
      //   │├d111
      //   ││└fileA.txt
      //   │└fileB.txt
      //   ├d12
      //   │└fileC.txt
      //   └fileD.txt
      const actual = pageService.getAllTreeNodes()
      console.log(actual.map(node => node.path))
      expect(actual.length).toBe(9)
      const [_root, _d1, _d11, _d111, _fileA, _fileB, _d12, _fileC, _fileD] = actual
      expect(_root.path).toBe(``)
      expect(_d1.path).toBe(`d1`)
      expect(_d11.path).toBe(`d1/d11`)
      expect(_d111.path).toBe(`d1/d11/d111`)
      expect(_fileA.path).toBe(`d1/d11/d111/fileA.txt`)
      expect(_fileB.path).toBe(`d1/d11/fileB.txt`)
      expect(_d12.path).toBe(`d1/d12`)
      expect(_fileC.path).toBe(`d1/d12/fileC.txt`)
      expect(_fileD.path).toBe(`d1/fileD.txt`)
      // アップロードディレクトリの遅延ロード状態の検証
      expect(_d1.lazyLoadStatus).toBe('loaded')
      expect(_d11.lazyLoadStatus).toBe('loaded')
      expect(_d111.lazyLoadStatus).toBe('none')
      expect(_d12.lazyLoadStatus).toBe('none')

      verifyParentChildRelationForTree(treeView)
    })

    it('ルートディレクトリへアップロードした場合', async () => {
      const { pageService, storageService, treeView } = newStoragePageService()

      // root ← アップロードディレクトリ
      // └[d1] ← 今回アップロード
      //   ├[d11] ← 今回アップロード
      //   │└[fileA.txt] ← 今回アップロード
      //   └[fileB.txt] ← 今回アップロード
      const d1 = newTreeDirNodeInput(`d1`, { lazyLoadStatus: 'none' })
      const d11 = newTreeDirNodeInput(`d1/d11`, { lazyLoadStatus: 'none' })
      const fileA = newTreeFileNodeInput(`d1/d11/fileA.txt`)
      const fileB = newTreeFileNodeInput(`fileB.txt`)
      pageService.setAllTreeNodes([d1], { lazyLoadStatus: 'loaded' })

      const e: UploadEndedEvent = {
        uploadDirPath: ``,
        uploadedFiles: [fileA, fileB],
      }

      // モック設定
      td.when(storageService.getNode({ path: d1.path })).thenReturn(toStorageNode(d1))
      td.when(storageService.getNode({ path: d11.path })).thenReturn(toStorageNode(d11))
      td.when(storageService.getNode({ path: fileA.path })).thenReturn(toStorageNode(fileA))
      td.when(storageService.getNode({ path: fileB.path })).thenReturn(toStorageNode(fileB))

      // アップロードが行われた後のツリーの更新処理を実行
      await pageService.onUploaded(e)

      // root
      // └d1
      //   ├d11
      //   │└fileA.txt
      //   └fileB.txt
      const actual = pageService.getAllTreeNodes()
      expect(actual.length).toBe(5)
      const [_root, _d1, _d11, _fileA, _fileB] = actual
      expect(_root.path).toBe(``)
      expect(_d1.path).toBe(`d1`)
      expect(_d11.path).toBe(`d1/d11`)
      expect(_fileA.path).toBe(`d1/d11/fileA.txt`)
      expect(_fileB.path).toBe(`fileB.txt`)
      // アップロードディレクトリの遅延ロード状態の検証
      expect(_root.lazyLoadStatus).toBe('loaded')
      expect(_d1.lazyLoadStatus).toBe('none')
      expect(_d11.lazyLoadStatus).toBe('none')

      verifyParentChildRelationForTree(treeView)
    })

    it('nodeFilterが機能しているか検証', async () => {
      const { pageService, storageService, treeView } = newStoragePageService({ nodeFilter: StorageTreeNodeFilter.DirFilter })

      // root ← アップロードディレクトリ
      // └d1
      const d1 = newTreeDirNodeInput(`d1`)
      const fileA = newTreeFileNodeInput(`fileA.txt`) // 今回アップロード
      pageService.setAllTreeNodes([d1])

      const e: UploadEndedEvent = {
        uploadDirPath: '',
        uploadedFiles: [fileA],
      }

      // モック設定
      td.when(storageService.sgetNode({ path: d1.path })).thenReturn(toStorageNode(d1))
      td.when(storageService.sgetNode({ path: fileA.path })).thenReturn(toStorageNode(fileA))

      // アップロードが行われた後のツリーの更新処理を実行
      await pageService.onUploaded(e)

      // root
      // ├d1
      // └fileA.txt ← nodeFilterで除外されるのでツリーには存在しない
      const actual = pageService.getAllTreeNodes()
      expect(actual.length).toBe(2)
      const [_root, _d1] = actual
      expect(_root.path).toBe(``)
      expect(_d1.path).toBe(`d1`)

      verifyParentChildRelationForTree(treeView)
    })
  })

  describe('getDisplayNodeName', () => {
    it('一般ノードの場合', () => {
      const { pageService } = newStoragePageService()

      // root
      // └d1 ← 対象ノードに指定
      const d1 = newStorageDirNode(`d1`)

      const actual = pageService.getDisplayNodeName(d1)

      expect(actual).toBe(d1.name)
    })

    it('記事系ノードの場合', () => {
      const { pageService } = newStoragePageService()

      // articles
      // └ブログ ← 対象ノードに指定
      const { blog } = newListBundleFamilyNodes()

      const actual = pageService.getDisplayNodeName(blog)

      expect(actual).toBe(blog.article?.dir?.name)
    })

    it('アセットディレクトリの場合 - ストレージタイプが｢記事｣以外の場合', () => {
      const { pageService } = newStoragePageService({ storageType: 'app' })
      const config = useConfig()

      // articles
      // ├ブログ
      // │└記事1
      // └アセット ← 対象ノードに指定
      const { assets } = newListBundleFamilyNodes()

      const actual = pageService.getDisplayNodeName(assets)

      expect(actual).toBe(assets.name)
    })

    it('アセットディレクトリの場合 - ストレージタイプが｢記事｣の場合', () => {
      const { pageService, storageService } = newStoragePageService({ storageType: 'article' })
      const i18n = useI18n()

      // articles
      // ├ブログ
      // │└記事1
      // └アセット ← 対象ノードに指定
      const { assets } = newListBundleFamilyNodes()

      // モック設定
      td.when(storageService.getNode(td.matchers.contains({ path: `${assets.path}` }))).thenReturn(assets)

      const actual = pageService.getDisplayNodeName(assets)

      expect(actual).toBe(String(i18n.tc('storage.asset', 2)))
    })
  })

  describe('getDisplayNodePath', () => {
    it('ストレージタイプが｢記事｣以外の場合', () => {
      const { pageService, storageService } = newStoragePageService()

      // root
      // └d1
      //   └fileA.txt ← 対象ノードに指定
      const d1 = newStorageDirNode(`d1`)
      const fileA = newStorageFileNode(`d1/fileA.txt`)

      // モック設定
      td.when(storageService.getNode({ path: `${fileA.path}` })).thenReturn(fileA)
      td.when(storageService.getHierarchicalNodes(`${fileA.path}`)).thenReturn([d1, fileA])

      const actual = pageService.getDisplayNodePath({ path: fileA.path })

      expect(actual).toBe(`${d1.name}/${fileA.name}`)
    })

    it('ストレージタイプが｢記事｣の場合', () => {
      const { pageService, storageService } = newStoragePageService()

      // articles
      // └ブログ
      //   └記事1 ← 対象ノードに指定
      const { blog, art1 } = newListBundleFamilyNodes()

      // モック設定
      td.when(storageService.getNode({ path: `${art1.path}` })).thenReturn(art1)
      td.when(storageService.getHierarchicalNodes(`${art1.path}`)).thenReturn([blog, art1])

      const actual = pageService.getDisplayNodePath({ path: art1.path })

      expect(actual).toBe(`${blog.article?.dir?.name}/${art1.article?.dir?.name}`)
    })
  })

  describe('getNodeIcon', () => {
    it('一般ノードの場合', () => {
      const { pageService } = newStoragePageService()

      // root
      // └d1 ← 対象ノードに指定
      const d1 = newStorageDirNode(`d1`)

      const actual = pageService.getNodeIcon(d1)

      expect(actual).toBe(StorageNodeType.getIcon(d1.nodeType))
    })

    it('記事系ノードの場合', () => {
      const { pageService } = newStoragePageService()

      // articles
      // └ブログ ← 対象ノードに指定
      const { blog } = newListBundleFamilyNodes()

      const actual = pageService.getNodeIcon(blog)

      expect(actual).toBe(StorageArticleDirType.getIcon(blog.article?.dir?.type!))
    })

    it(`アセットディレクトリの場合 - ストレージタイプが｢記事｣以外の場合`, () => {
      const { pageService } = newStoragePageService({ storageType: 'app' })
      const config = useConfig()

      // articles
      // └アセット ← 対象ノードに指定
      const assets = newStorageDirNode(`${config.storage.article.assetsName}`)

      const actual = pageService.getNodeIcon(assets)

      expect(actual).toBe(StorageNodeType.getIcon(assets.nodeType))
    })

    it('アセットディレクトリの場合 - ストレージタイプが｢記事｣の場合', () => {
      const { pageService, storageService } = newStoragePageService({ storageType: 'article' })
      const config = useConfig()

      // articles
      // └アセット ← 対象ノードに指定
      const { assets } = newListBundleFamilyNodes()

      // モック設定
      td.when(storageService.getNode(td.matchers.contains({ path: `${assets.path}` }))).thenReturn(assets)

      const actual = pageService.getNodeIcon(assets)

      expect(actual).toBe('photo_library')
    })
  })

  describe('getNodeTypeLabel', () => {
    it('一般ディレクトリの場合', () => {
      const { pageService } = newStoragePageService()
      const d1 = newStorageDirNode(`d1`)

      const actual = pageService.getNodeTypeLabel(d1)

      expect(actual).toBe(StorageNodeType.getLabel(d1.nodeType))
    })

    it('記事系ディレクトリの場合', () => {
      const { pageService } = newStoragePageService()
      const { blog } = newListBundleFamilyNodes()

      const actual = pageService.getNodeTypeLabel(blog)

      expect(actual).toBe(StorageArticleDirType.getLabel(blog.article?.dir?.type!))
    })

    it('ファイルの場合', () => {
      const { pageService } = newStoragePageService()
      const fileA = newStorageFileNode('fileA.txt')

      const actual = pageService.getNodeTypeLabel(fileA)

      expect(actual).toBe(StorageNodeType.getLabel(fileA.nodeType))
    })
  })

  describe('isArticleRootUnder', () => {
    it('記事ルート配下ノードを指定', () => {
      const { pageService, storageService } = newStoragePageService({ storageType: 'article' })

      // articles
      // ├ブログ
      // │└記事1 ← 対象ノードに指定
      // └アセット
      const { art1 } = newListBundleFamilyNodes()

      // モック設定
      td.when(storageService.getNode(td.matchers.contains({ path: `${art1.path}` }))).thenReturn(art1)

      const actual = pageService.isArticleRootUnder({ path: `${art1.path}` })

      expect(actual).toBeTruthy()
    })

    it('アセットディレクトリを指定', () => {
      const { pageService, storageService } = newStoragePageService({ storageType: 'article' })

      // articles
      // ├ブログ
      // │└記事1
      // └アセット ← 対象ノードに指定
      const { assets } = newListBundleFamilyNodes()

      // モック設定
      td.when(storageService.getNode(td.matchers.contains({ path: `${assets.path}` }))).thenReturn(assets)

      const actual = pageService.isArticleRootUnder({ path: `${assets.path}` })

      expect(actual).toBeTruthy()
    })

    it('記事ルートを指定した場合', () => {
      const { pageService, storageService } = newStoragePageService({ storageType: 'article' })

      // articles ← 対象ノードに指定
      // ├ブログ
      // │└記事1
      // └アセット
      const { blog } = newListBundleFamilyNodes()

      // モック設定
      const articleRootPath = pageService.getRootTreeNode().path
      td.when(storageService.getNode({ path: `${articleRootPath}` })).thenReturn(undefined)

      const actual = pageService.isArticleRootUnder({ path: `${articleRootPath}` })

      expect(actual).toBeFalsy()
    })
  })

  describe('isAssetsDir', () => {
    it('アセットディレクトリを指定', () => {
      const { pageService, storageService } = newStoragePageService({ storageType: 'article' })

      // articles
      // ├ブログ
      // │└記事1
      // └アセット ← 対象ノードに指定
      const { assets } = newListBundleFamilyNodes()

      // モック設定
      td.when(storageService.getNode(td.matchers.contains({ path: `${assets.path}` }))).thenReturn(assets)

      const actual = pageService.isAssetsDir({ path: `${assets.path}` })

      expect(actual).toBeTruthy()
    })

    it('リストバンドル以外を指定した場合', () => {
      const { pageService, storageService } = newStoragePageService({ storageType: 'article' })

      // articles
      // ├ブログ
      // │└記事1
      // └アセット ← 対象ノードに指定
      const { blog } = newListBundleFamilyNodes()

      // モック設定
      td.when(storageService.getNode({ path: `${blog.path}` })).thenReturn(blog)

      const actual = pageService.isAssetsDir({ path: `${blog.path}` })

      expect(actual).toBeFalsy()
    })
  })

  describe('isListBundle', () => {
    it('リストバンドルを指定', () => {
      const { pageService, storageService } = newStoragePageService({ storageType: 'article' })

      // articles
      // └ブログ ← 対象ノードに指定
      //   └記事1
      const { blog } = newListBundleFamilyNodes()

      // モック設定
      td.when(storageService.getNode({ path: `${blog.path}` })).thenReturn(blog)

      const actual = pageService.isListBundle({ path: `${blog.path}` })

      expect(actual).toBeTruthy()
    })

    it('リストバンドル以外を指定した場合', () => {
      const { pageService, storageService } = newStoragePageService({ storageType: 'article' })

      // articles
      // └ブログ
      //   └記事1 ← 対象ノードに指定
      const { art1 } = newListBundleFamilyNodes()

      // モック設定
      td.when(storageService.getNode({ path: `${art1.path}` })).thenReturn(art1)

      const actual = pageService.isListBundle({ path: `${art1.path}` })

      expect(actual).toBeFalsy()
    })
  })

  describe('isTreeBundle', () => {
    it('カテゴリバンドルを指定', () => {
      const { pageService, storageService } = newStoragePageService({ storageType: 'article' })

      // articles
      // └プログラミング ← 対象ノードに指定
      //   └TypeScript
      //     └変数
      //       └index.md
      const { programming } = newTreeBundleFamilyNodes()

      // モック設定
      td.when(storageService.getNode({ path: `${programming.path}` })).thenReturn(programming)

      const actual = pageService.isTreeBundle({ path: `${programming.path}` })

      expect(actual).toBeTruthy()
    })

    it('カテゴリバンドル以外を指定した場合', () => {
      const { pageService, storageService } = newStoragePageService({ storageType: 'article' })

      // articles
      // └プログラミング
      //   └TypeScript ← 対象ノードに指定
      const { ts } = newTreeBundleFamilyNodes()

      // モック設定
      td.when(storageService.getNode({ path: `${ts.path}` })).thenReturn(ts)

      const actual = pageService.isTreeBundle({ path: `${ts.path}` })

      expect(actual).toBeFalsy()
    })
  })

  describe('isCategoryDir', () => {
    it('カテゴリを指定', () => {
      const { pageService, storageService } = newStoragePageService({ storageType: 'article' })

      // articles
      // └プログラミング
      //   └TypeScript ← 対象ノードに指定
      const { programming, ts } = newTreeBundleFamilyNodes()

      // モック設定
      td.when(storageService.getNode({ path: `${ts.path}` })).thenReturn(ts)

      const actual = pageService.isCategoryDir({ path: `${ts.path}` })

      expect(actual).toBeTruthy()
    })

    it('カテゴリ以外を指定した場合', () => {
      const { pageService, storageService } = newStoragePageService({ storageType: 'article' })

      // articles
      // └プログラミング
      //   └TypeScript
      //     └変数 ← 対象ノードに指定
      //       └index.md
      const { variable } = newTreeBundleFamilyNodes()

      // モック設定
      td.when(storageService.getNode({ path: `${variable.path}` })).thenReturn(variable)

      const actual = pageService.isCategoryDir({ path: `${variable.path}` })

      expect(actual).toBeFalsy()
    })
  })

  describe('isArticleDir', () => {
    it('記事を指定', () => {
      const { pageService, storageService } = newStoragePageService({ storageType: 'article' })

      // articles
      // └ブログ
      //   └記事1 ← 対象ノードに指定
      //     └index.md
      const { art1, art1_master } = newListBundleFamilyNodes()

      // モック設定
      td.when(storageService.getNode({ path: `${art1.path}` })).thenReturn(art1)

      const actual = pageService.isArticleDir({ path: `${art1.path}` })

      expect(actual).toBeTruthy()
    })

    it('記事以外を指定した場合', () => {
      const { pageService, storageService } = newStoragePageService({ storageType: 'article' })
      const config = useConfig()

      // articles
      // └ブログ
      //   └記事1
      //     └index.md ← 対象ノードに指定
      const { art1, art1_master } = newListBundleFamilyNodes()

      // モック設定
      td.when(storageService.getNode({ path: `${art1_master.path}` })).thenReturn(art1_master)

      const actual = pageService.isArticleDir({ path: `${art1_master.path}` })

      expect(actual).toBeFalsy()
    })
  })

  describe('isArticleDirUnder', () => {
    it('ベーシックケース', () => {
      const { pageService, storageService } = newStoragePageService({ storageType: 'article' })

      // articles
      // └ブログ
      //   └記事1 ← 祖先に記事がある
      //     └images
      //       └img1.png ← 対象ノードに指定
      const { art1 } = newListBundleFamilyNodes()
      const images = newStorageDirNode(`${art1.path}/images`)
      const img1 = newStorageFileNode(`${images.path}/img1.png`)

      // モック設定
      td.when(storageService.getNode({ path: `${img1.path}` })).thenReturn(img1)
      td.when(storageService.getNode({ path: `${images.path}` })).thenReturn(images)
      td.when(storageService.getNode({ path: `${art1.path}` })).thenReturn(art1)

      const actual = pageService.isArticleDirUnder({ path: `${img1.path}` })

      expect(actual).toBeTruthy()
    })

    it('祖先に記事がない場合', () => {
      const { pageService, storageService } = newStoragePageService({ storageType: 'article' })

      // articles
      // └ブログ
      //   └tmp
      //     └memo.txt ← 対象ノードに指定 ※祖先に記事がない
      // ※リストバンドル配下に`tmp`のような一般ディレクトリは作成できない。テスト用に作成。
      const { blog } = newListBundleFamilyNodes()
      const tmp = newStorageDirNode(`${blog.path}/tmp`)
      const memo = newStorageFileNode(`${tmp.path}/memo.txt`)

      // モック設定
      td.when(storageService.getNode({ path: `${memo.path}` })).thenReturn(memo)
      td.when(storageService.getNode({ path: `${tmp.path}` })).thenReturn(tmp)
      td.when(storageService.getNode({ path: `${blog.path}` })).thenReturn(blog)

      const actual = pageService.isArticleDirUnder({ path: `${memo.path}` })

      expect(actual).toBeFalsy()
    })
  })
})
