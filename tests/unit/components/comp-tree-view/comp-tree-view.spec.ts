import CompCheckboxNodeItem from '@/components/comp-tree-view/comp-checkbox-node-item.vue'
import CompTreeView from '@/components/comp-tree-view/index.vue'
import { mount } from '@vue/test-utils'

describe('標準ツリー', () => {
  const nodeDataList = [
    {
      label: 'Node 1',
      value: 'node-1',
      opened: true,
      children: [
        {
          label: 'Node 1-1',
          value: 'node-1-1',
          opened: true,
          children: [
            {
              label: 'Node 1-1-1',
              value: 'node-1-1-1',
              icon: 'inbox',
            },
            {
              label: 'Node 1-1-2',
              value: 'node-1-1-2',
              unselectable: true,
            },
          ],
        },
      ],
    },
    {
      label: 'Node 2',
      value: 'node-2',
    },
  ]

  describe('CompTreeView.buildChildren()', () => {
    it('ベーシックケース', () => {
      const wrapper = mount(CompTreeView)
      const treeView = wrapper.vm as CompTreeView | any
      treeView.buildChildren(nodeDataList)

      const node1 = treeView.nodes[0]
      expect(node1.value).toBe('node-1')
      expect(node1.label).toBe('Node 1')
      expect(node1.isEldest).toBeTruthy()
      expect(node1.opened).toBe(true)

      const node1_1 = node1.children[0]
      expect(node1_1.value).toBe('node-1-1')
      expect(node1_1.label).toBe('Node 1-1')

      const node1_1_1 = node1_1.children[0]
      expect(node1_1_1.value).toBe('node-1-1-1')
      expect(node1_1_1.label).toBe('Node 1-1-1')
      expect(node1_1_1.icon).toBe('inbox')

      const node1_1_2 = node1_1.children[1]
      expect(node1_1_2.value).toBe('node-1-1-2')
      expect(node1_1_2.label).toBe('Node 1-1-2')
      expect(node1_1_2.unselectable).toBe(true)

      const node2 = treeView.nodes[1]
      expect(node2.value).toBe('node-2')
      expect(node2.label).toBe('Node 2')
      expect(node2.isEldest).not.toBeTruthy()

      expect(treeView.$el).toMatchSnapshot()
    })

    it('先頭に挿入', () => {
      const wrapper = mount(CompTreeView)
      const treeView = wrapper.vm as CompTreeView | any
      treeView.buildChildren(nodeDataList)

      treeView.buildChildren(
        [
          {
            label: 'Node 3',
            value: 'node-3',
          },
          {
            label: 'Node 4',
            value: 'node-4',
          },
        ],
        0
      )

      const node3 = treeView.getNodeByValue('node-3')
      const node4 = treeView.getNodeByValue('node-4')

      expect(treeView.nodes[0]).toBe(node3)
      expect(treeView.nodes[1]).toBe(node4)
    })

    it('中間に挿入', () => {
      const wrapper = mount(CompTreeView)
      const treeView = wrapper.vm as CompTreeView | any
      treeView.buildChildren(nodeDataList)

      treeView.buildChildren(
        [
          {
            label: 'Node 3',
            value: 'node-3',
          },
          {
            label: 'Node 4',
            value: 'node-4',
          },
        ],
        1
      )

      const node3 = treeView.getNodeByValue('node-3')
      const node4 = treeView.getNodeByValue('node-4')

      expect(treeView.nodes[1]).toBe(node3)
      expect(treeView.nodes[2]).toBe(node4)
    })

    it('最後尾に挿入', () => {
      const wrapper = mount(CompTreeView)
      const treeView = wrapper.vm as CompTreeView | any
      treeView.buildChildren(nodeDataList)

      treeView.buildChildren(
        [
          {
            label: 'Node 3',
            value: 'node-3',
          },
          {
            label: 'Node 4',
            value: 'node-4',
          },
        ],
        2
      )

      const node3 = treeView.getNodeByValue('node-3')
      const node4 = treeView.getNodeByValue('node-4')

      expect(treeView.nodes[2]).toBe(node3)
      expect(treeView.nodes[3]).toBe(node4)
    })
  })

  describe('CompTreeView.buildChild()', () => {
    it('挿入位置の指定なし', () => {
      const wrapper = mount(CompTreeView)
      const treeView = wrapper.vm as CompTreeView | any
      treeView.buildChildren(nodeDataList)

      const node3 = treeView.buildChild({
        label: 'Node 3',
        value: 'node-3',
      })

      expect(treeView.getNodeByValue('node-3')).toBe(node3)
      expect(treeView.nodes[2]).toBe(node3)
      treeView.nodes.forEach((node, index) => {
        const isEldest = index === 0
        expect(node.isEldest).toBe(isEldest)
      })
    })

    it('先頭に挿入', () => {
      const wrapper = mount(CompTreeView)
      const treeView = wrapper.vm as CompTreeView | any
      treeView.buildChildren(nodeDataList)

      const node3 = treeView.buildChild(
        {
          label: 'Node 3',
          value: 'node-3',
        },
        0
      )

      expect(treeView.getNodeByValue('node-3')).toBe(node3)
      expect(treeView.nodes[0]).toBe(node3)
      treeView.nodes.forEach((node, index) => {
        const isEldest = index === 0
        expect(node.isEldest).toBe(isEldest)
      })
    })

    it('中間に挿入', () => {
      const wrapper = mount(CompTreeView)
      const treeView = wrapper.vm as CompTreeView | any
      treeView.buildChildren(nodeDataList)

      const node3 = treeView.buildChild(
        {
          label: 'Node 3',
          value: 'node-3',
        },
        1
      )

      expect(treeView.getNodeByValue('node-3')).toBe(node3)
      expect(treeView.nodes[1]).toBe(node3)
      treeView.nodes.forEach((node, index) => {
        const isEldest = index === 0
        expect(node.isEldest).toBe(isEldest)
      })
    })

    it('最後尾に挿入', () => {
      const wrapper = mount(CompTreeView)
      const treeView = wrapper.vm as CompTreeView | any
      treeView.buildChildren(nodeDataList)

      const node3 = treeView.buildChild(
        {
          label: 'Node 3',
          value: 'node-3',
        },
        2
      )

      expect(treeView.getNodeByValue('node-3')).toBe(node3)
      expect(treeView.nodes[2]).toBe(node3)
      treeView.nodes.forEach((node, index) => {
        const isEldest = index === 0
        expect(node.isEldest).toBe(isEldest)
      })
    })
  })

  describe('CompTreeNode.buildChild()', () => {
    it('挿入位置の指定なし', () => {
      const wrapper = mount(CompTreeView)
      const treeView = wrapper.vm as CompTreeView | any
      treeView.buildChildren(nodeDataList)

      const node1_1 = treeView.getNodeByValue('node-1-1')!

      const node1_1_3 = node1_1.buildChild({
        label: 'Node 1-1-3',
        value: 'node-1-1-3',
      })

      expect(treeView.getNodeByValue('node-1-1-3')).toBe(node1_1_3)
      expect(node1_1.children[2]).toBe(node1_1_3)
    })

    it('先頭に挿入', () => {
      const wrapper = mount(CompTreeView)
      const treeView = wrapper.vm as CompTreeView | any
      treeView.buildChildren(nodeDataList)

      const node1_1 = treeView.getNodeByValue('node-1-1')!

      const node1_1_3 = node1_1.buildChild(
        {
          label: 'Node 1-1-3',
          value: 'node-1-1-3',
        },
        0
      )

      expect(treeView.getNodeByValue('node-1-1-3')).toBe(node1_1_3)
      expect(node1_1.children[0]).toBe(node1_1_3)
    })

    it('中間に挿入', () => {
      const wrapper = mount(CompTreeView)
      const treeView = wrapper.vm as CompTreeView | any
      treeView.buildChildren(nodeDataList)

      const node1_1 = treeView.getNodeByValue('node-1-1')!

      const node1_1_3 = node1_1.buildChild(
        {
          label: 'Node 1-1-3',
          value: 'node-1-1-3',
        },
        1
      )

      expect(treeView.getNodeByValue('node-1-1-3')).toBe(node1_1_3)
      expect(node1_1.children[1]).toBe(node1_1_3)
    })

    it('最後尾に挿入', () => {
      const wrapper = mount(CompTreeView)
      const treeView = wrapper.vm as CompTreeView | any
      treeView.buildChildren(nodeDataList)

      const node1_1 = treeView.getNodeByValue('node-1-1')!

      const node1_1_3 = node1_1.buildChild(
        {
          label: 'Node 1-1-3',
          value: 'node-1-1-3',
        },
        2
      )

      expect(treeView.getNodeByValue('node-1-1-3')).toBe(node1_1_3)
      expect(node1_1.children[2]).toBe(node1_1_3)
    })
  })

  it('CompTreeNodeの子ノード開閉', () => {
    const wrapper = mount(CompTreeView)
    const treeView = wrapper.vm as CompTreeView | any
    treeView.buildChildren(nodeDataList)

    const node1_1 = treeView.getNodeByValue('node-1-1')!
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
    treeView.buildChildren(nodeDataList)

    const node1_1_1 = treeView.getNodeByValue('node-1-1-1')
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
    treeView.buildChildren(nodeDataList)

    const node1_1_1 = treeView.getNodeByValue('node-1-1-1')
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
      label: 'Node 1',
      value: 'node-1',
      children: [
        {
          label: 'Node 1-1',
          value: 'node-1-1',
          children: [
            {
              label: 'Node 1-1-1',
              value: 'node-1-1-1',
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
    treeView.buildChildren(nodeDataList)

    const node1_1_1 = treeView.getNodeByValue('node-1-1-1')!
    expect(node1_1_1.item.checked).toBe(true)

    node1_1_1.item.checked = false

    // イベント発火を検証
    expect(wrapper.emitted('checked-changed').length).toBe(1)
    expect(wrapper.emitted('checked-changed')[0][0]).toBe(node1_1_1)
    // ノードのチェック状態を検証
    expect(node1_1_1.item.checked).not.toBeTruthy()
  })
})
