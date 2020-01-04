<style lang="sass" scoped>
@import '../../../styles/app.variables'

.node-container
  padding-top: var(--comp-tree-distance, 6px)
  &.eldest
    padding-top: 0

.icon-container
  @extend %layout-horizontal
  @extend %layout-center-center
  min-width: 1.5em
  max-width: 1.5em
  height: 1.5em
  margin-right: 6px
  .toggle-icon
    transition: transform .5s
    cursor: pointer

.item-container
  height: var(--comp-tree-line-height, 26px)
  cursor: pointer
  white-space: nowrap
  &:hover
    .item
      text-decoration: underline
  &.selected
    .item
      color: var(--comp-tree-selected-color, $pink-5)
  &.unselectable
    cursor: default
    .item
      color: var(--comp-tree-unselectable-color, $grey-9)
    &:hover
      .item
        text-decoration: none
  .item
    user-select: none

.child-container
  padding-left: var(--comp-tree-indent, 16px)
  height: 0
  overflow: hidden
</style>

<template>
  <div>
    <!-- 自ノード -->
    <div ref="nodeContainer" class="node-container layout horizontal center" :class="{ eldest: isEldest }">
      <!-- トグルアイコン有り -->
      <div v-if="hasChildren" class="icon-container">
        <q-icon name="arrow_right" size="26px" color="grey-6" class="toggle-icon" :class="[opened ? 'rotate-90' : '']" @click="toggleIconOnClick" />
      </div>
      <!-- トグルアイコン無し -->
      <div v-else class="icon-container">
        <q-icon name="" size="26px" />
      </div>

      <!-- アイテムコンテナ -->
      <div
        class="layout horizontal center item-container"
        :class="{ selected, unselectable }"
        @click="itemContainerOnClick"
        @click.right="m_itemOnRightClick"
      >
        <!-- 指定アイコン -->
        <div v-if="!!icon" class="icon-container">
          <q-icon :name="icon" :color="iconColor" size="24px" />
        </div>
        <!-- ドットアイコン -->
        <div v-else class="icon-container">
          <svg class="dot" width="6px" height="6px" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
            <circle cx="3" cy="3" r="3" fill="#9b9b9b" stroke-width="0" />
          </svg>
        </div>
        <!-- アイテム -->
        <div class="item">
          <span ref="itemLabel">{{ label }}</span>
        </div>
        <!-- コンテキストメニュー -->
        <q-menu touch-position context-menu>
          <!-- ルートノード用メニュー -->
          <q-list v-show="m_isStorage" dense style="min-width: 100px">
            <q-item v-close-popup clickable>
              <q-item-section @click="m_dispatchReloadSelected()">{{ $t('common.reload') }}</q-item-section>
            </q-item>
            <q-item v-close-popup clickable>
              <q-item-section @click="m_dispatchCreateDirSelected()">
                {{ $t('common.createSomehow', { somehow: $tc('common.folder', 1) }) }}
              </q-item-section>
            </q-item>
            <q-item v-close-popup clickable>
              <q-item-section @click="m_dispatchFilesUploadSelected()">
                {{ $t('common.uploadSomehow', { somehow: $tc('common.file', 2) }) }}
              </q-item-section>
            </q-item>
            <q-item v-close-popup clickable>
              <q-item-section @click="m_dispatchDirUploadSelected()">
                {{ $t('common.uploadSomehow', { somehow: $tc('common.folder', 1) }) }}
              </q-item-section>
            </q-item>
          </q-list>
          <!-- フォルダ用メニュー -->
          <q-list v-show="m_isDir" dense style="min-width: 100px">
            <q-item v-close-popup clickable>
              <q-item-section @click="m_dispatchCreateDirSelected()">
                {{ $t('common.createSomehow', { somehow: $tc('common.folder', 1) }) }}
              </q-item-section>
            </q-item>
            <q-item v-close-popup clickable>
              <q-item-section @click="m_dispatchFilesUploadSelected()">
                {{ $t('common.uploadSomehow', { somehow: $tc('common.file', 2) }) }}
              </q-item-section>
            </q-item>
            <q-item v-close-popup clickable>
              <q-item-section @click="m_dispatchDirUploadSelected()">
                {{ $t('common.uploadSomehow', { somehow: $tc('common.folder', 1) }) }}
              </q-item-section>
            </q-item>
            <q-item v-close-popup clickable>
              <q-item-section @click="m_dispatchMoveSelected()">{{ $t('common.move') }}</q-item-section>
            </q-item>
            <q-item v-close-popup clickable>
              <q-item-section @click="m_dispatchRenameSelected()">{{ $t('common.rename') }}</q-item-section>
            </q-item>
            <q-item v-close-popup clickable>
              <q-item-section @click="m_dispatchDeleteSelected()">{{ $t('common.delete') }}</q-item-section>
            </q-item>
          </q-list>
          <!-- ファイル用メニュー -->
          <q-list v-show="m_isFile" dense style="min-width: 100px">
            <q-item v-close-popup clickable>
              <q-item-section @click="m_dispatchMoveSelected()">{{ $t('common.move') }}</q-item-section>
            </q-item>
            <q-item v-close-popup clickable>
              <q-item-section @click="m_dispatchRenameSelected()">{{ $t('common.rename') }}</q-item-section>
            </q-item>
            <q-item v-close-popup clickable>
              <q-item-section @click="m_dispatchDeleteSelected()">{{ $t('common.delete') }}</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </div>
    </div>

    <!-- 子ノード -->
    <div ref="childContainer" class="child-container" :class="{ opened: opened }"></div>
  </div>
