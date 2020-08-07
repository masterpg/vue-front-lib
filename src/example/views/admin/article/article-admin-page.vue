<style lang="sass" scoped>
@import 'src/example/styles/app.variables'

.article-admin-page
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
  <div class="article-admin-page layout vertical">
    <article-admin-path-breadcrumb ref="pathBreadcrumb" @node-action="m_onNodeAction" />
    <article-admin-dir-view ref="dirView" />
  </div>
</template>

<script lang="ts">
import * as path from 'path'
import { ArticleAdminPageMixin, ArticleAdminPageStore } from './base'
import { AuthStatus, BaseComponent, CompStorageUploadProgressFloat, CompTreeView, NoCache, Resizable, StorageNode } from '@/lib'
import { Component, Watch } from 'vue-property-decorator'
import ArticleAdminDirView from './article-admin-dir-view.vue'
import ArticleAdminPathBreadcrumb from './article-admin-path-breadcrumb.vue'
import { StorageNodePopupMenuSelectEvent } from '@/example/views/base/storage'
import { mixins } from 'vue-class-component'
import { removeBothEndsSlash } from 'web-base-lib'

@Component({
  components: {
    CompStorageUploadProgressFloat,
    CompTreeView,
    ArticleAdminDirView,
    ArticleAdminPathBreadcrumb,
  },
})
export default class ArticleAdminPage extends mixins(BaseComponent, Resizable, ArticleAdminPageMixin) {
  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  created() {
    ArticleAdminPageStore.register(this)
  }

  async mounted() {
    if (this.pageStore.isInitialPull) {
    }
    // 初期ストレージノードの読み込みが行われていなく、かつユーザーがサインインしてる場合
    else if (this.$logic.auth.isSignedIn) {
      // 初期ストレージノードの読み込み
      await this.m_pullInitialNodes()
    }
  }

  destroyed() {
    this.pageStore.isPageActive = false
  }

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  /**
   * ディレクトリ詳細ビューの表示フラグです。
   */
  private m_visibleDirDetailView = false

  /**
   * ファイル詳細ビューの表示フラグです。
   */
  private m_visibleFileDetailView = false

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

  @NoCache
  private get m_pathBreadcrumb(): ArticleAdminPathBreadcrumb {
    return this.$refs.pathBreadcrumb as ArticleAdminPathBreadcrumb
  }

  @NoCache
  private get m_dirView(): ArticleAdminDirView {
    return this.$refs.dirView as ArticleAdminDirView
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  /**
   * 初回に読み込むべきストレージノードの読み込みを行います。
   */
  private async m_pullInitialNodes(): Promise<void> {
    this.m_dirView.loading = true

    // 現在の選択ノードを取得
    // ※URLから取得したディレクトリまたは現在の選択ノード
    const urlDirPath = this.storageRoute.getNodePath()
    const dirPath = urlDirPath || this.pageStore.rootNode.path

    // 初期ストレージノードの読み込み
    await this.m_pullChildren(dirPath)
    this.pageStore.isInitialPull = true

    // ページの表示ディレクトリを移動
    this.m_changeDir(dirPath)

    this.m_dirView.loading = false
  }

  /**
   * 指定されたディレクトリ直下の子ノードをサーバーから取得します。
   * @param dirPath
   */
  private async m_pullChildren(dirPath: string): Promise<void> {
    await this.storageLogic.fetchChildren(dirPath)
  }

  /**
   * 指定されたディレクトリへ移動します。
   * @param dirPath
   */
  private m_changeDir(dirPath: string): void {
    // ノード詳細ビューを非表示にする
    this.m_visibleDirDetailView = false
    this.m_visibleFileDetailView = false
    // パスのパンくずに選択ノードを設定
    this.m_pathBreadcrumb.setDirPath(dirPath)
    // ディレクトリビューに選択ノードを設定
    this.m_dirView.setDirPath(dirPath)
  }

  /**
   * ページ表示をクリアします。
   */
  private m_clearPage(): void {
    this.pageStore.isInitialPull = false
    this.m_pathBreadcrumb.setDirPath(null)
    this.m_dirView.setDirPath(null)
    this.m_visibleDirDetailView = false
    this.m_visibleFileDetailView = false
  }

  // /**
  //  * ディレクトリの作成を行います。
  //  * @param dirPath 作成するディレクトリのパス
  //  */
  // async createDir(dirPath: string, input: {  }): Promise<void> {
  //   dirPath = removeBothEndsSlash(dirPath)
  //
  //   // APIによるディレクトリ作成処理を実行
  //   let dirNode: StorageNode
  //   try {
  //     dirNode = (await this.storageLogic.createHierarchicalDirs([dirPath]))[0]
  //   } catch (err) {
  //     console.error(err)
  //     this.m_showNotification('error', String(this.$t('storage.create.creatingDirError', { nodeName: _path.basename(dirPath) })))
  //     return
  //   }
  //
  //   // ツリービューに作成したディレクトリノードを追加
  //   this.setNode(dirNode)
  //   const dirTreeNode = this.getNode(dirPath)!
  //   // 作成したディレクトリの遅延ロード状態を済みに設定
  //   dirTreeNode.lazyLoadStatus = 'loaded'
  // }

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------

  @Watch('$logic.auth.isSignedIn')
  protected async isSignedInOnChange(newValue: AuthStatus, oldValue: AuthStatus) {
    if (this.$logic.auth.isSignedIn) {
      await this.m_pullInitialNodes()
    } else {
      this.m_clearPage()
    }
  }

  private async m_onNodeAction(e: StorageNodePopupMenuSelectEvent) {
    console.log(e)
  }
}
</script>
