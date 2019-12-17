<style lang="sass" scoped>
@import '../../../styles/app.variables'

.item
  cursor: pointer
  white-space: nowrap
  user-select: none

  &:hover
    text-decoration: underline

  &.selected
    color: var(--comp-tree-selected-color, $pink-5)

  &.unselectable
    color: var(--comp-tree-unselectable-color, $grey-9)
    cursor: default
    &:hover
      text-decoration: none
</style>

<template>
  <div class="layout horizontal center">
    <span class="item" :class="{ selected, unselectable }" @click="itemOnClick()" @click.right="m_itemOnRightClick()">
      {{ label }}
      <q-menu touch-position context-menu>
        <!-- ストレージ用メニュー -->
        <q-list v-show="m_isStorage" dense style="min-width: 100px">
          <q-item v-close-popup clickable>
            <q-item-section @click="m_dispatchReloadSelected()">{{ $t('common.reload') }}</q-item-section>
          </q-item>
          <q-item v-close-popup clickable>
            <q-item-section @click="m_dispatchCreateDirSelected()">{{ $t('common.createSomehow', { somehow: $t('common.folder') }) }}</q-item-section>
          </q-item>
          <q-item v-close-popup clickable>
            <q-item-section @click="m_dispatchFilesUploadSelected()">{{
              $t('common.uploadSomehow', { somehow: $tc('common.file', 2) })
            }}</q-item-section>
          </q-item>
          <q-item v-close-popup clickable>
            <q-item-section @click="m_dispatchDirUploadSelected()">{{
              $t('common.uploadSomehow', { somehow: $tc('common.folder', 1) })
            }}</q-item-section>
          </q-item>
        </q-list>
        <!-- フォルダ用メニュー -->
        <q-list v-show="m_isDir" dense style="min-width: 100px">
          <q-item v-close-popup clickable>
            <q-item-section @click="m_dispatchCreateDirSelected()">{{ $t('common.createSomehow', { somehow: $t('common.folder') }) }}</q-item-section>
          </q-item>
          <q-item v-close-popup clickable>
            <q-item-section @click="m_dispatchFilesUploadSelected()">{{
              $t('common.uploadSomehow', { somehow: $tc('common.file', 2) })
            }}</q-item-section>
          </q-item>
          <q-item v-close-popup clickable>
            <q-item-section @click="m_dispatchDirUploadSelected()">{{
              $t('common.uploadSomehow', { somehow: $tc('common.folder', 1) })
            }}</q-item-section>
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
    </span>
  </div>
</template>

<script lang="ts">
import { CompTreeNodeItem, StorageNodeType } from '@/lib'
import { Component } from 'vue-property-decorator'
import { StorageTreeNodeData } from '@/example/views/demo/storage/base'

@Component
export default class StorageTreeNodeItem extends CompTreeNodeItem<StorageTreeNodeData> {
  //----------------------------------------------------------------------
  //
  //  Overridden
  //
  //----------------------------------------------------------------------

  protected initPlaceholder(nodeData: StorageTreeNodeData): void {
    this.m_nodeType = nodeData.nodeType
  }

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

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  public nodeData!: StorageTreeNodeData

  private m_nodeType: StorageNodeType | 'Storage' = StorageNodeType.Dir

  get nodeType(): StorageNodeType | 'Storage' {
    return this.m_nodeType
  }

  get nodeTypeName(): string {
    if (this.nodeType === 'Storage') {
      return 'Storage'
    } else if (this.nodeType === StorageNodeType.Dir) {
      return String(this.$t('common.folder'))
    } else {
      return String(this.$t('common.file'))
    }
  }

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  private get m_isStorage(): boolean {
    return this.nodeType === 'Storage'
  }

  private get m_isDir(): boolean {
    return this.nodeType === StorageNodeType.Dir
  }

  private get m_isFile(): boolean {
    return this.nodeType === StorageNodeType.File
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  private m_dispatchEvent(name: string): void {
    this.$el.dispatchEvent(
      new CustomEvent(name, {
        bubbles: true,
        cancelable: true,
        composed: true,
      })
    )
  }

  private m_dispatchReloadSelected(): void {
    this.m_dispatchEvent('reload-selected')
  }

  private m_dispatchCreateDirSelected(): void {
    this.m_dispatchEvent('create-dir-selected')
  }

  private m_dispatchFilesUploadSelected(): void {
    this.m_dispatchEvent('files-upload-selected')
  }

  private m_dispatchDirUploadSelected(): void {
    this.m_dispatchEvent('dir-upload-selected')
  }

  private m_dispatchMoveSelected(): void {
    this.m_dispatchEvent('move-selected')
  }

  private m_dispatchRenameSelected(): void {
    this.m_dispatchEvent('rename-selected')
  }

  private m_dispatchDeleteSelected(): void {
    this.m_dispatchEvent('delete-selected')
  }

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------

  private m_itemOnRightClick(e) {}
}
</script>
