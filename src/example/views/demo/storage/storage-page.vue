import { StorageNodeType } from '@/lib'
<style lang="sass" scoped>
@import '../../../styles/app.variables'

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

.path-block-container
  @extend %layout-horizontal
  @extend %layout-wrap
  margin: 16px
  .path-block
    display: inline-block
    @extend %text-h6
    .path-block
      @extend %app-link

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
    <q-splitter v-model="m_splitterModel" unit="px" class="splitter">
      <template v-slot:before>
        <div ref="treeViewContainer" class="tree-view-container">
          <comp-tree-view
            ref="treeView"
            class="tree-view"
            @selected="m_treeViewOnSelected($event)"
            @lazy-load="m_treeViewOnLazyLoad($event)"
            @create-dir-selected="m_treeViewOnCreateDirSelected($event.value)"
            @files-upload-selected="m_treeViewOnFilesUploadSelected($event.value)"
            @dir-upload-selected="m_treeViewOnDirUploadSelected($event.value)"
            @move-selected="m_treeViewOnMoveSelected([$event.value])"
            @rename-selected="m_treeViewOnRenameSelected($event.value)"
            @delete-selected="m_onDeleteSelected([$event.value])"
            @share-selected="m_onShareSelected([$event.value])"
            @reload-selected="m_treeViewOnReloadSelected($event.value)"
          />
        </div>
      </template>
      <template v-slot:after>
        <div class="content-container">
          <div class="path-block-container">
            <div v-for="pathBlock of m_pathBlocks" :key="pathBlock.label" class="path-block">
              <span v-if="!pathBlock.last" class="path-block" @click="m_pathBlockOnClick(pathBlock.path)">{{ pathBlock.name }}</span>
              <span v-else>{{ pathBlock.name }}</span>
              <span v-show="!pathBlock.last" class="app-mx-8">/</span>
            </div>
          </div>

          <div class="view-container">
            <storage-dir-view
              ref="dirView"
              class="dir-view"
              :storage-type="storageType"
              @dir-selected="m_dirViewOnDirSelected($event)"
              @file-selected="m_dirViewOnFileSelected($event)"
              @create-dir-selected="m_treeViewOnCreateDirSelected($event)"
              @files-upload-selected="m_treeViewOnFilesUploadSelected($event)"
              @dir-upload-selected="m_treeViewOnDirUploadSelected($event)"
              @move-selected="m_treeViewOnMoveSelected($event)"
              @rename-selected="m_treeViewOnRenameSelected($event)"
              @delete-selected="m_onDeleteSelected($event)"
              @share-selected="m_onShareSelected($event)"
              @reload-selected="m_treeViewOnReloadSelected($event)"
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
      @upload-ended="m_uploadProgressFloatOnUploadEnded($event)"
    />
  </div>
</template>

<script lang="ts">
import {
  BaseComponent,
  CompStorageUploadProgressFloat,
  CompTreeView,
  CompTreeViewLazyLoadEvent,
  NoCache,
  Resizable,
  StorageNodeShareSettings,
  UploadEndedEvent,
  User,
} from '@/lib'
import { RawLocation, Route } from 'vue-router'
import { Component } from 'vue-property-decorator'
import StorageDirCreateDialog from '@/example/views/demo/storage/storage-dir-create-dialog.vue'
import StorageDirView from '@/example/views/demo/storage/storage-dir-view.vue'
import StorageNodeMoveDialog from '@/example/views/demo/storage/storage-node-move-dialog.vue'
import StorageNodeRemoveDialog from '@/example/views/demo/storage/storage-node-remove-dialog.vue'
import StorageNodeRenameDialog from '@/example/views/demo/storage/storage-node-rename-dialog.vue'
import StorageNodeShareDialog from '@/example/views/demo/storage/storage-node-share-dialog.vue'
import StorageTreeNode from '@/example/views/demo/storage/storage-tree-node.vue'
import { StorageTypeMixin } from '@/example/views/demo/storage/base'
import Vue from 'vue'
import anime from 'animejs'
import { mixins } from 'vue-class-component'
import { removeBothEndsSlash } from 'web-base-lib'
const debounce = require('lodash/debounce')

