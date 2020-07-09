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
import { BaseDialog, CompAlertDialog, CompTreeView, CompTreeViewLazyLoadEvent, NoCache, StorageNodeType } from '@/lib'
import { StorageTreeNode, StorageTreeNodeData, StorageTypeMixin, nodeToTreeData, treeSortFunc } from './base'
import { Component } from 'vue-property-decorator'
import { QDialog } from 'quasar'
import { mixins } from 'vue-class-component'
import { removeBothEndsSlash } from 'web-base-lib'

@Component
class BaseDialogMixin extends BaseDialog<StorageTreeNode[], string | undefined> {}

@Component({ components: { CompTreeView, CompAlertDialog } })
export default class StorageNodeMoveDialog extends mixins(BaseDialogMixin, StorageTypeMixin) {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  @NoCache
  protected get dialog(): QDialog {
    return this.$refs.dialog as QDialog
  }

  private get m_movingNodes(): StorageTreeNode[] {
    return this.params || []
  }

  private get m_title(): string {
    if (this.m_movingNodes.length === 1) {
      return String(this.$t('common.moveSomehow', { somehow: this.m_movingNodes[0].nodeTypeName }))
    } else if (this.m_movingNodes.length >= 2) {
      const somehow = String(this.$tc('common.item', this.m_movingNodes.length))
      return String(this.$t('common.moveSomehow', { somehow }))
    }
    return ''
  }

  private get m_movingNodeLabel(): string {
    if (this.m_movingNodes.length === 1) {
      return String(this.$t('storage.move.movingNode', { nodeType: this.m_movingNodes[0].nodeTypeName }))
    }
    return ''
  }

  private get m_movingNodeName(): string {
    if (this.m_movingNodes.length === 1) {
      return this.m_movingNodes[0].name
    }
    return ''
  }

  private get m_movingNodeIcon(): string {
    if (this.m_movingNodes.length === 1) {
      return this.m_movingNodes[0].icon
    }
    return ''
  }

  private get m_movingNodesParentPath(): string {
    if (this.m_movingNodes.length === 0) return ''
    return this.m_movingNodes[0].parent!.value
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

  open(movingNodes: StorageTreeNode[]): Promise<string | undefined> {
    // ノードが複数指定された場合、親が同じであることを検証
    const movingNodeParentPath = movingNodes[0].parent!.value
    for (const movingNode of movingNodes) {
      if (movingNode.parent!.value !== movingNodeParentPath) {
        throw new Error('All nodes must have the same parent.')
      }
    }

    movingNodes.sort(treeSortFunc)

    return this.openProcess(movingNodes, {
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
    if (!this.rootTreeNode) {
      throw new Error(`"rootTreeNode" is not supposed to be the "${typeof this.rootTreeNode}".`)
    }

    // 現在の親ディレクトリがルートノードの場合、ルートノードを選択できないよう設定
    const unselectable = this.m_movingNodesParentPath === this.rootTreeNode.path
    // ルートノードの追加
    const rootTreeNode = this.m_treeView.addNode({
      ...nodeToTreeData(this.rootTreeNode),
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

    // 取得した子ノードをツリービューに追加
    const childNodes = this.storageLogic.getChildren(dirPath)
    for (const node of childNodes) {
      // ディレクトリノード以外はツリービューに追加しない
      if (node.nodeType !== StorageNodeType.Dir) continue
      // 移動ノードはツリービューに追加しない
      if (this.m_movingNodes.some(movingNode => movingNode.path === node.path)) continue
      // 現在の親ディレクトリは選択できないよう設定
      const unselectable = node.path === this.m_movingNodesParentPath
      // ツリービューにディレクトリノードを追加
      this.m_treeView.addNode(
        {
          ...nodeToTreeData(node),
          lazy: true,
          unselectable,
          disableContextMenu: true,
        } as StorageTreeNodeData,
        {
          parent: node.dir,
        }
      )
    }
  }

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------

  /**
   * ツリービューでノードが選択された際のリスナです。
   * @param node
   */
  private m_treeViewOnSelectChange(node: StorageTreeNode) {
    this.m_errorMessage = ''
    this.m_toDirNode = node
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
