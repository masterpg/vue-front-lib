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
  <q-dialog v-model="opened" @show="m_dialogOnShow()" @before-hide="close()">
    <q-card class="container" :class="{ pc: screenSize.pc, tab: screenSize.tab, sp: screenSize.sp }">
      <!-- タイトル -->
      <q-card-section>
        <div class="title">{{ m_title }}</div>
      </q-card-section>

      <!-- コンテンツエリア -->
      <q-card-section>
        <q-input ref="newNameInput" v-model="m_newName" class="app-pb-20" :label="m_parentPath" :error="m_isError" :error-message="m_errorMessage">
          <template v-slot:prepend>
            <q-icon name="folder" />
          </template>
        </q-input>
      </q-card-section>

      <!-- ボタンエリア -->
      <q-card-section class="layout horizontal center end-justified">
        <!-- CANCELボタン -->
        <q-btn flat rounded color="primary" :label="$t('common.cancel')" @click="close()" />
        <!-- CREATEボタン -->
        <q-btn flat rounded color="primary" :label="$t('common.ok')" @click="m_rename()" />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import * as path from 'path'
import { BaseDialog, CompTreeNode, NoCache, StorageNodeType } from '@/lib'
import { Component } from 'vue-property-decorator'
import { QInput } from 'quasar'
import StorageTreeNodeItem from '@/example/views/demo/storage/storage-tree-node-item.vue'

@Component
export default class StorageNodeRenameDialog extends BaseDialog<CompTreeNode<StorageTreeNodeItem>, string> {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private get m_title(): string {
    if (!this.params) return ''
    return String(this.$t('common.renameSomehow', { somehow: this.params.item.nodeTypeName }))
  }

  private m_newName: string | null = null

  private get m_parentPath(): string {
    if (!this.params) return ''

    const storageNode = this.params.getRootNode()
    return path.join(storageNode.label, this.params.parent!.value, '/')
  }

  private get m_isError(): boolean {
    if (!this.params) return false

    if (this.m_newName !== null && this.m_newName === '') {
      const target = String(this.$t('common.somehowName', { somehow: this.params.item.nodeTypeName }))
      this.m_errorMessage = String(this.$t('error.required', { target }))
      return true
    }

    if (this.m_newName) {
      const matched = this.m_newName.match(/\r?\n|\t|\//g)
      if (matched) {
        this.m_errorMessage = String(this.$t('error.unusable', { target: matched[0] }))
        return true
      }
    }

    this.m_errorMessage = ''
    return false
  }

  private m_errorMessage: string = ''

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

  @NoCache
  private get m_newNameInput(): QInput {
    return this.$refs.newNameInput as any
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  open(targetNode: CompTreeNode<StorageTreeNodeItem>): Promise<string> {
    this.m_newName = targetNode.label
    return this.openProcess(targetNode)
  }

  close(newName?: string): void {
    this.m_clear()
    this.closeProcess(newName || '')
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  private async m_rename(): Promise<void> {
    if (this.m_isError) return

    // 入力値が元のままの場合、キャンセルとして閉じる
    if (this.params!.label === this.m_newName) {
      this.close('')
    }
    // 上記以外は入力値を結果にして閉じる
    else {
      this.close(this.m_newName!)
    }
  }

  private m_clear(): void {
    this.m_newName = null
    this.m_newNameInput.resetValidation()
  }

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------

  private m_dialogOnShow() {
    this.m_newNameInput.focus()
    this.m_newNameInput.select()
  }
}
</script>
