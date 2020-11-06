import { ArticleStorageLogic, StorageLogic } from '@/app/logic/modules/storage'
import { CreateArticleTypeDirInput, StorageArticleNodeType, StorageNode, StorageNodeShareSettings, StorageNodeType, StorageType } from '@/app/logic'
import {
  EMPTY_SHARE_SETTINGS,
  NewTestStorageNodeData,
  TestLogicContainer,
  generateFirestoreId,
  newTestStorageDirNode,
  newTestStorageFileNode,
} from '../../../../../helpers/app'
import { Ref, ref } from '@vue/composition-api'
import { StorageTreeNodeData, StorageTreeNodeInput } from '@/app/views/base/storage/base'
import { TreeNode, TreeView, TreeViewImpl } from '@/app/components/tree-view'
import { StoragePageLogic } from '@/app/views/base/storage'
import { StorageTreeNode } from '@/app/views/base/storage/storage-tree-node.vue'
import { UploadEndedEvent } from '@/app/components/storage/storage-upload-progress-float.vue'
import { VueRouter } from 'vue-router/types/router'
import { cloneDeep } from 'lodash'
import dayjs from 'dayjs'
import { mount } from '@vue/test-utils'
import { shuffleArray } from 'web-base-lib'
import { useConfig } from '@/app/config'
import { useI18n } from '@/app/i18n'

//========================================================================
//
//  Test interfaces
//
//=======================================================================

type RawStoragePageLogic = ReturnType<typeof StoragePageLogic['newRawInstance']>

type TestStorageTreeView = TreeViewImpl<StorageTreeNode, StorageTreeNodeData>

type NewTreeDirNodeInputData = NewTestStorageNodeData & Pick<StorageTreeNodeInput, 'opened' | 'lazyLoadStatus'>

type NewTreeFileNodeInputData = NewTestStorageNodeData

//========================================================================
//
//  Test helpers
//
//=======================================================================

/**
 * テスト用のストレージページロジックのインスタンスを生成します。
 * @param params
 */
