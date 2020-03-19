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
            v-model="m_publicType"
            toggle-color="primary"
            :options="[
              { label: $t('storage.share.notSet'), value: 'notSet' },
              { label: $t('storage.share.private'), value: 'private' },
              { label: $t('storage.share.public'), value: 'public' },
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
import { BaseDialog, NoCache, StorageNodeShareSettings, StorageNodeType } from '@/lib'
import { StorageTypeMixin, treeSortFunc } from '@/example/views/demo/storage/base'
import { Component } from 'vue-property-decorator'
import { QDialog } from 'quasar'
import StorageTreeNode from '@/example/views/demo/storage/storage-tree-node.vue'
import { mixins } from 'vue-class-component'

@Component({ components: {} })
export default class StorageNodeShareDialog extends BaseDialog<StorageTreeNode[], StorageNodeShareSettings | undefined> {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  @NoCache
  protected get dialog(): QDialog {
    return this.$refs.dialog as QDialog
  }

  private get m_sharingNodes(): StorageTreeNode[] {
    return this.params || []
  }

  private get m_title(): string {
    if (this.m_sharingNodes.length === 1) {
      return String(this.$t('common.shareSomehow', { somehow: this.m_sharingNodes[0].nodeTypeName }))
    } else if (this.m_sharingNodes.length >= 2) {
      const somehow = String(this.$tc('common.item', this.m_sharingNodes.length))
      return String(this.$t('common.shareSomehow', { somehow }))
    }
    return ''
  }

  private get m_selectPublicPrompt(): string {
    if (this.m_sharingNodes.length === 1) {
      return String(this.$t('storage.share.selectPublicPrompt', { nodeType: this.m_sharingNodes[0].nodeTypeName }))
    } else if (this.m_sharingNodes.length >= 2) {
      const nodeTypeName = String(this.$tc('common.item', this.m_sharingNodes.length))
      return String(this.$t('storage.share.selectPublicPrompt', { nodeType: nodeTypeName }))
    }
    return ''
  }

  private get m_targetNodeLabel(): string {
    if (this.m_sharingNodes.length === 1) {
      return String(this.$t('storage.share.sharingNode', { nodeType: this.m_sharingNodes[0].nodeTypeName }))
    }
    return ''
  }

  private get m_targetNodeName(): string {
    if (this.m_sharingNodes.length === 1) {
      return this.m_sharingNodes[0].label
    }
    return ''
  }

  private get m_targetNodeIcon(): string {
    if (this.m_sharingNodes.length === 1) {
      return this.m_sharingNodes[0].icon
    }
    return ''
  }

  private m_publicType: 'notSet' | 'private' | 'public' = 'notSet'

  private m_errorMessage: string = ''

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  open(sharingNodes: StorageTreeNode[]): Promise<StorageNodeShareSettings | undefined> {
    // ノードが複数指定された場合、親が同じであることを検証
    let sharingNodeParentPath = sharingNodes[0].parent!.value
    for (const sharingNode of sharingNodes) {
      if (sharingNode.parent!.value !== sharingNodeParentPath) {
        throw new Error('All nodes must have the same parent.')
      }
    }

    // 全てのノードの公開タイプが同じ場合、公開フラグのトグルボタンに反映する
    // 一つでも公開タイプが違う場合、公開フラグのトグルボタンは未設定にする
    const toPublicType: (node: StorageTreeNode) => 'notSet' | 'private' | 'public' = node => {
      if (typeof node.share.isPublic === 'boolean') {
        return node.share.isPublic ? 'public' : 'private'
      } else {
        return 'notSet'
      }
    }

    let publicType = toPublicType(sharingNodes[0])
    for (const sharingNode of sharingNodes) {
      if (publicType !== toPublicType(sharingNode)) {
        publicType = 'notSet'
        break
      }
    }
    this.m_publicType = publicType

    return this.openProcess(sharingNodes, {
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
    let isPublic: boolean | undefined = undefined
    if (this.m_publicType === 'public') {
      isPublic = true
    } else if (this.m_publicType === 'private') {
      isPublic = false
    }

    const settings: StorageNodeShareSettings = {
      isPublic,
      uids: undefined,
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
