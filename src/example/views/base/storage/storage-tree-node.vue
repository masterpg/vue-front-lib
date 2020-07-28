<style lang="sass" scoped>
@import 'src/example/styles/app.variables'

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

.fade-enter-active, .fade-leave-active
  transition: opacity .5s

.fade-enter, .fade-leave
  opacity: 0
</style>

<template>
  <div>
    <!-- 自ノード -->
    <div ref="nodeContainer" class="node-container layout horizontal center" :class="{ eldest: isEldest }">
      <!-- 遅延ロードアイコン -->
      <div v-show="lazyLoadStatus === 'loading'" ref="lazyLoadIcon" class="icon-container">
        <comp-loading-spinner size="20px" />
      </div>
      <!-- トグルアイコン -->
      <div v-show="lazyLoadStatus !== 'loading'" class="icon-container">
        <!-- トグルアイコン有り -->
        <template v-if="hasChildren">
          <q-icon name="arrow_right" size="26px" color="grey-6" class="toggle-icon" :class="[opened ? 'rotate-90' : '']" @click="toggleIconOnClick" />
        </template>
        <!-- トグルアイコン無し -->
        <template v-else>
          <q-icon name="" size="26px" />
        </template>
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
        <storage-node-popup-menu
          :node="{ path: value, nodeType }"
          :is-root="m_isRoot"
          :disabled="disableContextMenu"
          context-menu
          @select="m_contextMenuOnSelect"
        />
      </div>
    </div>

    <!-- 子ノード -->
    <div ref="childContainer" class="child-container"></div>
  </div>
</template>

<script lang="ts">
import * as path from 'path'
import { CompTreeNode, CompTreeNodeEditData, NoCache, RequiredStorageNodeShareSettings, StorageNodeShareSettings, StorageNodeType } from '@/lib'
import { StorageNodePopupMenuSelectEvent, StorageTreeNode, StorageTreeNodeData } from './base'
import { Component } from 'vue-property-decorator'
import { Dayjs } from 'dayjs'
import StorageNodePopupMenu from './storage-node-popup-menu.vue'
import { removeStartDirChars } from 'web-base-lib'

// @ts-ignore `CompTreeNode<StorageTreeNode>`によって発生するエラーを回避
@Component({
  components: {
    StorageNodePopupMenu,
  },
})
export default class StorageTreeNodeClass extends CompTreeNode<StorageTreeNode> implements StorageTreeNode {
  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  get extraEventNames(): string[] {
    return ['menu-select']
  }

  get id(): string {
    return this.nodeData.id
  }

  get name(): string {
    return this.nodeData.label
  }

  get dir(): string {
    return removeStartDirChars(path.dirname(this.nodeData.value))
  }

  get path(): string {
    return this.nodeData.value
  }

  get nodeType(): StorageNodeType {
    return this.nodeData.nodeType
  }

  get nodeTypeName(): string {
    if (this.nodeType === StorageNodeType.Dir) {
      return String(this.$tc('common.folder', 1))
    } else {
      return String(this.$tc('common.file', 1))
    }
  }

  get contentType(): string {
    return this.nodeData.contentType
  }

  get size(): number {
    return this.nodeData.size
  }

  get share(): StorageNodeShareSettings {
    return this.nodeData.share
  }

  get url(): string {
    return this.nodeData.url
  }

  get createdAt(): Dayjs {
    return this.nodeData.createdAt
  }

  get updatedAt(): Dayjs {
    return this.nodeData.updatedAt
  }

  get disableContextMenu(): boolean {
    return this.nodeData.disableContextMenu!
  }

  private m_inheritedShare: RequiredStorageNodeShareSettings = { isPublic: false, readUIds: [], writeUIds: [] }

  get inheritedShare(): RequiredStorageNodeShareSettings {
    this.m_inheritedShare.isPublic = this.m_getIsPublic()
    this.m_inheritedShare.readUIds = this.m_getReadUIds()
    return this.m_inheritedShare
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  protected readonly nodeData!: StorageTreeNodeData

  private get m_isRoot(): boolean {
    return this.parent === null
  }

  private get m_isDir(): boolean {
    if (this.m_isRoot) return false
    return this.nodeType === StorageNodeType.Dir
  }

  private get m_isFile(): boolean {
    if (this.m_isRoot) return false
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

  protected init_sub(nodeData: StorageTreeNodeData): void {
    // 任意項目は値が設定されていないとリアクティブにならないのでここで初期化
    this.$set(nodeData, 'disableContextMenu', Boolean(nodeData.disableContextMenu))
  }

  protected setNodeData_sub(editData: CompTreeNodeEditData<StorageTreeNodeData>): void {
    if (typeof editData.id === 'string') {
      this.nodeData.id = editData.id
    }
    if (typeof editData.contentType === 'string') {
      this.nodeData.contentType = editData.contentType
    }
    if (typeof editData.size === 'number') {
      this.nodeData.size = editData.size
    }
    if (editData.share) {
      this.nodeData.share.isPublic = editData.share.isPublic
      this.nodeData.share.readUIds = editData.share.readUIds
      this.nodeData.share.writeUIds = editData.share.writeUIds
    }
    if (typeof editData.url === 'string') {
      this.nodeData.url = editData.url
    }
    if (editData.createdAt) {
      this.nodeData.createdAt = editData.createdAt
    }
    if (editData.updatedAt) {
      this.nodeData.updatedAt = editData.updatedAt
    }
    if (typeof editData.disableContextMenu === 'boolean') {
      this.nodeData.disableContextMenu = editData.disableContextMenu
    }
  }

  /**
   * 上位ディレクトリの共有設定を加味した公開フラグを取得します。
   */
  private m_getIsPublic(): boolean {
    if (typeof this.share.isPublic === 'boolean') {
      return this.share.isPublic
    } else {
      if (this.parent) {
        const parent = this.parent as this
        if (typeof parent.share.isPublic === 'boolean') {
          return parent.share.isPublic
        } else {
          return parent.m_getIsPublic()
        }
      } else {
        return Boolean(this.share.isPublic)
      }
    }
  }

  /**
   * 上位ディレクトリの共有設定を加味した読み込み権限を取得します。
   */
  private m_getReadUIds(): string[] {
    if (this.share.readUIds) {
      return this.share.readUIds
    } else {
      if (this.parent) {
        const parent = this.parent as this
        if (parent.share.readUIds) {
          return parent.share.readUIds
        } else {
          return parent.m_getReadUIds()
        }
      } else {
        return []
      }
    }
  }

  /**
   * コンテキストメニューでメニューアイテムが選択された際のリスナです。
   * @param e
   */
  private m_contextMenuOnSelect(e: StorageNodePopupMenuSelectEvent) {
    this.dispatchExtraEvent('menu-select', e)
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
