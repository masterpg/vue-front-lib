<style lang="sass" scoped>
@import 'src/example/styles/app.variables'

.storage-page-main
  height: 100%

.splitter
  height: 100%

.tree-view-container
  width: 100%
  height: 100%
  overflow: auto

.tree-view
  //--comp-tree-view-font-size: 26px
  //--comp-tree-node-indent: 20px

.content-container
  height: 100%

.view-container
  overflow: hidden

.dir-view
  overflow: hidden

.node-detail-view
  width: 320px
</style>

<template>
  <div class="storage-page-main">
    <q-splitter v-model="splitterModel" unit="px" class="splitter">
      <template v-slot:before>
        <div ref="treeViewContainer" class="tree-view-container">
          <storage-tree-view ref="treeView" class="tree-view" :storage-type="storageType" :node-filter="treeNodeFilter" />
        </div>
      </template>
      <template v-slot:after>
        <div class="content-container layout vertical">
          <storage-dir-path-breadcrumb ref="pathDirBreadcrumb" :storage-type="storageType" />
          <div class="view-container layout horizontal flex-1">
            <storage-dir-view ref="dirView" class="dir-view flex-1" :storage-type="storageType" />
            <storage-dir-detail-view
              v-show="visibleDirDetailView"
              ref="dirDetailView"
              class="node-detail-view"
              :storage-type="storageType"
              @close="nodeDetailViewOnClose"
            />
            <storage-file-detail-view
              v-show="visibleFileDetailView"
              ref="fileDetailView"
              class="node-detail-view"
              :storage-type="storageType"
              @close="nodeDetailViewOnClose"
            />
          </div>
        </div>
      </template>
    </q-splitter>

    <storage-dir-create-dialog ref="dirCreateDialog" :storage-type="storageType" />
    <storage-node-move-dialog ref="nodeMoveDialog" :storage-type="storageType" />
    <storage-node-rename-dialog ref="nodeRenameDialog" :storage-type="storageType" />
    <storage-node-remove-dialog ref="nodeRemoveDialog" :storage-type="storageType" />
    <storage-node-share-dialog ref="nodeShareDialog" :storage-type="storageType" />

    <comp-storage-upload-progress-float
      ref="uploadProgressFloat"
      class="fixed-bottom-right"
      :storage-type="storageType"
      @upload-ends="uploadProgressFloatOnUploadEnds($event)"
    />
  </div>
</template>

<script lang="ts">
import {
  AuthStatus,
  BaseComponent,
  CompStorageUploadProgressFloat,
  CompTreeViewEvent,
  CompTreeViewLazyLoadEvent,
  Resizable,
  StorageLogic,
  StorageNode,
  StorageNodeShareSettings,
  StorageNodeType,
  UploadEndedEvent,
} from '@/lib'
import { Component, Watch } from 'vue-property-decorator'
import { RawLocation, Route } from 'vue-router'
import { StorageNodeContextMenuSelectedEvent, StorageNodeContextMenuType, StoragePageStore, StorageTreeNode, StorageType } from './base'
import { removeBothEndsSlash, sleep } from 'web-base-lib'
import StorageDirCreateDialog from './storage-dir-create-dialog.vue'
import StorageDirDetailView from './storage-dir-detail-view.vue'
import StorageDirPathBreadcrumb from './storage-dir-path-breadcrumb.vue'
import StorageDirView from './storage-dir-view.vue'
import StorageFileDetailView from './storage-file-detail-view.vue'
import StorageNodeMoveDialog from './storage-node-move-dialog.vue'
import StorageNodeRemoveDialog from './storage-node-remove-dialog.vue'
import StorageNodeRenameDialog from './storage-node-rename-dialog.vue'
import StorageNodeShareDialog from './storage-node-share-dialog.vue'
import { StorageRoute } from '@/example/router'
import StorageTreeView from './storage-tree-view.vue'
import Vue from 'vue'
import anime from 'animejs'
import { mixins } from 'vue-class-component'

