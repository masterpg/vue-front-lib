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
  --comp-tree-node-distance: 10px
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
    <storage-nodes-remove-dialog ref="nodesRemoveDialog" />
    <comp-storage-upload-progress-float ref="uploadProgressFloat" class="fixed-bottom-right" @upload-ended="m_uploadProgressFloatOnUploadEnded()" />
  </div>
</template>

<script lang="ts">
import {
  BaseComponent,
  ChildrenSortFunc,
  CompStorageUploadProgressFloat,
  CompTreeNode,
  CompTreeNodeItem,
  CompTreeView,
  NoCache,
  Resizable,
  StorageNode,
  StorageNodeType,
  User,
} from '@/lib'
import { Component } from 'vue-property-decorator'
import StorageDirCreateDialog from '@/example/views/demo/storage/storage-dir-create-dialog.vue'
import StorageNodesRemoveDialog from '@/example/views/demo/storage/storage-nodes-remove-dialog.vue'
import StorageTreeNodeItem from '@/example/views/demo/storage/storage-tree-node-item.vue'
import { mixins } from 'vue-class-component'
import { router } from '@/example/router'
import { storageTreeStore } from '@/example/views/demo/storage/storage-tree-store'

@Component({
  components: { CompTreeView, CompTreeNode, CompTreeNodeItem, StorageDirCreateDialog, StorageNodesRemoveDialog, CompStorageUploadProgressFloat },
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
    this.m_treeView.addChild(storageTreeStore.rootNode)

    if (this.$logic.auth.user.isSignedIn) {
      // 一旦ツリービューが構築されている場合
      if (storageTreeStore.initialized) {
        this.m_buildStorageTree()
      }
      // まだツリービューが構築されていない場合
      else {
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
    await this.$logic.storage.pullUserNodes()
    this.m_buildStorageTree()
  }

  private async m_buildStorageTree(): Promise<void> {
    const sortFunc: ChildrenSortFunc = (a: CompTreeNode<StorageTreeNodeItem>, b: CompTreeNode<StorageTreeNodeItem>) => {
      if (a.item.nodeType === StorageNodeType.Dir && b.item.nodeType === StorageNodeType.File) {
        return -1
      } else if (a.item.nodeType === StorageNodeType.File && b.item.nodeType === StorageNodeType.Dir) {
        return 1
      }
      if (a.label < b.label) {
        return -1
      } else if (a.label > b.label) {
        return 1
      } else {
        return 0
      }
    }

    // ツリーにはあるがロジックには存在しないノードをツリーから削除
    const nodeMap = this.$logic.storage.getNodeMap()
    for (const treeNode of storageTreeStore.nodes) {
      // ツリーのルートノードはロジックには存在しないので無視
      if (treeNode === storageTreeStore.rootNode) continue

      if (!nodeMap[treeNode.value]) {
        storageTreeStore.removeNode(treeNode.value)
        this.m_treeView.removeNode(treeNode.value)
      }
    }

    // ロジックのノードをツリー用のノードデータへ反映
    storageTreeStore.setNodes(this.$logic.storage.nodes)

    // ツリーを構築
    for (const nodeData of storageTreeStore.nodes) {
      const node = this.m_treeView.getNode(nodeData.value)
      if (node) {
        node.setNodeData(nodeData)
      } else {
        this.m_treeView.addChild(nodeData, {
          parent: nodeData.parent || storageTreeStore.rootNode.value,
          sortFunc,
        })
      }
    }
  }

  private async m_createDir(dirPath: string): Promise<void> {
    this.$q.loading.show()

    let nodes: StorageNode[]
    try {
      nodes = await this.$logic.storage.createUserStorageDirs([dirPath])
    } catch (err) {
      this.$q.loading.hide()
      console.error(err)
      this.$q.notify({
        icon: 'report',
        position: 'bottom-left',
        message: String(this.$t('storage.creationFolderFailed')),
        timeout: 0,
        actions: [{ icon: 'close', color: 'white' }],
      })
      return
    }

    storageTreeStore.setNodes(nodes)
    this.m_buildStorageTree()

    this.$q.loading.hide()
  }

  private async m_removeNode(node: CompTreeNode<StorageTreeNodeItem>): Promise<void> {
    this.$q.loading.show()

    let nodes!: StorageNode[]
    try {
      if (node.item.nodeType === StorageNodeType.File) {
        nodes = await this.$logic.storage.removeUserStorageFiles([node.value])
      } else if (node.item.nodeType === StorageNodeType.Dir) {
        nodes = await this.$logic.storage.removeUserStorageDirs([node.value])
      }
    } catch (err) {
      this.$q.loading.hide()
      console.error(err)
      this.$q.notify({
        icon: 'report',
        position: 'bottom-left',
        message: String(this.$t('storage.deletionItemsFailed')),
        timeout: 0,
        actions: [{ icon: 'close', color: 'white' }],
      })
      return
    }

    storageTreeStore.removeNodes(nodes.map(node => node.path))
    for (const node of nodes) {
      this.m_treeView.removeNode(node.path)
    }

    this.$q.loading.hide()
  }

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------

  private async m_userOnSignedIn(user: User) {
    console.log('m_userOnSignedIn')
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

  private async m_treeViewOnFilesUploadSelected(dirNode: CompTreeNode<StorageTreeNodeItem>) {
    this.m_uploadProgressFloat.openFilesSelectDialog(dirNode.value)
  }

  private async m_treeViewOnDirUploadSelected(dirNode: CompTreeNode<StorageTreeNodeItem>) {
    this.m_uploadProgressFloat.openDirSelectDialog(dirNode.value)
  }

  private async m_treeViewOnCreateDirSelected(node: CompTreeNode<StorageTreeNodeItem>) {
    const dirPath = await this.m_dirCreateDialog.open(node)
    if (dirPath) {
      await this.m_createDir(dirPath)
    }
  }

  private async m_treeViewOnDeleteSelected(node: CompTreeNode<StorageTreeNodeItem>) {
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
