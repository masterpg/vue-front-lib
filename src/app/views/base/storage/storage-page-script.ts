import { CreateArticleTypeDirInput, StorageNode, StorageNodeShareSettings, StorageType } from '@/app/services'
import { Loading, QSplitter, Screen } from 'quasar'
import { SetupContext, computed, onMounted, onUnmounted, reactive, ref, watch } from '@vue/composition-api'
import { StorageNodeActionEvent, StorageTreeNodeData } from '@/app/views/base/storage/base'
import { TreeView, TreeViewLazyLoadEvent, TreeViewSelectEvent } from '@/app/components/tree-view'
import { extendedMethod, useScreenSize } from '@/app/base'
import { StorageDirCreateDialog } from '@/app/views/base/storage/storage-dir-create-dialog.vue'
import { StorageDirDetailView } from '@/app/views/base/storage/storage-dir-detail-view.vue'
import { StorageDirPathBreadcrumb } from '@/app/views/base/storage/storage-dir-path-breadcrumb.vue'
import { StorageDirView } from '@/app/views/base/storage/storage-dir-view.vue'
import { StorageFileDetailView } from '@/app/views/base/storage/storage-file-detail-view.vue'
import { StorageNodeMoveDialog } from '@/app/views/base/storage/storage-node-move-dialog.vue'
import { StorageNodeRemoveDialog } from '@/app/views/base/storage/storage-node-remove-dialog.vue'
import { StorageNodeRenameDialog } from '@/app/views/base/storage/storage-node-rename-dialog.vue'
import { StorageNodeShareDialog } from '@/app/views/base/storage/storage-node-share-dialog.vue'
import { StoragePageService } from '@/app/views/base/storage'
import { StorageTreeNode } from '@/app/views/base/storage/storage-tree-node.vue'
import { StorageUploadProgressFloat } from '@/app/components/storage/storage-upload-progress-float.vue'
import { UploadEndedEvent } from '@/app/components/storage'
import _path from 'path'
import anime from 'animejs'
import { removeBothEndsSlash } from 'web-base-lib'

//========================================================================
//
//  Implementation
//
//========================================================================

namespace StoragePage {
  export const components = {
    TreeView: TreeView.clazz,
    StorageDirPathBreadcrumb: StorageDirPathBreadcrumb.clazz,
    StorageDirView: StorageDirView.clazz,
    StorageDirDetailView: StorageDirDetailView.clazz,
    StorageFileDetailView: StorageFileDetailView.clazz,
    StorageUploadProgressFloat: StorageUploadProgressFloat.clazz,
    StorageDirCreateDialog: StorageDirCreateDialog.clazz,
    StorageNodeMoveDialog: StorageNodeMoveDialog.clazz,
    StorageNodeRemoveDialog: StorageNodeRemoveDialog.clazz,
    StorageNodeRenameDialog: StorageNodeRenameDialog.clazz,
    StorageNodeShareDialog: StorageNodeShareDialog.clazz,
  }

