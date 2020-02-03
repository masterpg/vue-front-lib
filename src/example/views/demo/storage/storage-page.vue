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
    <q-splitter v-model="m_splitterModel" class="splitter">
      <template v-slot:before>
        <div ref="treeViewContainer" class="tree-view-container">
          <comp-tree-view
            ref="treeView"
            class="tree-view"
            @selected="m_treeViewOnSelected($event)"
            @reload-selected="m_treeViewOnReloadSelected()"
            @create-dir-selected="m_treeViewOnCreateDirSelected($event.value)"
            @files-upload-selected="m_treeViewOnFilesUploadSelected($event.value)"
            @dir-upload-selected="m_treeViewOnDirUploadSelected($event.value)"
            @move-selected="m_treeViewOnMoveSelected([$event.value])"
            @rename-selected="m_treeViewOnRenameSelected($event.value)"
            @delete-selected="m_onDeleteSelected([$event.value])"
            @share-selected="m_onShareSelected([$event.value])"
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
      storage-type="user"
      @upload-ended="m_uploadProgressFloatOnUploadEnded($event)"
    />
  </div>
</template>

<script lang="ts">
import * as path from 'path'
import {
  BaseComponent,
  CompStorageUploadProgressFloat,
  CompTreeView,
  NoCache,
  Resizable,
  StorageNode,
  StorageNodeShareSettings,
  StorageNodeType,
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
import { mixins } from 'vue-class-component'
import { scroll } from 'quasar'
const { getScrollPosition, setScrollPosition } = scroll
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
    this.m_moveByRouter = debounce(this.m_moveByRouterFunc, 100)

    this.treeStore.setup({
      pulled: () => {
        // URLから選択ノードのパスを取得
        const nodePath = this.storageRoute.getNodePath()
        // URLから取得した選択ノードまたは以前選択されていたノードでページリフレッシュ
        this.m_refreshPage(nodePath || this.treeStore.selectedNode.value)
      },
      cleared: () => {
        this.m_dirView.setDirPath(null)
        this.m_setupPathBlocks()
      },
    })
  }

  destroyed() {
    this.treeStore.teardown()
  }

  async mounted() {
    // ツリーストアを初期化
    this.treeStore.start(this.m_treeView)

    // サーバーからストレージノード一覧が取得済みの場合
    // ※本ページから別ページに遷移し、その後本ページに戻ってきた場合がこの状況に当たる
    if (this.treeStore.isNodesPulled) {
      this.m_refreshPage()
    }
  }

  async beforeRouteUpdate(to: Route, from: Route, next: (to?: RawLocation | false | ((vm: Vue) => any) | void) => void) {
    next()

    // URLから選択ノードパスを取得(取得できなかった場合はルートノード)
    const selectedNodePath = this.storageRoute.getNodePath() || this.treeStore.rootNode.value
    // ノードの選択状態を設定
    this.m_selectNode(selectedNodePath)
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private m_splitterModel = 30

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
   * 指定されたノードを選択状態にし、ページのリフレッシュを行います。
   * ノードが指定されなかった場合、現在選択されているノードをもとにページをリフレッシュします。
   * @param selectedNodePath
   */
  private m_refreshPage(selectedNodePath?: string): void {
    // ルーターのパスが本ページのパスと一致しない場合
    if (!this.storageRoute.isCurrentRoute) return

    // ツリービューの構築
    this.m_buildTreeView()

    // 引数でノードパスの指定がない場合
    if (typeof selectedNodePath !== 'string') {
      // 現在の選択ノードのパスを取得
      selectedNodePath = this.treeStore.selectedNode.value
    }

    // ノードの選択状態を設定
    this.m_selectNode(selectedNodePath)
  }

  /**
   * 指定されたノードを選択状態にします。
   * @param selectingNodePath 選択するノードのパス
   */
  private m_selectNode(selectingNodePath: string): void {
    const selectingNode = this.treeStore.getNode(selectingNodePath)
    if (selectingNode) {
      // 選択ノードを設定
      this.treeStore.selectedNode = selectingNode
      // 選択ノードの祖先ノードを展開
      this.m_openParentNode(selectingNode.value)
      // パンくずの設定
      this.m_setupPathBlocks()
      // ディレクトリビューのディレクトリパスを設定
      this.m_dirView.setDirPath(selectingNode.value)

      // ツリービューの縦スクロール位置が初期化さていない場合
      if (!this.m_initializedScrollTop) {
        this.m_initializedScrollTop = true
        setTimeout(() => {
          this.m_scrollToSelectedNode(selectingNode.value)
        }, 250)
      }
    }
  }

  /**
   * ロジックストアに格納されているストレージノード一覧をもとにツリービューを構築します。
   */
  private async m_buildTreeView(): Promise<void> {
    // ロジックストアにないのにツリーには存在するノードを削除
    const storeNodeMap = this.storageLogic.getNodeMap()
    for (const treeNode of this.treeStore.getAllNodes()) {
      // ツリーのルートノードはロジックには存在しないので無視
      if (treeNode === this.treeStore.rootNode) continue

      const storeNode = storeNodeMap[treeNode.value]
      if (!storeNode) {
        this.treeStore.removeNode(treeNode.value)
      }
    }

    // ロジックのノードをツリービューに反映
    this.treeStore.setNodes(this.storageLogic.nodes)
  }

  /**
   * ディレクトリの作成を行います。
   * @param dirPath 作成するディレクトリのパス
   */
  private async m_createDir(dirPath: string): Promise<void> {
    this.$q.loading.show()

    let dirNode: StorageNode
    try {
      dirNode = (await this.storageLogic.createDirs([dirPath]))[0]
    } catch (err) {
      this.$q.loading.hide()
      console.error(err)
      this.$q.notify({
        icon: 'report',
        position: 'bottom-left',
        message: String(this.$t('storage.create.creatingDirError', { nodeName: path.basename(dirPath) })),
        timeout: 0,
        actions: [{ icon: 'close', color: 'white' }],
      })
      return
    }

    // ツリービューに作成したディレクトリノードを追加
    this.treeStore.setNode(dirNode)

    // 作成したディレクトリの祖先を展開
    const dirTreeNode = this.treeStore.getNode(dirPath)!
    this.m_openParentNode(dirPath)

    // 作成したディレクトリの親ノードを選択状態に設定
    this.treeStore.selectedNode = dirTreeNode.parent! as StorageTreeNode
    // URLに選択ノードのパスを付与し、ページをリフレッシュ
    this.m_moveByRouter(this.treeStore.selectedNode.value)

    this.$q.loading.hide()
  }

  /**
   * ノードの削除を行います。
   * @param treeNodes 削除するツリーノード
   */
  private async m_removeNodes(treeNodes: StorageTreeNode[]): Promise<void> {
    const showNotification = (treeNode: StorageTreeNode) => {
      this.$q.notify({
        icon: 'report',
        position: 'bottom-left',
        message: String(this.$t('storage.delete.deletingError', { nodeName: treeNode.label })),
        timeout: 0,
        actions: [{ icon: 'close', color: 'white' }],
      })
    }

    this.$q.loading.show()

    const promises: Promise<void>[] = []
    for (const treeNode of treeNodes) {
      if (treeNode.nodeType === StorageNodeType.Dir) {
        const promise = this.storageLogic.removeDirs([treeNode.value]).catch(err => {
          console.error(err)
          showNotification(treeNode)
        }) as Promise<void>
        promises.push(promise)
      } else if (treeNode.nodeType === StorageNodeType.File) {
        const promise = this.storageLogic.removeFiles([treeNode.value]).catch(err => {
          console.error(err)
          showNotification(treeNode)
        }) as Promise<void>
        promises.push(promise)
      }
    }
    await Promise.all(promises)

    // 親ノードを選択状態に設定
    this.treeStore.selectedNode = treeNodes[0].parent! as StorageTreeNode
    // URLに選択ノードのパスを付与し、ページをリフレッシュ
    this.m_moveByRouter(this.treeStore.selectedNode.value)

    this.$q.loading.hide()
  }

  /**
   * ノードの移動を行います。
   * @param treeNodes 移動するツリーノード
   * @param toDir 移動先のディレクトリパス
   */
  private async m_moveNodes(treeNodes: StorageTreeNode[], toDir: string): Promise<void> {
    const showNotification = (treeNode: StorageTreeNode) => {
      this.$q.notify({
        icon: 'report',
        position: 'bottom-left',
        message: String(this.$t('storage.move.movingError', { nodeName: treeNode.label })),
        timeout: 0,
        actions: [{ icon: 'close', color: 'white' }],
      })
    }

    /**
     * 移動先パスを生成
     * 'home/photos' → 'home/archives/photos'
     * 'photos/family.png' → 'home/archives/family.png'
     */
    const toPath = (treeNode: StorageTreeNode) => {
      return path.join(toDir, treeNode.label)
    }

    this.$q.loading.show()

    const promises: Promise<void>[] = []
    for (const treeNode of treeNodes) {
      if (treeNode.nodeType === StorageNodeType.Dir) {
        const promise = this.storageLogic.moveDir(treeNode.value, toPath(treeNode)).catch(err => {
          console.error(err)
          showNotification(treeNode)
        }) as Promise<void>
        promises.push(promise)
      } else if (treeNode.nodeType === StorageNodeType.File) {
        const promise = this.storageLogic.moveFile(treeNode.value, toPath(treeNode)).catch(err => {
          console.error(err)
          showNotification(treeNode)
        }) as Promise<void>
        promises.push(promise)
      }
    }
    await Promise.all(promises)

    // ツリービューでノードの移動を実施
    for (const treeNode of treeNodes) {
      this.treeStore.moveNode(treeNode.value, toPath(treeNode))
    }

    // 移動対象ノードの祖先を展開
    this.m_openParentNode(treeNodes[0].value)
    // 移動対象の親ノードを選択状態に設定
    this.treeStore.selectedNode = treeNodes[0].parent! as StorageTreeNode
    // URLに選択ノードのパスを付与し、ページをリフレッシュ
    this.m_moveByRouter(this.treeStore.selectedNode.value)

    this.$q.loading.hide()
  }

  /**
   * ノードのリネームを行います。
   * @param treeNode リネームするツリーノード
   * @param newName ノードの新しい名前
   */
  private async m_renameNode(treeNode: StorageTreeNode, newName: string): Promise<void> {
    this.$q.loading.show()

    try {
      if (treeNode.nodeType === StorageNodeType.Dir) {
        await this.storageLogic.renameDir(treeNode.value, newName)
      } else if (treeNode.nodeType === StorageNodeType.File) {
        await this.storageLogic.renameFile(treeNode.value, newName)
      }
    } catch (err) {
      this.$q.loading.hide()
      console.error(err)
      this.$q.notify({
        icon: 'report',
        position: 'bottom-left',
        message: String(this.$t('storage.rename.renamingError', { nodeName: treeNode.label })),
        timeout: 0,
        actions: [{ icon: 'close', color: 'white' }],
      })
      return
    }

    // ツリービューでノードのリネームを実施
    this.treeStore.renameNode(treeNode.value, newName)

    // リネーム対象の親ノードを選択状態に設定
    this.treeStore.selectedNode = treeNode.parent! as StorageTreeNode
    // URLに選択ノードのパスを付与し、ページをリフレッシュ
    this.m_moveByRouter(this.treeStore.selectedNode.value)

    this.$q.loading.hide()
  }

  /**
   * ノードの共有設定を行います。
   * @param treeNodes 共有設定するツリーノード
   * @param settings 共有設定の内容
   */
  private async m_setShareSettings(treeNodes: StorageTreeNode[], settings: StorageNodeShareSettings): Promise<void> {
    const showNotification = (treeNode: StorageTreeNode) => {
      this.$q.notify({
        icon: 'report',
        position: 'bottom-left',
        message: String(this.$t('storage.share.sharingError', { nodeName: treeNode.label })),
        timeout: 0,
        actions: [{ icon: 'close', color: 'white' }],
      })
    }

    this.$q.loading.show()

    const promises: Promise<void>[] = []
    for (const treeNode of treeNodes) {
      if (treeNode.nodeType === StorageNodeType.Dir) {
        const promise = this.storageLogic.setDirShareSettings(treeNode.value, settings).catch(err => {
          console.error(err)
          showNotification(treeNode)
        }) as Promise<void>
        promises.push(promise)
      } else if (treeNode.nodeType === StorageNodeType.File) {
        const promise = this.storageLogic.setFileShareSettings(treeNode.value, settings).catch(err => {
          console.error(err)
          showNotification(treeNode)
        }) as Promise<void>
        promises.push(promise)
      }
    }
    await Promise.all(promises)

    // 現在の選択ノードでページをリフレッシュ
    this.m_moveByRouter(this.treeStore.selectedNode.value)

    this.$q.loading.hide()
  }

  /**
   * 指定ノードのパスをURLへ付与し、このノードをもとにページをリフレッシュします。
   * @param nodePath ノードパス
   */
  private m_moveByRouter!: (nodePath: string) => void

  private async m_moveByRouterFunc(nodePath: string) {
    this.storageRoute.move(nodePath)
    this.m_refreshPage(nodePath)
  }

  /**
   * 指定されたノードの祖先ノードを展開します。
   * @param nodePath
   */
  private m_openParentNode(nodePath: string): void {
    const treeNode = this.treeStore.getNode(nodePath)
    if (!treeNode || !treeNode.parent) return

    treeNode.parent.open()
    if (treeNode.parent) {
      this.m_openParentNode(treeNode.parent.value)
    }
  }

  /**
   * 指定ノードをツリービューの上下中央に位置するようスクロールします。
   * @param nodePath
   */
  private m_scrollToSelectedNode(nodePath: string): void {
    const treeNode = this.treeStore.getNode(nodePath)
    if (!treeNode) return

    // 本ページのグローバルな上位置を取得
    const globalTop = this.$el.getBoundingClientRect().top
    // ツリービューの現スクロール位置を取得
    const scrollTop = getScrollPosition(this.m_treeViewContainer)
    // 指定ノードの上位置を取得
    const nodeTop = treeNode.$el.getBoundingClientRect().top - globalTop

    // 指定ノードをツリービューの上下中央に位置するようスクロール(できるだけ)
    const newScrollY = scrollTop + nodeTop - this.m_treeViewContainer.clientHeight / 2
    setScrollPosition(this.m_treeViewContainer, newScrollY, 300)

    // console.log(
    //   JSON.stringify(
    //     {
    //       scrollTop,
    //       nodeTop,
    //       'treeViewContainer.clientHeight / 2': this.m_treeViewContainer.clientHeight / 2,
    //       newScrollY,
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
   * 選択ノードがディレクトリに変更された際の処理を行います。
   * @param dirPath
   */
  private m_selectedNodeOnChangedToDir(dirPath: string): void {
    const dirNode = this.treeStore.getNode(dirPath)
    if (!dirNode) {
      throw new Error(`The specified node was not found: '${dirPath}'`)
    }
    this.treeStore.selectedNode = dirNode

    setTimeout(() => {
      this.m_scrollToSelectedNode(dirPath)
    }, 250)
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
    this.m_selectedNodeOnChangedToDir(dirPath)
  }

  /**
   * ディレクトリビューでディレクトリが選択された際のリスナです。
   * @param dirPath
   */
  private async m_dirViewOnDirSelected(dirPath: string) {
    this.m_selectedNodeOnChangedToDir(dirPath)
  }

  /**
   * ディレクトリビューでファイルが選択された際のリスナです。
   * @param filePath
   */
  private m_dirViewOnFileSelected(filePath: string) {}

  /**
   * アップロード進捗フロートでアップロードが終了した際のハンドラです。
   * @param uploadDirPath アップロード先のディレクトリパス
   */
  private async m_uploadProgressFloatOnUploadEnded(uploadDirPath: string) {
    const uploadDirNode = this.treeStore.getNode(uploadDirPath)!
    uploadDirNode.open()
    this.m_openParentNode(uploadDirNode.value)

    await this.treeStore.pullNodes()
    this.m_moveByRouter(uploadDirPath)
  }

  //--------------------------------------------------
  //  ツリービュー
  //--------------------------------------------------

  /**
   * ツリービューでノードが選択された際のリスナです。
   * @param node
   */
  private async m_treeViewOnSelected(node: StorageTreeNode) {
    this.m_moveByRouter(node.value)
  }

  /**
   * ツリービューのノードコンテキストメニューでリロードが選択された際のリスナです。
   */
  private async m_treeViewOnReloadSelected() {
    await this.treeStore.pullNodes()
  }

  /**
   * ツリービューのノードコンテキストメニューでフォルダの作成が選択された際のリスナです。
   * @param dirNodePath
   */
  private async m_treeViewOnCreateDirSelected(dirNodePath: string) {
    const dirNode = this.treeStore.getNode(dirNodePath)!
    const dirPath = await this.m_dirCreateDialog.open(dirNode)
    if (dirPath) {
      await this.m_createDir(dirPath)
    }
  }

  /**
   * ツリービューのノードコンテキストメニューでファイルのアップロードが選択された際のリスナです。
   * @param dirNodePath
   */
  private async m_treeViewOnFilesUploadSelected(dirNodePath: string) {
    this.m_uploadProgressFloat.openFilesSelectDialog(dirNodePath)
  }

  /**
   * ツリービューのノードコンテキストメニューでフォルダのアップロードが選択された際のリスナです。
   * @param dirNodePath
   */
  private async m_treeViewOnDirUploadSelected(dirNodePath: string) {
    this.m_uploadProgressFloat.openDirSelectDialog(dirNodePath)
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
