<style lang="sass" scoped>
@import '../../../styles/lib.variables'

.container
  height: var(--comp-tree-line-height, 26px)

.item
  cursor: pointer
  white-space: nowrap

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
  <div class="layout horizontal center container">
    <q-checkbox v-model="checked" />
    <span class="item" :class="{ selected: selected, unselectable: unselectable }" @click="itemOnClick">{{ label }}</span>
  </div>
</template>

<script lang="ts">
import { CompTreeCheckboxNodeData } from './types'
import CompTreeNodeItem from './comp-tree-node-item.vue'
import { Component } from 'vue-property-decorator'

@Component
export default class CompTreeCheckboxNodeItem extends CompTreeNodeItem<CompTreeCheckboxNodeData> {
  private m_checked: boolean = false

  get checked(): boolean {
    return this.m_checked
  }

  set checked(value: boolean) {
    const changed = this.m_checked !== value
    this.m_checked = value
    if (changed) {
      this.m_dispatchCheckedChanged()
    }
  }

  protected initPlaceholder(nodeData: CompTreeCheckboxNodeData): void {
    this.m_checked = Boolean(nodeData.checked)
  }

  get extraEventNames(): string[] {
    return ['checked-changed']
  }

  private m_dispatchCheckedChanged(): void {
    this.$el.dispatchEvent(
      new CustomEvent('checked-changed', {
        bubbles: true,
        cancelable: true,
        composed: true,
      })
    )
  }
}
</script>
