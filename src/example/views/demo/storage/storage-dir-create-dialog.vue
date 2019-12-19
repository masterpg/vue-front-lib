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
      <q-card-section class="layout horizontal center end-justified">
        <!-- CANCELボタン -->
        <q-btn flat rounded color="primary" :label="$t('common.cancel')" @click="close()" />
        <!-- CREATEボタン -->
        <q-btn flat rounded color="primary" :label="$t('common.create')" @click="m_create()" />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import * as path from 'path'
import { BaseDialog, NoCache } from '@/lib'
import { QDialog, QInput } from 'quasar'
import { Component } from 'vue-property-decorator'
import StorageTreeNode from '@/example/views/demo/storage/storage-tree-node.vue'

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

  private get m_title(): string {
    const nodeTypeName = this.$tc('common.folder', 1)
    return String(this.$t('common.createSomehow', { somehow: nodeTypeName }))
  }

  private m_dirName: string | null = null

  private get m_parentPath(): string {
    if (!this.params) return ''

    const storageNode = this.params.getRootNode()
    if (storageNode === this.params) {
      return path.join(this.params.label, '/')
    } else {
      return path.join(storageNode.label, this.params.value, '/')
    }
  }

  private get m_isError(): boolean {
    if (!this.params) return false

    if (this.m_dirName !== null && this.m_dirName === '') {
      const target = String(this.$t('common.somehowName', { somehow: this.params.nodeTypeName }))
      this.m_errorMessage = String(this.$t('error.required', { target }))
      return true
    }

    if (this.m_dirName) {
      const matched = this.m_dirName.match(/\r?\n|\t|\//g)
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
    if (this.m_isError) return

    let dirPath = ''
    const storageNode = this.params!.getRootNode()
    if (storageNode === this.params) {
      dirPath = path.join(this.m_dirName!, '/')
    } else {
      dirPath = path.join(this.params!.value, this.m_dirName!, '/')
    }
    this.close(dirPath)
  }

  private m_clear(): void {
    this.m_dirName = null
    this.m_dirNameInput.resetValidation()
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
