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
  @extend %layout-vertical
  height: 100%

.view-container
  @extend %layout-vertical
  @extend %layout-flex-1

.dir-view
  @extend %layout-flex-1

.image-node-view
  @extend %layout-flex-1
</style>

<template>
  <div class="storage-page-main">
    <q-splitter v-model="splitterModel" unit="px" class="splitter">
      <template v-slot:before>
        <div ref="treeViewContainer" class="tree-view-container">
          <comp-tree-view ref="treeView" class="tree-view" />
        </div>
      </template>
      <template v-slot:after>
        <div class="content-container">
          <storage-path-breadcrumb ref="pathBreadcrumb" :storage-type="storageType" />
          <div class="view-container">
            <storage-dir-view ref="dirView" class="dir-view" :storage-type="storageType" />
          </div>
        </div>
      </template>
    </q-splitter>

    <storage-dir-create-dialog ref="dirCreateDialog" />
    <storage-node-move-dialog ref="nodeMoveDialog" :storage-type="storageType" />
    <storage-node-rename-dialog ref="nodeRenameDialog" />
    <storage-node-remove-dialog ref="nodeRemoveDialog" />
    <storage-node-share-dialog ref="nodeShareDialog" />

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
  CompTreeView,
  CompTreeViewLazyLoadEvent,
  NoCache,
  Resizable,
  StorageNodeShareSettings,
  StorageNodeType,
  UploadEndedEvent,
} from '@/lib'
import { Component, Watch } from 'vue-property-decorator'
import { RawLocation, Route } from 'vue-router'
import StorageDirCreateDialog from './storage-dir-create-dialog.vue'
import StorageDirView from './storage-dir-view.vue'
import StorageNodeMoveDialog from './storage-node-move-dialog.vue'
import StorageNodeRemoveDialog from './storage-node-remove-dialog.vue'
import StorageNodeRenameDialog from './storage-node-rename-dialog.vue'
import StorageNodeShareDialog from './storage-node-share-dialog.vue'
import StoragePathBreadcrumb from './storage-path-breadcrumb.vue'
import StorageTreeNode from './storage-tree-node.vue'
import { StorageTypeMixin } from './base'
import Vue from 'vue'
import anime from 'animejs'
import debounce from 'lodash/debounce'
import { mixins } from 'vue-class-component'
import { removeBothEndsSlash } from 'web-base-lib'

//========================================================================
//
//  BaseStoragePage
//
//========================================================================

@Component
export class BaseStoragePage extends mixins(BaseComponent, Resizable, StorageTypeMixin) {
  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  created() {
    this.movePageToNode = debounce(this.movePageToNodeFunc, 100)
  }

  destroyed() {
    this.treeStore.teardown()
  }

  async mounted() {
    this.treeView.$on('selected', e => this.treeViewOnSelected(e))
    this.treeView.$on('lazy-load', e => this.treeViewOnLazyLoad(e))
    this.treeView.$on('create-dir-selected', e => this.onCreateDirSelected(e.value))
    this.treeView.$on('files-upload-selected', e => this.treeViewOnFilesUploadSelected(e.value))
    this.treeView.$on('dir-upload-selected', e => this.onDirUploadSelected(e.value))
    this.treeView.$on('move-selected', e => this.onMoveSelected([e.value]))
    this.treeView.$on('rename-selected', e => this.onRenameSelected(e.value))
    this.treeView.$on('delete-selected', e => this.onDeleteSelected([e.value]))
    this.treeView.$on('share-selected', e => this.onShareSelected([e.value]))
    this.treeView.$on('reload-selected', e => this.onReloadSelected(e.value))

    this.pathBreadcrumb.$on('selected', e => this.pathBreadcrumbOnSelected(e))

    this.dirView.$on('selected', e => this.dirViewOnSelected(e))
    this.dirView.$on('create-dir-selected', e => this.onCreateDirSelected(e))
    this.dirView.$on('files-upload-selected', e => this.treeViewOnFilesUploadSelected(e))
    this.dirView.$on('dir-upload-selected', e => this.onDirUploadSelected(e))
    this.dirView.$on('move-selected', e => this.onMoveSelected(e))
    this.dirView.$on('rename-selected', e => this.onRenameSelected(e))
    this.dirView.$on('delete-selected', e => this.onDeleteSelected(e))
    this.dirView.$on('share-selected', e => this.onShareSelected(e))
    this.dirView.$on('reload-selected', e => this.onReloadSelected(e))

    // ツリーストアを初期化
    this.treeStore.setup(this.treeView)
    // ページの選択ノードを設定
    this.selectNodeOnPage(this.treeStore.selectedNode.value)

    // 初期ストレージノードの読み込みが既に行われている場合
    // ※本ページから別ページに遷移し、その後本ページに戻ってきた場合がこの状況に当たる
    if (this.treeStore.isInitialPulled) {
      // 選択ノードのパスをURLに付与し、ページを更新
      const dirPath = this.treeStore.selectedNode.value
      this.updatePage(dirPath)
      // 選択ノードの祖先ノードを展開
      this.openParentNode(dirPath, false)
      // 選択ノードの位置までスクロールする
      this.scrollToSelectedNode(dirPath, false)
    }
    // 初期ストレージノードの読み込みが行われていなく、かつユーザーがサインインしてる場合
    else if (this.$logic.auth.isSignedIn) {
      await this.pullInitialNodes()
    }
  }