@Component({
  components: {
    CompStorageUploadProgressFloat,
    StorageDirCreateDialog,
    StorageDirDetailView,
    StorageDirPathBreadcrumb,
    StorageDirView,
    StorageFileDetailView,
    StorageNodeMoveDialog,
    StorageNodeRemoveDialog,
    StorageNodeRenameDialog,
    StorageNodeShareDialog,
    StorageTreeView,
  },
})
export default class BaseStoragePage extends mixins(BaseComponent, Resizable) {
  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  created() {
    StoragePageStore.register(this)
  }

  async mounted() {
    // 必要な要素の設定
    this.setupElements()

    // 初期ストレージノードの読み込みが既に行われている場合
    // ※本ページから別ページに遷移し、その後本ページに戻ってきた場合がこの状況に当たる
    if (this.treeView.isInitialPull) {
      const dirPath = this.treeView.selectedNode!.path
      // 選択ノードのパスをURLに付与し、ページを更新
      this.updatePage(dirPath)
      // 選択ノードの祖先ノードを展開
      this.openParentNode(dirPath, false)
      // 選択ノードの位置までスクロールする
      this.scrollToSelectedNode(dirPath, false)
    }
    // 初期ストレージノードの読み込みが行われていなく、かつユーザーがサインインしてる場合
    else if (this.$logic.auth.isSignedIn) {
      // 初期ストレージノードの読み込み
      await this.pullInitialNodes()
    }
  }

  async beforeRouteUpdate(to: Route, from: Route, next: (to?: RawLocation | false | ((vm: Vue) => any) | void) => void) {
    next()

    // URLから選択ノードパスを取得(取得できなかった場合はルートノード)
    const dirPath = this.storageRoute.getNodePath() || this.treeView.rootNode.path
    // ページの選択ノードを設定
    this.changeDir(dirPath)
  }

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  get storageType(): StorageType {
    throw new Error('Not implemented.')
  }

  get storageLogic(): StorageLogic {
    throw new Error('Not implemented.')
  }

  get storageRoute(): StorageRoute {
    throw new Error('Not implemented.')
  }

  treeView: StorageTreeView = null as any

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  /**
   * ディレクトリ詳細ビューの表示フラグです。
   */
  protected visibleDirDetailView = false

  /**
   * ファイル詳細ビューの表示フラグです。
   */
  protected visibleFileDetailView = false

  /**
   * 左右のペインを隔てるスプリッターの左ペインの幅です。
   */
  protected splitterModel = 300

  /**
   * 選択ノードまでスクロールする必要があることを示すフラグです。
   */
  protected needScrollToSelectedNode = false

  /**
   * 選択ノードまでのスクロールするアニメーション(実行中のもの)です。
   * アニメーションが完了するとnullが設定されます。
   */
  protected scrollAnime: anime.AnimeInstance | null = null

  protected get selectedNode(): StorageTreeNode | null {
    if (!this.treeView) return null
    return this.treeView.selectedNode
  }

  protected treeNodeFilter = (node: StorageNode) => {
    return node.nodeType === StorageNodeType.Dir
  }

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

  protected treeViewContainer: HTMLElement = null as any

  protected pathDirBreadcrumb: StorageDirPathBreadcrumb = null as any

  protected dirView: StorageDirView = null as any

  protected dirDetailView: StorageDirDetailView = null as any

  protected fileDetailView: StorageFileDetailView = null as any

  protected dirCreateDialog: StorageDirCreateDialog = null as any

  protected nodeMoveDialog: StorageNodeMoveDialog = null as any

  protected nodeRenameDialog: StorageNodeRenameDialog = null as any

  protected nodeRemoveDialog: StorageNodeRemoveDialog = null as any

  protected nodeShareDialog: StorageNodeShareDialog = null as any