@Component({
  components: {
    CompStorageUploadProgressFloat,
    CompTreeView,
    StorageDirView,
    StorageDirCreateDialog,
    StorageNodeMoveDialog,
    StorageNodeRenameDialog,
    StorageNodeRemoveDialog,
    StorageNodeShareDialog,
  },
})
export default class StoragePage extends mixins(BaseComponent, Resizable, StorageTypeMixin) {
  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  created() {
    this.m_movePageToNode = debounce(this.m_movePageToNodeFunc, 100)

    this.$logic.auth.addSignedInListener(this.m_userOnSignedIn)
    this.$logic.auth.addSignedOutListener(this.m_userOnSignedOut)
  }

  destroyed() {
    this.$logic.auth.removeSignedInListener(this.m_userOnSignedIn)
    this.$logic.auth.removeSignedOutListener(this.m_userOnSignedOut)

    this.treeStore.teardown()
  }

  async mounted() {
    // ツリーストアを初期化
    this.treeStore.setup(this.m_treeView)
    // ページの選択ノードを設定
    this.m_selectNodeOnPage(this.treeStore.selectedNode.value)

    // 初期ストレージノードの読み込みが既に行われている場合
    // ※本ページから別ページに遷移し、その後本ページに戻ってきた場合がこの状況に当たる
    if (this.treeStore.isInitialPulled) {
      // 選択ノードのパスをURLに付与し、ページを更新
      const dirPath = this.treeStore.selectedNode.value
      this.m_updatePage(dirPath)
      // 選択ノードの祖先ノードを展開
      this.m_openParentNode(dirPath, false)
      // 選択ノードの位置までスクロールする
      this.m_scrollToSelectedNode(dirPath, false)
    }
    // 初期ストレージノードの読み込みが行われていなく、かつユーザーがサインインしてる場合
    else if (this.$logic.auth.user.isSignedIn) {
      await this.m_pullInitialNodes()
    }
  }

