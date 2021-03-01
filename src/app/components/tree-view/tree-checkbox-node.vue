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
  <div ref="el" class="TreeCheckboxNode">
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
      <div class="layout horizontal center item-container" :class="{ selected, unselectable, 'word-wrap': wordWrap }" @click="itemContainerOnClick">
        <!-- アイコン -->
        <div v-if="Boolean(icon)" class="icon-container">
          <q-icon :name="icon" :color="iconColor" :style="{ fontSize: iconSize }" />
        </div>
        <!-- アイテム -->
        <div class="item">
          <q-checkbox v-show="useCheckbox" v-model="checked" class="app-mr-6" dense />
          <span>{{ label }}</span>
        </div>
      </div>
    </div>

    <!-- 子ノード -->
    <div ref="childContainer" class="child-container"></div>
  </div>
</template>

<script lang="ts">
import { TreeNode, TreeNodeImpl } from '@/app/components/tree-view/tree-node.vue'
import { computed, defineComponent, set } from '@vue/composition-api'
import { TreeNodeData } from '@/app/components/tree-view/base'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface TreeCheckboxNodeMembers {
  checked?: boolean
}

interface TreeCheckboxNodeData extends TreeNodeData, TreeCheckboxNodeMembers {}

interface TreeCheckboxNode extends TreeNode<TreeCheckboxNodeData>, TreeCheckboxNode.Props, TreeCheckboxNodeMembers {}

interface TreeCheckboxNodeImpl extends TreeNodeImpl<TreeCheckboxNodeData>, TreeCheckboxNode.Props, TreeCheckboxNodeMembers {}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace TreeCheckboxNode {
  export interface Props {}

  export const clazz = defineComponent({
    name: 'TreeCheckboxNode',

    setup(props: Props, context) {
      const base = TreeNode.setup<TreeCheckboxNodeImpl>(props, context)

      base.extraEventNames.value.push('checked-change')

      base.init_sub.value = nodeData => {
        set(nodeData, 'checked', nodeData.checked)
      }

      const checked = computed({
        get: () => base.nodeData.value.checked,
        set: value => {
          const changed = base.nodeData.value.checked !== value
          base.nodeData.value.checked = value
          if (useCheckbox.value && changed) {
            base.dispatchExtraEvent('checked-change')
          }
        },
      })

      const useCheckbox = computed(() => typeof base.nodeData.value.checked === 'boolean')

      return {
        ...base,
        checked,
        useCheckbox,
      }
    },
  })
}

export default TreeCheckboxNode.clazz
export { TreeCheckboxNode, TreeCheckboxNodeImpl, TreeCheckboxNodeData }
</script>