function newStoragePageLogic(
  params: {
    storageType?: StorageType
    nodeFilter?: (node: StorageNode) => boolean
  } = {}
): { pageLogic: RawStoragePageLogic; treeView: TestStorageTreeView; storageLogic: StorageLogic } {
  const storageType = params.storageType || 'app'
  const nodeFilter = params.nodeFilter || allNodeFilter

  // ストレージロジックをモック化
  const logic = td.object<TestLogicContainer>()
  const storageLogic = (() => {
    switch (storageType) {
      case 'app':
        return logic.appStorage
      case 'user':
        return logic.userStorage
      case 'article':
        return logic.articleStorage
    }
  })()
  td.replace(require('@/app/logic'), 'injectLogic', () => logic)

  // ルーターをモック化
  const router = td.object<VueRouter>()
  td.replace(require('@/app/router'), 'default', router)

  // ツリービューのインスタンス化
  const wrapper = mount(TreeView.clazz)
  const treeView = wrapper.vm as TestStorageTreeView
  const treeViewRef = ref(treeView) as Ref<TestStorageTreeView>

  // ストレージページロジックをインスタンス化
  const pageLogic = StoragePageLogic.newInstance({ storageType, nodeFilter, treeViewRef }) as RawStoragePageLogic

  // ストレージノードの初回｢未｣読み込みに設定
  pageLogic.isFetchedInitialStorage.value = false

  // サインイン済みに設定
  td.replace(logic.auth.isSignedIn, 'value', true)

  return { pageLogic, treeView, storageLogic }
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
  return Object.assign(newTestStorageDirNode(dirPath, data), {
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
  return Object.assign(newTestStorageFileNode(filePath, data), {})
}

function cloneTreeNodeInput(source: StorageTreeNodeInput, input: Partial<StorageTreeNodeInput>): StorageTreeNodeInput {
  return Object.assign({}, cloneDeep(source), cloneDeep(input))
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

function allNodeFilter(node: StorageNode): boolean {
  return true
}

function dirNodeFilter(node: StorageNode): boolean {
  return node.nodeType === StorageNodeType.Dir
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
  const articleFileName = config.storage.article.fileName

  const blog = newTestStorageDirNode(`${generateFirestoreId()}`, {
    articleNodeName: 'ブログ',
    articleNodeType: StorageArticleNodeType.ListBundle,
    articleSortOrder: 9,
  })

  const art2 = newTestStorageDirNode(`${blog.path}/${generateFirestoreId()}`, {
    articleNodeName: '記事2',
    articleNodeType: StorageArticleNodeType.Article,
    articleSortOrder: 99,
  })

  const art2_index = newTestStorageDirNode(`${art2.path}/${articleFileName}`)

  const art1 = newTestStorageDirNode(`${blog.path}/${generateFirestoreId()}`, {
    articleNodeName: '記事1',
    articleNodeType: StorageArticleNodeType.Article,
    articleSortOrder: 98,
  })

  const art1_index = newTestStorageDirNode(`${art1.path}/${articleFileName}`)

  return { blog, art2, art2_index, art1, art1_index }
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
function newCategoryBundleFamilyNodes() {
  const config = useConfig()
  const articleFileName = config.storage.article.fileName

  const programing = newTestStorageDirNode(`${generateFirestoreId()}`, {
    articleNodeName: 'プログラミング',
    articleNodeType: StorageArticleNodeType.CategoryBundle,
    articleSortOrder: 9,
  })

  const ts = newTestStorageDirNode(`${programing.path}/${generateFirestoreId()}`, {
    articleNodeName: 'TypeScript',
    articleNodeType: StorageArticleNodeType.Category,
    articleSortOrder: 99,
  })

  const variable = newTestStorageDirNode(`${ts.path}/${generateFirestoreId()}`, {
    articleNodeName: '変数',
    articleNodeType: StorageArticleNodeType.Article,
    articleSortOrder: 999,
  })

  const variable_index = newTestStorageDirNode(`${variable.path}/${articleFileName}`)

  const clazz = newTestStorageDirNode(`${ts.path}/${generateFirestoreId()}`, {
    articleNodeName: 'クラス',
    articleNodeType: StorageArticleNodeType.Article,
    articleSortOrder: 998,
  })

  const clazz_index = newTestStorageDirNode(`${clazz.path}/${articleFileName}`)

  return { programing, ts, variable, variable_index, clazz, clazz_index }
}

//========================================================================
//
//  Tests
//
//========================================================================

describe('StoragePageLogic', () => {
  describe('getAllTreeNodes', () => {
    it('ベーシックケース', () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

      const d1 = newTreeDirNodeInput(`d1`)
      const d11 = newTreeDirNodeInput(`d1/d11`)
      const f111 = newTreeFileNodeInput(`d1/d11/f111.txt`)
      const d12 = newTreeDirNodeInput(`d1/d12`)
      const d2 = newTreeDirNodeInput(`d2`)
      const d21 = newTreeDirNodeInput(`d2/d21`)
      const f211 = newTreeFileNodeInput(`d2/d21/f211.txt`)
      const f1 = newTreeFileNodeInput(`f1.txt`)
      pageLogic.setAllTreeNodes([d1, d11, f111, d12, d2, d21, f211, f1])

      const actual = pageLogic.getAllTreeNodes()

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
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

      const d1 = newTreeDirNodeInput(`d1`)
      const d2 = newTreeDirNodeInput(`d2`)
      pageLogic.setAllTreeNodes([d1, d2])

      const actual = pageLogic.getTreeNode(`d1`)!

      expect(actual.path).toBe(`d1`)
    })

    it('ルートノードを取得', () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

      const d1 = newTreeDirNodeInput(`d1`)
      const d2 = newTreeDirNodeInput(`d2`)
      pageLogic.setAllTreeNodes([d1, d2])

      const actual = pageLogic.getTreeNode(``)!

      expect(actual.path).toBe(``)
    })
  })

  describe('setAllTreeNodes', () => {
    it('ソートされていないノードリストを渡した場合', () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

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

      pageLogic.setAllTreeNodes(shuffleArray([d1, d11, f111, d12, d2, d21, f211, f1]))
      const actual = pageLogic.getAllTreeNodes()

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
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

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
      pageLogic.setAllTreeNodes([d1, d11, f111, d12, d2])

      // 以下の状態のノードリストを引数に設定する
      // ・'d1/d11/f111.txt'が'fA.txt'へ移動+リネームされた
      // ・'d1/d11/f11A.txt'が追加された
      // ・'d1/d12'が削除された
      const fA = cloneTreeNodeInput(f111, { dir: ``, path: `fA.txt` })
      const f11A = newTreeFileNodeInput(`d1/d11/f11A.txt`)
      pageLogic.mergeAllTreeNodes([d1, d11, f11A, fA, d2])
      const actual = pageLogic.getAllTreeNodes()

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
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

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
      pageLogic.setAllTreeNodes([d1, d11, f111, d12, f121, d2])

      // ロジックストアから以下の状態のノードリストが取得される
      // ・'d1/d11/f112.txt'が追加された
      // ・'d1/f11.txt'が追加された
      // ・'d1/d12'が削除(または移動)された
      td.when(storageLogic.getDirDescendants(d1.path)).thenReturn(toStorageNode([d1, d11, f111, f112, f11]))

      pageLogic.mergeTreeDirDescendants(d1.path)
      const actual = pageLogic.getAllTreeNodes()

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
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

      // root
      // ├d1 ← 対象ノードに指定
      // │└d11
      // │  └f111.txt
      // └d2
      const d1 = newTreeDirNodeInput(`d1`)
      const d11 = newTreeDirNodeInput(`d1/d11`)
      const f111 = newTreeFileNodeInput(`d1/d11/f111.txt`)
      const d2 = newTreeDirNodeInput(`d2`)
      pageLogic.setAllTreeNodes([d1, d11, f111, d2])

      // ロジックストアから以下の状態のノードリストが取得される
      // ・'d1'が削除された
      td.when(storageLogic.getDirDescendants(d1.path)).thenReturn([])

      pageLogic.mergeTreeDirDescendants(d1.path)
      const actual = pageLogic.getAllTreeNodes()

      // root
      // └d2
      expect(actual.length).toBe(2)
      expect(actual[0].path).toBe(``)
      expect(actual[1].path).toBe(`d2`)

      verifyParentChildRelationForTree(treeView)
    })

    it('nodeFilterが機能しているか検証', () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic({ nodeFilter: dirNodeFilter })

      // root
      // └d1 ← 対象ノードに指定
      //   └d11
      const d1 = newTreeDirNodeInput(`d1`)
      const d11 = newTreeDirNodeInput(`d1/d11`)
      const f111 = newTreeFileNodeInput(`d1/d11/f111.txt`)
      pageLogic.setAllTreeNodes([d1, d11])

      // ロジックストアから以下の状態のノードリストが取得される
      // ・'d1/d11/f111.txt'が追加された
      td.when(storageLogic.getDirDescendants(d1.path)).thenReturn(toStorageNode([d1, d11, f111]))

      pageLogic.mergeTreeDirDescendants(d1.path)
      const actual = pageLogic.getAllTreeNodes()

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
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

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
      pageLogic.setAllTreeNodes([d1, d11, f111, d12, f121, d2])

      // ロジックストアから以下の状態のノードリストが取得される
      // ・'d1/d11/f112.txt'が追加された
      // ・'d1/f11.txt'が追加された
      // ・'d1/d12'が削除された
      td.when(storageLogic.getDirChildren(d1.path)).thenReturn(toStorageNode([d1, d11, f112, f11]))

      pageLogic.mergeTreeDirChildren(d1.path)
      const actual = pageLogic.getAllTreeNodes()

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
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

      // root
      // ├d1 ← 対象ノードに指定
      // │└d11
      // │  └f111.txt
      // └d2
      const d1 = newTreeDirNodeInput(`d1`)
      const d11 = newTreeDirNodeInput(`d1/d11`)
      const f111 = newTreeFileNodeInput(`d1/d11/f111.txt`)
      const d2 = newTreeDirNodeInput(`d2`)
      pageLogic.setAllTreeNodes([d1, d11, f111, d2])

      // ロジックストアから以下の状態のノードリストが取得される
      // ・'d1'が削除(または移動)された
      td.when(storageLogic.getDirChildren(d1.path)).thenReturn([])

      pageLogic.mergeTreeDirChildren(d1.path)
      const actual = pageLogic.getAllTreeNodes()

      // root
      // └d2
      expect(actual.length).toBe(2)
      expect(actual[0].path).toBe(``)
      expect(actual[1].path).toBe(`d2`)

      verifyParentChildRelationForTree(treeView)
    })

    it('nodeFilterが機能しているか検証', () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic({ nodeFilter: dirNodeFilter })

      // root
      // └d1 ← 対象ノードに指定
      //   └d11
      const d1 = newTreeDirNodeInput(`d1`)
      const d11 = newTreeDirNodeInput(`d1/d11`)
      const f11 = newTreeFileNodeInput(`d1/f11.txt`)
      pageLogic.setAllTreeNodes([d1, d11])

      // ロジックストアから以下の状態のノードリストが取得される
      // ・'d1/f11.txt'が追加された
      td.when(storageLogic.getDirChildren(d1.path)).thenReturn(toStorageNode([d1, d11, f11]))

      pageLogic.mergeTreeDirChildren(d1.path)
      const actual = pageLogic.getAllTreeNodes()

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
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

      pageLogic.setAllTreeNodes([])

      const d1 = newTreeDirNodeInput('d1')
      const d11 = newTreeDirNodeInput('d1/d11')
      const f111 = newTreeFileNodeInput('d1/d11/f111.txt')
      pageLogic.setTreeNodes([d1, d11, f111])

      // ノードが追加されたことを検証
      expect(pageLogic.getTreeNode(`d1/d11`)!.path).toBe(`d1/d11`)
      expect(pageLogic.getTreeNode(`d1/d11/f111.txt`)!.path).toBe(`d1/d11/f111.txt`)

      verifyParentChildRelationForTree(treeView)
    })

    it('ツリーに存在するノードの設定', () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

      const d1 = newTreeDirNodeInput(`d1`)
      const d11 = newTreeDirNodeInput(`d1/d11`)
      const f111 = newTreeFileNodeInput(`d1/d11/f111.txt`)
      const d2 = newTreeDirNodeInput(`d2`)
      pageLogic.setAllTreeNodes([d1, d11, f111, d2])

      const createdAt = dayjs('2019-12-01')
      const updatedAt = dayjs('2019-12-02')
      const updatingD11 = Object.assign({}, d11, { createdAt, updatedAt })
      const updatingFileA = Object.assign({}, f111, { createdAt, updatedAt })

      pageLogic.setTreeNodes([updatingD11, updatingFileA])

      expect(pageLogic.getTreeNode(`d1/d11`)!.createdAt).toEqual(createdAt)
      expect(pageLogic.getTreeNode(`d1/d11`)!.updatedAt).toEqual(updatedAt)
      expect(pageLogic.getTreeNode(`d1/d11/f111.txt`)!.createdAt).toEqual(createdAt)
      expect(pageLogic.getTreeNode(`d1/d11/f111.txt`)!.updatedAt).toEqual(updatedAt)
    })

    it('ツリーに存在するノードの設定 - 親が変わっていた場合', () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

      const d1 = newTreeDirNodeInput(`d1`)
      const d11 = newTreeDirNodeInput(`d1/d11`)
      const f111 = newTreeFileNodeInput(`d1/d11/f111.txt`)
      const d2 = newTreeDirNodeInput(`d2`)
      pageLogic.setAllTreeNodes([d1, d11, f111, d2])

      // 'd1/d11'が移動+リネームで'd2/d21'となった
      const updatedAt = dayjs()
      const d21_from_d11 = cloneTreeNodeInput(d11, { name: `d21`, dir: `d2`, path: `d2/d21`, updatedAt })
      const f211_from_f111 = cloneTreeNodeInput(f111, { name: `f211.txt`, dir: `d2/d21`, path: `d2/d21/f211.txt`, updatedAt })
      pageLogic.setTreeNodes([d21_from_d11, f211_from_f111])

      const _d21 = pageLogic.getTreeNode(`d2/d21`)!
      expect(_d21.parent!.path).toBe(`d2`)
      expect(_d21.updatedAt).toEqual(updatedAt)
      const _f211 = pageLogic.getTreeNode(`d2/d21/f211.txt`)!
      expect(_f211.parent!.path).toBe(`d2/d21`)
      expect(_f211.updatedAt).toEqual(updatedAt)

      verifyParentChildRelationForTree(treeView)
    })

    it('ツリーに存在するノードの設定 - リネームされていた場合', () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

      const d1 = newTreeDirNodeInput(`d1`)
      const d11 = newTreeDirNodeInput(`d1/d11`)
      const f111 = newTreeFileNodeInput(`d1/d11/f111.txt`)
      const f112 = newTreeFileNodeInput(`d1/d11/f112.txt`)
      pageLogic.setAllTreeNodes([d1, d11, f111, f112])

      // 'd1/d11/f112.txt'がリネームされて'd1/d11/f110.txt'となった
      const updatedAt = dayjs()
      const f110_from_f112 = cloneTreeNodeInput(f112, { name: `f110.txt`, dir: `d1/d11`, path: `d1/d11/f110.txt`, updatedAt })
      pageLogic.setTreeNodes([f110_from_f112])

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
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

      const d1 = newTreeDirNodeInput(`d1`)
      const d11 = newTreeDirNodeInput(`d1/d11`)
      pageLogic.setAllTreeNodes([d1, d11])

      // 'd1/d11'が削除後また同じディレクトリに同じ名前で作成された
      const created_d11 = cloneTreeNodeInput(d11, { id: generateFirestoreId(), createdAt: dayjs(), updatedAt: dayjs() })
      pageLogic.setTreeNodes([created_d11])

      const _d11 = pageLogic.getTreeNode(`d1/d11`)!
      expect(_d11.id).toEqual(created_d11.id)
      expect(_d11.createdAt).toEqual(created_d11.createdAt)
      expect(_d11.updatedAt).toEqual(created_d11.updatedAt)

      verifyParentChildRelationForTree(treeView)
    })

    it('ファイル削除後また同じディレクトリに同じ名前でファイルがアップロードされた場合', () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

      const d1 = newTreeDirNodeInput(`d1`)
      const d11 = newTreeDirNodeInput(`d1/d11`)
      const f111 = newTreeFileNodeInput(`d1/d11/f111.txt`)
      const f112 = newTreeFileNodeInput(`d1/d11/f112.txt`)
      pageLogic.setAllTreeNodes([d1, d11, f111, f112])

      // 'd1/d11/f111.txt'が削除後また同じディレクトリに同じ名前でアップロードされた
      const created_f111 = cloneTreeNodeInput(f111, { id: generateFirestoreId(), createdAt: dayjs(), updatedAt: dayjs() })
      pageLogic.setTreeNodes([created_f111])

      const _f111 = pageLogic.getTreeNode(`d1/d11/f111.txt`)!
      expect(_f111.id).toEqual(created_f111.id)
      expect(_f111.createdAt).toEqual(created_f111.createdAt)
      expect(_f111.updatedAt).toEqual(created_f111.updatedAt)

      verifyParentChildRelationForTree(treeView)
    })

    it('ソートされていないノードリストを渡した場合', () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

      pageLogic.setAllTreeNodes([])

      const d1 = newTreeDirNodeInput(`d1`)
      const d11 = newTreeDirNodeInput(`d1/d11`)
      const f111 = newTreeFileNodeInput(`d1/d11/f111.txt`)
      const d12 = newTreeDirNodeInput(`d1/d12`)
      const d2 = newTreeDirNodeInput(`d2`)
      const d21 = newTreeDirNodeInput(`d2/d21`)
      const f211 = newTreeFileNodeInput(`d2/d21/f211.txt`)
      const f1 = newTreeFileNodeInput(`f1.txt`)
      pageLogic.setTreeNodes(shuffleArray([d1, d11, f111, d12, d2, d21, f211, f1]))
      const actual = pageLogic.getAllTreeNodes()

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
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

      const d1 = newTreeDirNodeInput(`d1`)
      const d11 = newTreeDirNodeInput(`d1/d11`)
      const f111 = newTreeFileNodeInput(`d1/d11/f111.txt`)
      const d2 = newTreeDirNodeInput(`d2`)
      const d21 = newTreeDirNodeInput(`d2/d21`)
      const f211 = newTreeFileNodeInput(`d2/d21/f211.txt`)
      pageLogic.setAllTreeNodes([d1, d11, f111, d2, d21, f211])

      pageLogic.removeTreeNodes([`d1/d11`, `d2/d21/f211.txt`])

      expect(pageLogic.getTreeNode(`d1/d11`)).toBeUndefined()
      expect(pageLogic.getTreeNode(`d1/d11/f111.txt`)).toBeUndefined()
      expect(pageLogic.getTreeNode(`d2/d21/f211.txt`)).toBeUndefined()

      verifyParentChildRelationForTree(treeView)
    })

    it(`'d1/d11'と親である'd1'を同時に指定した場合`, () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

      const d1 = newTreeDirNodeInput(`d1`)
      const d11 = newTreeDirNodeInput(`d1/d11`)
      const f111 = newTreeFileNodeInput(`d1/d11/f111.txt`)
      const d12 = newTreeDirNodeInput(`d1/d12`)
      pageLogic.setAllTreeNodes([d1, d11, f111, d12])

      pageLogic.removeTreeNodes([`d1/d11`, `d1`])

      expect(pageLogic.getTreeNode(`d1`)).toBeUndefined()
      expect(pageLogic.getTreeNode(`d1/d11`)).toBeUndefined()
      expect(pageLogic.getTreeNode(`d1/d11/f111.txt`)).toBeUndefined()
      expect(pageLogic.getTreeNode(`d1/d12`)).toBeUndefined()

      verifyParentChildRelationForTree(treeView)
    })

    it('存在しないパスを指定した場合', () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

      const d1 = newTreeDirNodeInput(`d1`)
      const d2 = newTreeDirNodeInput(`d2`)
      pageLogic.setAllTreeNodes([d1, d2])

      // 何も起こらない
      pageLogic.removeTreeNodes([`dXXX`])

      verifyParentChildRelationForTree(treeView)
    })

    it('削除により選択ノードがなくなった場合', () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

      const d1 = newTreeDirNodeInput(`d1`)
      const d11 = newTreeDirNodeInput(`d1/d11`)
      const f111 = newTreeFileNodeInput(`d1/d11/f111.txt`)
      pageLogic.setAllTreeNodes([d1, d11, f111])
      // 'd1/d11/f111.txt'を選択ノードに設定
      pageLogic.selectedTreeNode.value = pageLogic.getTreeNode(f111.path)!

      pageLogic.removeTreeNodes([`d1/d11`])

      expect(pageLogic.getTreeNode(`d1/d11`)).toBeUndefined()
      expect(pageLogic.getTreeNode(`d1/d11/f111.txt`)).toBeUndefined()
      // 選択ノードがルートノードになっていることを検証
      expect(pageLogic.selectedTreeNode.value).toBe(pageLogic.getRootTreeNode())

      verifyParentChildRelationForTree(treeView)
    })
  })

  describe('moveTreeNode', () => {
    it('ディレクトリの移動', async () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

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
      pageLogic.setAllTreeNodes([dev, projects, blog, src, index, work, assets, users])

      // 'dev/projects'を'work'へ移動
      await pageLogic.moveTreeNode(`dev/projects`, `work/projects`)

      // root
      // ├dev
      // └work
      //   ├assets
      //   ├projects
      //   │└blog
      //   │  └src
      //   │    └index.html
      //   └users

      const _dev = pageLogic.getTreeNode(`dev`)!
      expect(_dev.getDescendants().length).toBe(0)

      const _work = pageLogic.getTreeNode(`work`)!
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
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

      // root
      // ├d1
      // │├fileA.txt
      // │└fileC.txt
      // └fileB.txt ← d1へ移動
      const d1 = newTreeDirNodeInput(`d1`)
      const fileA = newTreeFileNodeInput(`d1/fileA.txt`)
      const fileC = newTreeFileNodeInput(`d1/fileC.txt`)
      const fileB = newTreeFileNodeInput(`fileB.txt`)
      pageLogic.setAllTreeNodes([d1, fileA, fileC, fileB])

      // 'fileB.txt'を'd1'へ移動
      await pageLogic.moveTreeNode(`fileB.txt`, `d1/fileB.txt`)

      // root
      // └d1
      //  ├fileA.txt
      //  ├fileB.txt
      //  └fileC.txt
      const _d1 = pageLogic.getTreeNode(`d1`)!
      const _d1_descendants = _d1.getDescendants()
      const [_fileA, _fileB, _fileC] = _d1_descendants
      expect(_d1_descendants.length).toBe(3)
      expect(_fileA.path).toBe(`d1/fileA.txt`)
      expect(_fileB.path).toBe(`d1/fileB.txt`)
      expect(_fileC.path).toBe(`d1/fileC.txt`)

      verifyParentChildRelationForTree(treeView)
    })

    it('ディレクトリのリネーム', async () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

      // root
      // ├d1
      // ├d2
      // └d3 ← d0へリネーム
      const d1 = newTreeDirNodeInput(`d1`)
      const d2 = newTreeDirNodeInput(`d2`)
      const d3 = newTreeDirNodeInput(`d3`)
      pageLogic.setAllTreeNodes([d1, d2, d3])

      // 'd3'を'd0'へリネーム
      await pageLogic.moveTreeNode(`d3`, `d0`)

      // root
      // ├d0
      // ├d1
      // └d2
      const [_d0, _d1, _d2] = pageLogic.getRootTreeNode().getDescendants()
      expect(_d0.path).toBe(`d0`)
      expect(_d1.path).toBe(`d1`)
      expect(_d2.path).toBe(`d2`)

      verifyParentChildRelationForTree(treeView)
    })

    it('ファイルのリネーム', async () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

      // root
      // ├file1.txt
      // ├file2.txt
      // └file3.txt ← file0.txtへリネーム
      const file1 = newTreeDirNodeInput(`file1.txt`)
      const file2 = newTreeDirNodeInput(`file2.txt`)
      const file3 = newTreeDirNodeInput(`file3.txt`)
      pageLogic.setAllTreeNodes([file1, file2, file3])

      // 'file3.txt'を'file0.txt'へリネーム
      await pageLogic.moveTreeNode(`file3.txt`, `file0.txt`)

      // root
      // ├file0.txt
      // ├file1.txt
      // └file2.txt
      const [_file0, _file1, _file2] = pageLogic.getRootTreeNode().getDescendants()
      expect(_file0.path).toBe(`file0.txt`)
      expect(_file1.path).toBe(`file1.txt`)
      expect(_file2.path).toBe(`file2.txt`)

      verifyParentChildRelationForTree(treeView)
    })

    it('ルートディレクトリへ移動', async () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

      // root
      // └dB
      //   ├dA
      //   │└fileA.txt
      //   └fileB.txt
      const dB = newTreeDirNodeInput(`dB`)
      const dA = newTreeDirNodeInput(`dB/dA`)
      const fileA = newTreeFileNodeInput(`dB/dA/fileA.txt`)
      const fileB = newTreeFileNodeInput(`dB/fileB.txt`)
      pageLogic.setAllTreeNodes([dB, dA, fileA, fileB])

      // 'dB/dA'をルートノードへ移動
      await pageLogic.moveTreeNode(`dB/dA`, `dA`)

      // root
      // ├dA
      // │└fileA.txt
      // └dB
      //   └fileB.txt
      const _root = pageLogic.getTreeNode(``)!
      const [_dA, _fileA, _dB, _fileB] = _root.getDescendants()
      expect(_root.getDescendants().length).toBe(4)
      expect(_dA.path).toBe(`dA`)
      expect(_fileA.path).toBe(`dA/fileA.txt`)
      expect(_dB.path).toBe(`dB`)
      expect(_fileB.path).toBe(`dB/fileB.txt`)

      verifyParentChildRelationForTree(treeView)
    })

    it('移動先に同名のディレクトリまたはファイルが存在する場合', async () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

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
      pageLogic.setAllTreeNodes([
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
      await pageLogic.moveTreeNode(`dA/d1`, `dB/d1`)

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

      const _dA = pageLogic.getTreeNode(`dA`)!
      expect(_dA.getDescendants().length).toBe(0)

      const _dB = pageLogic.getTreeNode(`dB`)!
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
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

      // ストレージの初期読み込みが行われていない状態に設定
      pageLogic.isFetchedInitialStorage.value = false

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
      td.when(storageLogic.fetchChildren(``)).thenResolve(toStorageNode([d1, d2]))
      td.when(storageLogic.fetchChildren(d1.path)).thenResolve(toStorageNode([d11]))
      td.when(storageLogic.fetchChildren(d11.path)).thenResolve(toStorageNode([f111]))

      await pageLogic.fetchInitialStorage(d11.path)
      const actual = pageLogic.getAllTreeNodes()

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
      const exp = td.explain(storageLogic.fetchRoot)
      expect(exp.calls.length).toBe(1)

      verifyParentChildRelationForTree(treeView)
    })

    it('ストレージの初期読み込みが行われている場合', async () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

      // ストレージの初期読み込みが行われている状態に設定
      pageLogic.isFetchedInitialStorage.value = true

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
      td.when(storageLogic.getChildren(``)).thenReturn(toStorageNode([d1, d2]))
      td.when(storageLogic.getChildren(d1.path)).thenReturn(toStorageNode([d11]))
      td.when(storageLogic.getChildren(d11.path)).thenReturn(toStorageNode([f111]))

      await pageLogic.fetchInitialStorage(d11.path)
      const actual = pageLogic.getAllTreeNodes()

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
      const exp1 = td.explain(storageLogic.fetchRoot)
      expect(exp1.calls.length).toBe(0)
      const exp2 = td.explain(storageLogic.fetchChildren)
      expect(exp2.calls.length).toBe(0)

      verifyParentChildRelationForTree(treeView)
    })

    it('nodeFilterが機能しているか検証', async () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic({ nodeFilter: dirNodeFilter })

      // root
      // ├[d1]
      // └[f1.txt]
      const d1 = newTreeDirNodeInput(`d1`)
      const f1 = newTreeFileNodeInput(`f1.txt`)

      // APIから以下の状態のノードリストが取得される
      // ・'d1'
      // ・'f1.txt'
      td.when(storageLogic.fetchChildren(``)).thenResolve(toStorageNode([d1, f1]))

      await pageLogic.fetchInitialStorage()
      const actual = pageLogic.getAllTreeNodes()

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
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

      // root ← 対象ノードに指定
      // ├d1
      // └d3
      const d1 = newTreeDirNodeInput(`d1`)
      const d2 = newTreeDirNodeInput(`d2`)
      const d3 = newTreeDirNodeInput(`d3`)
      pageLogic.setAllTreeNodes([d1, d3])

      // APIから以下の状態のノードリストが取得される
      // ・'d2'が追加された
      // ・'d3'が削除(または移動)された
      td.when(storageLogic.fetchChildren(``)).thenResolve(toStorageNode([d1, d2]))

      await pageLogic.fetchStorageChildren(``)
      const actual = pageLogic.getAllTreeNodes()
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
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

      // root
      // └d1 ← 対象ノードに指定
      //   ├d11
      //   └d13
      const d1 = newTreeDirNodeInput(`d1`, { lazyLoadStatus: 'none' })
      const d11 = newTreeDirNodeInput(`d1/d11`)
      const d12 = newTreeDirNodeInput(`d1/d12`)
      const d13 = newTreeDirNodeInput(`d1/d13`)
      pageLogic.setAllTreeNodes([d1, d11, d13])

      // APIから以下の状態のノードリストが取得される
      // ・'d12'が追加された
      // ・'d13'が削除(または移動)された
      td.when(storageLogic.fetchChildren(d1.path)).thenResolve(toStorageNode([d11, d12]))

      await pageLogic.fetchStorageChildren(d1.path)
      const actual = pageLogic.getAllTreeNodes()
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
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic({ nodeFilter: dirNodeFilter })

      // root ← 対象ノードに指定
      // └d1
      const d1 = newTreeDirNodeInput(`d1`)
      const f1 = newTreeFileNodeInput(`f1.txt`)
      pageLogic.setAllTreeNodes([d1])

      // APIから以下の状態のノードリストが取得される
      // ・'f1.txt'が追加された
      td.when(storageLogic.fetchChildren(``)).thenResolve(toStorageNode([d1, f1]))

      await pageLogic.fetchStorageChildren(``)
      const actual = pageLogic.getAllTreeNodes()
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
    it('対象ノードにルートノードを指定', async () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

      // root ← 対象ノードに指定
      // ├d1
      // │├d11
      // ││└f111.txt
      // │└d12
      // └d2
      const d1 = newTreeDirNodeInput(`d1`, { lazyLoadStatus: 'none' })
      const d11 = newTreeDirNodeInput(`d1/d11`, { lazyLoadStatus: 'none' })
      const f111 = newTestStorageFileNode(`d1/d11/f111.txt`)
      const f112 = newTestStorageFileNode(`d1/d11/f112.txt`)
      const d12 = newTreeDirNodeInput(`d1/d12`, { lazyLoadStatus: 'none' })
      const d2 = newTreeDirNodeInput(`d2`, { lazyLoadStatus: 'none' })
      pageLogic.setAllTreeNodes([d1, d11, f111, d12, d2])

      // 以下の状態のノードリストを再現する
      // ・'d1/d11/f111.txt'が'f1.txt'へ移動+リネームされた
      // ・'d1/d11/f112.txt'が追加された
      // ・'d1/d12'が削除された
      const renamed_f1 = cloneTreeNodeInput(f111, { dir: ``, path: `f1.txt` })
      // StorageLogic.getDirDescendants()をモック化
      td.when(storageLogic.getDirDescendants(``)).thenReturn(toStorageNode([d1, d11, f112, d2, renamed_f1]))

      // ルートノードを指定して実行
      await pageLogic.reloadStorageDir(``)
      const actual = pageLogic.getAllTreeNodes()
      const [_root, _d1, _d11, _f112, _d2, _f1] = actual

      // root
      // ├d1
      // │└d11
      // │  └f112.txt
      // ├d2
      // └f1.txt
      expect(actual.length).toBe(6)
      expect(_root.path).toBe(``)
      expect(_d1.path).toBe(`d1`)
      expect(_d11.path).toBe(`d1/d11`)
      expect(_f112.path).toBe(`d1/d11/f112.txt`)
      expect(_d2.path).toBe(`d2`)
      expect(_f1.path).toBe(`f1.txt`)
      // 遅延ロード状態の検証
      expect(_root.lazyLoadStatus).toBe('loaded')
      expect(_d1.lazyLoadStatus).toBe('loaded')
      expect(_d11.lazyLoadStatus).toBe('loaded')
      expect(_f112.lazyLoadStatus).toBe('none')
      expect(_d2.lazyLoadStatus).toBe('loaded')
      expect(_f1.lazyLoadStatus).toBe('none')
      // fetchHierarchicalDescendants()が正常に呼び出されたか検証
      const exp = td.explain(storageLogic.fetchHierarchicalDescendants)
      expect(exp.calls[0].args[0]).toBe(``)

      verifyParentChildRelationForTree(treeView)
    })

    it('対象ノードにルートノード配下のディレクトリを指定', async () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

      // root
      // ├d1
      // │├d11 ← 対象ノードに指定
      // ││├d111
      // │││└f1111.txt
      // ││└f111.txt
      // │└d12
      // └d2
      const d1 = newTreeDirNodeInput(`d1`, { lazyLoadStatus: 'none' })
      const d11 = newTreeDirNodeInput(`d1/d11`, { lazyLoadStatus: 'none' })
      const d111 = newTreeDirNodeInput(`d1/d11/d111`, { lazyLoadStatus: 'none' })
      const f1111 = newTreeFileNodeInput(`d1/d11/d111/f1111.txt`)
      const f111 = newTreeFileNodeInput(`d1/d11/f111.txt`)
      const f112 = newTreeFileNodeInput(`d1/d11/f112.txt`)
      const d12 = newTreeDirNodeInput(`d1/d12`, { lazyLoadStatus: 'none' })
      const d2 = newTreeDirNodeInput(`d2`, { lazyLoadStatus: 'none' })
      pageLogic.setAllTreeNodes([d1, d11, d111, f1111, f111, d12, d2])

      // 以下の状態のノードリストを再現する
      // ・'d1/d11/d111'が削除された
      // ・'d1/d11/f111.txt'が削除され、その後また同じディレクトリに同じ名前でアップロードされた
      // ・'d1/d11/f112.txt'が追加された
      const updated_f111 = cloneTreeNodeInput(f111, { id: generateFirestoreId() })
      // StorageLogic.getNode()をモック化
      td.when(storageLogic.getNode({ path: d1.path })).thenReturn(toStorageNode(d1))
      // StorageLogic.getDirDescendants()をモック化
      td.when(storageLogic.getDirDescendants(d11.path)).thenReturn(toStorageNode([d11, updated_f111, f112]))

      // 'd1/d11'を指定して実行
      await pageLogic.reloadStorageDir(d11.path)
      const actual = pageLogic.getAllTreeNodes()
      const [_root, _d1, _d11, _f111, _f112, _d12, _d2] = actual

      // root
      // ├d1
      // │├d11
      // ││├f111.txt
      // ││└f112.txt
      // │└d12
      // └d2
      expect(actual.length).toBe(7)
      expect(_root.path).toBe(``)
      expect(_d1.path).toBe(`d1`)
      expect(_d11.path).toBe(`d1/d11`)
      expect(_f111.path).toBe(`d1/d11/f111.txt`)
      expect(_f112.path).toBe(`d1/d11/f112.txt`)
      expect(_d12.path).toBe(`d1/d12`)
      expect(_d2.path).toBe(`d2`)
      // 遅延ロード状態の検証
      // ・対象ノードに指定されたディレクトリと配下ディレクトリの遅延ロード状態が完了であることを確認
      // ・それ以外は遅延ロード状態に変化がないことを確認
      expect(_root.lazyLoadStatus).toBe('none')
      expect(_d1.lazyLoadStatus).toBe('none')
      expect(_d11.lazyLoadStatus).toBe('loaded')
      expect(_f111.lazyLoadStatus).toBe('none')
      expect(_f112.lazyLoadStatus).toBe('none')
      expect(_d12.lazyLoadStatus).toBe('none')
      expect(_d2.lazyLoadStatus).toBe('none')
      // StorageLogic.fetchHierarchicalDescendants()が正常に呼び出されたか検証
      const exp = td.explain(storageLogic.fetchHierarchicalDescendants)
      expect(exp.calls[0].args[0]).toBe(d11.path)

      verifyParentChildRelationForTree(treeView)
    })

    it('対象ノードが削除されていた場合', async () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

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
      pageLogic.setAllTreeNodes([d1, d11, d111, f1111, d12, d2])

      // 以下の状態のノードリストを再現する
      // ・'d1/d11/d111'が削除され存在しない
      // StorageLogic.getNode()をモック化
      td.when(storageLogic.getNode({ path: d1.path })).thenReturn(toStorageNode(d1))
      td.when(storageLogic.getNode({ path: d11.path })).thenReturn(toStorageNode(d11))
      td.when(storageLogic.getNode({ path: d111.path })).thenReturn(undefined)
      // StorageLogic.getDirDescendants()をモック化
      td.when(storageLogic.getDirDescendants(d111.path)).thenReturn([])

      // 'd1/d11/d111'を指定して実行
      await pageLogic.reloadStorageDir(d111.path)
      const actual = pageLogic.getAllTreeNodes()
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
      // StorageLogic.fetchHierarchicalDescendants()が正常に呼び出されたか検証
      const exp = td.explain(storageLogic.fetchHierarchicalDescendants)
      expect(exp.calls[0].args[0]).toBe(d111.path)

      verifyParentChildRelationForTree(treeView)
    })

    it('対象ノードの上位ノードが削除されていた場合', async () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

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
      pageLogic.setAllTreeNodes([d1, d11, d111, f1111, d12, d2])

      // 以下の状態のノードリストを再現する
      // ・'d1/d11'が削除され存在しない
      // StorageLogic.getNode()をモック化
      td.when(storageLogic.getNode({ path: d1.path })).thenReturn(toStorageNode(d1))
      td.when(storageLogic.getNode({ path: d11.path })).thenReturn(undefined)
      td.when(storageLogic.getNode({ path: d111.path })).thenReturn(undefined)
      // StorageLogic.getDirDescendants()をモック化
      td.when(storageLogic.getDirDescendants(d111.path)).thenReturn([])

      // 'd1/d11/d111'を指定して実行
      await pageLogic.reloadStorageDir(d111.path)
      const actual = pageLogic.getAllTreeNodes()
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
      // StorageLogic.fetchHierarchicalDescendants()が正常に呼び出されたか検証
      const exp = td.explain(storageLogic.fetchHierarchicalDescendants)
      expect(exp.calls[0].args[0]).toBe(d111.path)

      verifyParentChildRelationForTree(treeView)
    })

    it('nodeFilterが機能しているか検証', async () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic({ nodeFilter: dirNodeFilter })

      // root ←対象ノードに指定
      // └d1
      const d1 = newTreeDirNodeInput(`d1`)
      const f1 = newTreeFileNodeInput(`f1.txt`)
      pageLogic.setAllTreeNodes([d1])

      // 以下の状態のノードリストを再現する
      // ・'f1.txt'が追加された
      // StorageLogic.getDirDescendants()をモック化
      td.when(storageLogic.getDirDescendants(``)).thenReturn([d1, f1])

      // ルートノードを指定して実行
      await pageLogic.reloadStorageDir(``)
      const actual = pageLogic.getAllTreeNodes()
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
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

      // root
      // └d1
      //   └d12
      const d1 = newTreeDirNodeInput(`d1`)
      const d12 = newTreeDirNodeInput(`d1/d12`)
      pageLogic.setAllTreeNodes([d1, d12])

      // モック設定
      {
        const d11 = newTreeDirNodeInput(`d1/d11`)

        td.when(storageLogic.createDir(`d1/d11`)).thenResolve(toStorageNode(d11))
      }

      // 'd1/d11'を作成
      await pageLogic.createStorageDir(`d1/d11`)

      // root
      // └d1
      //   └d11
      const _d1 = pageLogic.getTreeNode(`d1`)!
      const _d1_descendants = _d1.getDescendants()
      const [_d11, _d12] = _d1_descendants
      expect(_d1_descendants.length).toBe(2)
      expect(_d11.path).toBe(`d1/d11`)
      expect(_d12.path).toBe(`d1/d12`)

      expect(_d11.lazyLoadStatus).toBe('loaded')

      verifyParentChildRelationForTree(treeView)
    })

    it('ルートディレクトリ直下に作成', async () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

      // root
      // └d2
      const d2 = newTreeDirNodeInput(`d2`)
      pageLogic.setAllTreeNodes([d2])

      // モック設定
      {
        const d1 = newTreeDirNodeInput(`d1`)

        td.when(storageLogic.createDir(`d1`)).thenResolve(toStorageNode(d1))
      }

      // 'd1'を作成
      await pageLogic.createStorageDir(`d1`)

      // root
      // ├d1
      // └d2
      const _root = pageLogic.getTreeNode(``)!
      const _root_descendants = _root.getDescendants()
      const [_d1, _d2] = _root_descendants
      expect(_root_descendants.length).toBe(2)
      expect(_d1.path).toBe(`d1`)
      expect(_d2.path).toBe(`d2`)

      expect(_d1.lazyLoadStatus).toBe('loaded')

      verifyParentChildRelationForTree(treeView)
    })

    it('APIでエラーが発生した場合', async () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

      pageLogic.setAllTreeNodes([])

      td.when(storageLogic.createDir(`dA`)).thenReject(new Error())

      await pageLogic.createStorageDir(`dA`)

      // ノードリストに変化がないことを検証
      expect(pageLogic.getAllTreeNodes()).toEqual([pageLogic.getRootTreeNode()])
    })
  })

  describe('createArticleTypeDir', () => {
    it('バンドルの作成', async () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic({ storageType: 'article' })
      const articleLogic = storageLogic as ArticleStorageLogic

      // articles
      // └[バンドル]
      const bundle = newTreeDirNodeInput(`${generateFirestoreId()}`, {
        articleNodeType: StorageArticleNodeType.CategoryBundle,
        articleNodeName: 'バンドル',
        articleSortOrder: 123,
        lazyLoadStatus: 'none',
      })
      pageLogic.setAllTreeNodes([])

      const bundleInput: CreateArticleTypeDirInput = {
        dir: bundle.dir,
        articleNodeType: bundle.articleNodeType!,
        articleNodeName: bundle.articleNodeName!,
      }

      // モック設定
      td.when(articleLogic.createArticleTypeDir(bundleInput)).thenResolve(toStorageNode(bundle))

      // 'バンドル'を作成
      await pageLogic.createArticleTypeDir(bundleInput)

      // articles
      // └バンドル
      const _bundle = pageLogic.getTreeNode(bundle.path)!
      expect(_bundle.path).toBe(bundle.path)

      expect(_bundle.lazyLoadStatus).toBe('loaded')

      verifyParentChildRelationForTree(treeView)
    })

    it('カテゴリの作成', async () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic({ storageType: 'article' })
      const articleLogic = storageLogic as ArticleStorageLogic

      // articles
      // └バンドル
      //   └[カテゴリ1]
      const bundle = newTreeDirNodeInput(`${generateFirestoreId()}`, {
        articleNodeType: StorageArticleNodeType.CategoryBundle,
        articleNodeName: 'バンドル',
        articleSortOrder: 123,
        lazyLoadStatus: 'loaded',
      })
      const cat1 = newTreeDirNodeInput(`${bundle.path}/${generateFirestoreId()}`, {
        articleNodeType: StorageArticleNodeType.Category,
        articleNodeName: 'カテゴリ1',
        articleSortOrder: 123,
        lazyLoadStatus: 'none',
      })
      pageLogic.setAllTreeNodes([bundle])

      const cat1Input: CreateArticleTypeDirInput = {
        dir: cat1.dir,
        articleNodeType: cat1.articleNodeType!,
        articleNodeName: cat1.articleNodeName!,
      }

      // モック設定
      td.when(articleLogic.createArticleTypeDir(cat1Input)).thenResolve(toStorageNode(cat1))

      // 'バンドル/カテゴリ1'を作成
      await pageLogic.createArticleTypeDir(cat1Input)

      // articles
      // └バンドル
      //   └カテゴリ1
      const _bundle = pageLogic.getTreeNode(bundle.path)!
      const _bundle_descendants = _bundle.getDescendants()
      const [_cat1] = _bundle_descendants
      expect(_bundle_descendants.length).toBe(1)
      expect(_cat1.path).toBe(cat1.path)

      expect(_bundle.lazyLoadStatus).toBe('loaded')
      expect(_cat1.lazyLoadStatus).toBe('loaded')

      verifyParentChildRelationForTree(treeView)
    })

    it('記事の作成', async () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic({ storageType: 'article' })
      const articleLogic = storageLogic as ArticleStorageLogic
      const config = useConfig()
      const articleFileName = config.storage.article.fileName

      // articles
      // └バンドル
      //   └[記事1]
      //     └[index1.md]
      const bundle = newTreeDirNodeInput(`${generateFirestoreId()}`, {
        articleNodeType: StorageArticleNodeType.CategoryBundle,
        articleNodeName: 'バンドル',
        articleSortOrder: 123,
        lazyLoadStatus: 'loaded',
      })
      const art1 = newTreeDirNodeInput(`${bundle.path}/${generateFirestoreId()}`, {
        articleNodeType: StorageArticleNodeType.Article,
        articleNodeName: '記事1',
        articleSortOrder: 123,
        lazyLoadStatus: 'none',
      })
      const art1_index = newTreeFileNodeInput(`${art1.path}/${articleFileName}`)
      pageLogic.setAllTreeNodes([bundle])

      const art1Input: CreateArticleTypeDirInput = {
        dir: art1.dir,
        articleNodeType: art1.articleNodeType!,
        articleNodeName: art1.articleNodeName!,
      }

      // モック設定
      td.when(articleLogic.createArticleTypeDir(art1Input)).thenResolve(toStorageNode(art1))
      td.when(articleLogic.getChildren(art1.path)).thenReturn(toStorageNode([art1_index]))

      // 'バンドル/記事1'を作成
      await pageLogic.createArticleTypeDir(art1Input)

      // articles
      // └バンドル
      //   └カテゴリ1
      //     └index1.md
      const _bundle = pageLogic.getTreeNode(bundle.path)!
      const _bundle_descendants = _bundle.getDescendants()
      const [_art1, _art1_index] = _bundle_descendants
      expect(_bundle_descendants.length).toBe(2)
      expect(_art1.path).toBe(art1.path)
      expect(_art1_index.path).toBe(art1_index.path)

      expect(_bundle.lazyLoadStatus).toBe('loaded')
      expect(_art1.lazyLoadStatus).toBe('loaded')

      verifyParentChildRelationForTree(treeView)
    })

    it('APIでエラーが発生した場合', async () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic({ storageType: 'article' })
      const articleLogic = storageLogic as ArticleStorageLogic

      const bundle = newTreeDirNodeInput(`${generateFirestoreId()}`, {
        articleNodeType: StorageArticleNodeType.CategoryBundle,
        articleNodeName: 'バンドル',
        articleSortOrder: 123,
        lazyLoadStatus: 'none',
      })
      pageLogic.setAllTreeNodes([])

      const bundleInput: CreateArticleTypeDirInput = {
        dir: bundle.dir,
        articleNodeType: bundle.articleNodeType!,
        articleNodeName: bundle.articleNodeName!,
      }

      td.when(articleLogic.createArticleTypeDir(bundleInput)).thenReject(new Error())

      await pageLogic.createArticleTypeDir(bundleInput)

      // ノードリストに変化がないことを検証
      expect(pageLogic.getAllTreeNodes()).toEqual([pageLogic.getRootTreeNode()])
    })

    it('ストレージタイプが｢記事｣以外で実行した場合', async () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic({ storageType: 'app' })

      const bundle = newTreeDirNodeInput(`${generateFirestoreId()}`, {
        articleNodeType: StorageArticleNodeType.CategoryBundle,
        articleNodeName: 'バンドル',
        articleSortOrder: 123,
        lazyLoadStatus: 'none',
      })
      pageLogic.setAllTreeNodes([])

      const bundleInput: CreateArticleTypeDirInput = {
        dir: bundle.dir,
        articleNodeType: bundle.articleNodeType!,
        articleNodeName: bundle.articleNodeName!,
      }

      let actual!: Error
      try {
        await pageLogic.createArticleTypeDir(bundleInput)
      } catch (err) {
        actual = err
      }

      expect(actual.message).toBe(`This method cannot be executed by storageType 'app'.`)
    })
  })

  describe('removeStorageNodes', () => {
    it('ベーシックケース', async () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

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
      pageLogic.setAllTreeNodes([dev, projects, blog, src, index, memo, work])

      // モック設定
      td.when(storageLogic.sgetNode({ path: `dev/projects` })).thenReturn(toStorageNode(projects))
      td.when(storageLogic.sgetNode({ path: `dev/memo.txt` })).thenReturn(toStorageNode(memo))

      // 'dev/projects'と'dev/memo.txt'を削除
      await pageLogic.removeStorageNodes([`dev/projects`, `dev/memo.txt`])

      // root
      // ├dev
      // └work
      const _roo_descendants = pageLogic.getRootTreeNode().getDescendants()
      expect(_roo_descendants.length).toBe(2)
      expect(_roo_descendants[0].path).toBe(`dev`)
      expect(_roo_descendants[1].path).toBe(`work`)

      const exp1 = td.explain(storageLogic.removeDir)
      expect(exp1.calls[0].args[0]).toBe(`dev/projects`)
      const exp2 = td.explain(storageLogic.removeFile)
      expect(exp2.calls[0].args[0]).toBe(`dev/memo.txt`)

      verifyParentChildRelationForTree(treeView)
    })

    it('ルートディレクトリ直下のノードを削除', async () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

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
      pageLogic.setAllTreeNodes([dev, projects, blog, src, index, memo, work])

      // モック設定
      td.when(storageLogic.sgetNode({ path: `dev` })).thenReturn(toStorageNode(dev))

      // 'dev'を削除
      await pageLogic.removeStorageNodes([`dev`])

      // root
      // └work
      const _roo_descendants = pageLogic.getRootTreeNode().getDescendants()
      expect(_roo_descendants.length).toBe(1)
      expect(_roo_descendants[0].path).toBe(`work`)

      const exp = td.explain(storageLogic.removeDir)
      expect(exp.calls[0].args[0]).toBe(`dev`)

      verifyParentChildRelationForTree(treeView)
    })

    it('存在しないパスを指定した場合', async () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

      pageLogic.setAllTreeNodes([])

      // モック設定
      const expected = new Error()
      td.when(storageLogic.sgetNode({ path: `dXXX` })).thenThrow(expected)

      let actual!: Error
      try {
        await pageLogic.removeStorageNodes([`dXXX`])
      } catch (err) {
        actual = err
      }

      expect(actual).toBe(expected)
    })

    it('APIでエラーが発生した場合', async () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

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
      pageLogic.setAllTreeNodes([dev, projects, blog, src, index, memo, work])

      // モック設定
      {
        td.when(storageLogic.sgetNode({ path: `dev/projects` })).thenReturn(toStorageNode(projects))
        td.when(storageLogic.sgetNode({ path: `dev/memo.txt` })).thenReturn(toStorageNode(memo))
        // 'dev/projects'の削除でAPIエラーを発生させる
        td.when(storageLogic.removeDir(`dev/projects`)).thenReject(new Error())
        td.when(storageLogic.removeFile(`dev/memo.txt`)).thenResolve()
      }

      // 'dev/projects'と'dev/memo.txt'を削除
      await pageLogic.removeStorageNodes([`dev/projects`, `dev/memo.txt`])

      // root
      // ├dev
      // │└projects ← 削除されなかった
      // │  └blog
      // │    └src
      // │      └index.html
      // └work
      const _root_children = pageLogic.getRootTreeNode().children
      expect(_root_children[0].path).toBe(`dev`)
      expect(_root_children[1].path).toBe(`work`)

      // 'dev/projects'は削除されていないことを検証
      // ※'dev/memo.txt'は削除されている
      const _projects = pageLogic.getTreeNode(`dev/projects`)!
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
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

      // root
      // ├dev
      // │├projects ← workへ移動
      // ││└blog
      // ││  └src
      // ││    └index.html
      // │└memo.txt ← workへ移動
      // └work ← クライアントに読み込まれていない
      const dev = newTreeDirNodeInput(`dev`)
      const projects = newTreeDirNodeInput(`dev/projects`)
      const blog = newTreeDirNodeInput(`dev/projects/blog`)
      const src = newTreeDirNodeInput(`dev/projects/blog/src`)
      const index = newTreeFileNodeInput(`dev/projects/blog/src/index.html`)
      const memo = newTreeFileNodeInput(`dev/memo.txt`)
      const work = newTreeDirNodeInput(`work`)
      pageLogic.setAllTreeNodes([dev, projects, blog, src, index, memo])

      // モック設定
      {
        const to_projects = cloneTreeNodeInput(projects, { dir: `work`, path: `work/projects` })
        const to_blog = cloneTreeNodeInput(blog, { dir: `work/projects`, path: `work/projects/blog` })
        const to_src = cloneTreeNodeInput(src, { dir: `work/projects/blog`, path: `work/projects/blog/src` })
        const to_index = cloneTreeNodeInput(index, { dir: `work/projects/blog/src`, path: `work/projects/blog/src/index.html` })
        const to_memo = cloneTreeNodeInput(memo, { dir: `work`, path: `work/memo.txt` })

        // 0. 対象ノードの取得
        td.when(storageLogic.sgetNode({ path: `dev/projects` })).thenReturn(toStorageNode(projects))
        td.when(storageLogic.sgetNode({ path: `dev/memo.txt` })).thenReturn(toStorageNode(memo))

        // 1. APIによる移動処理を実行
        td.when(storageLogic.moveDir(`dev/projects`, `work/projects`)).thenResolve(toStorageNode([to_projects, to_blog, to_src, to_index]))
        td.when(storageLogic.moveFile(`dev/memo.txt`, `work/memo.txt`)).thenResolve(toStorageNode(to_memo))

        // 2. 移動先ディレクトリとその上位ディレクトリ階層の作成
        td.when(storageLogic.fetchHierarchicalNodes(`work`)).thenResolve(toStorageNode([work]))
      }

      // 'dev/projects'と'dev/memo.txt'を'work'へ移動
      await pageLogic.moveStorageNodes([`dev/projects`, `dev/memo.txt`], `work`)

      // root
      // ├dev
      // └work
      //   ├projects
      //   │└blog
      //   │  └src
      //   │    └index.html
      //   └memo.txt

      // 'dev'の階層構造の検証
      {
        const _dev = pageLogic.getTreeNode(`dev`)!
        // 子孫ノードの検証
        expect(_dev.getDescendants().length).toBe(0)
      }
      // 'work'の階層構造の検証
      {
        const _work = pageLogic.getTreeNode(`work`)!
        // 子孫ノードの検証
        const _work_descendants = _work.getDescendants()
        const [_projects, _blog, _src, _index, _memo] = _work_descendants
        expect(_work_descendants.length).toBe(5)
        expect(_projects.path).toBe(`work/projects`)
        expect(_blog.path).toBe(`work/projects/blog`)
        expect(_src.path).toBe(`work/projects/blog/src`)
        expect(_index.path).toBe(`work/projects/blog/src/index.html`)
        expect(_memo.path).toBe(`work/memo.txt`)
        // ディレクトリノードの遅延ロード状態の検証
        expect(_projects.lazyLoadStatus).toBe('loaded')
        expect(_blog.lazyLoadStatus).toBe('loaded')
        expect(_src.lazyLoadStatus).toBe('loaded')
      }

      verifyParentChildRelationForTree(treeView)
    })

    it('ルートディレクトリへ移動', async () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

      // root
      // └dB
      //   ├dA ← ルートディレクトリへ移動
      //   │└fileA.txt
      //   └fileB.txt ← ルートディレクトリへ移動
      const dB = newTreeDirNodeInput(`dB`)
      const dA = newTreeDirNodeInput(`dB/dA`)
      const fileA = newTreeFileNodeInput(`dB/dA/fileA.txt`)
      const fileB = newTreeFileNodeInput(`dB/fileB.txt`)
      pageLogic.setAllTreeNodes([dB, dA, fileA, fileB])

      // モック設定
      {
        const to_dA = cloneTreeNodeInput(dA, { dir: ``, path: `dA` })
        const to_fileA = cloneTreeNodeInput(fileA, { dir: `dA`, path: `dA/fileA.txt` })
        const to_fileB = cloneTreeNodeInput(fileB, { dir: ``, path: `fileB.txt` })

        // 0. 対象ノードの取得
        td.when(storageLogic.sgetNode({ path: `dB/dA` })).thenReturn(toStorageNode(dA))
        td.when(storageLogic.sgetNode({ path: `dB/fileB.txt` })).thenReturn(toStorageNode(fileB))

        // 1. APIによる移動処理を実行
        td.when(storageLogic.moveDir(`dB/dA`, `dA`)).thenResolve(toStorageNode([to_dA, to_fileA]))
        td.when(storageLogic.moveFile(`dB/fileB.txt`, `fileB.txt`)).thenResolve(toStorageNode(to_fileB))

        // 2. 移動先ディレクトリとその上位ディレクトリ階層の作成
        td.when(storageLogic.fetchHierarchicalNodes(``)).thenResolve([])
      }

      // 'dB/dA'と'dB/fileB.txt'をルートノードへ移動
      await pageLogic.moveStorageNodes([`dB/dA`, `dB/fileB.txt`], ``)

      // root
      // ├dA
      // │└fileA.txt
      // ├dB
      // └fileB.txt

      // 'root'の階層構造の検証
      {
        const _root = pageLogic.getTreeNode(``)!
        // 子孫ノードの検証
        expect(_root.children.length).toBe(3)
        const [_dA, _dB, _fileB] = _root.children
        expect(_dA.path).toBe(`dA`)
        expect(_dB.path).toBe(`dB`)
        expect(_fileB.path).toBe(`fileB.txt`)
      }
      // 'dA'の階層構造の検証
      {
        const _dA = pageLogic.getTreeNode(`dA`)!
        // 子孫ノードの検証
        expect(_dA.children.length).toBe(1)
        const [_fileA] = _dA.children
        expect(_fileA.path).toBe(`dA/fileA.txt`)
        // ディレクトリノードの遅延ロード状態の検証
        expect(_dA.lazyLoadStatus).toBe('loaded')
      }
      // 'dB'の階層構造の検証
      {
        const _dB = pageLogic.getTreeNode(`dB`)!
        // 子孫ノードの検証
        expect(_dB.children.length).toBe(0)
      }

      verifyParentChildRelationForTree(treeView)
    })

    it('移動先に同名のディレクトリまたはファイルが存在する場合', async () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

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
      pageLogic.setAllTreeNodes([
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

      // モック設定
      {
        const to_dB_d1 = cloneTreeNodeInput(dA_d1, { dir: `dB`, path: `dB/d1` })
        const to_dB_d11 = cloneTreeNodeInput(dA_d11, { dir: `dB/d1`, path: `dB/d1/d11` })
        const to_dB_d111 = cloneTreeNodeInput(dA_d111, { dir: `dB/d1/d11`, path: `dB/d1/d11/d111` })
        const to_dB_fileA = cloneTreeNodeInput(dA_fileA, { dir: `dB/d1/d11/d111`, path: `dB/d1/d11/d111/fileA.txt` })
        const to_dB_fileB = cloneTreeNodeInput(dA_fileB, { dir: `dB/d1/d11/d111`, path: `dB/d1/d11/d111/fileB.txt` })
        const to_dB_d12 = cloneTreeNodeInput(dA_d12, { dir: `dB/d1`, path: `dB/d1/d12` })
        const to_dB_fileX = cloneTreeNodeInput(dA_fileX, { dir: `dB/d1`, path: `dB/d1/fileX.txt` })
        const to_dB_fileY = cloneTreeNodeInput(dA_fileY, { dir: `dB/d1`, path: `dB/d1/fileY.txt` })

        // 0. 対象ノードの取得
        td.when(storageLogic.sgetNode({ path: `dA/d1` })).thenReturn(toStorageNode(dA_d1))

        // 1. APIによる移動処理を実行
        td.when(storageLogic.moveDir(`dA/d1`, `dB/d1`)).thenResolve(
          toStorageNode([to_dB_d1, to_dB_d11, to_dB_d111, to_dB_fileA, to_dB_fileB, dB_fileC, to_dB_d12, dB_d13, to_dB_fileX, to_dB_fileY, dB_fileZ])
        )

        // 2. 移動先ディレクトリとその上位ディレクトリ階層の作成
        td.when(storageLogic.fetchHierarchicalNodes(`dB`)).thenResolve(toStorageNode([dB]))
      }

      // 'dA/d1'を'dB'へ移動
      await pageLogic.moveStorageNodes([`dA/d1`], `dB`)

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
      //     ├fileX.txt
      //     ├fileY.txt
      //     └fileZ.txt

      // 'dA'の階層構造の検証
      {
        const _dA = pageLogic.getTreeNode(`dA`)!
        // 子孫ノードの検証
        expect(_dA.getDescendants().length).toBe(0)
      }
      // 'dB'の階層構造の検証
      {
        const _dB = pageLogic.getTreeNode(`dB`)!
        // 子孫ノードの検証
        const _dB_descendants = _dB.getDescendants()
        const [_d1, _d11, _d111, _fileA, _fileB, _fileC, _d12, _d13, _fileX, _fileY, _fileZ] = _dB_descendants
        expect(_dB_descendants.length).toBe(11)
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
        // ディレクトリノードの遅延ロード状態の検証
        expect(_d1.lazyLoadStatus).toBe('loaded')
        expect(_d11.lazyLoadStatus).toBe('loaded')
        expect(_d111.lazyLoadStatus).toBe('loaded')
        expect(_d12.lazyLoadStatus).toBe('loaded')
        expect(_d13.lazyLoadStatus).toBe('loaded')
      }

      verifyParentChildRelationForTree(treeView)
    })

    it('ルートディレクトリを指定した場合', async () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

      const d1 = newTreeDirNodeInput(`d1`)
      const d2 = newTreeDirNodeInput(`d2`)
      pageLogic.setAllTreeNodes([d1, d2])

      let actual!: Error
      try {
        await pageLogic.moveStorageNodes([``], `tmp`)
      } catch (err) {
        actual = err
      }

      expect(actual.message).toBe(`The root node cannot be moved.`)
    })

    it('存在しないパスを指定した場合', async () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

      const tmp = newTreeDirNodeInput(`tmp`)
      pageLogic.setAllTreeNodes([tmp])

      // モック設定
      const expected = new Error()
      td.when(storageLogic.sgetNode({ path: `dXXX` })).thenThrow(expected)

      let actual!: Error
      try {
        await pageLogic.moveStorageNodes([`dXXX`], `tmp`)
      } catch (err) {
        actual = err
      }

      expect(actual).toBe(expected)
    })

    it('移動先ディレクトリが移動元のサブディレクトリの場合', async () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

      const d1 = newTreeDirNodeInput(`d1`)
      const d2 = newTreeDirNodeInput(`d2`)
      pageLogic.setAllTreeNodes([d1, d2])

      // モック設定
      td.when(storageLogic.sgetNode({ path: `d1` })).thenReturn(toStorageNode(d1))

      let actual!: Error
      try {
        await pageLogic.moveStorageNodes([`d1`], `d1/d11/d1`)
      } catch (err) {
        actual = err
      }

      expect(actual.message).toBe(`The destination directory is its own subdirectory: 'd1' -> 'd1/d11/d1'`)
    })

    it('APIでエラーが発生した場合', async () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

      // root
      // ├dev
      // │├projects ← workへ移動
      // ││└blog
      // ││  └src
      // ││    └index.html
      // │└memo.txt ← workへ移動
      // └work
      const dev = newTreeDirNodeInput(`dev`)
      const projects = newTreeDirNodeInput(`dev/projects`)
      const blog = newTreeDirNodeInput(`dev/projects/blog`)
      const src = newTreeDirNodeInput(`dev/projects/blog/src`)
      const index = newTreeFileNodeInput(`dev/projects/blog/src/index.html`)
      const memo = newTreeFileNodeInput(`dev/memo.txt`)
      const work = newTreeDirNodeInput(`work`)
      pageLogic.setAllTreeNodes([dev, projects, blog, src, index, memo, work])

      // モック設定
      {
        const to_memo = cloneTreeNodeInput(memo, { dir: `work`, path: `work/memo.txt` })

        // 0. 対象ノードの取得
        td.when(storageLogic.sgetNode({ path: `dev/projects` })).thenReturn(toStorageNode(projects))
        td.when(storageLogic.sgetNode({ path: `dev/memo.txt` })).thenReturn(toStorageNode(memo))

        // 1. APIによる移動処理を実行
        // 'dev/projects'の移動でAPIエラーを発生させる
        td.when(storageLogic.moveDir(`dev/projects`, `work/projects`)).thenReject(new Error())
        td.when(storageLogic.moveFile(`dev/memo.txt`, `work/memo.txt`)).thenResolve(toStorageNode(to_memo))

        // 2. 移動先ディレクトリとその上位ディレクトリ階層の作成
        td.when(storageLogic.fetchHierarchicalNodes(`work`)).thenResolve(toStorageNode([work]))
      }

      // 'dev/projects'と'dev/memo.txt'を'work'へ移動
      await pageLogic.moveStorageNodes([`dev/projects`, `dev/memo.txt`], `work`)

      // root
      // ├dev
      // │└projects ← 移動されなかった
      // │  └blog
      // │    └src
      // │      └index.html
      // └work
      //   └memo.txt ← 移動された

      // 'dev'の階層構造の検証
      {
        const _dev = pageLogic.getTreeNode(`dev`)!
        // 子孫ノードの検証
        const _dev_descendants = _dev.getDescendants()
        const [_projects, _blog, _src, _index, _memo] = _dev_descendants
        expect(_dev_descendants.length).toBe(4)
        expect(_projects.path).toBe(`dev/projects`)
        expect(_blog.path).toBe(`dev/projects/blog`)
        expect(_src.path).toBe(`dev/projects/blog/src`)
        expect(_index.path).toBe(`dev/projects/blog/src/index.html`)
      }
      // 'work'の階層構造の検証
      {
        const _work = pageLogic.getTreeNode(`work`)!
        // 子孫ノードの検証
        const _work_descendants = _work.getDescendants()
        const [_memo] = _work_descendants
        expect(_work_descendants.length).toBe(1)
        expect(_memo.path).toBe(`work/memo.txt`)
      }

      verifyParentChildRelationForTree(treeView)
    })

    it('nodeFilterが機能しているか検証', async () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic({ nodeFilter: dirNodeFilter })

      // root
      // ├dev
      // │├projects ← workへ移動
      // │└memo.txt ← workへ移動 - nodeFilterで除外されるのでツリーには存在しない
      // └work ← クライアントに読み込まれていない
      const dev = newTreeDirNodeInput(`dev`)
      const projects = newTreeDirNodeInput(`dev/projects`)
      const memo = newTreeFileNodeInput(`dev/memo.txt`)
      const work = newTreeDirNodeInput(`work`)
      pageLogic.setAllTreeNodes([dev, projects])

      // モック設定
      {
        const to_projects = cloneTreeNodeInput(projects, { dir: `work`, path: `work/projects` })
        const to_memo = cloneTreeNodeInput(memo, { dir: `work`, path: `work/memo.txt` })

        // 0. 対象ノードの取得
        td.when(storageLogic.sgetNode({ path: `dev/projects` })).thenReturn(toStorageNode(projects))
        td.when(storageLogic.sgetNode({ path: `dev/memo.txt` })).thenReturn(toStorageNode(memo))

        // 1. APIによる移動処理を実行
        td.when(storageLogic.moveDir(`dev/projects`, `work/projects`)).thenResolve(toStorageNode([to_projects]))
        td.when(storageLogic.moveFile(`dev/memo.txt`, `work/memo.txt`)).thenResolve(toStorageNode(to_memo))

        // 2. 移動先ディレクトリとその上位ディレクトリ階層の作成
        td.when(storageLogic.fetchHierarchicalNodes(`work`)).thenResolve(toStorageNode([work]))
      }

      // 'dev/projects'と'dev/memo.txt'を'work'へ移動
      await pageLogic.moveStorageNodes([`dev/projects`, `dev/memo.txt`], `work`)

      // root
      // ├dev
      // └work
      //   ├projects
      //   └memo.txt ← nodeFilterで除外されるのでツリーには存在しない

      // 'dev'の階層構造の検証
      {
        const _dev = pageLogic.getTreeNode(`dev`)!
        // 子孫ノードの検証
        expect(_dev.getDescendants().length).toBe(0)
      }
      // 'work'の階層構造の検証
      {
        const _work = pageLogic.getTreeNode(`work`)!
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
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

      // root
      // └dA
      //   └d1 ← x1へリネーム
      //     ├d11
      //     │└fileA.txt
      //     ├d12
      //     └fileB.txt
      const dA = newTreeDirNodeInput(`dA`)
      const d1 = newTreeDirNodeInput(`dA/d1`)
      const d11 = newTreeDirNodeInput(`dA/d1/d11`)
      const fileA = newTreeFileNodeInput(`dA/d1/d11/fileA.txt`)
      const d12 = newTreeDirNodeInput(`dA/d1/d12`)
      const fileB = newTreeFileNodeInput(`dA/d1/fileB.txt`)
      pageLogic.setAllTreeNodes([dA, d1, d11, fileA, d12, fileB])

      // ディレクトリの子ノード読み込みの検証準備
      pageLogic.getTreeNode(`dA/d1`)!.lazyLoadStatus = 'loaded'
      pageLogic.getTreeNode(`dA/d1/d11`)!.lazyLoadStatus = 'loaded'
      pageLogic.getTreeNode(`dA/d1/d12`)!.lazyLoadStatus = 'none'

      // モック設定
      {
        const to_x1 = cloneTreeNodeInput(d1, { name: `x1`, dir: `dA`, path: `dA/x1` })
        const to_d11 = cloneTreeNodeInput(d11, { dir: `dA/x1`, path: `dA/x1/d11` })
        const to_fileA = cloneTreeNodeInput(fileA, { dir: `dA/x1/d11`, path: `dA/x1/d11/fileA.txt` })
        const to_d12 = cloneTreeNodeInput(d12, { dir: `dA/x1`, path: `dA/x1/d12` })
        const to_fileB = cloneTreeNodeInput(fileB, { dir: `dA/x1`, path: `dA/x1/fileB.txt` })

        // 0. 対象ノードの取得
        td.when(storageLogic.sgetNode({ path: `dA/d1` })).thenReturn(d1)

        // 1. APIによる移動処理を実行
        td.when(storageLogic.renameDir(`dA/d1`, `x1`)).thenResolve(toStorageNode([to_x1, to_d11, to_fileA, to_d12, to_fileB]))
      }

      // 'dA/d1'を'dA/x1'へリネーム
      await pageLogic.renameStorageNode(`dA/d1`, `x1`)

      // root
      // └dA
      //   └x1
      //     ├d11
      //     │└fileA.txt
      //     ├d12
      //     └fileB.txt
      const _x1 = pageLogic.getTreeNode(`dA/x1`)!
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
      expect(_d12.lazyLoadStatus).toBe('loaded')

      verifyParentChildRelationForTree(treeView)
    })

    it('ディレクトリのリネーム - 既存のディレクトリ名に文字を付け加える形でリネームをした場合', async () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

      // root
      // └dA
      //   └d1 ← d1XXXへリネーム
      //     ├d11
      //     │└fileA.txt
      //     ├d12
      //     └fileB.txt
      const dA = newTreeDirNodeInput(`dA`)
      const d1 = newTreeDirNodeInput(`dA/d1`)
      const d11 = newTreeDirNodeInput(`dA/d1/d11`)
      const fileA = newTreeFileNodeInput(`dA/d1/d11/fileA.txt`)
      const d12 = newTreeDirNodeInput(`dA/d1/d12`)
      const fileB = newTreeFileNodeInput(`dA/d1/fileB.txt`)
      pageLogic.setAllTreeNodes([dA, d1, d11, fileA, d12, fileB])

      // モック設定
      {
        const to_d1XXX = cloneTreeNodeInput(d1, { name: `d1XXX`, dir: `dA`, path: `dA/d1XXX` })
        const to_d11 = cloneTreeNodeInput(d11, { dir: `dA/d1XXX`, path: `dA/d1XXX/d11` })
        const to_fileA = cloneTreeNodeInput(fileA, { dir: `dA/d1XXX/d11`, path: `dA/d1XXX/d11/fileA.txt` })
        const to_d12 = cloneTreeNodeInput(d12, { dir: `dA/d1XXX`, path: `dA/d1XXX/d12` })
        const to_fileB = cloneTreeNodeInput(fileB, { dir: `dA/d1XXX`, path: `dA/d1XXX/fileB.txt` })

        // 0. 対象ノードの取得
        td.when(storageLogic.sgetNode({ path: `dA/d1` })).thenReturn(d1)

        // 1. APIによる移動処理を実行
        td.when(storageLogic.renameDir(`dA/d1`, `d1XXX`)).thenResolve(toStorageNode([to_d1XXX, to_d11, to_fileA, to_d12, to_fileB]))
      }

      // 'dA/d1'を'dA/d1XXX'へリネーム
      await pageLogic.renameStorageNode(`dA/d1`, `d1XXX`)

      // root
      // └dA
      //   └d1XXX
      //     ├d11
      //     │└fileA.txt
      //     ├d12
      //     └fileB.txt
      const _d1XXX = pageLogic.getTreeNode(`dA/d1XXX`)!
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
      expect(_d12.lazyLoadStatus).toBe('loaded')

      verifyParentChildRelationForTree(treeView)
    })

    it('ファイルのリネーム', async () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

      // root
      // ├dA
      // │└fileA.txt ← fileX.txtへリネーム
      // └dB
      //   └fileB.txt
      const dA = newTreeDirNodeInput(`dA`)
      const fileA = newTreeFileNodeInput(`dA/fileA.txt`)
      const dB = newTreeDirNodeInput(`dB`)
      const fileB = newTreeFileNodeInput(`dB/fileB.txt`)
      pageLogic.setAllTreeNodes([dA, fileA, dB, fileB])

      // モック設定
      {
        const to_fileX = cloneTreeNodeInput(fileA, { name: `fileX`, path: `dA/fileX.txt` })

        // 0. 対象ノードの取得
        td.when(storageLogic.sgetNode({ path: `dA/fileA.txt` })).thenReturn(fileA)

        // 1. APIによる移動処理を実行
        td.when(storageLogic.renameFile(`dA/fileA.txt`, `fileX.txt`)).thenResolve(toStorageNode(to_fileX))
      }

      // 'dA/fileA.txt'を'dA/fileX.txt'へリネーム
      await pageLogic.renameStorageNode(`dA/fileA.txt`, `fileX.txt`)

      // root
      // ├dA
      // │└fileX.txt
      // └dB
      //   └fileB.txt
      const actual = pageLogic.getTreeNode(`dA/fileX.txt`)!
      expect(actual.path).toBe(`dA/fileX.txt`)

      verifyParentChildRelationForTree(treeView)
    })

    it('ルートディレクトリ直下のノードをリネーム', async () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

      // root
      // ├dA ← dXへリネーム
      // │└fileA.txt
      // └dB
      //   └fileB.txt
      const dA = newTreeDirNodeInput(`dA`)
      const fileA = newTreeFileNodeInput(`dA/fileA.txt`)
      const dB = newTreeDirNodeInput(`dB`)
      const fileB = newTreeFileNodeInput(`dB/fileB.txt`)
      pageLogic.setAllTreeNodes([dA, fileA, dB, fileB])

      // ディレクトリの子ノード読み込みの検証準備
      // 詳細な検証は他のテストケースで行うため、
      // ここではエラーが発生しないようなモック化を行う
      td.replace(pageLogic, 'fetchStorageChildren')

      // モック設定
      {
        const to_dX = cloneTreeNodeInput(dA, { name: `dX`, path: `dX` })
        const to_fileA = cloneTreeNodeInput(fileA, { dir: `dX`, path: `dX/fileA.txt` })

        // 0. 対象ノードの取得
        td.when(storageLogic.sgetNode({ path: `dA` })).thenReturn(dA)

        // 1. APIによる移動処理を実行
        td.when(storageLogic.renameDir(`dA`, `dX`)).thenResolve(toStorageNode([to_dX, to_fileA]))
      }

      // 'dA'を'dX'へリネーム
      await pageLogic.renameStorageNode(`dA`, `dX`)

      // root
      // ├dB
      // │└fileB.txt
      // └dX
      //   └fileA.txt
      const _dX = pageLogic.getTreeNode(`dX`)!
      const _dX_descendants = _dX.getDescendants()
      const [_fileA] = _dX_descendants

      expect(_dX_descendants.length).toBe(1)
      expect(_fileA.path).toBe(`dX/fileA.txt`)

      verifyParentChildRelationForTree(treeView)
    })

    it('ルートディレクトリを指定した場合', async () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

      const d1 = newTreeDirNodeInput(`d1`)
      const d2 = newTreeDirNodeInput(`d2`)
      pageLogic.setAllTreeNodes([d1, d2])

      let actual!: Error
      try {
        await pageLogic.renameStorageNode(``, `tmp`)
      } catch (err) {
        actual = err
      }

      expect(actual.message).toBe(`The root node cannot be renamed.`)
    })

    it('存在しないパスを指定した場合', async () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

      pageLogic.setAllTreeNodes([])

      // モック設定
      const expected = new Error()
      td.when(storageLogic.sgetNode({ path: `dXXX` })).thenThrow(expected)

      let actual!: Error
      try {
        await pageLogic.renameStorageNode(`dXXX`, `x1`)
      } catch (err) {
        actual = err
      }

      expect(actual).toBe(expected)
    })

    it('APIでエラーが発生した場合', async () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

      // root
      // └dA
      //   └d1 ← x1へリネーム
      //     └fileA.txt
      const dA = newTreeDirNodeInput(`dA`)
      const d1 = newTreeDirNodeInput(`dA/d1`)
      const fileA = newTreeFileNodeInput(`dA/d1/fileA.txt`)
      pageLogic.setAllTreeNodes([dA, d1, fileA])

      // モック設定
      {
        const to_x1 = cloneTreeNodeInput(d1, { name: `x1`, dir: `dA`, path: `dA/x1` })
        const to_fileA = cloneTreeNodeInput(fileA, { dir: `dA/x1/d11`, path: `dA/x1/fileA.txt` })

        // 0. 対象ノードの取得
        td.when(storageLogic.sgetNode({ path: `dA/d1` })).thenReturn(d1)

        // 1. APIによる移動処理を実行
        td.when(storageLogic.renameDir(`dA/d1`, `x1`)).thenReject(new Error())
      }

      // 'dA/d1'を'dA/x1'へリネーム
      await pageLogic.renameStorageNode(`dA/d1`, `x1`)

      // root
      // └dA
      //   └d1 ← リネームされなかった
      //     └fileA.txt
      const _d1 = pageLogic.getTreeNode(`dA/d1`)!
      const _d1_descendants = _d1.getDescendants()
      const [_fileA] = _d1_descendants

      expect(_d1_descendants.length).toBe(1)
      expect(_fileA.path).toBe(`dA/d1/fileA.txt`)

      verifyParentChildRelationForTree(treeView)
    })
  })

  describe('setStorageNodeShareSettings', () => {
    const NEW_SHARE_SETTINGS: StorageNodeShareSettings = {
      isPublic: true,
      readUIds: ['ichiro'],
      writeUIds: ['ichiro'],
    }

    it('ベーシックケース', async () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

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
      pageLogic.setAllTreeNodes([dA, d1, d11, fileA, fileB, fileC])

      // モック設定
      {
        const to_d1 = cloneTreeNodeInput(d1, { share: NEW_SHARE_SETTINGS })
        const to_fileB = cloneTreeNodeInput(fileB, { share: NEW_SHARE_SETTINGS })

        td.when(storageLogic.sgetNode({ path: `dA/d1` })).thenReturn(toStorageNode(d1))
        td.when(storageLogic.sgetNode({ path: `dA/fileB.txt` })).thenReturn(toStorageNode(fileB))

        td.when(storageLogic.setDirShareSettings(to_d1.path, NEW_SHARE_SETTINGS)).thenResolve(toStorageNode(to_d1))
        td.when(storageLogic.setFileShareSettings(to_fileB.path, NEW_SHARE_SETTINGS)).thenResolve(toStorageNode(to_fileB))
      }

      // 'dA/d1'と'dA/fileB.txt'に共有設定
      await pageLogic.setStorageNodeShareSettings([`dA/d1`, `dA/fileB.txt`], NEW_SHARE_SETTINGS)

      const _dA = pageLogic.getTreeNode(`dA`)!
      const _dA_descendants = _dA.getDescendants()
      const [_d1, _d11, _fileA, _fileB, _fileC] = _dA_descendants
      expect(_dA_descendants.length).toBe(5)
      expect(_d1.share).toEqual(NEW_SHARE_SETTINGS)
      expect(_d11.share).toEqual(EMPTY_SHARE_SETTINGS)
      expect(_fileA.share).toEqual(EMPTY_SHARE_SETTINGS)
      expect(_fileB.share).toEqual(NEW_SHARE_SETTINGS)
      expect(_fileC.share).toEqual(EMPTY_SHARE_SETTINGS)

      verifyParentChildRelationForTree(treeView)
    })

    it('ルートディレクトリを指定した場合', async () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

      const d1 = newTreeDirNodeInput(`d1`)
      const d2 = newTreeDirNodeInput(`d2`)
      pageLogic.setAllTreeNodes([d1, d2])

      let actual!: Error
      try {
        await pageLogic.setStorageNodeShareSettings([``], NEW_SHARE_SETTINGS)
      } catch (err) {
        actual = err
      }

      expect(actual.message).toBe(`The root node cannot be set share settings.`)
    })

    it('存在しないパスを指定した場合', async () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

      pageLogic.setAllTreeNodes([])

      // モック設定
      const expected = new Error()
      td.when(storageLogic.sgetNode({ path: `dXXX` })).thenThrow(expected)

      let actual!: Error
      try {
        await pageLogic.setStorageNodeShareSettings([`dXXX`], NEW_SHARE_SETTINGS)
      } catch (err) {
        actual = err
      }

      expect(actual).toBe(expected)
    })

    it('APIでエラーが発生した場合', async () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

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
      pageLogic.setAllTreeNodes([dA, d1, d11, fileA, fileB, fileC])

      // モック設定
      {
        const to_d1 = cloneTreeNodeInput(d1, { share: NEW_SHARE_SETTINGS })
        const to_fileB = cloneTreeNodeInput(fileB, { share: NEW_SHARE_SETTINGS })

        td.when(storageLogic.sgetNode({ path: `dA/d1` })).thenReturn(toStorageNode(d1))
        td.when(storageLogic.sgetNode({ path: `dA/fileB.txt` })).thenReturn(toStorageNode(fileB))

        // 'dA/d1'の共有設定でAPIエラーを発生させる
        td.when(storageLogic.setDirShareSettings(to_d1.path, NEW_SHARE_SETTINGS)).thenReject(new Error())
        td.when(storageLogic.setFileShareSettings(to_fileB.path, NEW_SHARE_SETTINGS)).thenResolve(toStorageNode(to_fileB))
      }

      // 'dA/d1'と'dA/fileB.txt'に共有設定
      await pageLogic.setStorageNodeShareSettings([`dA/d1`, `dA/fileB.txt`], NEW_SHARE_SETTINGS)

      // root
      // └dA
      //   ├d1 ← 設定されなかった
      //   │└d11
      //   │  └fileA.txt
      //   ├fileB.txt ← 設定された
      //   └fileC.txt
      const _dA = pageLogic.getTreeNode(`dA`)!
      const _dA_descendants = _dA.getDescendants()
      const [_d1, _d11, _fileA, _fileB, _fileC] = _dA_descendants
      expect(_dA_descendants.length).toBe(5)
      expect(_d1.share).toEqual(EMPTY_SHARE_SETTINGS)
      expect(_d11.share).toEqual(EMPTY_SHARE_SETTINGS)
      expect(_fileA.share).toEqual(EMPTY_SHARE_SETTINGS)
      expect(_fileB.share).toEqual(NEW_SHARE_SETTINGS)
      expect(_fileC.share).toEqual(EMPTY_SHARE_SETTINGS)

      verifyParentChildRelationForTree(treeView)
    })

    it('nodeFilterが機能しているか検証', async () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic({ nodeFilter: dirNodeFilter })

      // root
      // ├d1 ← 設定対象
      // └f1.txt ← 設定対象 - nodeFilterで除外されるのでツリーには存在しない
      const d1 = newTreeDirNodeInput(`d1`)
      const f1 = newTreeFileNodeInput(`f1.txt`)
      pageLogic.setAllTreeNodes([d1])

      // モック設定
      {
        const to_d1 = cloneTreeNodeInput(d1, { share: NEW_SHARE_SETTINGS })
        const to_f1 = cloneTreeNodeInput(f1, { share: NEW_SHARE_SETTINGS })

        td.when(storageLogic.sgetNode({ path: `d1` })).thenReturn(toStorageNode(d1))
        td.when(storageLogic.sgetNode({ path: `f1.txt` })).thenReturn(toStorageNode(f1))

        td.when(storageLogic.setDirShareSettings(to_d1.path, NEW_SHARE_SETTINGS)).thenResolve(toStorageNode(to_d1))
        td.when(storageLogic.setFileShareSettings(to_f1.path, NEW_SHARE_SETTINGS)).thenResolve(toStorageNode(to_f1))
      }

      // 'd1'と'f1.txt'に共有設定
      await pageLogic.setStorageNodeShareSettings([`d1`, `f1.txt`], NEW_SHARE_SETTINGS)

      // root
      // ├d1
      // └f1.txt ← nodeFilterで除外されるのでツリーには存在しない
      const _descendants = pageLogic.getRootTreeNode().getDescendants()
      const [_d1] = _descendants
      expect(_descendants.length).toBe(1)
      expect(_d1.share).toEqual(NEW_SHARE_SETTINGS)

      verifyParentChildRelationForTree(treeView)
    })
  })

  describe('onUploaded', () => {
    it('ベーシックケース', async () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

      // root
      // └d1 ← アップロードディレクトリ
      //   ├d11 ← 今回アップロード、子ノード読み込み済み(アップロード前は子ノードが存在しなかった)
      //   │├d111 ← 今回アップロード
      //   ││└fileA.txt ← 今回アップロード
      //   │└fileB.txt ← 今回アップロード
      //   ├d12 ← 今回アップロード、子ノード未読み込み
      //   │└fileC.txt ← 今回アップロード
      //   ├d13 ← 以前アップロード、ツリーにまだ存在しない
      //   │├…
      //   └fileD.txt ← 今回アップロード
      const d1 = newTreeDirNodeInput(`d1`, { lazyLoadStatus: 'none' })
      const d11 = newTreeDirNodeInput(`d1/d11`, { lazyLoadStatus: 'loaded' })
      const d111 = newTreeDirNodeInput(`d1/d11/d111`)
      const fileA = newTreeFileNodeInput(`d1/d11/d111/fileA.txt`)
      const fileB = newTreeFileNodeInput(`d1/d11/fileB.txt`)
      const d12 = newTreeDirNodeInput(`d1/d12`, { lazyLoadStatus: 'none' })
      const fileC = newTreeFileNodeInput(`d1/d12/fileC.txt`)
      const d13 = newTreeDirNodeInput(`d1/d13`)
      const fileD = newTreeFileNodeInput(`d1/fileD.txt`)
      pageLogic.setAllTreeNodes([d1, d11, d12])

      const e: UploadEndedEvent = {
        uploadDirPath: d1.path,
        uploadedFiles: [fileA, fileB, fileC, fileD],
      }

      //
      // モック設定
      //
      // ロジックストア(サーバー)からアップロードディレクトリ直下のノードを取得
      td.when(storageLogic.fetchChildren(e.uploadDirPath)).thenResolve(toStorageNode([d11, d12, d13, fileD]))
      // リロード時の挙動をモック化
      pageLogic.reloadStorageDir.value = async dirPath => {
        pageLogic.setTreeNodes(toStorageNode([d11, d111, fileA, fileB]))
      }

      // アップロードが行われた後のツリーの更新処理を実行
      await pageLogic.onUploaded(e)

      // root
      // └d1
      //   ├d11 ← 子ノードが読み込み済みだったので、リロードにより配下ノードも読み込まれた
      //   │├d111
      //   ││└fileA.txt
      //   │└fileB.txt
      //   ├d12 ← 子ノードが未読み込みだったので、リロードされず配下ノードも読み込まれない
      //   ├d13 ← ツリーに存在しなかったが追加された(配下ノードは読み込まれない)
      //   └fileD.txt
      const actual = pageLogic.getAllTreeNodes()
      const [_root, _d1, _d11, _d111, _fileA, _fileB, _d12, _d13, _fileD] = actual
      expect(actual.length).toBe(9)
      expect(_root.path).toBe(``)
      expect(_d1.path).toBe(`d1`)
      expect(_d11.path).toBe(`d1/d11`)
      expect(_d111.path).toBe(`d1/d11/d111`)
      expect(_fileA.path).toBe(`d1/d11/d111/fileA.txt`)
      expect(_fileB.path).toBe(`d1/d11/fileB.txt`)
      expect(_d12.path).toBe(`d1/d12`)
      expect(_d13.path).toBe(`d1/d13`)
      expect(_fileD.path).toBe(`d1/fileD.txt`)
      // アップロードディレクトリの遅延ロード状態の検証
      expect(_d1.lazyLoadStatus).toBe('loaded')

      verifyParentChildRelationForTree(treeView)
    })

    it('ルートディレクトリへアップロードした場合', async () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic()

      // root ← アップロードディレクトリ
      // ├d1 ← 今回アップロード、子ノード読み込み済み(アップロード前は子ノードが存在しなかった)
      // │└d11 ← 今回アップロード
      // │  └fileA.txt ← 今回アップロード
      // └fileB.txt ← 今回アップロード
      pageLogic.getRootTreeNode().lazyLoadStatus = 'none'
      const d1 = newTreeDirNodeInput(`d1`, { lazyLoadStatus: 'loaded' })
      const d11 = newTreeDirNodeInput(`d1/d11`)
      const fileA = newTreeFileNodeInput(`d1/d11/fileA.txt`)
      const fileB = newTreeFileNodeInput(`fileB.txt`)
      pageLogic.setAllTreeNodes([d1])

      const e: UploadEndedEvent = {
        uploadDirPath: ``,
        uploadedFiles: [fileA, fileB],
      }

      //
      // モック設定
      //
      // ロジックストア(サーバー)からアップロードディレクトリ直下のノードを取得
      td.when(storageLogic.fetchChildren(e.uploadDirPath)).thenResolve(toStorageNode([d1, fileB]))
      // リロード時の挙動をモック化
      pageLogic.reloadStorageDir.value = async dirPath => {
        pageLogic.setTreeNodes(toStorageNode([d11, fileA]))
      }

      // アップロードが行われた後のツリーの更新処理を実行
      await pageLogic.onUploaded(e)

      // root
      // └d1 ← リロードにより配下ノードも読み込まれた
      // │└d11
      // │  └fileA.txt
      // └fileB.txt
      const actual = pageLogic.getAllTreeNodes()
      const [_root, _d1, _d11, _fileA, _fileB] = actual
      expect(actual.length).toBe(5)
      expect(_root.path).toBe(``)
      expect(_d1.path).toBe(`d1`)
      expect(_d11.path).toBe(`d1/d11`)
      expect(_fileA.path).toBe(`d1/d11/fileA.txt`)
      expect(_fileB.path).toBe(`fileB.txt`)
      // アップロードディレクトリの遅延ロード状態の検証
      expect(_root.lazyLoadStatus).toBe('loaded')

      verifyParentChildRelationForTree(treeView)
    })

    it('nodeFilterが機能しているか検証', async () => {
      const { pageLogic, storageLogic, treeView } = newStoragePageLogic({ nodeFilter: dirNodeFilter })

      // root ← アップロードディレクトリ
      // └d1
      const d1 = newTreeDirNodeInput(`d1`)
      const fileA = newTreeFileNodeInput(`fileA.txt`) // 今回アップロード
      pageLogic.setAllTreeNodes([d1])

      const e: UploadEndedEvent = {
        uploadDirPath: '',
        uploadedFiles: [fileA],
      }

      //
      // モック設定
      //
      // ロジックストア(サーバー)からアップロードディレクトリ直下のノードを取得
      // ・'fileA.txt'がアップロードされた
      td.when(storageLogic.fetchChildren(e.uploadDirPath)).thenResolve(toStorageNode([d1, fileA]))

      // アップロードが行われた後のツリーの更新処理を実行
      await pageLogic.onUploaded(e)

      // root
      // ├d1
      // └fileA.txt ← nodeFilterで除外されるのでツリーには存在しない
      const actual = pageLogic.getAllTreeNodes()
      const [_root, _d1] = actual
      expect(actual.length).toBe(2)
      expect(_root.path).toBe(``)
      expect(_d1.path).toBe(`d1`)

      verifyParentChildRelationForTree(treeView)
    })
  })

  describe('getDisplayNodeName', () => {
    it('一般ノードの場合', () => {
      const { pageLogic } = newStoragePageLogic()

      // root
      // └d1 ← 対象ノードに指定
      const d1 = newTestStorageDirNode(`d1`)

      const actual = pageLogic.getDisplayNodeName(d1)

      expect(actual).toBe(d1.name)
    })

    it('記事系ノードの場合', () => {
      const { pageLogic } = newStoragePageLogic()

      // articles
      // └ブログ ← 対象ノードに指定
      const { blog } = newListBundleFamilyNodes()

      const actual = pageLogic.getDisplayNodeName(blog)

      expect(actual).toBe(blog.articleNodeName)
    })

    it('アセットディレクトリの場合 - ストレージタイプが｢記事｣以外の場合', () => {
      const { pageLogic } = newStoragePageLogic({ storageType: 'app' })
      const config = useConfig()

      // articles
      // ├ブログ
      // │└記事1
      // └アセット ← 対象ノードに指定
      const assets = newTestStorageDirNode(`${config.storage.article.assetsName}`)

      const actual = pageLogic.getDisplayNodeName(assets)

      expect(actual).toBe(assets.name)
    })

    it('アセットディレクトリの場合 - ストレージタイプが｢記事｣の場合', () => {
      const { pageLogic } = newStoragePageLogic({ storageType: 'article' })
      const config = useConfig()
      const { tc } = useI18n()

      // articles
      // ├ブログ
      // │└記事1
      // └アセット ← 対象ノードに指定
      const assets = newTestStorageDirNode(`${config.storage.article.assetsName}`)

      const actual = pageLogic.getDisplayNodeName(assets)

      expect(actual).toBe(String(tc('storage.asset', 2)))
    })
  })

  describe('getDisplayNodePath', () => {
    it('ストレージタイプが｢記事｣以外の場合', () => {
      const { pageLogic, storageLogic } = newStoragePageLogic()

      // root
      // └d1
      //   └fileA.txt ← 対象ノードに指定
      const d1 = newTestStorageDirNode(`d1`)
      const fileA = newTestStorageFileNode(`d1/fileA.txt`)

      // モック設定
      td.when(storageLogic.getNode({ path: `${fileA.path}` })).thenReturn(fileA)
      td.when(storageLogic.getHierarchicalNodes(`${fileA.path}`)).thenReturn([d1, fileA])

      const actual = pageLogic.getDisplayNodePath({ path: fileA.path })

      expect(actual).toBe(`${d1.name}/${fileA.name}`)
    })

    it('ストレージタイプが｢記事｣の場合', () => {
      const { pageLogic, storageLogic } = newStoragePageLogic()

      // articles
      // └ブログ
      //   └記事1 ← 対象ノードに指定
      const { blog, art1 } = newListBundleFamilyNodes()

      // モック設定
      td.when(storageLogic.getNode({ path: `${art1.path}` })).thenReturn(art1)
      td.when(storageLogic.getHierarchicalNodes(`${art1.path}`)).thenReturn([blog, art1])

      const actual = pageLogic.getDisplayNodePath({ path: art1.path })

      expect(actual).toBe(`${blog.articleNodeName}/${art1.articleNodeName}`)
    })
  })

  describe('getNodeIcon', () => {
    it('一般ノードの場合', () => {
      const { pageLogic } = newStoragePageLogic()

      // root
      // └d1 ← 対象ノードに指定
      const d1 = newTestStorageDirNode(`d1`)

      const actual = pageLogic.getNodeIcon(d1)

      expect(actual).toBe(StorageNodeType.getIcon(d1.nodeType))
    })

    it('記事系ノードの場合', () => {
      const { pageLogic } = newStoragePageLogic()

      // articles
      // └ブログ ← 対象ノードに指定
      const { blog } = newListBundleFamilyNodes()

      const actual = pageLogic.getNodeIcon(blog)

      expect(actual).toBe(StorageArticleNodeType.getIcon(blog.articleNodeType))
    })

    it(`アセットディレクトリの場合 - ストレージタイプが｢記事｣以外の場合`, () => {
      const { pageLogic } = newStoragePageLogic({ storageType: 'app' })
      const config = useConfig()

      // articles
      // └アセット ← 対象ノードに指定
      const assets = newTestStorageDirNode(`${config.storage.article.assetsName}`)

      const actual = pageLogic.getNodeIcon(assets)

      expect(actual).toBe(StorageNodeType.getIcon(assets.nodeType))
    })

    it('アセットディレクトリの場合 - ストレージタイプが｢記事｣の場合', () => {
      const { pageLogic } = newStoragePageLogic({ storageType: 'article' })
      const config = useConfig()

      // articles
      // └アセット ← 対象ノードに指定
      const assets = newTestStorageDirNode(`${config.storage.article.assetsName}`)

      const actual = pageLogic.getNodeIcon(assets)

      expect(actual).toBe('photo_library')
    })
  })

  describe('getNodeTypeLabel', () => {
    it('一般ディレクトリの場合', () => {
      const { pageLogic } = newStoragePageLogic()
      const d1 = newTestStorageDirNode(`d1`)

      const actual = pageLogic.getNodeTypeLabel(d1)

      expect(actual).toBe(StorageNodeType.getLabel(d1.nodeType))
    })

    it('記事系ディレクトリの場合', () => {
      const { pageLogic } = newStoragePageLogic()
      const { blog } = newListBundleFamilyNodes()

      const actual = pageLogic.getNodeTypeLabel(blog)

      expect(actual).toBe(StorageArticleNodeType.getLabel(blog.articleNodeType))
    })

    it('ファイルの場合', () => {
      const { pageLogic } = newStoragePageLogic()
      const fileA = newTestStorageFileNode('fileA.txt')

      const actual = pageLogic.getNodeTypeLabel(fileA)

      expect(actual).toBe(StorageNodeType.getLabel(fileA.nodeType))
    })
  })

  describe('isAssetsDir', () => {
    it('アセットディレクトリを指定', () => {
      const { pageLogic, storageLogic } = newStoragePageLogic({ storageType: 'article' })
      const config = useConfig()

      // articles
      // ├ブログ
      // │└記事1
      // └アセット ← 対象ノードに指定
      const assets = newTestStorageDirNode(`${config.storage.article.assetsName}`)

      // モック設定
      td.when(storageLogic.getNode({ path: `${assets.path}` })).thenReturn(assets)

      const actual = pageLogic.isAssetsDir({ path: `${assets.path}` })

      expect(actual).toBeTruthy()
    })

    it('リストバンドル以外を指定した場合', () => {
      const { pageLogic, storageLogic } = newStoragePageLogic({ storageType: 'article' })
      const config = useConfig()

      // articles
      // ├ブログ
      // │└記事1
      // └アセット ← 対象ノードに指定
      const { blog } = newListBundleFamilyNodes()
      const assets = newTestStorageDirNode(`${config.storage.article.assetsName}`)

      // モック設定
      td.when(storageLogic.getNode({ path: `${blog.path}` })).thenReturn(blog)

      const actual = pageLogic.isAssetsDir({ path: `${blog.path}` })

      expect(actual).toBeFalsy()
    })
  })

  describe('isListBundle', () => {
    it('リストバンドルを指定', () => {
      const { pageLogic, storageLogic } = newStoragePageLogic({ storageType: 'article' })

      // articles
      // └ブログ ← 対象ノードに指定
      //   └記事1
      const { blog } = newListBundleFamilyNodes()

      // モック設定
      td.when(storageLogic.getNode({ path: `${blog.path}` })).thenReturn(blog)

      const actual = pageLogic.isListBundle({ path: `${blog.path}` })

      expect(actual).toBeTruthy()
    })

    it('リストバンドル以外を指定した場合', () => {
      const { pageLogic, storageLogic } = newStoragePageLogic({ storageType: 'article' })

      // articles
      // └ブログ
      //   └記事1 ← 対象ノードに指定
      const { art1 } = newListBundleFamilyNodes()

      // モック設定
      td.when(storageLogic.getNode({ path: `${art1.path}` })).thenReturn(art1)

      const actual = pageLogic.isListBundle({ path: `${art1.path}` })

      expect(actual).toBeFalsy()
    })
  })

  describe('isCategoryBundle', () => {
    it('カテゴリバンドルを指定', () => {
      const { pageLogic, storageLogic } = newStoragePageLogic({ storageType: 'article' })

      // articles
      // └プログラミング ← 対象ノードに指定
      //   └TypeScript
      //     └変数
      //       └index.md
      const { programing } = newCategoryBundleFamilyNodes()

      // モック設定
      td.when(storageLogic.getNode({ path: `${programing.path}` })).thenReturn(programing)

      const actual = pageLogic.isCategoryBundle({ path: `${programing.path}` })

      expect(actual).toBeTruthy()
    })

    it('カテゴリバンドル以外を指定した場合', () => {
      const { pageLogic, storageLogic } = newStoragePageLogic({ storageType: 'article' })

      // articles
      // └プログラミング
      //   └TypeScript ← 対象ノードに指定
      const { ts } = newCategoryBundleFamilyNodes()

      // モック設定
      td.when(storageLogic.getNode({ path: `${ts.path}` })).thenReturn(ts)

      const actual = pageLogic.isCategoryBundle({ path: `${ts.path}` })

      expect(actual).toBeFalsy()
    })
  })

  describe('isCategory', () => {
    it('カテゴリを指定', () => {
      const { pageLogic, storageLogic } = newStoragePageLogic({ storageType: 'article' })

      // articles
      // └プログラミング
      //   └TypeScript ← 対象ノードに指定
      const { programing, ts } = newCategoryBundleFamilyNodes()

      // モック設定
      td.when(storageLogic.getNode({ path: `${ts.path}` })).thenReturn(ts)

      const actual = pageLogic.isCategory({ path: `${ts.path}` })

      expect(actual).toBeTruthy()
    })

    it('カテゴリ以外を指定した場合', () => {
      const { pageLogic, storageLogic } = newStoragePageLogic({ storageType: 'article' })

      // articles
      // └プログラミング
      //   └TypeScript
      //     └変数 ← 対象ノードに指定
      //       └index.md
      const { variable } = newCategoryBundleFamilyNodes()

      // モック設定
      td.when(storageLogic.getNode({ path: `${variable.path}` })).thenReturn(variable)

      const actual = pageLogic.isCategory({ path: `${variable.path}` })

      expect(actual).toBeFalsy()
    })
  })

  describe('isArticle', () => {
    it('記事を指定', () => {
      const { pageLogic, storageLogic } = newStoragePageLogic({ storageType: 'article' })

      // articles
      // └ブログ
      //   └記事1 ← 対象ノードに指定
      //     └index.md
      const { art1, art1_index } = newListBundleFamilyNodes()

      // モック設定
      td.when(storageLogic.getNode({ path: `${art1.path}` })).thenReturn(art1)

      const actual = pageLogic.isArticle({ path: `${art1.path}` })

      expect(actual).toBeTruthy()
    })

    it('記事以外を指定した場合', () => {
      const { pageLogic, storageLogic } = newStoragePageLogic({ storageType: 'article' })
      const config = useConfig()

      // articles
      // └ブログ
      //   └記事1
      //     └index.md ← 対象ノードに指定
      const { art1, art1_index } = newListBundleFamilyNodes()

      // モック設定
      td.when(storageLogic.getNode({ path: `${art1_index.path}` })).thenReturn(art1_index)

      const actual = pageLogic.isArticle({ path: `${art1_index.path}` })

      expect(actual).toBeFalsy()
    })
  })

  describe('isArticleFile', () => {
    it('記事ファイルを指定', () => {
      const { pageLogic, storageLogic } = newStoragePageLogic({ storageType: 'article' })
      const config = useConfig()

      // articles
      // └ブログ
      //   └記事1
      //     └index.md ← 対象ノードに指定
      const { art1, art1_index } = newListBundleFamilyNodes()

      // モック設定
      td.when(storageLogic.getNode({ path: `${art1_index.path}` })).thenReturn(art1_index)
      td.when(storageLogic.getNode({ path: `${art1.path}` })).thenReturn(art1)

      const actual = pageLogic.isArticleFile({ path: `${art1_index.path}` })

      expect(actual).toBeTruthy()
    })

    it('記事ファイル以外を指定した場合', () => {
      const { pageLogic, storageLogic } = newStoragePageLogic({ storageType: 'article' })
      const config = useConfig()

      // articles
      // └ブログ
      //   └記事1 ← 対象ノードに指定
      //     └index.md
      const { blog, art1, art1_index } = newListBundleFamilyNodes()

      // モック設定
      td.when(storageLogic.getNode({ path: `${art1.path}` })).thenReturn(art1)
      td.when(storageLogic.getNode({ path: `${blog.path}` })).thenReturn(blog)

      const actual = pageLogic.isArticleFile({ path: `${art1.path}` })

      expect(actual).toBeFalsy()
    })
  })

  describe('isArticleDescendant', () => {
    it('ベーシックケース', () => {
      const { pageLogic, storageLogic } = newStoragePageLogic({ storageType: 'article' })

      // articles
      // └ブログ
      //   └記事1 ← 祖先に記事がある
      //     └images
      //       └img1.png ← 対象ノードに指定
      const { art1 } = newListBundleFamilyNodes()
      const images = newTestStorageDirNode(`${art1.path}/images`)
      const img1 = newTestStorageFileNode(`${images.path}/img1.png`)

      // モック設定
      td.when(storageLogic.getNode({ path: `${img1.path}` })).thenReturn(img1)
      td.when(storageLogic.getNode({ path: `${images.path}` })).thenReturn(images)
      td.when(storageLogic.getNode({ path: `${art1.path}` })).thenReturn(art1)

      const actual = pageLogic.isArticleDescendant({ path: `${img1.path}` })

      expect(actual).toBeTruthy()
    })

    it('祖先に記事がない場合', () => {
      const { pageLogic, storageLogic } = newStoragePageLogic({ storageType: 'article' })

      // articles
      // └ブログ
      //   └tmp
      //     └memo.txt ← 対象ノードに指定 ※祖先に記事がない
      // ※リストバンドル配下に`tmp`のような一般ディレクトリは作成できない。テスト用に作成。
      const { blog } = newListBundleFamilyNodes()
      const tmp = newTestStorageDirNode(`${blog.path}/tmp`)
      const memo = newTestStorageFileNode(`${tmp.path}/memo.txt`)

      // モック設定
      td.when(storageLogic.getNode({ path: `${memo.path}` })).thenReturn(memo)
      td.when(storageLogic.getNode({ path: `${tmp.path}` })).thenReturn(tmp)
      td.when(storageLogic.getNode({ path: `${blog.path}` })).thenReturn(blog)

      const actual = pageLogic.isArticleDescendant({ path: `${memo.path}` })

      expect(actual).toBeFalsy()
    })
  })
})
