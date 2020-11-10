<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.ArticleStoragePage
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
  <div ref="el" class="ArticleStoragePage">
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
            <ArticleDirView
              ref="dirView"
              class="dir-view flex-1"
              :storage-type="storageType"
              @select="dirViewOnSelect($event)"
              @deep-select="dirViewOnDeepSelect($event)"
              @node-action="popupMenuOnNodeAction($event)"
            />
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
        </div>
      </template>
    </q-splitter>

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
  </div>
</template>

<script lang="ts">
import { StorageNode, StorageNodeType, StorageType } from '@/app/logic'
import { StoragePage, StoragePageLogic } from '@/app/views/base/storage'
import { ArticleDirView } from '@/app/views/site-admin/article/article-dir-view.vue'
import { defineComponent } from '@vue/composition-api'

namespace ArticleStoragePage {
  export const clazz = defineComponent({
    name: 'ArticleStoragePage',

    components: {
      ...StoragePage.components,
      ArticleDirView: ArticleDirView.clazz,
    },

    setup(props, ctx) {
      //----------------------------------------------------------------------
      //
      //  Variables
      //
      //----------------------------------------------------------------------

      const storageType: StorageType = 'article'

      const nodeFilter = (node: StorageNode) => {
        return true // ツリーに全てのノードを表示
      }

      const base = StoragePage.setup({ ctx, storageType, nodeFilter })

      const pageLogic = StoragePageLogic.getInstance(storageType)

      //----------------------------------------------------------------------
      //
      //  Internal methods
      //
      //----------------------------------------------------------------------

      base.treeViewOnSelect.value = async e => {
        const selectedNode = e.node

        switch (selectedNode.nodeType) {
          case StorageNodeType.Dir: {
            // 選択ノードのパスをURLに付与
            base.changeDirOnPage(selectedNode.path)
            break
          }
          case StorageNodeType.File: {
            if (pageLogic.isArticleFile(selectedNode)) {
              console.log(selectedNode)
            } else {
              base.showNodeDetail(selectedNode.path)
              if (base.dirView.value!.targetDir) {
                pageLogic.setSelectedTreeNode(base.dirView.value!.targetDir.path, true, true)
              }
            }
            break
          }
        }

        // 選択ノードまでスクロールするフラグが立っている場合
        if (base.needScrollToSelectedNode.value) {
          // 選択されたノードの祖先を展開（アニメーションなし）
          base.openParentNode(selectedNode.path, false)
          // 選択ノードの位置までスクロールする
          base.scrollToSelectedNode(selectedNode.path, true)

          base.needScrollToSelectedNode.value = false
        }
      }

      //----------------------------------------------------------------------
      //
      //  Result
      //
      //----------------------------------------------------------------------

      return { ...base }
    },
  })
}

export default ArticleStoragePage.clazz
</script>
