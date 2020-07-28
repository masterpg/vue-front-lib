<style lang="sass" scoped>
@import 'src/example/styles/app.variables'

.container
  &.pc, &.tab
    width: 340px
  &.sp
    width: 270px

.title
  @extend %text-h6
</style>

<template>
  <q-dialog ref="dialog" v-model="opened" @hide="close()">
    <q-card class="container" :class="{ pc: screenSize.pc, tab: screenSize.tab, sp: screenSize.sp }">
      <!-- タイトル -->
      <q-card-section>
        <div class="title">{{ m_title }}</div>
      </q-card-section>

      <!-- コンテンツエリア -->
      <q-card-section>
        {{ m_message }}
      </q-card-section>

      <!-- ボタンエリア -->
      <q-card-actions class="layout horizontal center end-justified">
        <!-- CANCELボタン -->
        <q-btn flat rounded color="primary" :label="$t('common.cancel')" @click="close()" />
        <!-- DELETEボタン -->
        <q-btn flat rounded color="primary" :label="$t('common.delete')" @click="close(true)" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { BaseDialog, NoCache, StorageNode, StorageNodeType } from '@/lib'
import { Component } from 'vue-property-decorator'
import { QDialog } from 'quasar'
import { StorageTypeMixin } from './base'
import { mixins } from 'vue-class-component'

@Component
class BaseDialogMixin extends BaseDialog<string[], boolean> {}

@Component
export default class StorageNodeRemoveDialog extends mixins(BaseDialogMixin, StorageTypeMixin) {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  @NoCache
  protected get dialog(): QDialog {
    return this.$refs.dialog as QDialog
  }

  private m_removingNodes: StorageNode[] = []

  private get m_title(): string {
    if (!this.m_removingNodes) return ''
    const sth = String(this.$tc('common.item', this.m_removingNodes.length))
    return String(this.$t('common.deleteSth', { sth }))
  }

  private get m_message(): string {
    if (!this.m_removingNodes.length) return ''

    // ダイアログ引数で渡されたノードが1つの場合
    if (this.m_removingNodes.length === 1) {
      return String(this.$t('storage.delete.deleteTargetQ', { target: this.m_removingNodes[0].name }))
    }
    // ダイアログ引数で渡されたノードが複数の場合
    else {
      let fileNum = 0
      let folderNum = 0
      for (const removingNode of this.m_removingNodes) {
        if (removingNode.nodeType === StorageNodeType.Dir) {
          folderNum++
        } else if (removingNode.nodeType === StorageNodeType.File) {
          fileNum++
        }
      }

      // ファイルとフォルダが指定された場合
      if (fileNum > 0 && folderNum > 0) {
        const fileType = String(this.$tc('common.file', fileNum))
        const folderType = String(this.$tc('common.folder', folderNum))
        return String(this.$t('storage.delete.deleteFileAndFolderQ', { fileNum, fileType, folderNum, folderType }))
      }
      // ファイルが複数指定された場合
      else if (fileNum > 0) {
        const nodeType = String(this.$tc('common.file', fileNum))
        return String(this.$t('storage.delete.deleteNodeQ', { nodeNum: fileNum, nodeType }))
      }
      // フォルダが複数指定された場合
      else if (folderNum > 0) {
        const nodeType = String(this.$tc('common.folder', folderNum))
        return String(this.$t('storage.delete.deleteNodeQ', { nodeNum: folderNum, nodeType }))
      }
    }

    throw new Error('An unreachable line was reached.')
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  open(nodePaths: string[]): Promise<boolean> {
    this.m_removingNodes = []
    for (const nodePath of nodePaths) {
      const node = this.storageLogic.sgetNode({ path: nodePath })
      this.m_removingNodes.push(node)
    }

    return this.openProcess(nodePaths)
  }

  close(isConfirmed?: boolean): void {
    this.closeProcess(Boolean(isConfirmed))
  }
}
</script>
