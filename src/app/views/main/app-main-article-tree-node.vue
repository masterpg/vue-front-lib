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
  <div ref="el" class="AppMainArticleTreeNode">
    <!-- 自ノード -->
    <div ref="nodeContainer" class="node-container layout horizontal start" :class="{ eldest: isEldest }">
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
      <div class="layout horizontal center item-container" :class="{ selected, unselectable, 'word-wrap': wordWrap }" @click="itemContainerOnClick">
        <!-- アイコン -->
        <div v-if="Boolean(icon)" class="icon-container">
          <q-icon :name="icon" :color="iconColor" :style="{ fontSize: iconSize }" />
        </div>
        <!-- アイテム -->
        <div class="item">
          <span>{{ label }}</span>
        </div>
      </div>
    </div>

    <!-- 子ノード -->
    <div ref="childContainer" class="child-container"></div>
  </div>
</template>

<script lang="ts">
import { ComputedRef, computed, defineComponent, set } from '@vue/composition-api'
import { Dayjs } from 'dayjs'
import { StorageArticleDirType } from '@/app/services'
import { TreeNode } from '@/app/components/tree-view/tree-node.vue'
import { TreeNodeData } from '@/app/components/tree-view/base'
import { TreeNodeImpl } from '@/app/components/tree-view'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface AppMainArticleTreeNodeMembers {
  id: string
  type: StorageArticleDirType
  name: string
  dir: string
  path: string
  label: string
  version: number
  createdAt: Dayjs
  updatedAt: Dayjs
}

interface AppMainArticleTreeNodeData extends TreeNodeData, AppMainArticleTreeNodeMembers {}

interface AppMainArticleTreeNode extends TreeNode<AppMainArticleTreeNodeData>, AppMainArticleTreeNode.Props, AppMainArticleTreeNodeMembers {}

interface AppMainArticleTreeNodeImpl extends TreeNodeImpl<AppMainArticleTreeNodeData>, AppMainArticleTreeNode.Props, AppMainArticleTreeNodeMembers {}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace AppMainArticleTreeNode {
  export interface Props {}

  export const clazz = defineComponent({
    name: 'AppMainArticleTreeNode',

    setup(props: Props, context) {
      //----------------------------------------------------------------------
      //
      //  Variables
      //
      //----------------------------------------------------------------------

      const base = TreeNode.setup<AppMainArticleTreeNodeImpl>(props, context)

      base.extraEventNames.value.push('checked-change')

      //----------------------------------------------------------------------
      //
      //  Properties
      //
      //----------------------------------------------------------------------

      const id = computed(() => base.nodeData.value.id)

      const type = computed(() => base.nodeData.value.type)

      const name = computed(() => base.nodeData.value.name)

      const dir = computed(() => base.nodeData.value.dir)

      const path = computed(() => base.nodeData.value.path)

      const label = computed(() => base.nodeData.value.label)

      const version = computed(() => base.nodeData.value.version)

      const createdAt = computed(() => base.nodeData.value.createdAt)

      const updatedAt = computed(() => base.nodeData.value.updatedAt)

      //----------------------------------------------------------------------
      //
      //  Internal methods
      //
      //----------------------------------------------------------------------

      base.init_sub.value = data => {
        set(data, 'id', data.id)
        set(data, 'type', data.type)
        set(data, 'name', data.name)
        set(data, 'dir', data.dir)
        set(data, 'path', data.path)
        set(data, 'label', data.label)
        set(data, 'version', data.version)
        set(data, 'createdAt', data.createdAt)
        set(data, 'updatedAt', data.updatedAt)
      }

      //----------------------------------------------------------------------
      //
      //  Result
      //
      //----------------------------------------------------------------------

      return {
        ...base,
        id,
        type,
        name,
        dir,
        path,
        label,
        version,
        createdAt,
        updatedAt,
      }
    },
  })
}

export default AppMainArticleTreeNode.clazz
export { AppMainArticleTreeNode, AppMainArticleTreeNodeData }
</script>
