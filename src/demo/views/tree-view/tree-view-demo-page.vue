<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.TreeViewDemoPage
  body.screen--lg &, body.screen--xl &
    margin: 48px
  body.screen--md &
    margin: 24px
  body.screen--xs &, body.screen--sm &
    margin: 12px

.tree-view
  --tree-padding: 0
  --tree-node-distance: 10px
  //--tree-node-indent: 20px
  //--tree-view-font-size: 18px

.operation-row
  > *:not(:last-child)
    margin-left: 10px
    margin-bottom: 20px
</style>

<template>
  <div class="TreeViewDemoPage layout vertical">
    <TreeView ref="treeView" class="tree-view" @select-change="treeViewOnSelectChange" @checked-change="treeViewOnCheckedChange" />
    <div class="layout vertical app-mt-20">
      <!-- 編集 -->
      <div class="layout horizontal operation-row">
        <q-input v-model="state.editedInput.nodeValue" label="Node value" dense />
        <q-input v-model="state.editedInput.nodeLabel" label="Node label" dense />
        <div class="flex"></div>
        <q-btn label="Edit" color="primary" dense flat rounded @click="editNode" />
      </div>
      <!-- 追加 -->
      <div class="layout horizontal operation-row">
        <q-input v-model="state.addedInput.nodeValue" label="Node value" dense />
        <q-input v-model="state.addedInput.nodeLabel" label="Node label" dense />
        <q-input v-model="state.addedInput.parentValue" label="Parent" dense />
        <q-input v-model.number="state.addedInput.insertIndex" type="number" input-class="text-right" label="Insert index" dense />
        <div class="flex"></div>
        <q-btn label="Add" color="primary" dense flat rounded @click="addNode" />
      </div>
      <!-- 削除 -->
      <div class="layout horizontal operation-row">
        <q-input v-model="state.removedInput.nodeValue" label="Target node" dense />
        <div class="flex"></div>
        <q-btn label="Remove" color="primary" dense flat rounded @click="removeNode" />
      </div>
      <!-- 移動 -->
      <div class="layout horizontal operation-row">
        <q-input v-model="state.movedInput.nodeValue" label="Target node" dense />
        <q-input v-model="state.movedInput.parentValue" label="Parent" dense />
        <q-input v-model.number="state.movedInput.insertIndex" type="number" input-class="text-right" label="Insert index" dense />
        <div class="flex"></div>
        <q-btn label="Move" color="primary" dense flat rounded @click="moveNode" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { TreeCheckboxNode, TreeCheckboxNodeData, TreeView, TreeViewEvent } from '@/app/components/tree-view'
import { defineComponent, onMounted, reactive, ref } from '@vue/composition-api'
import Vue from 'vue'

interface TreeViewDemoPage extends Vue {}

namespace TreeViewDemoPage {
  export const clazz = defineComponent({
    name: 'TreeViewDemoPage',

    components: {
      TreeView: TreeView.clazz,
    },

    setup(props, context) {
      //----------------------------------------------------------------------
      //
      //  Lifecycle hooks
      //
      //----------------------------------------------------------------------

      onMounted(() => {
        treeView.value!.buildTree(
          [
            {
              label: 'node1',
              value: 'node1',
              opened: false,
              icon: 'folder',
              iconColor: 'purple-5',
              children: [
                {
                  label: 'node1-1',
                  value: 'node1-1',
                  opened: true,
                  icon: 'folder',
                  children: [
                    { label: 'node1-1-1', value: 'node1-1-1', checked: true },
                    { label: 'node1-1-2', value: 'node1-1-2', checked: false },
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
          ],
          { nodeClass: TreeCheckboxNode.clazz }
        )
      })

      //----------------------------------------------------------------------
      //
      //  Variables
      //
      //----------------------------------------------------------------------

      const treeView = ref<TreeView<TreeCheckboxNode, TreeCheckboxNodeData>>()

      const state = reactive({
        editedInput: {
          nodeValue: '',
          nodeLabel: '',
        },

        addedInput: {
          nodeValue: 'node2-1',
          nodeLabel: 'node2-1',
          parentValue: 'node2',
          insertIndex: null,
        },

        removedInput: {
          nodeValue: '',
        },

        movedInput: {
          nodeValue: '',
          parentValue: '',
          insertIndex: null,
        },
      })

      //----------------------------------------------------------------------
      //
      //  Event listeners
      //
      //----------------------------------------------------------------------

      function editNode() {
        const target = treeView.value!.getNode(state.editedInput.nodeValue)!
        target.value = state.editedInput.nodeValue
        target.label = state.editedInput.nodeLabel
      }

      function addNode() {
        const parentNode = treeView.value!.getNode(state.addedInput.parentValue)
        parentNode?.open(false)

        treeView.value!.addNode(
          {
            value: state.addedInput.nodeValue,
            label: state.addedInput.nodeLabel ? state.addedInput.nodeLabel : state.addedInput.nodeValue,
          },
          { parent: state.addedInput.parentValue || undefined }
        )
      }

      function removeNode() {
        const target = treeView.value!.getNode(state.removedInput.nodeValue)!
        treeView.value!.removeNode(target.value)
      }

      function moveNode() {
        const target = treeView.value!.getNode(state.movedInput.nodeValue)!
        if (state.movedInput.parentValue) {
          const parent = treeView.value!.getNode(state.movedInput.parentValue)!
          parent.addChild(target, { insertIndex: state.movedInput.insertIndex })
        } else {
          treeView.value!.addNode(target, { insertIndex: state.movedInput.insertIndex })
        }
      }

      function treeViewOnSelectChange(e: TreeViewEvent) {
        console.log(`selected changed: '${e.node.value}'`)
        state.editedInput.nodeValue = e.node.value
        state.editedInput.nodeLabel = e.node.label
      }

      function treeViewOnCheckedChange(e: TreeViewEvent) {
        console.log(`The checkbox has changed: '${e.node.value}'`)
      }

      //----------------------------------------------------------------------
      //
      //  Result
      //
      //----------------------------------------------------------------------

      return {
        treeView,
        state,
        editNode,
        addNode,
        removeNode,
        moveNode,
        treeViewOnSelectChange,
        treeViewOnCheckedChange,
      }
    },
  })
}

export default TreeViewDemoPage.clazz
export { TreeViewDemoPage }
</script>
