<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.StoragePage
  height: 100%

.splitter
  height: 100%

.tree-view-container
  width: 100%
  height: 100%
  overflow: auto

.tree-view
  //--tree-view-font-size: 26px
  //--tree-node-indent: 20px

.content-container
  height: 100%

.view-container
  overflow: hidden

.dir-view
  overflow: hidden

.node-detail-view
  width: 320px !important
</style>

<template>
  <div ref="el" class="StoragePage">
    <q-splitter v-model="splitterModel" unit="px" class="splitter" :limits="[0, Infinity]">
      <template v-slot:before>
        <div ref="treeViewContainer" class="tree-view-container">
          <tree-view
            ref="treeViewRef"
            class="tree-view"
            @select="treeViewOnSelect($event)"
            @lazy-load="treeViewOnLazyLoad($event)"
            @node-action="popupMenuOnNodeAction"
          />
        </div>
      </template>
      <template v-slot:after>
        <div class="content-container layout vertical">
          <storage-dir-path-breadcrumb
            ref="pathDirBreadcrumb"
            :storage-type="storageType"
            @select="pathDirBreadcrumbOnSelect($event)"
            @node-action="popupMenuOnNodeAction($event)"
            @toggle-drawer="pathDirBreadcrumbOnToggleDrawer"
          />
          <div class="view-container layout horizontal flex-1">
            <storage-dir-view
              ref="dirView"
              class="dir-view flex-1"
              :storage-type="storageType"
              @select="dirViewOnSelect($event)"
              @deep-select="dirViewOnDeepSelect($event)"
              @node-action="popupMenuOnNodeAction($event)"
            />
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

    <storage-upload-progress-float
      ref="uploadProgressFloat"
      class="fixed-bottom-right"
      :storage-type="storageType"
      @upload-ends="uploadProgressFloatOnUploadEnds($event)"
    />
  </div>
</template>
