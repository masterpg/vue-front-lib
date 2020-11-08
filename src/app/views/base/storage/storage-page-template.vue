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
  <div ref="el" class="StoragePage">
    <q-splitter v-model="splitterModel" unit="px" class="splitter">
      <template v-slot:before>
        <div ref="treeViewContainer" class="tree-view-container">
          <TreeView
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
          <StorageDirPathBreadcrumb
            ref="pathDirBreadcrumb"
            :storage-type="storageType"
            @select="pathDirBreadcrumbOnSelect($event)"
            @node-action="popupMenuOnNodeAction($event)"
          />
          <div class="view-container layout horizontal flex-1">
            <StorageDirView
              ref="dirView"
              class="dir-view flex-1"
              :storage-type="storageType"
              @select="dirViewOnSelect($event)"
              @deep-select="dirViewOnDeepSelect($event)"
              @node-action="popupMenuOnNodeAction($event)"
            />
          </div>
        </div>
      </template>
    </q-splitter>

    <StorageDirCreateDialog ref="dirCreateDialog" :storage-type="storageType" />
    <StorageNodeMoveDialog ref="nodeMoveDialog" :storage-type="storageType" />
    <StorageNodeRemoveDialog ref="nodeRemoveDialog" :storage-type="storageType" />
    <StorageNodeShareDialog ref="nodeShareDialog" :storage-type="storageType" />

    <StorageUploadProgressFloat
      ref="uploadProgressFloat"
      class="fixed-bottom-right"
      :storage-type="storageType"
      @upload-ends="uploadProgressFloatOnUploadEnds($event)"
    />
  </div>
</template>
