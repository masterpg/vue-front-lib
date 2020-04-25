import * as shortid from 'shortid'
import * as td from 'testdouble'
import { CompTreeNode, CompTreeView, StorageLogic, UploadEndedEvent } from '@/lib'
import { EMPTY_SHARE_SETTINGS, cloneTestStorageNode, newTestStorageDirNode, newTestStorageFileNode } from '../../../../../helpers/common/storage'
import { StorageTreeStore, newStorageTreeStore } from '@/example/views/demo/storage/storage-tree-store'
import { StorageNodeShareSettings } from '@/lib'
import StorageTreeNode from '@/example/views/demo/storage/storage-tree-node.vue'
import { arrayToDict } from 'web-base-lib'
import dayjs from 'dayjs'
import { i18n } from '@/example/i18n'
import { initExampleTest } from '../../../../../helpers/example/init'
import { logic } from '@/example/logic'
import { mount } from '@vue/test-utils'

//========================================================================
//
//  Test helpers
//
//========================================================================

let treeStore!: StorageTreeStore

let treeView!: CompTreeView

let storageLogic!: Omit<StorageLogic, 'baseURL'> & {
  baseURL: StorageLogic['baseURL']
}

function verifyParentChildRelationForTree(treeView: CompTreeView | any) {
  for (let i = 0; i < treeView.children.length; i++) {
    const node = treeView.children[i]
    // ノードの親が空であることを検証
    expect(node.parent).toBeNull()
    // ノードの親子(子孫)関係の検証
    verifyParentChildRelationForNode(node)
  }
}

function verifyParentChildRelationForNode(node: CompTreeNode | any) {
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i] as CompTreeNode | any
    // ノードの親子関係を検証
    expect(child.parent).toBe(node)
    // 孫ノードの検証
    verifyParentChildRelationForNode(child)
  }
}

function shuffle<T>(array: T[]): T[] {
  const result = Object.assign([], array)
  for (let i = result.length - 1; i > 0; i--) {
    const r = Math.floor(Math.random() * (i + 1))
    const tmp = result[i]
    result[i] = result[r]
    result[r] = tmp
  }
  return result
}

//========================================================================
//
//  Tests
//
//========================================================================

beforeAll(async () => {
  await initExampleTest()
})

declare function replace(path: string, f?: any): any

beforeEach(async () => {
  const wrapper = mount(CompTreeView)
  treeView = wrapper.vm as CompTreeView

  storageLogic = td.object<StorageLogic>()
  storageLogic.baseURL = logic.userStorage.baseURL
  td.replace<StorageLogic>(storageLogic, 'sortNodes', logic.userStorage.sortNodes)

  treeStore = newStorageTreeStore('user', storageLogic)
  treeStore.setup(treeView)
})

describe('constructor + init', () => {
  it('ベーシックケース', () => {
    const wrapper = mount(CompTreeView)
    const treeView = wrapper.vm as CompTreeView
    const treeStore = newStorageTreeStore('user', logic.userStorage)
    treeStore.setup(treeView)

    expect(treeStore.rootNode.value).toBe('')
  })

  it('StorageTreeStoreを作成 - ユーザータイプ', () => {
    const wrapper = mount(CompTreeView)
    const treeView = wrapper.vm as CompTreeView
    const treeStore = newStorageTreeStore('user', logic.userStorage)
    treeStore.setup(treeView)

    const rootNodeLabel = String(i18n.t('storage.userRootName'))
    expect(treeStore.rootNode.label).toBe(rootNodeLabel)
    expect(treeStore.rootNode.baseURL).toBe(logic.userStorage.baseURL)
  })

  it('StorageTreeStoreを作成 - アプリケーションタイプ', () => {
    const wrapper = mount(CompTreeView)
    const treeView = wrapper.vm as CompTreeView
    const treeStore = newStorageTreeStore('app', logic.appStorage)
    treeStore.setup(treeView)

    const rootNodeLabel = String(i18n.t('storage.appRootName'))
    expect(treeStore.rootNode.label).toBe(rootNodeLabel)
    expect(treeStore.rootNode.baseURL).toBe(logic.appStorage.baseURL)
  })

  it('既にルートノードが作成されている場合', () => {
    const wrapper = mount(CompTreeView)
    const treeView = wrapper.vm as CompTreeView
    const treeStore = newStorageTreeStore('user', logic.userStorage)
    treeStore.setup(treeView)

    // コンストラクタでルートノードが作成される
    const rootNode = treeStore.rootNode

    // 再度初期化する
    treeStore.setup(treeView)

    // 最初に初期化したルートノードが再利用されていることを検証
    expect(treeStore.rootNode).toBe(rootNode)
  })
})

describe('pullInitialNodes', () => {
  // root
  // └d1
  //   └d11
  //     └f111.txt
  it('ベーシックケース', async () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')

    td.when(storageLogic.fetchChildren(td.matchers.anything())).thenReturn()
    td.when(storageLogic.getNodeDict()).thenReturn(arrayToDict([d1, d11, f111], 'path'))

    await treeStore.pullInitialNodes('d1/d11')
    const actual = treeStore.getAllNodes()

    // ツリービューが想定したノード構成になっているか検証
    expect(actual.length).toBe(4)
    expect(actual[0].value).toBe('')
    expect(actual[1].value).toBe('d1')
    expect(actual[2].value).toBe('d1/d11')
    expect(actual[3].value).toBe('d1/d11/f111.txt')
    // ディレクトリが展開されているか検証
    expect(actual[0].opened).toBeTruthy()
    expect(actual[1].opened).toBeTruthy()
    expect(actual[2].opened).toBeTruthy()
    expect(actual[3].opened).toBeFalsy()
    // 遅延ロードの設定を検証
    expect(actual[0].lazy).toBeTruthy()
    expect(actual[1].lazy).toBeTruthy()
    expect(actual[2].lazy).toBeTruthy()
    expect(actual[3].lazy).toBeFalsy()
    // 遅延ロード完了の検証
    expect(actual[0].lazyLoadStatus).toBe('loaded')
    expect(actual[1].lazyLoadStatus).toBe('loaded')
    expect(actual[2].lazyLoadStatus).toBe('loaded')
    expect(actual[3].lazyLoadStatus).toBe('none')
    // fetchChildren()が正常に呼び出されたか検証
    const exp = td.explain(storageLogic.fetchChildren)
    expect(exp.calls[0].args[0]).toBe('')
    expect(exp.calls[1].args[0]).toBe('d1')
    expect(exp.calls[2].args[0]).toBe('d1/d11')
  })
})

describe('pullChildren', () => {
  it('dirPathを指定した場合 - ルートノードを指定', async () => {
    // root ← 対象
    // ├d1
    // └d3
    const d1 = newTestStorageDirNode('d1')
    const d2 = newTestStorageDirNode('d2')
    const d3 = newTestStorageDirNode('d3')
    treeStore.setAllNodes([d1, d3])
    expect(treeStore.getNode('')!.lazyLoadStatus).toBe('none')

    // APIから以下の状態のノードリストが取得される
    // ・'d2'が追加された
    // ・'d3'が削除(または移動)された
    td.when(storageLogic.fetchChildren('')).thenResolve([d1, d2])

    await treeStore.pullChildren('')
    const actual = treeStore.getAllNodes()
    const [_root, _d1, _d2] = actual

    // root
    // ├d1
    // └d2
    expect(actual.length).toBe(3)
    expect(_root.value).toBe('')
    expect(_d1.value).toBe('d1')
    expect(_d2.value).toBe('d2')

    expect(_root.lazyLoadStatus).toBe('loaded')
  })

  it('dirPathを指定した場合 - ルートノード配下のディレクトリを指定', async () => {
    // root
    // └d1 ← 対象
    //   ├d11
    //   └d13
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const d12 = newTestStorageDirNode('d1/d12')
    const d13 = newTestStorageDirNode('d1/d13')
    treeStore.setAllNodes([d1, d11, d13])
    expect(treeStore.getNode('d1')!.lazyLoadStatus).toBe('none')

    // APIから以下の状態のノードリストが取得される
    // ・'d1/d12'が追加された
    // ・'d1/d13'が削除された
    td.when(storageLogic.fetchChildren('d1')).thenResolve([d11, d12])

    await treeStore.pullChildren('d1')
    const actual = treeStore.getAllNodes()
    const [_root, _d1, _d11, _d12] = actual

    // root
    // └d1
    //   ├d11
    //   └d12
    expect(actual.length).toBe(4)
    expect(_root.value).toBe('')
    expect(_d1.value).toBe('d1')
    expect(_d11.value).toBe('d1/d11')
    expect(_d12.value).toBe('d1/d12')

    expect(_d1.lazyLoadStatus).toBe('loaded')
  })
})

