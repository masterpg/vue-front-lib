import * as util from '@/app/components/tree-view/base'
import {
  TreeCheckboxNode,
  TreeNode,
  TreeNodeData,
  TreeNodeImpl,
  TreeView,
  TreeViewEvent,
  TreeViewImpl,
  TreeViewLazyLoadEvent,
  TreeViewLazyLoadStatus,
  TreeViewSelectEvent,
} from '@/app/components/tree-view'
import { Wrapper, mount } from '@vue/test-utils'
import { cloneDeep, merge } from 'lodash'
import { sleep } from 'web-base-lib'

//========================================================================
//
//  Test data
//
//========================================================================

const baseNodeDataList = [
  {
    label: 'Node1',
    value: 'node1',
    opened: true,
    children: [
      {
        label: 'Node1_1',
        value: 'node1_1',
        opened: true,
        children: [
          {
            label: 'Node1_1_1',
            value: 'node1_1_1',
            icon: 'inbox',
            selected: true,
          },
          {
            label: 'Node1_1_2',
            value: 'node1_1_2',
            unselectable: true,
          },
          {
            label: 'Node1_1_3',
            value: 'node1_1_3',
          },
        ],
      },
    ],
  },
  {
    label: 'Node2',
    value: 'node2',
  },
]

//========================================================================
//
//  Test helpers
//
//========================================================================

function verifyTreeView(treeView: TreeViewImpl) {
  for (let i = 0; i < treeView.children.length; i++) {
    const node = treeView.children[i]
    // ノードからツリービューが取得できることを検証
    expect(node.treeView).toBe(treeView)
    // ノードの親が空であることを検証
    expect(node.parent).toBeNull()
    // ツリービューのコンテナにノードが存在することを検証
    const containerChildren = Array.from(treeView.childContainer.children)
    expect(containerChildren[i]).toBe(node.el)
    // ツリービューからノードを取得できることを検証
    expect(treeView.getNode(node.value)!.value).toBe(node.value)
    // ノードの親子(子孫)関係の検証
    expect(node.children.length).toBe(node.nodeData.children.length)
    verifyParentChildRelation(treeView, node)
    // ノードが選択状態の場合
    if (node.selected) {
      expect(treeView.selectedNode!.selected).toBe(node)
    }
  }

  // 最年長ノードフラグの検証
  verifyIsEldest(treeView)

  // 選択ノードの検証
  if (treeView.selectedNode) {
    expect(treeView.selectedNode.selected).toBeTruthy()
  }
}

function verifyParentChildRelation(treeView: TreeViewImpl, node: TreeNodeImpl) {
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i]
    // ツリービューから子ノードを取得できることを検証
    expect(treeView.getNode(child.value)!.value).toBe(child.value)
    // ノードからツリービューが取得できることを検証
    expect(node.treeView).toBe(treeView)
    // ノードの親子関係を検証
    expect(child.parent).toBe(node)
    expect(child.parent!.nodeData.children.find((childData: TreeNodeData) => childData.value === child.value)).toEqual(child.nodeData)
    // ノードのコンテナに子ノードが存在することを検証
    const containerChildren = Array.from(node.childContainer.children)
    expect(containerChildren[i]).toBe(child.el)
    // 孫ノードの検証
    verifyParentChildRelation(treeView, child)
  }
}

function verifyIsEldest(treeView: TreeViewImpl) {
  treeView.children.forEach((node: TreeNodeImpl, index: number) => {
    const isEldest = index === 0
    expect(node.isEldest).toBe(isEldest)
  })
}

const sortFunc = (a: TreeNode | any, b: TreeNode | any) => {
  if (a.label < b.label) {
    return -1
  } else if (a.label > b.label) {
    return 1
  } else {
    return 0
  }
}

function getNodeData(nodeDataList: TreeNodeData[], value: string): TreeNodeData | undefined {
  for (const nodeData of nodeDataList) {
    if (nodeData.value === value) {
      return nodeData
    }
    if (nodeData.children) {
      const resultNodeData = getNodeData(nodeData.children, value)
      if (resultNodeData) return resultNodeData
    }
  }
  return undefined
}

function editNodeDataList(srcNodeDataList: TreeNodeData[], editDataList: (Partial<TreeNodeData> & { value: string })[] = []): TreeNodeData[] {
  const newNodeDataList = cloneDeep(srcNodeDataList)
  for (const editData of editDataList) {
    const nodeData = getNodeData(newNodeDataList, editData.value)
    merge(nodeData, editData)
  }
  return newNodeDataList
}

async function clearEmitted(wrapper: Wrapper<any>, delay = 0): Promise<void> {
  await sleep(delay)

  const emitted: any = ((wrapper as any)._emitted['select'] = undefined)
  if (!emitted) return

  for (const key of Object.keys(emitted)) {
    emitted[key] = undefined
  }
}

//========================================================================
//
//  Tests
//
//========================================================================

