<style lang="sass" scoped>
@import 'src/example/styles/app.variables'

.container
  &.pc, &.tab
    width: 400px
  &.sp
    width: 270px

.title
  @extend %text-h6

.content-area
  &.pc, &.tab
    max-height: 50vh
  &.sp
    max-height: 80vh
  padding: 0 0 16px 0
  margin: 0 16px

.tree-view
  height: 100%
  --comp-tree-padding: 0

.error-message
  @extend %text-caption
  color: $text-error-color
</style>

<template>
  <div>
    <q-dialog ref="dialog" v-model="opened" @show="m_dialogOnShow()" @before-hide="close()">
      <q-card class="container" :class="{ pc: screenSize.pc, tab: screenSize.tab, sp: screenSize.sp }">
        <!-- タイトル -->
        <q-card-section>
          <div class="title">{{ m_title }}</div>
        </q-card-section>

        <!-- コンテンツエリア -->
        <q-card-section class="content-area scroll" :class="{ pc: screenSize.pc, tab: screenSize.tab, sp: screenSize.sp }">
          <q-input
            v-show="m_movingNodes.length === 1"
            ref="newNameInput"
            v-model="m_movingNodeName"
            :label="m_movingNodeLabel"
            class="app-pb-20"
            readonly
          >
            <template v-slot:prepend>
              <q-icon :name="m_movingNodeIcon" />
            </template>
          </q-input>
          <div class="app-mb-10">{{ $t('storage.move.selectDestPrompt') }}</div>
          <comp-tree-view
            ref="treeView"
            class="tree-view"
            @select-change="m_treeViewOnSelectChange($event)"
            @lazy-load="m_treeViewOnLazyLoad($event)"
          />
        </q-card-section>

        <!-- エラーメッセージ -->
        <q-card-section v-show="!!m_errorMessage">
          <span class="error-message">{{ m_errorMessage }}</span>
        </q-card-section>

        <!-- ボタンエリア -->
        <q-card-actions class="layout horizontal center end-justified">
          <!-- CANCELボタン -->
          <q-btn flat rounded color="primary" :label="$t('common.cancel')" @click="close()" />
          <!-- OKボタン -->
          <q-btn flat rounded color="primary" :label="$t('common.ok')" @click="m_move()" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <comp-alert-dialog ref="alertDialog"></comp-alert-dialog>
  </div>
</template>

<script lang="ts">
import * as path from 'path'
import { BaseDialog, NoCache } from '@/example/base'
import { CompAlertDialog, CompTreeView, CompTreeViewEvent, CompTreeViewLazyLoadEvent } from '@/example/components'
import { StorageArticleNodeType, StorageLogic, StorageNode, StorageNodeType } from '@/example/logic'
import { removeBothEndsSlash, removeStartDirChars } from 'web-base-lib'
import { Component } from 'vue-property-decorator'
import { QDialog } from 'quasar'
import { StoragePageMixin } from '@/example/views/base/storage/storage-page-mixin'
import StorageTreeNode from '@/example/views/base/storage/storage-tree-node.vue'
import { StorageTreeNodeData } from '@/example/views/base/storage/base'
import { mixins } from 'vue-class-component'

@Component
class BaseDialogMixin extends BaseDialog<string[], string | undefined> {}

@Component({ components: { CompTreeView, CompAlertDialog } })
export default class StorageNodeMoveDialog extends mixins(BaseDialogMixin, StoragePageMixin) {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  @NoCache
  protected get dialog(): QDialog {
    return this.$refs.dialog as QDialog
  }

  private m_movingNodes: StorageNode[] = []

  private get m_title(): string {
    if (this.m_movingNodes.length === 1) {
      const nodeTypeLabel = this.getNodeTypeLabel(this.m_movingNodes[0])
      return String(this.$t('common.moveSth', { sth: nodeTypeLabel }))
    } else if (this.m_movingNodes.length >= 2) {
      const sth = String(this.$tc('common.item', this.m_movingNodes.length))
      return String(this.$t('common.moveSth', { sth }))
    }
    return ''
  }

  private get m_movingNodeLabel(): string {
    if (this.m_movingNodes.length === 1) {
      return String(this.$t('storage.move.movingTarget'))
    }
    return ''
  }

  private get m_movingNodeName(): string {
    if (this.m_movingNodes.length === 1) {
      return this.getDisplayName(this.m_movingNodes[0])
    }
    return ''
  }

  private get m_movingNodeIcon(): string {
    if (this.m_movingNodes.length === 1) {
      return this.getNodeIcon(this.m_movingNodes[0])
    }
    return ''
  }

