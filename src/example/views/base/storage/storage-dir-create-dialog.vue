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
            <q-icon :name="m_icon" />
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
import { BaseDialog, NoCache } from '@/example/base'
import { QDialog, QInput } from 'quasar'
import { StorageArticleNodeType, StorageNode, StorageNodeType } from '@/example/logic'
import { Component } from 'vue-property-decorator'
import { StoragePageMixin } from '@/example/views/base/storage/storage-page-mixin'
import { mixins } from 'vue-class-component'

interface DialogParam {
  parentPath: string
  articleNodeType?: StorageArticleNodeType
}

interface DialogResult {
  dir: string
  name: string
}

@Component
class BaseDialogMixin extends BaseDialog<DialogParam, DialogResult | undefined> {}

@Component
export default class StorageDirCreateDialog extends mixins(BaseDialogMixin, StoragePageMixin) {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  @NoCache
  protected get dialog(): QDialog {
    return this.$refs.dialog as QDialog
  }

  private m_parentNode: StorageNode | null = null

  private m_articleNodeType: StorageArticleNodeType | null = null

  private get m_icon(): string {
    return this.getNodeTypeIcon({
      nodeType: StorageNodeType.Dir,
      articleNodeType: this.m_articleNodeType,
    })
  }

  private get m_title(): string {
    const nodeTypeLabel = this.getNodeTypeLabel({
      nodeType: StorageNodeType.Dir,
      articleNodeType: this.m_articleNodeType,
    })
    return String(this.$t('common.createSth', { sth: nodeTypeLabel }))
  }

  private m_dirName: string | null = null

  private get m_parentPath(): string {
    if (!this.m_parentNode) {
      return path.join(this.pageStore.rootNode.label, '/')
    } else {
      return path.join(this.pageStore.rootNode.label, this.getDisplayPath(this.m_parentNode.path), '/')
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

  open(param: DialogParam): Promise<DialogResult | undefined> {
    if (param.parentPath === this.pageStore.rootNode.path) {
      this.m_parentNode = null
    } else {
      this.m_parentNode = this.storageLogic.sgetNode({ path: param.parentPath })
    }

    this.m_articleNodeType = param.articleNodeType || null

    return this.openProcess(param)
  }

  close(dialogResult?: DialogResult): void {
    this.m_clear()
    this.closeProcess(dialogResult)
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  private async m_create(): Promise<void> {
    this.m_dirName = this.m_dirName === null ? '' : this.m_dirName
    if (!this.m_validate()) return

    let dialogResult: DialogResult
    if (!this.m_parentNode) {
      dialogResult = { dir: '', name: this.m_dirName! }
    } else {
      dialogResult = { dir: this.m_parentNode.path, name: this.m_dirName! }
    }
    this.close(dialogResult)
  }

  private m_clear(): void {
    this.m_dirName = null
    this.m_dirNameInput.resetValidation()
  }

  private m_validate(): boolean {
    // ディレクトリ名必須入力チェック
    if (this.m_dirName === '') {
      const target = String(this.$t('common.sthName', { sth: StorageNodeType.getLabel(StorageNodeType.Dir) }))
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
    const siblingNodes = this.storageLogic.getChildren(this.m_parentNode ? this.m_parentNode.path : '')
    for (const siblingNode of siblingNodes) {
      if (siblingNode.name === this.m_dirName) {
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