  protected uploadProgressFloat: CompStorageUploadProgressFloat = null as any

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  /**
   * 本コンポーネントで必要となる要素の設定を行います。
   */
  protected setupElements(): void {
    if (!this.$refs.treeView) {
      throw new Error(`The element with the reference name ref="treeView" does not exist.`)
    }
    this.treeView = this.$refs.treeView as StorageTreeView

    if (!this.$refs.treeViewContainer) {
      throw new Error('The element with the reference name ref="treeViewContainer" does not exist.')
    }
    this.treeViewContainer = this.$refs.treeViewContainer as HTMLElement

    if (!this.$refs.pathDirBreadcrumb) {
      throw new Error('The element with the reference name ref="pathDirBreadcrumb" does not exist.')
    }
    this.pathDirBreadcrumb = this.$refs.pathDirBreadcrumb as StorageDirPathBreadcrumb

    if (!this.$refs.dirView) {
      throw new Error('The element with the reference name ref="dirView" does not exist.')
    }
    this.dirView = this.$refs.dirView as StorageDirView

    if (!this.$refs.dirDetailView) {
      throw new Error('The element with the reference name ref="dirDetailView" does not exist.')
    }
    this.dirDetailView = this.$refs.dirDetailView as StorageDirDetailView

    if (!this.$refs.fileDetailView) {
      throw new Error('The element with the reference name ref="fileDetailView" does not exist.')
    }
    this.fileDetailView = this.$refs.fileDetailView as StorageFileDetailView

    if (!this.$refs.dirCreateDialog) {
      throw new Error('The element with the reference name ref="dirCreateDialog" does not exist.')
    }
    this.dirCreateDialog = this.$refs.dirCreateDialog as StorageDirCreateDialog

    if (!this.$refs.nodeMoveDialog) {
      throw new Error('The element with the reference name ref="nodeMoveDialog" does not exist.')
    }
    this.nodeMoveDialog = this.$refs.nodeMoveDialog as StorageNodeMoveDialog

    if (!this.$refs.nodeRenameDialog) {
      throw new Error('The element with the reference name ref="nodeRenameDialog" does not exist.')
    }
    this.nodeRenameDialog = this.$refs.nodeRenameDialog as StorageNodeRenameDialog

    if (!this.$refs.nodeRemoveDialog) {
      throw new Error('The element with the reference name ref="nodeRemoveDialog" does not exist.')
    }
    this.nodeRemoveDialog = this.$refs.nodeRemoveDialog as StorageNodeRemoveDialog

    if (!this.$refs.nodeShareDialog) {
      throw new Error('The element with the reference name ref="nodeShareDialog" does not exist.')
    }
    this.nodeShareDialog = this.$refs.nodeShareDialog as StorageNodeShareDialog

    if (!this.$refs.uploadProgressFloat) {
      throw new Error('The element with the reference name ref="uploadProgressFloat" does not exist.')
    }
    this.uploadProgressFloat = this.$refs.uploadProgressFloat as CompStorageUploadProgressFloat

    this.treeView.$on('select', e => this.treeViewOnSelect(e))
    this.treeView.$on('lazy-load', e => this.treeViewOnLazyLoad(e))
    this.treeView.$on('context-menu-select', e => this.onContextMenuSelect(e))
    this.dirView.$on('select', e => this.dirViewOnSelect(e))
    this.dirView.$on('deep-select', e => this.dirViewOnDeepSelect(e))
    this.dirView.$on('context-menu-select', e => this.onContextMenuSelect(e))
    this.pathDirBreadcrumb.$on('select', e => this.pathDirBreadcrumbOnSelectChange(e))
  }

