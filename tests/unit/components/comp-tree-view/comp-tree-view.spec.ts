import * as treeViewUtils from '@/components/comp-tree-view/comp-tree-view-utils'
import CompCheckboxNodeItem from '@/components/comp-tree-view/comp-checkbox-node-item.vue'
import CompTreeNode from '@/components/comp-tree-view/comp-tree-node.vue'
import CompTreeView from '@/components/comp-tree-view/index.vue'
import { mount } from '@vue/test-utils'

function verifyTreeView(treeView: CompTreeView | any) {
  for (let i = 0; i < treeView.nodes.length; i++) {
    const node = treeView.nodes[i]
    // ノードにツリービューが設定されていることを検証
    expect(node.treeView).toBe(treeView)
    // ノードの親が空であることを検証
    expect(node.parent).toBeUndefined()
    // ツリービューのコンテナにノードが存在することを検証
    const containerChildren = Array.from(treeView.m_container.children)
    expect(containerChildren[i]).toBe(node.$el)
    // ノードの親子(子孫)関係の検証
    verifyParentChildRelation(node)
  }
  // 最年長ノードフラグの検証
  verifyIsEldest(treeView)
}

function verifyParentChildRelation(node: CompTreeNode | any) {
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i] as CompTreeNode | any
    // ノードの親子関係を検証
    expect(child.parent).toBe(node)
    // ノードのコンテナに子ノードが存在することを検証
    const containerChildren = Array.from(node.m_childContainer.children)
    expect(containerChildren[i]).toBe(child.$el)
    // 孫ノードの検証
    verifyParentChildRelation(child)
  }
}

function verifyIsEldest(treeView: CompTreeView | any) {
  treeView.nodes.forEach((node, index) => {
    const isEldest = index === 0
    expect(node.isEldest).toBe(isEldest)
  })
}

