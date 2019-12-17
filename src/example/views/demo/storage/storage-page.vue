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

.tree-view
  height: 100%
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
        <div class="app-ma-20">
          <div class="layout horizontal center">
            <q-input v-model="m_filePath" class="flex" label="File URL" />
            <q-btn label="Load" color="primary" class="app-ml-10" @click="m_loadFileButtonOnClick()" />
            <q-btn label="Refresh" color="primary" icon="storage" class="app-ml-10" @click="m_refreshStorageButtonOnClick()" />
          </div>
          <img ref="img" class="app-mt-20" crossorigin="anonymous" />
        </div>
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
import {
  BaseComponent,
  CompStorageUploadProgressFloat,
  CompTreeNode,
  CompTreeNodeItem,
  CompTreeView,
  NoCache,
  Resizable,
  StorageNodeType,
  User,
} from '@/lib'
import { StorageTreeNode, storageTreeStore } from '@/example/views/demo/storage/storage-tree-store'
import { Component } from 'vue-property-decorator'
import StorageDirCreateDialog from '@/example/views/demo/storage/storage-dir-create-dialog.vue'
import StorageNodeMoveDialog from '@/example/views/demo/storage/storage-node-move-dialog.vue'
import StorageNodeRenameDialog from '@/example/views/demo/storage/storage-node-rename-dialog.vue'
import StorageNodesRemoveDialog from '@/example/views/demo/storage/storage-nodes-remove-dialog.vue'
import { mixins } from 'vue-class-component'
import { router } from '@/example/router'

@Component({
  components: {
    CompTreeView,
    CompTreeNode,
    CompTreeNodeItem,
    StorageDirCreateDialog,
    StorageNodeMoveDialog,
    StorageNodeRenameDialog,
    StorageNodesRemoveDialog,
    CompStorageUploadProgressFloat,
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
    storageTreeStore.init(this.m_treeView)
    if (this.$logic.auth.user.isSignedIn) {
      // 一旦ツリービューが構築されている場合
      if (storageTreeStore.initialized) {
        // 既に取得されたデータをもとに、ツリービューを構築
        this.m_buildTreeView()
      }
      // まだツリービューが構築されていない場合
      else {
        // サーバーからデータを取得し、ツリービューを構築
        await this.m_pullStorageNodes()
      }
    }
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

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
  private get m_uploadFileInput(): HTMLInputElement {
    return this.$refs.uploadFileInput as HTMLInputElement
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
    this.m_buildTreeView()
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

    this.m_buildTreeView()

    this.$q.loading.hide()
  }

  /**
   * ノードの削除を行います。
   * @param treeNode 削除するツリーノード
   */
  private async m_removeNode(treeNode: StorageTreeNode): Promise<void> {
    this.$q.loading.show()

    try {
      if (treeNode.item.nodeType === StorageNodeType.Dir) {
        await this.$logic.userStorage.removeDirs([treeNode.value])
      } else if (treeNode.item.nodeType === StorageNodeType.File) {
        await this.$logic.userStorage.removeFiles([treeNode.value])
      }
    } catch (err) {
      this.$q.loading.hide()
      console.error(err)
      this.$q.notify({
        icon: 'report',
        position: 'bottom-left',
        message: String(this.$t('storage.deletionNodeFailed', { nodeType: treeNode.item.nodeTypeName })),
        timeout: 0,
        actions: [{ icon: 'close', color: 'white' }],
      })
      return
    }

    this.m_buildTreeView()

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
      if (treeNode.item.nodeType === StorageNodeType.Dir) {
        await this.$logic.userStorage.moveDir(treeNode.value, toPath)
      } else if (treeNode.item.nodeType === StorageNodeType.File) {
        await this.$logic.userStorage.moveFile(treeNode.value, toPath)
      }
    } catch (err) {
      this.$q.loading.hide()
      console.error(err)
      this.$q.notify({
        icon: 'report',
        position: 'bottom-left',
        message: String(this.$t('storage.moveNodeFailed', { nodeType: treeNode.item.nodeTypeName })),
        timeout: 0,
        actions: [{ icon: 'close', color: 'white' }],
      })
      return
    }

    storageTreeStore.moveNode(treeNode.value, toPath)
    this.m_buildTreeView()

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
      if (treeNode.item.nodeType === StorageNodeType.Dir) {
        await this.$logic.userStorage.renameDir(treeNode.value, newName)
      } else if (treeNode.item.nodeType === StorageNodeType.File) {
        await this.$logic.userStorage.renameFile(treeNode.value, newName)
      }
    } catch (err) {
      this.$q.loading.hide()
      console.error(err)
      this.$q.notify({
        icon: 'report',
        position: 'bottom-left',
        message: String(this.$t('storage.renameNodeFailed', { nodeType: treeNode.item.nodeTypeName })),
        timeout: 0,
        actions: [{ icon: 'close', color: 'white' }],
      })
      return
    }

    storageTreeStore.renameNode(treeNode.value, newName)
    this.m_buildTreeView()

    this.$q.loading.hide()
  }

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------

  private async m_userOnSignedIn(user: User) {
    // ルーターのパスが本ページのパスと一致する場合
    if (router.currentRoute.path === router.views.demo.storage.path) {
      await this.m_pullStorageNodes()
    }
  }

  private async m_refreshStorageButtonOnClick() {
    await this.m_pullStorageNodes()
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

  private async m_treeViewOnReloadSelected() {
    await this.m_pullStorageNodes()
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
  }
}
</script>