  private get m_movingNodesParentPath(): string {
    if (this.m_movingNodes.length === 0) return ''
    return this.m_movingNodes[0].dir
  }

  private m_errorMessage = ''

  private m_toDirNode: StorageTreeNode | null = null

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

  @NoCache
  get m_treeView(): CompTreeView<StorageTreeNode> {
    return this.$refs.treeView as CompTreeView<StorageTreeNode>
  }

  @NoCache
  get m_alertDialog(): CompAlertDialog {
    return this.$refs.alertDialog as CompAlertDialog
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  open(nodePaths: string[]): Promise<string | undefined> {
    this.m_movingNodes = []
    for (const nodePath of nodePaths) {
      const node = this.storageLogic.sgetNode({ path: nodePath })
      this.m_movingNodes.push(node)
    }

    // ノードが複数指定された場合、親が同じであることを検証
    const movingNodeParentPath = this.m_movingNodes[0].dir
    for (const movingNode of this.m_movingNodes) {
      if (movingNode.dir !== movingNodeParentPath) {
        throw new Error('All nodes must have the same parent.')
      }
    }

    StorageLogic.sortTree(this.m_movingNodes)

    return this.openProcess(nodePaths, {
      opened: async () => {
        await this.m_buildTreeView()
      },
    })
  }

  close(toDirPath?: string): void {
    this.m_clear()
    this.closeProcess(toDirPath)
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  private async m_move(): Promise<void> {
    if (this.m_toDirNode === null) {
      this.m_errorMessage = String(this.$t('storage.move.destNotSelected'))
      return
    }

    // 移動先に同名ノードが存在した場合、ユーザーに移動してよいか確認する
    for (const movingNode of this.m_movingNodes) {
      let alreadyExists = false
      for (const siblingNode of this.m_toDirNode.children) {
        if (siblingNode.name === movingNode.name) {
          alreadyExists = true
        }
      }
      if (alreadyExists) {
        const confirmed = await this.m_alertDialog.open({
          type: 'confirm',
          message: String(this.$t('storage.move.alreadyExistsQ', { nodeName: movingNode.name })),
        })
        if (!confirmed) return
      }
    }

    this.close(this.m_toDirNode.path)
  }

  private m_clear(): void {
    this.m_toDirNode = null
    this.m_errorMessage = ''
  }

  private async m_buildTreeView(): Promise<void> {
    //
    // ルートノードの選択可/不可設定
    //
    let unselectable = false
    // 移動ノードの親ディレクトリがルートノードの場合、ルートノードを選択できないよう設定
    unselectable = this.m_movingNodesParentPath === this.pageStore.rootNode.path
    // ストレージタイプが｢記事｣の場合、ルートノードは選択できないよう設定
    if (this.storageType === 'article') {
      unselectable = true
    }

    // ルートノードの追加
    const rootTreeNode = this.m_treeView.addNode({
      ...this.createRootNodeData(),
      opened: true,
      unselectable,
      disableContextMenu: true,
    } as StorageTreeNodeData)

    rootTreeNode.lazyLoadStatus = 'loading'

    // サーバーから子ノードを読み込む
    await this.m_pullChildren(rootTreeNode.path)

    rootTreeNode.lazyLoadStatus = 'loaded'
  }

  /**
   * 指定されたディレクトリ直下の子ノードをサーバーから取得します。
   * @param dirPath
   */
  private async m_pullChildren(dirPath: string): Promise<void> {
    dirPath = removeBothEndsSlash(dirPath)

    // 引数ディレクトリ直下の子ノードをサーバーから取得
    await this.storageLogic.fetchChildren(dirPath)

    // 引数ディレクトリ直下の子ディレクトリのデータを取得
    const childNodeDataList = this.m_createChildNodeDataList(dirPath)

    // ストレージタイプが｢記事｣の場合
    if (this.storageType === 'article') {
      // 移動するノードのタイプによって移動先を絞り込み
      if (this.m_containsCategory()) {
        this.m_filterForCategory(childNodeDataList)
      } else if (this.m_containsArticle()) {
        this.m_filterForArticle(childNodeDataList)
      } else {
        this.m_filter(childNodeDataList)
      }
    }

    // ツリービューにディレクトリノードを追加
    for (const childNodeData of childNodeDataList) {
      const parentPath = removeStartDirChars(path.dirname(childNodeData.value))
      this.m_treeView.addNode(childNodeData, {
        parent: parentPath,
      })
    }
  }

  /**
   * 指定されたディレクトリ直下の子ディレクトリを取得し、
   * 取得したディレクトリをツリーに追加可能なデータとして作成します。
   * @param dirPath
   */
  private m_createChildNodeDataList(dirPath: string): StorageTreeNodeData[] {
    const result: StorageTreeNodeData[] = []

    const childNodes = this.storageLogic.getChildren(dirPath)
    for (const childNode of childNodes) {
      // ディレクトリノード以外はツリービューに追加しない
      if (childNode.nodeType !== StorageNodeType.Dir) continue
      // 移動ノードはツリービューに追加しない
      if (this.m_movingNodes.some(movingNode => movingNode.path === childNode.path)) continue
      // 現在の親ディレクトリは選択できないよう設定
      const unselectable = childNode.path === this.m_movingNodesParentPath

      result.push({
        ...this.nodeToTreeData(this.storageType, childNode),
        lazy: true,
        unselectable,
        disableContextMenu: true,
      })
    }

    return result
  }

  /**
   * 移動ノードに｢カテゴリ｣を含んでいるかを取得します。
   */
  private m_containsCategory(): boolean {
    return this.m_movingNodes.some(node => node.articleNodeType === StorageArticleNodeType.Category)
  }

  /**
   * 移動ノードに｢記事｣を含んでいるかを取得します。
   */
  private m_containsArticle(): boolean {
    return this.m_movingNodes.some(node => node.articleNodeType === StorageArticleNodeType.Article)
  }

  //--------------------------------------------------
  //  移動先絞り込みフィルター
  //--------------------------------------------------

  /**
   * 一般的なディレクトリまたはファイルの移動先を絞り込みます。
   * 一般的なディレクトリまたはファイルは｢一般ディレクトリ、記事｣へのみ移動可能です。
   * @param childNodeDataList
   */
  private m_filter(childNodeDataList: StorageTreeNodeData[]): StorageTreeNodeData[] {
    for (let i = 0; i < childNodeDataList.length; i++) {
      const nodeData = childNodeDataList[i]
      // 一般的なディレクトリまたはファイルは｢一般ディレクトリ、記事｣へのみ移動可能であり、それ以外は選択不可
      if (!(!nodeData.articleNodeType || nodeData.articleNodeType === StorageArticleNodeType.Article)) {
        nodeData.unselectable = true
      }
    }

    return childNodeDataList
  }

  /**
   * カテゴリの移動先を絞り込みます。
   * カテゴリは｢カテゴリバンドル、カテゴリ｣へのみ移動可能です。
   * @param childNodeDataList
   */
  private m_filterForCategory(childNodeDataList: StorageTreeNodeData[]): StorageTreeNodeData[] {
    for (let i = 0; i < childNodeDataList.length; i++) {
      const nodeData = childNodeDataList[i]
      // カテゴリは｢カテゴリバンドル、カテゴリ｣へのみ移動可能であり、それ以外の移動先ノードは除去
      if (!(nodeData.articleNodeType === StorageArticleNodeType.CategoryBundle || nodeData.articleNodeType === StorageArticleNodeType.Category)) {
        childNodeDataList.splice(i--, 1)
      }
    }

    return childNodeDataList
  }

  /**
   * 記事の移動先を絞り込みます。
   * 記事は｢リストバンドル、カテゴリバンドル、カテゴリ｣へのみ移動可能です。
   * @param childNodeDataList
   */
  private m_filterForArticle(childNodeDataList: StorageTreeNodeData[]): StorageTreeNodeData[] {
    for (let i = 0; i < childNodeDataList.length; i++) {
      const nodeData = childNodeDataList[i]
      // 記事は｢リストバンドル、カテゴリバンドル、カテゴリ｣へのみ移動可能であり、それ以外の移動先ノードは除去
      if (
        !(
          nodeData.articleNodeType === StorageArticleNodeType.ListBundle ||
          nodeData.articleNodeType === StorageArticleNodeType.CategoryBundle ||
          nodeData.articleNodeType === StorageArticleNodeType.Category
        )
      ) {
        childNodeDataList.splice(i--, 1)
      }
    }

    return childNodeDataList
  }

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------

  /**
   * ツリービューでノードが選択された際のリスナです。
   * @param e
   */
  private m_treeViewOnSelectChange(e: CompTreeViewEvent<StorageTreeNode>) {
    this.m_errorMessage = ''
    this.m_toDirNode = e.node
  }

  /**
   * ツリービューで遅延ロードが開始された際のリスナです。
   * @param e
   */
  private async m_treeViewOnLazyLoad(e: CompTreeViewLazyLoadEvent<StorageTreeNode>) {
    await this.m_pullChildren(e.node.path)
    e.done()
    e.node.open()
  }

  private m_dialogOnShow() {}
}
</script>