describe('reloadDir', () => {
  it('dirPathにルートノードを指定', async () => {
    // root
    // ├d1
    // │├d11
    // ││└f111.txt
    // │└d12
    // └d2
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const f112 = newTestStorageFileNode('d1/d11/f112.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const d2 = newTestStorageDirNode('d2')
    treeStore.setAllNodes([d1, d11, f111, d12, d2])
    for (const treeNode of treeStore.getAllNodes()) {
      expect(treeNode.lazyLoadStatus).toBe('none')
    }

    // 以下の状態のノードリストを再現する
    // ・'d1/d11/f111.txt'が'f1.txt'へ移動+リネームされた
    // ・'d1/d11/f112.txt'が追加された
    // ・'d1/d12'が削除された
    const renamed_f1 = cloneTestStorageNode(f111, { dir: '', path: 'f1.txt', updated: dayjs() })
    // StorageLogic.getDirDescendants()をモック化
    td.when(storageLogic.getDirDescendants('')).thenReturn([d1, d11, f112, d2, renamed_f1])

    // ルートノードを指定して実行
    await treeStore.reloadDir('')
    const actual = treeStore.getAllNodes()
    const [_root, _d1, _d11, _f112, _d2, _f1] = actual

    // root
    // ├d1
    // │└d11
    // │  └f112.txt
    // ├d2
    // └f1.txt
    expect(actual.length).toBe(6)
    expect(_root.value).toBe('')
    expect(_d1.value).toBe('d1')
    expect(_d11.value).toBe('d1/d11')
    expect(_f112.value).toBe('d1/d11/f112.txt')
    expect(_d2.value).toBe('d2')
    expect(_f1.value).toBe('f1.txt')
    // 遅延ロード状態の検証
    expect(_root.lazyLoadStatus).toBe('loaded')
    expect(_d1.lazyLoadStatus).toBe('loaded')
    expect(_d11.lazyLoadStatus).toBe('loaded')
    expect(_f112.lazyLoadStatus).toBe('none')
    expect(_d2.lazyLoadStatus).toBe('loaded')
    expect(_f1.lazyLoadStatus).toBe('none')
    // fetchHierarchicalDescendants()が正常に呼び出されたか検証
    const exp = td.explain(storageLogic.fetchHierarchicalDescendants)
    expect(exp.calls[0].args[0]).toBe('')

    verifyParentChildRelationForTree(treeView)
  })

  it('dirPathにルートノード配下のディレクトリを指定', async () => {
    // root
    // ├d1
    // │├d11
    // ││├d111
    // │││└f1111.txt
    // ││└f111.txt
    // │└d12
    // └d2
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const d111 = newTestStorageDirNode('d1/d11/d111')
    const f1111 = newTestStorageFileNode('d1/d11/d111/f1111.txt')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const f112 = newTestStorageFileNode('d1/d11/f112.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const d2 = newTestStorageDirNode('d2')
    treeStore.setAllNodes([d1, d11, d111, f1111, f111, d12, d2])
    for (const treeNode of treeStore.getAllNodes()) {
      expect(treeNode.lazyLoadStatus).toBe('none')
    }

    // 以下の状態のノードリストを再現する
    // ・'d1/d11/d111'が削除された
    // ・'d1/d11/f111.txt'が削除され、その後また同じディレクトリに同じ名前でアップロードされた
    // ・'d1/d11/f112.txt'が追加された
    const updated_f111 = cloneTestStorageNode(f111, { id: shortid.generate(), updated: dayjs() })
    // StorageLogic.getNode()をモック化
    td.when(storageLogic.getNode({ path: d1.path })).thenReturn(d1)
    // StorageLogic.getDirDescendants()をモック化
    td.when(storageLogic.getDirDescendants(d11.path)).thenReturn([d11, updated_f111, f112])

    // 'd1/d11'を指定して実行
    await treeStore.reloadDir(d11.path)
    const actual = treeStore.getAllNodes()
    const [_root, _d1, _d11, _f111, _f112, _d12, _d2] = actual

    // root
    // ├d1
    // │├d11
    // ││├f111.txt
    // ││└f112.txt
    // │└d12
    // └d2
    expect(actual.length).toBe(7)
    expect(_root.value).toBe('')
    expect(_d1.value).toBe('d1')
    expect(_d11.value).toBe('d1/d11')
    expect(_f111.value).toBe('d1/d11/f111.txt')
    expect(_f112.value).toBe('d1/d11/f112.txt')
    expect(_d12.value).toBe('d1/d12')
    expect(_d2.value).toBe('d2')
    // 遅延ロード状態の検証
    // ・dirPathに指定されたディレクトリと配下ディレクトリの遅延ロード状態が完了であることを確認
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

  it('dirPathのノードが削除されていた場合', async () => {
    // root
    // ├d1
    // │├d11
    // ││└d111
    // ││  └f1111.txt
    // │└d12
    // └d2
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const d111 = newTestStorageDirNode('d1/d11/d111')
    const f1111 = newTestStorageFileNode('d1/d11/d111/f1111.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const d2 = newTestStorageDirNode('d2')
    treeStore.setAllNodes([d1, d11, d111, f1111, d12, d2])
    for (const treeNode of treeStore.getAllNodes()) {
      expect(treeNode.lazyLoadStatus).toBe('none')
    }

    // 以下の状態のノードリストを再現する
    // ・'d1/d11/d111'が削除され存在しない
    // StorageLogic.getNode()をモック化
    td.when(storageLogic.getNode({ path: d1.path })).thenReturn(d1)
    td.when(storageLogic.getNode({ path: d11.path })).thenReturn(d11)
    td.when(storageLogic.getNode({ path: d111.path })).thenReturn(undefined)
    // StorageLogic.getDirDescendants()をモック化
    td.when(storageLogic.getDirDescendants(d111.path)).thenReturn([])

    // 'd1/d11/d111'を指定して実行
    await treeStore.reloadDir(d111.path)
    const actual = treeStore.getAllNodes()
    const [_root, _d1, _d11, _d12, _d2] = actual

    // root
    // ├d1
    // │├d11
    // │└d12
    // └d2
    expect(actual.length).toBe(5)
    expect(_root.value).toBe('')
    expect(_d1.value).toBe('d1')
    expect(_d11.value).toBe('d1/d11')
    expect(_d12.value).toBe('d1/d12')
    expect(_d2.value).toBe('d2')
    // 遅延ロード状態の検証
    // ・dirPathに指定されたディレクトリが削除されていたので、遅延ロード状態に変化がないことを確認
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

  it('dirPathの上位ノードが削除されていた場合', async () => {
    // root
    // ├d1
    // │├d11
    // ││└d111
    // ││  └f1111.txt
    // │└d12
    // └d2
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const d111 = newTestStorageDirNode('d1/d11/d111')
    const f1111 = newTestStorageFileNode('d1/d11/d111/f1111.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const d2 = newTestStorageDirNode('d2')
    treeStore.setAllNodes([d1, d11, d111, f1111, d12, d2])
    for (const treeNode of treeStore.getAllNodes()) {
      expect(treeNode.lazyLoadStatus).toBe('none')
    }

    // 以下の状態のノードリストを再現する
    // ・'d1/d11'が削除され存在しない
    // StorageLogic.getNode()をモック化
    td.when(storageLogic.getNode({ path: d1.path })).thenReturn(d1)
    td.when(storageLogic.getNode({ path: d11.path })).thenReturn(undefined)
    td.when(storageLogic.getNode({ path: d111.path })).thenReturn(undefined)
    // StorageLogic.getDirDescendants()をモック化
    td.when(storageLogic.getDirDescendants(d111.path)).thenReturn([])

    // 'd1/d11/d111'を指定して実行
    await treeStore.reloadDir(d111.path)
    const actual = treeStore.getAllNodes()
    const [_root, _d1, _d12, _d2] = actual

    // root
    // ├d1
    // │└d12
    // └d2
    expect(actual.length).toBe(4)
    expect(_root.value).toBe('')
    expect(_d1.value).toBe('d1')
    expect(_d12.value).toBe('d1/d12')
    expect(_d2.value).toBe('d2')
    // 遅延ロード状態の検証
    // ・dirPathに指定されたディレクトリ上位ディレクトリが削除されていたので、遅延ロード状態に変化がないことを確認
    expect(_root.lazyLoadStatus).toBe('none')
    expect(_d1.lazyLoadStatus).toBe('none')
    expect(_d12.lazyLoadStatus).toBe('none')
    expect(_d2.lazyLoadStatus).toBe('none')
    // StorageLogic.fetchHierarchicalDescendants()が正常に呼び出されたか検証
    const exp = td.explain(storageLogic.fetchHierarchicalDescendants)
    expect(exp.calls[0].args[0]).toBe(d111.path)

    verifyParentChildRelationForTree(treeView)
  })
})

describe('onUploaded', () => {
  it('ベーシックケース', async () => {
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
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const d111 = newTestStorageDirNode('d1/d11/d111')
    const fileA = newTestStorageFileNode('d1/d11/d111/fileA.txt')
    const fileB = newTestStorageFileNode('d1/d11/fileB.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const fileC = newTestStorageFileNode('d1/d12/fileC.txt')
    const d13 = newTestStorageDirNode('d1/d13')
    const fileD = newTestStorageFileNode('d1/fileD.txt')
    treeStore.setAllNodes([d1, d11, d12])
    treeStore.getNode(d1.path)!.lazyLoadStatus = 'none'
    treeStore.getNode(d11.path)!.lazyLoadStatus = 'loaded'
    treeStore.getNode(d12.path)!.lazyLoadStatus = 'none'

    const e: UploadEndedEvent = {
      uploadDirPath: d1.path,
      uploadedFiles: [fileA, fileB, fileC, fileD],
    }

    //
    // モック設定
    //
    // ロジックストア(サーバー)からアップロードディレクトリ直下のノードを取得
    td.when(storageLogic.fetchChildren(e.uploadDirPath)).thenResolve([d11, d12, d13, fileD])
    // リロード時の挙動をモック化
    const reloadDir = td.replace(treeStore, 'reloadDir')
    td.when(reloadDir(d11.path)).thenDo(() => {
      treeStore.setNodes([d11, d111, fileA, fileB])
    })

    // アップロードが行われた後のツリーの更新処理を実行
    await treeStore.onUploaded(e)

    // root
    // └d1
    //   ├d11 ← リロードにより配下ノードも読み込まれた
    //   │├d111
    //   ││└fileA.txt
    //   │└fileB.txt
    //   ├d12 ← 子ノードが未読み込みだったので、リロードされず配下ノードも読み込まれない
    //   ├d13 ← ツリーに存在しなかったが追加された(配下ノードは読み込まれない)
    //   └fileD.txt
    const actual = treeStore.getAllNodes()
    const [_root, _d1, _d11, _d111, _fileA, _fileB, _d12, _d13, _fileD] = actual
    expect(actual.length).toBe(9)
    expect(_root.value).toBe('')
    expect(_d1.value).toBe('d1')
    expect(_d11.value).toBe('d1/d11')
    expect(_d111.value).toBe('d1/d11/d111')
    expect(_fileA.value).toBe('d1/d11/d111/fileA.txt')
    expect(_fileB.value).toBe('d1/d11/fileB.txt')
    expect(_d12.value).toBe('d1/d12')
    expect(_d13.value).toBe('d1/d13')
    expect(_fileD.value).toBe('d1/fileD.txt')
    // アップロードディレクトリの遅延ロード状態の検証
    expect(_d1.lazyLoadStatus).toBe('loaded')
  })

  it('ルートディレクトリへアップロードした場合', async () => {
    // root ← アップロードディレクトリ
    // ├d1 ← 今回アップロード、子ノード読み込み済み(アップロード前は子ノードが存在しなかった)
    // │└d11 ← 今回アップロード
    // │  └fileA.txt ← 今回アップロード
    // └fileB.txt ← 今回アップロード
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const fileA = newTestStorageFileNode('d1/d11/fileA.txt')
    const fileB = newTestStorageFileNode('fileB.txt')
    treeStore.setAllNodes([d1])
    treeStore.getNode('')!.lazyLoadStatus = 'none'
    treeStore.getNode(d1.path)!.lazyLoadStatus = 'loaded'

    const e: UploadEndedEvent = {
      uploadDirPath: '',
      uploadedFiles: [fileA, fileB],
    }

    //
    // モック設定
    //
    // ロジックストア(サーバー)からアップロードディレクトリ直下のノードを取得
    td.when(storageLogic.fetchChildren(e.uploadDirPath)).thenResolve([d1, fileB])
    // リロード時の挙動をモック化
    const reloadDir = td.replace(treeStore, 'reloadDir')
    td.when(reloadDir(d1.path)).thenDo(() => {
      treeStore.setNodes([d11, fileA])
    })

    // アップロードが行われた後のツリーの更新処理を実行
    await treeStore.onUploaded(e)

    // root
    // └d1 ← リロードにより配下ノードも読み込まれた
    // │└d11
    // │  └fileA.txt
    // └fileB.txt
    const actual = treeStore.getAllNodes()
    const [_root, _d1, _d11, _fileA, _fileB] = actual
    expect(actual.length).toBe(5)
    expect(_root.value).toBe('')
    expect(_d1.value).toBe('d1')
    expect(_d11.value).toBe('d1/d11')
    expect(_fileA.value).toBe('d1/d11/fileA.txt')
    expect(_fileB.value).toBe('fileB.txt')
    // アップロードディレクトリの遅延ロード状態の検証
    expect(_root.lazyLoadStatus).toBe('loaded')
  })
})

describe('getAllNodes', () => {
  it('ベーシックケース', () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const d2 = newTestStorageDirNode('d2')
    const d21 = newTestStorageDirNode('d2/d21')
    const f211 = newTestStorageFileNode('d2/d21/f211.txt')
    const f1 = newTestStorageFileNode('f1.txt')
    treeStore.setAllNodes([d1, d11, f111, d12, d2, d21, f211, f1])

    const actual = treeStore.getAllNodes()

    expect(actual.length).toBe(9)
    expect(actual[0].value).toBe('')
    expect(actual[1].value).toBe('d1')
    expect(actual[2].value).toBe('d1/d11')
    expect(actual[3].value).toBe('d1/d11/f111.txt')
    expect(actual[4].value).toBe('d1/d12')
    expect(actual[5].value).toBe('d2')
    expect(actual[6].value).toBe('d2/d21')
    expect(actual[7].value).toBe('d2/d21/f211.txt')
    expect(actual[8].value).toBe('f1.txt')
  })
})

describe('getNode', () => {
  it('ベーシックケース', () => {
    const d1 = newTestStorageDirNode('d1')
    const d2 = newTestStorageDirNode('d2')
    treeStore.setAllNodes([d1, d2])

    const actual = treeStore.getNode('d1')!

    expect(actual.value).toBe('d1')
  })

  it('ルートノードを取得', () => {
    const d1 = newTestStorageDirNode('d1')
    const d2 = newTestStorageDirNode('d2')
    treeStore.setAllNodes([d1, d2])

    const actual = treeStore.getNode('')!

    expect(actual.value).toBe('')
  })
})

describe('setAllNodes', () => {
  it('ソートされていないノードリストを渡した場合', () => {
    // root
    // ├d1
    // │├d11
    // ││└f111.txt
    // │└d12
    // ├d2
    // │└d21
    // │  └f211.txt
    // └f1.txt
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const d2 = newTestStorageDirNode('d2')
    const d21 = newTestStorageDirNode('d2/d21')
    const f211 = newTestStorageFileNode('d2/d21/f211.txt')
    const f1 = newTestStorageFileNode('f1.txt')

    treeStore.setAllNodes(shuffle([d1, d11, f111, d12, d2, d21, f211, f1]))
    const actual = treeStore.getAllNodes()

    expect(actual.length).toBe(9)
    expect(actual[0].value).toBe('')
    expect(actual[1].value).toBe('d1')
    expect(actual[2].value).toBe('d1/d11')
    expect(actual[3].value).toBe('d1/d11/f111.txt')
    expect(actual[4].value).toBe('d1/d12')
    expect(actual[5].value).toBe('d2')
    expect(actual[6].value).toBe('d2/d21')
    expect(actual[7].value).toBe('d2/d21/f211.txt')
    expect(actual[8].value).toBe('f1.txt')

    verifyParentChildRelationForTree(treeView)
  })
})

describe('mergeAllNodes', () => {
  it('ベーシックケース', () => {
    // root
    // ├d1
    // │├d11
    // ││└f111.txt
    // │└d12
    // └d2
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const d2 = newTestStorageDirNode('d2')
    treeStore.setAllNodes([d1, d11, f111, d12, d2])

    // 以下の状態のノードリストを引数に設定する
    // ・'d1/d11/f111.txt'が'fA.txt'へ移動+リネームされた
    // ・'d1/d11/f11A.txt'が追加された
    // ・'d1/d12'が削除された
    const fA = cloneTestStorageNode(f111, { dir: '', path: 'fA.txt', updated: dayjs() })
    const f11A = newTestStorageFileNode('d1/d11/f11A.txt')
    treeStore.mergeAllNodes([d1, d11, f11A, fA, d2])
    const actual = treeStore.getAllNodes()

    // root
    // ├d1
    // │└d11
    // │  └f11A.txt
    // ├d2
    // └fA.txt
    expect(actual.length).toBe(6)
    expect(actual[0].value).toBe('')
    expect(actual[1].value).toBe('d1')
    expect(actual[2].value).toBe('d1/d11')
    expect(actual[3].value).toBe('d1/d11/f11A.txt')
    expect(actual[4].value).toBe('d2')
    expect(actual[5].value).toBe('fA.txt')

    verifyParentChildRelationForTree(treeView)
  })
})

describe('mergeDirDescendants', () => {
  it('ベーシックケース', () => {
    // root
    // ├d1 ← 対象
    // │├d11
    // ││└f111.txt
    // │└d12
    // │  └f121.txt
    // └d2
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const f112 = newTestStorageFileNode('d1/d11/f112.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const f121 = newTestStorageFileNode('d1/d12/f121.txt')
    const f11 = newTestStorageFileNode('d1/f11.txt')
    const d2 = newTestStorageDirNode('d2')
    treeStore.setAllNodes([d1, d11, f111, d12, f121, d2])

    // ロジックストアから以下の状態のノードリストが取得される
    // ・'d1/d11/f112.txt'が追加された
    // ・'d1/f11.txt'が追加された
    // ・'d1/d12'が削除(または移動)された
    td.when(storageLogic.getDirDescendants(d1.path)).thenReturn([d1, d11, f111, f112, f11])

    treeStore.mergeDirDescendants(d1.path)
    const actual = treeStore.getAllNodes()

    // root
    // ├d1
    // │├d11
    // ││├f111.txt
    // ││└f112.txt
    // │└f11.txt
    // └d2
    expect(actual.length).toBe(7)
    expect(actual[0].value).toBe('')
    expect(actual[1].value).toBe('d1')
    expect(actual[2].value).toBe('d1/d11')
    expect(actual[3].value).toBe('d1/d11/f111.txt')
    expect(actual[4].value).toBe('d1/d11/f112.txt')
    expect(actual[5].value).toBe('d1/f11.txt')
    expect(actual[6].value).toBe('d2')

    verifyParentChildRelationForTree(treeView)
  })

  it('引数ディレクトリが削除されていた', () => {
    // root
    // ├d1 ← 対象
    // │└d11
    // │  └f111.txt
    // └d2
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const d2 = newTestStorageDirNode('d2')
    treeStore.setAllNodes([d1, d11, f111, d2])

    // ロジックストアから以下の状態のノードリストが取得される
    // ・'d1'が削除された
    td.when(storageLogic.getDirDescendants(d1.path)).thenReturn([])

    treeStore.mergeDirDescendants(d1.path)
    const actual = treeStore.getAllNodes()

    // root
    // └d2
    expect(actual.length).toBe(2)
    expect(actual[0].value).toBe('')
    expect(actual[1].value).toBe('d2')

    verifyParentChildRelationForTree(treeView)
  })
})

describe('mergeDirChildren', () => {
  it('ベーシックケース', () => {
    // root
    // ├d1 ← 対象
    // │├d11
    // ││└f111.txt
    // │└d12
    // │  └f121.txt
    // └d2
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const f112 = newTestStorageFileNode('d1/d11/f112.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const f121 = newTestStorageFileNode('d1/d12/f121.txt')
    const f11 = newTestStorageFileNode('d1/f11.txt')
    const d2 = newTestStorageDirNode('d2')
    treeStore.setAllNodes([d1, d11, f111, d12, f121, d2])

    // ロジックストアから以下の状態のノードリストが取得される
    // ・'d1/d11/f112.txt'が追加された
    // ・'d1/f11.txt'が追加された
    // ・'d1/d12'が削除された
    td.when(storageLogic.getDirChildren(d1.path)).thenReturn([d1, d11, f112, f11])

    treeStore.mergeDirChildren(d1.path)
    const actual = treeStore.getAllNodes()

    // root
    // ├d1
    // │├d11
    // ││└f111.txt
    // ││└f112.txt
    // │└f11.txt
    // └d2
    expect(actual.length).toBe(7)
    expect(actual[0].value).toBe('')
    expect(actual[1].value).toBe('d1')
    expect(actual[2].value).toBe('d1/d11')
    expect(actual[3].value).toBe('d1/d11/f111.txt')
    expect(actual[4].value).toBe('d1/d11/f112.txt')
    expect(actual[5].value).toBe('d1/f11.txt')
    expect(actual[6].value).toBe('d2')

    verifyParentChildRelationForTree(treeView)
  })

  it('引数ディレクトリが削除されていた', () => {
    // root
    // ├d1 ← 対象
    // │└d11
    // │  └f111.txt
    // └d2
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const d2 = newTestStorageDirNode('d2')
    treeStore.setAllNodes([d1, d11, f111, d2])

    // ロジックストアから以下の状態のノードリストが取得される
    // ・'d1'が削除(または移動)された
    td.when(storageLogic.getDirChildren(d1.path)).thenReturn([])

    treeStore.mergeDirChildren(d1.path)
    const actual = treeStore.getAllNodes()

    // root
    // └d2
    expect(actual.length).toBe(2)
    expect(actual[0].value).toBe('')
    expect(actual[1].value).toBe('d2')

    verifyParentChildRelationForTree(treeView)
  })
})

describe('setNode + setNodes', () => {
  it('ツリーに存在しないノードの設定', () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    treeStore.setNodes([d1, d11, f111])

    // ノードが追加されたことを検証
    expect(treeStore.getNode('d1/d11')!.value).toBe('d1/d11')
    expect(treeStore.getNode('d1/d11/f111.txt')!.value).toBe('d1/d11/f111.txt')

    verifyParentChildRelationForTree(treeView)
  })

  it('ツリーに存在するノードの設定', () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const d2 = newTestStorageDirNode('d2')
    treeStore.setAllNodes([d1, d11, f111, d2])

    const created = dayjs('2019-12-01')
    const updated = dayjs('2019-12-02')
    const updatingD11 = Object.assign({}, d11, { created, updated })
    const updatingFileA = Object.assign({}, f111, { created, updated })

    treeStore.setNodes([updatingD11, updatingFileA])

    expect(treeStore.getNode('d1/d11')!.createdDate).toEqual(created)
    expect(treeStore.getNode('d1/d11')!.updatedDate).toEqual(updated)
    expect(treeStore.getNode('d1/d11/f111.txt')!.createdDate).toEqual(created)
    expect(treeStore.getNode('d1/d11/f111.txt')!.updatedDate).toEqual(updated)
  })

  it('ツリーに存在するノードの設定 - 親が変わっていた場合', () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const d2 = newTestStorageDirNode('d2')
    treeStore.setAllNodes([d1, d11, f111, d2])

    // 'd1/d11'が移動+リネームで'd2/d21'となった
    const updated = dayjs()
    const d21_from_d11 = cloneTestStorageNode(d11, { name: 'd21', dir: 'd2', path: 'd2/d21', updated: updated })
    const f211_from_f111 = cloneTestStorageNode(f111, { name: 'f211.txt', dir: 'd2/d21', path: 'd2/d21/f211.txt', updated: updated })
    treeStore.setNodes([d21_from_d11, f211_from_f111])

    const _d21 = treeStore.getNode('d2/d21')!
    expect(_d21.parent!.value).toBe('d2')
    expect(_d21.updatedDate).toEqual(updated)
    const _f211 = treeStore.getNode('d2/d21/f211.txt')!
    expect(_f211.parent!.value).toBe('d2/d21')
    expect(_f211.updatedDate).toEqual(updated)

    verifyParentChildRelationForTree(treeView)
  })

  it('ツリーに存在するノードの設定 - リネームされていた場合', () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const f112 = newTestStorageFileNode('d1/d11/f112.txt')
    treeStore.setAllNodes([d1, d11, f111, f112])

    // 'd1/d11/f112.txt'がリネームされて'd1/d11/f110.txt'となった
    const updated = dayjs()
    const f110_from_f112 = cloneTestStorageNode(f112, { name: 'f110.txt', dir: 'd1/d11', path: 'd1/d11/f110.txt', updated: updated })
    treeStore.setNodes([f110_from_f112])

    const _d11 = treeStore.getNode('d1/d11')!
    const [_f110, _f111] = _d11.children as StorageTreeNode[]
    expect(_f110.value).toBe('d1/d11/f110.txt')
    expect(_f110.label).toBe('f110.txt')
    expect(_f110.updatedDate).toEqual(updated)
    expect(_f111.value).toBe('d1/d11/f111.txt')
    expect(_f111.label).toBe('f111.txt')

    verifyParentChildRelationForTree(treeView)
  })

  it('ディレクトリ削除後また同じディレクトリに同じ名前のディレクトリが作成された場合', () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    treeStore.setAllNodes([d1, d11])

    // 'd1/d11'が削除後また同じディレクトリに同じ名前で作成された
    const created_d11 = cloneTestStorageNode(d11, { id: shortid.generate(), created: dayjs(), updated: dayjs() })
    treeStore.setNodes([created_d11])

    const _d11 = treeStore.getNode('d1/d11')!
    expect(_d11.id).toEqual(created_d11.id)
    expect(_d11.createdDate).toEqual(created_d11.created)
    expect(_d11.updatedDate).toEqual(created_d11.updated)

    verifyParentChildRelationForTree(treeView)
  })

  it('ファイル削除後また同じディレクトリに同じ名前でファイルがアップロードされた場合', () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const f112 = newTestStorageFileNode('d1/d11/f112.txt')
    treeStore.setAllNodes([d1, d11, f111, f112])

    // 'd1/d11/f111.txt'が削除後また同じディレクトリに同じ名前でアップロードされた
    const created_f111 = cloneTestStorageNode(f111, { id: shortid.generate(), created: dayjs(), updated: dayjs() })
    treeStore.setNodes([created_f111])

    const _f111 = treeStore.getNode('d1/d11/f111.txt')!
    expect(_f111.id).toEqual(created_f111.id)
    expect(_f111.createdDate).toEqual(created_f111.created)
    expect(_f111.updatedDate).toEqual(created_f111.updated)

    verifyParentChildRelationForTree(treeView)
  })

  it('ソートされていないノードリストを渡した場合', () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    const d2 = newTestStorageDirNode('d2')
    const d21 = newTestStorageDirNode('d2/d21')
    const f211 = newTestStorageFileNode('d2/d21/f211.txt')
    const f1 = newTestStorageFileNode('f1.txt')
    treeStore.setNodes(shuffle([d1, d11, f111, d12, d2, d21, f211, f1]))
    const actual = treeStore.getAllNodes()

    expect(actual.length).toBe(9)
    expect(actual[0].value).toBe('')
    expect(actual[1].value).toBe('d1')
    expect(actual[2].value).toBe('d1/d11')
    expect(actual[3].value).toBe('d1/d11/f111.txt')
    expect(actual[4].value).toBe('d1/d12')
    expect(actual[5].value).toBe('d2')
    expect(actual[6].value).toBe('d2/d21')
    expect(actual[7].value).toBe('d2/d21/f211.txt')
    expect(actual[8].value).toBe('f1.txt')

    verifyParentChildRelationForTree(treeView)
  })
})

describe('removeNodes', () => {
  it('ベーシックケース', () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const d2 = newTestStorageDirNode('d2')
    const d21 = newTestStorageDirNode('d2/d21')
    const f211 = newTestStorageFileNode('d2/d21/f211.txt')
    treeStore.setAllNodes([d1, d11, f111, d2, d21, f211])

    treeStore.removeNodes(['d1/d11', 'd2/d21/f211.txt'])

    expect(treeStore.getNode('d1/d11')).toBeUndefined()
    expect(treeStore.getNode('d1/d11/f111.txt')).toBeUndefined()
    expect(treeStore.getNode('d2/d21/f211.txt')).toBeUndefined()

    verifyParentChildRelationForTree(treeView)
  })

  it(`'d1/d11'と親である'd1'を同時に指定した場合`, () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    const d12 = newTestStorageDirNode('d1/d12')
    treeStore.setAllNodes([d1, d11, f111, d12])

    treeStore.removeNodes(['d1/d11', 'd1'])

    expect(treeStore.getNode('d1')).toBeUndefined()
    expect(treeStore.getNode('d1/d11')).toBeUndefined()
    expect(treeStore.getNode('d1/d11/f111.txt')).toBeUndefined()
    expect(treeStore.getNode('d1/d12')).toBeUndefined()

    verifyParentChildRelationForTree(treeView)
  })

  it('存在しないパスを指定した場合', () => {
    const d1 = newTestStorageDirNode('d1')
    const d2 = newTestStorageDirNode('d2')
    treeStore.setAllNodes([d1, d2])

    // 何も起こらない
    treeStore.removeNodes(['dXXX'])

    verifyParentChildRelationForTree(treeView)
  })

  it('削除により選択ノードがなくなった場合', () => {
    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    treeStore.setAllNodes([d1, d11, f111])
    // 'd1/d11/f111.txt'を選択ノードに設定
    treeStore.selectedNode = treeStore.getNode(f111.path)!

    treeStore.removeNodes(['d1/d11'])

    expect(treeStore.getNode('d1/d11')).toBeUndefined()
    expect(treeStore.getNode('d1/d11/f111.txt')).toBeUndefined()
    // 選択ノードがルートノードになっていることを検証
    expect(treeStore.selectedNode).toBe(treeStore.rootNode)

    verifyParentChildRelationForTree(treeView)
  })
})

describe('moveNode', () => {
  it('ディレクトリの移動', async () => {
    // root
    // ├dev
    // │└projects ← workへ移動
    // │  └blog
    // │    └src
    // │      └index.html
    // └work
    //   ├assets
    //   └users
    const dev = newTestStorageDirNode('dev')
    const projects = newTestStorageDirNode('dev/projects')
    const blog = newTestStorageDirNode('dev/projects/blog')
    const src = newTestStorageDirNode('dev/projects/blog/src')
    const index = newTestStorageFileNode('dev/projects/blog/src/index.html')
    const work = newTestStorageDirNode('work')
    const assets = newTestStorageDirNode('work/assets')
    const users = newTestStorageDirNode('work/users')
    treeStore.setAllNodes([dev, projects, blog, src, index, work, assets, users])

    // 'dev/projects'を'work'へ移動
    await treeStore.moveNode('dev/projects', 'work/projects')

    // root
    // ├dev
    // └work
    //   ├assets
    //   ├projects
    //   │└blog
    //   │  └src
    //   │    └index.html
    //   └users

    const _dev = treeStore.getNode('dev')!
    expect(_dev.getDescendants().length).toBe(0)

    const _work = treeStore.getNode('work')!
    const _work_descendants = _work.getDescendants()
    const [_assets, _projects, _blog, _src, _index, _users] = _work_descendants
    expect(_work_descendants.length).toBe(6)
    expect(_assets.value).toBe('work/assets')
    expect(_projects.value).toBe('work/projects')
    expect(_blog.value).toBe('work/projects/blog')
    expect(_src.value).toBe('work/projects/blog/src')
    expect(_index.value).toBe('work/projects/blog/src/index.html')
    expect(_users.value).toBe('work/users')

    verifyParentChildRelationForTree(treeView)
  })

  it('ファイルの移動', async () => {
    // root
    // ├d1
    // │├fileA.txt
    // │└fileC.txt
    // └fileB.txt ← d1へ移動
    const d1 = newTestStorageDirNode('d1')
    const fileA = newTestStorageFileNode('d1/fileA.txt')
    const fileC = newTestStorageFileNode('d1/fileC.txt')
    const fileB = newTestStorageFileNode('fileB.txt')
    treeStore.setAllNodes([d1, fileA, fileC, fileB])

    // 'fileB.txt'を'd1'へ移動
    await treeStore.moveNode('fileB.txt', 'd1/fileB.txt')

    // root
    // └d1
    //  ├fileA.txt
    //  ├fileB.txt
    //  └fileC.txt
    const _d1 = treeStore.getNode('d1')!
    const _d1_descendants = _d1.getDescendants()
    const [_fileA, _fileB, _fileC] = _d1_descendants
    expect(_d1_descendants.length).toBe(3)
    expect(_fileA.value).toBe('d1/fileA.txt')
    expect(_fileB.value).toBe('d1/fileB.txt')
    expect(_fileC.value).toBe('d1/fileC.txt')

    verifyParentChildRelationForTree(treeView)
  })

  it('ディレクトリのリネーム', async () => {
    // root
    // ├d1
    // ├d2
    // └d3 ← d0へリネーム
    const d1 = newTestStorageDirNode('d1')
    const d2 = newTestStorageDirNode('d2')
    const d3 = newTestStorageDirNode('d3')
    treeStore.setAllNodes([d1, d2, d3])

    // 'd3'を'd0'へリネーム
    await treeStore.moveNode('d3', 'd0')

    // root
    // ├d0
    // ├d1
    // └d2
    const [_d0, _d1, _d2] = treeStore.rootNode.getDescendants()
    expect(_d0.value).toBe('d0')
    expect(_d1.value).toBe('d1')
    expect(_d2.value).toBe('d2')

    verifyParentChildRelationForTree(treeView)
  })

  it('ファイルのリネーム', async () => {
    // root
    // ├file1.txt
    // ├file2.txt
    // └file3.txt ← file0.txtへリネーム
    const file1 = newTestStorageDirNode('file1.txt')
    const file2 = newTestStorageDirNode('file2.txt')
    const file3 = newTestStorageDirNode('file3.txt')
    treeStore.setAllNodes([file1, file2, file3])

    // 'file3.txt'を'file0.txt'へリネーム
    await treeStore.moveNode('file3.txt', 'file0.txt')

    // root
    // ├file0.txt
    // ├file1.txt
    // └file2.txt
    const [_file0, _file1, _file2] = treeStore.rootNode.getDescendants()
    expect(_file0.value).toBe('file0.txt')
    expect(_file1.value).toBe('file1.txt')
    expect(_file2.value).toBe('file2.txt')

    verifyParentChildRelationForTree(treeView)
  })

  it('ルートディレクトリへ移動', async () => {
    // root
    // └dB
    //   ├dA
    //   │└fileA.txt
    //   └fileB.txt
    const dB = newTestStorageDirNode('dB')
    const dA = newTestStorageDirNode('dB/dA')
    const fileA = newTestStorageFileNode('dB/dA/fileA.txt')
    const fileB = newTestStorageFileNode('dB/fileB.txt')
    treeStore.setAllNodes([dB, dA, fileA, fileB])

    // 'dB/dA'をルートノードへ移動
    await treeStore.moveNode('dB/dA', 'dA')

    // root
    // ├dA
    // │└fileA.txt
    // └dB
    //   └fileB.txt
    const _root = treeStore.getNode('')!
    const [_dA, _fileA, _dB, _fileB] = _root.getDescendants()
    expect(_root.getDescendants().length).toBe(4)
    expect(_dA.value).toBe('dA')
    expect(_fileA.value).toBe('dA/fileA.txt')
    expect(_dB.value).toBe('dB')
    expect(_fileB.value).toBe('dB/fileB.txt')

    verifyParentChildRelationForTree(treeView)
  })

  it('移動先に同名のディレクトリまたはファイルが存在する場合', async () => {
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
    const dA = newTestStorageDirNode('dA')
    const dA_d1 = newTestStorageDirNode('dA/d1')
    const dA_d11 = newTestStorageDirNode('dA/d1/d11')
    const dA_d111 = newTestStorageDirNode('dA/d1/d11/d111')
    const dA_fileA = newTestStorageFileNode('dA/d1/d11/d111/fileA.txt')
    const dA_fileB = newTestStorageFileNode('dA/d1/d11/d111/fileB.txt')
    const dA_d12 = newTestStorageDirNode('dA/d1/d12')
    const dA_fileX = newTestStorageFileNode('dA/d1/fileX.txt')
    const dA_fileY = newTestStorageFileNode('dA/d1/fileY.txt')
    const dB = newTestStorageDirNode('dB')
    const dB_d1 = newTestStorageDirNode('dB/d1')
    const dB_d11 = newTestStorageDirNode('dB/d1/d11')
    const dB_d111 = newTestStorageDirNode('dB/d1/d11/d111')
    const dB_fileA = newTestStorageFileNode('dB/d1/d11/d111/fileA.txt')
    const dB_fileC = newTestStorageFileNode('dB/d1/d11/d111/fileC.txt')
    const dB_d13 = newTestStorageDirNode('dB/d1/d13')
    const dB_fileX = newTestStorageFileNode('dB/d1/fileX.txt')
    const dB_fileZ = newTestStorageFileNode('dB/d1/fileZ.txt')
    treeStore.setAllNodes([
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
    await treeStore.moveNode('dA/d1', 'dB/d1')

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

    const _dA = treeStore.getNode('dA')!
    expect(_dA.getDescendants().length).toBe(0)

    const _dB = treeStore.getNode('dB')!
    const [_d1, _d11, _d111, _fileA, _fileB, _fileC, _d12, _d13, _fileX, _fileY, _fileZ] = _dB.getDescendants()
    expect(_dB.getDescendants().length).toBe(11)
    expect(_d1.value).toBe('dB/d1')
    expect(_d11.value).toBe('dB/d1/d11')
    expect(_d111.value).toBe('dB/d1/d11/d111')
    expect(_fileA.value).toBe('dB/d1/d11/d111/fileA.txt')
    expect(_fileB.value).toBe('dB/d1/d11/d111/fileB.txt')
    expect(_fileC.value).toBe('dB/d1/d11/d111/fileC.txt')
    expect(_d12.value).toBe('dB/d1/d12')
    expect(_d13.value).toBe('dB/d1/d13')
    expect(_fileX.value).toBe('dB/d1/fileX.txt')
    expect(_fileY.value).toBe('dB/d1/fileY.txt')
    expect(_fileZ.value).toBe('dB/d1/fileZ.txt')

    verifyParentChildRelationForTree(treeView)
  })
})

describe('createStorageDir', () => {
  it('ベーシックケース', async () => {
    // root
    // └d1
    //   └d12
    const d1 = newTestStorageDirNode('d1')
    const d12 = newTestStorageDirNode('d1/d12')
    treeStore.setAllNodes([d1, d12])

    // モック設定
    {
      const d11 = newTestStorageDirNode('d1/d11')

      td.when(storageLogic.createDirs(['d1/d11'])).thenResolve([d11])
    }

    // 'd1/d11'を作成
    await treeStore.createStorageDir('d1/d11')

    // root
    // └d1
    //   └d11
    const _d1 = treeStore.getNode('d1')!
    const _d1_descendants = _d1.getDescendants()
    const [_d11, _d12] = _d1_descendants
    expect(_d1_descendants.length).toBe(2)
    expect(_d11.value).toBe('d1/d11')
    expect(_d12.value).toBe('d1/d12')

    expect(_d11.lazyLoadStatus).toBe('loaded')

    verifyParentChildRelationForTree(treeView)
  })

  it('ルートディレクトリ直下に作成', async () => {
    // root
    // └d2
    const d2 = newTestStorageDirNode('d2')
    treeStore.setAllNodes([d2])

    // モック設定
    {
      const d1 = newTestStorageDirNode('d1')

      td.when(storageLogic.createDirs(['d1'])).thenResolve([d1])
    }

    // 'd1'を作成
    await treeStore.createStorageDir('d1')

    // root
    // ├d1
    // └d2
    const _root = treeStore.getNode('')!
    const _root_descendants = _root.getDescendants()
    const [_d1, _d2] = _root_descendants
    expect(_root_descendants.length).toBe(2)
    expect(_d1.value).toBe('d1')
    expect(_d2.value).toBe('d2')

    expect(_d1.lazyLoadStatus).toBe('loaded')

    verifyParentChildRelationForTree(treeView)
  })

  it('APIでエラーが発生した場合', async () => {
    td.when(storageLogic.createDirs(['dA'])).thenReject(new Error())

    await treeStore.createStorageDir('dA')

    // ノードリストに変化がないことを検証
    expect(treeStore.getAllNodes()).toEqual([treeStore.rootNode])
  })
})

describe('removeStorageNodes', () => {
  it('ベーシックケース', async () => {
    // root
    // ├dev
    // │├projects ← 削除
    // ││└blog
    // ││  └src
    // ││    └index.html
    // │└memo.txt ← 削除
    // └work
    const dev = newTestStorageDirNode('dev')
    const projects = newTestStorageDirNode('dev/projects')
    const blog = newTestStorageDirNode('dev/projects/blog')
    const src = newTestStorageDirNode('dev/projects/blog/src')
    const index = newTestStorageFileNode('dev/projects/blog/src/index.html')
    const memo = newTestStorageFileNode('dev/memo.txt')
    const work = newTestStorageDirNode('work')
    treeStore.setAllNodes([dev, projects, blog, src, index, memo, work])

    // 'dev/projects'と'dev/memo.txt'を削除
    await treeStore.removeStorageNodes(['dev/projects', 'dev/memo.txt'])

    // root
    // ├dev
    // └work
    const _roo_descendants = treeStore.rootNode.getDescendants()
    expect(_roo_descendants.length).toBe(2)
    expect(_roo_descendants[0].value).toBe('dev')
    expect(_roo_descendants[1].value).toBe('work')

    const exp1 = td.explain(storageLogic.removeDir)
    expect(exp1.calls[0].args[0]).toBe('dev/projects')
    const exp2 = td.explain(storageLogic.removeFile)
    expect(exp2.calls[0].args[0]).toBe('dev/memo.txt')

    verifyParentChildRelationForTree(treeView)
  })

  it('ルートディレクトリ直下のノードを削除', async () => {
    // root
    // ├dev
    // │├projects
    // ││└blog
    // ││  └src
    // ││    └index.html
    // │└memo.txt
    // └work
    const dev = newTestStorageDirNode('dev')
    const projects = newTestStorageDirNode('dev/projects')
    const blog = newTestStorageDirNode('dev/projects/blog')
    const src = newTestStorageDirNode('dev/projects/blog/src')
    const index = newTestStorageFileNode('dev/projects/blog/src/index.html')
    const memo = newTestStorageFileNode('dev/memo.txt')
    const work = newTestStorageDirNode('work')
    treeStore.setAllNodes([dev, projects, blog, src, index, memo, work])

    // 'dev'を削除
    await treeStore.removeStorageNodes(['dev'])

    // root
    // └work
    const _roo_descendants = treeStore.rootNode.getDescendants()
    expect(_roo_descendants.length).toBe(1)
    expect(_roo_descendants[0].value).toBe('work')

    const exp = td.explain(storageLogic.removeDir)
    expect(exp.calls[0].args[0]).toBe('dev')

    verifyParentChildRelationForTree(treeView)
  })

  it('APIでエラーが発生した場合', async () => {
    // root
    // ├dev
    // │├projects ← 削除
    // ││└blog
    // ││  └src
    // ││    └index.html
    // │└memo.txt ← 削除
    // └work
    const dev = newTestStorageDirNode('dev')
    const projects = newTestStorageDirNode('dev/projects')
    const blog = newTestStorageDirNode('dev/projects/blog')
    const src = newTestStorageDirNode('dev/projects/blog/src')
    const index = newTestStorageFileNode('dev/projects/blog/src/index.html')
    const memo = newTestStorageFileNode('dev/memo.txt')
    const work = newTestStorageDirNode('work')
    treeStore.setAllNodes([dev, projects, blog, src, index, memo, work])

    // モック設定
    {
      // 'dev/projects'の削除でAPIエラーを発生させる
      td.when(storageLogic.removeDir('dev/projects')).thenReject(new Error())
      td.when(storageLogic.removeFile('dev/memo.txt')).thenResolve()
    }

    // 'dev/projects'と'dev/memo.txt'を削除
    await treeStore.removeStorageNodes(['dev/projects', 'dev/memo.txt'])

    // root
    // ├dev
    // │└projects ← 削除されなかった
    // │  └blog
    // │    └src
    // │      └index.html
    // └work
    const _root_children = treeStore.rootNode.children
    expect(_root_children[0].value).toBe('dev')
    expect(_root_children[1].value).toBe('work')

    // 'dev/projects'は削除されていないことを検証
    // ※'dev/memo.txt'は削除されている
    const _projects = treeStore.getNode('dev/projects')!
    const _projects_descendants = _projects.getDescendants()
    expect(_projects_descendants.length).toBe(3)
    expect(_projects_descendants[0].value).toBe('dev/projects/blog')
    expect(_projects_descendants[1].value).toBe('dev/projects/blog/src')
    expect(_projects_descendants[2].value).toBe('dev/projects/blog/src/index.html')

    verifyParentChildRelationForTree(treeView)
  })
})

describe('moveStorageNodes', () => {
  it('ベーシックケース', async () => {
    // root
    // ├dev
    // │├projects ← workへ移動
    // ││└blog
    // ││  └src
    // ││    └index.html
    // │└memo.txt ← workへ移動
    // └work ← 読み込まれていない
    const dev = newTestStorageDirNode('dev')
    let projects = newTestStorageDirNode('dev/projects')
    let blog = newTestStorageDirNode('dev/projects/blog')
    let src = newTestStorageDirNode('dev/projects/blog/src')
    let index = newTestStorageFileNode('dev/projects/blog/src/index.html')
    let memo = newTestStorageFileNode('dev/memo.txt')
    const work = newTestStorageDirNode('work')
    treeStore.setAllNodes([dev, projects, blog, src, index, memo])

    // モック設定
    {
      projects = cloneTestStorageNode(projects, { dir: 'work', path: 'work/projects' })
      blog = cloneTestStorageNode(blog, { dir: 'work/projects', path: 'work/projects/blog' })
      src = cloneTestStorageNode(src, { dir: 'work/projects/blog', path: 'work/projects/blog/src' })
      index = cloneTestStorageNode(index, { dir: 'work/projects/blog/src', path: 'work/projects/blog/src/index.html' })
      memo = cloneTestStorageNode(memo, { dir: 'work', path: 'work/memo.txt' })

      // 1. APIによる移動処理を実行
      td.when(storageLogic.moveDir('dev/projects', 'work/projects')).thenReturn([projects, blog, src, index])
      td.when(storageLogic.moveFile('dev/memo.txt', 'work/memo.txt')).thenReturn(memo)

      // 2. 移動先ディレクトリとその上位ディレクトリ階層の作成
      td.when(storageLogic.fetchHierarchicalNodes('work')).thenReturn([work])
    }

    // 'dev/projects'と'dev/memo.txt'を'work'へ移動
    await treeStore.moveStorageNodes(['dev/projects', 'dev/memo.txt'], 'work')

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
      const _dev = treeStore.getNode('dev')!
      // 子孫ノードの検証
      expect(_dev.getDescendants().length).toBe(0)
    }
    // 'work'の階層構造の検証
    {
      const _work = treeStore.getNode('work')!
      // 子孫ノードの検証
      const _work_descendants = _work.getDescendants()
      const [_projects, _blog, _src, _index, _memo] = _work_descendants
      expect(_work_descendants.length).toBe(5)
      expect(_projects.value).toBe('work/projects')
      expect(_blog.value).toBe('work/projects/blog')
      expect(_src.value).toBe('work/projects/blog/src')
      expect(_index.value).toBe('work/projects/blog/src/index.html')
      expect(_memo.value).toBe('work/memo.txt')
      // ディレクトリノードの遅延ロード状態の検証
      expect(_projects.lazyLoadStatus).toBe('loaded')
      expect(_blog.lazyLoadStatus).toBe('loaded')
      expect(_src.lazyLoadStatus).toBe('loaded')
    }

    verifyParentChildRelationForTree(treeView)
  })

  it('ルートディレクトリへ移動', async () => {
    // root
    // └dB
    //   ├dA ← ルートディレクトリへ移動
    //   │└fileA.txt
    //   └fileB.txt ← ルートディレクトリへ移動
    const dB = newTestStorageDirNode('dB')
    let dA = newTestStorageDirNode('dB/dA')
    let fileA = newTestStorageFileNode('dB/dA/fileA.txt')
    let fileB = newTestStorageFileNode('dB/fileB.txt')
    treeStore.setAllNodes([dB, dA, fileA, fileB])

    // モック設定
    {
      dA = cloneTestStorageNode(dA, { dir: '', path: 'dA' })
      fileA = cloneTestStorageNode(fileA, { dir: 'dA', path: 'dA/fileA.txt' })
      fileB = cloneTestStorageNode(fileB, { dir: '', path: 'fileB.txt' })

      // 1. APIによる移動処理を実行
      td.when(storageLogic.moveDir('dB/dA', 'dA')).thenReturn([dA, fileA])
      td.when(storageLogic.moveFile('dB/fileB.txt', 'fileB.txt')).thenReturn(fileB)

      // 2. 移動先ディレクトリとその上位ディレクトリ階層の作成
      td.when(storageLogic.fetchHierarchicalNodes('')).thenReturn([])
    }

    // 'dB/dA'と'dB/fileB.txt'をルートノードへ移動
    await treeStore.moveStorageNodes(['dB/dA', 'dB/fileB.txt'], '')

    // root
    // ├dA
    // │└fileA.txt
    // ├dB
    // └fileB.txt

    // 'root'の階層構造の検証
    {
      const _root = treeStore.getNode('')!
      // 子孫ノードの検証
      expect(_root.children.length).toBe(3)
      const [_dA, _dB, _fileB] = _root.children
      expect(_dA.value).toBe('dA')
      expect(_dB.value).toBe('dB')
      expect(_fileB.value).toBe('fileB.txt')
    }
    // 'dA'の階層構造の検証
    {
      const _dA = treeStore.getNode('dA')!
      // 子孫ノードの検証
      expect(_dA.children.length).toBe(1)
      const [_fileA] = _dA.children
      expect(_fileA.value).toBe('dA/fileA.txt')
      // ディレクトリノードの遅延ロード状態の検証
      expect(_dA.lazyLoadStatus).toBe('loaded')
    }
    // 'dB'の階層構造の検証
    {
      const _dB = treeStore.getNode('dB')!
      // 子孫ノードの検証
      expect(_dB.children.length).toBe(0)
    }

    verifyParentChildRelationForTree(treeView)
  })

  it('移動先に同名のディレクトリまたはファイルが存在する場合', async () => {
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
    const dA = newTestStorageDirNode('dA')
    const dA_d1 = newTestStorageDirNode('dA/d1')
    const dA_d11 = newTestStorageDirNode('dA/d1/d11')
    const dA_d111 = newTestStorageDirNode('dA/d1/d11/d111')
    const dA_fileA = newTestStorageFileNode('dA/d1/d11/d111/fileA.txt')
    const dA_fileB = newTestStorageFileNode('dA/d1/d11/d111/fileB.txt')
    const dA_d12 = newTestStorageDirNode('dA/d1/d12')
    const dA_fileX = newTestStorageFileNode('dA/d1/fileX.txt')
    const dA_fileY = newTestStorageFileNode('dA/d1/fileY.txt')
    const dB = newTestStorageDirNode('dB')
    let dB_d1 = newTestStorageDirNode('dB/d1')
    let dB_d11 = newTestStorageDirNode('dB/d1/d11')
    let dB_d111 = newTestStorageDirNode('dB/d1/d11/d111')
    let dB_fileA = newTestStorageFileNode('dB/d1/d11/d111/fileA.txt')
    const dB_fileC = newTestStorageFileNode('dB/d1/d11/d111/fileC.txt')
    const dB_d13 = newTestStorageDirNode('dB/d1/d13')
    let dB_fileX = newTestStorageFileNode('dB/d1/fileX.txt')
    const dB_fileZ = newTestStorageFileNode('dB/d1/fileZ.txt')
    treeStore.setAllNodes([
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
      dB_d1 = cloneTestStorageNode(dA_d1, { dir: 'dB', path: 'dB/d1' })
      dB_d11 = cloneTestStorageNode(dA_d11, { dir: 'dB/d1', path: 'dB/d1/d11' })
      dB_d111 = cloneTestStorageNode(dA_d111, { dir: 'dB/d1/d11', path: 'dB/d1/d11/d111' })
      dB_fileA = cloneTestStorageNode(dA_fileA, { dir: 'dB/d1/d11/d111', path: 'dB/d1/d11/d111/fileA.txt' })
      const dB_fileB = cloneTestStorageNode(dA_fileB, { dir: 'dB/d1/d11/d111', path: 'dB/d1/d11/d111/fileB.txt' })
      const dB_d12 = cloneTestStorageNode(dA_d12, { dir: 'dB/d1', path: 'dB/d1/d12' })
      dB_fileX = cloneTestStorageNode(dA_fileX, { dir: 'dB/d1', path: 'dB/d1/fileX.txt' })
      const dB_fileY = cloneTestStorageNode(dA_fileY, { dir: 'dB/d1', path: 'dB/d1/fileY.txt' })

      // 1. APIによる移動処理を実行
      td.when(storageLogic.moveDir('dA/d1', 'dB/d1')).thenReturn([
        dB_d1,
        dB_d11,
        dB_d111,
        dB_fileA,
        dB_fileB,
        dB_fileC,
        dB_d12,
        dB_d13,
        dB_fileX,
        dB_fileY,
        dB_fileZ,
      ])

      // 2. 移動先ディレクトリとその上位ディレクトリ階層の作成
      td.when(storageLogic.fetchHierarchicalNodes('dB')).thenReturn([dB])
    }

    // 'dA/d1'を'dB'へ移動
    await treeStore.moveStorageNodes(['dA/d1'], 'dB')

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
      const _dA = treeStore.getNode('dA')!
      // 子孫ノードの検証
      expect(_dA.getDescendants().length).toBe(0)
    }
    // 'dB'の階層構造の検証
    {
      const _dB = treeStore.getNode('dB')!
      // 子孫ノードの検証
      const _dB_descendants = _dB.getDescendants()
      const [_d1, _d11, _d111, _fileA, _fileB, _fileC, _d12, _d13, _fileX, _fileY, _fileZ] = _dB_descendants
      expect(_dB_descendants.length).toBe(11)
      expect(_d1.value).toBe('dB/d1')
      expect(_d11.value).toBe('dB/d1/d11')
      expect(_d111.value).toBe('dB/d1/d11/d111')
      expect(_fileA.value).toBe('dB/d1/d11/d111/fileA.txt')
      expect(_fileB.value).toBe('dB/d1/d11/d111/fileB.txt')
      expect(_fileC.value).toBe('dB/d1/d11/d111/fileC.txt')
      expect(_d12.value).toBe('dB/d1/d12')
      expect(_d13.value).toBe('dB/d1/d13')
      expect(_fileX.value).toBe('dB/d1/fileX.txt')
      expect(_fileY.value).toBe('dB/d1/fileY.txt')
      expect(_fileZ.value).toBe('dB/d1/fileZ.txt')
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
    const d1 = newTestStorageDirNode('d1')
    const d2 = newTestStorageDirNode('d2')
    treeStore.setAllNodes([d1, d2])

    let actual!: Error
    try {
      await treeStore.moveStorageNodes([''], 'tmp')
    } catch (err) {
      actual = err
    }

    expect(actual.message).toBe(`The root node cannot be moved.`)
  })

  it('存在しないパスを指定した場合', async () => {
    const d1 = newTestStorageDirNode('d1')
    const d2 = newTestStorageDirNode('d2')
    treeStore.setAllNodes([d1, d2])

    let actual!: Error
    try {
      await treeStore.moveStorageNodes(['dXXX'], 'tmp')
    } catch (err) {
      actual = err
    }

    expect(actual.message).toBe(`The specified node could not be found: 'dXXX'`)
  })

  it('移動先ディレクトリが移動元のサブディレクトリの場合', async () => {
    const d1 = newTestStorageDirNode('d1')
    const d2 = newTestStorageDirNode('d2')
    treeStore.setAllNodes([d1, d2])

    let actual!: Error
    try {
      await treeStore.moveStorageNodes(['d1'], 'd1/d11/d1')
    } catch (err) {
      actual = err
    }

    expect(actual.message).toBe(`The destination directory is its own subdirectory: 'd1' -> 'd1/d11/d1'`)
  })

  it('APIでエラーが発生した場合', async () => {
    // root
    // ├dev
    // │├projects ← workへ移動
    // ││└blog
    // ││  └src
    // ││    └index.html
    // │└memo.txt ← workへ移動
    // └work
    const dev = newTestStorageDirNode('dev')
    const projects = newTestStorageDirNode('dev/projects')
    const blog = newTestStorageDirNode('dev/projects/blog')
    const src = newTestStorageDirNode('dev/projects/blog/src')
    const index = newTestStorageFileNode('dev/projects/blog/src/index.html')
    let memo = newTestStorageFileNode('dev/memo.txt')
    const work = newTestStorageDirNode('work')
    treeStore.setAllNodes([dev, projects, blog, src, index, memo, work])

    // モック設定
    {
      memo = cloneTestStorageNode(memo, { dir: 'work', path: 'work/memo.txt' })

      // 1. APIによる移動処理を実行
      // 'dev/projects'の移動でAPIエラーを発生させる
      td.when(storageLogic.moveDir('dev/projects', 'work/projects')).thenReject(new Error())
      td.when(storageLogic.moveFile('dev/memo.txt', 'work/memo.txt')).thenReturn(memo)

      // 2. 移動先ディレクトリとその上位ディレクトリ階層の作成
      td.when(storageLogic.fetchHierarchicalNodes('work')).thenReturn([work])
    }

    // 'dev/projects'と'dev/memo.txt'を'work'へ移動
    await treeStore.moveStorageNodes(['dev/projects', 'dev/memo.txt'], 'work')

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
      const _dev = treeStore.getNode('dev')!
      // 子孫ノードの検証
      const _dev_descendants = _dev.getDescendants()
      const [_projects, _blog, _src, _index, _memo] = _dev_descendants
      expect(_dev_descendants.length).toBe(4)
      expect(_projects.value).toBe('dev/projects')
      expect(_blog.value).toBe('dev/projects/blog')
      expect(_src.value).toBe('dev/projects/blog/src')
      expect(_index.value).toBe('dev/projects/blog/src/index.html')
    }
    // 'work'の階層構造の検証
    {
      const _work = treeStore.getNode('work')!
      // 子孫ノードの検証
      const _work_descendants = _work.getDescendants()
      const [_memo] = _work_descendants
      expect(_work_descendants.length).toBe(1)
      expect(_memo.value).toBe('work/memo.txt')
    }

    verifyParentChildRelationForTree(treeView)
  })
})

describe('renameStorageNode', () => {
  it('ディレクトリのリネーム - ベーシックケース', async () => {
    // root
    // └dA
    //   └d1 ← x1へリネーム
    //     ├d11
    //     │└fileA.txt
    //     ├d12
    //     └fileB.txt
    const dA = newTestStorageDirNode('dA')
    const d1 = newTestStorageDirNode('dA/d1')
    let d11 = newTestStorageDirNode('dA/d1/d11')
    let fileA = newTestStorageFileNode('dA/d1/d11/fileA.txt')
    let d12 = newTestStorageDirNode('dA/d1/d12')
    let fileB = newTestStorageFileNode('dA/d1/fileB.txt')
    treeStore.setAllNodes([dA, d1, d11, fileA, d12, fileB])

    // ディレクトリの子ノード読み込みの検証準備
    treeStore.getNode('dA/d1')!.lazyLoadStatus = 'loaded'
    treeStore.getNode('dA/d1/d11')!.lazyLoadStatus = 'loaded'
    const pullChildren = td.replace(treeStore, 'pullChildren')

    // モック設定
    {
      const x1 = cloneTestStorageNode(d1, { name: 'x1', dir: 'dA', path: 'dA/x1' })
      d11 = cloneTestStorageNode(d11, { dir: 'dA/x1', path: 'dA/x1/d11' })
      fileA = cloneTestStorageNode(fileA, { dir: 'dA/x1/d11', path: 'dA/x1/d11/fileA.txt' })
      d12 = cloneTestStorageNode(d12, { dir: 'dA/x1', path: 'dA/x1/d12' })
      fileB = cloneTestStorageNode(fileB, { dir: 'dA/x1', path: 'dA/x1/fileB.txt' })

      // 1. APIによる移動処理を実行
      td.when(storageLogic.renameDir('dA/d1', 'x1')).thenReturn([x1, d11, fileA, d12, fileB])
    }

    // 'dA/d1'を'dA/x1'へリネーム
    await treeStore.renameStorageNode('dA/d1', 'x1')

    // root
    // └dA
    //   └x1
    //     ├d11
    //     │└fileA.txt
    //     ├d12
    //     └fileB.txt
    const _x1 = treeStore.getNode('dA/x1')!
    const _x1_descendants = _x1.getDescendants()
    const [_d11, _fileA, _d12, _fileB] = _x1_descendants

    expect(_x1_descendants.length).toBe(4)
    expect(_d11.value).toBe('dA/x1/d11')
    expect(_fileA.value).toBe('dA/x1/d11/fileA.txt')
    expect(_d12.value).toBe('dA/x1/d12')
    expect(_fileB.value).toBe('dA/x1/fileB.txt')

    // ディレクトリノードの遅延ロード状態の検証
    expect(_x1.lazyLoadStatus).toBe('loaded')
    expect(_d11.lazyLoadStatus).toBe('loaded')
    expect(_d12.lazyLoadStatus).toBe('loaded')

    verifyParentChildRelationForTree(treeView)
  })

  it('ディレクトリのリネーム - 既存のディレクトリ名に文字を付け加える形でリネームをした場合', async () => {
    // root
    // └dA
    //   └d1 ← d1XXXへリネーム
    //     ├d11
    //     │└fileA.txt
    //     ├d12
    //     └fileB.txt
    const dA = newTestStorageDirNode('dA')
    const d1 = newTestStorageDirNode('dA/d1')
    let d11 = newTestStorageDirNode('dA/d1/d11')
    let fileA = newTestStorageFileNode('dA/d1/d11/fileA.txt')
    let d12 = newTestStorageDirNode('dA/d1/d12')
    let fileB = newTestStorageFileNode('dA/d1/fileB.txt')
    treeStore.setAllNodes([dA, d1, d11, fileA, d12, fileB])

    // モック設定
    {
      const d1XXX = cloneTestStorageNode(d1, { name: 'd1XXX', dir: 'dA', path: 'dA/d1XXX' })
      d11 = cloneTestStorageNode(d11, { dir: 'dA/d1XXX', path: 'dA/d1XXX/d11' })
      fileA = cloneTestStorageNode(fileA, { dir: 'dA/d1XXX/d11', path: 'dA/d1XXX/d11/fileA.txt' })
      d12 = cloneTestStorageNode(d12, { dir: 'dA/d1XXX', path: 'dA/d1XXX/d12' })
      fileB = cloneTestStorageNode(fileB, { dir: 'dA/d1XXX', path: 'dA/d1XXX/fileB.txt' })

      // 1. APIによる移動処理を実行
      td.when(storageLogic.renameDir('dA/d1', 'd1XXX')).thenReturn([d1XXX, d11, fileA, d12, fileB])
    }

    // 'dA/d1'を'dA/d1XXX'へリネーム
    await treeStore.renameStorageNode('dA/d1', 'd1XXX')

    // root
    // └dA
    //   └d1XXX
    //     ├d11
    //     │└fileA.txt
    //     ├d12
    //     └fileB.txt
    const _d1XXX = treeStore.getNode('dA/d1XXX')!
    const _d1XXX_descendants = _d1XXX.getDescendants()
    const [_d11, _fileA, _d12, _fileB] = _d1XXX_descendants

    expect(_d1XXX_descendants.length).toBe(4)
    expect(_d11.value).toBe('dA/d1XXX/d11')
    expect(_fileA.value).toBe('dA/d1XXX/d11/fileA.txt')
    expect(_d12.value).toBe('dA/d1XXX/d12')
    expect(_fileB.value).toBe('dA/d1XXX/fileB.txt')

    // ディレクトリノードの遅延ロード状態の検証
    expect(_d1XXX.lazyLoadStatus).toBe('loaded')
    expect(_d11.lazyLoadStatus).toBe('loaded')
    expect(_d12.lazyLoadStatus).toBe('loaded')

    verifyParentChildRelationForTree(treeView)
  })

  it('ファイルのリネーム', async () => {
    // root
    // ├dA
    // │└fileA.txt ← fileX.txtへリネーム
    // └dB
    //   └fileB.txt
    const dA = newTestStorageDirNode('dA')
    const fileA = newTestStorageFileNode('dA/fileA.txt')
    const dB = newTestStorageDirNode('dB')
    const fileB = newTestStorageFileNode('dB/fileB.txt')
    treeStore.setAllNodes([dA, fileA, dB, fileB])

    // モック設定
    {
      const fileX = cloneTestStorageNode(fileA, { name: 'fileX', path: 'dA/fileX.txt' })

      // 1. APIによる移動処理を実行
      td.when(storageLogic.renameFile('dA/fileA.txt', 'fileX.txt')).thenReturn(fileX)
    }

    // 'dA/fileA.txt'を'dA/fileX.txt'へリネーム
    await treeStore.renameStorageNode('dA/fileA.txt', 'fileX.txt')

    // root
    // ├dA
    // │└fileX.txt
    // └dB
    //   └fileB.txt
    const actual = treeStore.getNode('dA/fileX.txt')!
    expect(actual.value).toBe('dA/fileX.txt')

    verifyParentChildRelationForTree(treeView)
  })

  it('ルートディレクトリ直下のノードをリネーム', async () => {
    // root
    // ├dA ← dXへリネーム
    // │└fileA.txt
    // └dB
    //   └fileB.txt
    const dA = newTestStorageDirNode('dA')
    let fileA = newTestStorageFileNode('dA/fileA.txt')
    const dB = newTestStorageDirNode('dB')
    const fileB = newTestStorageFileNode('dB/fileB.txt')
    treeStore.setAllNodes([dA, fileA, dB, fileB])

    // ディレクトリの子ノード読み込みの検証準備
    // 詳細な検証は他のテストケースで行うため、
    // ここではエラーが発生しないようなモック化を行う
    td.replace(treeStore, 'pullChildren')

    // モック設定
    {
      const dX = cloneTestStorageNode(dA, { name: 'dX', path: 'dX' })
      fileA = cloneTestStorageNode(fileA, { dir: 'dX', path: 'dX/fileA.txt' })

      // 1. APIによる移動処理を実行
      td.when(storageLogic.renameDir('dA', 'dX')).thenReturn([dX, fileA])
    }

    // 'dA'を'dX'へリネーム
    await treeStore.renameStorageNode('dA', 'dX')

    // root
    // ├dB
    // │└fileB.txt
    // └dX
    //   └fileA.txt
    const _dX = treeStore.getNode('dX')!
    const _dX_descendants = _dX.getDescendants()
    const [_fileA] = _dX_descendants

    expect(_dX_descendants.length).toBe(1)
    expect(_fileA.value).toBe('dX/fileA.txt')

    verifyParentChildRelationForTree(treeView)
  })

  it('ルートディレクトリを指定した場合', async () => {
    const d1 = newTestStorageDirNode('d1')
    const d2 = newTestStorageDirNode('d2')
    treeStore.setAllNodes([d1, d2])

    let actual!: Error
    try {
      await treeStore.renameStorageNode('', 'tmp')
    } catch (err) {
      actual = err
    }

    expect(actual.message).toBe(`The root node cannot be renamed.`)
  })

  it('存在しないパスを指定した場合', async () => {
    const d1 = newTestStorageDirNode('d1')
    const d2 = newTestStorageDirNode('d2')
    treeStore.setAllNodes([d1, d2])

    let actual!: Error
    try {
      await treeStore.renameStorageNode('dXXX', 'x1')
    } catch (err) {
      actual = err
    }

    expect(actual.message).toBe(`The specified node could not be found: 'dXXX'`)
  })
})

describe('setShareSettings', () => {
  const NEW_SHARE_SETTINGS: StorageNodeShareSettings = {
    isPublic: true,
    uids: ['ichiro'],
  }

  it('ベーシックケース', async () => {
    // root
    // └dA
    //   ├d1 ← 設定対象
    //   │└d11
    //   │  └fileA.txt
    //   ├fileB.txt ← 設定対象
    //   └fileC.txt
    const dA = newTestStorageDirNode('dA')
    let d1 = newTestStorageDirNode('dA/d1')
    const d11 = newTestStorageDirNode('dA/d1/d11')
    const fileA = newTestStorageFileNode('dA/d1/d11/fileA.txt')
    let fileB = newTestStorageFileNode('dA/fileB.txt')
    const fileC = newTestStorageFileNode('dA/fileC.txt')
    treeStore.setAllNodes([dA, d1, d11, fileA, fileB, fileC])

    // モック設定
    {
      d1 = cloneTestStorageNode(d1, { share: NEW_SHARE_SETTINGS })
      fileB = cloneTestStorageNode(fileB, { share: NEW_SHARE_SETTINGS })

      td.when(storageLogic.setDirShareSettings(d1.path, NEW_SHARE_SETTINGS)).thenReturn(d1)
      td.when(storageLogic.setFileShareSettings(fileB.path, NEW_SHARE_SETTINGS)).thenReturn(fileB)
    }

    // 'dA/d1'と'dA/fileB.txt'に共有設定
    await treeStore.setShareSettings(['dA/d1', 'dA/fileB.txt'], NEW_SHARE_SETTINGS)

    const _dA = treeStore.getNode('dA')!
    const [_d1, _d11, _fileA, _fileB, _fileC] = _dA.getDescendants()
    expect(_d1.share).toEqual(NEW_SHARE_SETTINGS)
    expect(_d11.share).toEqual(EMPTY_SHARE_SETTINGS)
    expect(_fileA.share).toEqual(EMPTY_SHARE_SETTINGS)
    expect(_fileB.share).toEqual(NEW_SHARE_SETTINGS)
    expect(_fileC.share).toEqual(EMPTY_SHARE_SETTINGS)

    verifyParentChildRelationForTree(treeView)
  })

  it('ルートディレクトリを指定した場合', async () => {
    const d1 = newTestStorageDirNode('d1')
    const d2 = newTestStorageDirNode('d2')
    treeStore.setAllNodes([d1, d2])

    let actual!: Error
    try {
      await treeStore.setShareSettings([''], NEW_SHARE_SETTINGS)
    } catch (err) {
      actual = err
    }

    expect(actual.message).toBe(`The root node cannot be set share settings.`)
  })

  it('存在しないパスを指定した場合', async () => {
    const d1 = newTestStorageDirNode('d1')
    const d2 = newTestStorageDirNode('d2')
    treeStore.setAllNodes([d1, d2])

    let actual!: Error
    try {
      await treeStore.setShareSettings(['dXXX'], NEW_SHARE_SETTINGS)
    } catch (err) {
      actual = err
    }

    expect(actual.message).toBe(`The specified node could not be found: 'dXXX'`)
  })

  it('APIでエラーが発生した場合', async () => {
    // root
    // └dA
    //   ├d1 ← 設定対象
    //   │└d11
    //   │  └fileA.txt
    //   ├fileB.txt ← 設定対象
    //   └fileC.txt
    const dA = newTestStorageDirNode('dA')
    let d1 = newTestStorageDirNode('dA/d1')
    const d11 = newTestStorageDirNode('dA/d1/d11')
    const fileA = newTestStorageFileNode('dA/d1/d11/fileA.txt')
    let fileB = newTestStorageFileNode('dA/fileB.txt')
    const fileC = newTestStorageFileNode('dA/fileC.txt')
    treeStore.setAllNodes([dA, d1, d11, fileA, fileB, fileC])

    // モック設定
    {
      d1 = cloneTestStorageNode(d1, { share: NEW_SHARE_SETTINGS })
      fileB = cloneTestStorageNode(fileB, { share: NEW_SHARE_SETTINGS })

      // 'dA/d1'の共有設定でAPIエラーを発生させる
      td.when(storageLogic.setDirShareSettings(d1.path, NEW_SHARE_SETTINGS)).thenReject(new Error())
      td.when(storageLogic.setFileShareSettings(fileB.path, NEW_SHARE_SETTINGS)).thenReturn(fileB)
    }

    // 'dA/d1'と'dA/fileB.txt'に共有設定
    await treeStore.setShareSettings(['dA/d1', 'dA/fileB.txt'], NEW_SHARE_SETTINGS)

    // root
    // └dA
    //   ├d1 ← 設定されなかった
    //   │└d11
    //   │  └fileA.txt
    //   ├fileB.txt ← 設定された
    //   └fileC.txt
    const _dA = treeStore.getNode('dA')!
    const [_d1, _d11, _fileA, _fileB, _fileC] = _dA.getDescendants()
    expect(_d1.share).toEqual(EMPTY_SHARE_SETTINGS)
    expect(_d11.share).toEqual(EMPTY_SHARE_SETTINGS)
    expect(_fileA.share).toEqual(EMPTY_SHARE_SETTINGS)
    expect(_fileB.share).toEqual(NEW_SHARE_SETTINGS)
    expect(_fileC.share).toEqual(EMPTY_SHARE_SETTINGS)

    verifyParentChildRelationForTree(treeView)
  })
})