  /**
   * 初回に読み込むべきストレージノードの読み込みを行います。
   */
  protected async pullInitialNodes(): Promise<void> {
    this.dirView.loading = true

    // 現在の選択ノードを取得
    // ※URLから取得したディレクトリまたは現在の選択ノード
    const urlDirPath = this.storageRoute.getNodePath()
    const dirPath = urlDirPath || this.treeView.selectedNode.path
    // 初期ストレージノードの読み込み
    await this.treeView.pullInitialNodes(dirPath)
    // ページの選択ノードを設定
    this.changeDir(dirPath)
    // 選択ノードの祖先ノードを展開
    this.openParentNode(dirPath, false)
    // 選択ノードの位置までスクロールする
    this.scrollToSelectedNode(dirPath, false)

    this.dirView.loading = false
  }

  /**
   * ページをロジックストアに格納されているストレージノードで最新化します。
   * @param dirPath 選択ディレクトリを指定
   */
  protected updatePage(dirPath: string): void {
    // ロジックストアに格納されているストレージノードをツリービューへマージ
    this.treeView.mergeAllNodes(this.storageLogic.nodes)
    // 指定ディレクトリへURL遷移
    this.changeDirOnPage(dirPath)
  }

  /**
   * 指定されたノードがディレクトリの場合はそのディレクトリへ移動し、
   * 指定されたノードがディレクトリ以外の場合は親であるディレクトリへ移動します。
   * @param nodePath
   */
  protected changeDir(nodePath: string): void {
    const selectedNode = this.treeView.getNode(nodePath) || this.treeView.rootNode

    // ノード詳細ビューを非表示にする
    this.visibleDirDetailView = false
    this.visibleFileDetailView = false
    // 選択ノードを設定
    this.treeView.setSelectedNode(selectedNode.path, true, true)
    // パスのパンくずに選択ノードを設定
    this.pathDirBreadcrumb.setSelectedNode(selectedNode.path)
    // ディレクトリビューに選択ノードを設定
    this.dirView.setSelectedNode(selectedNode.path)
  }

  /**
   * 指定ディレクトリのパスをURLへ付与してディレクトリを移動します。
   * @param dirPath ディレクトリパス
   */
  protected changeDirOnPage(dirPath: string): void {
    dirPath = removeBothEndsSlash(dirPath)

    const urlDirPath = removeBothEndsSlash(this.storageRoute.getNodePath())
    // 移動先が変わらない場合
    // ※URLから取得したディレクトリと移動先のディレクトリが同じ場合
    if (urlDirPath === dirPath) {
      // 指定されたディレクトリをページの選択ノードとして設定
      this.changeDir(dirPath)
    }
    // 移動先が変わる場合
    else {
      // 選択ディレクトリのパスをURLに付与
      // ※ルーターによって本ページ内のbeforeRouteUpdate()が実行される
      this.storageRoute.move(dirPath)
    }
  }

  /**
   * パスのパンくずブロック、またはディレクトリビューでディレクトリが選択された際の処理を行います。
   * @param dirPath
   */
  protected dirOnChange(dirPath: string): void {
    dirPath = removeBothEndsSlash(dirPath)

    this.needScrollToSelectedNode = true
    // ツリービューの選択ノードに指定されたディレクトリを設定
    // ※ツリービューのselectイベントが発火され、ディレクトリが切り替わる
    this.treeView.setSelectedNode(dirPath, true, false)
  }

  /**
   * 指定されたノードをページの選択ノードとして設定します。
   * @param nodePath
   */
  protected showNodeDetail(nodePath: string): void {
    this.visibleDirDetailView = false
    this.visibleFileDetailView = false
    const node = this.storageLogic.sgetNode({ path: nodePath })

    switch (node.nodeType) {
      case StorageNodeType.Dir: {
        // ディレクトリ詳細ビューを表示
        this.dirDetailView.setNodePath(node.path)
        this.visibleDirDetailView = true
        break
      }
      case StorageNodeType.File: {
        // ファイル詳細ビューを表示
        this.fileDetailView.setNodePath(node.path)
        this.visibleFileDetailView = true
        break
      }
    }
  }

