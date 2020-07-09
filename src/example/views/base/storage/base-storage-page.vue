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
          <storage-tree-view ref="treeView" class="tree-view" :storage-type="storageType" />
        </div>
      </template>
      <template v-slot:after>
        <div class="content-container layout vertical">
          <storage-dir-path-breadcrumb ref="pathDirBreadcrumb" :storage-type="storageType" />
          <div class="view-container layout horizontal flex-1">
            <storage-dir-view ref="dirView" class="dir-view flex-1" :storage-type="storageType" @select="dirViewOnSelect" />
            <storage-file-detail-view
              v-show="visibleNodeDetailView"
              ref="nodeDetailView"
              class="node-detail-view"
              :storage-type="storageType"
              @close="nodeDetailViewOnClose"
            />
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
import * as path from 'path'
import {
  AuthStatus,
  BaseComponent,
  CompStorageUploadProgressFloat,
  CompTreeViewEvent,
  CompTreeViewLazyLoadEvent,
  Resizable,
  StorageLogic,
  StorageNodeShareSettings,
  StorageNodeType,
  UploadEndedEvent,
} from '@/lib'
import { Component, Watch } from 'vue-property-decorator'
import { RawLocation, Route } from 'vue-router'
import { StorageNodeContextMenuSelectedEvent, StorageNodeContextMenuType, StorageTreeNode, registerStoragePage } from './base'
import { removeBothEndsSlash, removeStartDirChars } from 'web-base-lib'
import StorageDirCreateDialog from './storage-dir-create-dialog.vue'
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
import debounce from 'lodash/debounce'
import { mixins } from 'vue-class-component'

