<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.ArticleStoragePage
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
  <div class="ArticleStoragePage">
    <transition appear enter-active-class="animated fadeIn" leave-active-class="animated fadeOut">
      <q-layout v-show="isSignedIn" class="page-layout" view="hHh lpr fff">
        <q-drawer v-model="visibleDetailDrawer" side="right" :width="320" overlay elevated>
          <div class="node-detail-container">
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
                <storage-dir-path-breadcrumb
                  ref="pathDirBreadcrumb"
                  :storage-type="storageType"
                  @select="pathDirBreadcrumbOnSelect($event)"
                  @node-action="popupMenuOnNodeAction($event)"
                  @toggle-drawer="pathDirBreadcrumbOnToggleDrawer"
                />
                <div class="view-container layout horizontal flex-1">
                  <article-dir-view
                    ref="dirView"
                    class="dir-view flex-1"
                    v-show="visibleDirView"
                    :storage-type="storageType"
                    @select="dirViewOnSelect($event)"
                    @deep-select="dirViewOnDeepSelect($event)"
                    @node-action="popupMenuOnNodeAction($event)"
                  />
                  <article-writing-view ref="writingView" v-show="visibleWritingView" class="flex-1" :storage-type="storageType" />
                </div>
              </div>
            </template>
          </q-splitter>
        </q-page-container>

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
      </q-layout>
    </transition>

    <q-inner-loading :showing="isSigningIn">
      <q-spinner size="50px" color="primary" />
    </q-inner-loading>
  </div>
</template>

<script lang="ts">
import { StoragePage, StoragePageService, StorageTreeNodeFilter } from '@/app/views/base/storage'
import { defineComponent, ref } from '@vue/composition-api'
import { ArticleDirView } from '@/app/views/site-admin/article/article-dir-view.vue'
import { ArticleWritingView } from '@/app/views/site-admin/article/article-writing-view.vue'
import { StorageType } from '@/app/services'

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

      const nodeFilter = StorageTreeNodeFilter.ArticleFilter

      const base = StoragePage.setup({ ctx, storageType, nodeFilter })

      const pageService = StoragePageService.getInstance(storageType)

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

        const node = pageService.getTreeNode({ path: nodePath }) ?? pageService.getRootTreeNode()
        switch (node.nodeType) {
          case 'Dir': {
            // ディレクトリビューを表示
            showDirView()
            break
          }
          case 'File': {
            if (node.article?.file?.type === 'Master') {
              // 記事編集ビューを表示
              showWritingView(node.dir)
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
       * @param articlePath
       */
      async function showWritingView(articlePath: string): Promise<void> {
        visibleDirView.value = false
        visibleWritingView.value = true

        await writingView.value!.load(articlePath)
      }

      base.clear.value = () => {
        base.clear.super()
        showDirView()
      }

      //----------------------------------------------------------------------
      //
      //  Event listeners
      //
      //----------------------------------------------------------------------

      base.treeViewOnSelect.value = async e => {
        const { node: selectedNode, oldNode: oldSelectedNode } = e

        // 選択ノードがファイルの場合
        if (selectedNode.nodeType === 'File') {
          // 選択ノードが｢記事ソースファイル｣の場合
          if (selectedNode.article?.file?.type === 'Master') {
            // 選択ノードのパスをURLに付与
            // ※記事編集ビューが表示されることになる
            base.changeDirOnPage(selectedNode.path)
          } else {
            // ファイル詳細ビューの表示
            base.showNodeDetail(selectedNode.path)
            // ツリーのファイルノードは選択状態にはしない
            // ※この時点ではファイルノードが選択されてしまっているので、
            //   前に選択されていたノードに選択を戻している
            oldSelectedNode && pageService.setSelectedTreeNode(oldSelectedNode.path, true, true)
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
          base.openAncestorNodes(selectedNode.path, false)
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

      return {
        ...base,
        writingView,
        visibleDirView,
        visibleWritingView,
      }
    },
  })
}

export default ArticleStoragePage.clazz
</script>
