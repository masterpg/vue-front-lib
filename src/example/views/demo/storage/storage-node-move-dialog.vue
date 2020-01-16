<style lang="sass" scoped>
@import '../../../styles/app.variables'

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
          <comp-tree-view ref="treeView" class="tree-view" @selected="m_treeViewOnSelected($event)" />
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
import { BaseDialog, CompAlertDialog, CompTreeNode, CompTreeNodeData, CompTreeView, NoCache, StorageNodeType } from '@/lib'
import { StorageTypeMixin, treeSortFunc } from '@/example/views/demo/storage/base'
import { Component } from 'vue-property-decorator'
import { QDialog } from 'quasar'
import StorageTreeNode from '@/example/views/demo/storage/storage-tree-node.vue'
import { mixins } from 'vue-class-component'

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
      return this.m_movingNodes[0].label
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

  private m_errorMessage: string = ''

  private m_toDirNode: CompTreeNode | null = null

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

  @NoCache
  get m_treeView(): CompTreeView {
    return this.$refs.treeView as CompTreeView
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
    // 移動ノードが複数指定された場合、親が同じであることを検証
    let movingNodeParentPath = movingNodes[0].parent!.value
    for (const movingNode of movingNodes) {
      if (movingNode.parent!.value !== movingNodeParentPath) {
        throw new Error('All nodes must have the same parent.')
      }
    }

    movingNodes.sort(treeSortFunc)

    return this.openProcess(movingNodes, {
      opened: () => {
        this.m_buildTreeView()
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

    for (const movingNode of this.m_movingNodes) {
      let alreadyExists = false
      for (const siblingNode of this.m_toDirNode.children) {
        if (siblingNode.label === movingNode.label) {
          alreadyExists = true
        }
      }

      if (alreadyExists) {
        const confirmed = await this.m_alertDialog.open({
          type: 'confirm',
          message: String(this.$t('storage.move.alreadyExistsQ', { nodeName: movingNode.label })),
        })
        if (!confirmed) return
      }
    }

    this.close(this.m_toDirNode.value)
  }

  private m_clear(): void {
    this.m_toDirNode = null
    this.m_errorMessage = ''
  }

  private m_buildTreeView(): void {
    for (const srcTreeNode of this.treeStore.getAllNodes()) {
      // ファイルは追加しない
      if (srcTreeNode.nodeType === StorageNodeType.File) continue

      // ツリービューにディレクトリノードを追加
      const treeNodeData = this.m_toTreeNodeData(srcTreeNode)
      this.m_treeView.addChild(treeNodeData, {
        parent: srcTreeNode.parent ? srcTreeNode.parent.value : undefined,
        sortFunc: treeSortFunc,
      })
    }

    // ルートノードは展開しておく
    const rootTreeNode = this.m_treeView.children[0]
    rootTreeNode.open(false)

    // 移動ノードはツリービューから削除
    for (const movingNode of this.m_movingNodes) {
      this.m_treeView.removeNode(movingNode.value)
    }

    // 現在の親ディレクトリは選択できないよう設定
    const parentNode = this.m_treeView.getNode(this.m_movingNodesParentPath)!
    parentNode.unselectable = true
  }

  /**
   * 指定されたノードを本ツリービューで扱える形式のデータに変換します。
   * @param source
   */
  private m_toTreeNodeData(source: StorageTreeNode): CompTreeNodeData {
    return {
      label: source.label,
      value: source.value,
      icon: source.icon,
      iconColor: source.iconColor,
    }
  }

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------

  private m_treeViewOnSelected(node: CompTreeNode) {
    this.m_errorMessage = ''
    this.m_toDirNode = node
  }

  private m_dialogOnShow() {}
}
</script>