  async beforeRouteUpdate(to: Route, from: Route, next: (to?: RawLocation | false | ((vm: Vue) => any) | void) => void) {
    next()

    // URLから選択ノードパスを取得(取得できなかった場合はルートノード)
    const dirPath = this.storageRoute.getNodePath() || this.treeStore.rootNode.value
    // ページの選択ノードを設定
    this.m_selectNodeOnPage(dirPath)
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private m_splitterModel = 300

  private m_scrollAnime: anime.AnimeInstance | null = null

  /**
   * ツリービューの縦スクロール位置が初期化されたか否かです。
   */
  private m_initializedScrollTop = false

  /**
   * パスのパンくずのブロック配列です。
   */
  private m_pathBlocks: { name: string; path: string; last: boolean }[] = []

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

  @NoCache
  get m_treeViewContainer(): HTMLElement {
    return this.$refs.treeViewContainer as HTMLElement
  }

  @NoCache
  get m_treeView(): CompTreeView {
    return this.$refs.treeView as CompTreeView
  }

  @NoCache
  private get m_dirView(): StorageDirView {
    return this.$refs.dirView as StorageDirView
  }

  @NoCache
  private get m_dirCreateDialog(): StorageDirCreateDialog {
    return this.$refs.dirCreateDialog as StorageDirCreateDialog
  }

  @NoCache
  private get m_nodeMoveDialog(): StorageNodeMoveDialog {
    return this.$refs.nodeMoveDialog as StorageNodeMoveDialog
  }

  @NoCache
  private get m_nodeRenameDialog(): StorageNodeRenameDialog {
    return this.$refs.nodeRenameDialog as StorageNodeRenameDialog
  }

  @NoCache
  private get m_nodeRemoveDialog(): StorageNodeRemoveDialog {
    return this.$refs.nodeRemoveDialog as StorageNodeRemoveDialog
  }

  @NoCache
  private get m_nodeShareDialog(): StorageNodeShareDialog {
    return this.$refs.nodeShareDialog as StorageNodeShareDialog
  }

  @NoCache
  private get m_uploadProgressFloat(): CompStorageUploadProgressFloat {
    return this.$refs.uploadProgressFloat as CompStorageUploadProgressFloat
  }

  @NoCache
  get m_img(): HTMLImageElement {
    return this.$refs.img as HTMLImageElement
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
  private m_updatePage(dirPath: string): void {
    // ロジックストアに格納されているストレージノードをツリービューへマージ
    this.treeStore.mergeAllNodes(this.storageLogic.nodes)
    // 選択ノードへURL遷移
    this.m_movePageToNode(dirPath)
  }

  /**
   * 指定されたディレクトリをページの選択ノードとして設定します。
   * @param dirPath
   */
  private m_selectNodeOnPage(dirPath: string): void {
    const selectingNode = this.treeStore.getNode(dirPath)
    if (selectingNode) {
      // 選択ノードを設定
      this.treeStore.selectedNode = selectingNode
      // パンくずの設定
      this.m_setupPathBlocks()
      // ディレクトリビューのディレクトリパスを設定
      this.m_dirView.setDirPath(selectingNode.value)
    }
  }

  /**
   * 初回に読み込むべきストレージノードの読み込みを行います。
   */
  private async m_pullInitialNodes(): Promise<void> {
    this.m_dirView.loading = true

    // 現在の選択ノードを取得
    // ※URLから取得した選択ノードまたは現在の選択ノード
    const urlDirPath = this.storageRoute.getNodePath()
    const dirPath = urlDirPath || this.treeStore.selectedNode.value
    // 初期ストレージノードの読み込み
    await this.treeStore.pullInitialNodes(dirPath)
    // ページの選択ノードを設定
    this.m_selectNodeOnPage(dirPath)
    // 選択ノードの位置までスクロールする
    this.m_scrollToSelectedNode(dirPath, false)

    this.m_dirView.loading = false
  }

  /**
   * ディレクトリの作成を行います。
   * @param dirPath 作成するディレクトリのパス
   */
  private async m_createDir(dirPath: string): Promise<void> {
    this.$q.loading.show()

    // ディレクトリの作成を実行
    await this.treeStore.createStorageDir(dirPath)
    const treeNode = this.treeStore.getNode(dirPath)!

    // 作成したディレクトリの祖先を展開
    this.m_openParentNode(treeNode.value, true)

    // 作成したディレクトリの親ノードへURL遷移
    this.m_movePageToNode(treeNode.parent!.value)

    this.$q.loading.hide()
  }

  /**
   * ノードの削除を行います。
   * @param treeNodes 削除するツリーノード
   */
  private async m_removeNodes(treeNodes: StorageTreeNode[]): Promise<void> {
    this.$q.loading.show()

    const parentDirPath = treeNodes[0].parent!.value

    // ノードの移動を実行
    await this.treeStore.removeStorageNodes(treeNodes.map(node => node.value))

    // 削除対象の親ノードへURL遷移
    this.m_movePageToNode(parentDirPath)

    this.$q.loading.hide()
  }

  /**
   * ノードの移動を行います。
   * @param treeNodes 移動するツリーノード
   * @param toDirPath 移動先のディレクトリパス
   */
  private async m_moveNodes(treeNodes: StorageTreeNode[], toDirPath: string): Promise<void> {
    this.$q.loading.show()

    // ノードの移動を実行
    await this.treeStore.moveStorageNodes(treeNodes.map(node => node.value), toDirPath)
    // 移動対象ノードの祖先を展開
    this.m_openParentNode(treeNodes[0].value, true)
    // 現在選択されているノードへURL遷移
    this.m_movePageToNode(this.treeStore.selectedNode.value)

    this.$q.loading.hide()
  }

  /**
   * ノードのリネームを行います。
   * @param treeNode リネームするツリーノード
   * @param newName ノードの新しい名前
   */
  private async m_renameNode(treeNode: StorageTreeNode, newName: string): Promise<void> {
    this.$q.loading.show()

    // ノードのリネームを実行
    await this.treeStore.renameStorageNode(treeNode.value, newName)
    // 現在選択されているノードへURL遷移
    this.m_movePageToNode(this.treeStore.selectedNode.value)

    this.$q.loading.hide()
  }

  /**
   * ノードの共有設定を行います。
   * @param treeNodes 共有設定するツリーノード
   * @param settings 共有設定の内容
   */
  private async m_setShareSettings(treeNodes: StorageTreeNode[], settings: StorageNodeShareSettings): Promise<void> {
    this.$q.loading.show()

    // ノードの共有設定を実行
    await this.treeStore.setShareSettings(treeNodes.map(node => node.value), settings)
    // 現在選択されているノードへURL遷移
    this.m_movePageToNode(this.treeStore.selectedNode.value)

    this.$q.loading.hide()
  }

  /**
   * 指定ノードのパスをURLへ付与して移動します。
   * @param dirPath ディレクトリパス
   */
  private m_movePageToNode!: (dirPath: string) => void

  private async m_movePageToNodeFunc(dirPath: string) {
    dirPath = removeBothEndsSlash(dirPath)
    const urlDirPath = removeBothEndsSlash(this.storageRoute.getNodePath())
    // 移動先が変わらない場合
    // ※URLから取得したディレクトリと移動先のディレクトリが同じ場合
    if (urlDirPath === dirPath) {
      // 指定されたディレクトリをページの選択ノードとして設定
      this.m_selectNodeOnPage(dirPath)
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
  private m_openParentNode(nodePath: string, animated: boolean): void {
    const treeNode = this.treeStore.getNode(nodePath)
    if (!treeNode || !treeNode.parent) return

    treeNode.parent.open(animated)
    if (treeNode.parent) {
      this.m_openParentNode(treeNode.parent.value, animated)
    }
  }

  /**
   * 指定ノードをツリービューの上下中央に位置するようスクロールします。
   * @param nodePath
   * @param animated
   */
  private m_scrollToSelectedNode(nodePath: string, animated: boolean): void {
    const treeNode = this.treeStore.getNode(nodePath)
    if (!treeNode) return

    // 本ページのグローバルな上位置を取得
    const globalTop = this.$el.getBoundingClientRect().top
    // ツリービューの現スクロール位置を取得
    const scrollTop = this.m_treeViewContainer.scrollTop
    // 指定ノードの上位置を取得
    const nodeTop = treeNode.$el.getBoundingClientRect().top - globalTop
    // スクロール値の最大を取得
    const maxScrollTop = this.m_treeView.$el.scrollHeight - this.m_treeViewContainer.clientHeight

    // 指定ノードをツリービューの上下中央に位置するようスクロール(できるだけ)
    let newScrollTop = scrollTop + nodeTop - this.m_treeViewContainer.clientHeight / 2
    if (newScrollTop < 0) {
      newScrollTop = 0
    } else if (maxScrollTop < newScrollTop) {
      newScrollTop = maxScrollTop
    }

    this.m_scrollAnime && this.m_scrollAnime.pause()
    this.m_scrollAnime = anime({
      targets: this.m_treeViewContainer,
      scrollTop: newScrollTop,
      duration: animated ? 750 : 0,
      easing: 'easeOutQuart',
      complete: () => {
        this.m_scrollAnime = null
      },
    })

    // console.log(
    //   JSON.stringify(
    //     {
    //       scrollTop,
    //       nodeTop,
    //       'treeViewContainer.clientHeight / 2': this.m_treeViewContainer.clientHeight / 2,
    //       newScrollTop,
    //     },
    //     null,
    //     2
    //   )
    // )
  }

  /**
   * パンくず用に選択ノードのパスを配列に分割します。
   */
  private m_setupPathBlocks(): void {
    this.m_pathBlocks.length = 0
    const pathBlocks = this.treeStore.selectedNode.value.split('/').filter(item => !!item)
    for (let i = 0; i < pathBlocks.length; i++) {
      const pathBlock = pathBlocks.slice(0, i + 1)
      this.m_pathBlocks.push({
        name: pathBlock[pathBlock.length - 1],
        path: pathBlock.join('/'),
        last: i === pathBlocks.length - 1,
      })
    }

    const rootNode = this.treeStore.rootNode
    this.m_pathBlocks.unshift({
      name: rootNode.label,
      path: rootNode.value,
      last: this.m_pathBlocks.length > 0 ? false : true,
    })
  }

  /**
   * パスのパンくずのブロック、またはディレクトリビューでディレクトリパス
   * が変更された際の処理を行います。
   * @param dirPath
   */
  private m_dirPathOnChanged(dirPath: string): void {
    const dirNode = this.treeStore.getNode(dirPath)
    if (!dirNode) {
      throw new Error(`The specified node was not found: '${dirPath}'`)
    }

    // ツリービューに変更された選択ノードを設定
    this.treeStore.selectedNode = dirNode
    // 選択されたノードの祖先を展開
    this.m_openParentNode(dirPath, true)
    // 選択ノードの位置までスクロールする
    this.m_scrollToSelectedNode(dirPath, true)
  }

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------

  private async m_loadFileButtonOnClick(e) {
    /*
    // 画像パス(例: images/space.png)から参照を取得
    const ref = firebase.storage().ref(this.m_filePath)
    // 取得した参照からダウンロード用のURLを取得し、URLの画像を表示
    const downloadURL = await ref.getDownloadURL()

    // ファイルのメタデータを取得
    const metadata = await ref.getMetadata()
    console.log(metadata)

    // ファイルのコンテンツを取得
    const response = await axios.request({
      url: downloadURL,
      method: 'get',
      // responseType: 'blob',
      responseType: 'text',
    })
    console.log(response)
    */
  }

  /**
   * パスのパンくずのブロックがクリックされた際のリスナです。
   * @param dirPath
   */
  private m_pathBlockOnClick(dirPath: string) {
    this.m_dirPathOnChanged(dirPath)
  }

  /**
   * ディレクトリビューでディレクトリが選択された際のリスナです。
   * @param dirPath
   */
  private async m_dirViewOnDirSelected(dirPath: string) {
    this.m_dirPathOnChanged(dirPath)
  }

  /**
   * ディレクトリビューでファイルが選択された際のリスナです。
   * @param filePath
   */
  private m_dirViewOnFileSelected(filePath: string) {}

  /**
   * アップロード進捗フロートでアップロードが終了した際のハンドラです。
   * @param e
   */
  private async m_uploadProgressFloatOnUploadEnded(e: UploadEndedEvent) {
    // アップロードが行われた後のツリーの更新処理
    await this.treeStore.onUploaded(e)
    // アップロード先のディレクトリへURL遷移
    this.m_movePageToNode(e.uploadDirPath)

    // アップロード先のディレクトリとその祖先を展開
    const uploadDirNode = this.treeStore.getNode(e.uploadDirPath)!
    uploadDirNode.open()
    this.m_openParentNode(uploadDirNode.value, true)
  }

  /**
   * ユーザーがサインインした際のリスナです。
   * @param user
   */
  private async m_userOnSignedIn(user: User) {
    await this.m_pullInitialNodes()
  }

  /**
   * ユーザーがサインアウトした際のリスナです。
   * @param user
   */
  private async m_userOnSignedOut(user: User) {
    this.m_dirView.setDirPath(null)
    this.m_setupPathBlocks()
  }

  //--------------------------------------------------
  //  ツリービュー
  //--------------------------------------------------

  /**
   * ツリービューで遅延ロードが開始された際のリスナです。
   * @param e
   */
  private async m_treeViewOnLazyLoad(e: CompTreeViewLazyLoadEvent<StorageTreeNode>) {
    this.m_dirView.loading = true

    // 選択または展開されようとしているディレクトリ直下のノードをサーバーから取得
    // ※done()が実行された後にselectedイベントが発火し、ページが更新される
    await this.treeStore.pullChildren(e.node.value)
    e.done()

    this.m_dirView.loading = false
  }

  /**
   * ツリービューでノードが選択された際のリスナです。
   * @param node
   */
  private async m_treeViewOnSelected(node: StorageTreeNode) {
    // 選択ノードのパスをURLに付与
    this.m_movePageToNode(node.value)
  }

  /**
   * ツリービューのノードコンテキストメニューでリロードが選択された際のリスナです。
   * @param dirPath
   */
  private async m_treeViewOnReloadSelected(dirPath: string) {
    await this.treeStore.reloadDir(dirPath)
    // ページの選択ノードを設定
    // ※ディレクトリビューの更新
    this.m_selectNodeOnPage(this.treeStore.selectedNode.value)
  }

  /**
   * ツリービューのノードコンテキストメニューでフォルダの作成が選択された際のリスナです。
   * @param dirPath
   */
  private async m_treeViewOnCreateDirSelected(dirPath: string) {
    const dirNode = this.treeStore.getNode(dirPath)!
    const creatingDirPath = await this.m_dirCreateDialog.open(dirNode)
    if (creatingDirPath) {
      await this.m_createDir(creatingDirPath)
    }
  }

  /**
   * ツリービューのノードコンテキストメニューでファイルのアップロードが選択された際のリスナです。
   * @param dirPath
   */
  private async m_treeViewOnFilesUploadSelected(dirPath: string) {
    this.m_uploadProgressFloat.openFilesSelectDialog(dirPath)
  }

  /**
   * ツリービューのノードコンテキストメニューでフォルダのアップロードが選択された際のリスナです。
   * @param dirPath
   */
  private async m_treeViewOnDirUploadSelected(dirPath: string) {
    this.m_uploadProgressFloat.openDirSelectDialog(dirPath)
  }

  /**
   * ツリービューのノードコンテキストメニューで移動が選択された際のリスナです。
   * @param nodePaths
   */
  private async m_treeViewOnMoveSelected(nodePaths: string[]) {
    const nodes = nodePaths.map(nodePath => this.treeStore.getNode(nodePath)!)
    const toDir = await this.m_nodeMoveDialog.open(nodes)
    if (typeof toDir === 'string') {
      await this.m_moveNodes(nodes, toDir)
    }
  }

  /**
   * ツリービューのノードコンテキストメニューで名前変更が選択された際のリスナです。
   * @param nodePath
   */
  private async m_treeViewOnRenameSelected(nodePath: string) {
    const node = this.treeStore.getNode(nodePath)!
    const newName = await this.m_nodeRenameDialog.open(node)
    if (newName) {
      await this.m_renameNode(node, newName)
    }
  }

  /**
   * ツリービューのノードコンテキストメニューで削除が選択された際のリスナです。
   * @param nodePaths
   */
  private async m_onDeleteSelected(nodePaths: string[]) {
    const nodes = nodePaths.map(nodePath => this.treeStore.getNode(nodePath)!)
    const confirmed = await this.m_nodeRemoveDialog.open(nodes)
    if (confirmed) {
      await this.m_removeNodes(nodes)
    }
  }

  /**
   * ツリービューのノードコンテキストメニューで共有が選択された際のリスナです。
   * @param nodePaths
   */
  private async m_onShareSelected(nodePaths: string[]) {
    const nodes = nodePaths.map(nodePath => this.treeStore.getNode(nodePath)!)
    const settings = await this.m_nodeShareDialog.open(nodes)
    if (settings) {
      await this.m_setShareSettings(nodes, settings)
    }
  }
}
</script>
