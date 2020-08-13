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
    <article-admin-path-breadcrumb ref="pathBreadcrumb" @select="m_pathDirBreadcrumbOnSelect" @node-action="m_onNodeAction" />
    <div class="view-container layout horizontal flex-1">
      <article-admin-dir-view ref="dirView" class="dir-view flex-1" @select="m_dirViewOnSelect" @deep-select="m_dirViewOnDeepSelect" />
      <storage-dir-detail-view
        v-show="m_visibleDirDetailView"
        ref="dirDetailView"
        class="node-detail-view"
        :storage-logic="storageLogic"
        @close="m_nodeDetailViewOnClose"
      />
      <storage-file-detail-view
        v-show="m_visibleFileDetailView"
        ref="fileDetailView"
        class="node-detail-view"
        :storage-logic="storageLogic"
        @close="m_nodeDetailViewOnClose"
      />
    </div>

    <article-admin-dir-create-dialog ref="dirCreateDialog" />
  </div>
</template>

<script lang="ts">
import * as path from 'path'
import { ArticleAdminNodeActionType, ArticleAdminPageMixin, ArticleAdminPageStore } from './base'
import {
  AuthStatus,
  BaseComponent,
  CompStorageUploadProgressFloat,
  CompTreeView,
  NoCache,
  Resizable,
  StorageArticleNodeType,
  StorageNodeType,
} from '@/lib'
import { Component, Watch } from 'vue-property-decorator'
import { RawLocation, Route } from 'vue-router'
import { removeBothEndsSlash, splitHierarchicalPaths } from 'web-base-lib'
import ArticleAdminDirCreateDialog from './article-admin-dir-create-dialog.vue'
import ArticleAdminDirView from './article-admin-dir-view.vue'
import ArticleAdminPathBreadcrumb from './article-admin-path-breadcrumb.vue'
import StorageDirDetailView from '../../base/storage/storage-dir-detail-view.vue'
import StorageFileDetailView from '../../base/storage/storage-file-detail-view.vue'
import { StorageNodeActionEvent } from '../../base/storage'
import Vue from 'vue'
import { mixins } from 'vue-class-component'

