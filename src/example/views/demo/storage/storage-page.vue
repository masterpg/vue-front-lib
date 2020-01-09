<style lang="sass" scoped>
@import '../../../styles/app.variables'

.container
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
</style>

<template>
  <div class="container">
    <q-splitter v-model="m_splitterModel" class="splitter">
      <template v-slot:before>
        <div>nodeType: {{ m_selectedNodeType }}</div>
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
          />
        </div>
      </template>
      <template v-slot:after>
        <storage-dir-view
          ref="dirView"
          @dir-selected="m_dirViewOnDirSelected($event)"
          @file-selected="m_dirViewOnFileSelected($event)"
          @create-dir-selected="m_treeViewOnCreateDirSelected($event)"
          @files-upload-selected="m_treeViewOnFilesUploadSelected($event)"
          @dir-upload-selected="m_treeViewOnDirUploadSelected($event)"
          @move-selected="m_treeViewOnMoveSelected($event)"
          @rename-selected="m_treeViewOnRenameSelected($event)"
          @delete-selected="m_onDeleteSelected($event)"
        />
        <!--
        <div class="app-ma-20">
          <div class="layout horizontal center">
            <q-input v-model="m_filePath" class="flex" label="File URL" />
            <q-btn label="Load" color="primary" class="app-ml-10" @click="m_loadFileButtonOnClick()" />
            <q-btn label="Refresh" color="primary" icon="storage" class="app-ml-10" @click="m_refreshStorageButtonOnClick()" />
          </div>
          <img ref="img" class="app-mt-20" crossorigin="anonymous" />
        </div>
        -->
      </template>
    </q-splitter>
    <storage-dir-create-dialog ref="dirCreateDialog" />
    <storage-node-move-dialog ref="nodeMoveDialog" />
    <storage-node-rename-dialog ref="nodeRenameDialog" />
    <storage-nodes-remove-dialog ref="nodesRemoveDialog" />
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
import { BaseComponent, CompStorageUploadProgressFloat, CompTreeView, NoCache, Resizable, StorageNode, StorageNodeType, User } from '@/lib'
import { RawLocation, Route } from 'vue-router'
import { Component } from 'vue-property-decorator'
import StorageDirCreateDialog from '@/example/views/demo/storage/storage-dir-create-dialog.vue'
import StorageDirView from '@/example/views/demo/storage/storage-dir-view.vue'
import StorageNodeMoveDialog from '@/example/views/demo/storage/storage-node-move-dialog.vue'
import StorageNodeRenameDialog from '@/example/views/demo/storage/storage-node-rename-dialog.vue'
import StorageNodesRemoveDialog from '@/example/views/demo/storage/storage-nodes-remove-dialog.vue'
import StorageTreeNode from '@/example/views/demo/storage/storage-tree-node.vue'
import Vue from 'vue'
import { mixins } from 'vue-class-component'
import { router } from '@/example/router'
import { scroll } from 'quasar'
import { treeStore } from '@/example/views/demo/storage/storage-tree-store'
const { getScrollPosition, setScrollPosition } = scroll
const debounce = require('lodash/debounce')

/**
 * ページが初期化されたかを示すフラグです。
 */
let isPageInitialized: boolean = false

@Component({
  components: {
    CompStorageUploadProgressFloat,
    CompTreeView,
    StorageDirView,
    StorageDirCreateDialog,
    StorageNodeMoveDialog,
    StorageNodeRenameDialog,
    StorageNodesRemoveDialog,
  },
})
export default class StoragePage extends mixins(BaseComponent, Resizable) {
  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  async created() {
    this.$logic.auth.addSignedInListener(this.m_userOnSignedIn)
  }

  destroyed() {
    this.$logic.auth.removeSignedInListener(this.m_userOnSignedIn)
  }

  async mounted() {
    this.m_moveByRouter = debounce(this.m_moveByRouterFunc, 100)
    treeStore.init(this.m_treeView)

    // URLから選択ノードのパスを取得
    let nodePath = router.views.demo.storage.getNodePath()

    // URLから選択ノードのパスが取得された場合をそれを、取得されなかったら選択されていたノードを
    // パスに付与し、ページをリフレッシュ
    this.m_moveByRouter(nodePath || treeStore.selectedNode.value)
  }

  /**
   * ユーザーがサインインした際のリスナです。
   * @param user
   */
  private async m_userOnSignedIn(user: User) {
    const nodePath = router.views.demo.storage.getNodePath()
    await this.m_refreshPage(nodePath)
  }