describe('TreeView', () => {
  describe('buildTree()', () => {
    it('ベーシックケース', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      treeView.buildTree(cloneDeep(baseNodeDataList))

      const node1 = treeView.children[0]
      expect(node1.value).toBe('node1')
      expect(node1.label).toBe('Node1')
      expect(node1.isEldest).toBeTruthy()
      expect(node1.opened).toBe(true)
      expect(node1.selected).toBeFalsy()

      const node1_1 = node1.children[0]
      expect(node1_1.value).toBe('node1_1')
      expect(node1_1.label).toBe('Node1_1')
      expect(node1_1.selected).toBeFalsy()

      const node1_1_1 = node1_1.children[0]
      expect(node1_1_1.value).toBe('node1_1_1')
      expect(node1_1_1.label).toBe('Node1_1_1')
      expect(node1_1_1.icon).toBe('inbox')
      expect(node1_1_1.selected).toBeTruthy()
      expect(treeView.selectedNode).toBe(node1_1_1)

      const node1_1_2 = node1_1.children[1]
      expect(node1_1_2.value).toBe('node1_1_2')
      expect(node1_1_2.label).toBe('Node1_1_2')
      expect(node1_1_2.unselectable).toBe(true)
      expect(node1_1_2.selected).toBeFalsy()

      const node1_1_3 = node1_1.children[2]
      expect(node1_1_3.value).toBe('node1_1_3')
      expect(node1_1_3.label).toBe('Node1_1_3')
      expect(node1_1_3.selected).toBeFalsy()

      const node2 = treeView.children[1]
      expect(node2.value).toBe('node2')
      expect(node2.label).toBe('Node2')
      expect(node2.isEldest).not.toBeTruthy()
      expect(node2.selected).toBeFalsy()

      expect(treeView.el).toMatchSnapshot()
    })

    it('先頭に挿入', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      treeView.buildTree(cloneDeep(baseNodeDataList))

      treeView.buildTree(
        [
          {
            label: 'Node3',
            value: 'node3',
          },
          {
            label: 'Node4',
            value: 'node4',
          },
        ],
        { insertIndex: 0 }
      )

      const node3 = treeView.getNode('node3')
      const node4 = treeView.getNode('node4')

      expect(treeView.children[0]).toBe(node3)
      expect(treeView.children[1]).toBe(node4)
      verifyTreeView(treeView)
    })

    it('中間に挿入', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      treeView.buildTree(cloneDeep(baseNodeDataList))

      treeView.buildTree(
        [
          {
            label: 'Node3',
            value: 'node3',
          },
          {
            label: 'Node4',
            value: 'node4',
          },
        ],
        { insertIndex: 1 }
      )

      const node3 = treeView.getNode('node3')
      const node4 = treeView.getNode('node4')

      expect(treeView.children[1]).toBe(node3)
      expect(treeView.children[2]).toBe(node4)
      verifyTreeView(treeView)
    })

    it('最後尾に挿入', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      treeView.buildTree(cloneDeep(baseNodeDataList))

      treeView.buildTree(
        [
          {
            label: 'Node3',
            value: 'node3',
          },
          {
            label: 'Node4',
            value: 'node4',
          },
        ],
        { insertIndex: treeView.children.length }
      )

      const node3 = treeView.getNode('node3')
      const node4 = treeView.getNode('node4')

      expect(treeView.children[treeView.children.length - 2]).toBe(node3)
      expect(treeView.children[treeView.children.length - 1]).toBe(node4)
      verifyTreeView(treeView)
    })
  })

  describe('addNode()', () => {
    it('挿入位置の指定なし', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      treeView.buildTree(cloneDeep(baseNodeDataList))

      const node3 = treeView.addNode({
        label: 'Node3',
        value: 'node3',
      })

      expect(treeView.getNode('node3')).toBe(node3)
      expect(treeView.children[treeView.children.length - 1]).toBe(node3)
      verifyTreeView(treeView)
    })

    it('先頭に挿入', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      treeView.buildTree(cloneDeep(baseNodeDataList))

      const node3 = treeView.addNode(
        {
          label: 'Node3',
          value: 'node3',
        },
        { insertIndex: 0 }
      )

      expect(treeView.getNode('node3')).toBe(node3)
      expect(treeView.children[0]).toBe(node3)
      verifyTreeView(treeView)
    })

    it('中間に挿入', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      treeView.buildTree(cloneDeep(baseNodeDataList))

      const node3 = treeView.addNode(
        {
          label: 'Node3',
          value: 'node3',
        },
        { insertIndex: 1 }
      )

      expect(treeView.getNode('node3')).toBe(node3)
      expect(treeView.children[1]).toBe(node3)
      verifyTreeView(treeView)
    })

    it('中間に挿入(sortFuncを使用)', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      // ツリービュー直下の子ノードはsortFuncによって並び順が決められる
      treeView.buildTree(cloneDeep(baseNodeDataList), { sortFunc })

      const node1p5 = treeView.addNode({
        label: 'Node1.5',
        value: 'node1.5',
      })

      expect(treeView.getNode('node1.5')).toBe(node1p5)
      expect(treeView.children[1]).toBe(node1p5)
      verifyTreeView(treeView)
    })

    it('insertIndexとsortFuncの両方を指定', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      treeView.buildTree(cloneDeep(baseNodeDataList), { sortFunc })

      const node3 = treeView.addNode(
        {
          label: 'Node3',
          value: 'node3',
        },
        { insertIndex: 0 }
      )

      // sortFuncが指定されている場合、insertIndexは無視される
      expect(treeView.getNode('node3')).toBe(node3)
      expect(treeView.children[2]).toBe(node3)
      verifyTreeView(treeView)
    })

    it('最後尾に挿入', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      treeView.buildTree(cloneDeep(baseNodeDataList))

      const node3 = treeView.addNode(
        {
          label: 'Node3',
          value: 'node3',
        },
        { insertIndex: treeView.children.length }
      )

      expect(treeView.getNode('node3')).toBe(node3)
      expect(treeView.children[treeView.children.length - 1]).toBe(node3)
      verifyTreeView(treeView)
    })

    it('既に存在するノードを指定して追加', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      treeView.buildTree(cloneDeep(baseNodeDataList))

      let actual!: Error
      try {
        treeView.addNode({
          label: 'Node2',
          value: 'node2',
        })
      } catch (err) {
        actual = err
      }

      expect(actual).toBeInstanceOf(Error)
      expect(actual.message).toBe(`The node 'node2' already exists.`)
      verifyTreeView(treeView)
    })

    it('親ノードを指定', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      treeView.buildTree(cloneDeep(baseNodeDataList))

      const node1_1 = treeView.getNode('node1_1')!
      const node1_1_x = treeView.addNode(
        {
          label: 'Node2_1',
          value: 'node2_1',
        },
        { parent: node1_1.value }
      )

      expect(node1_1_x.parent).toBe(node1_1)
      expect(node1_1.children[node1_1.children.length - 1]).toBe(node1_1_x)
      verifyTreeView(treeView)
    })

    it('親ノードと挿入位置を指定', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      treeView.buildTree(cloneDeep(baseNodeDataList))

      const node1_1 = treeView.getNode('node1_1')!
      const node1_1_x = treeView.addNode(
        {
          label: 'Node2_1',
          value: 'node2_1',
        },
        { parent: node1_1.value, insertIndex: 1 }
      )

      expect(node1_1_x.parent).toBe(node1_1)
      expect(node1_1.children[1]).toBe(node1_1_x)
      verifyTreeView(treeView)
    })

    describe('ノードを入れ替え', () => {
      let wrapper!: Wrapper<TreeViewImpl>
      let treeView!: TreeViewImpl

      beforeEach(() => {
        wrapper = mount<TreeViewImpl>(TreeView.clazz)
        treeView = wrapper.vm
        treeView.buildTree([
          {
            label: 'Node1',
            value: 'node1',
            children: [
              {
                label: 'Node1_1',
                value: 'node1_1',
              },
              {
                label: 'Node1_2',
                value: 'node1_2',
              },
            ],
          },
          {
            label: 'Node2',
            value: 'node2',
          },
          {
            label: 'Node3',
            value: 'node3',
          },
          {
            label: 'Node4',
            value: 'node4',
          },
        ])
      })

      it('挿入位置を指定しない場合', () => {
        const node1 = treeView.getNode('node1')!
        const node2 = treeView.getNode('node2')!
        const node3 = treeView.getNode('node3')!
        const node4 = treeView.getNode('node4')!

        treeView.addNode(node1)

        expect(treeView.children.length).toBe(4)
        expect(treeView.children[0]).toBe(node2)
        expect(treeView.children[1]).toBe(node3)
        expect(treeView.children[2]).toBe(node4)
        expect(treeView.children[3]).toBe(node1)
        verifyTreeView(treeView)
      })

      it('挿入位置に先頭を指定した場合', () => {
        const node1 = treeView.getNode('node1')!
        const node2 = treeView.getNode('node2')!
        const node3 = treeView.getNode('node3')!
        const node4 = treeView.getNode('node4')!

        treeView.addNode(node3, { insertIndex: 0 })

        expect(treeView.children.length).toBe(4)
        expect(treeView.children[0]).toBe(node3)
        expect(treeView.children[1]).toBe(node1)
        expect(treeView.children[2]).toBe(node2)
        expect(treeView.children[3]).toBe(node4)
        verifyTreeView(treeView)
      })

      it('中間の挿入位置を指定した場合', () => {
        const node1 = treeView.getNode('node1')!
        const node2 = treeView.getNode('node2')!
        const node3 = treeView.getNode('node3')!
        const node4 = treeView.getNode('node4')!

        treeView.addNode(node2, { insertIndex: 2 })

        expect(treeView.children.length).toBe(4)
        expect(treeView.children[0]).toBe(node1)
        expect(treeView.children[1]).toBe(node3)
        expect(treeView.children[2]).toBe(node2)
        expect(treeView.children[3]).toBe(node4)
        verifyTreeView(treeView)
      })

      it('挿入位置に最後尾を指定した場合', () => {
        const node1 = treeView.getNode('node1')!
        const node2 = treeView.getNode('node2')!
        const node3 = treeView.getNode('node3')!
        const node4 = treeView.getNode('node4')!

        treeView.addNode(node2, { insertIndex: 3 })

        expect(treeView.children.length).toBe(4)
        expect(treeView.children[0]).toBe(node1)
        expect(treeView.children[1]).toBe(node3)
        expect(treeView.children[2]).toBe(node4)
        expect(treeView.children[3]).toBe(node2)
        verifyTreeView(treeView)
      })

      it('挿入位置に現在と同じ値を指定した場合', () => {
        const node1 = treeView.getNode('node1')!
        const node2 = treeView.getNode('node2')!
        const node3 = treeView.getNode('node3')!
        const node4 = treeView.getNode('node4')!

        treeView.addNode(node1, { insertIndex: 0 })

        expect(treeView.children.length).toBe(4)
        expect(treeView.children[0]).toBe(node1)
        expect(treeView.children[1]).toBe(node2)
        expect(treeView.children[2]).toBe(node3)
        expect(treeView.children[3]).toBe(node4)
        verifyTreeView(treeView)
      })
    })

    it('下位レベルのノードをトップレベルへ移動', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      treeView.buildTree(cloneDeep(baseNodeDataList))

      const treeViewNodesLength = treeView.children.length
      const node1_1 = treeView.getNode('node1_1')!
      const node1 = node1_1.parent!

      treeView.addNode(node1_1)

      expect(treeView.children.length).toBe(treeViewNodesLength + 1)
      expect(treeView.children[2]).toBe(node1_1)
      expect(node1_1.parent).toBeNull()
      expect(node1.children.includes(node1_1)).not.toBeTruthy()
      verifyTreeView(treeView)
    })

    it('別のツリービューへノードを移動', () => {
      const wrapper1 = mount<TreeViewImpl>(TreeView.clazz)
      const treeView1 = wrapper1.vm
      treeView1.buildTree(cloneDeep(baseNodeDataList))

      const wrapper2 = mount<TreeViewImpl>(TreeView.clazz)
      const treeView2 = wrapper2.vm

      treeView2.addNode(treeView1.getNode('node1')!)

      {
        const node1 = treeView1.getNode('node1')
        expect(node1).toBeUndefined()
        const node1_1 = treeView1.getNode('node1_1')
        expect(node1_1).toBeUndefined()
      }
      {
        const node1 = treeView2.getNode('node1')
        expect(node1?.value).toBe('node1')
        const node1_1 = treeView2.getNode('node1_1')
        expect(node1_1?.value).toBe('node1_1')
      }
      verifyTreeView(treeView1)
      verifyTreeView(treeView2)
    })

    it('存在しない親ノードを指定', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      treeView.buildTree(cloneDeep(baseNodeDataList))

      let actual!: Error
      try {
        treeView.addNode(
          {
            label: 'Node2_1',
            value: 'node2_1',
          },
          { parent: 'nodeXXX' }
        )
      } catch (err) {
        actual = err
      }

      expect(actual).toBeInstanceOf(Error)
      expect(actual.message).toBe(`The parent node 'nodeXXX' does not exist.`)
      verifyTreeView(treeView)
    })
  })

  describe('removeNode()', () => {
    it('レベル1のノード(子孫ノード有り)を削除', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      treeView.buildTree(cloneDeep(baseNodeDataList))

      const node1 = treeView.getNode('node1')!
      const node1Descendants = util.getDescendants(node1)
      const treeViewNodesLength = treeView.children.length

      const actual = treeView.removeNode(node1.value)

      expect(actual).toBe(node1)
      expect(treeView.getNode(node1.value)).toBeUndefined()
      expect(treeView.children.length).toBe(treeViewNodesLength - 1)
      expect(Array.from(treeView.childContainer.children).includes(node1.el)).not.toBeTruthy()

      for (const descendant of node1Descendants) {
        expect(treeView.getNode((descendant as any).value)).toBeUndefined()
      }

      verifyTreeView(treeView)
    })

    it('レベル2のノード(子ノード有り)を削除', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      treeView.buildTree(cloneDeep(baseNodeDataList))

      const node1_1 = treeView.getNode('node1_1')!
      const node1_1Descendants = util.getDescendants(node1_1)
      const node1 = node1_1.parent!
      const node1ChildrenLength = node1.children.length

      const actual = treeView.removeNode(node1_1.value)

      expect(actual).toBe(node1_1)
      expect(treeView.getNode(node1_1.value)).toBeUndefined()
      expect(node1.children.length).toBe(node1ChildrenLength - 1)
      expect(node1.children.includes(node1_1)).not.toBeTruthy()
      expect(Array.from(node1.childContainer.children).includes(node1_1.$el)).not.toBeTruthy()

      for (const descendant of node1_1Descendants) {
        expect(treeView.getNode((descendant as any).value)).toBeUndefined()
      }

      verifyTreeView(treeView)
    })

    it('選択ノードを削除', async () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      treeView.buildTree(cloneDeep(baseNodeDataList))

      const node1_1_1 = treeView.getNode('node1_1_1')!
      expect(node1_1_1.selected).toBeTruthy()
      await clearEmitted(wrapper)

      treeView.removeNode(node1_1_1.value)

      // イベント発火を検証
      // ・select-change
      const selectChangeEmitted = wrapper.emitted('select-change')!
      const selectChangeEvent: TreeViewEvent = selectChangeEmitted[0][0]
      expect(selectChangeEmitted.length).toBe(1)
      expect(selectChangeEvent.node).toBe(node1_1_1)
      // ・select
      expect(wrapper.emitted('select')).toBeUndefined()
      // ノードの選択状態を検証
      expect(treeView.selectedNode).toBeNull()
      expect(node1_1_1.selected).toBeFalsy()

      verifyTreeView(treeView)
    })

    it('選択ノードを子に持つ親ノードを削除', async () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      treeView.buildTree(cloneDeep(baseNodeDataList))

      const node1_1_1 = treeView.getNode('node1_1_1')!
      expect(node1_1_1.selected).toBeTruthy()
      const node1_1 = node1_1_1.parent!
      await clearEmitted(wrapper)

      // 選択ノード(node1_1_1)の親(node1_1)を削除
      treeView.removeNode(node1_1.value)

      // イベント発火を検証
      // ・select-change
      const selectChangeEmitted = wrapper.emitted('select-change')!
      const selectChangeEvent: TreeViewEvent = selectChangeEmitted[0][0]
      expect(selectChangeEmitted.length).toBe(1)
      expect(selectChangeEvent.node).toBe(node1_1_1)
      // ・select
      expect(wrapper.emitted('select')).toBeUndefined()
      // ノードの選択状態を検証
      expect(treeView.selectedNode).toBeNull()
      expect(node1_1_1.selected).toBeFalsy()

      verifyTreeView(treeView)
    })

    it('存在しないノードを指定', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      treeView.buildTree(cloneDeep(baseNodeDataList))

      const node1 = treeView.removeNode('nodeXXX')

      expect(node1).toBeUndefined()
      verifyTreeView(treeView)
    })

    it('削除したノードを追加', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      treeView.buildTree(cloneDeep(baseNodeDataList))

      const node1 = treeView.getNode('node1')!
      const treeViewNodesLength = treeView.children.length

      // 削除してから追加
      const actual = treeView.removeNode(node1.value)!
      treeView.addNode(actual, { insertIndex: 0 })

      expect(actual).toBe(node1)
      expect(treeView.getNode(node1.value)).toBe(node1)
      expect(treeView.children.length).toBe(treeViewNodesLength)
      expect(treeView.children[0]).toBe(node1)
      verifyTreeView(treeView)
    })
  })

  describe('removeAllNodes()', () => {
    it('ベーシックケース', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      treeView.buildTree(cloneDeep(baseNodeDataList))

      // 選択ノードを設定しておく
      treeView.selectedNode = treeView.getNode('node1_1_1')!
      // 削除前の全ノードをとっておく
      const allNodes = treeView.getAllNodes()

      // 全てノードの削除を実行
      treeView.removeAllNodes()

      // ノードが削除されているか検証
      expect(treeView.getAllNodes().length).toBe(0)
      expect(treeView.children.length).toBe(0)
      expect(Array.from(treeView.childContainer.children).length).toBe(0)

      for (const node of allNodes) {
        expect(treeView.getNode(node.value)).toBeUndefined()
      }

      // 選択ノードがないことを検証
      expect(treeView.selectedNode).toBeNull()

      verifyTreeView(treeView)
    })
  })

  describe('selectedNode', () => {
    it('選択ノードがある状態で取得', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      treeView.buildTree(cloneDeep(baseNodeDataList))

      const node1_1_1 = treeView.getNode('node1_1_1')
      const actual = treeView.selectedNode

      expect(actual).toBe(node1_1_1)
      verifyTreeView(treeView)
    })

    it('選択ノードがない状態で取得', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      const nodeDataList = editNodeDataList(baseNodeDataList, [{ value: 'node1_1_1', selected: false }])
      treeView.buildTree(nodeDataList)

      const actual = treeView.selectedNode

      expect(actual).toBeNull()
      verifyTreeView(treeView)
    })

    it('現在選択されているノードと同じノードを設定', async () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      treeView.buildTree(cloneDeep(baseNodeDataList))

      const node1_1_1 = treeView.getNode('node1_1_1')!
      expect(node1_1_1.selected).toBeTruthy()
      expect(treeView.selectedNode).toBe(node1_1_1)
      await clearEmitted(wrapper)

      treeView.selectedNode = node1_1_1

      // イベント発火を検証
      // ・select-change
      expect(wrapper.emitted('select-change')).toBeUndefined()
      // ・select
      const selectEmitted = wrapper.emitted('select')!
      const selectEvent: TreeViewSelectEvent = selectEmitted[0][0]
      expect(selectEmitted.length).toBe(1)
      expect(selectEvent.node).toBe(node1_1_1)
      expect(selectEvent.oldNode).toBe(node1_1_1)
      // ノードの選択状態を検証
      expect(treeView.selectedNode).toBe(node1_1_1)
      expect(node1_1_1.selected).toBeTruthy()

      verifyTreeView(treeView)
    })

    it('現在選択されているノードと別のノードを設定', async () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      treeView.buildTree(cloneDeep(baseNodeDataList))

      const node1_1_1 = treeView.getNode('node1_1_1')!
      expect(node1_1_1.selected).toBeTruthy()
      expect(treeView.selectedNode).toBe(node1_1_1)
      const node1_1_3 = treeView.getNode('node1_1_3')!
      expect(node1_1_3.selected).toBeFalsy()
      await clearEmitted(wrapper)

      treeView.selectedNode = node1_1_3

      // イベント発火を検証
      // ・select-change
      const selectChangeEmitted = wrapper.emitted('select-change')!
      const selectChangeEvent1: TreeViewEvent = selectChangeEmitted[0][0]
      const selectChangeEvent2: TreeViewEvent = selectChangeEmitted[1][0]
      expect(selectChangeEmitted.length).toBe(2)
      expect(selectChangeEvent1.node).toBe(node1_1_1)
      expect(selectChangeEvent2.node).toBe(node1_1_3)
      // ・select
      const selectEmitted = wrapper.emitted('select')!
      const selectEvent: TreeViewSelectEvent = selectEmitted[0][0]
      expect(selectEmitted.length).toBe(1)
      expect(selectEvent.node).toBe(node1_1_3)
      expect(selectEvent.oldNode).toBe(node1_1_1)
      // ノードの選択状態を検証
      expect(node1_1_1.selected).toBeFalsy()
      expect(treeView.selectedNode).toBe(node1_1_3)
      expect(node1_1_3.selected).toBeTruthy()

      verifyTreeView(treeView)
    })

    it('現在選択されているノードの選択解除', async () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      treeView.buildTree(cloneDeep(baseNodeDataList))

      const node1_1_1 = treeView.getNode('node1_1_1')!
      expect(node1_1_1.selected).toBeTruthy()
      await clearEmitted(wrapper)

      treeView.selectedNode = null

      // イベント発火を検証
      // ・select
      expect(wrapper.emitted('select')).toBeUndefined()
      // ・select-change
      const selectChangeEmitted = wrapper.emitted('select-change')!
      const selectChangeEvent: TreeViewEvent = selectChangeEmitted[0][0]
      expect(selectChangeEmitted.length).toBe(1)
      expect(selectChangeEvent.node).toBe(node1_1_1)
      // ノードの選択状態を検証
      expect(treeView.selectedNode).toBeNull()
      expect(node1_1_1.selected).toBeFalsy()

      verifyTreeView(treeView)
    })
  })

  describe('setSelectedNode', () => {
    it('現在選択されているノードと同じノードを設定', async () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      treeView.buildTree(cloneDeep(baseNodeDataList))

      const node1_1_1 = treeView.getNode('node1_1_1')!
      expect(node1_1_1.selected).toBeTruthy()
      expect(treeView.selectedNode).toBe(node1_1_1)
      await clearEmitted(wrapper)

      treeView.setSelectedNode(node1_1_1.value, true)

      // イベント発火を検証
      // ・select-change
      expect(wrapper.emitted('select-change')).toBeUndefined()
      // ・select
      const selectEmitted = wrapper.emitted('select')!
      const selectEvent: TreeViewSelectEvent = selectEmitted[0][0]
      expect(selectEmitted.length).toBe(1)
      expect(selectEvent.node).toBe(node1_1_1)
      expect(selectEvent.oldNode).toBe(node1_1_1)
      // ノードの選択状態を検証
      expect(treeView.selectedNode).toBe(node1_1_1)
      expect(node1_1_1.selected).toBeTruthy()

      verifyTreeView(treeView)
    })

    it('現在選択されているノードと別のノードを設定', async () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      treeView.buildTree(cloneDeep(baseNodeDataList))

      const node1_1_1 = treeView.getNode('node1_1_1')!
      expect(node1_1_1.selected).toBeTruthy()
      expect(treeView.selectedNode).toBe(node1_1_1)
      const node1_1_3 = treeView.getNode('node1_1_3')!
      expect(node1_1_3.selected).toBeFalsy()
      await clearEmitted(wrapper)

      treeView.setSelectedNode(node1_1_3.value, true)

      // イベント発火を検証
      // ・select-change
      const selectChangeEmitted = wrapper.emitted('select-change')!
      const selectChangeEvent1: TreeViewEvent = selectChangeEmitted[0][0]
      const selectChangeEvent2: TreeViewEvent = selectChangeEmitted[1][0]
      expect(selectChangeEmitted.length).toBe(2)
      expect(selectChangeEvent1.node).toBe(node1_1_1)
      expect(selectChangeEvent2.node).toBe(node1_1_3)
      // ・select
      const selectEmitted = wrapper.emitted('select')!
      const selectEvent: TreeViewSelectEvent = selectEmitted[0][0]
      expect(selectEmitted.length).toBe(1)
      expect(selectEvent.node).toBe(node1_1_3)
      expect(selectEvent.oldNode).toBe(node1_1_1)
      // ノードの選択状態を検証
      expect(node1_1_1.selected).toBeFalsy()
      expect(treeView.selectedNode).toBe(node1_1_3)
      expect(node1_1_3.selected).toBeTruthy()

      verifyTreeView(treeView)
    })

    it('現在選択されているノードの選択解除', async () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      treeView.buildTree(cloneDeep(baseNodeDataList))

      const node1_1_1 = treeView.getNode('node1_1_1')!
      expect(node1_1_1.selected).toBeTruthy()
      await clearEmitted(wrapper)

      treeView.setSelectedNode(node1_1_1.value, false)

      // イベント発火を検証
      // ・select
      expect(wrapper.emitted('select')).toBeUndefined()
      // ・select-change
      const selectChangeEmitted = wrapper.emitted('select-change')!
      const selectChangeEvent: TreeViewEvent = selectChangeEmitted[0][0]
      expect(selectChangeEmitted.length).toBe(1)
      expect(selectChangeEvent.node).toBe(node1_1_1)
      // ノードの選択状態を検証
      expect(treeView.selectedNode).toBeNull()
      expect(node1_1_1.selected).toBeFalsy()

      verifyTreeView(treeView)
    })

    it('サイレントモードで選択ノードを設定', async () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      treeView.buildTree(cloneDeep(baseNodeDataList))

      const node1_1_1 = treeView.getNode('node1_1_1')!
      expect(node1_1_1.selected).toBeTruthy()
      const node1_1_3 = treeView.getNode('node1_1_3')!
      expect(node1_1_3.selected).toBeFalsy()
      await clearEmitted(wrapper)

      treeView.setSelectedNode(node1_1_3.value, true, true)

      // イベント発火を検証
      // ・select-change
      expect(wrapper.emitted('select-change')).toBeUndefined()
      // ・select
      expect(wrapper.emitted('select')).toBeUndefined()

      verifyTreeView(treeView)
    })

    it('サイレントモードで選択ノードを解除', async () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      treeView.buildTree(cloneDeep(baseNodeDataList))

      const node1_1_1 = treeView.getNode('node1_1_1')!
      expect(node1_1_1.selected).toBeTruthy()
      await clearEmitted(wrapper)

      treeView.setSelectedNode(node1_1_1.value, false, true)

      // イベント発火を検証
      // ・select-change
      expect(wrapper.emitted('select-change')).toBeUndefined()
      // ・select
      expect(wrapper.emitted('select')).toBeUndefined()

      verifyTreeView(treeView)
    })
  })

  describe('getAllNodes()', () => {
    it('ベーシックケース', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      treeView.buildTree(cloneDeep(baseNodeDataList))

      const actual = treeView.getAllNodes()

      expect(actual.length).toBe(6)
      expect(actual[0].value).toBe('node1')
      expect(actual[1].value).toBe('node1_1')
      expect(actual[2].value).toBe('node1_1_1')
      expect(actual[3].value).toBe('node1_1_2')
      expect(actual[4].value).toBe('node1_1_3')
      expect(actual[5].value).toBe('node2')
    })

    it('ノードの位置を変更した場合', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      treeView.buildTree(cloneDeep(baseNodeDataList))

      // node1とnode2の位置を入れ替え
      const node1 = treeView.getNode('node1')!
      treeView.addNode(node1, { insertIndex: 1 })

      // node1_1_1とnode1_1_2の位置を入れ替え
      const node1_1 = treeView.getNode('node1_1')!
      const node1_1_1 = treeView.getNode('node1_1_1')!
      node1_1.addChild(node1_1_1, { insertIndex: 1 })

      const actual = treeView.getAllNodes()

      // 入れ替えた位置関係が反映されていることを検証
      expect(actual.length).toBe(6)
      expect(actual[0].value).toBe('node2')
      expect(actual[1].value).toBe('node1')
      expect(actual[2].value).toBe('node1_1')
      expect(actual[3].value).toBe('node1_1_2')
      expect(actual[4].value).toBe('node1_1_1')
      expect(actual[5].value).toBe('node1_1_3')
    })
  })

  it(`ノードのvalueが空文字('')の場合`, () => {
    const wrapper = mount<TreeViewImpl>(TreeView.clazz)
    const treeView = wrapper.vm

    // valueが空文字('')のノードを作成
    treeView.buildTree([
      {
        label: 'Anonymous',
        value: '',
      },
    ])
    const anonymous = treeView.getNode('')!

    // 親に空文字('')のノードを指定
    const anonymous_child1 = treeView.addNode(
      {
        label: 'Anonymous_child1',
        value: 'anonymous_child1',
      },
      { parent: '' }
    )

    expect(treeView.children[treeView.children.length - 1]).toBe(anonymous)
    expect(anonymous.children[0]).toBe(anonymous_child1)
    expect(anonymous_child1.parent).toBe(anonymous)

    verifyTreeView(treeView)
  })
})

