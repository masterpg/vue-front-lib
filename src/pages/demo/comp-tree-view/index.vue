<style lang="stylus" scoped>
@import '../../../styles/app.variables.styl'

.tree-view {
  /*--comp-tree-node-indent: 20px*/
  --comp-tree-node-distance: 10px
}
</style>

<template>
  <div class="layout vertical" :class="{ 'app-ma-48': screenSize.pc, 'app-ma-24': screenSize.tab, 'app-ma-12': screenSize.sp }">
    <comp-tree-view ref="treeView" class="tree-view" @checked-changed="m_treeViewOnCheckedChanged"></comp-tree-view>
  </div>
</template>

<script lang="ts">
import { BaseComponent, ResizableMixin } from '@/components'
import CheckboxNodeItem, { CheckboxTreeNodeData } from '@/pages/demo/comp-tree-view/checkbox-node-item.vue'
import CompTreeNode from '@/components/comp-tree-view/comp-tree-node.vue'
import CompTreeNodeItem from '@/components/comp-tree-view/comp-tree-node-item.vue'
import CompTreeView from '@/components/comp-tree-view/index.vue'
import { Component } from 'vue-property-decorator'
import { mixins } from 'vue-class-component'

@Component({
  name: 'demo-comp-tree-view-page',
  components: { CompTreeView, CompTreeNode, CompTreeNodeItem, CheckboxNodeItem },
})
export default class DemoCompTreeViewPage extends mixins(BaseComponent, ResizableMixin) {
  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  mounted() {
    this.m_treeView.buildNodes([
      {
        label: 'Item 1',
        value: 'item-1',
        opened: true,
        icon: 'star',
        iconColor: 'purple-5',
        children: [
          {
            label: 'Item 1-1',
            value: 'item-1-1',
            opened: true,
            children: [
              { label: 'Item 1-1-1', value: 'item-1-1-1', checked: true, itemClass: CheckboxNodeItem },
              { label: 'Item 1-1-2', value: 'item-1-1-2', icon: 'inbox', itemClass: CheckboxNodeItem },
            ],
          },
          {
            label: 'Item 1-2',
            value: 'item-1-2',
            unselectable: true,
            children: [{ label: 'Item 1-2-1', value: 'item-1-2-1' }, { label: 'Item 1-2-2', value: 'item-1-2-2' }],
          },
        ],
      },
    ] as CheckboxTreeNodeData[])

    const node = this.m_treeView.getNodeByValue('item-1-2-2')
    node.buildChild({
      label: 'Item 1-2-2-1',
      value: 'item-1-2-2-1',
    })

    console.log(this.m_treeView.getNodeByValue('item-1-2-2-1'))
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

  get m_treeView(): CompTreeView {
    return this.$refs.treeView as CompTreeView
  }

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------

  private m_treeViewOnCheckedChanged(node: CompTreeNode<CheckboxNodeItem>) {
    node.selected = true
    console.log(node)
  }
}
</script>