@Component({
  components: {
    CompStorageUploadProgressFloat,
    StorageDirCreateDialog,
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
    registerStoragePage(this)
    this.movePageToNode = debounce(this.movePageToNodeFunc, 100)
  }

  async mounted() {
    // 必要な要素の設定
    this.setupElements()

    // ページの選択ノードを設定
    this.selectNodeOnPage(this.treeView.selectedNode!.path)

    // 初期ストレージノードの読み込みが既に行われている場合
    // ※本ページから別ページに遷移し、その後本ページに戻ってきた場合がこの状況に当たる
    if (this.treeView.isInitialPull) {
      // 選択ノードのパスをURLに付与し、ページを更新
      const dirPath = this.treeView.selectedNode!.path
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
    const dirPath = this.storageRoute.getNodePath() || this.treeView.rootNode.path
    // ページの選択ノードを設定
    this.selectNodeOnPage(dirPath)
  }

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  get storageType(): string {
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
   * ノード詳細ビューの表示フラグです。
   */
  protected visibleNodeDetailView = false

  protected splitterModel = 300

  protected scrollAnime: anime.AnimeInstance | null = null

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

  protected treeViewContainer: HTMLElement = null as any

  protected pathDirBreadcrumb: StorageDirPathBreadcrumb = null as any

  protected dirView: StorageDirView = null as any

  protected nodeDetailView: StorageFileDetailView = null as any

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

    if (!this.$refs.nodeDetailView) {
      throw new Error('The element with the reference name ref="nodeDetailView" does not exist.')
    }
    this.nodeDetailView = this.$refs.nodeDetailView as StorageFileDetailView

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
    this.dirView.$on('context-menu-select', e => this.onContextMenuSelect(e))
    this.pathDirBreadcrumb.$on('select', e => this.pathDirBreadcrumbOnSelectChange(e))
  }

  /**
   * ページをロジックストアに格納されているストレージノードで最新化します。
   * @param dirPath 選択ディレクトリを指定
   */
  protected updatePage(dirPath: string): void {
    // ロジックストアに格納されているストレージノードをツリービューへマージ
    this.treeView.mergeAllNodes(this.storageLogic.nodes)
    // 選択ノードへURL遷移
    this.movePageToNode(dirPath)
  }

  /**
   * 指定されたノードをページの選択ノードとして設定します。
   * @param nodePath
   */
  protected selectNodeOnPage(nodePath: string): void {
    const selectingNode = this.treeView.getNode(nodePath)
    if (!selectingNode) return

    // 選択ノードを設定
    this.treeView.selectedNode = selectingNode

    let dirPath = ''
    switch (selectingNode.nodeType) {
      case StorageNodeType.Dir: {
        dirPath = selectingNode.path
        this.visibleNodeDetailView = false
        break
      }
      case StorageNodeType.File: {
        dirPath = removeStartDirChars(path.dirname(selectingNode.path))
        // ファイル詳細ビューを表示
        this.nodeDetailView.setFilePath(nodePath)
        this.visibleNodeDetailView = true
        break
      }
    }

    // ディレクトリビューのディレクトリパスを設定
    this.dirView.setDirPath(dirPath)
  }

  /**
   * 初回に読み込むべきストレージノードの読み込みを行います。
   */
  protected async pullInitialNodes(): Promise<void> {
    this.dirView.loading = true

    // 現在の選択ノードを取得
    // ※URLから取得した選択ノードまたは現在の選択ノード
    const urlDirPath = this.storageRoute.getNodePath()
    const dirPath = urlDirPath || this.treeView.selectedNode.path
    // 初期ストレージノードの読み込み
    await this.treeView.pullInitialNodes(dirPath)
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
    await this.treeView.createStorageDir(dirPath)
    const treeNode = this.treeView.getNode(dirPath)!

    // 作成したディレクトリの祖先を展開
    this.openParentNode(treeNode.path, true)

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
    await this.treeView.removeStorageNodes(treeNodes.map(node => node.path))

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
    await this.treeView.moveStorageNodes(
      treeNodes.map(node => node.path),
      toDirPath
    )
    // 移動対象ノードの祖先を展開
    this.openParentNode(treeNodes[0].path, true)
    // 現在選択されているノードへURL遷移
    this.movePageToNode(this.treeView.selectedNode.path)

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
    await this.treeView.renameStorageNode(treeNode.path, newName)
    // 現在選択されているノードへURL遷移
    this.movePageToNode(this.treeView.selectedNode.path)

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
    await this.treeView.setShareSettings(
      treeNodes.map(node => node.path),
      settings
    )
    // 現在選択されているノードへURL遷移
    this.movePageToNode(this.treeView.selectedNode.path)

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
    // ※URLから取得したノードと移動先のノードが同じ場合
    if (urlDirPath === dirPath) {
      // 指定されたノードをページの選択ノードとして設定
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

  /**
   * パスのパンくずブロック、またはディレクトリビューでノードパス
   * が変更された際の処理を行います。
   * @param nodePath
   */
  protected nodePathOnChanged(nodePath: string): void {
    const node = this.treeView.getNode(nodePath)
    if (!node) {
      throw new Error(`The specified node was not found: '${nodePath}'`)
    }

    // ページの選択ノードを設定
    this.selectNodeOnPage(nodePath)
    // 選択されたノードの祖先を展開
    this.openParentNode(nodePath, true)
    // 選択ノードの位置までスクロールする
    this.scrollToSelectedNode(nodePath, true)
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
      this.visibleNodeDetailView = false
    }
  }

  /**
   * パスのパンくずブロックがクリックされた際のリスナです。
   * @param nodePath
   */
  protected pathDirBreadcrumbOnSelectChange(nodePath: string) {
    this.nodePathOnChanged(nodePath)
  }

  /**
   * アップロード進捗フロートでアップロードが終了した際のハンドラです。
   * @param e
   */
  protected async uploadProgressFloatOnUploadEnds(e: UploadEndedEvent) {
    // アップロードが行われた後のツリーの更新処理
    await this.treeView.onUploaded(e)
    // アップロード先のディレクトリへURL遷移
    this.movePageToNode(e.uploadDirPath)

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
        this.selectNodeOnPage(this.treeView.selectedNode.path)
        break
      }
      case StorageNodeContextMenuType.createDir.type: {
        const dirPath = e.nodePaths[0]
        const dirNode = this.treeView.getNode(dirPath)!
        const creatingDirPath = await this.dirCreateDialog.open(dirNode)
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
        const nodes = e.nodePaths.map(nodePath => this.treeView.getNode(nodePath)!)
        const toDir = await this.nodeMoveDialog.open(nodes)
        if (typeof toDir === 'string') {
          await this.moveNodes(nodes, toDir)
        }
        break
      }
      case StorageNodeContextMenuType.rename.type: {
        const nodePath = e.nodePaths[0]
        const node = this.treeView.getNode(nodePath)!
        const newName = await this.nodeRenameDialog.open(node)
        if (newName) {
          await this.renameNode(node, newName)
        }
        break
      }
      case StorageNodeContextMenuType.share.type: {
        const nodes = e.nodePaths.map(nodePath => this.treeView.getNode(nodePath)!)
        const settings = await this.nodeShareDialog.open(nodes)
        if (settings) {
          await this.setShareSettings(nodes, settings)
        }
        break
      }
      case StorageNodeContextMenuType.deletion.type: {
        const nodes = e.nodePaths.map(nodePath => this.treeView.getNode(nodePath)!)
        const confirmed = await this.nodeRemoveDialog.open(nodes)
        if (confirmed) {
          await this.removeNodes(nodes)
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
    // ※done()が実行された後にselectedイベントが発火し、ページが更新される
    await this.treeView.pullChildren(e.node.path)
    e.done()

    this.dirView.loading = false
  }

  /**
   * ツリービューでノードが選択された際のリスナです。
   * @param e
   */
  protected async treeViewOnSelect(e: CompTreeViewEvent<StorageTreeNode>) {
    // 選択ノードのパスをURLに付与
    this.movePageToNode(e.node.path)
  }

  //--------------------------------------------------
  //  ディレクトリビュー
  //--------------------------------------------------

  /**
   * ディレクトリビューでノードが選択された際のリスナです。
   * @param nodePath
   */
  protected dirViewOnSelect(nodePath: string) {
    this.nodePathOnChanged(nodePath)
  }

  //--------------------------------------------------
  //  ノード詳細ビュー
  //--------------------------------------------------

  protected nodeDetailViewOnClose() {
    this.visibleNodeDetailView = false
  }
}
</script>
