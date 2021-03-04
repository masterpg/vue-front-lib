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
import { SetupContext, defineComponent, onMounted, ref } from '@vue/composition-api'
import { TreeNodeData, TreeView, TreeViewSelectEvent } from '@/app/components/tree-view'
import { useRouteParams, useRoutes } from '@/app/router'

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

    //----------------------------------------------------------------------
    //
    //  Variables
    //
    //----------------------------------------------------------------------

    const services = useService()
    const routes = useRoutes()
    const { userName } = useRouteParams()
    routes.articles.move

    const treeView = ref<TreeView<AppMainArticleTreeNode, AppMainArticleTreeNodeData>>()

    //----------------------------------------------------------------------
    //
    //  Methods
    //
    //----------------------------------------------------------------------

    const load: AppMainArticleTreeView['load'] = async userName => {
      const tocNodes = await services.article.fetchTableOfContents(userName)
      console.log(tocNodes)

      for (const node of tocNodes) {
        const nodeData = { ...node, value: node.path }
        treeView.value!.addNode(nodeData, { parent: node.dir || undefined })
      }
    }

    //----------------------------------------------------------------------
    //
    //  Event listeners
    //
    //----------------------------------------------------------------------

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
