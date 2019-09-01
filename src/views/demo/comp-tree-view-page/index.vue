<style lang="stylus" scoped>
@import '../../../styles/app.variables.styl'

.tree-view {
  /*--comp-tree-view-font-size: 18px*/
  /*--comp-tree-node-indent: 20px*/
  --comp-tree-node-distance: 10px
}

.operation-row {
  > *:not(:last-child) {
    margin-left: 10px
    margin-bottom: 20px
  }
}
</style>

<template>
  <div class="layout vertical" :class="{ 'app-ma-48': screenSize.pc, 'app-ma-24': screenSize.tab, 'app-ma-12': screenSize.sp }">
    <comp-tree-view ref="treeView" class="tree-view" @checked-changed="m_treeViewOnCheckedChanged"></comp-tree-view>
    <div class="layout vertical app-mt-20">
      <div class="layout horizontal operation-row">
        <q-input v-model="m_addedInput.value" label="Node value" dense />
        <q-input v-model="m_addedInput.label" label="Node label" dense />
        <q-input v-model="m_addedInput.parentValue" label="Parent" dense />
        <q-input v-model.number="m_addedInput.insertIndex" type="number" input-class="text-right" label="Insert index" dense />
        <div class="flex"></div>
        <q-btn label="Add" color="primary" dense flat rounded @click="m_addNode" />
      </div>
      <div class="layout horizontal operation-row">
        <q-input v-model="m_removedNode" label="Target node" dense />
        <div class="flex"></div>
        <q-btn label="Remove" color="primary" dense flat rounded @click="m_removeNode" />
      </div>
      <div class="layout horizontal operation-row">
        <q-input v-model="m_movedNode" label="Target node" dense />
        <q-input v-model="m_moveToParentNode" label="Parent" dense />
        <q-input v-model.number="m_movedNodeInsertIndex" type="number" input-class="text-right" label="Insert index" dense />
        <div class="flex"></div>
        <q-btn label="Move" color="primary" dense flat rounded @click="m_moveNode" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { BaseComponent, NoCache, ResizableMixin } from '@/components'
import CompTreeView, { CompCheckboxNodeItem, CompCheckboxTreeNodeData, CompTreeNode, CompTreeNodeItem } from '@/components/comp-tree-view/index.vue'
import { Component } from 'vue-property-decorator'
import { mixins } from 'vue-class-component'

@Component({
  name: 'demo-comp-tree-view-page',
  components: { CompTreeView, CompTreeNode, CompTreeNodeItem, CheckboxNodeItem: CompCheckboxNodeItem },
})
export default class DemoCompTreeViewPage extends mixins(BaseComponent, ResizableMixin) {
  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  mounted() {
    this.m_treeView.buildTree([
      {
        label: 'node1',
        value: 'node1',
        opened: true,
        icon: 'folder',
        iconColor: 'purple-5',
        children: [
          {
            label: 'node1-1',
            value: 'node1-1',
            opened: true,
            icon: 'folder',
            children: [
              { label: 'node1-1-1', value: 'node1-1-1', checked: true, itemClass: CompCheckboxNodeItem },
              { label: 'node1-1-2', value: 'node1-1-2', itemClass: CompCheckboxNodeItem },
            ],
          },
          {
            label: 'node1-2',
            value: 'node1-2',
            unselectable: true,
            icon: 'folder',
            children: [
              { label: 'node1-2-1', value: 'node1-2-1' },
              {
                label: 'node1-2-2',
                value: 'node1-2-2',
                children: [
                  {
                    label: 'node1-2-2-1',
                    value: 'node1-2-2-1',
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        label: 'node2',
        value: 'node2',
        opened: true,
        icon: 'folder',
      },
    ] as CompCheckboxTreeNodeData[])
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private m_addedInput = {
    value: '',
    label: '',
    parentValue: '',
    insertIndex: null,
  }

  private m_removedNode = ''

  private m_moveToParentNode = ''

  private m_movedNode = ''

  private m_movedNodeInsertIndex = 0

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

  @NoCache
  get m_treeView(): CompTreeView {
    return this.$refs.treeView as CompTreeView
  }

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------

  private m_addNode() {
    this.m_treeView.addNode(
      {
        value: this.m_addedInput.value,
        label: this.m_addedInput.label ? this.m_addedInput.label : this.m_addedInput.value,
      },
      this.m_addedInput.parentValue
    )
  }

  private m_removeNode() {
    const target = this.m_treeView.getNode(this.m_removedNode)!
    this.m_treeView.removeNode(target.value)
    // target.parent.removeChild(target)
  }

  private m_moveNode() {
    const target = this.m_treeView.getNode(this.m_movedNode)!
    if (this.m_moveToParentNode) {
      const parent = this.m_treeView.getNode(this.m_moveToParentNode)!
      parent.addChild(target, this.m_movedNodeInsertIndex)
    } else {
      this.m_treeView.addNode(target, this.m_movedNodeInsertIndex)
    }
  }

  private m_treeViewOnCheckedChanged(node: CompTreeNode<CompCheckboxNodeItem>) {
    node.selected = true
    console.log(node)
  }
}
</script>