  /**
   * ディレクトリの作成を行います。
   * @param dirPath 作成するディレクトリのパス
   */
  protected async createDir(dirPath: string): Promise<void> {
    this.$q.loading.show()

    // ディレクトリの作成を実行
    await this.treeView.createStorageDir(dirPath)
    const treeNode = this.treeView.getNode(dirPath)!

    // 現在選択されているノードへURL遷移
    this.changeDirOnPage(this.treeView.selectedNode.path)

    this.$q.loading.hide()
  }

  /**
   * ノードの削除を行います。
   * @param nodePaths 削除するノード
   */
  protected async removeNodes(nodePaths: string[]): Promise<void> {
    this.$q.loading.show()

    // 削除後の遷移先ノードを取得
    // ・選択ノードが削除された場合、親ノードへ遷移
    // ・それ以外は現在の選択ノードへ遷移
    let toNodePath = this.treeView.selectedNode.path
    // 選択ノードが削除されるのかを取得
    const selectedRemovingNodePath = nodePaths.find(nodePath => {
      if (nodePath === this.treeView.selectedNode.path) return nodePath
    })
    // 選択ノードが削除される場合、親ノードへ遷移するよう準備
    if (selectedRemovingNodePath) {
      const removingCertainNode = this.storageLogic.sgetNode({ path: nodePaths[0] })
      toNodePath = removingCertainNode.dir
    }

    // ノードの移動を実行
    await this.treeView.removeStorageNodes(nodePaths)

    // 上記で取得したノードへURL遷移
    this.changeDirOnPage(toNodePath)

    this.$q.loading.hide()
  }

  /**
   * ノードの移動を行います。
   * @param nodePaths 移動するノード
   * @param toDirPath 移動先のディレクトリパス
   */
  protected async moveNodes(nodePaths: string[], toDirPath: string): Promise<void> {
    this.$q.loading.show()

    // ノードの移動を実行
    await this.treeView.moveStorageNodes(nodePaths, toDirPath)

    // 現在選択されているノードへURL遷移
    this.changeDirOnPage(this.treeView.selectedNode.path)

    this.$q.loading.hide()
  }

  /**
   * ノードのリネームを行います。
   * @param nodePath リネームするノード
   * @param newName ノードの新しい名前
   */
  protected async renameNode(nodePath: string, newName: string): Promise<void> {
    this.$q.loading.show()

    // ノードのリネームを実行
    await this.treeView.renameStorageNode(nodePath, newName)

    // 現在選択されているノードへURL遷移
    this.changeDirOnPage(this.treeView.selectedNode.path)

    this.$q.loading.hide()
  }

  /**
   * ノードの共有設定を行います。
   * @param nodePaths 共有設定するノード
   * @param settings 共有設定の内容
   */
  protected async setShareSettings(nodePaths: string[], settings: StorageNodeShareSettings): Promise<void> {
    this.$q.loading.show()

    // ノードの共有設定を実行
    await this.treeView.setShareSettings(nodePaths, settings)

    // 現在選択されているノードへURL遷移
    this.changeDirOnPage(this.treeView.selectedNode.path)

    this.$q.loading.hide()
  }

  /**
   * 指定されたノードの祖先ノードを展開します。
   * @param nodePath
   * @param animated
   */
  protected openParentNode(nodePath: string, animated: boolean): void {
    const treeNode = this.treeView.getNode(nodePath)
    if (!treeNode || !treeNode.parent) return

    treeNode.parent.open(animated)
    if (treeNode.parent) {
      this.openParentNode(treeNode.parent.path, animated)
    }
  }

