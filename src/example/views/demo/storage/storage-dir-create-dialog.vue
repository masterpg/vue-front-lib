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
        <div class="title">{{ $t('storage.createFolder') }}</div>
      </q-card-section>

      <!-- コンテンツエリア -->
      <q-card-section>
        <q-input
          ref="dirNameInput"
          v-model="m_inputDirName"
          class="app-pb-20"
          :label="m_parentPath"
          :error="m_isError"
          :error-message="m_errorMessage"
          @input="m_dirNameInputOnInput()"
        >
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
import { BaseDialog, CompTreeNode, NoCache } from '@/lib'
import { Component } from 'vue-property-decorator'
import { QInput } from 'quasar'
import StorageTreeNodeItem from '@/example/views/demo/storage/storage-tree-node-item.vue'
const isEmpty = require('lodash/isEmpty')

export type AddingDirParentNode = CompTreeNode<StorageTreeNodeItem>

@Component
export default class StorageDirCreateDialog extends BaseDialog<AddingDirParentNode, string> {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private m_inputDirName: string | null = null

  private m_parentNode: AddingDirParentNode = {} as any

  private get m_parentPath(): string {
    if (isEmpty(this.m_parentNode)) return ''

    const storageNode = this.m_parentNode.getRootNode()
    if (storageNode === this.m_parentNode) {
      return `${this.m_parentNode.label}/`
    } else {
      return `${storageNode.label}/${this.m_parentNode.value}/`
    }
  }

  private get m_isError(): boolean {
    if (this.m_inputDirName !== null && this.m_inputDirName === '') {
      const target = String(this.$t('storage.folderName'))
      this.m_errorMessage = String(this.$t('error.required', { target }))
      return true
    }

    if (this.m_inputDirName) {
      const matched = this.m_inputDirName.match(/\r?\n|\t|\//g)
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

  open(parentNode: AddingDirParentNode): Promise<string> {
    this.m_parentNode = parentNode
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
    const storageNode = this.m_parentNode.getRootNode()
    if (storageNode === this.m_parentNode) {
      dirPath = `${this.m_inputDirName}/`
    } else {
      dirPath = `${this.m_parentNode.value}/${this.m_inputDirName}/`
    }
    this.close(dirPath)
  }

  private m_clear(): void {
    this.m_inputDirName = null
    this.m_dirNameInput.resetValidation()
  }

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------

  private m_dirNameInputOnInput() {}

  private m_dialogOnShow() {
    this.m_clear()
    this.m_dirNameInput.focus()
  }
}
</script>
