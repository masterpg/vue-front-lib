<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.node-container
  padding-top: var(--tree-distance, 10px)
  &.eldest
    padding-top: 0

.toggle-icon-container
  @extend %layout-horizontal
  @extend %layout-center-center
  font-size: 1.5em
  margin-right: 6px
  .toggle-icon
    cursor: pointer
    &.anime
      transition: transform .5s

.icon-container
  @extend %layout-horizontal
  @extend %layout-center-center
  min-width: 1.5em
  max-width: 1.5em
  height: 1.5em
  margin-right: 6px

.item-container
  cursor: pointer
  white-space: nowrap
  &:hover
    .item
      text-decoration: underline
  &.selected
    .item
      color: var(--tree-selected-color, $pink-5)
  &.unselectable
    cursor: default
    .item
      color: var(--tree-unselectable-color, $grey-9)
    &:hover
      .item
        text-decoration: none

  &.word-wrap
    height: unset
    white-space: unset
    overflow-wrap: anywhere

.child-container
  padding-left: var(--tree-indent, 16px)
  height: 0
  overflow: hidden
</style>

<template>
  <div ref="el" class="StorageTreeNode">
    <!-- 自ノード -->
    <div ref="nodeContainer" class="node-container layout horizontal center" :class="{ eldest: isEldest }">
      <!-- 遅延ロードアイコン -->
      <div v-show="lazyLoadStatus === 'loading'" ref="lazyLoadIcon" class="toggle-icon-container">
        <q-spinner color="grey-6" />
      </div>
      <!-- トグルアイコン -->
      <div v-show="lazyLoadStatus !== 'loading'" class="toggle-icon-container">
        <!-- トグルアイコン有り -->
        <template v-if="hasChildren">
          <q-icon
            name="arrow_right"
            color="grey-6"
            class="toggle-icon"
            :class="[opened ? 'rotate-90' : '', hasToggleAnime ? 'anime' : '']"
            @click="toggleIconOnClick"
          />
        </template>
        <!-- トグルアイコン無し -->
        <template v-else>
          <!-- アイコン用スペース -->
          <q-icon v-if="Boolean(icon)" name="" />
          <!-- ドットアイコン -->
          <q-icon v-else color="grey-6">
            <svg class="dot" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24" width="24" height="24">
              <circle cx="12" cy="12" r="3" fill="#9b9b9b" stroke-width="0" />
            </svg>
          </q-icon>
        </template>
      </div>

      <!-- アイテムコンテナ -->
      <div
        class="layout horizontal center item-container"
        :class="{ selected, unselectable, 'word-wrap': wordWrap }"
        @click="itemContainerOnClick"
        @click.right="itemOnRightClick"
      >
        <!-- アイコン -->
        <div v-if="Boolean(icon)" class="icon-container">
          <q-icon :name="icon" :color="iconColor" :style="{ fontSize: iconSize }" />
        </div>
        <!-- アイテム -->
        <div class="item">
          <span ref="itemLabel">{{ label }}</span>
        </div>
        <!-- コンテキストメニュー -->
        <StorageNodePopupMenu
          :storage-type="storageType"
          :node="{ path, nodeType }"
          :is-root="isRoot"
          :disabled="disableContextMenu"
          context-menu
          @select="popupMenuOnNodeAction"
        />
      </div>
    </div>

    <!-- 子ノード -->
    <div ref="childContainer" class="child-container"></div>
  </div>
</template>

<script lang="ts">
import { ComputedRef, SetupContext, computed, defineComponent, reactive } from '@vue/composition-api'
import { RequiredStorageNodeShareSettings, StorageArticleSettings, StorageNodeShareSettings, StorageNodeType } from '@/app/service'
import { StorageNodeActionEvent, StorageTreeNodeData, StorageTreeNodeEditData } from '@/app/views/base/storage/base'
import { TreeNode, TreeNodeImpl } from '@/app/components/tree-view'
import { Dayjs } from 'dayjs'
import { LoadingSpinner } from '@/app/components/loading-spinner'
import { StorageNodePopupMenu } from '@/app/views/base/storage/storage-node-popup-menu.vue'
import _path from 'path'
import { removeStartDirChars } from 'web-base-lib'
import { useI18n } from '@/app/i18n'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface StorageTreeNodeMembers {
  readonly storageType: StorageNodeType
  readonly id: string
  readonly name: string
  readonly dir: string
  readonly path: string
  readonly nodeType: StorageNodeType
  readonly contentType: string
  readonly size: number
  readonly share: StorageNodeShareSettings
  readonly article?: StorageArticleSettings
  readonly url: string
  readonly createdAt: Dayjs
  readonly updatedAt: Dayjs
  readonly version: number
  readonly disableContextMenu: boolean
  readonly inheritedShare: RequiredStorageNodeShareSettings
}

interface StorageTreeNode extends TreeNode<StorageTreeNodeData>, StorageTreeNodeMembers {}