  export function setup(params: { ctx: SetupContext; storageType: StorageType; nodeFilter?: (node: StorageNode) => boolean }) {
    const { ctx, storageType, nodeFilter } = params

    //----------------------------------------------------------------------
    //
    //  Lifecycle hooks
    //
    //----------------------------------------------------------------------

    onMounted(async () => {
      await fetchInitialNodes()
    })

    onUnmounted(() => {
      StoragePageService.destroyInstance(storageType)
    })

    //----------------------------------------------------------------------
    //
    //  Variables
    //
    //----------------------------------------------------------------------

    const pageContainer = ref<QSplitter>()
    const treeViewContainer = ref<HTMLElement>()
    const treeViewRef = ref<TreeView<StorageTreeNode, StorageTreeNodeData>>()
    const pathDirBreadcrumb = ref<StorageDirPathBreadcrumb>()
    const dirView = ref<StorageDirView>()
    const dirDetailView = ref<StorageDirDetailView>()
    const fileDetailView = ref<StorageFileDetailView>()
    const dirCreateDialog = ref<StorageDirCreateDialog>()
    const nodeMoveDialog = ref<StorageNodeMoveDialog>()
    const nodeRemoveDialog = ref<StorageNodeRemoveDialog>()
    const nodeRenameDialog = ref<StorageNodeRenameDialog>()
    const nodeShareDialog = ref<StorageNodeShareDialog>()
    const uploadProgressFloat = ref<StorageUploadProgressFloat>()

    const pageService = StoragePageService.newInstance({ storageType, treeViewRef, nodeFilter })
    const screenSize = useScreenSize()
    const isSignedIn = pageService.isSignedIn
    const isSigningIn = pageService.isSigningIn

    const state = reactive({
      visibleDirDetailView: false,
      visibleFileDetailView: false,
      splitterModel: Screen.lt.md ? 0 : 300,
      splitterModelBk: 300,
    })

    /**
     * ディレクトリorファイル詳細ドロワーの表示フラグです。
     */
    const visibleDetailDrawer = ref(false)

    /**
     * ディレクトリ詳細ビューの表示フラグです。
     */
    const visibleDirDetailView = computed({
      get: () => state.visibleDirDetailView,
      set: value => {
        state.visibleDirDetailView = value
        visibleDetailDrawer.value = value
      },
    })

    /**
     * ファイル詳細ビューの表示フラグです。
     */
    const visibleFileDetailView = computed({
      get: () => state.visibleFileDetailView,
      set: value => {
        state.visibleFileDetailView = value
        visibleDetailDrawer.value = value
      },
    })

    /**
     * 左右のペインを隔てるスプリッターの左ペインの幅(px)です。
     */
    const splitterModel = computed({
      get: () => {
        return screenSize.gt.sp ? state.splitterModel : 0
      },
      set: value => {
        state.splitterModel = value
      },
    })

    /**
     * 選択ノードまでスクロールする必要があることを示すフラグです。
     */
    const needScrollToSelectedNode = ref(false)

    /**
     * 選択ノードまでのスクロールするアニメーション(実行中のもの)です。
     * アニメーションが完了するとnullが設定されます。
     */
    const scrollAnime = ref<anime.AnimeInstance | null>(null)

    //----------------------------------------------------------------------
    //
    //  Internal methods
    //
    //----------------------------------------------------------------------

    /**
     * 初回に読み込むべきストレージノードの読み込みを行います。
     */
    async function fetchInitialNodes(): Promise<void> {
      dirView.value!.loading = true
      const { selectedTreeNodePath, isFetchedInitialStorage } = pageService.store

      // 現在の選択ノードを取得
      // ※URLから取得したディレクトリまたは現在の選択ノード
      const dirPath = pageService.route.getNodePath() || selectedTreeNodePath.value

      // 初期ストレージノードの読み込み
      await pageService.fetchInitialStorage({ path: dirPath })
      if (!isFetchedInitialStorage.value) {
        dirView.value!.loading = false
        return
      }

      // ページの選択ノードを設定
      await changeDirOnPage(dirPath)
      // 選択ノードの位置までスクロールする
      scrollToSelectedNode(dirPath, false)

      dirView.value!.loading = false
    }

    /**
     * 指定されたノードがディレクトリの場合はそのディレクトリへ移動し、
     * 指定されたノードがディレクトリ以外の場合は親であるディレクトリへ移動します。
     * @param nodePath
     */
    const changeDir = extendedMethod((nodePath: string) => {
      const selectedNodePath = pageService.getTreeNode({ path: nodePath })?.path ?? pageService.getRootTreeNode().path

      // ノード詳細ビューを非表示にする
      visibleDirDetailView.value = false
      visibleFileDetailView.value = false
      // 選択ノードを設定
      pageService.setSelectedTreeNode(selectedNodePath, true, true)
      // パンくずに選択ノードを設定
      pathDirBreadcrumb.value!.setSelectedNode(selectedNodePath)
      // ディレクトリビューに選択ノードを設定
      dirView.value!.setSelectedNode(selectedNodePath)
    })

    /**
     * 指定ディレクトリのパスをURLへ付与してディレクトリを移動します。
     * @param dirPath ディレクトリパス
     */
    async function changeDirOnPage(dirPath: string): Promise<void> {
      dirPath = removeBothEndsSlash(dirPath)

      const urlDirPath = removeBothEndsSlash(pageService.route.getNodePath())
      // 移動先が変わらない場合
      // ※URLから取得したディレクトリと移動先のディレクトリが同じ場合
      if (urlDirPath === dirPath) {
        // 指定されたディレクトリをページの選択ノードとして設定
        changeDir(dirPath)
      }
      // 移動先が変わる場合
      else {
        // 選択ディレクトリのパスをURLに付与
        // ※ルーターによって本ページ内のbeforeRouteUpdate()が実行される
        await pageService.route.move(dirPath)
      }
    }

    /**
     * パンくずブロック、またはディレクトリビューでディレクトリが選択された際の処理を行います。
     * @param dirPath
     */
    function dirOnChange(dirPath: string): void {
      dirPath = removeBothEndsSlash(dirPath)

      needScrollToSelectedNode.value = true
      // ツリービューの選択ノードに指定されたディレクトリを設定
      // ※ツリービューのselectイベントが発火され、ディレクトリが切り替わる
      pageService.setSelectedTreeNode(dirPath, true, false)
    }

    /**
     * 指定されたノードの祖先ノードを展開します。
     * @param nodePath
     * @param animate
     */
    function openAncestorNodes(nodePath: string, animate: boolean): void {
      const treeNode = pageService.getTreeNode({ path: nodePath })
      if (!treeNode?.parent) return

      treeNode.parent.open(animate)
      openAncestorNodes(treeNode.parent.path, animate)
    }

    /**
     * 指定されたノードと祖先ノードを展開します。
     * @param nodePath
     * @param animate
     */
    function openAncestorNodesWith(nodePath: string, animate: boolean): void {
      openAncestorNodes(nodePath, animate)
      const node = pageService.sgetTreeNode({ path: nodePath })
      node.open(animate)
    }

    /**
     * 指定ノードをツリービューの上下中央に位置するようスクロールします。
     * @param nodePath
     * @param animate
     */
    function scrollToSelectedNode(nodePath: string, animate: boolean): void {
      const treeNode = pageService.getTreeNode({ path: nodePath })
      if (!treeNode) return

      // 本ページのグローバルな上位置を取得
      const globalTop = pageContainer.value!.$el.getBoundingClientRect().top
      // ツリービューの現スクロール位置を取得
      const scrollTop = treeViewContainer.value!.scrollTop
      // 指定ノードの上位置を取得
      const nodeTop = treeNode.$el.getBoundingClientRect().top - globalTop
      // スクロール値の最大を取得
      const maxScrollTop = treeViewRef.value!.$el.scrollHeight - treeViewContainer.value!.clientHeight

      // 指定ノードをツリービューの上下中央に位置するようスクロール(できるだけ)
      let newScrollTop = scrollTop + nodeTop - treeViewContainer.value!.clientHeight / 2
      if (newScrollTop < 0) {
        newScrollTop = 0
      } else if (maxScrollTop < newScrollTop) {
        newScrollTop = maxScrollTop
      }

      scrollAnime.value && scrollAnime.value.pause()
      scrollAnime.value = anime({
        targets: treeViewContainer.value!,
        scrollTop: newScrollTop,
        duration: animate ? 750 : 0,
        easing: 'easeOutQuart',
        complete: () => {
          scrollAnime.value = null
        },
      })

      // console.log(JSON.stringify({ scrollTop, nodeTop, 'treeViewContainer.clientHeight / 2': treeViewContainer.value!.clientHeight / 2, newScrollTop }, null, 2))
    }

    /**
     * 指定されたノードの詳細ビューを表示します。
     * @param nodePath
     */
    function showNodeDetail(nodePath: string): void {
      visibleDirDetailView.value = false
      visibleFileDetailView.value = false
      const node = pageService.sgetStorageNode({ path: nodePath })

      switch (node.nodeType) {
        case 'Dir': {
          // ディレクトリ詳細ビューを表示
          dirDetailView.value!.setNodePath(node.path)
          visibleDirDetailView.value = true
          break
        }
        case 'File': {
          // ファイル詳細ビューを表示
          fileDetailView.value!.setNodePath(node.path)
          visibleFileDetailView.value = true
          break
        }
      }
    }

    /**
     * ディレクトリの作成を行います。
     * @param dirPath 作成するディレクトリのパス
     */
    async function createDir(dirPath: string): Promise<void> {
      Loading.show()

      // ディレクトリの作成を実行
      await pageService.createStorageDir(dirPath)

      // 現在選択されているノードへURL遷移 ※ページ更新
      await changeDirOnPage(pageService.selectedTreeNode.value.path)

      Loading.hide()
    }

    /**
     * ノードの移動を行います。
     * @param nodePaths 移動するノード
     * @param toParentPath 移動先親ディレクトリのパス
     */
    async function moveNodes(nodePaths: string[], toParentPath: string): Promise<void> {
      Loading.show()

      // ノードの移動を実行
      await pageService.moveStorageNodes(nodePaths, toParentPath)

      // 現在選択されているノードへURL遷移 ※ページ更新
      await changeDirOnPage(pageService.selectedTreeNode.value.path)

      Loading.hide()
    }

    /**
     * ノードのリネームを行います。
     * @param nodePath リネームするノード
     * @param newName ノードの新しい名前
     */
    async function renameNode(nodePath: string, newName: string): Promise<void> {
      Loading.show()

      // ノードのリネームを実行
      await pageService.renameStorageNode(nodePath, newName)

      // 現在選択されているノードへURL遷移
      await changeDirOnPage(pageService.selectedTreeNode.value.path)

      Loading.hide()
    }

    /**
     * ノードの共有設定を行います。
     * @param nodePaths 共有設定するノード
     * @param input 共有設定の内容
     */
    async function setShareSettings(nodePaths: string[], input: StorageNodeShareSettings): Promise<void> {
      Loading.show()

      // ノードの共有設定を実行
      await pageService.setStorageNodeShareSettings(nodePaths, input)

      // 現在選択されているノードへURL遷移 ※ページ更新
      await changeDirOnPage(pageService.selectedTreeNode.value.path)

      Loading.hide()
    }

    /**
     * ノードの削除を行います。
     * @param nodePaths 削除するノード
     */
    async function removeNodes(nodePaths: string[]): Promise<void> {
      Loading.show()

      // 削除後の遷移先ノードを取得
      // ・選択ノードが削除された場合、親ノードへ遷移
      // ・それ以外は現在の選択ノードへ遷移
      let toNodePath = pageService.selectedTreeNode.value.path
      // 選択ノードが削除されるのかを取得
      const selectedRemovingNodePath = nodePaths.find(nodePath => {
        if (nodePath === pageService.selectedTreeNode.value.path) return nodePath
      })
      // 選択ノードが削除される場合、親ノードへ遷移するよう準備
      if (selectedRemovingNodePath) {
        const removingCertainNode = pageService.sgetStorageNode({ path: nodePaths[0] })
        toNodePath = removingCertainNode.dir
      }

      // ノードの移動を実行
      await pageService.removeStorageNodes(nodePaths)

      // 上記で取得したノードへURL遷移
      await changeDirOnPage(toNodePath)

      Loading.hide()
    }

    /**
     * 記事系ディレクトリの作成を行います。
     * @param input
     */
    async function createArticleTypeDir(input: CreateArticleTypeDirInput): Promise<void> {
      Loading.show()

      // 記事系ディレクトリの作成
      await pageService.createArticleTypeDir(input)

      // 現在選択されているノードへURL遷移 ※ページ更新
      await changeDirOnPage(pageService.selectedTreeNode.value.path)

      Loading.hide()
    }

    /**
     * ページ状態をクリアします。
     */
    const clear = extendedMethod(() => {
      pageService.clear()
      pathDirBreadcrumb.value?.setSelectedNode(null)
      dirView.value?.setSelectedNode(null)
    })

    //----------------------------------------------------------------------
    //
    //  Event listeners
    //
    //----------------------------------------------------------------------

    watch(
      () => isSignedIn.value,
      async newValue => {
        if (newValue) {
          await fetchInitialNodes()
        } else {
          clear()
        }
      }
    )

    watch(
      () => ctx.root.$route,
      (newValue, oldValue) => {
        if (!isSignedIn.value || !pageService.route.isCurrent.value) return
        // URLから選択ノードパスを取得(取得できなかった場合はルートノード)
        const dirPath = pageService.route.getNodePath()
        // ページの選択ノードを設定
        changeDir(dirPath)
      }
    )

    /**
     * パンくずのブロックがクリックされた際のリスナです。
     * @param nodePath
     */
    function pathDirBreadcrumbOnSelect(nodePath: string) {
      dirOnChange(nodePath)
    }

    /**
     * パンくずのトグルドロワーボタンがクリックされた際のリスナです。
     */
    function pathDirBreadcrumbOnToggleDrawer() {
      let newValue = 0
      if (splitterModel.value > 0) {
        state.splitterModelBk = splitterModel.value
        newValue = 0
      } else {
        newValue = state.splitterModelBk
      }

      anime({
        targets: splitterModel,
        value: newValue,
        duration: 500,
        easing: 'easeOutQuart',
      })
    }

    /**
     * アップロード進捗フロートでアップロードが終了した際のハンドラです。
     * @param e
     */
    async function uploadProgressFloatOnUploadEnds(e: UploadEndedEvent) {
      // アップロードが行われた後のツリーの更新処理
      await pageService.onUploaded(e)
      // 現在選択されているノードへURL遷移 ※ページ更新
      await changeDirOnPage(pageService.selectedTreeNode.value.path)
    }

    /**
     * ポップアップメニューでアクションが選択された際のリスナです。
     * @param e
     */
    async function popupMenuOnNodeAction(e: StorageNodeActionEvent) {
      switch (e.type) {
        case 'reload': {
          const { targetPath } = (e as StorageNodeActionEvent<'reload'>).params
          await pageService.reloadStorageDir({ path: targetPath })
          // ページの選択ノードを設定
          // ※ディレクトリビューの更新
          changeDir(pageService.selectedTreeNode.value.path)
          break
        }
        case 'createDir': {
          const { parentPath } = (e as StorageNodeActionEvent<'createDir'>).params
          const pathData = await dirCreateDialog.value!.open({ parentPath })
          if (pathData) {
            await createDir(_path.join(pathData.dir, pathData.name))
          }
          break
        }
        case 'uploadDir': {
          const { parentPath } = (e as StorageNodeActionEvent<'uploadDir'>).params
          uploadProgressFloat.value!.openDirSelectDialog(parentPath)
          break
        }
        case 'uploadFiles': {
          const { parentPath } = (e as StorageNodeActionEvent<'uploadFiles'>).params
          uploadProgressFloat.value!.openFilesSelectDialog(parentPath)
          break
        }
        case 'move': {
          const { targetPaths } = (e as StorageNodeActionEvent<'move'>).params
          const toParentPath = await nodeMoveDialog.value!.open(targetPaths)
          if (typeof toParentPath === 'string') {
            await moveNodes(targetPaths, toParentPath)
          }
          break
        }
        case 'rename': {
          const { targetPath } = (e as StorageNodeActionEvent<'rename'>).params
          const newName = await nodeRenameDialog.value!.open(targetPath)
          if (newName) {
            await renameNode(targetPath, newName)
          }
          break
        }
        case 'share': {
          const { targetPaths } = (e as StorageNodeActionEvent<'share'>).params
          const input = await nodeShareDialog.value!.open(targetPaths)
          if (input) {
            await setShareSettings(targetPaths, input)
          }
          break
        }
        case 'delete': {
          const { targetPaths } = (e as StorageNodeActionEvent<'delete'>).params
          const confirmed = await nodeRemoveDialog.value!.open(targetPaths)
          if (confirmed) {
            await removeNodes(targetPaths)
          }
          break
        }
        case 'createArticleTypeDir': {
          const { parentPath, type } = (e as StorageNodeActionEvent<'createArticleTypeDir'>).params
          const pathData = await dirCreateDialog.value!.open({
            parentPath,
            article: { dir: { type } },
          })
          if (pathData) {
            await createArticleTypeDir({ ...pathData, type })
          }
          break
        }
      }
    }

    //--------------------------------------------------
    //  ツリービュー
    //--------------------------------------------------

    /**
     * ツリービューで遅延ロードが開始された際のリスナです。
     * @param e
     */
    async function treeViewOnLazyLoad(e: TreeViewLazyLoadEvent<StorageTreeNode>) {
      dirView.value!.loading = true

      // 選択または展開されようとしているディレクトリ直下のノードをサーバーから取得
      // ※done()が実行された後にselectイベントが発火し、ページが更新される
      await pageService.fetchStorageChildren({ path: e.node.path })
      e.done()

      // 遅延ロードの対象ノードがディレクトリビューに表示されている場合
      if (e.node.id === dirView.value!.targetDir?.id) {
        // ディレクトリビューをリフレッシュ
        dirView.value!.refresh()
      }

      // 遅延ロードの対象ノードを展開
      openAncestorNodesWith(e.node.path, true)

      dirView.value!.loading = false
    }

    /**
     * ツリービューでノードが選択された際のリスナです。
     * @param e
     */
    const treeViewOnSelect = extendedMethod<(e: TreeViewSelectEvent<StorageTreeNode>) => void | Promise<void>>(e => {
      const selectedNode = e.node

      // 選択ノードまでスクロールするフラグが立っている場合
      if (needScrollToSelectedNode.value) {
        // 選択されたノードの祖先を展開（アニメーションなし）
        openAncestorNodes(selectedNode.path, false)
        // 選択ノードの位置までスクロールする
        scrollToSelectedNode(selectedNode.path, true)

        needScrollToSelectedNode.value = false
      }

      // 選択ノードのパスをURLに付与
      return changeDirOnPage(selectedNode.path)
    })

    //--------------------------------------------------
    //  ディレクトリビュー
    //--------------------------------------------------

    /**
     * ディレクトリビューでノードが選択された際のリスナです。
     * @param nodePath
     */
    function dirViewOnSelect(nodePath: string) {
      showNodeDetail(nodePath)
    }

    /**
     * ディレクトリビューでノードがディープ選択された際のリスナです。
     * @param dirPath
     */
    function dirViewOnDeepSelect(dirPath: string) {
      dirOnChange(dirPath)
    }

    //--------------------------------------------------
    //  ノード詳細ビュー
    //--------------------------------------------------

    function nodeDetailViewOnClose() {
      visibleDirDetailView.value = false
      visibleFileDetailView.value = false
    }

    //----------------------------------------------------------------------
    //
    //  Result
    //
    //----------------------------------------------------------------------

    return {
      storageType,
      pageContainer,
      treeViewContainer,
      treeViewRef,
      pathDirBreadcrumb,
      dirCreateDialog,
      nodeMoveDialog,
      nodeRemoveDialog,
      nodeRenameDialog,
      nodeShareDialog,
      uploadProgressFloat,
      isSignedIn,
      isSigningIn,
      dirView,
      dirDetailView,
      fileDetailView,
      visibleDetailDrawer,
      visibleDirDetailView,
      visibleFileDetailView,
      splitterModel,
      needScrollToSelectedNode,
      changeDir,
      changeDirOnPage,
      openAncestorNodes,
      scrollToSelectedNode,
      showNodeDetail,
      clear,
      pathDirBreadcrumbOnSelect,
      pathDirBreadcrumbOnToggleDrawer,
      uploadProgressFloatOnUploadEnds,
      popupMenuOnNodeAction,
      treeViewOnSelect,
      treeViewOnLazyLoad,
      dirViewOnSelect,
      dirViewOnDeepSelect,
      nodeDetailViewOnClose,
    }
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { StoragePage }
