<style lang="sass" scoped>
@import 'src/example/styles/app.variables'

.docs-admin-page
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
  <div class="docs-admin-page">
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
import {
  BaseStoragePage,
  StorageDirCreateDialog,
  StorageDirPathBreadcrumb,
  StorageDirView,
  StorageFileDetailView,
  StorageNodeMoveDialog,
  StorageNodeRemoveDialog,
  StorageNodeRenameDialog,
  StorageNodeShareDialog,
  StorageTreeView,
  StorageType,
} from '../../base/storage'
import { CompStorageUploadProgressFloat, CompTreeView, StorageLogic } from '@/lib'
import { StorageRoute, router } from '@/example/router'
import { Component } from 'vue-property-decorator'

@Component({
  components: {
    CompStorageUploadProgressFloat,
    CompTreeView,
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
export default class DocsAdminPage extends BaseStoragePage {
  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  get storageType(): StorageType {
    return 'docs'
  }

  get storageLogic(): StorageLogic {
    return this.$logic.docsStorage
  }

  get storageRoute(): StorageRoute {
    return router.views.admin.docs
  }
}
</script>
