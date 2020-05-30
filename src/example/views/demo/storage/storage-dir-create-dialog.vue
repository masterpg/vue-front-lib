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
  <q-dialog ref="dialog" v-model="opened" @show="m_dialogOnShow()" @before-hide="close()">
    <q-card class="container" :class="{ pc: screenSize.pc, tab: screenSize.tab, sp: screenSize.sp }">
      <!-- タイトル -->
      <q-card-section>
        <div class="title">{{ m_title }}</div>
      </q-card-section>

      <!-- コンテンツエリア -->
      <q-card-section>
        <q-input ref="dirNameInput" v-model="m_dirName" class="app-pb-20" :label="m_parentPath" :error="m_isError" :error-message="m_errorMessage">
          <template v-slot:prepend>
            <q-icon name="folder" />
          </template>
        </q-input>
      </q-card-section>

      <!-- ボタンエリア -->
      <q-card-actions class="layout horizontal center end-justified">
        <!-- CANCELボタン -->
        <q-btn flat rounded color="primary" :label="$t('common.cancel')" @click="close()" />
        <!-- CREATEボタン -->
        <q-btn flat rounded color="primary" :label="$t('common.create')" @click="m_create()" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import * as path from 'path'
import { BaseDialog, NoCache } from '@/lib'
import { QDialog, QInput } from 'quasar'
import { Component } from 'vue-property-decorator'
import StorageTreeNode from './storage-tree-node.vue'

@Component
export default class StorageDirCreateDialog extends BaseDialog<StorageTreeNode, string> {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  @NoCache
  protected get dialog(): QDialog {
    return this.$refs.dialog as QDialog
  }

  private get m_parentNode(): StorageTreeNode | null {
    return this.params
  }

  private get m_title(): string {
    const nodeTypeName = this.$tc('common.folder', 1)
    return String(this.$t('common.createSomehow', { somehow: nodeTypeName }))
  }

  private m_dirName: string | null = null

  private get m_parentPath(): string {
    if (!this.m_parentNode) return ''

    const storageNode = this.m_parentNode.getRootNode()
    if (storageNode === this.m_parentNode) {
      return path.join(this.m_parentNode.label, '/')
    } else {
      return path.join(storageNode.label, this.m_parentNode.value, '/')
    }
  }

  private get m_isError(): boolean {
    return !this.m_validate()
  }

  private m_errorMessage = ''

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

  @NoCache
  private get m_dirNameInput(): QInput {
    return this.$refs.dirNameInput as any
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  open(parentNode: StorageTreeNode): Promise<string> {
    return this.openProcess(parentNode)
  }

  close(dirPath?: string): void {
    this.m_clear()
    this.closeProcess(dirPath || '')
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  private async m_create(): Promise<void> {
    this.m_dirName = this.m_dirName === null ? '' : this.m_dirName
    if (!this.m_validate()) return

    let dirPath = ''
    if (this.m_parentNode!.getRootNode() === this.m_parentNode) {
      dirPath = this.m_dirName!
    } else {
      dirPath = path.join(this.m_parentNode!.value, this.m_dirName!)
    }
    this.close(dirPath)
  }

  private m_clear(): void {
    this.m_dirName = null
    this.m_dirNameInput.resetValidation()
  }

  private m_validate(): boolean {
    const parentNode = this.m_parentNode
    if (!parentNode) return false

    // ディレクトリ名必須入力チェック
    if (this.m_dirName === '') {
      const target = String(this.$t('common.somehowName', { somehow: parentNode.nodeTypeName }))
      this.m_errorMessage = String(this.$t('error.required', { target }))
      return false
    }

    // 禁則文字チェック
    if (this.m_dirName) {
      const matched = this.m_dirName.match(/\r?\n|\t|\//g)
      if (matched) {
        this.m_errorMessage = String(this.$t('error.unusable', { target: matched[0] }))
        return false
      }
    }

    // 作成しようとする名前のディレクトリが存在しないことをチェック
    for (const siblingNode of parentNode.children) {
      if (siblingNode.label === this.m_dirName) {
        const nodeTypeName = this.$tc('common.folder', 1)
        this.m_errorMessage = String(this.$t('storage.nodeAlreadyExists', { nodeName: this.m_dirName, nodeType: nodeTypeName }))
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
    this.m_dirNameInput.focus()
  }
}
</script>