  async beforeRouteUpdate(to: Route, from: Route, next: (to?: RawLocation | false | ((vm: Vue) => any) | void) => void) {
    next()

    // URLから選択ノードパスを取得(取得できなかった場合はルートノード)
    const dirPath = this.storageRoute.getNodePath() || this.treeStore.rootNode.value
    // ページの選択ノードを設定
    this.selectNodeOnPage(dirPath)
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  protected splitterModel = 300

  protected scrollAnime: anime.AnimeInstance | null = null

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

  protected get treeViewContainer(): HTMLElement {
    throw new Error('Not implemented.')
  }

  protected get treeView(): CompTreeView {
    throw new Error('Not implemented.')
  }

  protected get pathBreadcrumb(): StoragePathBreadcrumb {
    throw new Error('Not implemented.')
  }

  protected get dirView(): StorageDirView {
    throw new Error('Not implemented.')
  }

  protected get dirCreateDialog(): StorageDirCreateDialog {
    throw new Error('Not implemented.')
  }

  protected get nodeMoveDialog(): StorageNodeMoveDialog {
    throw new Error('Not implemented.')
  }

  protected get nodeRenameDialog(): StorageNodeRenameDialog {
    throw new Error('Not implemented.')
  }

  protected get nodeRemoveDialog(): StorageNodeRemoveDialog {
    throw new Error('Not implemented.')
  }

  protected get nodeShareDialog(): StorageNodeShareDialog {
    throw new Error('Not implemented.')
  }

  protected get uploadProgressFloat(): CompStorageUploadProgressFloat {
    throw new Error('Not implemented.')
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  /**
   * ページをロジックストアに格納されているストレージノードで最新化します。
   * @param dirPath 選択ディレクトリを指定
   */
  protected updatePage(dirPath: string): void {
    // ロジックストアに格納されているストレージノードをツリービューへマージ
    this.treeStore.mergeAllNodes(this.storageLogic.nodes)
    // 選択ノードへURL遷移
    this.movePageToNode(dirPath)
  }

  /**
   * 指定されたディレクトリをページの選択ノードとして設定します。
   * @param dirPath
   */
  protected selectNodeOnPage(dirPath: string): void {
    const selectingNode = this.treeStore.getNode(dirPath)
    if (selectingNode) {
      // 選択ノードを設定
      this.treeStore.selectedNode = selectingNode
      // ディレクトリビューのディレクトリパスを設定
      this.dirView.setDirPath(selectingNode.value)
    }
  }

  /**
   * 初回に読み込むべきストレージノードの読み込みを行います。
   */
  protected async pullInitialNodes(): Promise<void> {
    this.dirView.loading = true

    // 現在の選択ノードを取得
    // ※URLから取得した選択ノードまたは現在の選択ノード
    const urlDirPath = this.storageRoute.getNodePath()
    const dirPath = urlDirPath || this.treeStore.selectedNode.value
    // 初期ストレージノードの読み込み
    await this.treeStore.pullInitialNodes(dirPath)
    // ページの選択ノードを設定
    this.selectNodeOnPage(dirPath)
    // 選択ノードの位置までスクロールする
    this.scrollToSelectedNode(dirPath, false)

    this.dirView.loading = false
  }

  /**
   * ディレクトリの作成を行います。
   * @param dirPath 作成するディレクトリのパス
   */
  protected async createDir(dirPath: string): Promise<void> {
    this.$q.loading.show()

    // ディレクトリの作成を実行
    await this.treeStore.createStorageDir(dirPath)
    const treeNode = this.treeStore.getNode(dirPath)!

    // 作成したディレクトリの祖先を展開
    this.openParentNode(treeNode.value, true)

    // 作成したディレクトリの親ノードへURL遷移
    this.movePageToNode(treeNode.parent!.value)

    this.$q.loading.hide()
  }

  /**
   * ノードの削除を行います。
   * @param treeNodes 削除するツリーノード
   */
  protected async removeNodes(treeNodes: StorageTreeNode[]): Promise<void> {
    this.$q.loading.show()

    const parentDirPath = treeNodes[0].parent!.value

    // ノードの移動を実行
    await this.treeStore.removeStorageNodes(treeNodes.map(node => node.value))

    // 削除対象の親ノードへURL遷移
    this.movePageToNode(parentDirPath)

    this.$q.loading.hide()
  }

  /**
   * ノードの移動を行います。
   * @param treeNodes 移動するツリーノード
   * @param toDirPath 移動先のディレクトリパス
   */
  protected async moveNodes(treeNodes: StorageTreeNode[], toDirPath: string): Promise<void> {
    this.$q.loading.show()

    // ノードの移動を実行
    await this.treeStore.moveStorageNodes(
      treeNodes.map(node => node.value),
      toDirPath
    )
    // 移動対象ノードの祖先を展開
    this.openParentNode(treeNodes[0].value, true)
    // 現在選択されているノードへURL遷移
    this.movePageToNode(this.treeStore.selectedNode.value)

    this.$q.loading.hide()
  }

  /**
   * ノードのリネームを行います。
   * @param treeNode リネームするツリーノード
   * @param newName ノードの新しい名前
   */
  protected async renameNode(treeNode: StorageTreeNode, newName: string): Promise<void> {
    this.$q.loading.show()

    // ノードのリネームを実行
    await this.treeStore.renameStorageNode(treeNode.value, newName)
    // 現在選択されているノードへURL遷移
    this.movePageToNode(this.treeStore.selectedNode.value)

    this.$q.loading.hide()
  }

  /**
   * ノードの共有設定を行います。
   * @param treeNodes 共有設定するツリーノード
   * @param settings 共有設定の内容
   */
  protected async setShareSettings(treeNodes: StorageTreeNode[], settings: StorageNodeShareSettings): Promise<void> {
    this.$q.loading.show()

    // ノードの共有設定を実行
    await this.treeStore.setShareSettings(
      treeNodes.map(node => node.value),
      settings
    )
    // 現在選択されているノードへURL遷移
    this.movePageToNode(this.treeStore.selectedNode.value)

    this.$q.loading.hide()
  }

  /**
   * 指定ノードのパスをURLへ付与して移動します。
   * @param dirPath ディレクトリパス
   */
  protected movePageToNode!: (dirPath: string) => void

  protected async movePageToNodeFunc(dirPath: string) {
    dirPath = removeBothEndsSlash(dirPath)
    const urlDirPath = removeBothEndsSlash(this.storageRoute.getNodePath())
    // 移動先が変わらない場合
    // ※URLから取得したディレクトリと移動先のディレクトリが同じ場合
    if (urlDirPath === dirPath) {
      // 指定されたディレクトリをページの選択ノードとして設定
      this.selectNodeOnPage(dirPath)
    }
    // 移動先が変わる場合
    else {
      // 選択ディレクトリのパスをURLに付与
      // ※ルーターによってbeforeRouteUpdate()が実行される
      this.storageRoute.move(dirPath)
    }
  }

  /**
   * 指定されたノードの祖先ノードを展開します。
   * @param nodePath
   * @param animated
   */
  protected openParentNode(nodePath: string, animated: boolean): void {
    const treeNode = this.treeStore.getNode(nodePath)
    if (!treeNode || !treeNode.parent) return

    treeNode.parent.open(animated)
    if (treeNode.parent) {
      this.openParentNode(treeNode.parent.value, animated)
    }
  }

  /**
   * 指定ノードをツリービューの上下中央に位置するようスクロールします。
   * @param nodePath
   * @param animated
   */
  protected scrollToSelectedNode(nodePath: string, animated: boolean): void {
    const treeNode = this.treeStore.getNode(nodePath)
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

  /**
   * パスのパンくずブロック、またはディレクトリビューでノードパス
   * が変更された際の処理を行います。
   * @param nodePath
   */
  protected nodePathOnChanged(nodePath: string): void {
    const node = this.treeStore.getNode(nodePath)
    if (!node) {
      throw new Error(`The specified node was not found: '${nodePath}'`)
    }

    // TODO
    //  現状はディレクトリ選択時のみ対応
    //  ファイル選択時の挙動は今後検討が必要!!
    if (node.nodeType === StorageNodeType.Dir) {
      // ツリービューに変更された選択ノードを設定
      this.treeStore.selectedNode = node
      // 選択されたノードの祖先を展開
      this.openParentNode(nodePath, true)
      // 選択ノードの位置までスクロールする
      this.scrollToSelectedNode(nodePath, true)
    }
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
      this.dirView.setDirPath(null)
    }
  }

  /**
   * パスのパンくずブロックがクリックされた際のリスナです。
   * @param nodePath
   */
  protected pathBreadcrumbOnSelected(nodePath: string) {
    this.nodePathOnChanged(nodePath)
  }

  /**
   * ディレクトリビューでノードが選択された際のリスナです。
   * @param nodePath
   */
  protected async dirViewOnSelected(nodePath: string) {
    this.nodePathOnChanged(nodePath)
  }

  /**
   * アップロード進捗フロートでアップロードが終了した際のハンドラです。
   * @param e
   */
  protected async uploadProgressFloatOnUploadEnds(e: UploadEndedEvent) {
    // アップロードが行われた後のツリーの更新処理
    await this.treeStore.onUploaded(e)
    // アップロード先のディレクトリへURL遷移
    this.movePageToNode(e.uploadDirPath)

    // アップロード先のディレクトリとその祖先を展開
    const uploadDirNode = this.treeStore.getNode(e.uploadDirPath)!
    uploadDirNode.open()
    this.openParentNode(uploadDirNode.value, true)
  }

  /**
   * ノードコンテキストメニューでリロードが選択された際のリスナです。
   * @param dirPath
   */
  protected async onReloadSelected(dirPath: string) {
    await this.treeStore.reloadDir(dirPath)
    // ページの選択ノードを設定
    // ※ディレクトリビューの更新
    this.selectNodeOnPage(this.treeStore.selectedNode.value)
  }

  /**
   * ツリービューのノードコンテキストメニューでフォルダの作成が選択された際のリスナです。
   * @param dirPath
   */
  protected async onCreateDirSelected(dirPath: string) {
    const dirNode = this.treeStore.getNode(dirPath)!
    const creatingDirPath = await this.dirCreateDialog.open(dirNode)
    if (creatingDirPath) {
      await this.createDir(creatingDirPath)
    }
  }

  /**
   * ノードコンテキストメニューでファイルのアップロードが選択された際のリスナです。
   * @param dirPath
   */
  protected async treeViewOnFilesUploadSelected(dirPath: string) {
    this.uploadProgressFloat.openFilesSelectDialog(dirPath)
  }

  /**
   * ノードコンテキストメニューでフォルダのアップロードが選択された際のリスナです。
   * @param dirPath
   */
  protected async onDirUploadSelected(dirPath: string) {
    this.uploadProgressFloat.openDirSelectDialog(dirPath)
  }

  /**
   * ノードコンテキストメニューで移動が選択された際のリスナです。
   * @param nodePaths
   */
  protected async onMoveSelected(nodePaths: string[]) {
    const nodes = nodePaths.map(nodePath => this.treeStore.getNode(nodePath)!)
    const toDir = await this.nodeMoveDialog.open(nodes)
    if (typeof toDir === 'string') {
      await this.moveNodes(nodes, toDir)
    }
  }

  /**
   * ノードコンテキストメニューで名前変更が選択された際のリスナです。
   * @param nodePath
   */
  protected async onRenameSelected(nodePath: string) {
    const node = this.treeStore.getNode(nodePath)!
    const newName = await this.nodeRenameDialog.open(node)
    if (newName) {
      await this.renameNode(node, newName)
    }
  }

  /**
   * ノードコンテキストメニューで削除が選択された際のリスナです。
   * @param nodePaths
   */
  protected async onDeleteSelected(nodePaths: string[]) {
    const nodes = nodePaths.map(nodePath => this.treeStore.getNode(nodePath)!)
    const confirmed = await this.nodeRemoveDialog.open(nodes)
    if (confirmed) {
      await this.removeNodes(nodes)
    }
  }

  /**
   * ノードコンテキストメニューで共有が選択された際のリスナです。
   * @param nodePaths
   */
  protected async onShareSelected(nodePaths: string[]) {
    const nodes = nodePaths.map(nodePath => this.treeStore.getNode(nodePath)!)
    const settings = await this.nodeShareDialog.open(nodes)
    if (settings) {
      await this.setShareSettings(nodes, settings)
    }
  }

  //--------------------------------------------------
  //  TreeView
  //--------------------------------------------------

  /**
   * ツリービューで遅延ロードが開始された際のリスナです。
   * @param e
   */
  protected async treeViewOnLazyLoad(e: CompTreeViewLazyLoadEvent<StorageTreeNode>) {
    this.dirView.loading = true

    // 選択または展開されようとしているディレクトリ直下のノードをサーバーから取得
    // ※done()が実行された後にselectedイベントが発火し、ページが更新される
    await this.treeStore.pullChildren(e.node.value)
    e.done()

    this.dirView.loading = false
  }

  /**
   * ツリービューでノードが選択された際のリスナです。
   * @param node
   */
  protected async treeViewOnSelected(node: StorageTreeNode) {
    // 選択ノードのパスをURLに付与
    this.movePageToNode(node.value)
  }
}

//========================================================================
//
//  StoragePage
//
//========================================================================

@Component({
  components: {
    CompStorageUploadProgressFloat,
    CompTreeView,
    StorageDirCreateDialog,
    StorageDirView,
    StorageNodeMoveDialog,
    StorageNodeRemoveDialog,
    StorageNodeRenameDialog,
    StorageNodeShareDialog,
    StoragePathBreadcrumb,
  },
})
export default class StoragePage extends BaseStoragePage {
  @NoCache
  protected get treeViewContainer(): HTMLElement {
    return this.$refs.treeViewContainer as HTMLElement
  }

  @NoCache
  protected get treeView(): CompTreeView {
    return this.$refs.treeView as CompTreeView
  }

  @NoCache
  protected get pathBreadcrumb(): StoragePathBreadcrumb {
    return this.$refs.pathBreadcrumb as StoragePathBreadcrumb
  }

  @NoCache
  protected get dirView(): StorageDirView {
    return this.$refs.dirView as StorageDirView
  }

  @NoCache
  protected get dirCreateDialog(): StorageDirCreateDialog {
    return this.$refs.dirCreateDialog as StorageDirCreateDialog
  }

  @NoCache
  protected get nodeMoveDialog(): StorageNodeMoveDialog {
    return this.$refs.nodeMoveDialog as StorageNodeMoveDialog
  }

  @NoCache
  protected get nodeRenameDialog(): StorageNodeRenameDialog {
    return this.$refs.nodeRenameDialog as StorageNodeRenameDialog
  }

  @NoCache
  protected get nodeRemoveDialog(): StorageNodeRemoveDialog {
    return this.$refs.nodeRemoveDialog as StorageNodeRemoveDialog
  }

  @NoCache
  protected get nodeShareDialog(): StorageNodeShareDialog {
    return this.$refs.nodeShareDialog as StorageNodeShareDialog
  }

  @NoCache
  protected get uploadProgressFloat(): CompStorageUploadProgressFloat {
    return this.$refs.uploadProgressFloat as CompStorageUploadProgressFloat
  }
}
</script>
