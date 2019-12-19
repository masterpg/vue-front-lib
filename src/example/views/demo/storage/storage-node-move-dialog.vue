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
  <q-dialog ref="dialog" v-model="opened" @show="m_dialogOnShow()" @before-hide="close()">
    <q-card class="container" :class="{ pc: screenSize.pc, tab: screenSize.tab, sp: screenSize.sp }">
      <!-- タイトル -->
      <q-card-section>
        <div class="title">{{ m_title }}</div>
      </q-card-section>

      <!-- コンテンツエリア -->
      <q-card-section class="content-area scroll" :class="{ pc: screenSize.pc, tab: screenSize.tab, sp: screenSize.sp }">
        <q-input ref="newNameInput" v-model="m_nodeName" :label="m_nodeLabel" class="app-pb-20" readonly>
          <template v-slot:prepend>
            <q-icon :name="m_nodeIcon" />
          </template>
        </q-input>
        <comp-tree-view ref="treeView" class="tree-view" @selected="m_treeViewOnSelected($event)" />
      </q-card-section>

      <!-- エラーメッセージ -->
      <q-card-section v-show="!!m_errorMessage">
        <span class="error-message">{{ m_errorMessage }}</span>
      </q-card-section>

      <!-- ボタンエリア -->
      <q-card-section class="layout horizontal center end-justified">
        <!-- CANCELボタン -->
        <q-btn flat rounded color="primary" :label="$t('common.cancel')" @click="close()" />
        <!-- CREATEボタン -->
        <q-btn flat rounded color="primary" :label="$t('common.ok')" @click="m_move()" />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { BaseDialog, CompTreeNode, CompTreeView, NoCache, StorageNodeType } from '@/lib'
import { getStorageTreeRootNodeData, storageTreeChildrenSortFunc, toStorageTreeNodeData } from '@/example/views/demo/storage/base'
import { Component } from 'vue-property-decorator'
import { QDialog } from 'quasar'
import StorageTreeNode from '@/example/views/demo/storage/storage-tree-node.vue'

@Component({ components: { CompTreeView } })
export default class StorageNodeMoveDialog extends BaseDialog<StorageTreeNode, string | undefined> {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  @NoCache
  protected get dialog(): QDialog {
    return this.$refs.dialog as QDialog
  }

  private get m_title(): string {
    if (!this.params) return ''
    return String(this.$t('common.moveSomehow', { somehow: this.params.nodeTypeName }))
  }

  private get m_nodeLabel(): string {
    if (!this.params) return ''
    return String(this.$t('storage.movingNode', { nodeType: this.params.nodeTypeName }))
  }

  private get m_nodeName(): string {
    if (!this.params) return ''
    return this.params.label
  }

  private get m_nodeIcon(): string {
    if (!this.params) return ''
    return this.params.icon
  }

  private m_errorMessage: string = ''

  private m_toDir: string | null = null

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

  @NoCache
  get m_treeView(): CompTreeView {
    return this.$refs.treeView as CompTreeView
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  open(targetNode: StorageTreeNode): Promise<string | undefined> {
    return this.openProcess(targetNode, {
      opened: () => {
        this.m_buildTreeView()
      },
    })
  }

  close(toDir?: string): void {
    this.m_clear()
    this.closeProcess(toDir)
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  private async m_move(): Promise<void> {
    if (this.m_toDir === null) {
      this.m_errorMessage = String(this.$t('storage.destNotSelected'))
      return
    }

    this.close(this.m_toDir)
  }

  private m_clear(): void {
    this.m_toDir = null
    this.m_errorMessage = ''
  }

  private m_buildTreeView(): void {
    const rootNode = this.m_treeView.addChild(getStorageTreeRootNodeData()) as StorageTreeNode

    for (const node of this.$logic.userStorage.nodes) {
      // ファイルは追加しない
      if (node.nodeType === StorageNodeType.File) continue

      // ツリービューにディレクトリノードを追加
      const treeNode = this.m_treeView.getNode(node.path)
      const treeNodeData = toStorageTreeNodeData(node)
      delete treeNodeData.nodeClass
      if (treeNode) {
        treeNode.setNodeData(treeNodeData)
      } else {
        this.m_treeView.addChild(treeNodeData, {
          parent: treeNodeData.parent || rootNode.value,
          sortFunc: storageTreeChildrenSortFunc,
        })
      }
    }

    // 移動ノードはツリービューから削除
    this.m_treeView.removeNode(this.params!.value)

    // 現在の親ディレクトリは選択できないよう設定
    {
      const parentPath = this.params!.parent!.value
      const parentNode = this.m_treeView.getNode(parentPath)!
      parentNode.unselectable = true
    }
  }

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------

  private m_treeViewOnSelected(node: CompTreeNode) {
    this.m_errorMessage = ''
    this.m_toDir = node.value
  }

  private m_dialogOnShow() {}
}
</script>
