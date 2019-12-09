<style lang="sass" scoped>
@import '../../../styles/app.variables'

.container
  &.pc, &.tab
    width: 340px
  &.sp
    width: 270px

.title
  @extend %text-h6
</style>

<template>
  <q-dialog v-model="opened" @hide="close()">
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
      <q-card-section class="layout horizontal center end-justified">
        <!-- CANCELボタン -->
        <q-btn flat rounded color="primary" :label="$t('common.cancel')" @click="close()" />
        <!-- DELETEボタン -->
        <q-btn flat rounded color="primary" :label="$t('common.delete')" @click="close(true)" />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { BaseDialog, CompTreeNode, StorageNodeType } from '@/lib'
import { Component } from 'vue-property-decorator'
import StorageTreeNodeItem from '@/example/views/demo/storage/storage-tree-node-item.vue'

export type RemovingNodes = CompTreeNode<StorageTreeNodeItem>[]

@Component
export default class StorageNodesRemoveDialog extends BaseDialog<RemovingNodes, boolean> {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private get m_title(): string {
    if (!this.params) return ''
    return this.$tc('storage.deleteItem', this.params.length)
  }

  private get m_message(): string {
    if (!this.params) return ''

    if (this.params.length === 1) {
      return String(this.$t('storage.deleteItemQ', { target: this.params[0].label }))
    }

    let fileNum = 0
    let folderNum = 0
    for (const node of this.params) {
      if (node.item.nodeType === StorageNodeType.Dir) {
        folderNum++
      } else if (node.item.nodeType === StorageNodeType.File) {
        fileNum++
      }
    }

    if (fileNum > 0) {
      return String(this.$t('storage.deleteFilesQ', { fileNum }))
    } else if (folderNum > 0) {
      return String(this.$t('storage.deleteFoldersQ', { folderNum }))
    } else {
      return String(this.$t('storage.deleteFilesAndFoldersQ', { fileNum, folderNum }))
    }
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  open(nodes: RemovingNodes): Promise<boolean> {
    return this.openProcess(nodes)
  }

  close(isConfirmed?: boolean): void {
    this.closeProcess(!!isConfirmed)
  }
}
</script>