</template>

<script lang="ts">
import { CompTreeNode, CompTreeNodeEditData, NoCache, StorageNodeType } from '@/lib'
import { Component } from 'vue-property-decorator'
import { Dayjs } from 'dayjs'
import { StorageTreeNodeData } from '@/example/views/demo/storage/base'

@Component
export default class StorageTreeNode extends CompTreeNode {
  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  get extraEventNames(): string[] {
    return [
      'reload-selected',
      'create-dir-selected',
      'files-upload-selected',
      'dir-upload-selected',
      'move-selected',
      'rename-selected',
      'delete-selected',
    ]
  }

  get nodeType(): StorageNodeType | 'Storage' {
    return this.nodeData.nodeType
  }

  get nodeTypeName(): string {
    if (this.nodeType === 'Storage') {
      return 'Storage'
    } else if (this.nodeType === StorageNodeType.Dir) {
      return String(this.$tc('common.folder', 1))
    } else {
      return String(this.$tc('common.file', 1))
    }
  }

  get createdDate(): Dayjs {
    return this.nodeData.created
  }

  get updatedDate(): Dayjs {
    return this.nodeData.updated
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  protected readonly nodeData!: StorageTreeNodeData

  private get m_isStorage(): boolean {
    return this.nodeType === 'Storage'
  }

  private get m_isDir(): boolean {
    return this.nodeType === StorageNodeType.Dir
  }

  private get m_isFile(): boolean {
    return this.nodeType === StorageNodeType.File
  }

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

  @NoCache
  protected get m_itemLabel(): HTMLElement {
    return this.$refs.itemLabel as HTMLElement
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  setNodeData(editData: CompTreeNodeEditData<StorageTreeNodeData>): void {
    this.setBaseNodeData(editData)
    if (editData.created) {
      this.nodeData.created = editData.created
    }
    if (editData.updated) {
      this.nodeData.updated = editData.updated
    }
  }

  private m_dispatchReloadSelected(): void {
    this.dispatchExtraEvent('reload-selected')
  }

  private m_dispatchCreateDirSelected(): void {
    this.dispatchExtraEvent('create-dir-selected')
  }

  private m_dispatchFilesUploadSelected(): void {
    this.dispatchExtraEvent('files-upload-selected')
  }

  private m_dispatchDirUploadSelected(): void {
    this.dispatchExtraEvent('dir-upload-selected')
  }

  private m_dispatchMoveSelected(): void {
    this.dispatchExtraEvent('move-selected')
  }

  private m_dispatchRenameSelected(): void {
    this.dispatchExtraEvent('rename-selected')
  }

  private m_dispatchDeleteSelected(): void {
    this.dispatchExtraEvent('delete-selected')
  }

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------

  private m_itemOnRightClick(e) {
    // 右クリック時にラベルの文字を選択状態にするサンプル
    // const range = document.createRange()
    // range.selectNodeContents(this.m_itemLabel)
    // const sel = window.getSelection()!
    // sel.removeAllRanges()
    // sel.addRange(range)
  }
}
</script>