@Component({
  components: {
    ArticleAdminDirCreateDialog,
    ArticleAdminDirView,
    ArticleAdminPathBreadcrumb,
    CompStorageUploadProgressFloat,
    CompTreeView,
    StorageDirDetailView,
    StorageFileDetailView,
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

  destroyed() {
    ArticleAdminPageStore.unregister()
  }

  async mounted() {
    // 初期ストレージノードの読み込みが既に行われている場合
    // ※本ページから別ページに遷移し、その後本ページに戻ってきた場合がこの状況に当たる
    if (this.pageStore.isInitialPull) {
      // 選択ノードのパスをURLに付与し、ページを更新
      this.m_changeDirOnPage(this.pageStore.selectedDirPath)
    }
    // 初期ストレージノードの読み込みが行われていなく、かつユーザーがサインインしてる場合
    else if (this.$logic.auth.isSignedIn) {
      // 初期ストレージノードの読み込み
      await this.m_pullInitialNodes()
    }
  }

  async beforeRouteUpdate(to: Route, from: Route, next: (to?: RawLocation | false | ((vm: Vue) => any) | void) => void) {
    next()

    // URLから選択ノードパスを取得(取得できなかった場合はルートノード)
    const dirPath = this.storageRoute.getNodePath()
    // ページの選択ノードを設定
    this.m_changeDir(dirPath)
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

  @NoCache
  private get m_dirCreateDialog(): ArticleAdminDirCreateDialog {
    return this.$refs.dirCreateDialog as ArticleAdminDirCreateDialog
  }

  @NoCache
  private get m_dirDetailView(): StorageDirDetailView {
    return this.$refs.dirDetailView as StorageDirDetailView
  }

  @NoCache
  private get m_fileDetailView(): StorageFileDetailView {
    return this.$refs.fileDetailView as StorageFileDetailView
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

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

  /**
   * 初回に読み込むべきストレージノードの読み込みを行います。
   */
  private async m_pullInitialNodes(): Promise<void> {
    if (this.pageStore.isInitialPull) return

    this.m_dirView.loading = true

    // 現在の選択ノードを取得
    // ※URLから取得したディレクトリまたは現在の選択ノード
    const urlDirPath = this.storageRoute.getNodePath()
    const dirPath = urlDirPath || this.pageStore.rootNode.path

    // 記事ルートを読み込み
    // ※もし記事ルートが存在しなかった場合、作成も行われる
    await this.storageLogic.fetchArticleRoot()
    // 引数ディレクトリを含め、階層構造を形成する各ディレクトリの子ノードをサーバーから読み込み
    const dirPaths = splitHierarchicalPaths(dirPath)
    for (const iDirPath of [this.pageStore.rootNode.path, ...dirPaths]) {
      await this.storageLogic.fetchChildren(iDirPath)
    }

    // 表示ディレクトリを移動
    this.m_changeDir(dirPath)

    this.m_dirView.loading = false

    this.pageStore.isInitialPull = true
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
    // 選択ノードの設定
    this.pageStore.selectedDirPath = dirPath
    // パスのパンくずに選択ノードを設定
    this.m_pathBreadcrumb.setDirPath(dirPath)
    // ディレクトリビューに選択ノードを設定
    this.m_dirView.setDirPath(dirPath)
  }

  /**
   * 指定ディレクトリのパスをURLへ付与してディレクトリを移動します。
   * @param dirPath ディレクトリパス
   */
  private m_changeDirOnPage(dirPath: string): void {
    dirPath = removeBothEndsSlash(dirPath)

    const urlDirPath = removeBothEndsSlash(this.storageRoute.getNodePath())
    // 移動先が変わらない場合
    // ※URLから取得したディレクトリと移動先のディレクトリが同じ場合
    if (urlDirPath === dirPath) {
      // 指定されたディレクトリをページの選択ノードとして設定
      this.m_changeDir(dirPath)
    }
    // 移動先が変わる場合
    else {
      // 選択ディレクトリのパスをURLに付与
      // ※ルーターによって本ページ内のbeforeRouteUpdate()が実行される
      this.storageRoute.move(dirPath)
    }
  }

  /**
   * 指定されたノードをページの選択ノードとして設定します。
   * @param nodePath
   */
  private m_showNodeDetail(nodePath: string): void {
    this.m_visibleDirDetailView = false
    this.m_visibleFileDetailView = false
    const node = this.storageLogic.sgetNode({ path: nodePath })

    switch (node.nodeType) {
      case StorageNodeType.Dir: {
        // ディレクトリ詳細ビューを表示
        this.m_dirDetailView.setNodePath(node.path)
        this.m_visibleDirDetailView = true
        break
      }
      case StorageNodeType.File: {
        // ファイル詳細ビューを表示
        this.m_fileDetailView.setNodePath(node.path)
        this.m_visibleFileDetailView = true
        break
      }
    }
  }

  /**
   * ディレクトリの作成を行います。
   * @param dirPath 作成するディレクトリのパス
   * @param articleNodeType 作成するディレクトリのタイプ
   */
  async m_createDir(dirPath: string, articleNodeType: StorageArticleNodeType): Promise<void> {
    this.$q.loading.show()

    dirPath = removeBothEndsSlash(dirPath)

    // ディレクトリ作成を実行
    try {
      await this.storageLogic.createArticleDir(dirPath, { articleNodeType })
    } catch (err) {
      console.error(err)
      this.showNotification('error', String(this.$t('storage.create.creatingDirError', { nodeName: path.basename(dirPath) })))
      return
    }

    // 現在の選択ディレクトリで画面更新
    this.m_changeDir(this.pageStore.selectedDirPath)

    this.$q.loading.hide()
  }

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

  /**
   * ポップアップメニューでアクションが選択された際のリスナです。
   * @param e
   */
  private async m_onNodeAction(e: StorageNodeActionEvent) {
    const createDir = async (type: StorageArticleNodeType) => {
      const creatingDirPath = await this.m_dirCreateDialog.open({
        type,
        parent: this.pageStore.selectedDirPath,
      })
      if (creatingDirPath) {
        await this.m_createDir(creatingDirPath, type)
      }
    }

    console.log(e)

    switch (e.type) {
      case ArticleAdminNodeActionType.createListBundle.type: {
        await createDir(StorageArticleNodeType.ListBundle)
        break
      }
      case ArticleAdminNodeActionType.createCategoryBundle.type: {
        await createDir(StorageArticleNodeType.CategoryBundle)
        break
      }
      case ArticleAdminNodeActionType.createCategoryDir.type: {
        await createDir(StorageArticleNodeType.CategoryDir)
        break
      }
      case ArticleAdminNodeActionType.createArticleDir.type: {
        await createDir(StorageArticleNodeType.ArticleDir)
        break
      }
    }
  }

  //--------------------------------------------------
  //  パンくず
  //--------------------------------------------------

  /**
   * パンくずブロックがクリックされた際のリスナです。
   * @param nodePath
   */
  private m_pathDirBreadcrumbOnSelect(nodePath: string) {
    this.m_changeDirOnPage(nodePath)
  }

  //--------------------------------------------------
  //  ディレクトリビュー
  //--------------------------------------------------

  /**
   * ディレクトリビューでノードが選択された際のリスナです。
   * @param nodePath
   */
  private m_dirViewOnSelect(nodePath: string) {
    this.m_showNodeDetail(nodePath)
  }

  /**
   * ディレクトリビューでノードがディープ選択された際のリスナです。
   * @param dirPath
   */
  private m_dirViewOnDeepSelect(dirPath: string) {
    this.m_changeDirOnPage(dirPath)
  }

  //--------------------------------------------------
  //  ノード詳細ビュー
  //--------------------------------------------------

  private m_nodeDetailViewOnClose() {
    this.m_visibleDirDetailView = false
    this.m_visibleFileDetailView = false
  }
}
</script>
