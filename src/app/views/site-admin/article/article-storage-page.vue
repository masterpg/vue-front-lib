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
            @select-change="treeViewOnSelectChange($event)"
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
              v-show="visibleDirView"
              :storage-type="storageType"
              @select="dirViewOnSelect($event)"
              @deep-select="dirViewOnDeepSelect($event)"
              @node-action="popupMenuOnNodeAction($event)"
            />
            <ArticleWritingView ref="writingView" v-show="visibleWritingView" class="flex-1" />
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
import { defineComponent, ref } from '@vue/composition-api'
import { ArticleDirView } from '@/app/views/site-admin/article/article-dir-view.vue'
import { ArticleWritingView } from '@/app/views/site-admin/article/article-writing-view.vue'
import { StorageTreeNode } from '@/app/views/base/storage/storage-tree-node.vue'
import { TreeViewSelectEvent } from '@/app/components/tree-view/base'

namespace ArticleStoragePage {
  export const clazz = defineComponent({
    name: 'ArticleStoragePage',

    components: {
      ...StoragePage.components,
      ArticleDirView: ArticleDirView.clazz,
      ArticleWritingView: ArticleWritingView.clazz,
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

      const writingView = ref<ArticleWritingView>()

      /**
       * ディレクトリビューの表示フラグです。
       */
      const visibleDirView = ref(true)

      /**
       * 記事編集ビューの表示フラグです。
       */
      const visibleWritingView = ref(false)

      //----------------------------------------------------------------------
      //
      //  Internal methods
      //
      //----------------------------------------------------------------------

      base.changeDir.value = nodePath => {
        base.changeDir.super(nodePath)

        const node = pageLogic.sgetStorageNode({ path: nodePath })
        switch (node.nodeType) {
          case StorageNodeType.Dir: {
            // ディレクトリビューを表示
            showDirView()
            break
          }
          case StorageNodeType.File: {
            if (pageLogic.isArticleFile(node)) {
              // 記事編集ビューを表示
              showWritingView(node.path)
            }
            break
          }
        }
      }

      /**
       * ディレクトリビューを表示します。
       */
      function showDirView(): void {
        visibleDirView.value = true
        visibleWritingView.value = false
      }

      /**
       * 記事編集ビューを表示します。
       * @param nodePath
       */
      function showWritingView(nodePath: string): void {
        visibleDirView.value = false
        visibleWritingView.value = true
      }

      //----------------------------------------------------------------------
      //
      //  Event listeners
      //
      //----------------------------------------------------------------------

      base.treeViewOnSelect.value = async e => {
        const selectedNode = e.node
        const oldSelectedNode = e.oldNode

        // 選択ノードがファイルの場合
        if (selectedNode.nodeType === StorageNodeType.File) {
          // 選択ノードが｢記事ファイル｣の場合
          if (selectedNode.nodeType === StorageNodeType.File && pageLogic.isArticleFile(selectedNode)) {
            // 選択ノードのパスをURLに付与
            // ※記事編集ビューが表示されることになる
            base.changeDirOnPage(selectedNode.path)
          } else {
            // ファイル詳細ビューの表示
            base.showNodeDetail(selectedNode.path)
            // ツリーのファイルノードは選択状態にはしない
            // ※この時点ではファイルノードが選択されてしまっているので、
            //   前に選択されていたノードに選択を戻している
            oldSelectedNode && pageLogic.setSelectedTreeNode(oldSelectedNode.path, true, true)
          }
        }
        // 選択ノードが上記以外の場合
        else {
          // 選択ノードのパスをURLに付与
          base.changeDirOnPage(selectedNode.path)
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

      function treeViewOnSelectChange(e: TreeViewSelectEvent<StorageTreeNode>) {
        console.log(`new: '${e.node.label}', old: '${e.oldNode?.label}'`)
      }

      //----------------------------------------------------------------------
      //
      //  Result
      //
      //----------------------------------------------------------------------

      return {
        ...base,
        writingView,
        visibleDirView,
        visibleWritingView,
        treeViewOnSelectChange,
      }
    },
  })
}

export default ArticleStoragePage.clazz
</script>