  /**
   * 指定ノードをツリービューの上下中央に位置するようスクロールします。
   * @param nodePath
   * @param animated
   */
  protected scrollToSelectedNode(nodePath: string, animated: boolean): void {
    const treeNode = this.treeView.getNode(nodePath)
    if (!treeNode) return

    // 本ページのグローバルな上位置を取得
    const globalTop = this.$el.getBoundingClientRect().top
    // ツリービューの現スクロール位置を取得
    const scrollTop = this.treeViewContainer.scrollTop
    // 指定ノードの上位置を取得
    const nodeTop = treeNode.$el.getBoundingClientRect().top - globalTop
    // スクロール値の最大を取得
    const maxScrollTop = this.treeView.$el.scrollHeight - this.treeViewContainer.clientHeight

    // 指定ノードをツリービューの上下中央に位置するようスクロール(できるだけ)
    let newScrollTop = scrollTop + nodeTop - this.treeViewContainer.clientHeight / 2
    if (newScrollTop < 0) {
      newScrollTop = 0
    } else if (maxScrollTop < newScrollTop) {
      newScrollTop = maxScrollTop
    }

    this.scrollAnime && this.scrollAnime.pause()
    this.scrollAnime = anime({
      targets: this.treeViewContainer,
      scrollTop: newScrollTop,
      duration: animated ? 750 : 0,
      easing: 'easeOutQuart',
      complete: () => {
        this.scrollAnime = null
      },
    })

    // console.log(JSON.stringify({ scrollTop, nodeTop, 'treeViewContainer.clientHeight / 2': this.treeViewContainer.clientHeight / 2, newScrollTop }, null, 2))
  }

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------

  @Watch('$logic.auth.isSignedIn')
  protected async isSignedInOnChange(newValue: AuthStatus, oldValue: AuthStatus) {
    if (this.$logic.auth.isSignedIn) {
      await this.pullInitialNodes()
    } else {
      this.pathDirBreadcrumb.setSelectedNode(null)
      this.dirView.setSelectedNode(null)
      this.visibleFileDetailView = false
    }
  }

  /**
   * パスのパンくずブロックがクリックされた際のリスナです。
   * @param nodePath
   */
  protected pathDirBreadcrumbOnSelectChange(nodePath: string) {
    this.dirOnChange(nodePath)
  }

  /**
   * アップロード進捗フロートでアップロードが終了した際のハンドラです。
   * @param e
   */
  protected async uploadProgressFloatOnUploadEnds(e: UploadEndedEvent) {
    // アップロードが行われた後のツリーの更新処理
    await this.treeView.onUploaded(e)
    // アップロード先のディレクトリへURL遷移
    this.changeDirOnPage(e.uploadDirPath)

    // アップロード先のディレクトリとその祖先を展開
    const uploadDirNode = this.treeView.getNode(e.uploadDirPath)!
    uploadDirNode.open()
    this.openParentNode(uploadDirNode.path, true)
  }

