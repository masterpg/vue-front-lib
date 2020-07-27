import * as td from 'testdouble'
import { BaseStoragePage, StorageTreeNode, StorageTreeView, StorageType } from '@/example/views/base/storage'
import { CompTreeNode, StorageLogic, StorageNode, StorageNodeShareSettings, StorageNodeType, UploadEndedEvent } from '@/lib'
import { EMPTY_SHARE_SETTINGS, cloneTestStorageNode, newTestStorageDirNode, newTestStorageFileNode } from '../../../../../helpers/common/storage'
import { Wrapper, mount } from '@vue/test-utils'
import { StoragePageStore } from '@/example/views/base/storage/base'
import { StorageRoute } from '@/example/router'
import dayjs from 'dayjs'
import { generateFirestoreId } from '../../../../../helpers/common/base'
import { i18n } from '@/example/i18n'
import { initExampleTest } from '../../../../../helpers/example/init'
import { logic } from '@/example/logic'
import { sleep } from 'web-base-lib'

//========================================================================
//
//  Test helpers
//
//=======================================================================

function verifyParentChildRelationForTree(treeView: StorageTreeView) {
  for (let i = 0; i < treeView.m_treeView.children.length; i++) {
    const node = treeView.m_treeView.children[i]
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

function newTreeView(
  params: {
    nodeFilter?: (node: StorageNode) => boolean
    storageType?: StorageType
  } = {}
): { treeView: StorageTreeView; storageLogic: StorageLogic; wrapper: Wrapper<StorageTreeView> } {
  StoragePageStore.clear()

  const nodeFilter = params.nodeFilter || allNodeFilter
  const storageType = params.storageType || 'app'

  const storageLogic = td.object<StorageLogic>()
  const storageRoute = td.object<StorageRoute>()

  const storagePage = td.object<BaseStoragePage>()
  ;(storagePage as any).storageType = storageType
  ;(storagePage as any).storageLogic = storageLogic
  ;(storagePage as any).storageRoute = storageRoute
  StoragePageStore.register(storagePage)

  const wrapper = mount(StorageTreeView, {
    propsData: { storageType: 'app', nodeFilter },
  })
  const treeView = wrapper.vm

  return { treeView, storageLogic, wrapper }
}

function allNodeFilter(node: StorageNode): boolean {
  return true
}

function dirNodeFilter(node: StorageNode): boolean {
  return node.nodeType === StorageNodeType.Dir
}

//========================================================================
//
//  Tests
//
//========================================================================

beforeAll(async () => {
  await initExampleTest()
})

beforeEach(async () => {})

describe('StorageType関連の検証', () => {
  beforeEach(async () => {
    StoragePageStore.clear()
  })

  it('適切な依存オブジェクトが取得できるか', async () => {
    const userStoragePage = td.object<BaseStoragePage>()
    ;(userStoragePage as any).storageType = 'user'
    ;(userStoragePage as any).storageLogic = td.object<StorageLogic>()
    ;(userStoragePage as any).storageRoute = td.object<StorageRoute>()
    StoragePageStore.register(userStoragePage)

    const appStoragePage = td.object<BaseStoragePage>()
    ;(appStoragePage as any).storageType = 'app'
    ;(appStoragePage as any).storageLogic = td.object<StorageLogic>()
    ;(appStoragePage as any).storageRoute = td.object<StorageRoute>()
    StoragePageStore.register(appStoragePage)

    const docsStoragePage = td.object<BaseStoragePage>()
    ;(docsStoragePage as any).storageType = 'docs'
    ;(docsStoragePage as any).storageLogic = td.object<StorageLogic>()
    ;(docsStoragePage as any).storageRoute = td.object<StorageRoute>()
    StoragePageStore.register(docsStoragePage)

    const userTreeViewWrapper = mount(StorageTreeView, { propsData: { storageType: 'user', nodeFilter: allNodeFilter } })
    const userTreeView = userTreeViewWrapper.vm as StorageTreeView
    expect(userTreeView.rootNode.name).toBe(String(i18n.t('storage.userRootName')))
    expect((userTreeView as any).storageLogic).toBe(userStoragePage.storageLogic)
    expect((userTreeView as any).storageRoute).toBe(userStoragePage.storageRoute)

    const appTreeViewWrapper = mount(StorageTreeView, { propsData: { storageType: 'app', nodeFilter: allNodeFilter } })
    const appTreeView = appTreeViewWrapper.vm as StorageTreeView
    expect(appTreeView.rootNode.name).toBe(String(i18n.t('storage.appRootName')))
    expect((appTreeView as any).storageLogic).toBe(appStoragePage.storageLogic)
    expect((appTreeView as any).storageRoute).toBe(appStoragePage.storageRoute)

    const docsTreeViewWrapper = mount(StorageTreeView, { propsData: { storageType: 'docs', nodeFilter: allNodeFilter } })
    const docsTreeView = docsTreeViewWrapper.vm as StorageTreeView
    expect(docsTreeView.rootNode.name).toBe(String(i18n.t('storage.docsRootName')))
    expect((docsTreeView as any).storageLogic).toBe(docsStoragePage.storageLogic)
    expect((docsTreeView as any).storageRoute).toBe(docsStoragePage.storageRoute)
  })

  it('StorageTypeDataの検証', async () => {
    const userStoragePage = td.object<BaseStoragePage>()
    ;(userStoragePage as any).storageType = 'user'
    ;(userStoragePage as any).storageLogic = td.object<StorageLogic>()
    ;(userStoragePage as any).storageRoute = td.object<StorageRoute>()
    StoragePageStore.register(userStoragePage)

    const userTreeViewWrapper = mount(StorageTreeView, { propsData: { storageType: 'user', nodeFilter: allNodeFilter } })
    const userTreeView = userTreeViewWrapper.vm as StorageTreeView

    expect(userTreeView.pageStore.isInitialPull).toBeFalsy()
    expect(userTreeView.pageStore.isPageActive).toBeTruthy()
    expect(userTreeView.rootNode.label).toBe(String(i18n.t('storage.userRootName')))
  })

  //
  // 単体でテスト実行すると成功するが、複数テストの一部として実行すると失敗するためコメントにしている。
  //
  // it('アクティブ状態でサインアウトした場合', async () => {
  //   const storagePage = td.object<BaseStoragePage>()
  //   ;(storagePage as any).storageType = 'user'
  //   ;(storagePage as any).storageLogic = td.object<StorageLogic>()
  //   ;(storagePage as any).storageRoute = td.object<StorageRoute>()
  //   StorageTypeData.register(storagePage)
  //   const treeViewWrapper = mount(StorageTreeView, { propsData: { storageType: 'user', nodeFilter: allNodeFilter } })
  //   const treeView = treeViewWrapper.vm as StorageTreeView
  //
  //   //
  //   // サインイン状態にする
  //   //
  //   ;(logic.auth as any).isSignedIn = true
  //   await sleep(100)
  //
  //   //
  //   // サインアウト前の状態を作成
  //   //
  //   treeView.pageStore.isInitialPull = true // 初期読み込みはtrue
  //   expect(treeView.pageStore.isPageActive).toBeTruthy() // ページアクティブ状態
  //
  //   // root
  //   // └d1 ← 選択状態
  //   treeView.setAllNodes([newTestStorageDirNode(`d1`)])
  //   const root = treeView.rootNode
  //   const d1 = treeView.getNode('d1')!
  //   treeView.selectedNode = d1
  //   expect(treeView.getAllNodes()).toEqual([root, d1])
  //   expect(treeView.selectedNode).toBe(d1)
  //
  //   //
  //   // サインアウト状態にする
  //   //
  //   ;(logic.auth as any).isSignedIn = false
  //
  //   //
  //   // サインアウト後の状態を検証
  //   //
  //   await sleep(100)
  //   expect(treeView.pageStore.isInitialPull).toBeFalsy() // 初期読み込みはfalseに
  //   expect(treeView.pageStore.isPageActive).toBeTruthy() // ページアクティブ状態（変わらず）
  //   expect(treeView.getAllNodes()).toEqual([root]) // d1が削除された
  //   expect(treeView.selectedNode).toBe(root) // 選択ノードがルートノードに変更された
  // })

  //
  // 単体でテスト実行すると成功するが、複数テストの一部として実行すると失敗するためコメントにしている。
  //
  // it('非アクティブ状態でサインアウトした場合', async () => {
  //   const storagePage = td.object<BaseStoragePage>()
  //   ;(storagePage as any).storageType = 'user'
  //   ;(storagePage as any).storageLogic = td.object<StorageLogic>()
  //   ;(storagePage as any).storageRoute = td.object<StorageRoute>()
  //   StorageTypeData.register(storagePage)
  //   const treeViewWrapper = mount(StorageTreeView, { propsData: { storageType: 'user', nodeFilter: allNodeFilter } })
  //   const treeView = treeViewWrapper.vm as StorageTreeView
  //
  //   // サインイン状態にする
  //   ;(logic.auth as any).isSignedIn = true
  //   await sleep(100)
  //
  //   // 非アクティブ状態にする
  //   const storageType = treeView.storageType
  //   treeViewWrapper.destroy()
  //   expect(StorageTypeData.get(storageType).isPageActive).toBeFalsy()
  //
  //   // サインアウト状態にする
  //   ;(logic.auth as any).isSignedIn = false
  //
  //   // サインアウト後の状態を検証
  //   await sleep(100)
  //   expect(StorageTypeData.get(storageType)).toBeUndefined()
  // })
})

describe('pullInitialNodes', () => {
  it('ベーシックケース', async () => {
    const { treeView, storageLogic } = newTreeView()

    // root
    // ※ツリービューにまだノードはない
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const f111 = newTestStorageFileNode(`d1/d11/f111.txt`)

    // APIから以下の状態のノードリストが取得される
    // ・'d1'
    // ・'d1/d11'
    // ・'d1/d11/f111.txt'
    td.when(storageLogic.fetchChildren(td.matchers.anything())).thenReturn()
    td.replace(storageLogic, 'nodes', [d1, d11, f111])

    await treeView.pullInitialNodes(d11.path)
    const actual = treeView.getAllNodes()

    // ツリービューが想定したノード構成になっているか検証
    // root
    // └d1
    //   └d11
    //     └f111.txt
    expect(actual.length).toBe(4)
    expect(actual[0].path).toBe(``)
    expect(actual[1].path).toBe(`d1`)
    expect(actual[2].path).toBe(`d1/d11`)
    expect(actual[3].path).toBe(`d1/d11/f111.txt`)
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
    expect(exp.calls[0].args[0]).toBe(``)
    expect(exp.calls[1].args[0]).toBe(`d1`)
    expect(exp.calls[2].args[0]).toBe(`d1/d11`)

    verifyParentChildRelationForTree(treeView)
  })

  it('nodeFilterが機能しているか検証', async () => {
    const { treeView, storageLogic } = newTreeView({ nodeFilter: dirNodeFilter })

    // root
    // ※ツリービューにまだノードはない
    const d1 = newTestStorageDirNode(`d1`)
    const f1 = newTestStorageFileNode(`f1.txt`)

    // APIから以下の状態のノードリストが取得される
    // ・'d1'
    // ・'f1.txt'
    td.when(storageLogic.fetchChildren(td.matchers.anything())).thenReturn()
    td.replace(storageLogic, 'nodes', [d1, f1])

    await treeView.pullInitialNodes()
    const actual = treeView.getAllNodes()

    // root
    // ├d1
    // └f1.txt ← nodeFilterで除外されるのでツリーには存在しない
    expect(actual.length).toBe(2)
    expect(actual[0].path).toBe(``)
    expect(actual[1].path).toBe(`d1`)

    verifyParentChildRelationForTree(treeView)
  })
})

describe('pullChildren', () => {
  it('dirPathを指定した場合 - ルートノードを指定', async () => {
    const { treeView, storageLogic } = newTreeView()

    // root ← 対象
    // ├d1
    // └d3
    const d1 = newTestStorageDirNode(`d1`)
    const d2 = newTestStorageDirNode(`d2`)
    const d3 = newTestStorageDirNode(`d3`)
    treeView.setAllNodes([d1, d3])
    expect(treeView.getNode(``)!.lazyLoadStatus).toBe('none')

    // APIから以下の状態のノードリストが取得される
    // ・'d2'が追加された
    // ・'d3'が削除(または移動)された
    td.when(storageLogic.fetchChildren(``)).thenResolve([d1, d2])

    await treeView.pullChildren(``)
    const actual = treeView.getAllNodes()
    const [_root, _d1, _d2] = actual

    // root
    // ├d1
    // └d2
    expect(actual.length).toBe(3)
    expect(_root.path).toBe(``)
    expect(_d1.path).toBe(`d1`)
    expect(_d2.path).toBe(`d2`)

    expect(_root.lazyLoadStatus).toBe('loaded')

    verifyParentChildRelationForTree(treeView)
  })

  it('dirPathを指定した場合 - ルートノード配下のディレクトリを指定', async () => {
    const { treeView, storageLogic } = newTreeView()

    // root
    // └d1 ← 対象
    //   ├d11
    //   └d13
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const d12 = newTestStorageDirNode(`d1/d12`)
    const d13 = newTestStorageDirNode(`d1/d13`)
    treeView.setAllNodes([d1, d11, d13])
    expect(treeView.getNode(`d1`)!.lazyLoadStatus).toBe('none')

    // APIから以下の状態のノードリストが取得される
    // ・'d1/d12'が追加された
    // ・'d1/d13'が削除された
    td.when(storageLogic.fetchChildren(`d1`)).thenResolve([d11, d12])

    await treeView.pullChildren(d1.path)
    const actual = treeView.getAllNodes()
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

    expect(_d1.lazyLoadStatus).toBe('loaded')

    verifyParentChildRelationForTree(treeView)
  })

  it('nodeFilterが機能しているか検証', async () => {
    const { treeView, storageLogic } = newTreeView({ nodeFilter: dirNodeFilter })

    // root ← 対象
    // └d1
    const d1 = newTestStorageDirNode(`d1`)
    const f1 = newTestStorageFileNode(`f1.txt`) // 追加される
    treeView.setAllNodes([d1])

    // APIから以下の状態のノードリストが取得される
    // ・'f1.txt'が追加された
    td.when(storageLogic.fetchChildren(``)).thenResolve([d1, f1])

    await treeView.pullChildren(``)
    const actual = treeView.getAllNodes()
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

describe('reloadDir', () => {
  it('dirPathにルートノードを指定', async () => {
    const { treeView, storageLogic } = newTreeView()

    // root
    // ├d1
    // │├d11
    // ││└f111.txt
    // │└d12
    // └d2
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const f111 = newTestStorageFileNode(`d1/d11/f111.txt`)
    const f112 = newTestStorageFileNode(`d1/d11/f112.txt`)
    const d12 = newTestStorageDirNode(`d1/d12`)
    const d2 = newTestStorageDirNode(`d2`)
    treeView.setAllNodes([d1, d11, f111, d12, d2])
    for (const treeNode of treeView.getAllNodes()) {
      expect(treeNode.lazyLoadStatus).toBe('none')
    }

    // 以下の状態のノードリストを再現する
    // ・'d1/d11/f111.txt'が'f1.txt'へ移動+リネームされた
    // ・'d1/d11/f112.txt'が追加された
    // ・'d1/d12'が削除された
    const renamed_f1 = cloneTestStorageNode(f111, { dir: ``, path: `f1.txt` })
    // StorageLogic.getDirDescendants()をモック化
    td.when(storageLogic.getDirDescendants(``)).thenReturn([d1, d11, f112, d2, renamed_f1])

    // ルートノードを指定して実行
    await treeView.reloadDir(``)
    const actual = treeView.getAllNodes()
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

  it('dirPathにルートノード配下のディレクトリを指定', async () => {
    const { treeView, storageLogic } = newTreeView()

    // root
    // ├d1
    // │├d11
    // ││├d111
    // │││└f1111.txt
    // ││└f111.txt
    // │└d12
    // └d2
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const d111 = newTestStorageDirNode(`d1/d11/d111`)
    const f1111 = newTestStorageFileNode(`d1/d11/d111/f1111.txt`)
    const f111 = newTestStorageFileNode(`d1/d11/f111.txt`)
    const f112 = newTestStorageFileNode(`d1/d11/f112.txt`)
    const d12 = newTestStorageDirNode(`d1/d12`)
    const d2 = newTestStorageDirNode(`d2`)
    treeView.setAllNodes([d1, d11, d111, f1111, f111, d12, d2])
    for (const treeNode of treeView.getAllNodes()) {
      expect(treeNode.lazyLoadStatus).toBe('none')
    }

    // 以下の状態のノードリストを再現する
    // ・'d1/d11/d111'が削除された
    // ・'d1/d11/f111.txt'が削除され、その後また同じディレクトリに同じ名前でアップロードされた
    // ・'d1/d11/f112.txt'が追加された
    const updated_f111 = cloneTestStorageNode(f111, { id: generateFirestoreId() })
    // StorageLogic.getNode()をモック化
    td.when(storageLogic.getNode({ path: d1.path })).thenReturn(d1)
    // StorageLogic.getDirDescendants()をモック化
    td.when(storageLogic.getDirDescendants(d11.path)).thenReturn([d11, updated_f111, f112])

    // 'd1/d11'を指定して実行
    await treeView.reloadDir(d11.path)
    const actual = treeView.getAllNodes()
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
    const { treeView, storageLogic } = newTreeView()

    // root
    // ├d1
    // │├d11
    // ││└d111
    // ││  └f1111.txt
    // │└d12
    // └d2
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const d111 = newTestStorageDirNode(`d1/d11/d111`)
    const f1111 = newTestStorageFileNode(`d1/d11/d111/f1111.txt`)
    const d12 = newTestStorageDirNode(`d1/d12`)
    const d2 = newTestStorageDirNode(`d2`)
    treeView.setAllNodes([d1, d11, d111, f1111, d12, d2])
    for (const treeNode of treeView.getAllNodes()) {
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
    await treeView.reloadDir(d111.path)
    const actual = treeView.getAllNodes()
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
    const { treeView, storageLogic } = newTreeView()

    // root
    // ├d1
    // │├d11
    // ││└d111
    // ││  └f1111.txt
    // │└d12
    // └d2
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const d111 = newTestStorageDirNode(`d1/d11/d111`)
    const f1111 = newTestStorageFileNode(`d1/d11/d111/f1111.txt`)
    const d12 = newTestStorageDirNode(`d1/d12`)
    const d2 = newTestStorageDirNode(`d2`)
    treeView.setAllNodes([d1, d11, d111, f1111, d12, d2])
    for (const treeNode of treeView.getAllNodes()) {
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
    await treeView.reloadDir(d111.path)
    const actual = treeView.getAllNodes()
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

  it('nodeFilterが機能しているか検証', async () => {
    const { treeView, storageLogic } = newTreeView({ nodeFilter: dirNodeFilter })

    // root
    // └d1
    const d1 = newTestStorageDirNode(`d1`)
    const f1 = newTestStorageFileNode(`f1.txt`) // 追加される
    treeView.setAllNodes([d1])

    // 以下の状態のノードリストを再現する
    // ・'f1.txt'が追加された
    // StorageLogic.getDirDescendants()をモック化
    td.when(storageLogic.getDirDescendants(``)).thenReturn([d1, f1])

    // ルートノードを指定して実行
    await treeView.reloadDir(``)
    const actual = treeView.getAllNodes()
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

describe('onUploaded', () => {
  it('ベーシックケース', async () => {
    const { treeView, storageLogic } = newTreeView()

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
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const d111 = newTestStorageDirNode(`d1/d11/d111`)
    const fileA = newTestStorageFileNode(`d1/d11/d111/fileA.txt`)
    const fileB = newTestStorageFileNode(`d1/d11/fileB.txt`)
    const d12 = newTestStorageDirNode(`d1/d12`)
    const fileC = newTestStorageFileNode(`d1/d12/fileC.txt`)
    const d13 = newTestStorageDirNode(`d1/d13`)
    const fileD = newTestStorageFileNode(`d1/fileD.txt`)
    treeView.setAllNodes([d1, d11, d12])
    treeView.getNode(d1.path)!.lazyLoadStatus = 'none'
    treeView.getNode(d11.path)!.lazyLoadStatus = 'loaded'
    treeView.getNode(d12.path)!.lazyLoadStatus = 'none'

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
    const reloadDir = td.replace(treeView, 'reloadDir')
    td.when(reloadDir(d11.path)).thenDo(() => {
      treeView.setNodes([d11, d111, fileA, fileB])
    })

    // アップロードが行われた後のツリーの更新処理を実行
    await treeView.onUploaded(e)

    // root
    // └d1
    //   ├d11 ← 子ノードが未読み込み済みだったので、リロードにより配下ノードも読み込まれた
    //   │├d111
    //   ││└fileA.txt
    //   │└fileB.txt
    //   ├d12 ← 子ノードが未読み込みだったので、リロードされず配下ノードも読み込まれない
    //   ├d13 ← ツリーに存在しなかったが追加された(配下ノードは読み込まれない)
    //   └fileD.txt
    const actual = treeView.getAllNodes()
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
    const { treeView, storageLogic } = newTreeView()

    // root ← アップロードディレクトリ
    // ├d1 ← 今回アップロード、子ノード読み込み済み(アップロード前は子ノードが存在しなかった)
    // │└d11 ← 今回アップロード
    // │  └fileA.txt ← 今回アップロード
    // └fileB.txt ← 今回アップロード
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const fileA = newTestStorageFileNode(`d1/d11/fileA.txt`)
    const fileB = newTestStorageFileNode(`fileB.txt`)
    treeView.setAllNodes([d1])
    treeView.getNode(``)!.lazyLoadStatus = 'none'
    treeView.getNode(d1.path)!.lazyLoadStatus = 'loaded'

    const e: UploadEndedEvent = {
      uploadDirPath: ``,
      uploadedFiles: [fileA, fileB],
    }

    //
    // モック設定
    //
    // ロジックストア(サーバー)からアップロードディレクトリ直下のノードを取得
    td.when(storageLogic.fetchChildren(e.uploadDirPath)).thenResolve([d1, fileB])
    // リロード時の挙動をモック化
    const reloadDir = td.replace(treeView, 'reloadDir')
    td.when(reloadDir(d1.path)).thenDo(() => {
      treeView.setNodes([d11, fileA])
    })

    // アップロードが行われた後のツリーの更新処理を実行
    await treeView.onUploaded(e)

    // root
    // └d1 ← リロードにより配下ノードも読み込まれた
    // │└d11
    // │  └fileA.txt
    // └fileB.txt
    const actual = treeView.getAllNodes()
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
    const { treeView, storageLogic } = newTreeView({ nodeFilter: dirNodeFilter })

    // root ← アップロードディレクトリ
    // └d1
    const d1 = newTestStorageDirNode(`d1`)
    const fileA = newTestStorageFileNode(`fileA.txt`) // 今回アップロード
    treeView.setAllNodes([d1])

    const e: UploadEndedEvent = {
      uploadDirPath: '',
      uploadedFiles: [fileA],
    }

    //
    // モック設定
    //
    // ロジックストア(サーバー)からアップロードディレクトリ直下のノードを取得
    // ・'fileA.txt'がアップロードされた
    td.when(storageLogic.fetchChildren(e.uploadDirPath)).thenResolve([d1, fileA])

    // アップロードが行われた後のツリーの更新処理を実行
    await treeView.onUploaded(e)

    // root
    // ├d1
    // └fileA.txt ← nodeFilterで除外されるのでツリーには存在しない
    const actual = treeView.getAllNodes()
    const [_root, _d1] = actual
    expect(actual.length).toBe(2)
    expect(_root.path).toBe(``)
    expect(_d1.path).toBe(`d1`)

    verifyParentChildRelationForTree(treeView)
  })
})

describe('getAllNodes', () => {
  it('ベーシックケース', () => {
    const { treeView, storageLogic } = newTreeView()

    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const f111 = newTestStorageFileNode(`d1/d11/f111.txt`)
    const d12 = newTestStorageDirNode(`d1/d12`)
    const d2 = newTestStorageDirNode(`d2`)
    const d21 = newTestStorageDirNode(`d2/d21`)
    const f211 = newTestStorageFileNode(`d2/d21/f211.txt`)
    const f1 = newTestStorageFileNode(`f1.txt`)
    treeView.setAllNodes([d1, d11, f111, d12, d2, d21, f211, f1])

    const actual = treeView.getAllNodes()

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

describe('getNode', () => {
  it('ベーシックケース', () => {
    const { treeView, storageLogic } = newTreeView()

    const d1 = newTestStorageDirNode(`d1`)
    const d2 = newTestStorageDirNode(`d2`)
    treeView.setAllNodes([d1, d2])

    const actual = treeView.getNode(`d1`)!

    expect(actual.path).toBe(`d1`)
  })

  it('ルートノードを取得', () => {
    const { treeView, storageLogic } = newTreeView()

    const d1 = newTestStorageDirNode(`d1`)
    const d2 = newTestStorageDirNode(`d2`)
    treeView.setAllNodes([d1, d2])

    const actual = treeView.getNode(``)!

    expect(actual.path).toBe(``)
  })
})

describe('setAllNodes', () => {
  it('ソートされていないノードリストを渡した場合', () => {
    const { treeView, storageLogic } = newTreeView()

    // root
    // ├d1
    // │├d11
    // ││└f111.txt
    // │└d12
    // ├d2
    // │└d21
    // │  └f211.txt
    // └f1.txt
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const f111 = newTestStorageFileNode(`d1/d11/f111.txt`)
    const d12 = newTestStorageDirNode(`d1/d12`)
    const d2 = newTestStorageDirNode(`d2`)
    const d21 = newTestStorageDirNode(`d2/d21`)
    const f211 = newTestStorageFileNode(`d2/d21/f211.txt`)
    const f1 = newTestStorageFileNode(`f1.txt`)

    treeView.setAllNodes(shuffle([d1, d11, f111, d12, d2, d21, f211, f1]))
    const actual = treeView.getAllNodes()

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

describe('mergeAllNodes', () => {
  it('ベーシックケース', () => {
    const { treeView, storageLogic } = newTreeView()

    // root
    // ├d1
    // │├d11
    // ││└f111.txt
    // │└d12
    // └d2
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const f111 = newTestStorageFileNode(`d1/d11/f111.txt`)
    const d12 = newTestStorageDirNode(`d1/d12`)
    const d2 = newTestStorageDirNode(`d2`)
    treeView.setAllNodes([d1, d11, f111, d12, d2])

    // 以下の状態のノードリストを引数に設定する
    // ・'d1/d11/f111.txt'が'fA.txt'へ移動+リネームされた
    // ・'d1/d11/f11A.txt'が追加された
    // ・'d1/d12'が削除された
    const fA = cloneTestStorageNode(f111, { dir: ``, path: `fA.txt` })
    const f11A = newTestStorageFileNode(`d1/d11/f11A.txt`)
    treeView.mergeAllNodes([d1, d11, f11A, fA, d2])
    const actual = treeView.getAllNodes()

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

describe('mergeDirDescendants', () => {
  it('ベーシックケース', () => {
    const { treeView, storageLogic } = newTreeView()

    // root
    // ├d1 ← 対象
    // │├d11
    // ││└f111.txt
    // │└d12
    // │  └f121.txt
    // └d2
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const f111 = newTestStorageFileNode(`d1/d11/f111.txt`)
    const f112 = newTestStorageFileNode(`d1/d11/f112.txt`)
    const d12 = newTestStorageDirNode(`d1/d12`)
    const f121 = newTestStorageFileNode(`d1/d12/f121.txt`)
    const f11 = newTestStorageFileNode(`d1/f11.txt`)
    const d2 = newTestStorageDirNode(`d2`)
    treeView.setAllNodes([d1, d11, f111, d12, f121, d2])

    // ロジックストアから以下の状態のノードリストが取得される
    // ・'d1/d11/f112.txt'が追加された
    // ・'d1/f11.txt'が追加された
    // ・'d1/d12'が削除(または移動)された
    td.when(storageLogic.getDirDescendants(d1.path)).thenReturn([d1, d11, f111, f112, f11])

    treeView.mergeDirDescendants(d1.path)
    const actual = treeView.getAllNodes()

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
    const { treeView, storageLogic } = newTreeView()

    // root
    // ├d1 ← 対象
    // │└d11
    // │  └f111.txt
    // └d2
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const f111 = newTestStorageFileNode(`d1/d11/f111.txt`)
    const d2 = newTestStorageDirNode(`d2`)
    treeView.setAllNodes([d1, d11, f111, d2])

    // ロジックストアから以下の状態のノードリストが取得される
    // ・'d1'が削除された
    td.when(storageLogic.getDirDescendants(d1.path)).thenReturn([])

    treeView.mergeDirDescendants(d1.path)
    const actual = treeView.getAllNodes()

    // root
    // └d2
    expect(actual.length).toBe(2)
    expect(actual[0].path).toBe(``)
    expect(actual[1].path).toBe(`d2`)

    verifyParentChildRelationForTree(treeView)
  })

  it('nodeFilterが機能しているか検証', () => {
    const { treeView, storageLogic } = newTreeView({ nodeFilter: dirNodeFilter })

    // root
    // └d1 ← 対象
    //   └d11
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const f111 = newTestStorageFileNode(`d1/d11/f111.txt`)
    treeView.setAllNodes([d1, d11])

    // ロジックストアから以下の状態のノードリストが取得される
    // ・'d1/d11/f111.txt'が追加された
    td.when(storageLogic.getDirDescendants(d1.path)).thenReturn([d1, d11, f111])

    treeView.mergeDirDescendants(d1.path)
    const actual = treeView.getAllNodes()

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

describe('mergeDirChildren', () => {
  it('ベーシックケース', () => {
    const { treeView, storageLogic } = newTreeView()

    // root
    // ├d1 ← 対象
    // │├d11
    // ││└f111.txt
    // │└d12
    // │  └f121.txt
    // └d2
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const f111 = newTestStorageFileNode(`d1/d11/f111.txt`)
    const f112 = newTestStorageFileNode(`d1/d11/f112.txt`)
    const d12 = newTestStorageDirNode(`d1/d12`)
    const f121 = newTestStorageFileNode(`d1/d12/f121.txt`)
    const f11 = newTestStorageFileNode(`d1/f11.txt`)
    const d2 = newTestStorageDirNode(`d2`)
    treeView.setAllNodes([d1, d11, f111, d12, f121, d2])

    // ロジックストアから以下の状態のノードリストが取得される
    // ・'d1/d11/f112.txt'が追加された
    // ・'d1/f11.txt'が追加された
    // ・'d1/d12'が削除された
    td.when(storageLogic.getDirChildren(d1.path)).thenReturn([d1, d11, f112, f11])

    treeView.mergeDirChildren(d1.path)
    const actual = treeView.getAllNodes()

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
    const { treeView, storageLogic } = newTreeView()

    // root
    // ├d1 ← 対象
    // │└d11
    // │  └f111.txt
    // └d2
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const f111 = newTestStorageFileNode(`d1/d11/f111.txt`)
    const d2 = newTestStorageDirNode(`d2`)
    treeView.setAllNodes([d1, d11, f111, d2])

    // ロジックストアから以下の状態のノードリストが取得される
    // ・'d1'が削除(または移動)された
    td.when(storageLogic.getDirChildren(d1.path)).thenReturn([])

    treeView.mergeDirChildren(d1.path)
    const actual = treeView.getAllNodes()

    // root
    // └d2
    expect(actual.length).toBe(2)
    expect(actual[0].path).toBe(``)
    expect(actual[1].path).toBe(`d2`)

    verifyParentChildRelationForTree(treeView)
  })

  it('nodeFilterが機能しているか検証', () => {
    const { treeView, storageLogic } = newTreeView({ nodeFilter: dirNodeFilter })

    // root
    // └d1 ← 対象
    //   └d11
    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const f11 = newTestStorageFileNode(`d1/f11.txt`)
    treeView.setAllNodes([d1, d11])

    // ロジックストアから以下の状態のノードリストが取得される
    // ・'d1/f11.txt'が追加された
    td.when(storageLogic.getDirChildren(d1.path)).thenReturn([d1, d11, f11])

    treeView.mergeDirChildren(d1.path)
    const actual = treeView.getAllNodes()

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

describe('setNode + setNodes', () => {
  it('ツリーに存在しないノードの設定', () => {
    const { treeView, storageLogic } = newTreeView()

    const d1 = newTestStorageDirNode('d1')
    const d11 = newTestStorageDirNode('d1/d11')
    const f111 = newTestStorageFileNode('d1/d11/f111.txt')
    treeView.setNodes([d1, d11, f111])

    // ノードが追加されたことを検証
    expect(treeView.getNode(`d1/d11`)!.path).toBe(`d1/d11`)
    expect(treeView.getNode(`d1/d11/f111.txt`)!.path).toBe(`d1/d11/f111.txt`)

    verifyParentChildRelationForTree(treeView)
  })

  it('ツリーに存在するノードの設定', () => {
    const { treeView, storageLogic } = newTreeView()

    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const f111 = newTestStorageFileNode(`d1/d11/f111.txt`)
    const d2 = newTestStorageDirNode(`d2`)
    treeView.setAllNodes([d1, d11, f111, d2])

    const createdAt = dayjs('2019-12-01')
    const updatedAt = dayjs('2019-12-02')
    const updatingD11 = Object.assign({}, d11, { createdAt, updatedAt })
    const updatingFileA = Object.assign({}, f111, { createdAt, updatedAt })

    treeView.setNodes([updatingD11, updatingFileA])

    expect(treeView.getNode(`d1/d11`)!.createdAt).toEqual(createdAt)
    expect(treeView.getNode(`d1/d11`)!.updatedAt).toEqual(updatedAt)
    expect(treeView.getNode(`d1/d11/f111.txt`)!.createdAt).toEqual(createdAt)
    expect(treeView.getNode(`d1/d11/f111.txt`)!.updatedAt).toEqual(updatedAt)
  })

  it('ツリーに存在するノードの設定 - 親が変わっていた場合', () => {
    const { treeView, storageLogic } = newTreeView()

    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const f111 = newTestStorageFileNode(`d1/d11/f111.txt`)
    const d2 = newTestStorageDirNode(`d2`)
    treeView.setAllNodes([d1, d11, f111, d2])

    // 'd1/d11'が移動+リネームで'd2/d21'となった
    const updatedAt = dayjs()
    const d21_from_d11 = cloneTestStorageNode(d11, { name: `d21`, dir: `d2`, path: `d2/d21`, updatedAt })
    const f211_from_f111 = cloneTestStorageNode(f111, { name: `f211.txt`, dir: `d2/d21`, path: `d2/d21/f211.txt`, updatedAt })
    treeView.setNodes([d21_from_d11, f211_from_f111])

    const _d21 = treeView.getNode(`d2/d21`)!
    expect(_d21.parent!.path).toBe(`d2`)
    expect(_d21.updatedAt).toEqual(updatedAt)
    const _f211 = treeView.getNode(`d2/d21/f211.txt`)!
    expect(_f211.parent!.path).toBe(`d2/d21`)
    expect(_f211.updatedAt).toEqual(updatedAt)

    verifyParentChildRelationForTree(treeView)
  })

  it('ツリーに存在するノードの設定 - リネームされていた場合', () => {
    const { treeView, storageLogic } = newTreeView()

    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const f111 = newTestStorageFileNode(`d1/d11/f111.txt`)
    const f112 = newTestStorageFileNode(`d1/d11/f112.txt`)
    treeView.setAllNodes([d1, d11, f111, f112])

    // 'd1/d11/f112.txt'がリネームされて'd1/d11/f110.txt'となった
    const updatedAt = dayjs()
    const f110_from_f112 = cloneTestStorageNode(f112, { name: `f110.txt`, dir: `d1/d11`, path: `d1/d11/f110.txt`, updatedAt })
    treeView.setNodes([f110_from_f112])

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
    const { treeView, storageLogic } = newTreeView()

    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    treeView.setAllNodes([d1, d11])

    // 'd1/d11'が削除後また同じディレクトリに同じ名前で作成された
    const created_d11 = cloneTestStorageNode(d11, { id: generateFirestoreId(), createdAt: dayjs(), updatedAt: dayjs() })
    treeView.setNodes([created_d11])

    const _d11 = treeView.getNode(`d1/d11`)!
    expect(_d11.id).toEqual(created_d11.id)
    expect(_d11.createdAt).toEqual(created_d11.createdAt)
    expect(_d11.updatedAt).toEqual(created_d11.updatedAt)

    verifyParentChildRelationForTree(treeView)
  })

  it('ファイル削除後また同じディレクトリに同じ名前でファイルがアップロードされた場合', () => {
    const { treeView, storageLogic } = newTreeView()

    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const f111 = newTestStorageFileNode(`d1/d11/f111.txt`)
    const f112 = newTestStorageFileNode(`d1/d11/f112.txt`)
    treeView.setAllNodes([d1, d11, f111, f112])

    // 'd1/d11/f111.txt'が削除後また同じディレクトリに同じ名前でアップロードされた
    const created_f111 = cloneTestStorageNode(f111, { id: generateFirestoreId(), createdAt: dayjs(), updatedAt: dayjs() })
    treeView.setNodes([created_f111])

    const _f111 = treeView.getNode(`d1/d11/f111.txt`)!
    expect(_f111.id).toEqual(created_f111.id)
    expect(_f111.createdAt).toEqual(created_f111.createdAt)
    expect(_f111.updatedAt).toEqual(created_f111.updatedAt)

    verifyParentChildRelationForTree(treeView)
  })

  it('ソートされていないノードリストを渡した場合', () => {
    const { treeView, storageLogic } = newTreeView()

    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const f111 = newTestStorageFileNode(`d1/d11/f111.txt`)
    const d12 = newTestStorageDirNode(`d1/d12`)
    const d2 = newTestStorageDirNode(`d2`)
    const d21 = newTestStorageDirNode(`d2/d21`)
    const f211 = newTestStorageFileNode(`d2/d21/f211.txt`)
    const f1 = newTestStorageFileNode(`f1.txt`)
    treeView.setNodes(shuffle([d1, d11, f111, d12, d2, d21, f211, f1]))
    const actual = treeView.getAllNodes()

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

describe('removeNodes', () => {
  it('ベーシックケース', () => {
    const { treeView, storageLogic } = newTreeView()

    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const f111 = newTestStorageFileNode(`d1/d11/f111.txt`)
    const d2 = newTestStorageDirNode(`d2`)
    const d21 = newTestStorageDirNode(`d2/d21`)
    const f211 = newTestStorageFileNode(`d2/d21/f211.txt`)
    treeView.setAllNodes([d1, d11, f111, d2, d21, f211])

    treeView.removeNodes([`d1/d11`, `d2/d21/f211.txt`])

    expect(treeView.getNode(`d1/d11`)).toBeUndefined()
    expect(treeView.getNode(`d1/d11/f111.txt`)).toBeUndefined()
    expect(treeView.getNode(`d2/d21/f211.txt`)).toBeUndefined()

    verifyParentChildRelationForTree(treeView)
  })

  it(`'d1/d11'と親である'd1'を同時に指定した場合`, () => {
    const { treeView, storageLogic } = newTreeView()

    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const f111 = newTestStorageFileNode(`d1/d11/f111.txt`)
    const d12 = newTestStorageDirNode(`d1/d12`)
    treeView.setAllNodes([d1, d11, f111, d12])

    treeView.removeNodes([`d1/d11`, `d1`])

    expect(treeView.getNode(`d1`)).toBeUndefined()
    expect(treeView.getNode(`d1/d11`)).toBeUndefined()
    expect(treeView.getNode(`d1/d11/f111.txt`)).toBeUndefined()
    expect(treeView.getNode(`d1/d12`)).toBeUndefined()

    verifyParentChildRelationForTree(treeView)
  })

  it('存在しないパスを指定した場合', () => {
    const { treeView, storageLogic } = newTreeView()

    const d1 = newTestStorageDirNode(`d1`)
    const d2 = newTestStorageDirNode(`d2`)
    treeView.setAllNodes([d1, d2])

    // 何も起こらない
    treeView.removeNodes([`dXXX`])

    verifyParentChildRelationForTree(treeView)
  })

  it('削除により選択ノードがなくなった場合', () => {
    const { treeView, storageLogic } = newTreeView()

    const d1 = newTestStorageDirNode(`d1`)
    const d11 = newTestStorageDirNode(`d1/d11`)
    const f111 = newTestStorageFileNode(`d1/d11/f111.txt`)
    treeView.setAllNodes([d1, d11, f111])
    // 'd1/d11/f111.txt'を選択ノードに設定
    treeView.selectedNode = treeView.getNode(f111.path)!

    treeView.removeNodes([`d1/d11`])

    expect(treeView.getNode(`d1/d11`)).toBeUndefined()
    expect(treeView.getNode(`d1/d11/f111.txt`)).toBeUndefined()
    // 選択ノードがルートノードになっていることを検証
    expect(treeView.selectedNode).toBe(treeView.rootNode)

    verifyParentChildRelationForTree(treeView)
  })
})

describe('moveNode', () => {
  it('ディレクトリの移動', async () => {
    const { treeView, storageLogic } = newTreeView()

    // root
    // ├dev
    // │└projects ← workへ移動
    // │  └blog
    // │    └src
    // │      └index.html
    // └work
    //   ├assets
    //   └users
    const dev = newTestStorageDirNode(`dev`)
    const projects = newTestStorageDirNode(`dev/projects`)
    const blog = newTestStorageDirNode(`dev/projects/blog`)
    const src = newTestStorageDirNode(`dev/projects/blog/src`)
    const index = newTestStorageFileNode(`dev/projects/blog/src/index.html`)
    const work = newTestStorageDirNode(`work`)
    const assets = newTestStorageDirNode(`work/assets`)
    const users = newTestStorageDirNode(`work/users`)
    treeView.setAllNodes([dev, projects, blog, src, index, work, assets, users])

    // 'dev/projects'を'work'へ移動
    await treeView.moveNode(`dev/projects`, `work/projects`)

    // root
    // ├dev
    // └work
    //   ├assets
    //   ├projects
    //   │└blog
    //   │  └src
    //   │    └index.html
    //   └users

    const _dev = treeView.getNode(`dev`)!
    expect(_dev.getDescendants().length).toBe(0)

    const _work = treeView.getNode(`work`)!
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
    const { treeView, storageLogic } = newTreeView()

    // root
    // ├d1
    // │├fileA.txt
    // │└fileC.txt
    // └fileB.txt ← d1へ移動
    const d1 = newTestStorageDirNode(`d1`)
    const fileA = newTestStorageFileNode(`d1/fileA.txt`)
    const fileC = newTestStorageFileNode(`d1/fileC.txt`)
    const fileB = newTestStorageFileNode(`fileB.txt`)
    treeView.setAllNodes([d1, fileA, fileC, fileB])

    // 'fileB.txt'を'd1'へ移動
    await treeView.moveNode(`fileB.txt`, `d1/fileB.txt`)

    // root
    // └d1
    //  ├fileA.txt
    //  ├fileB.txt
    //  └fileC.txt
    const _d1 = treeView.getNode(`d1`)!
    const _d1_descendants = _d1.getDescendants()
    const [_fileA, _fileB, _fileC] = _d1_descendants
    expect(_d1_descendants.length).toBe(3)
    expect(_fileA.path).toBe(`d1/fileA.txt`)
    expect(_fileB.path).toBe(`d1/fileB.txt`)
    expect(_fileC.path).toBe(`d1/fileC.txt`)

    verifyParentChildRelationForTree(treeView)
  })

  it('ディレクトリのリネーム', async () => {
    const { treeView, storageLogic } = newTreeView()

    // root
    // ├d1
    // ├d2
    // └d3 ← d0へリネーム
    const d1 = newTestStorageDirNode(`d1`)
    const d2 = newTestStorageDirNode(`d2`)
    const d3 = newTestStorageDirNode(`d3`)
    treeView.setAllNodes([d1, d2, d3])

    // 'd3'を'd0'へリネーム
    await treeView.moveNode(`d3`, `d0`)

    // root
    // ├d0
    // ├d1
    // └d2
    const [_d0, _d1, _d2] = treeView.rootNode.getDescendants()
    expect(_d0.path).toBe(`d0`)
    expect(_d1.path).toBe(`d1`)
    expect(_d2.path).toBe(`d2`)

    verifyParentChildRelationForTree(treeView)
  })

  it('ファイルのリネーム', async () => {
    const { treeView, storageLogic } = newTreeView()

    // root
    // ├file1.txt
    // ├file2.txt
    // └file3.txt ← file0.txtへリネーム
    const file1 = newTestStorageDirNode(`file1.txt`)
    const file2 = newTestStorageDirNode(`file2.txt`)
    const file3 = newTestStorageDirNode(`file3.txt`)
    treeView.setAllNodes([file1, file2, file3])

    // 'file3.txt'を'file0.txt'へリネーム
    await treeView.moveNode(`file3.txt`, `file0.txt`)

    // root
    // ├file0.txt
    // ├file1.txt
    // └file2.txt
    const [_file0, _file1, _file2] = treeView.rootNode.getDescendants()
    expect(_file0.path).toBe(`file0.txt`)
    expect(_file1.path).toBe(`file1.txt`)
    expect(_file2.path).toBe(`file2.txt`)

    verifyParentChildRelationForTree(treeView)
  })

  it('ルートディレクトリへ移動', async () => {
    const { treeView, storageLogic } = newTreeView()

    // root
    // └dB
    //   ├dA
    //   │└fileA.txt
    //   └fileB.txt
    const dB = newTestStorageDirNode(`dB`)
    const dA = newTestStorageDirNode(`dB/dA`)
    const fileA = newTestStorageFileNode(`dB/dA/fileA.txt`)
    const fileB = newTestStorageFileNode(`dB/fileB.txt`)
    treeView.setAllNodes([dB, dA, fileA, fileB])

    // 'dB/dA'をルートノードへ移動
    await treeView.moveNode(`dB/dA`, `dA`)

    // root
    // ├dA
    // │└fileA.txt
    // └dB
    //   └fileB.txt
    const _root = treeView.getNode(``)!
    const [_dA, _fileA, _dB, _fileB] = _root.getDescendants()
    expect(_root.getDescendants().length).toBe(4)
    expect(_dA.path).toBe(`dA`)
    expect(_fileA.path).toBe(`dA/fileA.txt`)
    expect(_dB.path).toBe(`dB`)
    expect(_fileB.path).toBe(`dB/fileB.txt`)

    verifyParentChildRelationForTree(treeView)
  })

  it('移動先に同名のディレクトリまたはファイルが存在する場合', async () => {
    const { treeView, storageLogic } = newTreeView()

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
    const dA = newTestStorageDirNode(`dA`)
    const dA_d1 = newTestStorageDirNode(`dA/d1`)
    const dA_d11 = newTestStorageDirNode(`dA/d1/d11`)
    const dA_d111 = newTestStorageDirNode(`dA/d1/d11/d111`)
    const dA_fileA = newTestStorageFileNode(`dA/d1/d11/d111/fileA.txt`)
    const dA_fileB = newTestStorageFileNode(`dA/d1/d11/d111/fileB.txt`)
    const dA_d12 = newTestStorageDirNode(`dA/d1/d12`)
    const dA_fileX = newTestStorageFileNode(`dA/d1/fileX.txt`)
    const dA_fileY = newTestStorageFileNode(`dA/d1/fileY.txt`)
    const dB = newTestStorageDirNode(`dB`)
    const dB_d1 = newTestStorageDirNode(`dB/d1`)
    const dB_d11 = newTestStorageDirNode(`dB/d1/d11`)
    const dB_d111 = newTestStorageDirNode(`dB/d1/d11/d111`)
    const dB_fileA = newTestStorageFileNode(`dB/d1/d11/d111/fileA.txt`)
    const dB_fileC = newTestStorageFileNode(`dB/d1/d11/d111/fileC.txt`)
    const dB_d13 = newTestStorageDirNode(`dB/d1/d13`)
    const dB_fileX = newTestStorageFileNode(`dB/d1/fileX.txt`)
    const dB_fileZ = newTestStorageFileNode(`dB/d1/fileZ.txt`)
    treeView.setAllNodes([
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
    await treeView.moveNode(`dA/d1`, `dB/d1`)

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

    const _dA = treeView.getNode(`dA`)!
    expect(_dA.getDescendants().length).toBe(0)

    const _dB = treeView.getNode(`dB`)!
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

describe('createStorageDir', () => {
  it('ベーシックケース', async () => {
    const { treeView, storageLogic } = newTreeView()

    // root
    // └d1
    //   └d12
    const d1 = newTestStorageDirNode(`d1`)
    const d12 = newTestStorageDirNode(`d1/d12`)
    treeView.setAllNodes([d1, d12])

    // モック設定
    {
      const d11 = newTestStorageDirNode(`d1/d11`)

      td.when(storageLogic.createDirs([`d1/d11`])).thenResolve([d11])
    }

    // 'd1/d11'を作成
    await treeView.createStorageDir(`d1/d11`)

    // root
    // └d1
    //   └d11
    const _d1 = treeView.getNode(`d1`)!
    const _d1_descendants = _d1.getDescendants()
    const [_d11, _d12] = _d1_descendants
    expect(_d1_descendants.length).toBe(2)
    expect(_d11.path).toBe(`d1/d11`)
    expect(_d12.path).toBe(`d1/d12`)

    expect(_d11.lazyLoadStatus).toBe('loaded')

    verifyParentChildRelationForTree(treeView)
  })

  it('ルートディレクトリ直下に作成', async () => {
    const { treeView, storageLogic } = newTreeView()

    // root
    // └d2
    const d2 = newTestStorageDirNode(`d2`)
    treeView.setAllNodes([d2])

    // モック設定
    {
      const d1 = newTestStorageDirNode(`d1`)

      td.when(storageLogic.createDirs([`d1`])).thenResolve([d1])
    }

    // 'd1'を作成
    await treeView.createStorageDir(`d1`)

    // root
    // ├d1
    // └d2
    const _root = treeView.getNode(``)!
    const _root_descendants = _root.getDescendants()
    const [_d1, _d2] = _root_descendants
    expect(_root_descendants.length).toBe(2)
    expect(_d1.path).toBe(`d1`)
    expect(_d2.path).toBe(`d2`)

    expect(_d1.lazyLoadStatus).toBe('loaded')

    verifyParentChildRelationForTree(treeView)
  })

  it('APIでエラーが発生した場合', async () => {
    const { treeView, storageLogic } = newTreeView()

    td.when(storageLogic.createDirs([`dA`])).thenReject(new Error())

    await treeView.createStorageDir(`dA`)

    // ノードリストに変化がないことを検証
    expect(treeView.getAllNodes()).toEqual([treeView.rootNode])
  })
})

describe('removeStorageNodes', () => {
  it('ベーシックケース', async () => {
    const { treeView, storageLogic } = newTreeView()

    // root
    // ├dev
    // │├projects ← 削除
    // ││└blog
    // ││  └src
    // ││    └index.html
    // │└memo.txt ← 削除
    // └work
    const dev = newTestStorageDirNode(`dev`)
    const projects = newTestStorageDirNode(`dev/projects`)
    const blog = newTestStorageDirNode(`dev/projects/blog`)
    const src = newTestStorageDirNode(`dev/projects/blog/src`)
    const index = newTestStorageFileNode(`dev/projects/blog/src/index.html`)
    const memo = newTestStorageFileNode(`dev/memo.txt`)
    const work = newTestStorageDirNode(`work`)
    treeView.setAllNodes([dev, projects, blog, src, index, memo, work])

    // モック設定
    td.when(storageLogic.sgetNode({ path: `dev/projects` })).thenReturn(projects)
    td.when(storageLogic.sgetNode({ path: `dev/memo.txt` })).thenReturn(memo)

    // 'dev/projects'と'dev/memo.txt'を削除
    await treeView.removeStorageNodes([`dev/projects`, `dev/memo.txt`])

    // root
    // ├dev
    // └work
    const _roo_descendants = treeView.rootNode.getDescendants()
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
    const { treeView, storageLogic } = newTreeView()

    // root
    // ├dev
    // │├projects
    // ││└blog
    // ││  └src
    // ││    └index.html
    // │└memo.txt
    // └work
    const dev = newTestStorageDirNode(`dev`)
    const projects = newTestStorageDirNode(`dev/projects`)
    const blog = newTestStorageDirNode(`dev/projects/blog`)
    const src = newTestStorageDirNode(`dev/projects/blog/src`)
    const index = newTestStorageFileNode(`dev/projects/blog/src/index.html`)
    const memo = newTestStorageFileNode(`dev/memo.txt`)
    const work = newTestStorageDirNode(`work`)
    treeView.setAllNodes([dev, projects, blog, src, index, memo, work])

    // モック設定
    td.when(storageLogic.sgetNode({ path: `dev` })).thenReturn(dev)

    // 'dev'を削除
    await treeView.removeStorageNodes([`dev`])

    // root
    // └work
    const _roo_descendants = treeView.rootNode.getDescendants()
    expect(_roo_descendants.length).toBe(1)
    expect(_roo_descendants[0].path).toBe(`work`)

    const exp = td.explain(storageLogic.removeDir)
    expect(exp.calls[0].args[0]).toBe(`dev`)

    verifyParentChildRelationForTree(treeView)
  })

  it('存在しないパスを指定した場合', async () => {
    const { treeView, storageLogic } = newTreeView()

    treeView.setAllNodes([])

    // モック設定
    const expected = new Error()
    td.when(storageLogic.sgetNode({ path: `dXXX` })).thenThrow(expected)

    let actual!: Error
    try {
      await treeView.removeStorageNodes([`dXXX`])
    } catch (err) {
      actual = err
    }

    expect(actual).toBe(expected)
  })

  it('APIでエラーが発生した場合', async () => {
    const { treeView, storageLogic } = newTreeView()

    // root
    // ├dev
    // │├projects ← 削除
    // ││└blog
    // ││  └src
    // ││    └index.html
    // │└memo.txt ← 削除
    // └work
    const dev = newTestStorageDirNode(`dev`)
    const projects = newTestStorageDirNode(`dev/projects`)
    const blog = newTestStorageDirNode(`dev/projects/blog`)
    const src = newTestStorageDirNode(`dev/projects/blog/src`)
    const index = newTestStorageFileNode(`dev/projects/blog/src/index.html`)
    const memo = newTestStorageFileNode(`dev/memo.txt`)
    const work = newTestStorageDirNode(`work`)
    treeView.setAllNodes([dev, projects, blog, src, index, memo, work])

    // モック設定
    {
      td.when(storageLogic.sgetNode({ path: `dev/projects` })).thenReturn(projects)
      td.when(storageLogic.sgetNode({ path: `dev/memo.txt` })).thenReturn(memo)
      // 'dev/projects'の削除でAPIエラーを発生させる
      td.when(storageLogic.removeDir(`dev/projects`)).thenReject(new Error())
      td.when(storageLogic.removeFile(`dev/memo.txt`)).thenResolve()
    }

    // 'dev/projects'と'dev/memo.txt'を削除
    await treeView.removeStorageNodes([`dev/projects`, `dev/memo.txt`])

    // root
    // ├dev
    // │└projects ← 削除されなかった
    // │  └blog
    // │    └src
    // │      └index.html
    // └work
    const _root_children = treeView.rootNode.children
    expect(_root_children[0].path).toBe(`dev`)
    expect(_root_children[1].path).toBe(`work`)

    // 'dev/projects'は削除されていないことを検証
    // ※'dev/memo.txt'は削除されている
    const _projects = treeView.getNode(`dev/projects`)!
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
    const { treeView, storageLogic } = newTreeView()

    // root
    // ├dev
    // │├projects ← workへ移動
    // ││└blog
    // ││  └src
    // ││    └index.html
    // │└memo.txt ← workへ移動
    // └work ← クライアントに読み込まれていない
    const dev = newTestStorageDirNode(`dev`)
    const projects = newTestStorageDirNode(`dev/projects`)
    const blog = newTestStorageDirNode(`dev/projects/blog`)
    const src = newTestStorageDirNode(`dev/projects/blog/src`)
    const index = newTestStorageFileNode(`dev/projects/blog/src/index.html`)
    const memo = newTestStorageFileNode(`dev/memo.txt`)
    const work = newTestStorageDirNode(`work`)
    treeView.setAllNodes([dev, projects, blog, src, index, memo])

    // モック設定
    {
      const to_projects = cloneTestStorageNode(projects, { dir: `work`, path: `work/projects` })
      const to_blog = cloneTestStorageNode(blog, { dir: `work/projects`, path: `work/projects/blog` })
      const to_src = cloneTestStorageNode(src, { dir: `work/projects/blog`, path: `work/projects/blog/src` })
      const to_index = cloneTestStorageNode(index, { dir: `work/projects/blog/src`, path: `work/projects/blog/src/index.html` })
      const to_memo = cloneTestStorageNode(memo, { dir: `work`, path: `work/memo.txt` })

      // 0. 対象ノードの取得
      td.when(storageLogic.sgetNode({ path: `dev/projects` })).thenReturn(projects)
      td.when(storageLogic.sgetNode({ path: `dev/memo.txt` })).thenReturn(memo)

      // 1. APIによる移動処理を実行
      td.when(storageLogic.moveDir(`dev/projects`, `work/projects`)).thenReturn([to_projects, to_blog, to_src, to_index])
      td.when(storageLogic.moveFile(`dev/memo.txt`, `work/memo.txt`)).thenReturn(to_memo)

      // 2. 移動先ディレクトリとその上位ディレクトリ階層の作成
      td.when(storageLogic.fetchHierarchicalNodes(`work`)).thenReturn([work])
    }

    // 'dev/projects'と'dev/memo.txt'を'work'へ移動
    await treeView.moveStorageNodes([`dev/projects`, `dev/memo.txt`], `work`)

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
      const _dev = treeView.getNode(`dev`)!
      // 子孫ノードの検証
      expect(_dev.getDescendants().length).toBe(0)
    }
    // 'work'の階層構造の検証
    {
      const _work = treeView.getNode(`work`)!
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
    const { treeView, storageLogic } = newTreeView()

    // root
    // └dB
    //   ├dA ← ルートディレクトリへ移動
    //   │└fileA.txt
    //   └fileB.txt ← ルートディレクトリへ移動
    const dB = newTestStorageDirNode(`dB`)
    const dA = newTestStorageDirNode(`dB/dA`)
    const fileA = newTestStorageFileNode(`dB/dA/fileA.txt`)
    const fileB = newTestStorageFileNode(`dB/fileB.txt`)
    treeView.setAllNodes([dB, dA, fileA, fileB])

    // モック設定
    {
      const to_dA = cloneTestStorageNode(dA, { dir: ``, path: `dA` })
      const to_fileA = cloneTestStorageNode(fileA, { dir: `dA`, path: `dA/fileA.txt` })
      const to_fileB = cloneTestStorageNode(fileB, { dir: ``, path: `fileB.txt` })

      // 0. 対象ノードの取得
      td.when(storageLogic.sgetNode({ path: `dB/dA` })).thenReturn(dA)
      td.when(storageLogic.sgetNode({ path: `dB/fileB.txt` })).thenReturn(fileB)

      // 1. APIによる移動処理を実行
      td.when(storageLogic.moveDir(`dB/dA`, `dA`)).thenReturn([to_dA, to_fileA])
      td.when(storageLogic.moveFile(`dB/fileB.txt`, `fileB.txt`)).thenReturn(to_fileB)

      // 2. 移動先ディレクトリとその上位ディレクトリ階層の作成
      td.when(storageLogic.fetchHierarchicalNodes(``)).thenReturn([])
    }

    // 'dB/dA'と'dB/fileB.txt'をルートノードへ移動
    await treeView.moveStorageNodes([`dB/dA`, `dB/fileB.txt`], ``)

    // root
    // ├dA
    // │└fileA.txt
    // ├dB
    // └fileB.txt

    // 'root'の階層構造の検証
    {
      const _root = treeView.getNode(``)!
      // 子孫ノードの検証
      expect(_root.children.length).toBe(3)
      const [_dA, _dB, _fileB] = _root.children
      expect(_dA.path).toBe(`dA`)
      expect(_dB.path).toBe(`dB`)
      expect(_fileB.path).toBe(`fileB.txt`)
    }
    // 'dA'の階層構造の検証
    {
      const _dA = treeView.getNode(`dA`)!
      // 子孫ノードの検証
      expect(_dA.children.length).toBe(1)
      const [_fileA] = _dA.children
      expect(_fileA.path).toBe(`dA/fileA.txt`)
      // ディレクトリノードの遅延ロード状態の検証
      expect(_dA.lazyLoadStatus).toBe('loaded')
    }
    // 'dB'の階層構造の検証
    {
      const _dB = treeView.getNode(`dB`)!
      // 子孫ノードの検証
      expect(_dB.children.length).toBe(0)
    }

    verifyParentChildRelationForTree(treeView)
  })

  it('移動先に同名のディレクトリまたはファイルが存在する場合', async () => {
    const { treeView, storageLogic } = newTreeView()

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
    const dA = newTestStorageDirNode(`dA`)
    const dA_d1 = newTestStorageDirNode(`dA/d1`)
    const dA_d11 = newTestStorageDirNode(`dA/d1/d11`)
    const dA_d111 = newTestStorageDirNode(`dA/d1/d11/d111`)
    const dA_fileA = newTestStorageFileNode(`dA/d1/d11/d111/fileA.txt`)
    const dA_fileB = newTestStorageFileNode(`dA/d1/d11/d111/fileB.txt`)
    const dA_d12 = newTestStorageDirNode(`dA/d1/d12`)
    const dA_fileX = newTestStorageFileNode(`dA/d1/fileX.txt`)
    const dA_fileY = newTestStorageFileNode(`dA/d1/fileY.txt`)
    const dB = newTestStorageDirNode(`dB`)
    const dB_d1 = newTestStorageDirNode(`dB/d1`)
    const dB_d11 = newTestStorageDirNode(`dB/d1/d11`)
    const dB_d111 = newTestStorageDirNode(`dB/d1/d11/d111`)
    const dB_fileA = newTestStorageFileNode(`dB/d1/d11/d111/fileA.txt`)
    const dB_fileC = newTestStorageFileNode(`dB/d1/d11/d111/fileC.txt`)
    const dB_d13 = newTestStorageDirNode(`dB/d1/d13`)
    const dB_fileX = newTestStorageFileNode(`dB/d1/fileX.txt`)
    const dB_fileZ = newTestStorageFileNode(`dB/d1/fileZ.txt`)
    treeView.setAllNodes([
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
      const to_dB_d1 = cloneTestStorageNode(dA_d1, { dir: `dB`, path: `dB/d1` })
      const to_dB_d11 = cloneTestStorageNode(dA_d11, { dir: `dB/d1`, path: `dB/d1/d11` })
      const to_dB_d111 = cloneTestStorageNode(dA_d111, { dir: `dB/d1/d11`, path: `dB/d1/d11/d111` })
      const to_dB_fileA = cloneTestStorageNode(dA_fileA, { dir: `dB/d1/d11/d111`, path: `dB/d1/d11/d111/fileA.txt` })
      const to_dB_fileB = cloneTestStorageNode(dA_fileB, { dir: `dB/d1/d11/d111`, path: `dB/d1/d11/d111/fileB.txt` })
      const to_dB_d12 = cloneTestStorageNode(dA_d12, { dir: `dB/d1`, path: `dB/d1/d12` })
      const to_dB_fileX = cloneTestStorageNode(dA_fileX, { dir: `dB/d1`, path: `dB/d1/fileX.txt` })
      const to_dB_fileY = cloneTestStorageNode(dA_fileY, { dir: `dB/d1`, path: `dB/d1/fileY.txt` })

      // 0. 対象ノードの取得
      td.when(storageLogic.sgetNode({ path: `dA/d1` })).thenReturn(dA_d1)

      // 1. APIによる移動処理を実行
      td.when(storageLogic.moveDir(`dA/d1`, `dB/d1`)).thenReturn([
        to_dB_d1,
        to_dB_d11,
        to_dB_d111,
        to_dB_fileA,
        to_dB_fileB,
        dB_fileC,
        to_dB_d12,
        dB_d13,
        to_dB_fileX,
        to_dB_fileY,
        dB_fileZ,
      ])

      // 2. 移動先ディレクトリとその上位ディレクトリ階層の作成
      td.when(storageLogic.fetchHierarchicalNodes(`dB`)).thenReturn([dB])
    }

    // 'dA/d1'を'dB'へ移動
    await treeView.moveStorageNodes([`dA/d1`], `dB`)

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
      const _dA = treeView.getNode(`dA`)!
      // 子孫ノードの検証
      expect(_dA.getDescendants().length).toBe(0)
    }
    // 'dB'の階層構造の検証
    {
      const _dB = treeView.getNode(`dB`)!
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
    const { treeView, storageLogic } = newTreeView()

    const d1 = newTestStorageDirNode(`d1`)
    const d2 = newTestStorageDirNode(`d2`)
    treeView.setAllNodes([d1, d2])

    let actual!: Error
    try {
      await treeView.moveStorageNodes([``], `tmp`)
    } catch (err) {
      actual = err
    }

    expect(actual.message).toBe(`The root node cannot be moved.`)
  })

  it('存在しないパスを指定した場合', async () => {
    const { treeView, storageLogic } = newTreeView()

    const tmp = newTestStorageDirNode(`tmp`)
    treeView.setAllNodes([tmp])

    // モック設定
    const expected = new Error()
    td.when(storageLogic.sgetNode({ path: `dXXX` })).thenThrow(expected)

    let actual!: Error
    try {
      await treeView.moveStorageNodes([`dXXX`], `tmp`)
    } catch (err) {
      actual = err
    }

    expect(actual).toBe(expected)
  })

  it('移動先ディレクトリが移動元のサブディレクトリの場合', async () => {
    const { treeView, storageLogic } = newTreeView()

    const d1 = newTestStorageDirNode(`d1`)
    const d2 = newTestStorageDirNode(`d2`)
    treeView.setAllNodes([d1, d2])

    // モック設定
    td.when(storageLogic.sgetNode({ path: `d1` })).thenReturn(d1)

    let actual!: Error
    try {
      await treeView.moveStorageNodes([`d1`], `d1/d11/d1`)
    } catch (err) {
      actual = err
    }

    expect(actual.message).toBe(`The destination directory is its own subdirectory: 'd1' -> 'd1/d11/d1'`)
  })

  it('APIでエラーが発生した場合', async () => {
    const { treeView, storageLogic } = newTreeView()

    // root
    // ├dev
    // │├projects ← workへ移動
    // ││└blog
    // ││  └src
    // ││    └index.html
    // │└memo.txt ← workへ移動
    // └work
    const dev = newTestStorageDirNode(`dev`)
    const projects = newTestStorageDirNode(`dev/projects`)
    const blog = newTestStorageDirNode(`dev/projects/blog`)
    const src = newTestStorageDirNode(`dev/projects/blog/src`)
    const index = newTestStorageFileNode(`dev/projects/blog/src/index.html`)
    const memo = newTestStorageFileNode(`dev/memo.txt`)
    const work = newTestStorageDirNode(`work`)
    treeView.setAllNodes([dev, projects, blog, src, index, memo, work])

    // モック設定
    {
      const to_memo = cloneTestStorageNode(memo, { dir: `work`, path: `work/memo.txt` })

      // 0. 対象ノードの取得
      td.when(storageLogic.sgetNode({ path: `dev/projects` })).thenReturn(projects)
      td.when(storageLogic.sgetNode({ path: `dev/memo.txt` })).thenReturn(memo)

      // 1. APIによる移動処理を実行
      // 'dev/projects'の移動でAPIエラーを発生させる
      td.when(storageLogic.moveDir(`dev/projects`, `work/projects`)).thenReject(new Error())
      td.when(storageLogic.moveFile(`dev/memo.txt`, `work/memo.txt`)).thenReturn(to_memo)

      // 2. 移動先ディレクトリとその上位ディレクトリ階層の作成
      td.when(storageLogic.fetchHierarchicalNodes(`work`)).thenReturn([work])
    }

    // 'dev/projects'と'dev/memo.txt'を'work'へ移動
    await treeView.moveStorageNodes([`dev/projects`, `dev/memo.txt`], `work`)

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
      const _dev = treeView.getNode(`dev`)!
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
      const _work = treeView.getNode(`work`)!
      // 子孫ノードの検証
      const _work_descendants = _work.getDescendants()
      const [_memo] = _work_descendants
      expect(_work_descendants.length).toBe(1)
      expect(_memo.path).toBe(`work/memo.txt`)
    }

    verifyParentChildRelationForTree(treeView)
  })

  it('nodeFilterが機能しているか検証', async () => {
    const { treeView, storageLogic } = newTreeView({ nodeFilter: dirNodeFilter })

    // root
    // ├dev
    // │├projects ← workへ移動
    // │└memo.txt ← workへ移動 - nodeFilterで除外されるのでツリーには存在しない
    // └work ← クライアントに読み込まれていない
    const dev = newTestStorageDirNode(`dev`)
    const projects = newTestStorageDirNode(`dev/projects`)
    const memo = newTestStorageFileNode(`dev/memo.txt`)
    const work = newTestStorageDirNode(`work`)
    treeView.setAllNodes([dev, projects])

    // モック設定
    {
      const to_projects = cloneTestStorageNode(projects, { dir: `work`, path: `work/projects` })
      const to_memo = cloneTestStorageNode(memo, { dir: `work`, path: `work/memo.txt` })

      // 0. 対象ノードの取得
      td.when(storageLogic.sgetNode({ path: `dev/projects` })).thenReturn(projects)
      td.when(storageLogic.sgetNode({ path: `dev/memo.txt` })).thenReturn(memo)

      // 1. APIによる移動処理を実行
      td.when(storageLogic.moveDir(`dev/projects`, `work/projects`)).thenReturn([to_projects])
      td.when(storageLogic.moveFile(`dev/memo.txt`, `work/memo.txt`)).thenReturn(to_memo)

      // 2. 移動先ディレクトリとその上位ディレクトリ階層の作成
      td.when(storageLogic.fetchHierarchicalNodes(`work`)).thenReturn([work])
    }

    // 'dev/projects'と'dev/memo.txt'を'work'へ移動
    await treeView.moveStorageNodes([`dev/projects`, `dev/memo.txt`], `work`)

    // root
    // ├dev
    // └work
    //   ├projects
    //   └memo.txt ← nodeFilterで除外されるのでツリーには存在しない

    // 'dev'の階層構造の検証
    {
      const _dev = treeView.getNode(`dev`)!
      // 子孫ノードの検証
      expect(_dev.getDescendants().length).toBe(0)
    }
    // 'work'の階層構造の検証
    {
      const _work = treeView.getNode(`work`)!
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
    const { treeView, storageLogic } = newTreeView()

    // root
    // └dA
    //   └d1 ← x1へリネーム
    //     ├d11
    //     │└fileA.txt
    //     ├d12
    //     └fileB.txt
    const dA = newTestStorageDirNode(`dA`)
    const d1 = newTestStorageDirNode(`dA/d1`)
    const d11 = newTestStorageDirNode(`dA/d1/d11`)
    const fileA = newTestStorageFileNode(`dA/d1/d11/fileA.txt`)
    const d12 = newTestStorageDirNode(`dA/d1/d12`)
    const fileB = newTestStorageFileNode(`dA/d1/fileB.txt`)
    treeView.setAllNodes([dA, d1, d11, fileA, d12, fileB])

    // ディレクトリの子ノード読み込みの検証準備
    treeView.getNode(`dA/d1`)!.lazyLoadStatus = 'loaded'
    treeView.getNode(`dA/d1/d11`)!.lazyLoadStatus = 'loaded'
    treeView.getNode(`dA/d1/d12`)!.lazyLoadStatus = 'none'

    // モック設定
    {
      const to_x1 = cloneTestStorageNode(d1, { name: `x1`, dir: `dA`, path: `dA/x1` })
      const to_d11 = cloneTestStorageNode(d11, { dir: `dA/x1`, path: `dA/x1/d11` })
      const to_fileA = cloneTestStorageNode(fileA, { dir: `dA/x1/d11`, path: `dA/x1/d11/fileA.txt` })
      const to_d12 = cloneTestStorageNode(d12, { dir: `dA/x1`, path: `dA/x1/d12` })
      const to_fileB = cloneTestStorageNode(fileB, { dir: `dA/x1`, path: `dA/x1/fileB.txt` })

      // 0. 対象ノードの取得
      td.when(storageLogic.sgetNode({ path: `dA/d1` })).thenReturn(d1)

      // 1. APIによる移動処理を実行
      td.when(storageLogic.renameDir(`dA/d1`, `x1`)).thenReturn([to_x1, to_d11, to_fileA, to_d12, to_fileB])
    }

    // 'dA/d1'を'dA/x1'へリネーム
    await treeView.renameStorageNode(`dA/d1`, `x1`)

    // root
    // └dA
    //   └x1
    //     ├d11
    //     │└fileA.txt
    //     ├d12
    //     └fileB.txt
    const _x1 = treeView.getNode(`dA/x1`)!
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
    const { treeView, storageLogic } = newTreeView()

    // root
    // └dA
    //   └d1 ← d1XXXへリネーム
    //     ├d11
    //     │└fileA.txt
    //     ├d12
    //     └fileB.txt
    const dA = newTestStorageDirNode(`dA`)
    const d1 = newTestStorageDirNode(`dA/d1`)
    const d11 = newTestStorageDirNode(`dA/d1/d11`)
    const fileA = newTestStorageFileNode(`dA/d1/d11/fileA.txt`)
    const d12 = newTestStorageDirNode(`dA/d1/d12`)
    const fileB = newTestStorageFileNode(`dA/d1/fileB.txt`)
    treeView.setAllNodes([dA, d1, d11, fileA, d12, fileB])

    // モック設定
    {
      const to_d1XXX = cloneTestStorageNode(d1, { name: `d1XXX`, dir: `dA`, path: `dA/d1XXX` })
      const to_d11 = cloneTestStorageNode(d11, { dir: `dA/d1XXX`, path: `dA/d1XXX/d11` })
      const to_fileA = cloneTestStorageNode(fileA, { dir: `dA/d1XXX/d11`, path: `dA/d1XXX/d11/fileA.txt` })
      const to_d12 = cloneTestStorageNode(d12, { dir: `dA/d1XXX`, path: `dA/d1XXX/d12` })
      const to_fileB = cloneTestStorageNode(fileB, { dir: `dA/d1XXX`, path: `dA/d1XXX/fileB.txt` })

      // 0. 対象ノードの取得
      td.when(storageLogic.sgetNode({ path: `dA/d1` })).thenReturn(d1)

      // 1. APIによる移動処理を実行
      td.when(storageLogic.renameDir(`dA/d1`, `d1XXX`)).thenReturn([to_d1XXX, to_d11, to_fileA, to_d12, to_fileB])
    }

    // 'dA/d1'を'dA/d1XXX'へリネーム
    await treeView.renameStorageNode(`dA/d1`, `d1XXX`)

    // root
    // └dA
    //   └d1XXX
    //     ├d11
    //     │└fileA.txt
    //     ├d12
    //     └fileB.txt
    const _d1XXX = treeView.getNode(`dA/d1XXX`)!
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
    const { treeView, storageLogic } = newTreeView()

    // root
    // ├dA
    // │└fileA.txt ← fileX.txtへリネーム
    // └dB
    //   └fileB.txt
    const dA = newTestStorageDirNode(`dA`)
    const fileA = newTestStorageFileNode(`dA/fileA.txt`)
    const dB = newTestStorageDirNode(`dB`)
    const fileB = newTestStorageFileNode(`dB/fileB.txt`)
    treeView.setAllNodes([dA, fileA, dB, fileB])

    // モック設定
    {
      const to_fileX = cloneTestStorageNode(fileA, { name: `fileX`, path: `dA/fileX.txt` })

      // 0. 対象ノードの取得
      td.when(storageLogic.sgetNode({ path: `dA/fileA.txt` })).thenReturn(fileA)

      // 1. APIによる移動処理を実行
      td.when(storageLogic.renameFile(`dA/fileA.txt`, `fileX.txt`)).thenReturn(to_fileX)
    }

    // 'dA/fileA.txt'を'dA/fileX.txt'へリネーム
    await treeView.renameStorageNode(`dA/fileA.txt`, `fileX.txt`)

    // root
    // ├dA
    // │└fileX.txt
    // └dB
    //   └fileB.txt
    const actual = treeView.getNode(`dA/fileX.txt`)!
    expect(actual.path).toBe(`dA/fileX.txt`)

    verifyParentChildRelationForTree(treeView)
  })

  it('ルートディレクトリ直下のノードをリネーム', async () => {
    const { treeView, storageLogic } = newTreeView()

    // root
    // ├dA ← dXへリネーム
    // │└fileA.txt
    // └dB
    //   └fileB.txt
    const dA = newTestStorageDirNode(`dA`)
    const fileA = newTestStorageFileNode(`dA/fileA.txt`)
    const dB = newTestStorageDirNode(`dB`)
    const fileB = newTestStorageFileNode(`dB/fileB.txt`)
    treeView.setAllNodes([dA, fileA, dB, fileB])

    // ディレクトリの子ノード読み込みの検証準備
    // 詳細な検証は他のテストケースで行うため、
    // ここではエラーが発生しないようなモック化を行う
    td.replace(treeView, 'pullChildren')

    // モック設定
    {
      const to_dX = cloneTestStorageNode(dA, { name: `dX`, path: `dX` })
      const to_fileA = cloneTestStorageNode(fileA, { dir: `dX`, path: `dX/fileA.txt` })

      // 0. 対象ノードの取得
      td.when(storageLogic.sgetNode({ path: `dA` })).thenReturn(dA)

      // 1. APIによる移動処理を実行
      td.when(storageLogic.renameDir(`dA`, `dX`)).thenReturn([to_dX, to_fileA])
    }

    // 'dA'を'dX'へリネーム
    await treeView.renameStorageNode(`dA`, `dX`)

    // root
    // ├dB
    // │└fileB.txt
    // └dX
    //   └fileA.txt
    const _dX = treeView.getNode(`dX`)!
    const _dX_descendants = _dX.getDescendants()
    const [_fileA] = _dX_descendants

    expect(_dX_descendants.length).toBe(1)
    expect(_fileA.path).toBe(`dX/fileA.txt`)

    verifyParentChildRelationForTree(treeView)
  })

  it('ルートディレクトリを指定した場合', async () => {
    const { treeView, storageLogic } = newTreeView()

    const d1 = newTestStorageDirNode(`d1`)
    const d2 = newTestStorageDirNode(`d2`)
    treeView.setAllNodes([d1, d2])

    let actual!: Error
    try {
      await treeView.renameStorageNode(``, `tmp`)
    } catch (err) {
      actual = err
    }

    expect(actual.message).toBe(`The root node cannot be renamed.`)
  })

  it('存在しないパスを指定した場合', async () => {
    const { treeView, storageLogic } = newTreeView()

    treeView.setAllNodes([])

    // モック設定
    const expected = new Error()
    td.when(storageLogic.sgetNode({ path: `dXXX` })).thenThrow(expected)

    let actual!: Error
    try {
      await treeView.renameStorageNode(`dXXX`, `x1`)
    } catch (err) {
      actual = err
    }

    expect(actual).toBe(expected)
  })

  it('APIでエラーが発生した場合', async () => {
    const { treeView, storageLogic } = newTreeView()

    // root
    // └dA
    //   └d1 ← x1へリネーム
    //     └fileA.txt
    const dA = newTestStorageDirNode(`dA`)
    const d1 = newTestStorageDirNode(`dA/d1`)
    const fileA = newTestStorageFileNode(`dA/d1/fileA.txt`)
    treeView.setAllNodes([dA, d1, fileA])

    // モック設定
    {
      const to_x1 = cloneTestStorageNode(d1, { name: `x1`, dir: `dA`, path: `dA/x1` })
      const to_fileA = cloneTestStorageNode(fileA, { dir: `dA/x1/d11`, path: `dA/x1/fileA.txt` })

      // 0. 対象ノードの取得
      td.when(storageLogic.sgetNode({ path: `dA/d1` })).thenReturn(d1)

      // 1. APIによる移動処理を実行
      td.when(storageLogic.renameDir(`dA/d1`, `x1`)).thenReject(new Error())
    }

    // 'dA/d1'を'dA/x1'へリネーム
    await treeView.renameStorageNode(`dA/d1`, `x1`)

    // root
    // └dA
    //   └d1 ← リネームされなかった
    //     └fileA.txt
    const _d1 = treeView.getNode(`dA/d1`)!
    const _d1_descendants = _d1.getDescendants()
    const [_fileA] = _d1_descendants

    expect(_d1_descendants.length).toBe(1)
    expect(_fileA.path).toBe(`dA/d1/fileA.txt`)

    verifyParentChildRelationForTree(treeView)
  })
})

describe('setShareSettings', () => {
  const NEW_SHARE_SETTINGS: StorageNodeShareSettings = {
    isPublic: true,
    readUIds: ['ichiro'],
    writeUIds: ['ichiro'],
  }

  it('ベーシックケース', async () => {
    const { treeView, storageLogic } = newTreeView()

    // root
    // └dA
    //   ├d1 ← 設定対象
    //   │└d11
    //   │  └fileA.txt
    //   ├fileB.txt ← 設定対象
    //   └fileC.txt
    const dA = newTestStorageDirNode(`dA`)
    const d1 = newTestStorageDirNode(`dA/d1`)
    const d11 = newTestStorageDirNode(`dA/d1/d11`)
    const fileA = newTestStorageFileNode(`dA/d1/d11/fileA.txt`)
    const fileB = newTestStorageFileNode(`dA/fileB.txt`)
    const fileC = newTestStorageFileNode(`dA/fileC.txt`)
    treeView.setAllNodes([dA, d1, d11, fileA, fileB, fileC])

    // モック設定
    {
      const to_d1 = cloneTestStorageNode(d1, { share: NEW_SHARE_SETTINGS })
      const to_fileB = cloneTestStorageNode(fileB, { share: NEW_SHARE_SETTINGS })

      td.when(storageLogic.sgetNode({ path: `dA/d1` })).thenReturn(d1)
      td.when(storageLogic.sgetNode({ path: `dA/fileB.txt` })).thenReturn(fileB)

      td.when(storageLogic.setDirShareSettings(to_d1.path, NEW_SHARE_SETTINGS)).thenReturn(to_d1)
      td.when(storageLogic.setFileShareSettings(to_fileB.path, NEW_SHARE_SETTINGS)).thenReturn(to_fileB)
    }

    // 'dA/d1'と'dA/fileB.txt'に共有設定
    await treeView.setShareSettings([`dA/d1`, `dA/fileB.txt`], NEW_SHARE_SETTINGS)

    const _dA = treeView.getNode(`dA`)!
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
    const { treeView, storageLogic } = newTreeView({ nodeFilter: dirNodeFilter })

    const d1 = newTestStorageDirNode(`d1`)
    const d2 = newTestStorageDirNode(`d2`)
    treeView.setAllNodes([d1, d2])

    let actual!: Error
    try {
      await treeView.setShareSettings([``], NEW_SHARE_SETTINGS)
    } catch (err) {
      actual = err
    }

    expect(actual.message).toBe(`The root node cannot be set share settings.`)
  })

  it('存在しないパスを指定した場合', async () => {
    const { treeView, storageLogic } = newTreeView({ nodeFilter: dirNodeFilter })

    treeView.setAllNodes([])

    // モック設定
    const expected = new Error()
    td.when(storageLogic.sgetNode({ path: `dXXX` })).thenThrow(expected)

    let actual!: Error
    try {
      await treeView.setShareSettings([`dXXX`], NEW_SHARE_SETTINGS)
    } catch (err) {
      actual = err
    }

    expect(actual).toBe(expected)
  })

  it('APIでエラーが発生した場合', async () => {
    const { treeView, storageLogic } = newTreeView()

    // root
    // └dA
    //   ├d1 ← 設定対象
    //   │└d11
    //   │  └fileA.txt
    //   ├fileB.txt ← 設定対象
    //   └fileC.txt
    const dA = newTestStorageDirNode(`dA`)
    const d1 = newTestStorageDirNode(`dA/d1`)
    const d11 = newTestStorageDirNode(`dA/d1/d11`)
    const fileA = newTestStorageFileNode(`dA/d1/d11/fileA.txt`)
    const fileB = newTestStorageFileNode(`dA/fileB.txt`)
    const fileC = newTestStorageFileNode(`dA/fileC.txt`)
    treeView.setAllNodes([dA, d1, d11, fileA, fileB, fileC])

    // モック設定
    {
      const to_d1 = cloneTestStorageNode(d1, { share: NEW_SHARE_SETTINGS })
      const to_fileB = cloneTestStorageNode(fileB, { share: NEW_SHARE_SETTINGS })

      td.when(storageLogic.sgetNode({ path: `dA/d1` })).thenReturn(d1)
      td.when(storageLogic.sgetNode({ path: `dA/fileB.txt` })).thenReturn(fileB)

      // 'dA/d1'の共有設定でAPIエラーを発生させる
      td.when(storageLogic.setDirShareSettings(to_d1.path, NEW_SHARE_SETTINGS)).thenReject(new Error())
      td.when(storageLogic.setFileShareSettings(to_fileB.path, NEW_SHARE_SETTINGS)).thenReturn(to_fileB)
    }

    // 'dA/d1'と'dA/fileB.txt'に共有設定
    await treeView.setShareSettings([`dA/d1`, `dA/fileB.txt`], NEW_SHARE_SETTINGS)

    // root
    // └dA
    //   ├d1 ← 設定されなかった
    //   │└d11
    //   │  └fileA.txt
    //   ├fileB.txt ← 設定された
    //   └fileC.txt
    const _dA = treeView.getNode(`dA`)!
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
    const { treeView, storageLogic } = newTreeView({ nodeFilter: dirNodeFilter })

    // root
    // ├d1 ← 設定対象
    // └f1.txt ← 設定対象 - nodeFilterで除外されるのでツリーには存在しない
    const d1 = newTestStorageDirNode(`d1`)
    const f1 = newTestStorageFileNode(`f1.txt`)
    treeView.setAllNodes([d1])

    // モック設定
    {
      const to_d1 = cloneTestStorageNode(d1, { share: NEW_SHARE_SETTINGS })
      const to_f1 = cloneTestStorageNode(f1, { share: NEW_SHARE_SETTINGS })

      td.when(storageLogic.sgetNode({ path: `d1` })).thenReturn(d1)
      td.when(storageLogic.sgetNode({ path: `f1.txt` })).thenReturn(f1)

      td.when(storageLogic.setDirShareSettings(to_d1.path, NEW_SHARE_SETTINGS)).thenReturn(to_d1)
      td.when(storageLogic.setFileShareSettings(to_f1.path, NEW_SHARE_SETTINGS)).thenReturn(to_f1)
    }

    // 'd1'と'f1.txt'に共有設定
    await treeView.setShareSettings([`d1`, `f1.txt`], NEW_SHARE_SETTINGS)

    // root
    // ├d1
    // └f1.txt ← nodeFilterで除外されるのでツリーには存在しない
    const _descendants = treeView.rootNode.getDescendants()
    const [_d1] = _descendants
    expect(_descendants.length).toBe(1)
    expect(_d1.share).toEqual(NEW_SHARE_SETTINGS)

    verifyParentChildRelationForTree(treeView)
  })
})