interface StorageTreeNodeImpl extends TreeNodeImpl<StorageTreeNodeData>, StorageTreeNodeMembers {
  getIsPublic(): boolean
  getReadUIds(): string[]
}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace StorageTreeNode {
  export interface Props {}

  export const clazz = defineComponent({
    name: 'StorageTreeNode',

    components: {
      LoadingSpinner: LoadingSpinner.clazz,
      StorageNodePopupMenu: StorageNodePopupMenu.clazz,
    },

    setup: (props: Readonly<Props>, ctx) => setup(props, ctx),
  })

  export function setup(props: Readonly<Props>, ctx: SetupContext) {
    //----------------------------------------------------------------------
    //
    //  Variables
    //
    //----------------------------------------------------------------------

    const base = TreeNode.setup(props, ctx)
    const nodeData = base.nodeData as ComputedRef<StorageTreeNodeData>
    const { tc } = useI18n()

    base.extraEventNames.value.push('node-action')

    const isRoot = computed(() => {
      return base.parent.value === null
    })

    //----------------------------------------------------------------------
    //
    //  Properties
    //
    //----------------------------------------------------------------------

    const storageType = computed(() => {
      return nodeData.value.storageType
    })

    const id = computed(() => {
      return nodeData.value.id
    })

    const name = computed(() => {
      return _path.basename(nodeData.value.value)
    })

    const dir = computed(() => {
      return removeStartDirChars(_path.dirname(nodeData.value.value))
    })

    const path = computed(() => {
      return nodeData.value.value
    })

    const nodeType = computed(() => {
      return nodeData.value.nodeType
    })

    const nodeTypeName = computed(() => {
      if (nodeData.value.nodeType === StorageNodeType.Dir) {
        return String(tc('common.folder', 1))
      } else {
        return String(tc('common.file', 1))
      }
    })

    const contentType = computed(() => {
      return nodeData.value.contentType
    })

    const size = computed(() => {
      return nodeData.value.size
    })

    const share = computed(() => {
      return nodeData.value.share
    })

    const article = computed(() => {
      return nodeData.value.article
    })

    const url = computed(() => {
      return nodeData.value.url
    })

    const createdAt = computed(() => {
      return nodeData.value.createdAt
    })

    const updatedAt = computed(() => {
      return nodeData.value.updatedAt
    })

    const version = computed(() => {
      return nodeData.value.version
    })

    const disableContextMenu = computed(() => {
      return nodeData.value.disableContextMenu
    })

    const _inheritedShare = reactive({
      isPublic: false,
      readUIds: [] as string[],
      writeUIds: [] as string[],
    })
    const inheritedShare = computed(() => {
      _inheritedShare.isPublic = getIsPublic()
      _inheritedShare.readUIds.splice(0)
      _inheritedShare.readUIds.push(...getReadUIds())
      return _inheritedShare
    })

    //----------------------------------------------------------------------
    //
    //  Internal methods
    //
    //----------------------------------------------------------------------

    base.setNodeData_sub.value = (editData: StorageTreeNodeEditData) => {
      if (typeof editData.id === 'string') {
        nodeData.value.id = editData.id
      }
      if (typeof editData.contentType === 'string') {
        nodeData.value.contentType = editData.contentType
      }
      if (typeof editData.size === 'number') {
        nodeData.value.size = editData.size
      }
      if (editData.share) {
        nodeData.value.share.isPublic = editData.share.isPublic
        nodeData.value.share.readUIds = editData.share.readUIds
        nodeData.value.share.writeUIds = editData.share.writeUIds
      }
      if (editData.article) {
        nodeData.value.article = StorageArticleSettings.populate(editData.article, nodeData.value.article ?? {})
      }
      if (typeof editData.url === 'string') {
        nodeData.value.url = editData.url
      }
      if (editData.createdAt) {
        nodeData.value.createdAt = editData.createdAt
      }
      if (editData.updatedAt) {
        nodeData.value.updatedAt = editData.updatedAt
      }
      if (typeof editData.version === 'number') {
        nodeData.value.version = editData.version
      }
      if (typeof editData.disableContextMenu === 'boolean') {
        nodeData.value.disableContextMenu = editData.disableContextMenu
      }
    }

    /**
     * 上位ディレクトリの共有設定を加味した公開フラグを取得します。
     */
    const getIsPublic: StorageTreeNodeImpl['getIsPublic'] = () => {
      if (typeof nodeData.value.share.isPublic === 'boolean') {
        return nodeData.value.share.isPublic
      } else {
        if (base.parent.value) {
          const parent = base.parent.value as StorageTreeNodeImpl
          if (typeof parent.share.isPublic === 'boolean') {
            return parent.share.isPublic
          } else {
            return parent.getIsPublic()
          }
        } else {
          return Boolean(nodeData.value.share.isPublic)
        }
      }
    }

    /**
     * 上位ディレクトリの共有設定を加味した読み込み権限を取得します。
     */
    const getReadUIds: StorageTreeNodeImpl['getReadUIds'] = () => {
      if (nodeData.value.share.readUIds) {
        return nodeData.value.share.readUIds
      } else {
        if (base.parent.value) {
          const parent = base.parent.value as StorageTreeNodeImpl
          if (parent.share.readUIds) {
            return parent.share.readUIds
          } else {
            return parent.getReadUIds()
          }
        } else {
          return []
        }
      }
    }

    //----------------------------------------------------------------------
    //
    //  Event listeners
    //
    //----------------------------------------------------------------------

    /**
     * ポップアップメニューでアクションが選択された際のリスナです。
     * @param e
     */
    function popupMenuOnNodeAction(e: StorageNodeActionEvent) {
      base.dispatchExtraEvent('node-action', e)
    }

    function itemOnRightClick() {
      // 右クリック時にラベルの文字を選択状態にするサンプル
      // const range = document.createRange()
      // range.selectNodeContents(this.m_itemLabel)
      // const sel = window.getSelection()!
      // sel.removeAllRanges()
      // sel.addRange(range)
    }

    //----------------------------------------------------------------------
    //
    //  Result
    //
    //----------------------------------------------------------------------

    return {
      ...base,
      isRoot,
      storageType,
      id,
      name,
      dir,
      path,
      nodeType,
      contentType,
      size,
      share,
      article,
      url,
      createdAt,
      updatedAt,
      version,
      disableContextMenu,
      inheritedShare,
      getIsPublic,
      getReadUIds,
      popupMenuOnNodeAction,
      itemOnRightClick,
    }
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export default StorageTreeNode.clazz
// eslint-disable-next-line no-undef
export { StorageTreeNode }
</script>
