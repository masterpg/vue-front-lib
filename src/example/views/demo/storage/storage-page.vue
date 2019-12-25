import * as _path from "path"
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
  /*--comp-tree-view-font-size: 26px*/
  /*--comp-tree-node-indent: 20px*/
</style>

<template>
  <div class="container">
    <q-splitter v-model="m_splitterModel" class="splitter">
      <template v-slot:before>
        <div class="tree-view-container">
          <comp-tree-view
            ref="treeView"
            class="tree-view"
            @selected="m_treeViewOnSelected($event)"
            @reload-selected="m_treeViewOnReloadSelected()"
            @create-dir-selected="m_treeViewOnCreateDirSelected($event)"
            @files-upload-selected="m_treeViewOnFilesUploadSelected($event)"
            @dir-upload-selected="m_treeViewOnDirUploadSelected($event)"
            @move-selected="m_treeViewOnMoveSelected($event)"
            @rename-selected="m_treeViewOnRenameSelected($event)"
            @delete-selected="m_treeViewOnDeleteSelected($event)"
          />
        </div>
      </template>
      <template v-slot:after>
        <storage-dir-view ref="dirView" />
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
      @upload-ended="m_uploadProgressFloatOnUploadEnded()"
    />
  </div>
</template>

<script lang="ts">
import * as path from 'path'
import { BaseComponent, CompStorageUploadProgressFloat, CompTreeNode, CompTreeView, NoCache, Resizable, StorageNodeType, User } from '@/lib'
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
import { storageTreeStore } from '@/example/views/demo/storage/storage-tree-store'
const { getScrollPosition, setScrollPosition } = scroll

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

  async mounted() {
    storageTreeStore.init(this.m_treeView)

    // URLに選択ノードのパスがなく、かつページに選択ノードのパスが保存されていた場合
    // 補足: 本ページから別ページに遷移し、その後本ページに戻ってきた場合がこの状況に当たる
    const urlNodePath = router.views.demo.storage.getNodePath()
    if (!urlNodePath && StoragePage.m_selectedNodePath) {
      // ページに保存されていた選択ノードのパスをURLへ反映
      router.views.demo.storage.move(StoragePage.m_selectedNodePath)
      return
    }

    await this.m_setupPage()
  }

  async created() {
    this.$logic.auth.addSignedInListener(this.m_userOnSignedIn)
  }

  destroyed() {
    this.$logic.auth.removeSignedInListener(this.m_userOnSignedIn)
  }

  /**
   * ユーザーがサインインした際のリスナです。
   * @param user
   */
  private async m_userOnSignedIn(user: User) {
    await this.m_setupPage()
  }

  async beforeRouteUpdate(to: Route, from: Route, next: (to?: RawLocation | false | ((vm: Vue) => any) | void) => void) {
    next()
    await this.m_setupPage()
  }

  /**
   * 本ページのセットアップを行います。
   */
  private async m_setupPage(): Promise<void> {
    // ルーターのパスが本ページのパスと一致しない場合
    if (!router.views.demo.storage.matchCurrentRoute()) return
    // ユーザーがサインインしていない場合
    if (!this.$logic.auth.user.isSignedIn) return

    // まだツリービューが構築されていない場合
    if (!storageTreeStore.initialized) {
      // サーバーからストレージノードを取得
      await this.m_pullStorageNodes()
    }

    // ツリービューの構築
    this.m_buildTreeView()

    // URLから選択ノードを取得
    const nodePath = router.views.demo.storage.getNodePath()
    // ツリーの選択ノード設定
    this.m_selectTreeNode(nodePath)
    // ディレクトリビューのディレクトリパス設定
    this.m_dirView.setDirPath(nodePath)

    // 現在の選択ノードを保存
    StoragePage.m_selectedNodePath = nodePath
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private static m_selectedNodePath = ''

  private m_splitterModel = 30

  private m_filePath: string = ''

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

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

  private async m_pullStorageNodes(): Promise<void> {
    await this.$logic.userStorage.pullNodes()
  }

  private async m_buildTreeView(): Promise<void> {
    // ロジックストアにないのにツリーには存在するノードを削除
    const storeNodeMap = this.$logic.userStorage.getNodeMap()
    for (const treeNode of storageTreeStore.getAllNodes()) {
      // ツリーのルートノードはロジックには存在しないので無視
      if (treeNode === storageTreeStore.rootNode) continue

      const storeNode = storeNodeMap[treeNode.value]
      if (!storeNode) {
        storageTreeStore.removeNode(treeNode.value)
      }
    }

    // ロジックのノードをツリービューに反映
    storageTreeStore.setNodes(this.$logic.userStorage.nodes)
  }

  /**
   * ディレクトリの作成を行います。
   * @param dirPath 作成するディレクトリのパス
   */
  private async m_createDir(dirPath: string): Promise<void> {
    this.$q.loading.show()

    try {
      await this.$logic.userStorage.createDirs([dirPath])
    } catch (err) {
      this.$q.loading.hide()
      console.error(err)
      this.$q.notify({
        icon: 'report',
        position: 'bottom-left',
        message: String(this.$t('storage.creationNodeFailed', { nodeType: String(this.$t('common.folder')) })),
        timeout: 0,
        actions: [{ icon: 'close', color: 'white' }],
      })
      return
    }

    await this.m_setupPage()

    this.$q.loading.hide()
  }

  /**
   * ノードの削除を行います。
   * @param treeNode 削除するツリーノード
   */
  private async m_removeNode(treeNode: StorageTreeNode): Promise<void> {
    this.$q.loading.show()

    try {
      if (treeNode.nodeType === StorageNodeType.Dir) {
        await this.$logic.userStorage.removeDirs([treeNode.value])
      } else if (treeNode.nodeType === StorageNodeType.File) {
        await this.$logic.userStorage.removeFiles([treeNode.value])
      }
    } catch (err) {
      this.$q.loading.hide()
      console.error(err)
      this.$q.notify({
        icon: 'report',
        position: 'bottom-left',
        message: String(this.$t('storage.deletionNodeFailed', { nodeType: treeNode.nodeTypeName })),
        timeout: 0,
        actions: [{ icon: 'close', color: 'white' }],
      })
      return
    }

    await this.m_setupPage()

    this.$q.loading.hide()
  }

  /**
   * ノードの移動を行います。
   * @param treeNode 移動するツリーノード
   * @param toDir 移動先のディレクトリパス
   */
  private async m_moveNode(treeNode: StorageTreeNode, toDir: string): Promise<void> {
    this.$q.loading.show()

    // 移動先パスを生成
    // 'home/photos' → 'home/archives/photos'
    // 'photos/family.png' → 'home/archives/family.png'
    const toPath = path.join(toDir, treeNode.label)

    try {
      if (treeNode.nodeType === StorageNodeType.Dir) {
        await this.$logic.userStorage.moveDir(treeNode.value, toPath)
      } else if (treeNode.nodeType === StorageNodeType.File) {
        await this.$logic.userStorage.moveFile(treeNode.value, toPath)
      }
    } catch (err) {
      this.$q.loading.hide()
      console.error(err)
      this.$q.notify({
        icon: 'report',
        position: 'bottom-left',
        message: String(this.$t('storage.moveNodeFailed', { nodeType: treeNode.nodeTypeName })),
        timeout: 0,
        actions: [{ icon: 'close', color: 'white' }],
      })
      return
    }

    storageTreeStore.moveNode(treeNode.value, toPath)
    await this.m_setupPage()

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
        message: String(this.$t('storage.renameNodeFailed', { nodeType: treeNode.nodeTypeName })),
        timeout: 0,
        actions: [{ icon: 'close', color: 'white' }],
      })
      return
    }

    storageTreeStore.renameNode(treeNode.value, newName)
    await this.m_setupPage()

    this.$q.loading.hide()
  }

  /**
   * 指定されたノードを選択状態にします。
   * また祖先ノードを展開状態にします。
   */
  private m_selectTreeNode(nodePath: string): void {
    const openParentNode = (dirNode: CompTreeNode) => {
      if (!dirNode.parent) return
      dirNode.parent.open()
      openParentNode(dirNode.parent)
    }

    const dirNode = storageTreeStore.getNode(nodePath)
    if (!dirNode) return

    this.m_treeView.selectedNode = dirNode
    openParentNode(dirNode)
  }

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------

  private async m_refreshStorageButtonOnClick() {
    await this.m_pullStorageNodes()
    await this.m_setupPage()
  }

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

  private m_treeViewOnSelected(node: StorageTreeNode) {
    // const num = node.$el.getBoundingClientRect().top - this.$el.getBoundingClientRect().top
    // console.log(`num: ${num}, node: ${node.$el.getBoundingClientRect().top}, top: ${this.$el.getBoundingClientRect().top}`)
    // setScrollPosition(this.m_treeView.$el.parentElement!, num)

    // this.m_dirView.setDir(node.value)

    router.views.demo.storage.move(node.value)
  }

  private async m_treeViewOnReloadSelected() {
    await this.m_pullStorageNodes()
    await this.m_setupPage()
  }

  private async m_treeViewOnFilesUploadSelected(dirNode: StorageTreeNode) {
    this.m_uploadProgressFloat.openFilesSelectDialog(dirNode.value)
  }

  private async m_treeViewOnDirUploadSelected(dirNode: StorageTreeNode) {
    this.m_uploadProgressFloat.openDirSelectDialog(dirNode.value)
  }

  private async m_treeViewOnCreateDirSelected(node: StorageTreeNode) {
    const dirPath = await this.m_dirCreateDialog.open(node)
    if (dirPath) {
      await this.m_createDir(dirPath)
    }
  }

  private async m_treeViewOnMoveSelected(node: StorageTreeNode) {
    const toDir = await this.m_nodeMoveDialog.open(node)
    if (typeof toDir === 'string') {
      await this.m_moveNode(node, toDir)
    }
  }

  private async m_treeViewOnRenameSelected(node: StorageTreeNode) {
    const newName = await this.m_nodeRenameDialog.open(node)
    if (newName) {
      await this.m_renameNode(node, newName)
    }
  }

  private async m_treeViewOnDeleteSelected(node: StorageTreeNode) {
    const confirmed = await this.m_nodesRemoveDialog.open([node])
    if (confirmed) {
      await this.m_removeNode(node)
    }
  }

  private async m_uploadProgressFloatOnUploadEnded() {
    await this.m_pullStorageNodes()
    await this.m_setupPage()
  }
}
</script>
