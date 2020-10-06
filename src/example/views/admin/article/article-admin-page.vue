<style lang="sass" scoped>
@import 'src/example/styles/app.variables'

.article-admin-page-main
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
  <div class="article-admin-page-main">
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
            <article-admin-dir-view ref="dirView" class="dir-view flex-1" :storage-type="storageType" />
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
import { ArticleStorageLogic, StorageNode, StorageNodeType, StorageType } from '@/example/logic'
import { CompStorageUploadProgressFloat, CompTreeViewEvent } from '@/example/components'
import { Component, Prop } from 'vue-property-decorator'
import ArticleAdminDirView from './article-admin-dir-view.vue'
import { BaseStoragePage } from '../../base/storage'
import StorageDirCreateDialog from '../../base/storage/storage-dir-create-dialog.vue'
import StorageDirDetailView from '../../base/storage/storage-dir-detail-view.vue'
import StorageDirPathBreadcrumb from '../../base/storage/storage-dir-path-breadcrumb.vue'
import StorageFileDetailView from '../../base/storage/storage-file-detail-view.vue'
import StorageNodeMoveDialog from '../../base/storage/storage-node-move-dialog.vue'
import StorageNodeRemoveDialog from '../../base/storage/storage-node-remove-dialog.vue'
import StorageNodeRenameDialog from '../../base/storage/storage-node-rename-dialog.vue'
import StorageNodeShareDialog from '../../base/storage/storage-node-share-dialog.vue'
import StorageTreeNode from '../../base/storage/storage-tree-node.vue'
import StorageTreeView from '../../base/storage/storage-tree-view.vue'

@Component({
  components: {
    ArticleAdminDirView,
    CompStorageUploadProgressFloat,
    StorageDirCreateDialog,
    StorageDirDetailView,
    StorageDirPathBreadcrumb,
    StorageFileDetailView,
    StorageNodeMoveDialog,
    StorageNodeRemoveDialog,
    StorageNodeRenameDialog,
    StorageNodeShareDialog,
    StorageTreeView,
  },
})
export default class ArticleAdminPage extends BaseStoragePage {
  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  @Prop({ default: 'article' })
  storageType!: StorageType

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  protected readonly storageLogic!: ArticleStorageLogic

  protected treeNodeFilter = (node: StorageNode) => {
    return true // ツリーに全てのノードを表示
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  protected async treeViewOnSelect(e: CompTreeViewEvent<StorageTreeNode>) {
    const selectedNode = e.node

    switch (selectedNode.nodeType) {
      case StorageNodeType.Dir: {
        // 選択ノードのパスをURLに付与
        this.changeDirOnPage(selectedNode.path)
        break
      }
      case StorageNodeType.File: {
        if (this.isArticleFile(selectedNode)) {
          console.log(selectedNode)
        } else {
          this.showNodeDetail(selectedNode.path)
          if (this.dirView.targetDir) {
            this.treeView.setSelectedNode(this.dirView.targetDir.path, true, true)
          }
        }
        break
      }
    }

    // 選択ノードまでスクロールするフラグが立っている場合
    if (this.needScrollToSelectedNode) {
      // 選択されたノードの祖先を展開（アニメーションなし）
      this.openParentNode(selectedNode.path, false)
      // 選択ノードの位置までスクロールする
      this.scrollToSelectedNode(selectedNode.path, true)

      this.needScrollToSelectedNode = false
    }
  }
}
</script>