  async beforeRouteUpdate(to: Route, from: Route, next: (to?: RawLocation | false | ((vm: Vue) => any) | void) => void) {
    next()

    // URLから選択ノードパスを取得(取得できなかった場合はルートノード)
    const selectedNodePath = router.views.demo.storage.getNodePath() || treeStore.rootNode.value
    // ノードの選択状態を設定
    this.m_selectNode(selectedNodePath)
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private m_splitterModel = 30

  private m_filePath: string = ''

  /**
   * ツリービューの縦スクロール位置が初期化されたか否かです。
   */
  private m_initializedScrollTop = false

  /**
   * 現在選択されているノードのノードタイプです。
   */
  private get m_selectedNodeType(): StorageNodeType {
    const nodeType = treeStore.selectedNode.nodeType
    if (nodeType === StorageNodeType.Dir || nodeType === 'Storage') {
      return StorageNodeType.Dir
    } else {
      return StorageNodeType.File
    }
  }

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
  private get m_nodesRemoveDialog(): StorageNodesRemoveDialog {
    return this.$refs.nodesRemoveDialog as StorageNodesRemoveDialog
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
  private async m_refreshPage(selectedNodePath?: string): Promise<void> {
    // ルーターのパスが本ページのパスと一致しない場合
    if (!router.views.demo.storage.matchCurrentRoute()) return
    // ユーザーがサインインしていない場合
    if (!this.$logic.auth.user.isSignedIn) return

    // まだページが初期化されていない場合
    if (!isPageInitialized) {
      isPageInitialized = true
      // サーバーからストレージノードを取得
      await this.m_pullStorageNodes()
    }

    // ツリービューの構築
    this.m_buildTreeView()

    // 引数でノードパスの指定がない場合
    if (typeof selectedNodePath !== 'string') {
      // 現在の選択ノードのパスを取得
      selectedNodePath = treeStore.selectedNode.value
    }

    // ノードの選択状態を設定
    this.m_selectNode(selectedNodePath)
  }

  /**
   * 指定されたノードを選択状態にします。
   * @param selectingNodePath 選択するノードのパス
   */
  private m_selectNode(selectingNodePath: string): void {
    const selectingNode = treeStore.getNode(selectingNodePath)
    if (selectingNode) {
      // 選択ノードを設定
      treeStore.selectedNode = selectingNode
      // 選択ノードの祖先ノードを展開
      this.m_openParentNode(selectingNode.value)
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
   * サーバーからストレージノード一覧を取得します。
   */
  private async m_pullStorageNodes(): Promise<void> {
    await this.$logic.userStorage.pullNodes()
  }

  /**
   * ロジックストアに格納されているストレージノード一覧をもとにツリービューを構築します。
   */
  private async m_buildTreeView(): Promise<void> {
    // ロジックストアにないのにツリーには存在するノードを削除
    const storeNodeMap = this.$logic.userStorage.getNodeMap()
    for (const treeNode of treeStore.getAllNodes()) {
      // ツリーのルートノードはロジックには存在しないので無視
      if (treeNode === treeStore.rootNode) continue

      const storeNode = storeNodeMap[treeNode.value]
      if (!storeNode) {
        treeStore.removeNode(treeNode.value)
      }
    }

    // ロジックのノードをツリービューに反映
    treeStore.setNodes(this.$logic.userStorage.nodes)
  }

  /**
   * ディレクトリの作成を行います。
   * @param dirPath 作成するディレクトリのパス
   */
  private async m_createDir(dirPath: string): Promise<void> {
    this.$q.loading.show()

    let dirNode: StorageNode
    try {
      dirNode = (await this.$logic.userStorage.createDirs([dirPath]))[0]
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
    treeStore.setNode(dirNode)

    // 作成したディレクトリの祖先を展開
    const dirTreeNode = treeStore.getNode(dirPath)!
    this.m_openParentNode(dirPath)

    // 作成したディレクトリの親ノードを選択状態に設定
    treeStore.selectedNode = dirTreeNode.parent! as StorageTreeNode
    // URLに選択ノードのパスを付与し、ページをリフレッシュ
    this.m_moveByRouter(treeStore.selectedNode.value)

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
        const promise = this.$logic.userStorage.removeDirs([treeNode.value]).catch(err => {
          console.error(err)
          showNotification(treeNode)
        }) as Promise<void>
        promises.push(promise)
      } else if (treeNode.nodeType === StorageNodeType.File) {
        const promise = this.$logic.userStorage.removeFiles([treeNode.value]).catch(err => {
          console.error(err)
          showNotification(treeNode)
        }) as Promise<void>
        promises.push(promise)
      }
    }
    await Promise.all(promises)

    // 親ノードを選択状態に設定
    treeStore.selectedNode = treeNodes[0].parent! as StorageTreeNode
    // URLに選択ノードのパスを付与し、ページをリフレッシュ
    this.m_moveByRouter(treeStore.selectedNode.value)

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
        const promise = this.$logic.userStorage.moveDir(treeNode.value, toPath(treeNode)).catch(err => {
          console.error(err)
          showNotification(treeNode)
        }) as Promise<void>
        promises.push(promise)
      } else if (treeNode.nodeType === StorageNodeType.File) {
        const promise = this.$logic.userStorage.moveFile(treeNode.value, toPath(treeNode)).catch(err => {
          console.error(err)
          showNotification(treeNode)
        }) as Promise<void>
        promises.push(promise)
      }
    }
    await Promise.all(promises)

    // ツリービューでノードの移動を実施
    for (const treeNode of treeNodes) {
      treeStore.moveNode(treeNode.value, toPath(treeNode))
    }

    // 移動対象ノードの祖先を展開
    this.m_openParentNode(treeNodes[0].value)
    // 移動対象の親ノードを選択状態に設定
    treeStore.selectedNode = treeNodes[0].parent! as StorageTreeNode
    // URLに選択ノードのパスを付与し、ページをリフレッシュ
    this.m_moveByRouter(treeStore.selectedNode.value)

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
        await this.$logic.userStorage.renameDir(treeNode.value, newName)
      } else if (treeNode.nodeType === StorageNodeType.File) {
        await this.$logic.userStorage.renameFile(treeNode.value, newName)
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
    treeStore.renameNode(treeNode.value, newName)

    // リネーム対象の親ノードを選択状態に設定
    treeStore.selectedNode = treeNode.parent! as StorageTreeNode
    // URLに選択ノードのパスを付与し、ページをリフレッシュ
    this.m_moveByRouter(treeStore.selectedNode.value)

    this.$q.loading.hide()
  }

  /**
   * 指定ノードのパスをURLへ付与し、このノードをもとにページをリフレッシュします。
   * @param nodePath ノードパス
   */
  private m_moveByRouter!: (nodePath: string) => void

  private async m_moveByRouterFunc(nodePath: string) {
    router.views.demo.storage.move(nodePath)
    await this.m_refreshPage(nodePath)
  }

  /**
   * 指定されたノードの祖先ノードを展開します。
   * @param nodePath
   */
  private m_openParentNode(nodePath: string): void {
    const treeNode = treeStore.getNode(nodePath)
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
    const treeNode = treeStore.getNode(nodePath)
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

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------

  private async m_loadFileButtonOnClick(e) {
    this.m_img.src = this.m_filePath

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
    await this.m_pullStorageNodes()
    await this.m_refreshPage()
  }

  /**
   * ツリービューのノードコンテキストメニューでフォルダの作成が選択された際のリスナです。
   * @param dirNodePath
   */
  private async m_treeViewOnCreateDirSelected(dirNodePath: string) {
    const dirNode = treeStore.getNode(dirNodePath)!
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
    const nodes = nodePaths.map(nodePath => treeStore.getNode(nodePath)!)
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
    const node = treeStore.getNode(nodePath)!
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
    const nodes = nodePaths.map(nodePath => treeStore.getNode(nodePath)!)
    const confirmed = await this.m_nodesRemoveDialog.open(nodes)
    if (confirmed) {
      await this.m_removeNodes(nodes)
    }
  }

  /**
   * ディレクトリビューでディレクトリが選択された際のリスナです。
   * @param dirPath
   */
  private async m_dirViewOnDirSelected(dirPath: string) {
    const dirNode = treeStore.getNode(dirPath)
    if (!dirNode) {
      throw new Error(`The specified node was not found: '${dirPath}'`)
    }
    treeStore.selectedNode = dirNode

    setTimeout(() => {
      this.m_scrollToSelectedNode(dirPath)
    }, 250)
  }

  /**
   * ディレクトリビューでファイルが選択された際のリスナです。
   * @param filePath
   */
  private m_dirViewOnFileSelected(filePath: string) {
    location.href = `${this.$logic.userStorage.baseURL}/${filePath}`
  }

  /**
   * アップロード進捗フロートでアップロードが終了した際のハンドラです。
   * @param uploadDirPath アップロード先のディレクトリパス
   */
  private async m_uploadProgressFloatOnUploadEnded(uploadDirPath: string) {
    const uploadDirNode = treeStore.getNode(uploadDirPath)!
    uploadDirNode.open()
    this.m_openParentNode(uploadDirNode.value)

    await this.m_pullStorageNodes()
    this.m_moveByRouter(uploadDirPath)
  }
}
</script>
