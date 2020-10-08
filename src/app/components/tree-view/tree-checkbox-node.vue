<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.TreeCheckboxNode

.node-container
  padding-top: var(--tree-distance, 6px)
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
  height: var(--tree-line-height, 26px)
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
      <div v-show="lazyLoadStatus === 'loading'" ref="lazyLoadIcon" class="icon-container">
        <LoadingSpinner size="20px" />
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
      <div class="layout horizontal center item-container" :class="{ selected, unselectable }" @click="itemContainerOnClick">
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
          <q-checkbox v-model="checked" />
          <span>{{ label }}</span>
        </div>
      </div>
    </div>

    <!-- 子ノード -->
    <div ref="childContainer" class="child-container"></div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, set } from '@vue/composition-api'
import { LoadingSpinner } from '@/app/components/loading-spinner'
import { TreeNode } from '@/app/components/tree-view/tree-node.vue'
import { TreeNodeData } from '@/app/components/tree-view/base'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface TreeCheckboxNode extends TreeNode<TreeCheckboxNode> {
  checked: boolean
}

interface TreeCheckboxNodeData extends TreeNodeData {
  checked?: boolean
}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace TreeCheckboxNode {
  export const clazz = defineComponent({
    name: 'TreeCheckboxNode',

    components: {
      LoadingSpinner: LoadingSpinner.clazz,
    },

    setup(props: {}, context) {
      const base = TreeNode.setup(props, context)
      const nodeData = computed<TreeCheckboxNodeData>(() => base.state.nodeData)

      base.extraEventNames.push('checked-change')

      base.init_sub.value = (nodeData: TreeCheckboxNodeData) => {
        set(nodeData, 'checked', Boolean(nodeData.checked))
      }

      const checked = computed({
        get: () => nodeData.value.checked,
        set: value => {
          const changed = nodeData.value.checked !== value
          nodeData.value.checked = value
          if (changed) {
            base.dispatchExtraEvent('checked-change')
          }
        },
      })

      return {
        ...base,
        checked,
      }
    },
  })
}

export default TreeCheckboxNode.clazz
// eslint-disable-next-line no-undef
export { TreeCheckboxNode, TreeCheckboxNodeData }
</script>
