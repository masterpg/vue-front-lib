import { SetupContext, onMounted, onUnmounted, ref, watch } from '@vue/composition-api'
import { StorageNode, StorageType } from '@/app/logic'
import { StorageNodeActionEvent, StorageTreeNodeData } from '@/app/views/base/storage/base'
import { TreeView, TreeViewEvent, TreeViewLazyLoadEvent } from '@/app/components/tree-view'
import { StorageDirPathBreadcrumb } from '@/app/views/base/storage/storage-dir-path-breadcrumb.vue'
import { StorageDirView } from '@/app/views/base/storage/storage-dir-view.vue'
import { StoragePageLogic } from '@/app/views/base/storage'
import { StorageTreeNode } from '@/app/views/base/storage/storage-tree-node.vue'
import anime from 'animejs'
import { removeBothEndsSlash } from 'web-base-lib'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface Props {}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace StoragePage {
  export function setup(params: { props: Props; ctx: SetupContext; storageType: StorageType; nodeFilter?: (node: StorageNode) => boolean }) {
    const { props, ctx, storageType, nodeFilter } = params

    //----------------------------------------------------------------------
    //
    //  Variables
    //
    //----------------------------------------------------------------------

    const el = ref<HTMLElement>()
    const treeViewContainer = ref<HTMLElement>()
    const treeViewRef = ref<TreeView<StorageTreeNode, StorageTreeNodeData>>()
    const pathDirBreadcrumb = ref<StorageDirPathBreadcrumb>()
    const dirView = ref<StorageDirView>()

    const pageLogic = StoragePageLogic.newInstance({ storageType, treeViewRef, nodeFilter })

    /**
     * ディレクトリ詳細ビューの表示フラグです。
     */
    const visibleDirDetailView = ref(false)

    /**
     * ファイル詳細ビューの表示フラグです。
     */
    const visibleFileDetailView = ref(false)

    /**
     * 左右のペインを隔てるスプリッターの左ペインの幅です。
     */
    const splitterModel = ref(300)

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
    //  Lifecycle hooks
    //
    //----------------------------------------------------------------------

    onMounted(async () => {
      await pullInitialNodes()
    })

    onUnmounted(() => {
      StoragePageLogic.deleteInstance(storageType)
    })

    //----------------------------------------------------------------------
    //
    //  Internal methods
    //
    //----------------------------------------------------------------------

    /**
     * 初回に読み込むべきストレージノードの読み込みを行います。
     */
    async function pullInitialNodes(): Promise<void> {
      if (!pageLogic.isPulledInitialNodes) return

      dirView.value!.loading = true

      // 現在の選択ノードを取得
      // ※URLから取得したディレクトリまたは現在の選択ノード
      const dirPath = pageLogic.route.getNodePath() || pageLogic.selectedNodePath.value
      // 初期ストレージノードの読み込み
      await pageLogic.pullInitialNodes(dirPath)
      // ページの選択ノードを設定
      changeDirOnPage(dirPath)
      // // 選択ノードの祖先ノードを展開
      // openParentNode(dirPath, false)
      // 選択ノードの位置までスクロールする
      scrollToSelectedNode(dirPath, false)

      dirView.value!.loading = false
    }

    /**
     * 指定されたノードがディレクトリの場合はそのディレクトリへ移動し、
     * 指定されたノードがディレクトリ以外の場合は親であるディレクトリへ移動します。
     * @param nodePath
     */
    function changeDir(nodePath: string): void {
      const selectedNodePath = pageLogic.getNode(nodePath)?.path ?? pageLogic.getTreeRootNode().path

      // ノード詳細ビューを非表示にする
      visibleDirDetailView.value = false
      visibleFileDetailView.value = false
      // 選択ノードを設定
      pageLogic.setSelectedNode(selectedNodePath, true, true)
      // パンくずに選択ノードを設定
      pathDirBreadcrumb.value!.setSelectedNode(selectedNodePath)
      // ディレクトリビューに選択ノードを設定
      dirView.value!.setSelectedNode(selectedNodePath)
    }

    /**
     * 指定ディレクトリのパスをURLへ付与してディレクトリを移動します。
     * @param dirPath ディレクトリパス
     */
    function changeDirOnPage(dirPath: string): void {
      dirPath = removeBothEndsSlash(dirPath)

      const urlDirPath = removeBothEndsSlash(pageLogic.route.getNodePath())
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
        pageLogic.route.move(dirPath)
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
      pageLogic.setSelectedNode(dirPath, true, false)
    }

    /**
     * 指定されたノードの祖先ノードを展開します。
     * @param nodePath
     * @param animate
     */
    function openParentNode(nodePath: string, animate: boolean): void {
      const treeNode = pageLogic.getNode(nodePath)
      if (!treeNode?.parent) return

      treeNode.parent.open(animate)
      openParentNode(treeNode.parent.path, animate)
    }

    /**
     * 指定ノードをツリービューの上下中央に位置するようスクロールします。
     * @param nodePath
     * @param animate
     */
    function scrollToSelectedNode(nodePath: string, animate: boolean): void {
      const treeNode = pageLogic.getNode(nodePath)
      if (!treeNode) return

      // 本ページのグローバルな上位置を取得
      const globalTop = el.value!.getBoundingClientRect().top
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

    //----------------------------------------------------------------------
    //
    //  Event listeners
    //
    //----------------------------------------------------------------------

    watch(
      () => pageLogic.isSignedIn.value,
      async isSignedIn => {
        if (isSignedIn) await pullInitialNodes()
      }
    )

    watch(
      () => ctx.root.$route,
      (newValue, oldValue) => {
        // URLから選択ノードパスを取得(取得できなかった場合はルートノード)
        const dirPath = pageLogic.route.getNodePath()
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
     * ポップアップメニューでアクションが選択された際のリスナです。
     * @param e
     */
    async function popupMenuOnNodeAction(e: StorageNodeActionEvent) {
      switch (e.type) {
        case 'reload': {
          const dirPath = e.nodePaths[0]
          await pageLogic.reloadDir(dirPath)
          // ページの選択ノードを設定
          // ※ディレクトリビューの更新
          changeDir(pageLogic.selectedNodePath.value)
          break
        }
        case 'createDir': {
          const dirPath = e.nodePaths[0]
          // const pathData = await this.dirCreateDialog.open({ parentPath: dirPath })
          // if (pathData) {
          //   await this.createDir(path.join(pathData.dir, pathData.name))
          // }
          break
        }
        case 'uploadDir': {
          // const dirPath = e.nodePaths[0]
          // this.uploadProgressFloat.openDirSelectDialog(dirPath)
          break
        }
        case 'uploadFiles': {
          // const dirPath = e.nodePaths[0]
          // this.uploadProgressFloat.openFilesSelectDialog(dirPath)
          break
        }
        case 'move': {
          // const toDir = await this.nodeMoveDialog.open(e.nodePaths)
          // if (typeof toDir === 'string') {
          //   await this.moveNodes(e.nodePaths, toDir)
          // }
          break
        }
        case 'rename': {
          // const nodePath = e.nodePaths[0]
          // const newName = await this.nodeRenameDialog.open(nodePath)
          // if (newName) {
          //   await this.renameNode(nodePath, newName)
          // }
          break
        }
        case 'share': {
          // const input = await this.nodeShareDialog.open(e.nodePaths)
          // if (input) {
          //   await this.setShareSettings(e.nodePaths, input)
          // }
          break
        }
        case 'delete': {
          // const confirmed = await this.nodeRemoveDialog.open(e.nodePaths)
          // if (confirmed) {
          //   await this.removeNodes(e.nodePaths)
          // }
          break
        }
        case 'createArticleTypeDir': {
          // const articleNodeType = e.articleNodeType!
          // const dirPath = e.nodePaths[0]
          // const pathData = await this.dirCreateDialog.open({ parentPath: dirPath, articleNodeType })
          // if (pathData) {
          //   await this.createArticleTypeDir({
          //     dir: pathData.dir,
          //     articleNodeName: pathData.name,
          //     articleNodeType,
          //   })
          // }
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
      await pageLogic.pullChildren(e.node.path)
      e.done()

      dirView.value!.loading = false
    }

    /**
     * ツリービューでノードが選択された際のリスナです。
     * @param e
     */
    async function treeViewOnSelect(e: TreeViewEvent<StorageTreeNode>) {
      // 初期読み込みが行われる前にルートノードのselectイベントが発生すると、
      // URLでノードパスが指定されていてもルートノードが選択ノードになってしまい、
      // URLで指定されたノードパスがクリアされてしまう。
      // このため初期読み込みされるまではselectイベントに反応しないようにしている。
      if (!pageLogic.isPulledInitialNodes.value) return

      const selectedNode = e.node

      // 選択ノードまでスクロールするフラグが立っている場合
      if (needScrollToSelectedNode.value) {
        // 選択されたノードの祖先を展開（アニメーションなし）
        openParentNode(selectedNode.path, false)
        // 選択ノードの位置までスクロールする
        scrollToSelectedNode(selectedNode.path, true)

        needScrollToSelectedNode.value = false
      }

      // 選択ノードのパスをURLに付与
      changeDirOnPage(selectedNode.path)
    }

    //--------------------------------------------------
    //  ディレクトリビュー
    //--------------------------------------------------

    /**
     * ディレクトリビューでノードが選択された際のリスナです。
     * @param nodePath
     */
    function dirViewOnSelect(nodePath: string) {
      // showNodeDetail(nodePath)
    }

    /**
     * ディレクトリビューでノードがディープ選択された際のリスナです。
     * @param dirPath
     */
    function dirViewOnDeepSelect(dirPath: string) {
      dirOnChange(dirPath)
    }

    //----------------------------------------------------------------------
    //
    //  Result
    //
    //----------------------------------------------------------------------

    return {
      storageType,
      el,
      treeViewContainer,
      treeViewRef,
      pathDirBreadcrumb,
      dirView,
      visibleDirDetailView,
      visibleFileDetailView,
      splitterModel,
      pathDirBreadcrumbOnSelect,
      popupMenuOnNodeAction,
      treeViewOnSelect,
      treeViewOnLazyLoad,
      dirViewOnSelect,
      dirViewOnDeepSelect,
    }
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { StoragePage }
