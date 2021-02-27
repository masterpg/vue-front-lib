<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.StoragePage
  height: 100%
  position: relative

.page-layout
  height: 100%
  // quasarが設定するmin-heightを無効化
  min-height: unset !important

.node-detail-container
  height: 100%
  padding: 16px
  .node-detail-view
    height: 100%

.page-container
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
        // パンくずを固定してスクロールさせないために必要
        overflow: hidden
        .dir-view
          // ディレクトリビューの横スクロールさせるために必要
          overflow: hidden
</style>

<template>
  <div class="StoragePage">
    <q-layout v-show="isSignedIn" class="page-layout" view="hHh lpr fff">
      <q-drawer v-model="visibleDetailDrawer" side="right" :width="320" overlay elevated>
        <div class="node-detail-container">
          <StorageDirDetailView
            v-show="visibleDirDetailView"
            ref="dirDetailView"
            class="node-detail-view"
            :storage-type="storageType"
            @close="nodeDetailViewOnClose"
          />
          <StorageFileDetailView
            v-show="visibleFileDetailView"
            ref="fileDetailView"
            class="node-detail-view"
            :storage-type="storageType"
            @close="nodeDetailViewOnClose"
          />
        </div>
      </q-drawer>

      <q-page-container ref="pageContainer" class="page-container">
        <q-splitter v-model="splitterModel" unit="px" class="splitter" :limits="[0, Infinity]">
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
                @toggle-drawer="pathDirBreadcrumbOnToggleDrawer"
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
      </q-page-container>

      <StorageDirCreateDialog ref="dirCreateDialog" :storage-type="storageType" />
      <StorageNodeMoveDialog ref="nodeMoveDialog" :storage-type="storageType" />
      <StorageNodeRenameDialog ref="nodeRenameDialog" :storage-type="storageType" />
      <StorageNodeRemoveDialog ref="nodeRemoveDialog" :storage-type="storageType" />
      <StorageNodeShareDialog ref="nodeShareDialog" :storage-type="storageType" />

      <StorageUploadProgressFloat
        ref="uploadProgressFloat"
        class="fixed-bottom-right"
        :storage-type="storageType"
        @upload-ends="uploadProgressFloatOnUploadEnds($event)"
      />
    </q-layout>

    <q-inner-loading :showing="isSigningIn">
      <q-spinner size="50px" color="primary" />
    </q-inner-loading>
  </div>
</template>
