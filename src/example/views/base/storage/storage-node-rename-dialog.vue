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
  <div>
    <q-dialog ref="dialog" v-model="opened" @show="m_dialogOnShow()" @before-hide="close()">
      <q-card class="container" :class="{ pc: screenSize.pc, tab: screenSize.tab, sp: screenSize.sp }">
        <!-- タイトル -->
        <q-card-section>
          <div class="title">{{ m_title }}</div>
        </q-card-section>

        <!-- コンテンツエリア -->
        <q-card-section>
          <q-input
            ref="newNameInput"
            v-model="m_newName"
            class="app-pb-20"
            :label="m_parentPath"
            :error="m_isError"
            :error-message="m_errorMessage"
            @input="m_newNameInputOnInput"
          >
            <template v-slot:prepend>
              <q-icon :name="m_nodeIcon" />
            </template>
          </q-input>
        </q-card-section>

        <!-- ボタンエリア -->
        <q-card-actions class="layout horizontal center end-justified">
          <!-- CANCELボタン -->
          <q-btn flat rounded color="primary" :label="$t('common.cancel')" @click="close()" />
          <!-- CREATEボタン -->
          <q-btn flat rounded color="primary" :label="$t('common.ok')" @click="m_rename()" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <comp-alert-dialog ref="alertDialog"></comp-alert-dialog>
  </div>
</template>

<script lang="ts">
import * as path from 'path'
import { BaseDialog, CompAlertDialog, NoCache, StorageNode } from '@/lib'
import { QDialog, QInput } from 'quasar'
import { StorageTypeMixin, getStorageNodeTypeIcon, getStorageNodeTypeLabel } from './base'
import { Component } from 'vue-property-decorator'
import { mixins } from 'vue-class-component'

@Component
class BaseDialogMixin extends BaseDialog<string, string> {}

@Component({ components: { CompAlertDialog } })
export default class StorageNodeRenameDialog extends mixins(BaseDialogMixin, StorageTypeMixin) {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  @NoCache
  protected get dialog(): QDialog {
    return this.$refs.dialog as QDialog
  }

  private m_targetNode: StorageNode = null as any

  private get m_title(): string {
    if (!this.m_targetNode) return ''
    const nodeType = this.m_targetNode.nodeType
    return String(this.$t('common.renameSomehow', { somehow: getStorageNodeTypeLabel(nodeType) }))
  }

  private get m_nodeIcon(): string {
    if (!this.m_targetNode) return ''
    const nodeType = this.m_targetNode.nodeType
    return getStorageNodeTypeIcon(nodeType)
  }

  private m_newName: string | null = null

  private get m_parentPath(): string {
    if (!this.m_targetNode) return ''
    return path.join(this.pageStore.rootNode.label, this.m_targetNode.dir, '/')
  }

  private get m_isError(): boolean {
    return !this.m_validate()
  }

  private m_errorMessage = ''

  /**
   * 新しいノード名のインプットに変更があったか否かです。
   */
  private m_newNameInputChanged = false

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

  @NoCache
  private get m_newNameInput(): QInput {
    return this.$refs.newNameInput as any
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

  open(targetNodePath: string): Promise<string> {
    this.m_targetNode = this.storageLogic.sgetNode({ path: targetNodePath })
    this.m_newName = this.m_targetNode.name
    return this.openProcess(targetNodePath)
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
    this.m_newName = this.m_newName === null ? '' : this.m_newName
    if (!this.m_validate()) return

    // 入力値が元のままの場合、キャンセルとして閉じる
    if (this.m_targetNode!.name === this.m_newName) {
      this.close('')
    }
    // 上記以外は入力値を結果にして閉じる
    else {
      this.close(this.m_newName!)
    }
  }

  private m_clear(): void {
    this.m_newName = null
    this.m_newNameInputChanged = false
    this.m_newNameInput.resetValidation()
  }

  private m_validate(): boolean {
    const targetNode = this.m_targetNode
    if (!targetNode || !this.m_newNameInputChanged) return true

    // 必須入力チェック
    if (this.m_newName === '') {
      const nodeType = this.m_targetNode.nodeType
      const target = String(this.$t('common.somehowName', { somehow: getStorageNodeTypeLabel(targetNode.nodeType) }))
      this.m_errorMessage = String(this.$t('error.required', { target }))
      return false
    }

    // 禁則文字チェック
    if (this.m_newName) {
      const matched = this.m_newName.match(/\r?\n|\t|\//g)
      if (matched) {
        this.m_errorMessage = String(this.$t('error.unusable', { target: matched[0] }))
        return false
      }
    }

    // リネームされているかチェック(入力値が変更されていること)
    if (this.m_newName === targetNode.name) {
      this.m_errorMessage = String(this.$t('storage.rename.renamingNodeNameIsNotChanged'))
      return false
    }

    // リネームしようとする名前のノードが存在しないことをチェック
    const siblingNodes = this.storageLogic.getChildren(targetNode.dir)
    for (const siblingNode of siblingNodes) {
      if (siblingNode === targetNode) continue
      if (siblingNode.name === this.m_newName) {
        this.m_errorMessage = String(
          this.$t('storage.nodeAlreadyExists', { nodeName: this.m_newName, nodeType: getStorageNodeTypeLabel(siblingNode.nodeType) })
        )
        return false
      }
    }

    this.m_errorMessage = ''
    return true
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

  private m_newNameInputOnInput() {
    this.m_newNameInputChanged = true
  }
}
</script>
