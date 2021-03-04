<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.AppMainArticleTreeView
  --tree-view-color: #{$text-primary-bold-color}
  --tree-font-weight: #{$text-weight-bold}
  --tree-padding: 10px 10px 20px 10px
</style>

<template>
  <tree-view ref="treeView" class="AppMainArticleTreeView" word-wrap @select="onSelect($event)" />
</template>

<script lang="ts">
import { AppMainArticleTreeNode, AppMainArticleTreeNodeData } from '@/app/views/main/app-main-article-tree-node.vue'
import { ArticleTableOfContentsNode, useService } from '@/app/services'
import { SetupContext, defineComponent, onMounted, onUnmounted, ref } from '@vue/composition-api'
import { TreeNodeData, TreeView, TreeViewSelectEvent } from '@/app/components/tree-view'
import { useRouteParams, useRoutes } from '@/app/router'
import { pickProps } from 'web-base-lib'

interface AppMainArticleTreeView extends AppMainArticleTreeView.Props {
  load(userName: string): Promise<void>
}

interface TableObContentsNodeData extends TreeNodeData, ArticleTableOfContentsNode {}

namespace AppMainArticleTreeView {
  export interface Props {}

  export const clazz = defineComponent({
    name: 'AppMainArticleTreeView',

    components: {
      TreeView: TreeView.clazz,
    },

    setup: (props: Props, ctx) => setup(props, ctx),
  })

  export function setup(props: Props, ctx: SetupContext) {
    //----------------------------------------------------------------------
    //
    //  Lifecycle hooks
    //
    //----------------------------------------------------------------------

    onMounted(() => {
      treeView.value!.setNodeClass(AppMainArticleTreeNode.clazz)
    })

    onUnmounted(() => {
      offTableOfContentsUpdate()
    })

    //----------------------------------------------------------------------
    //
    //  Variables
    //
    //----------------------------------------------------------------------

    const services = useService()
    const routes = useRoutes()
    const routeParams = useRouteParams()

    const treeView = ref<TreeView<AppMainArticleTreeNode, AppMainArticleTreeNodeData>>()

    //----------------------------------------------------------------------
    //
    //  Methods
    //
    //----------------------------------------------------------------------

    const load: AppMainArticleTreeView['load'] = async userName => {
      const tocNodes = await services.article.fetchTableOfContents(userName)
      console.log(tocNodes)

      let existingNodeDataMap: { [path: string]: { opened?: boolean; selected?: boolean } } = {}
      for (const tocNode of tocNodes) {
        const treeNode = treeView.value!.getNode(tocNode.path)
        if (treeNode) {
          existingNodeDataMap[tocNode.path] = pickProps(treeNode, ['opened', 'selected'])
        } else {
          existingNodeDataMap[tocNode.path] = {}
        }
      }

      treeView.value!.removeAllNodes()
      for (const tocNode of tocNodes) {
        const existingNodeData = existingNodeDataMap[tocNode.path]
        const nodeData = { ...tocNode, ...existingNodeData, value: tocNode.path }
        treeView.value!.addNode(nodeData, { parent: tocNode.dir || undefined })
      }
    }

    //----------------------------------------------------------------------
    //
    //  Event listeners
    //
    //----------------------------------------------------------------------

    const offTableOfContentsUpdate = services.article.watchTableOfContentsUpdate(async () => {
      await load(routeParams.userName)
    })

    async function onSelect(e: TreeViewSelectEvent<AppMainArticleTreeNode>) {
      const { node: selectedNode, oldNode: oldSelectedNode } = e

      if (selectedNode.type === 'ListBundle' || selectedNode.type === 'Article') {
        await routes.articles.move(selectedNode.id)
      } else {
        if (oldSelectedNode) {
          treeView.value!.setSelectedNode(oldSelectedNode.path, true, true)
        } else {
          treeView.value!.setSelectedNode(selectedNode.path, false, true)
        }
        selectedNode.toggle(true)
      }
    }

    //----------------------------------------------------------------------
    //
    //  Result
    //
    //----------------------------------------------------------------------

    return {
      treeView,
      load,
      onSelect,
    }
  }
}

export default AppMainArticleTreeView.clazz
export { AppMainArticleTreeView }
</script>