describe('標準ツリー', () => {
  const nodeDataList = [
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

  describe('CompTreeView.buildTree()', () => {
    it('ベーシックケース', () => {
      const wrapper = mount(CompTreeView)
      const treeView = wrapper.vm as CompTreeView | any
      treeView.buildTree(nodeDataList)

      const node1 = treeView.nodes[0]
      expect(node1.value).toBe('node1')
      expect(node1.label).toBe('Node1')
      expect(node1.isEldest).toBeTruthy()
      expect(node1.opened).toBe(true)

      const node1_1 = node1.children[0]
      expect(node1_1.value).toBe('node1_1')
      expect(node1_1.label).toBe('Node1_1')

      const node1_1_1 = node1_1.children[0]
      expect(node1_1_1.value).toBe('node1_1_1')
      expect(node1_1_1.label).toBe('Node1_1_1')
      expect(node1_1_1.icon).toBe('inbox')

      const node1_1_2 = node1_1.children[1]
      expect(node1_1_2.value).toBe('node1_1_2')
      expect(node1_1_2.label).toBe('Node1_1_2')
      expect(node1_1_2.unselectable).toBe(true)

      const node1_1_3 = node1_1.children[2]
      expect(node1_1_3.value).toBe('node1_1_3')
      expect(node1_1_3.label).toBe('Node1_1_3')

      const node2 = treeView.nodes[1]
      expect(node2.value).toBe('node2')
      expect(node2.label).toBe('Node2')
      expect(node2.isEldest).not.toBeTruthy()

      expect(treeView.$el).toMatchSnapshot()
    })

    it('先頭に挿入', () => {
      const wrapper = mount(CompTreeView)
      const treeView = wrapper.vm as CompTreeView | any
      treeView.buildTree(nodeDataList)

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
        0
      )

      const node3 = treeView.getNode('node3')
      const node4 = treeView.getNode('node4')

      expect(treeView.nodes[0]).toBe(node3)
      expect(treeView.nodes[1]).toBe(node4)
      verifyTreeView(treeView)
    })

    it('中間に挿入', () => {
      const wrapper = mount(CompTreeView)
      const treeView = wrapper.vm as CompTreeView | any
      treeView.buildTree(nodeDataList)

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
        1
      )

      const node3 = treeView.getNode('node3')
      const node4 = treeView.getNode('node4')

      expect(treeView.nodes[1]).toBe(node3)
      expect(treeView.nodes[2]).toBe(node4)
      verifyTreeView(treeView)
    })

    it('最後尾に挿入', () => {
      const wrapper = mount(CompTreeView)
      const treeView = wrapper.vm as CompTreeView | any
      treeView.buildTree(nodeDataList)

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
        treeView.nodes.length
      )

      const node3 = treeView.getNode('node3')
      const node4 = treeView.getNode('node4')

      expect(treeView.nodes[treeView.nodes.length - 2]).toBe(node3)
      expect(treeView.nodes[treeView.nodes.length - 1]).toBe(node4)
      verifyTreeView(treeView)
    })
  })

  describe('CompTreeView.addNode()', () => {
    it('挿入位置の指定なし', () => {
      const wrapper = mount(CompTreeView)
      const treeView = wrapper.vm as CompTreeView | any
      treeView.buildTree(nodeDataList)

      const node3 = treeView.addNode({
        label: 'Node3',
        value: 'node3',
      })

      expect(treeView.getNode('node3')).toBe(node3)
      expect(treeView.nodes[treeView.nodes.length - 1]).toBe(node3)
      verifyTreeView(treeView)
    })

    it('先頭に挿入', () => {
      const wrapper = mount(CompTreeView)
      const treeView = wrapper.vm as CompTreeView | any
      treeView.buildTree(nodeDataList)

      const node3 = treeView.addNode(
        {
          label: 'Node3',
          value: 'node3',
        },
        0
      )

      expect(treeView.getNode('node3')).toBe(node3)
      expect(treeView.nodes[0]).toBe(node3)
      verifyTreeView(treeView)
    })

    it('中間に挿入', () => {
      const wrapper = mount(CompTreeView)
      const treeView = wrapper.vm as CompTreeView | any
      treeView.buildTree(nodeDataList)

      const node3 = treeView.addNode(
        {
          label: 'Node3',
          value: 'node3',
        },
        1
      )

      expect(treeView.getNode('node3')).toBe(node3)
      expect(treeView.nodes[1]).toBe(node3)
      verifyTreeView(treeView)
    })

    it('最後尾に挿入', () => {
      const wrapper = mount(CompTreeView)
      const treeView = wrapper.vm as CompTreeView | any
      treeView.buildTree(nodeDataList)

      const node3 = treeView.addNode(
        {
          label: 'Node3',
          value: 'node3',
        },
        treeView.nodes.length
      )

      expect(treeView.getNode('node3')).toBe(node3)
      expect(treeView.nodes[treeView.nodes.length - 1]).toBe(node3)
      verifyTreeView(treeView)
    })

    it('既に存在するノードを指定して追加', () => {
      const wrapper = mount(CompTreeView)
      const treeView = wrapper.vm as CompTreeView | any
      treeView.buildTree(nodeDataList)

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
      expect(actual.message).toBe('The node "node2" already exists.')
      verifyTreeView(treeView)
    })

    it('親ノードを指定', () => {
      const wrapper = mount(CompTreeView)
      const treeView = wrapper.vm as CompTreeView | any
      treeView.buildTree(nodeDataList)

      const node1_1 = treeView.getNode('node1_1')
      const node1_1_x = treeView.addNode(
        {
          label: 'Node2_1',
          value: 'node2_1',
        },
        node1_1.value
      )

      expect(node1_1_x.parent).toBe(node1_1)
      expect(node1_1.children[node1_1.children.length - 1]).toBe(node1_1_x)
      verifyTreeView(treeView)
    })

    it('親ノードと挿入位置を指定', () => {
      const wrapper = mount(CompTreeView)
      const treeView = wrapper.vm as CompTreeView | any
      treeView.buildTree(nodeDataList)

      const node1_1 = treeView.getNode('node1_1')
      const node1_1_x = treeView.addNode(
        {
          label: 'Node2_1',
          value: 'node2_1',
        },
        node1_1.value,
        1
      )

      expect(node1_1_x.parent).toBe(node1_1)
      expect(node1_1.children[1]).toBe(node1_1_x)
      verifyTreeView(treeView)
    })

    it('存在しない親ノードを指定', () => {
      const wrapper = mount(CompTreeView)
      const treeView = wrapper.vm as CompTreeView | any
      treeView.buildTree(nodeDataList)

      let actual!: Error
      try {
        treeView.addNode(
          {
            label: 'Node2_1',
            value: 'node2_1',
          },
          'nodeXXX'
        )
      } catch (err) {
        actual = err
      }

      expect(actual).toBeInstanceOf(Error)
      expect(actual.message).toBe('The parent node "nodeXXX" does not exist.')
      verifyTreeView(treeView)
    })

    it('ノードを入れ替え', () => {
      const wrapper = mount(CompTreeView)
      const treeView = wrapper.vm as CompTreeView | any
      treeView.buildTree(nodeDataList)

      const node1 = treeView.getNode('node1')
      const node2 = treeView.getNode('node2')

      treeView.addNode(node1)

      expect(treeView.nodes.length).toBe(2)
      expect(treeView.nodes[0]).toBe(node2)
      expect(treeView.nodes[1]).toBe(node1)
      verifyTreeView(treeView)
    })

    it('下位レベルのノードをトップレベルへ移動', () => {
      const wrapper = mount(CompTreeView)
      const treeView = wrapper.vm as CompTreeView | any
      treeView.buildTree(nodeDataList)

      const treeViewNodesLength = treeView.nodes.length
      const node1_1 = treeView.getNode('node1_1')
      const node1 = node1_1.parent

      treeView.addNode(node1_1)

      expect(treeView.nodes.length).toBe(treeViewNodesLength + 1)
      expect(treeView.nodes[2]).toBe(node1_1)
      expect(node1_1.parent).toBeUndefined()
      expect(node1.children.includes(node1_1)).not.toBeTruthy()
      verifyTreeView(treeView)
    })
  })

  describe('CompTreeNode.addChild()', () => {
    it('挿入位置の指定なし', () => {
      const wrapper = mount(CompTreeView)
      const treeView = wrapper.vm as CompTreeView | any
      treeView.buildTree(nodeDataList)

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
      const wrapper = mount(CompTreeView)
      const treeView = wrapper.vm as CompTreeView | any
      treeView.buildTree(nodeDataList)

      const node1_1 = treeView.getNode('node1_1')!

      const node1_1_4 = node1_1.addChild(
        {
          label: 'Node1_1_4',
          value: 'node1_1_4',
        },
        0
      )

      expect(treeView.getNode('node1_1_4')).toBe(node1_1_4)
      expect(node1_1.children[0]).toBe(node1_1_4)
      verifyTreeView(treeView)
    })

    it('中間に挿入', () => {
      const wrapper = mount(CompTreeView)
      const treeView = wrapper.vm as CompTreeView | any
      treeView.buildTree(nodeDataList)

      const node1_1 = treeView.getNode('node1_1')!

      const node1_1_4 = node1_1.addChild(
        {
          label: 'Node1_1_4',
          value: 'node1_1_4',
        },
        1
      )

      expect(treeView.getNode('node1_1_4')).toBe(node1_1_4)
      expect(node1_1.children[1]).toBe(node1_1_4)
      verifyTreeView(treeView)
    })

    it('最後尾に挿入', () => {
      const wrapper = mount(CompTreeView)
      const treeView = wrapper.vm as CompTreeView | any
      treeView.buildTree(nodeDataList)

      const node1_1 = treeView.getNode('node1_1')!

      const node1_1_4 = node1_1.addChild(
        {
          label: 'Node1_1_4',
          value: 'node1_1_4',
        },
        node1_1.children.length
      )

      expect(treeView.getNode('node1_1_4')).toBe(node1_1_4)
      expect(node1_1.children[node1_1.children.length - 1]).toBe(node1_1_4)
      verifyTreeView(treeView)
    })

    it('ノードを入れ替え', () => {
      const wrapper = mount(CompTreeView)
      const treeView = wrapper.vm as CompTreeView | any
      treeView.buildTree(nodeDataList)

      const node1_1 = treeView.getNode('node1_1')
      const node1_1_1 = treeView.getNode('node1_1_1')
      const node1_1_2 = treeView.getNode('node1_1_2')

      node1_1.addChild(node1_1_1)

      expect(node1_1.children.length).toBe(3)
      expect(node1_1.children[0]).toBe(node1_1_2)
      expect(node1_1.children[node1_1.children.length - 1]).toBe(node1_1_1)
      verifyTreeView(treeView)
    })

    it('トップレベルのノードを下位レベルへ移動', () => {
      const wrapper = mount(CompTreeView)
      const treeView = wrapper.vm as CompTreeView | any
      treeView.buildTree(nodeDataList)

      const treeViewNodesLength = treeView.nodes.length
      const node1 = treeView.getNode('node1')
      const node2 = treeView.getNode('node2')
      const node2ChildrenLength = node2.children.length

      node2.addChild(node1)

      expect(treeView.nodes.length).toBe(treeViewNodesLength - 1)
      expect(treeView.nodes[0]).toBe(node2)
      expect(node2.children.length).toBe(node2ChildrenLength + 1)
      expect(node2.children[0]).toBe(node1)
      expect(node1.parent).toBe(node2)
      verifyTreeView(treeView)
    })

    it('既に存在するノードを指定して追加', () => {
      const wrapper = mount(CompTreeView)
      const treeView = wrapper.vm as CompTreeView | any
      treeView.buildTree(nodeDataList)

      const node1 = treeView.getNode('node1')

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
      expect(actual.message).toBe('The node "node1_1" already exists.')
      verifyTreeView(treeView)
    })

    it('追加しようとするノードの子に自ノード(新しく親となるノード)が含まれている場合', () => {
      const wrapper = mount(CompTreeView)
      const treeView = wrapper.vm as CompTreeView | any
      treeView.buildTree(nodeDataList)

      const node1 = treeView.getNode('node1')
      const node1_1 = treeView.getNode('node1_1')

      let actual!: Error
      try {
        node1_1.addChild(node1)
      } catch (err) {
        actual = err
      }

      expect(actual).toBeInstanceOf(Error)
      expect(actual.message).toBe(`The specified node "${node1.value}" contains the new parent "${node1_1.value}".`)
      verifyTreeView(treeView)
    })
  })

  describe('CompTreeView.removeNode()', () => {
    it('レベル1のノード(子孫ノード有り)を削除', () => {
      const wrapper = mount(CompTreeView)
      const treeView = wrapper.vm as CompTreeView | any
      treeView.buildTree(nodeDataList)

      const node1 = treeView.getNode('node1')!
      const node1Descendants = treeViewUtils.getDescendants(node1)
      const treeViewNodesLength = treeView.nodes.length

      const actual = treeView.removeNode(node1.value)

      expect(actual).toBe(node1)
      expect(treeView.getNode(node1.value)).toBeUndefined()
      expect(treeView.nodes.length).toBe(treeViewNodesLength - 1)
      expect(Array.from(treeView.m_container.children).includes(node1.$el)).not.toBeTruthy()

      for (const descendant of node1Descendants) {
        expect(treeView.getNode((descendant as any).value)).toBeUndefined()
      }

      verifyTreeView(treeView)
    })

    it('レベル2のノード(子ノード有り)を削除', () => {
      const wrapper = mount(CompTreeView)
      const treeView = wrapper.vm as CompTreeView | any
      treeView.buildTree(nodeDataList)

      const node1_1 = treeView.getNode('node1_1')!
      const node1_1Descendants = treeViewUtils.getDescendants(node1_1)
      const node1 = node1_1.parent
      const node1ChildrenLength = node1.children.length

      const actual = treeView.removeNode(node1_1.value)

      expect(actual).toBe(node1_1)
      expect(treeView.getNode(node1_1.value)).toBeUndefined()
      expect(node1.children.length).toBe(node1ChildrenLength - 1)
      expect(node1.children.includes(node1_1)).not.toBeTruthy()
      expect(Array.from(node1.m_childContainer.children).includes(node1_1.$el)).not.toBeTruthy()

      for (const descendant of node1_1Descendants) {
        expect(treeView.getNode((descendant as any).value)).toBeUndefined()
      }

      verifyTreeView(treeView)
    })

    it('存在しないノードを指定', () => {
      const wrapper = mount(CompTreeView)
      const treeView = wrapper.vm as CompTreeView | any
      treeView.buildTree(nodeDataList)

      const node1 = treeView.removeNode('nodeXXX')

      expect(node1).toBeUndefined()
      verifyTreeView(treeView)
    })

    it('削除したノードを追加', () => {
      const wrapper = mount(CompTreeView)
      const treeView = wrapper.vm as CompTreeView | any
      treeView.buildTree(nodeDataList)

      const node1 = treeView.getNode('node1')!
      const descendants = treeViewUtils.getDescendants(node1)
      const treeViewNodesLength = treeView.nodes.length

      const actual = treeView.removeNode(node1.value)
      treeView.addNode(actual, 0)

      expect(actual).toBe(node1)
      expect(treeView.getNode(node1.value)).toBe(node1)
      expect(treeView.nodes.length).toBe(treeViewNodesLength)
      expect(treeView.nodes[0]).toBe(node1)

      for (const descendant of descendants) {
        expect(treeView.getNode((descendant as any).value)).toBeTruthy()
      }

      verifyTreeView(treeView)
    })
  })

  describe('CompTreeNode.removeChild()', () => {
    it('ベーシックケース', () => {
      const wrapper = mount(CompTreeView)
      const treeView = wrapper.vm as CompTreeView | any
      treeView.buildTree(nodeDataList)

      const node1_1 = treeView.getNode('node1_1')!
      const node1_1Descendants = treeViewUtils.getDescendants(node1_1)
      const node1 = node1_1.parent
      const node1ChildrenLength = node1.children.length

      node1.removeChild(node1_1)

      expect(treeView.getNode(node1_1.value)).toBeUndefined()
      expect(node1.children.length).toBe(node1ChildrenLength - 1)
      expect(node1.children.includes(node1_1)).not.toBeTruthy()
      expect(Array.from(node1.m_childContainer.children).includes(node1_1.$el)).not.toBeTruthy()

      for (const descendant of node1_1Descendants) {
        expect(treeView.getNode((descendant as any).value)).toBeUndefined()
      }

      verifyTreeView(treeView)
    })

    it('存在しないノードを指定', () => {
      const wrapper = mount(CompTreeView)
      const treeView = wrapper.vm as CompTreeView | any
      treeView.buildTree(nodeDataList)

      const node1_1 = treeView.getNode('node1_1')
      const node1 = node1_1.parent

      // node1_1を削除
      treeView.removeNode(node1_1.value)
      expect(node1.children.includes(node1_1)).not.toBeTruthy()
      expect(Array.from(node1.m_childContainer.children).includes(node1_1.$el)).not.toBeTruthy()

      // 存在しないノード(削除したnode1_1)をさらに削除
      // (何も起こらない)
      node1.removeChild(node1_1)

      verifyTreeView(treeView)
    })

    it('削除したノードを追加', () => {
      const wrapper = mount(CompTreeView)
      const treeView = wrapper.vm as CompTreeView | any
      treeView.buildTree(nodeDataList)

      const node1_1 = treeView.getNode('node1_1')!
      const node1_1Descendants = treeViewUtils.getDescendants(node1_1)
      const node1 = node1_1.parent
      const node1ChildrenLength = node1.children.length

      node1.removeChild(node1_1)
      const actual = node1.addChild(node1_1, 0)

      expect(actual).toBe(node1_1)
      expect(treeView.getNode(node1_1.value)).toBe(node1_1)
      expect(node1.children.length).toBe(node1ChildrenLength)
      expect(node1.children[0]).toBe(node1_1)

      for (const descendant of node1_1Descendants) {
        expect(treeView.getNode((descendant as any).value)).toBeTruthy()
      }

      verifyTreeView(treeView)
    })
  })

  it('CompTreeNode.valueを変更', () => {
    const wrapper = mount(CompTreeView)
    const treeView = wrapper.vm as CompTreeView | any
    treeView.buildTree(nodeDataList)

    const node1_1_1 = treeView.getNode('node1_1_1')
    const oldValue = node1_1_1.value
    const newValue = `${node1_1_1.value}_changed`
    node1_1_1.value = newValue

    // ノードの値を検証
    expect(node1_1_1.value).toBe(newValue)
    expect(node1_1_1.item.value).toBe(newValue)
    // ツリービューの検証
    expect(treeView.getNode(oldValue)).toBeUndefined()
    expect(treeView.getNode(newValue)).toBe(node1_1_1)
  })

  it('CompTreeNodeItem.valueを変更', () => {
    const wrapper = mount(CompTreeView)
    const treeView = wrapper.vm as CompTreeView | any
    treeView.buildTree(nodeDataList)

    const node1_1_1 = treeView.getNode('node1_1_1')
    const oldValue = node1_1_1.value
    const newValue = `${node1_1_1.value}_changed`
    node1_1_1.item.value = newValue

    // ノードの値を検証
    expect(node1_1_1.value).toBe(newValue)
    expect(node1_1_1.item.value).toBe(newValue)
    // ツリービューの検証
    expect(treeView.getNode(oldValue)).toBeUndefined()
    expect(treeView.getNode(newValue)).toBe(node1_1_1)
  })

  it('CompTreeNodeの子ノード開閉', () => {
    const wrapper = mount(CompTreeView)
    const treeView = wrapper.vm as CompTreeView | any
    treeView.buildTree(nodeDataList)

    const node1_1 = treeView.getNode('node1_1')!
    expect(node1_1.opened).toBe(true)

    node1_1.open()
    node1_1.close()
    node1_1.toggle()

    // イベント発火を検証
    expect(wrapper.emitted('opened-changed').length).toBe(3) // イベント3回発火される想定
    expect(wrapper.emitted('opened-changed')[2][0]).toBe(node1_1)
    // ノードの開閉状態を検証
    expect(node1_1.opened).toBeTruthy()
  })

  it('CompTreeNode.selectedを変更', () => {
    const wrapper = mount(CompTreeView)
    const treeView = wrapper.vm as CompTreeView | any
    treeView.buildTree(nodeDataList)

    const node1_1_1 = treeView.getNode('node1_1_1')
    node1_1_1.selected = true

    // イベント発火を検証
    expect(wrapper.emitted('selected').length).toBe(1)
    expect(wrapper.emitted('selected')[0][0]).toBe(node1_1_1)
    // ノードの選択状態を検証
    expect(node1_1_1.selected).toBeTruthy()
    expect(node1_1_1.item.selected).toBeTruthy()
  })

  it('CompTreeNodeItem.selectedを変更', () => {
    const wrapper = mount(CompTreeView)
    const treeView = wrapper.vm as CompTreeView | any
    treeView.buildTree(nodeDataList)

    const node1_1_1 = treeView.getNode('node1_1_1')
    node1_1_1.item.selected = true

    // イベント発火を検証
    expect(wrapper.emitted('selected').length).toBe(1)
    expect(wrapper.emitted('selected')[0][0]).toBe(node1_1_1)
    // ノードの選択状態を検証
    expect(node1_1_1.selected).toBeTruthy()
    expect(node1_1_1.item.selected).toBeTruthy()
  })
})

describe('カスタムツリー', () => {
  const nodeDataList = [
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
              itemClass: CompCheckboxNodeItem,
            },
          ],
        },
      ],
    },
  ]

  it('独自イベントが発火されるかを検証', () => {
    const wrapper = mount(CompTreeView)
    const treeView = wrapper.vm as CompTreeView | any
    treeView.buildTree(nodeDataList)

    const node1_1_1 = treeView.getNode('node1_1_1')!
    expect(node1_1_1.item.checked).toBe(true)

    node1_1_1.item.checked = false

    // イベント発火を検証
    expect(wrapper.emitted('checked-changed').length).toBe(1)
    expect(wrapper.emitted('checked-changed')[0][0]).toBe(node1_1_1)
    // ノードのチェック状態を検証
    expect(node1_1_1.item.checked).not.toBeTruthy()
  })
})