  /**
   * コンテキストメニューでメニューアイテムが選択された際のリスナです。
   * @param e
   */
  protected async onContextMenuSelect(e: StorageNodeContextMenuSelectedEvent) {
    switch (e.type) {
      case StorageNodeContextMenuType.reload.type: {
        const dirPath = e.nodePaths[0]
        await this.treeView.reloadDir(dirPath)
        // ページの選択ノードを設定
        // ※ディレクトリビューの更新
        this.changeDir(this.treeView.selectedNode.path)
        break
      }
      case StorageNodeContextMenuType.createDir.type: {
        const dirPath = e.nodePaths[0]
        const creatingDirPath = await this.dirCreateDialog.open(dirPath)
        if (creatingDirPath) {
          await this.createDir(creatingDirPath)
        }
        break
      }
      case StorageNodeContextMenuType.uploadFiles.type: {
        const dirPath = e.nodePaths[0]
        this.uploadProgressFloat.openFilesSelectDialog(dirPath)
        break
      }
      case StorageNodeContextMenuType.uploadDir.type: {
        const dirPath = e.nodePaths[0]
        this.uploadProgressFloat.openDirSelectDialog(dirPath)
        break
      }
      case StorageNodeContextMenuType.move.type: {
        const toDir = await this.nodeMoveDialog.open(e.nodePaths)
        if (typeof toDir === 'string') {
          await this.moveNodes(e.nodePaths, toDir)
        }
        break
      }
      case StorageNodeContextMenuType.rename.type: {
        const nodePath = e.nodePaths[0]
        const newName = await this.nodeRenameDialog.open(nodePath)
        if (newName) {
          await this.renameNode(nodePath, newName)
        }
        break
      }
      case StorageNodeContextMenuType.share.type: {
        const settings = await this.nodeShareDialog.open(e.nodePaths)
        if (settings) {
          await this.setShareSettings(e.nodePaths, settings)
        }
        break
      }
      case StorageNodeContextMenuType.deletion.type: {
        const confirmed = await this.nodeRemoveDialog.open(e.nodePaths)
        if (confirmed) {
          await this.removeNodes(e.nodePaths)
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
  protected async treeViewOnLazyLoad(e: CompTreeViewLazyLoadEvent<StorageTreeNode>) {
    this.dirView.loading = true

    // 選択または展開されようとしているディレクトリ直下のノードをサーバーから取得
    // ※done()が実行された後にselectイベントが発火し、ページが更新される
    await this.treeView.pullChildren(e.node.path)
    e.done()

    this.dirView.loading = false
  }

  /**
   * ツリービューでノードが選択された際のリスナです。
   * @param e
   */
  protected async treeViewOnSelect(e: CompTreeViewEvent<StorageTreeNode>) {
    const needOpenParentNode = (node: StorageTreeNode) => {
      if (!node.parent) return false
      if (!node.parent!.opened) return true
      return needOpenParentNode(node.parent!)
    }

    const selectedNode = e.node
    const parentNode = e.node.parent

    // 選択ノードまでスクロールするフラグが立っている場合
    if (this.needScrollToSelectedNode) {
      // 選択ノードを表示すために、親（祖先）の展開が必要な場合
      if (needOpenParentNode(selectedNode)) {
        // 親ノードが持つ子ノードが規定数以下の場合
        if (parentNode && parentNode.children.length <= 25) {
          // 選択されたノードの祖先を展開（アニメーションあり）
          this.openParentNode(selectedNode.path, true)
          // 展開アニメーションが終わりまで待機
          await sleep(500)
        }
        // 親ノードが持つ子ノードが規定数より多い場合
        else {
          // 選択されたノードの祖先を展開（アニメーションなし）
          this.openParentNode(selectedNode.path, false)
        }
      }
      // 選択ノードの位置までスクロールする
      this.scrollToSelectedNode(selectedNode.path, true)

      this.needScrollToSelectedNode = false
    }

    // // 選択ノードまでスクロールするフラグが立っている場合
    // if (this.needScrollToSelectedNode) {
    //   // 選択されたノードの祖先を展開（アニメーションなし）
    //   this.openParentNode(selectedNode.path, false)
    //   // 選択ノードの位置までスクロールする
    //   this.scrollToSelectedNode(selectedNode.path, true)
    //
    //   this.needScrollToSelectedNode = false
    // }

    // 選択ノードのパスをURLに付与
    this.changeDirOnPage(selectedNode.path)
  }

  //--------------------------------------------------
  //  ディレクトリビュー
  //--------------------------------------------------

  /**
   * ディレクトリビューでノードが選択された際のリスナです。
   * @param nodePath
   */
  protected dirViewOnSelect(nodePath: string) {
    this.showNodeDetail(nodePath)
  }

  /**
   * ディレクトリビューでノードがディープ選択された際のリスナです。
   * @param dirPath
   */
  protected dirViewOnDeepSelect(dirPath: string) {
    this.dirOnChange(dirPath)
  }

  //--------------------------------------------------
  //  ノード詳細ビュー
  //--------------------------------------------------

  protected nodeDetailViewOnClose() {
    this.visibleDirDetailView = false
    this.visibleFileDetailView = false
  }
}
</script>
