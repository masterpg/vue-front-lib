<style lang="sass" scoped>
@import 'src/example/styles/app.variables'

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
            v-show="m_sharingNodes.length === 1"
            ref="newNameInput"
            v-model="m_targetNodeName"
            :label="m_targetNodeLabel"
            class="app-pb-20"
            readonly
          >
            <template v-slot:prepend>
              <q-icon :name="m_targetNodeIcon" />
            </template>
          </q-input>
          <div class="app-mb-10">{{ m_selectPublicPrompt }}</div>
          <q-btn-toggle
            v-model="m_isPublic"
            toggle-color="primary"
            :options="[
              { label: $t('storage.share.notSet'), value: null },
              { label: $t('storage.share.private'), value: false },
              { label: $t('storage.share.public'), value: true },
            ]"
          />
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
          <q-btn flat rounded color="primary" :label="$t('common.ok')" @click="m_setShareSettings()" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script lang="ts">
import { BaseDialog, NoCache, StorageNode, StorageNodeShareSettings } from '@/lib'
import { StoragePageMixin, getStorageNodeTypeIcon, getStorageNodeTypeLabel } from './base'
import { Component } from 'vue-property-decorator'
import { QDialog } from 'quasar'
import { mixins } from 'vue-class-component'

@Component
class BaseDialogMixin extends BaseDialog<string[], StorageNodeShareSettings | undefined> {}

@Component({ components: {} })
export default class StorageNodeShareDialog extends mixins(BaseDialogMixin, StoragePageMixin) {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  @NoCache
  protected get dialog(): QDialog {
    return this.$refs.dialog as QDialog
  }

  private m_sharingNodes: StorageNode[] = []

  private get m_title(): string {
    if (this.m_sharingNodes.length === 1) {
      const nodeType = this.m_sharingNodes[0].nodeType
      return String(this.$t('common.shareSth', { sth: getStorageNodeTypeLabel(nodeType) }))
    } else if (this.m_sharingNodes.length >= 2) {
      const sth = String(this.$tc('common.item', this.m_sharingNodes.length))
      return String(this.$t('common.shareSth', { sth }))
    }
    return ''
  }

  private get m_selectPublicPrompt(): string {
    if (this.m_sharingNodes.length === 1) {
      const nodeType = this.m_sharingNodes[0].nodeType
      return String(this.$t('storage.share.selectPublicPrompt', { nodeType: getStorageNodeTypeLabel(nodeType) }))
    } else if (this.m_sharingNodes.length >= 2) {
      const nodeTypeName = String(this.$tc('common.item', this.m_sharingNodes.length))
      return String(this.$t('storage.share.selectPublicPrompt', { nodeType: nodeTypeName }))
    }
    return ''
  }

  private get m_targetNodeLabel(): string {
    if (this.m_sharingNodes.length === 1) {
      const nodeType = this.m_sharingNodes[0].nodeType
      return String(this.$t('storage.share.sharingNode', { nodeType: getStorageNodeTypeLabel(nodeType) }))
    }
    return ''
  }

  private get m_targetNodeName(): string {
    if (this.m_sharingNodes.length === 1) {
      return this.m_sharingNodes[0].name
    }
    return ''
  }

  private get m_targetNodeIcon(): string {
    if (this.m_sharingNodes.length === 1) {
      const nodeType = this.m_sharingNodes[0].nodeType
      return getStorageNodeTypeIcon(nodeType)
    }
    return ''
  }

  private m_isPublic: boolean | null = null

  private m_errorMessage = ''

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  open(nodePaths: string[]): Promise<StorageNodeShareSettings | undefined> {
    this.m_sharingNodes = []
    for (const nodePath of nodePaths) {
      const node = this.storageLogic.sgetNode({ path: nodePath })
      this.m_sharingNodes.push(node)
    }

    // ノードが複数指定された場合、親が同じであることを検証
    const sharingNodeParentPath = this.m_sharingNodes[0].dir
    for (const sharingNode of this.m_sharingNodes) {
      if (sharingNode.dir !== sharingNodeParentPath) {
        throw new Error('All nodes must have the same parent.')
      }
    }

    // 全てのノードの公開タイプが同じ場合、公開フラグのトグルボタンに反映する
    // 一つでも公開タイプが違う場合、公開フラグのトグルボタンは未設定にする
    let isPublic = this.m_sharingNodes[0].share.isPublic
    for (const sharingNode of this.m_sharingNodes) {
      if (isPublic !== sharingNode.share.isPublic) {
        isPublic = sharingNode.share.isPublic
        break
      }
    }
    this.m_isPublic = isPublic

    return this.openProcess(nodePaths, {
      opened: () => {},
    })
  }

  close(settings?: StorageNodeShareSettings): void {
    this.m_clear()
    this.closeProcess(settings)
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  private m_setShareSettings(): void {
    const settings: StorageNodeShareSettings = {
      isPublic: this.m_isPublic,
      readUIds: null,
      writeUIds: null,
    }
    this.close(settings)
  }

  private m_clear(): void {
    this.m_errorMessage = ''
  }

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------

  private m_dialogOnShow() {}
}
</script>