describe('TreeNode', () => {
  describe('addChild()', () => {
    it('挿入位置の指定なし', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      treeView.buildTree(cloneDeep(baseNodeDataList))

      const node1_1 = treeView.getNode('node1_1')!

      const node1_1_4 = node1_1.addChild({
        label: 'Node1_1_4',
        value: 'node1_1_4',
      })

      expect(treeView.getNode('node1_1_4')).toBe(node1_1_4)
      expect(node1_1.children[node1_1.children.length - 1]).toBe(node1_1_4)
      verifyTreeView(treeView)
    })

    it('先頭に挿入', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      treeView.buildTree(cloneDeep(baseNodeDataList))

      const node1_1 = treeView.getNode('node1_1')!

      const node1_1_4 = node1_1.addChild(
        {
          label: 'Node1_1_4',
          value: 'node1_1_4',
        },
        { insertIndex: 0 }
      )

      expect(treeView.getNode('node1_1_4')).toBe(node1_1_4)
      expect(node1_1.children[0]).toBe(node1_1_4)
      verifyTreeView(treeView)
    })

    it('中間に挿入', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      treeView.buildTree(cloneDeep(baseNodeDataList))

      const node1_1 = treeView.getNode('node1_1')!

      const node1_1_4 = node1_1.addChild(
        {
          label: 'Node1_1_4',
          value: 'node1_1_4',
        },
        { insertIndex: 1 }
      )

      expect(treeView.getNode('node1_1_4')).toBe(node1_1_4)
      expect(node1_1.children[1]).toBe(node1_1_4)
      verifyTreeView(treeView)
    })

    it('中間に挿入(sortFuncを使用)', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      // 'node1_1'の子ノードはsortFuncによって並び順が決められる
      treeView.buildTree(editNodeDataList(baseNodeDataList, [{ value: 'node1_1', sortFunc }]))

      const node1_1 = treeView.getNode('node1_1')!

      const node1_1_1p5 = node1_1.addChild({
        label: 'Node1_1_1.5',
        value: 'node1_1_1.5',
      })

      expect(treeView.getNode('node1_1_1.5')).toBe(node1_1_1p5)
      expect(node1_1.children[1]).toBe(node1_1_1p5)
      verifyTreeView(treeView)
    })

    it('insertIndexとsortFuncの両方を指定', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      // 'node1_1'の子ノードはsortFuncによって並び順が決められる
      treeView.buildTree(editNodeDataList(baseNodeDataList, [{ value: 'node1_1', sortFunc }]))

      const node1_1 = treeView.getNode('node1_1')!

      const node1_1_4 = node1_1.addChild(
        {
          label: 'Node1_1_4',
          value: 'node1_1_4',
        },
        { insertIndex: 0 }
      )

      // sortFuncが指定されている場合、insertIndexは無視される
      expect(treeView.getNode('node1_1_4')).toBe(node1_1_4)
      expect(node1_1.children[3]).toBe(node1_1_4)
      verifyTreeView(treeView)
    })

    it('最後尾に挿入', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      treeView.buildTree(cloneDeep(baseNodeDataList))

      const node1_1 = treeView.getNode('node1_1')!

      const node1_1_4 = node1_1.addChild(
        {
          label: 'Node1_1_4',
          value: 'node1_1_4',
        },
        { insertIndex: node1_1.children.length }
      )

      expect(treeView.getNode('node1_1_4')).toBe(node1_1_4)
      expect(node1_1.children[node1_1.children.length - 1]).toBe(node1_1_4)
      verifyTreeView(treeView)
    })

    describe('ノードを入れ替え', () => {
      let wrapper!: Wrapper<TreeViewImpl>
      let treeView!: TreeViewImpl

      beforeEach(() => {
        wrapper = mount<TreeViewImpl>(TreeView.clazz)
        treeView = wrapper.vm
        treeView.buildTree([
          {
            label: 'Node1',
            value: 'node1',
            children: [
              {
                label: 'Node1_1',
                value: 'node1_1',
                children: [
                  { label: 'Node1_1_1', value: 'node1_1_1' },
                  { label: 'Node1_1_2', value: 'node1_1_2' },
                ],
              },
              {
                label: 'Node1_2',
                value: 'node1_2',
              },
              {
                label: 'Node1_3',
                value: 'node1_3',
              },
              {
                label: 'Node1_4',
                value: 'node1_4',
              },
            ],
          },
        ])
      })

      it('挿入位置を指定しない場合', () => {
        const node1 = treeView.getNode('node1')!
        const node1_1 = treeView.getNode('node1_1')!
        const node1_2 = treeView.getNode('node1_2')!
        const node1_3 = treeView.getNode('node1_3')!
        const node1_4 = treeView.getNode('node1_4')!

        node1.addChild(node1_1)

        expect(node1.children.length).toBe(4)
        expect(node1.children[0]).toBe(node1_2)
        expect(node1.children[1]).toBe(node1_3)
        expect(node1.children[2]).toBe(node1_4)
        expect(node1.children[3]).toBe(node1_1)
        verifyTreeView(treeView)
      })

      it('挿入位置に先頭を指定した場合', () => {
        const node1 = treeView.getNode('node1')!
        const node1_1 = treeView.getNode('node1_1')!
        const node1_2 = treeView.getNode('node1_2')!
        const node1_3 = treeView.getNode('node1_3')!
        const node1_4 = treeView.getNode('node1_4')!

        node1.addChild(node1_3, { insertIndex: 0 })

        expect(node1.children.length).toBe(4)
        expect(node1.children[0]).toBe(node1_3)
        expect(node1.children[1]).toBe(node1_1)
        expect(node1.children[2]).toBe(node1_2)
        expect(node1.children[3]).toBe(node1_4)
        verifyTreeView(treeView)
      })

      it('中間の挿入位置を指定した場合', () => {
        const node1 = treeView.getNode('node1')!
        const node1_1 = treeView.getNode('node1_1')!
        const node1_2 = treeView.getNode('node1_2')!
        const node1_3 = treeView.getNode('node1_3')!
        const node1_4 = treeView.getNode('node1_4')!

        node1.addChild(node1_2, { insertIndex: 2 })

        expect(node1.children.length).toBe(4)
        expect(node1.children[0]).toBe(node1_1)
        expect(node1.children[1]).toBe(node1_3)
        expect(node1.children[2]).toBe(node1_2)
        expect(node1.children[3]).toBe(node1_4)
        verifyTreeView(treeView)
      })

      it('挿入位置に最後尾を指定した場合', () => {
        const node1 = treeView.getNode('node1')!
        const node1_1 = treeView.getNode('node1_1')!
        const node1_2 = treeView.getNode('node1_2')!
        const node1_3 = treeView.getNode('node1_3')!
        const node1_4 = treeView.getNode('node1_4')!

        node1.addChild(node1_2, { insertIndex: 3 })

        expect(node1.children.length).toBe(4)
        expect(node1.children[0]).toBe(node1_1)
        expect(node1.children[1]).toBe(node1_3)
        expect(node1.children[2]).toBe(node1_4)
        expect(node1.children[3]).toBe(node1_2)
        verifyTreeView(treeView)
      })

      it('挿入位置に現在と同じ値を指定した場合', () => {
        const node1 = treeView.getNode('node1')!
        const node1_1 = treeView.getNode('node1_1')!
        const node1_2 = treeView.getNode('node1_2')!
        const node1_3 = treeView.getNode('node1_3')!
        const node1_4 = treeView.getNode('node1_4')!
        const node1_1_descendants = util.getDescendants(node1_1)

        node1.addChild(node1_1, { insertIndex: 0 })

        expect(node1.children.length).toBe(4)
        expect(node1.children[0]).toBe(node1_1)
        expect(node1.children[1]).toBe(node1_2)
        expect(node1.children[2]).toBe(node1_3)
        expect(node1.children[3]).toBe(node1_4)
        verifyTreeView(treeView)
      })
    })

    it('トップレベルのノードを下位レベルへ移動', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      treeView.buildTree(cloneDeep(baseNodeDataList))

      const treeViewNodesLength = treeView.children.length
      const node1 = treeView.getNode('node1')!
      const node2 = treeView.getNode('node2')!
      const node2ChildrenLength = node2.children.length

      node2.addChild(node1)

      expect(treeView.children.length).toBe(treeViewNodesLength - 1)
      expect(treeView.children[0]).toBe(node2)
      expect(node2.children.length).toBe(node2ChildrenLength + 1)
      expect(node2.children[0]).toBe(node1)
      expect(node1.parent).toBe(node2)
      verifyTreeView(treeView)
    })

    it('別のツリービューへノードを移動', () => {
      const wrapper1 = mount<TreeViewImpl>(TreeView.clazz)
      const treeView1 = wrapper1.vm
      treeView1.buildTree(cloneDeep(baseNodeDataList))

      const wrapper2 = mount<TreeViewImpl>(TreeView.clazz)
      const treeView2 = wrapper2.vm
      treeView2.buildTree(cloneDeep(baseNodeDataList))
      treeView2.removeNode('node1_1')

      treeView2.addNode(treeView1.getNode('node1_1')!)

      {
        const node1_1 = treeView1.getNode('node1_1')
        expect(node1_1).toBeUndefined()
        const node1_1_1 = treeView1.getNode('node1_1_1')
        expect(node1_1_1).toBeUndefined()
      }
      {
        const node1_1 = treeView2.getNode('node1_1')
        expect(node1_1?.value).toBe('node1_1')
        const node1_1_1 = treeView2.getNode('node1_1_1')
        expect(node1_1_1?.value).toBe('node1_1_1')
      }
      verifyTreeView(treeView1)
      verifyTreeView(treeView2)
    })

    it('既に存在するノードを指定して追加', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      treeView.buildTree(cloneDeep(baseNodeDataList))

      const node1 = treeView.getNode('node1')!

      let actual!: Error
      try {
        node1.addChild({
          label: 'Node1_1',
          value: 'node1_1',
        })
      } catch (err) {
        actual = err
      }

      expect(actual).toBeInstanceOf(Error)
      expect(actual.message).toBe(`The node 'node1_1' already exists.`)
      verifyTreeView(treeView)
    })

    it('追加しようとするノードの子に自ノード(新しく親となるノード)が含まれている場合', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      treeView.buildTree(cloneDeep(baseNodeDataList))

      const node1 = treeView.getNode('node1')!
      const node1_1 = treeView.getNode('node1_1')!

      let actual!: Error
      try {
        node1_1.addChild(node1)
      } catch (err) {
        actual = err
      }

      expect(actual).toBeInstanceOf(Error)
      expect(actual.message).toBe(`The specified node '${node1.value}' contains the new parent '${node1_1.value}'.`)
      verifyTreeView(treeView)
    })
  })

  describe('removeChild()', () => {
    it('ベーシックケース', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      treeView.buildTree(cloneDeep(baseNodeDataList))

      const node1_1 = treeView.getNode('node1_1')!
      const node1_1Descendants = util.getDescendants(node1_1)
      const node1 = node1_1.parent!
      const node1ChildrenLength = node1.children.length

      node1.removeChild(node1_1)

      expect(treeView.getNode(node1_1.value)).toBeUndefined()
      expect(node1.children.length).toBe(node1ChildrenLength - 1)
      expect(node1.children.includes(node1_1)).not.toBeTruthy()
      expect(Array.from(node1.childContainer.children).includes(node1_1.el)).not.toBeTruthy()

      for (const descendant of node1_1Descendants) {
        expect(treeView.getNode((descendant as any).value)).toBeUndefined()
      }

      verifyTreeView(treeView)
    })

    it('選択ノードを削除', async () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      treeView.buildTree(cloneDeep(baseNodeDataList))

      const node1_1_1 = treeView.getNode('node1_1_1')!
      expect(node1_1_1.selected).toBeTruthy()
      const node1_1 = node1_1_1.parent!
      await clearEmitted(wrapper)

      node1_1.removeChild(node1_1_1)

      // イベント発火を検証
      // ・select-change
      const selectChangeEmitted = wrapper.emitted('select-change')!
      const selectChangeEvent: TreeViewEvent = selectChangeEmitted[0][0]
      expect(selectChangeEmitted.length).toBe(1)
      expect(selectChangeEvent.node).toBe(node1_1_1)
      // ・select
      expect(wrapper.emitted('select')).toBeUndefined()
      // ノードの選択状態を検証
      expect(treeView.selectedNode).toBeNull()
      expect(node1_1_1.selected).toBeFalsy()

      verifyTreeView(treeView)
    })

    it('選択ノードを子に持つ親ノードを削除', async () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      treeView.buildTree(cloneDeep(baseNodeDataList))

      const node1_1_1 = treeView.getNode('node1_1_1')!
      expect(node1_1_1.selected).toBeTruthy()
      const node1_1 = node1_1_1.parent!
      const node1 = node1_1.parent!
      await clearEmitted(wrapper)

      // 選択ノード(node1_1_1)の親(node1_1)を削除
      node1.removeChild(node1_1)

      // イベント発火を検証
      const selectChangeEmitted = wrapper.emitted('select-change')!
      const selectChangeEvent: TreeViewEvent = selectChangeEmitted[0][0]
      expect(selectChangeEmitted.length).toBe(1)
      expect(selectChangeEvent.node).toBe(node1_1_1)
      // ・select
      expect(wrapper.emitted('select')).toBeUndefined()
      // ノードの選択状態を検証
      expect(treeView.selectedNode).toBeNull()
      expect(node1_1_1.selected).toBeFalsy()

      verifyTreeView(treeView)
    })

    it('存在しないノードを指定', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      treeView.buildTree(cloneDeep(baseNodeDataList))

      const node1_1 = treeView.getNode('node1_1')!
      const node1 = node1_1.parent!

      // node1_1を削除
      treeView.removeNode(node1_1.value)
      expect(node1.children.includes(node1_1)).not.toBeTruthy()
      expect(Array.from(node1.childContainer.children).includes(node1_1.el)).not.toBeTruthy()

      // 存在しないノード(削除したnode1_1)をさらに削除
      // (何も起こらない)
      node1.removeChild(node1_1)

      verifyTreeView(treeView)
    })

    it('削除したノードを追加', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      treeView.buildTree(cloneDeep(baseNodeDataList))

      const node1_1 = treeView.getNode('node1_1')!
      const node1 = node1_1.parent!
      const node1ChildrenLength = node1.children.length

      // 削除してから追加
      node1.removeChild(node1_1)
      const actual = node1.addChild(node1_1, { insertIndex: 0 })

      expect(actual).toBe(node1_1)
      expect(treeView.getNode(node1_1.value)).toBe(node1_1)
      expect(node1.children.length).toBe(node1ChildrenLength)
      expect(node1.children[0]).toBe(node1_1)

      verifyTreeView(treeView)
    })
  })

  describe('removeAllChildren()', () => {
    it('ベーシックケース', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      treeView.buildTree(cloneDeep(baseNodeDataList))

      const node1_1 = treeView.getNode('node1_1')!
      const node1_1Descendants = util.getDescendants(node1_1)
      const node1 = node1_1.parent!

      node1.removeAllChildren()

      expect(node1.children.length).toBe(0)
      expect(Array.from(node1.childContainer.children).length).toBe(0)

      for (const descendant of node1_1Descendants) {
        expect(treeView.getNode((descendant as any).value)).toBeUndefined()
      }

      verifyTreeView(treeView)
    })
  })

  describe('getDescendants()', () => {
    it('ベーシックケース', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      treeView.buildTree(cloneDeep(baseNodeDataList))

      const node1_1 = treeView.getNode('node1')!

      const actual = node1_1.getDescendants()

      expect(actual.length).toBe(4)
      expect(actual[0].value).toBe('node1_1')
      expect(actual[1].value).toBe('node1_1_1')
      expect(actual[2].value).toBe('node1_1_2')
      expect(actual[3].value).toBe('node1_1_3')
    })
  })

  describe('子ノード開閉', () => {
    it('ベーシックケース', async () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      const nodeDataList = editNodeDataList(baseNodeDataList, [{ value: 'node1_1', opened: false }])
      treeView.buildTree(nodeDataList)

      const node1_1 = treeView.getNode('node1_1')!
      expect(node1_1.opened).toBe(false)

      // 以下で子ノード開閉を複数回行う
      node1_1.open()
      expect(node1_1.opened).toBeTruthy()
      node1_1.close()
      expect(node1_1.opened).toBeFalsy()
      node1_1.toggle()
      expect(node1_1.opened).toBeTruthy()

      // ノード開閉のアニメーションを考慮して一定時間待機
      await sleep(1000)
      // イベント発火を検証
      // ・open-change
      const openChangeEmitted = wrapper.emitted('open-change')!
      const openChangeEvent1: TreeViewEvent = openChangeEmitted[0][0]
      const openChangeEvent2: TreeViewEvent = openChangeEmitted[1][0]
      const openChangeEvent3: TreeViewEvent = openChangeEmitted[2][0]
      expect(openChangeEmitted.length).toBe(3)
      expect(openChangeEvent1.node).toBe(node1_1)
      expect(openChangeEvent2.node).toBe(node1_1)
      expect(openChangeEvent3.node).toBe(node1_1)
      // ノードの開閉状態を検証
      expect(node1_1.opened).toBeTruthy()
    })

    it('閉じている中のノード選択時にイベントが発火する事を検証', async () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      const nodeDataList = editNodeDataList(baseNodeDataList, [
        { value: 'node1_1', opened: false },
        { value: 'node1_1_1', selected: false },
      ])
      treeView.buildTree(nodeDataList)

      // 子ノードは閉じている
      const node1_1 = treeView.getNode('node1_1')!
      expect(node1_1.opened).toBe(false)
      // 閉じている中のノードは未選択である
      const node1_1_1 = treeView.getNode('node1_1_1')!
      expect(node1_1_1.selected).toBe(false)
      expect(treeView.selectedNode).toBeNull()
      await clearEmitted(wrapper)

      // 閉じている中のノードは選択する
      node1_1_1.selected = true

      // ノード開閉のアニメーションを考慮して一定時間待機
      await sleep(1000)
      // イベント発火を検証
      // ・select-change
      const selectChangeEmitted = wrapper.emitted('select-change')!
      const selectChangeEvent: TreeViewEvent = selectChangeEmitted[0][0]
      expect(selectChangeEmitted.length).toBe(1)
      expect(selectChangeEvent.node).toBe(node1_1_1)
      // ・select
      const selectEmitted = wrapper.emitted('select')!
      const selectEvent: TreeViewSelectEvent = selectEmitted[0][0]
      expect(selectEmitted.length).toBe(1)
      expect(selectEvent.node).toBe(node1_1_1)
      expect(selectEvent.oldNode).toBeUndefined()
      // ノードの選択状態を検証
      expect(treeView.selectedNode).toBe(node1_1_1)
      expect(node1_1_1.selected).toBeTruthy()
    })
  })

  describe('遅延ロード', () => {
    it('ノード展開時', async done => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      const nodeDataList = editNodeDataList(baseNodeDataList, [{ value: 'node1_1', opened: false, lazy: true }])
      treeView.buildTree(nodeDataList)

      const node1_1 = treeView.getNode('node1_1')!
      expect(node1_1.lazy).toBe(true)
      expect(node1_1.lazyLoadStatus).toBe('none')
      expect(node1_1.opened).toBe(false)

      await clearEmitted(wrapper)

      // 遅延ロードイベントのリスナ登録
      treeView.$on('lazy-load', async (e: TreeViewLazyLoadEvent) => {
        // 遅延ロード中の状態を検証
        expect(node1_1.lazyLoadStatus).toBe('loading')
        expect(node1_1.opened).toBe(false)
        // 遅延ロードを完了する
        e.done()
        // 遅延ロードのアニメーションを考慮して一定時間待機
        await sleep(1000)
        // 遅延ロード完了後の状態を検証
        expect(node1_1.lazyLoadStatus).toBe('loaded')
        expect(node1_1.opened).toBe(true)
        // ノード開閉イベント発火を検証
        // ・open-change
        const openChangeEmitted = wrapper.emitted('open-change')!
        const openChangeEvent: TreeViewEvent = openChangeEmitted[0][0]
        expect(openChangeEmitted.length).toBe(1)
        expect(openChangeEvent.node).toBe(node1_1)
        // 単体テスト完了
        done()
      })

      // 子ノードを開くと遅延ロードが開始される
      node1_1.open()
    })

    it('選択ノード変更時', async done => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      const nodeDataList = editNodeDataList(baseNodeDataList, [{ value: 'node1_1', selected: false, lazy: true }])
      treeView.buildTree(nodeDataList)

      const node1_1 = treeView.getNode('node1_1')!
      expect(node1_1.lazy).toBe(true)
      expect(node1_1.lazyLoadStatus).toBe('none')
      expect(node1_1.selected).toBe(false)

      const node1_1_1 = treeView.getNode('node1_1_1')!
      expect(node1_1_1.selected).toBe(true)
      expect(treeView.selectedNode).toBe(node1_1_1)

      await clearEmitted(wrapper)

      // 遅延ロードイベントのリスナ登録
      treeView.$on('lazy-load', async (e: TreeViewLazyLoadEvent) => {
        // 遅延ロード中の状態を検証
        expect(node1_1.lazyLoadStatus).toBe('loading')
        expect(node1_1.selected).toBe(false)
        // 遅延ロードを完了する
        e.done()
        // 遅延ロードのアニメーションを考慮して一定時間待機
        await sleep(1000)
        // 遅延ロード完了後の状態を検証
        expect(node1_1.lazyLoadStatus).toBe('loaded')
        expect(node1_1.selected).toBe(true)
        // 選択イベント発火を検証
        // ・select-change
        const selectChangeEmitted = wrapper.emitted('select-change')!
        const selectChangeEvent1: TreeViewEvent = selectChangeEmitted[0][0]
        const selectChangeEvent2: TreeViewEvent = selectChangeEmitted[1][0]
        expect(selectChangeEmitted.length).toBe(2)
        expect(selectChangeEvent1.node).toBe(node1_1_1)
        expect(selectChangeEvent2.node).toBe(node1_1)
        // ・select
        const selectEmitted = wrapper.emitted('select')!
        const selectEvent: TreeViewSelectEvent = selectEmitted[0][0]
        expect(selectEmitted.length).toBe(1)
        expect(selectEvent.node).toBe(node1_1)
        expect(selectEvent.oldNode).toBe(node1_1_1)
        // ノードの選択状態を検証
        expect(node1_1_1.selected).toBeFalsy()
        expect(getNodeData(nodeDataList, node1_1_1.value)!.selected).toBeFalsy()
        expect(node1_1.selected).toBeTruthy()
        expect(getNodeData(nodeDataList, node1_1.value)!.selected).toBeTruthy()
        // 単体テスト完了
        done()
      })

      // ノードを選択すると遅延ロードが開始される
      node1_1.selected = true
    })

    it('選択ノード変更時 - サイレントモード', async done => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      const nodeDataList = editNodeDataList(baseNodeDataList, [{ value: 'node1_1', selected: false, lazy: true }])
      treeView.buildTree(nodeDataList)

      const node1_1 = treeView.getNode('node1_1')!
      expect(node1_1.lazy).toBe(true)
      expect(node1_1.lazyLoadStatus).toBe('none')
      expect(node1_1.selected).toBe(false)

      const node1_1_1 = treeView.getNode('node1_1_1')!
      expect(node1_1_1.selected).toBe(true)

      await clearEmitted(wrapper)

      // 遅延ロードイベントのリスナ登録
      treeView.$on('lazy-load', async (e: TreeViewLazyLoadEvent) => {
        // 遅延ロード中の状態を検証
        expect(node1_1.lazyLoadStatus).toBe('loading')
        expect(node1_1.selected).toBe(false)
        // 遅延ロードを完了する
        e.done()
        // 遅延ロードのアニメーションを考慮して一定時間待機
        await sleep(1000)
        // 遅延ロード完了後の状態を検証
        expect(node1_1.lazyLoadStatus).toBe('loaded')
        expect(node1_1.selected).toBe(true)
        // 選択イベント発火を検証
        // ・select-change
        expect(wrapper.emitted('select-change')).toBeUndefined()
        // ・select
        expect(wrapper.emitted('select')).toBeUndefined()
        // ノードの選択状態を検証
        expect(node1_1_1.selected).toBeFalsy()
        expect(getNodeData(nodeDataList, node1_1_1.value)!.selected).toBeFalsy()
        expect(node1_1.selected).toBeTruthy()
        expect(getNodeData(nodeDataList, node1_1.value)!.selected).toBeTruthy()
        // 単体テスト完了
        done()
      })

      // ノードを選択すると遅延ロードが開始される
      node1_1.setSelected(true, true)
    })
  })

  describe('子ノードの並び順', () => {
    let treeView: TreeViewImpl

    describe('ソート関数', () => {
      beforeEach(() => {
        const wrapper = mount<TreeViewImpl>(TreeView.clazz)
        treeView = wrapper.vm
        treeView.buildTree([
          {
            label: 'node1',
            value: 'node1',
            children: [
              { label: 'node1_1', value: 'node1_1' },
              { label: 'node1_2', value: 'node1_2' },
              { label: 'node1_3', value: 'node1_3' },
            ],
          },
          { label: 'node2', value: 'node2' },
          { label: 'node3', value: 'node3' },
        ])
      })

      it('ツリービューにソート関数を設定', async () => {
        // ツリービューにソート関数(labelの降順)を設定
        treeView.setSortFunc((a: TreeNode, b: TreeNode) => {
          return a.label > b.label ? -1 : a.label < b.label ? 1 : 0
        })

        // ツリービューの子ノードはlabelの降順
        expect(treeView.children.map((node: TreeNode) => node.value)).toEqual(['node3', 'node2', 'node1'])
        // ノードの子ノードもlabelの降順
        const node1 = treeView.getNode('node1')!
        expect(node1.children.map((node: TreeNode) => node.value)).toEqual(['node1_3', 'node1_2', 'node1_1'])

        verifyTreeView(treeView)
      })

      it('ノードにソート関数を設定', async () => {
        // ノードにソート関数(labelの降順)を設定
        const node1 = treeView.getNode('node1')!
        node1.setSortFunc((a: TreeNode, b: TreeNode) => {
          return a.label > b.label ? -1 : a.label < b.label ? 1 : 0
        })

        // ツリービューの子ノードはlabelの降順
        expect(node1.children.map((node: TreeNode) => node.value)).toEqual(['node1_3', 'node1_2', 'node1_1'])

        verifyTreeView(treeView)
      })

      it('ツリービューとノードに別のソート関数を設定', async () => {
        // ツリービューにソート関数(labelの昇順)を設定
        treeView.setSortFunc((a: TreeNode, b: TreeNode) => {
          return a.label < b.label ? -1 : a.label > b.label ? 1 : 0
        })
        // ノードにソート関数(labelの降順)を設定
        const node1 = treeView.getNode('node1')!
        node1.setSortFunc((a: TreeNode, b: TreeNode) => {
          return a.label > b.label ? -1 : a.label < b.label ? 1 : 0
        })

        // ツリービューの子ノードはlabelの昇順
        expect(treeView.children.map((node: TreeNode) => node.value)).toEqual(['node1', 'node2', 'node3'])
        // ノードの子ノードはlabelの降順
        expect(node1.children.map((node: TreeNode) => node.value)).toEqual(['node1_3', 'node1_2', 'node1_1'])

        verifyTreeView(treeView)
      })
    })

    describe('プロパティ変更による並び順検証', () => {
      describe('ツリービューの子ノード', () => {
        beforeEach(() => {
          const wrapper = mount<TreeViewImpl>(TreeView.clazz)
          treeView = wrapper.vm
          treeView.buildTree(
            [
              { label: 'node1', value: 'node1' },
              { label: 'node2', value: 'node2' },
              { label: 'node3', value: 'node3' },
            ],
            {
              // ツリービューにソート関数(labelの降順)を設定
              sortFunc: (a: TreeNode, b: TreeNode) => {
                return a.label < b.label ? -1 : a.label > b.label ? 1 : 0
              },
            }
          )
        })

        it('先頭に移動', async () => {
          const node3 = treeView.getNode('node3')!

          // ツリービューの子ノードのプロパティを変更
          const newLabel = 'node0'
          node3.label = newLabel

          // ノードの並び順再設定が非同期で実行されるので少し待機
          await sleep(100)

          expect(node3.label).toBe(newLabel)
          expect(treeView.getNode(node3.value)!.label).toBe(newLabel)
          // ツリービューの子ノードはlabelの昇順
          expect(treeView.children.map((node: TreeNode) => node.value)).toEqual(['node3', 'node1', 'node2'])

          verifyTreeView(treeView)
        })

        it('真ん中に移動', async () => {
          const node3 = treeView.getNode('node3')!

          // ツリービューの子ノードのプロパティを変更
          const newLabel = 'node1.1'
          node3.label = newLabel

          // ノードの並び順再設定が非同期で実行されるので少し待機
          await sleep(100)

          expect(node3.label).toBe(newLabel)
          expect(treeView.getNode(node3.value)!.label).toBe(newLabel)
          // ツリービューの子ノードはlabelの昇順
          expect(treeView.children.map((node: TreeNode) => node.value)).toEqual(['node1', 'node3', 'node2'])

          verifyTreeView(treeView)
        })

        it('最後尾に移動', async () => {
          const node1 = treeView.getNode('node1')!

          // ツリービューの子ノードのプロパティを変更
          const newLabel = 'node3.1'
          node1.label = newLabel

          // ノードの並び順再設定が非同期で実行されるので少し待機
          await sleep(100)

          expect(node1.label).toBe(newLabel)
          expect(treeView.getNode(node1.value)!.label).toBe(newLabel)
          // ツリービューの子ノードはlabelの昇順
          expect(treeView.children.map((node: TreeNode) => node.value)).toEqual(['node2', 'node3', 'node1'])

          verifyTreeView(treeView)
        })
      })

      describe('ノードの子ノード', () => {
        beforeEach(() => {
          const wrapper = mount<TreeViewImpl>(TreeView.clazz)
          treeView = wrapper.vm
          treeView.buildTree(
            [
              {
                label: 'node1',
                value: 'node1',
                children: [
                  { label: 'node1_1', value: 'node1_1' },
                  { label: 'node1_2', value: 'node1_2' },
                  { label: 'node1_3', value: 'node1_3' },
                ],
              },
            ],
            {
              // ツリービューにソート関数(labelの降順)を設定
              sortFunc: (a: TreeNode, b: TreeNode) => {
                return a.label < b.label ? -1 : a.label > b.label ? 1 : 0
              },
            }
          )
        })

        it('先頭に移動', async () => {
          const node1 = treeView.getNode('node1')!
          const node1_3 = treeView.getNode('node1_3')!

          // ノードの子ノードのプロパティを変更
          const newLabel = 'node1_0'
          node1_3.label = newLabel

          // ノードの並び順再設定が非同期で実行されるので少し待機
          await sleep(100)

          expect(node1_3.label).toBe(newLabel)
          expect(treeView.getNode(node1_3.value)!.label).toBe(newLabel)
          // ノードの子ノードはlabelの昇順
          expect(node1.children.map((node: TreeNode) => node.value)).toEqual(['node1_3', 'node1_1', 'node1_2'])

          verifyTreeView(treeView)
        })

        it('真ん中に移動', async () => {
          const node1 = treeView.getNode('node1')!
          const node1_3 = treeView.getNode('node1_3')!

          // ノードの子ノードのプロパティを変更
          const newLabel = 'node1_1.1'
          node1_3.label = newLabel

          // ノードの並び順再設定が非同期で実行されるので少し待機
          await sleep(100)

          expect(node1_3.label).toBe(newLabel)
          expect(treeView.getNode(node1_3.value)!.label).toBe(newLabel)
          // ノードの子ノードはlabelの昇順
          expect(node1.children.map((node: TreeNode) => node.value)).toEqual(['node1_1', 'node1_3', 'node1_2'])

          verifyTreeView(treeView)
        })

        it('最後尾に移動', async () => {
          const node1 = treeView.getNode('node1')!
          const node1_1 = treeView.getNode('node1_1')!

          // ノードの子ノードのプロパティを変更
          const newLabel = 'node1_3.1'
          node1_1.label = newLabel

          // ノードの並び順再設定が非同期で実行されるので少し待機
          await sleep(100)

          expect(node1_1.label).toBe(newLabel)
          expect(treeView.getNode(node1_1.value)!.label).toBe(newLabel)
          // ノードの子ノードはlabelの昇順
          expect(node1.children.map((node: TreeNode) => node.value)).toEqual(['node1_2', 'node1_3', 'node1_1'])

          verifyTreeView(treeView)
        })
      })
    })
  })

  describe('プロパティ値の変更', () => {
    it('labelを変更 - プロパティ変更', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      const nodeDataList = editNodeDataList(baseNodeDataList)
      treeView.buildTree(nodeDataList)

      const node1_1_1 = treeView.getNode('node1_1_1')!
      const newLabel = `${node1_1_1.label}_xxx`

      node1_1_1.label = newLabel

      expect(node1_1_1.label).toBe(newLabel)
      expect(getNodeData(nodeDataList, node1_1_1.value)!.label).toBe(newLabel)
      verifyTreeView(treeView)
    })

    it('labelを変更 - setNodeData()', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      const nodeDataList = editNodeDataList(baseNodeDataList)
      treeView.buildTree(nodeDataList)

      const node1_1_1 = treeView.getNode('node1_1_1')!
      const newLabel = `${node1_1_1.label}_xxx`

      node1_1_1.setNodeData({ label: newLabel })

      expect(node1_1_1.label).toBe(newLabel)
      expect(getNodeData(nodeDataList, node1_1_1.value)!.label).toBe(newLabel)
      verifyTreeView(treeView)
    })

    it('valueを変更 - プロパティ変更', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      const nodeDataList = editNodeDataList(baseNodeDataList)
      treeView.buildTree(nodeDataList)

      const node1_1_1 = treeView.getNode('node1_1_1')!
      const newValue = `${node1_1_1.label}_xxx`
      const oldValue = node1_1_1.value

      node1_1_1.value = newValue

      // newValueでノードを取得できることを検証
      expect(treeView.getNode(newValue)).toBe(node1_1_1)
      // oldValueでノードを取得できないことを検証
      expect(treeView.getNode(oldValue)).toBeUndefined()

      expect(node1_1_1.value).toBe(newValue)
      expect(getNodeData(nodeDataList, node1_1_1.value)!.value).toBe(newValue)
      verifyTreeView(treeView)
    })

    it('valueを変更 - setNodeData()', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      const nodeDataList = editNodeDataList(baseNodeDataList)
      treeView.buildTree(nodeDataList)

      const node1_1_1 = treeView.getNode('node1_1_1')!
      const newValue = `${node1_1_1.label}_xxx`
      const oldValue = node1_1_1.value

      node1_1_1.setNodeData({ value: newValue })

      // newValueでノードを取得できることを検証
      expect(treeView.getNode(newValue)).toBe(node1_1_1)
      // oldValueでノードを取得できないことを検証
      expect(treeView.getNode(oldValue)).toBeUndefined()

      expect(node1_1_1.value).toBe(newValue)
      expect(getNodeData(nodeDataList, node1_1_1.value)!.value).toBe(newValue)
      verifyTreeView(treeView)
    })

    it('iconを変更 - プロパティ変更', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      const nodeDataList = editNodeDataList(baseNodeDataList)
      treeView.buildTree(nodeDataList)

      const node1_1_1 = treeView.getNode('node1_1_1')!
      const newIcon = 'description'

      node1_1_1.icon = newIcon

      expect(node1_1_1.icon).toBe(newIcon)
      expect(getNodeData(nodeDataList, node1_1_1.value)!.icon).toBe(newIcon)
      verifyTreeView(treeView)
    })

    it('iconを変更 - setNodeData()', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      const nodeDataList = editNodeDataList(baseNodeDataList)
      treeView.buildTree(nodeDataList)

      const node1_1_1 = treeView.getNode('node1_1_1')!
      const newIcon = 'description'

      node1_1_1.setNodeData({ icon: newIcon })

      expect(node1_1_1.icon).toBe(newIcon)
      expect(getNodeData(nodeDataList, node1_1_1.value)!.icon).toBe(newIcon)
      verifyTreeView(treeView)
    })

    it('iconColorを変更 - プロパティ変更', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      const nodeDataList = editNodeDataList(baseNodeDataList)
      treeView.buildTree(nodeDataList)

      const node1_1_1 = treeView.getNode('node1_1_1')!
      const newIconColor = 'indigo-5'

      node1_1_1.iconColor = newIconColor

      expect(node1_1_1.iconColor).toBe(newIconColor)
      expect(getNodeData(nodeDataList, node1_1_1.value)!.iconColor).toBe(newIconColor)
      verifyTreeView(treeView)
    })

    it('iconColorを変更 - setNodeData()', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      const nodeDataList = editNodeDataList(baseNodeDataList)
      treeView.buildTree(nodeDataList)

      const node1_1_1 = treeView.getNode('node1_1_1')!
      const newIconColor = 'indigo-5'

      node1_1_1.setNodeData({ iconColor: newIconColor })

      expect(node1_1_1.iconColor).toBe(newIconColor)
      expect(getNodeData(nodeDataList, node1_1_1.value)!.iconColor).toBe(newIconColor)
      verifyTreeView(treeView)
    })

    it('openedを変更(trueを設定) - プロパティ変更', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      const nodeDataList = editNodeDataList(baseNodeDataList, [{ value: 'node1_1_1', opened: false }])
      treeView.buildTree(nodeDataList)

      const node1_1_1 = treeView.getNode('node1_1_1')!
      expect(node1_1_1.opened).toBe(false)

      node1_1_1.toggle()

      expect(node1_1_1.opened).toBe(true)
      expect(getNodeData(nodeDataList, node1_1_1.value)!.opened).toBe(true)
      verifyTreeView(treeView)
    })

    it('openedを変更(trueを設定) - setNodeData()', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      const nodeDataList = editNodeDataList(baseNodeDataList, [{ value: 'node1_1_1', opened: false }])
      treeView.buildTree(nodeDataList)

      const node1_1_1 = treeView.getNode('node1_1_1')!
      expect(node1_1_1.opened).toBe(false)

      node1_1_1.setNodeData({ opened: true })

      expect(node1_1_1.opened).toBe(true)
      expect(getNodeData(nodeDataList, node1_1_1.value)!.opened).toBe(true)
      verifyTreeView(treeView)
    })

    it('openedを変更(falseを設定) - プロパティ変更', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      const nodeDataList = editNodeDataList(baseNodeDataList, [{ value: 'node1_1_1', opened: true }])
      treeView.buildTree(nodeDataList)

      const node1_1_1 = treeView.getNode('node1_1_1')!
      expect(node1_1_1.opened).toBe(true)

      node1_1_1.toggle()

      expect(node1_1_1.opened).toBe(false)
      expect(getNodeData(nodeDataList, node1_1_1.value)!.opened).toBe(false)
      verifyTreeView(treeView)
    })

    it('openedを変更(falseを設定) - setNodeData()', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      const nodeDataList = editNodeDataList(baseNodeDataList, [{ value: 'node1_1_1', opened: true }])
      treeView.buildTree(nodeDataList)

      const node1_1_1 = treeView.getNode('node1_1_1')!
      expect(node1_1_1.opened).toBe(true)

      node1_1_1.setNodeData({ opened: false })

      expect(node1_1_1.opened).toBe(false)
      expect(getNodeData(nodeDataList, node1_1_1.value)!.opened).toBe(false)
      verifyTreeView(treeView)
    })

    it('unselectableを変更(選択可能から選択不可へ) - プロパティ変更', async () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      const nodeDataList = editNodeDataList(baseNodeDataList, [{ value: 'node1_1_1', selected: false }])
      treeView.buildTree(nodeDataList)

      const node1_1_1 = treeView.getNode('node1_1_1')!
      expect(node1_1_1.unselectable).toBeFalsy()
      expect(node1_1_1.selected).toBeFalsy()
      await clearEmitted(wrapper)

      node1_1_1.unselectable = true

      // イベント発火を検証
      // ・select-change
      expect(wrapper.emitted('select-change')).toBeUndefined()
      // ・select
      expect(wrapper.emitted('select')).toBeUndefined()
      // ノードの選択状態を検証
      expect(node1_1_1.unselectable).toBeTruthy()
      expect(getNodeData(nodeDataList, node1_1_1.value)!.unselectable).toBeTruthy()
      expect(node1_1_1.selected).toBeFalsy()
      expect(getNodeData(nodeDataList, node1_1_1.value)!.selected).toBeFalsy()

      verifyTreeView(treeView)
    })

    it('unselectableを変更(選択可能から選択不可へ) - setNodeData()', async () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      const nodeDataList = editNodeDataList(baseNodeDataList, [{ value: 'node1_1_1', selected: false }])
      treeView.buildTree(nodeDataList)

      const node1_1_1 = treeView.getNode('node1_1_1')!
      expect(node1_1_1.unselectable).toBeFalsy()
      expect(node1_1_1.selected).toBeFalsy()
      await clearEmitted(wrapper)

      node1_1_1.setNodeData({ unselectable: true })

      // イベント発火を検証
      // ・select-change
      expect(wrapper.emitted('select-change')).toBeUndefined()
      // ・select
      expect(wrapper.emitted('select')).toBeUndefined()
      // ノードの選択状態を検証
      expect(node1_1_1.unselectable).toBeTruthy()
      expect(getNodeData(nodeDataList, node1_1_1.value)!.unselectable).toBeTruthy()
      expect(node1_1_1.selected).toBeFalsy()
      expect(getNodeData(nodeDataList, node1_1_1.value)!.selected).toBeFalsy()

      verifyTreeView(treeView)
    })

    it('unselectableを変更(選択不可から選択可能へ) - プロパティ変更', async () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      const nodeDataList = editNodeDataList(baseNodeDataList, [{ value: 'node1_1_1', unselectable: true, selected: false }])
      treeView.buildTree(nodeDataList)

      const node1_1_1 = treeView.getNode('node1_1_1')!
      expect(node1_1_1.unselectable).toBeTruthy()
      expect(node1_1_1.selected).toBeFalsy()
      await clearEmitted(wrapper)

      node1_1_1.unselectable = false

      // イベント発火を検証
      // ・select-change
      expect(wrapper.emitted('select-change')).toBeUndefined()
      // ・select
      expect(wrapper.emitted('select')).toBeUndefined()
      // ノードの選択状態を検証
      expect(node1_1_1.unselectable).toBeFalsy()
      expect(getNodeData(nodeDataList, node1_1_1.value)!.unselectable).toBeFalsy()
      expect(node1_1_1.selected).toBeFalsy()
      expect(getNodeData(nodeDataList, node1_1_1.value)!.selected).toBeFalsy()

      verifyTreeView(treeView)
    })

    it('unselectableを変更(選択不可から選択可能へ) - setNodeData()', async () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      const nodeDataList = editNodeDataList(baseNodeDataList, [{ value: 'node1_1_1', unselectable: true, selected: false }])
      treeView.buildTree(nodeDataList)

      const node1_1_1 = treeView.getNode('node1_1_1')!
      expect(node1_1_1.unselectable).toBeTruthy()
      expect(node1_1_1.selected).toBeFalsy()
      await clearEmitted(wrapper)

      node1_1_1.setNodeData({ unselectable: false })

      // イベント発火を検証
      // ・select-change
      expect(wrapper.emitted('select-change')).toBeUndefined()
      // ・select
      expect(wrapper.emitted('select')).toBeUndefined()
      // ノードの選択状態を検証
      expect(node1_1_1.unselectable).toBeFalsy()
      expect(getNodeData(nodeDataList, node1_1_1.value)!.unselectable).toBeFalsy()
      expect(node1_1_1.selected).toBeFalsy()
      expect(getNodeData(nodeDataList, node1_1_1.value)!.selected).toBeFalsy()

      verifyTreeView(treeView)
    })

    it('unselectableを変更(｢選択可能+選択状態｣から選択不可へ) - プロパティ変更', async () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      const nodeDataList = editNodeDataList(baseNodeDataList)
      treeView.buildTree(nodeDataList)

      const node1_1_1 = treeView.getNode('node1_1_1')!
      expect(node1_1_1.unselectable).toBeFalsy()
      expect(node1_1_1.selected).toBeTruthy()
      await clearEmitted(wrapper)

      node1_1_1.unselectable = true

      // イベント発火を検証
      // ・select-change
      const selectChangeEmitted = wrapper.emitted('select-change')!
      const selectChangeEvent: TreeViewEvent = selectChangeEmitted[0][0]
      expect(selectChangeEmitted.length).toBe(1)
      expect(selectChangeEvent.node).toBe(node1_1_1)
      // ・select
      expect(wrapper.emitted('select')).toBeUndefined()
      // ノードの選択状態を検証
      expect(node1_1_1.unselectable).toBeTruthy()
      expect(getNodeData(nodeDataList, node1_1_1.value)!.unselectable).toBeTruthy()
      expect(node1_1_1.selected).toBeFalsy()
      expect(getNodeData(nodeDataList, node1_1_1.value)!.selected).toBeFalsy()

      verifyTreeView(treeView)
    })

    it('unselectableを変更(｢選択可能+選択状態｣から選択不可へ) - setNodeData()', async () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      const nodeDataList = editNodeDataList(baseNodeDataList)
      treeView.buildTree(nodeDataList)

      const node1_1_1 = treeView.getNode('node1_1_1')!
      expect(node1_1_1.unselectable).toBeFalsy()
      expect(node1_1_1.selected).toBeTruthy()
      await clearEmitted(wrapper)

      node1_1_1.setNodeData({ unselectable: true })

      // イベント発火を検証
      // ・select-change
      const selectChangeEmitted = wrapper.emitted('select-change')!
      const selectChangeEvent: TreeViewEvent = selectChangeEmitted[0][0]
      expect(selectChangeEmitted.length).toBe(1)
      expect(selectChangeEvent.node).toBe(node1_1_1)
      // ・select
      expect(wrapper.emitted('select')).toBeUndefined()
      // ノードの選択状態を検証
      expect(node1_1_1.unselectable).toBeTruthy()
      expect(getNodeData(nodeDataList, node1_1_1.value)!.unselectable).toBeTruthy()
      expect(node1_1_1.selected).toBeFalsy()
      expect(getNodeData(nodeDataList, node1_1_1.value)!.selected).toBeFalsy()

      verifyTreeView(treeView)
    })

    it('selectedを変更(未選択から選択へ) - プロパティ変更', async () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      const nodeDataList = editNodeDataList(baseNodeDataList, [{ value: 'node1_1_1', selected: false }])
      treeView.buildTree(nodeDataList)

      const node1_1_1 = treeView.getNode('node1_1_1')!
      expect(node1_1_1.unselectable).toBeFalsy()
      expect(node1_1_1.selected).toBeFalsy()
      expect(treeView.selectedNode).toBeNull()
      await clearEmitted(wrapper)

      node1_1_1.selected = true

      // イベント発火を検証
      // ・select-change
      const selectChangeEmitted = wrapper.emitted('select-change')!
      const selectChangeEvent: TreeViewEvent = selectChangeEmitted[0][0]
      expect(selectChangeEmitted.length).toBe(1)
      expect(selectChangeEvent.node).toBe(node1_1_1)
      // ・select
      const selectEmitted = wrapper.emitted('select')!
      const selectEvent: TreeViewSelectEvent = selectEmitted[0][0]
      expect(selectEmitted.length).toBe(1)
      expect(selectEvent.node).toBe(node1_1_1)
      expect(selectEvent.oldNode).toBeUndefined()
      // ノードの選択状態を検証
      expect(node1_1_1.selected).toBeTruthy()
      expect(getNodeData(nodeDataList, node1_1_1.value)!.selected).toBeTruthy()

      verifyTreeView(treeView)
    })

    it('selectedを変更(未選択から選択へ) - setNodeData()', async () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      const nodeDataList = editNodeDataList(baseNodeDataList, [{ value: 'node1_1_1', selected: false }])
      treeView.buildTree(nodeDataList)

      const node1_1_1 = treeView.getNode('node1_1_1')!
      expect(node1_1_1.unselectable).toBeFalsy()
      expect(node1_1_1.selected).toBeFalsy()
      expect(treeView.selectedNode).toBeNull()
      await clearEmitted(wrapper)

      node1_1_1.setNodeData({ selected: true })

      // イベント発火を検証
      // ・select-change
      const selectChangeEmitted = wrapper.emitted('select-change')!
      const selectChangeEvent: TreeViewEvent = selectChangeEmitted[0][0]
      expect(selectChangeEmitted.length).toBe(1)
      expect(selectChangeEvent.node).toBe(node1_1_1)
      // ・select
      const selectEmitted = wrapper.emitted('select')!
      const selectEvent: TreeViewSelectEvent = selectEmitted[0][0]
      expect(selectEmitted.length).toBe(1)
      expect(selectEvent.node).toBe(node1_1_1)
      expect(selectEvent.oldNode).toBeUndefined()
      // ノードの選択状態を検証
      expect(node1_1_1.selected).toBeTruthy()
      expect(getNodeData(nodeDataList, node1_1_1.value)!.selected).toBeTruthy()

      verifyTreeView(treeView)
    })

    it('selectedを変更(未選択から選択へ) - サイレントモード', async () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      const nodeDataList = editNodeDataList(baseNodeDataList, [{ value: 'node1_1_1', selected: false }])
      treeView.buildTree(nodeDataList)

      const node1_1_1 = treeView.getNode('node1_1_1')!
      expect(node1_1_1.unselectable).toBeFalsy()
      expect(node1_1_1.selected).toBeFalsy()
      await clearEmitted(wrapper)

      node1_1_1.setSelected(true, true)

      // イベント発火を検証
      // ・select-change
      expect(wrapper.emitted('select-change')).toBeUndefined()
      // ・select
      expect(wrapper.emitted('select')).toBeUndefined()
      // ノードの選択状態を検証
      expect(node1_1_1.selected).toBeTruthy()
      expect(getNodeData(nodeDataList, node1_1_1.value)!.selected).toBeTruthy()

      verifyTreeView(treeView)
    })

    it('selectedを変更(選択から選択へ、つまり変更なし) - プロパティ変更', async () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      const nodeDataList = editNodeDataList(baseNodeDataList)
      treeView.buildTree(nodeDataList)

      const node1_1_1 = treeView.getNode('node1_1_1')!
      expect(node1_1_1.unselectable).toBeFalsy()
      expect(node1_1_1.selected).toBeTruthy()
      expect(treeView.selectedNode).toBe(node1_1_1)
      await clearEmitted(wrapper)

      node1_1_1.selected = true

      // イベント発火を検証
      // ・select-change
      expect(wrapper.emitted('select-change')).toBeUndefined()
      // ・select
      const selectEmitted = wrapper.emitted('select')!
      const selectEvent: TreeViewSelectEvent = selectEmitted[0][0]
      expect(selectEmitted.length).toBe(1)
      expect(selectEvent.node).toBe(node1_1_1)
      expect(selectEvent.oldNode).toBe(node1_1_1)
      // ノードの選択状態を検証
      expect(node1_1_1.selected).toBeTruthy()
      expect(getNodeData(nodeDataList, node1_1_1.value)!.selected).toBeTruthy()

      verifyTreeView(treeView)
    })

    it('selectedを変更(選択から選択へ、つまり変更なし) - setNodeData()', async () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      const nodeDataList = editNodeDataList(baseNodeDataList)
      treeView.buildTree(nodeDataList)

      const node1_1_1 = treeView.getNode('node1_1_1')!
      expect(node1_1_1.unselectable).toBeFalsy()
      expect(node1_1_1.selected).toBeTruthy()
      expect(treeView.selectedNode).toBe(node1_1_1)
      await clearEmitted(wrapper)

      node1_1_1.setNodeData({ selected: true })

      // イベント発火を検証
      // ・select-change
      expect(wrapper.emitted('select-change')).toBeUndefined
      // ・select
      const selectEmitted = wrapper.emitted('select')!
      const selectEvent: TreeViewSelectEvent = selectEmitted[0][0]
      expect(selectEmitted.length).toBe(1)
      expect(selectEvent.node).toBe(node1_1_1)
      expect(selectEvent.oldNode).toBe(node1_1_1)
      // ノードの選択状態を検証
      expect(node1_1_1.selected).toBeTruthy()
      expect(getNodeData(nodeDataList, node1_1_1.value)!.selected).toBeTruthy()

      verifyTreeView(treeView)
    })

    it('selectedを変更(選択から選択へ、つまり変更なし) - サイレントモード', async () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      const nodeDataList = editNodeDataList(baseNodeDataList)
      treeView.buildTree(nodeDataList)

      const node1_1_1 = treeView.getNode('node1_1_1')!
      expect(node1_1_1.unselectable).toBeFalsy()
      expect(node1_1_1.selected).toBeTruthy()
      await clearEmitted(wrapper)

      node1_1_1.setSelected(true, true)

      // イベント発火を検証
      // ・select-change
      expect(wrapper.emitted('select-change')).toBeUndefined()
      // ・select
      expect(wrapper.emitted('select')).toBeUndefined()
      // ノードの選択状態を検証
      expect(node1_1_1.selected).toBeTruthy()
      expect(getNodeData(nodeDataList, node1_1_1.value)!.selected).toBeTruthy()

      verifyTreeView(treeView)
    })

    it('selectedを変更(選択から未選択へ) - プロパティ変更', async () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      const nodeDataList = editNodeDataList(baseNodeDataList)
      treeView.buildTree(nodeDataList)

      const node1_1_1 = treeView.getNode('node1_1_1')!
      expect(node1_1_1.unselectable).toBeFalsy()
      expect(node1_1_1.selected).toBeTruthy()
      await clearEmitted(wrapper)

      node1_1_1.selected = false

      // イベント発火を検証
      // ・select-change
      const selectChangeEmitted = wrapper.emitted('select-change')!
      const selectChangeEvent: TreeViewEvent = selectChangeEmitted[0][0]
      expect(selectChangeEmitted.length).toBe(1)
      expect(selectChangeEvent.node).toBe(node1_1_1)
      // ・select
      expect(wrapper.emitted('select')).toBeUndefined()
      // ノードの選択状態を検証
      expect(node1_1_1.selected).toBeFalsy()
      expect(getNodeData(nodeDataList, node1_1_1.value)!.selected).toBeFalsy()

      verifyTreeView(treeView)
    })

    it('selectedを変更(選択から未選択へ) - setNodeData()', async () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      const nodeDataList = editNodeDataList(baseNodeDataList)
      treeView.buildTree(nodeDataList)

      const node1_1_1 = treeView.getNode('node1_1_1')!
      expect(node1_1_1.unselectable).toBeFalsy()
      expect(node1_1_1.selected).toBeTruthy()
      await clearEmitted(wrapper)

      node1_1_1.setNodeData({ selected: false })

      // イベント発火を検証
      // ・select-change
      const selectChangeEmitted = wrapper.emitted('select-change')!
      const selectChangeEvent: TreeViewEvent = selectChangeEmitted[0][0]
      expect(selectChangeEmitted.length).toBe(1)
      expect(selectChangeEvent.node).toBe(node1_1_1)
      // ・select
      expect(wrapper.emitted('select')).toBeUndefined()
      // ノードの選択状態を検証
      expect(node1_1_1.selected).toBeFalsy()
      expect(getNodeData(nodeDataList, node1_1_1.value)!.selected).toBeFalsy()

      verifyTreeView(treeView)
    })

    it('selectedを変更(選択から未選択へ) - サイレントモード', async () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      const nodeDataList = editNodeDataList(baseNodeDataList)
      treeView.buildTree(nodeDataList)

      const node1_1_1 = treeView.getNode('node1_1_1')!
      expect(node1_1_1.unselectable).toBeFalsy()
      expect(node1_1_1.selected).toBeTruthy()
      await clearEmitted(wrapper)

      node1_1_1.setSelected(false, true)

      // イベント発火を検証
      // ・select-change
      expect(wrapper.emitted('select-change')).toBeUndefined()
      // ・select
      expect(wrapper.emitted('select')).toBeUndefined()
      // ノードの選択状態を検証
      expect(node1_1_1.selected).toBeFalsy()
      expect(getNodeData(nodeDataList, node1_1_1.value)!.selected).toBeFalsy()

      verifyTreeView(treeView)
    })

    it('selectedを変更(現在の選択ノードとは別のノードを選択) - プロパティ変更', async () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      const nodeDataList = editNodeDataList(baseNodeDataList)
      treeView.buildTree(nodeDataList)

      const node1_1_1 = treeView.getNode('node1_1_1')!
      expect(node1_1_1.selected).toBeTruthy()
      expect(treeView.selectedNode).toBe(node1_1_1)
      const node1_1_3 = treeView.getNode('node1_1_3')!
      expect(node1_1_3.selected).toBeFalsy()
      await clearEmitted(wrapper)

      node1_1_3.selected = true

      // イベント発火を検証
      // ・select-chang
      const selectChangeEmitted = wrapper.emitted('select-change')!
      const selectChangeEvent1: TreeViewEvent = selectChangeEmitted[0][0]
      const selectChangeEvent2: TreeViewEvent = selectChangeEmitted[1][0]
      expect(selectChangeEmitted.length).toBe(2)
      expect(selectChangeEvent1.node).toBe(node1_1_1)
      expect(selectChangeEvent2.node).toBe(node1_1_3)
      // ・select
      const selectEmitted = wrapper.emitted('select')!
      const selectEvent: TreeViewSelectEvent = selectEmitted[0][0]
      expect(selectEmitted.length).toBe(1)
      expect(selectEvent.node).toBe(node1_1_3)
      expect(selectEvent.oldNode).toBe(node1_1_1)
      // ノードの選択状態を検証
      expect(node1_1_1.selected).toBeFalsy()
      expect(getNodeData(nodeDataList, node1_1_1.value)!.selected).toBeFalsy()
      expect(node1_1_3.selected).toBeTruthy()
      expect(getNodeData(nodeDataList, node1_1_3.value)!.selected).toBeTruthy()

      verifyTreeView(treeView)
    })

    it('selectedを変更(現在の選択ノードとは別のノードを選択) - setNodeData()', async () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      const nodeDataList = editNodeDataList(baseNodeDataList)
      treeView.buildTree(nodeDataList)

      const node1_1_1 = treeView.getNode('node1_1_1')!
      expect(node1_1_1.selected).toBeTruthy()
      expect(treeView.selectedNode).toBe(node1_1_1)
      const node1_1_3 = treeView.getNode('node1_1_3')!
      expect(node1_1_3.selected).toBeFalsy()
      await clearEmitted(wrapper)

      node1_1_3.setNodeData({ selected: true })

      // イベント発火を検証
      // ・select-change
      const selectChangeEmitted = wrapper.emitted('select-change')!
      const selectChangeEvent1: TreeViewEvent = selectChangeEmitted[0][0]
      const selectChangeEvent2: TreeViewEvent = selectChangeEmitted[1][0]
      expect(selectChangeEmitted.length).toBe(2)
      expect(selectChangeEvent1.node).toBe(node1_1_1)
      expect(selectChangeEvent2.node).toBe(node1_1_3)
      // ・select
      const selectEmitted = wrapper.emitted('select')!
      const selectEvent: TreeViewSelectEvent = selectEmitted[0][0]
      expect(selectEmitted.length).toBe(1)
      expect(selectEvent.node).toBe(node1_1_3)
      expect(selectEvent.oldNode).toBe(node1_1_1)
      // ノードの選択状態を検証
      expect(node1_1_1.selected).toBeFalsy()
      expect(getNodeData(nodeDataList, node1_1_1.value)!.selected).toBeFalsy()
      expect(node1_1_3.selected).toBeTruthy()
      expect(getNodeData(nodeDataList, node1_1_3.value)!.selected).toBeTruthy()

      verifyTreeView(treeView)
    })

    it('selectedを変更(現在の選択ノードとは別のノードを選択) - サイレントモード', async () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      const nodeDataList = editNodeDataList(baseNodeDataList)
      treeView.buildTree(nodeDataList)

      const node1_1_1 = treeView.getNode('node1_1_1')!
      expect(node1_1_1.selected).toBeTruthy()
      const node1_1_3 = treeView.getNode('node1_1_3')!
      expect(node1_1_3.selected).toBeFalsy()
      await clearEmitted(wrapper)

      node1_1_3.setSelected(true, true)

      // イベント発火を検証
      // ・select-change
      expect(wrapper.emitted('select-change')).toBeUndefined()
      // ・select
      expect(wrapper.emitted('select')).toBeUndefined()
      // ノードの選択状態を検証
      expect(node1_1_1.selected).toBeFalsy()
      expect(getNodeData(nodeDataList, node1_1_1.value)!.selected).toBeFalsy()
      expect(node1_1_3.selected).toBeTruthy()
      expect(getNodeData(nodeDataList, node1_1_3.value)!.selected).toBeTruthy()

      verifyTreeView(treeView)
    })

    it('selectedを変更(選択不可ノードに選択を設定) - プロパティ変更', async () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      const nodeDataList = editNodeDataList(baseNodeDataList, [{ value: 'node1_1_1', unselectable: true, selected: false }])
      treeView.buildTree(nodeDataList)

      const node1_1_1 = treeView.getNode('node1_1_1')!
      expect(node1_1_1.unselectable).toBeTruthy()
      expect(node1_1_1.selected).toBeFalsy()
      await clearEmitted(wrapper)

      node1_1_1.selected = true

      // イベント発火を検証
      // ・select-change
      expect(wrapper.emitted('select-change')).toBeUndefined()
      // ・select
      expect(wrapper.emitted('select')).toBeUndefined()
      // ノードの選択状態を検証
      expect(node1_1_1.selected).toBeFalsy()
      expect(getNodeData(nodeDataList, node1_1_1.value)!.selected).toBeFalsy()

      verifyTreeView(treeView)
    })

    it('selectedを変更(選択不可ノードに選択を設定) - setNodeData()', async () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      const nodeDataList = editNodeDataList(baseNodeDataList, [{ value: 'node1_1_1', unselectable: true, selected: false }])
      treeView.buildTree(nodeDataList)

      const node1_1_1 = treeView.getNode('node1_1_1')!
      expect(node1_1_1.unselectable).toBeTruthy()
      expect(node1_1_1.selected).toBeFalsy()
      await clearEmitted(wrapper)

      node1_1_1.setNodeData({ selected: true })

      // イベント発火を検証
      // ・select-change
      expect(wrapper.emitted('select-change')).toBeUndefined()
      // ・select
      expect(wrapper.emitted('select')).toBeUndefined()
      // ノードの選択状態を検証
      expect(node1_1_1.selected).toBeFalsy()
      expect(getNodeData(nodeDataList, node1_1_1.value)!.selected).toBeFalsy()

      verifyTreeView(treeView)
    })

    it('selectedを変更(選択不可ノードに選択を設定) - プロパティ変更', async () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      const nodeDataList = editNodeDataList(baseNodeDataList, [{ value: 'node1_1_1', unselectable: true, selected: false }])
      treeView.buildTree(nodeDataList)

      const node1_1_1 = treeView.getNode('node1_1_1')!
      expect(node1_1_1.unselectable).toBeTruthy()
      expect(node1_1_1.selected).toBeFalsy()
      await clearEmitted(wrapper)

      node1_1_1.setSelected(true, true)

      // イベント発火を検証
      // ・select-change
      expect(wrapper.emitted('select-change')).toBeUndefined()
      // ・select
      expect(wrapper.emitted('select')).toBeUndefined()
      // ノードの選択状態を検証
      expect(node1_1_1.selected).toBeFalsy()
      expect(getNodeData(nodeDataList, node1_1_1.value)!.selected).toBeFalsy()

      verifyTreeView(treeView)
    })

    it('lazyを変更 - プロパティ変更', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      const nodeDataList = editNodeDataList(baseNodeDataList)
      treeView.buildTree(nodeDataList)

      const node1_1 = treeView.getNode('node1_1')!
      const newLazy = true

      node1_1.lazy = newLazy

      expect(node1_1.lazy).toBe(newLazy)
      expect(getNodeData(nodeDataList, node1_1.value)!.lazy).toBe(newLazy)
      verifyTreeView(treeView)
    })

    it('lazyを変更 - setNodeData()', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      const nodeDataList = editNodeDataList(baseNodeDataList)
      treeView.buildTree(nodeDataList)

      const node1_1 = treeView.getNode('node1_1')!
      const newLazy = true

      node1_1.setNodeData({ lazy: newLazy })

      expect(node1_1.lazy).toBe(newLazy)
      expect(getNodeData(nodeDataList, node1_1.value)!.lazy).toBe(newLazy)
      verifyTreeView(treeView)
    })

    it('lazyLoadStatusを変更 - プロパティ変更', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      const nodeDataList = editNodeDataList(baseNodeDataList)
      treeView.buildTree(nodeDataList)

      const node1_1 = treeView.getNode('node1_1')!
      const newLazyLoadStatus: TreeViewLazyLoadStatus = 'loaded'

      node1_1.lazyLoadStatus = newLazyLoadStatus

      expect(node1_1.lazyLoadStatus).toBe(newLazyLoadStatus)
      expect(getNodeData(nodeDataList, node1_1.value)!.lazyLoadStatus).toBe(newLazyLoadStatus)
      verifyTreeView(treeView)
    })

    it('lazyLoadStatusを変更 - setNodeData()', () => {
      const wrapper = mount<TreeViewImpl>(TreeView.clazz)
      const treeView = wrapper.vm
      const nodeDataList = editNodeDataList(baseNodeDataList)
      treeView.buildTree(nodeDataList)

      const node1_1 = treeView.getNode('node1_1')!
      const newLazyLoadStatus: TreeViewLazyLoadStatus = 'loaded'

      node1_1.setNodeData({ lazyLoadStatus: newLazyLoadStatus })

      expect(node1_1.lazyLoadStatus).toBe(newLazyLoadStatus)
      expect(getNodeData(nodeDataList, node1_1.value)!.lazyLoadStatus).toBe(newLazyLoadStatus)
      verifyTreeView(treeView)
    })
  })
})

describe('カスタムツリー', () => {
  const baseNodeDataList = [
    {
      label: 'Node1',
      value: 'node1',
      children: [
        {
          label: 'Node1_1',
          value: 'node1_1',
          children: [
            {
              label: 'Node1_1_1',
              value: 'node1_1_1',
              checked: true,
            },
          ],
        },
      ],
    },
  ]

  it('独自イベントが発火されるかを検証', () => {
    const wrapper = mount<TreeViewImpl<TreeCheckboxNode>>(TreeView.clazz)
    const treeView = wrapper.vm
    treeView.buildTree(cloneDeep(baseNodeDataList), { nodeClass: TreeCheckboxNode.clazz })

    const node1_1_1 = treeView.getNode('node1_1_1')!
    expect(node1_1_1.checked).toBe(true)

    node1_1_1.checked = false

    // イベント発火を検証
    const checkedChangeEmitted = wrapper.emitted('checked-change')!
    const checkedChangeEvent: TreeViewEvent = checkedChangeEmitted[0][0]
    expect(checkedChangeEmitted.length).toBe(1)
    expect(checkedChangeEvent.node).toBe(node1_1_1)
    // ノードのチェック状態を検証
    expect(node1_1_1.checked).toBeFalsy()
  })
})
