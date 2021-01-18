<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.container
  body.screen--lg &, body.screen--xl &, body.screen--md &
    width: 340px
  body.screen--xs &, body.screen--sm &
    width: 270px

.title
  @extend %text-h6

.content-area
  &.pc, &.tab
    max-height: 50vh
  &.sp
    max-height: 80vh
  padding: 0 0 16px 0
  margin: 0 16px

.tree-view
  height: 100%
  --tree-padding: 0

.error-message
  @extend %text-caption
  color: $text-error-color
</style>

<template>
  <div>
    <q-dialog ref="dialog" class="StorageNodeMoveDialog" v-model="opened" @show="dialogOnShow()" @before-hide="close()">
      <q-card class="container">
        <!-- タイトル -->
        <q-card-section>
          <div class="title">{{ title }}</div>
        </q-card-section>

        <!-- コンテンツエリア -->
        <q-card-section class="content-area scroll">
          <q-input v-show="movingNodes.length === 1" ref="newNameInput" v-model="movingNodeName" :label="movingNodeLabel" class="app-pb-20" readonly>
            <template v-slot:prepend>
              <q-icon :name="movingNodeIcon" :size="movingNodeIconSize" />
            </template>
          </q-input>
          <div class="app-mb-10">{{ t('storage.move.selectDestPrompt') }}</div>
          <TreeView ref="treeView" class="tree-view" @select-change="treeViewOnSelectChange($event)" @lazy-load="treeViewOnLazyLoad($event)" />
        </q-card-section>

        <!-- エラーメッセージ -->
        <q-card-section v-show="Boolean(errorMessage)">
          <span class="error-message">{{ errorMessage }}</span>
        </q-card-section>

        <!-- ボタンエリア -->
        <q-card-actions class="layout horizontal center end-justified">
          <!-- CANCELボタン -->
          <q-btn flat rounded color="primary" :label="t('common.cancel')" @click="close()" />
          <!-- OKボタン -->
          <q-btn flat rounded color="primary" :label="t('common.ok')" @click="move()" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script lang="ts">
import { Ref, SetupContext, computed, defineComponent, ref } from '@vue/composition-api'
import { StorageArticleDirType, StorageNode, StorageNodeType, StorageType, StorageUtil } from '@/app/logic'
import { TreeView, TreeViewEvent, TreeViewLazyLoadEvent } from '@/app/components/tree-view'
import { removeBothEndsSlash, removeStartDirChars } from 'web-base-lib'
import { Dialog } from '@/app/components/dialog'
import { Dialogs } from '@/app/dialogs'
import { QDialog } from 'quasar'
import { StoragePageLogic } from '@/app/views/base/storage/storage-page-logic'
import { StorageTreeNode } from '@/app/views/base/storage/storage-tree-node.vue'
import { StorageTreeNodeData } from '@/app/views/base/storage/base'
import _path from 'path'
import { isFontAwesome } from '@/app/base'
import { useI18n } from '@/app/i18n'

interface StorageNodeMoveDialog extends Dialog<string[], string | undefined>, StorageNodeMoveDialog.Props {}

namespace StorageNodeMoveDialog {
  export interface Props {
    storageType: StorageType
  }

  export const clazz = defineComponent({
    name: 'StorageNodeMoveDialog',

    components: {
      TreeView: TreeView.clazz,
    },

    props: {
      storageType: { type: String, required: true },
    },

    setup: (props: Readonly<Props>, ctx) => setup(props, ctx),
  })

  export function setup(props: Readonly<Props>, ctx: SetupContext) {
    //----------------------------------------------------------------------
    //
    //  Variables
    //
    //----------------------------------------------------------------------

    const dialog = ref<QDialog>()
    const base = Dialog.setup<string | undefined>(dialog)
    const pageLogic = StoragePageLogic.getInstance(props.storageType)
    const { t, tc } = useI18n()

    const treeView = ref<TreeView<StorageTreeNode, StorageTreeNodeData>>()

    const movingNodes: Ref<StorageNode[]> = ref([])

    const title = computed(() => {
      if (movingNodes.value.length === 1) {
        const nodeTypeLabel = pageLogic.getNodeTypeLabel(movingNodes.value[0])
        return String(t('common.moveSth', { sth: nodeTypeLabel }))
      } else if (movingNodes.value.length >= 2) {
        const sth = String(tc('common.item', movingNodes.value.length))
        return String(t('common.moveSth', { sth }))
      }
      return ''
    })

    const movingNodeLabel = computed(() => {
      if (movingNodes.value.length === 1) {
        return String(t('storage.move.movingTarget'))
      }
      return ''
    })

    const movingNodeName = computed(() => {
      if (movingNodes.value.length === 1) {
        return pageLogic.getDisplayNodeName(movingNodes.value[0])
      }
      return ''
    })

    const movingNodeIcon = computed(() => {
      if (movingNodes.value.length === 1) {
        return pageLogic.getNodeIcon(movingNodes.value[0])
      }
      return ''
    })

    const movingNodeIconSize = computed(() => {
      return isFontAwesome(movingNodeIcon.value) ? '20px' : '24px'
    })

    const movingNodesParentPath = computed(() => {
      if (movingNodes.value.length === 0) return ''
      return movingNodes.value[0].dir
    })

    const errorMessage = ref('')

    const toDirNode: Ref<StorageTreeNode | null> = ref(null)

    //----------------------------------------------------------------------
    //
    //  Methods
    //
    //----------------------------------------------------------------------

    const open: StorageNodeMoveDialog['open'] = nodePaths => {
      movingNodes.value = []
      for (const nodePath of nodePaths) {
        const node = pageLogic.sgetStorageNode({ path: nodePath })
        movingNodes.value.push(node)
      }

      // ノードが複数指定された場合、親が同じであることを検証
      const movingNodeParentPath = movingNodes.value[0].dir
      for (const movingNode of movingNodes.value) {
        if (movingNode.dir !== movingNodeParentPath) {
          throw new Error('All nodes must have the same parent.')
        }
      }

      StorageUtil.sortNodes(movingNodes.value)

      return base.open({
        opened: async () => {
          await buildTreeView()
        },
      })
    }

    const close: StorageNodeMoveDialog['close'] = toDirPath => {
      clear()
      base.close(toDirPath)
    }

    //----------------------------------------------------------------------
    //
    //  Internal methods
    //
    //----------------------------------------------------------------------

    async function move(): Promise<void> {
      if (toDirNode.value === null) {
        errorMessage.value = String(t('storage.move.destNotSelected'))
        return
      }

      // 移動先に同名ノードが存在した場合、ユーザーに移動してよいか確認する
      for (const movingNode of movingNodes.value) {
        let alreadyExists = false
        for (const siblingNode of toDirNode.value.children) {
          if (siblingNode.name === movingNode.name) {
            alreadyExists = true
          }
        }
        if (alreadyExists) {
          const confirmed = await Dialogs.message.open({
            type: 'confirm',
            message: String(t('storage.move.alreadyExistsQ', { nodeName: movingNode.name })),
          })
          if (!confirmed) return
        }
      }

      close(toDirNode.value.path)
    }

    function clear(): void {
      toDirNode.value = null
      errorMessage.value = ''
    }

    async function buildTreeView(): Promise<void> {
      //
      // ルートノードの選択可/不可設定
      //
      let unselectable = false
      // 移動ノードの親ディレクトリがルートノードの場合、ルートノードを選択できないよう設定
      unselectable = movingNodesParentPath.value === pageLogic.getRootTreeNode().path
      // ストレージタイプが｢記事｣の場合、ルートノードは選択できないよう設定
      if (props.storageType === 'article') {
        unselectable = true
      }

      // ルートノードの追加
      treeView.value!.buildTree(
        [
          {
            ...pageLogic.createRootNodeData(),
            selected: false,
            opened: true,
            unselectable,
            disableContextMenu: true,
          },
        ],
        { nodeClass: StorageTreeNode.clazz }
      )
      const rootTreeNode = treeView.value!.children[0]

      rootTreeNode.lazyLoadStatus = 'loading'

      // サーバーから子ノードを読み込む
      await pullChildren(rootTreeNode.path)

      rootTreeNode.lazyLoadStatus = 'loaded'
    }

    /**
     * 指定されたディレクトリ直下の子ノードをサーバーから取得します。
     * @param dirPath
     */
    async function pullChildren(dirPath: string): Promise<void> {
      dirPath = removeBothEndsSlash(dirPath)

      // 引数ディレクトリ直下の子ノードをサーバーから取得
      await pageLogic.fetchStorageChildren(dirPath)

      // 引数ディレクトリ直下の子ディレクトリのデータを取得
      const childNodeDataList = createTreeDirNodeDataList(dirPath)

      // ストレージタイプが｢記事｣の場合
      if (props.storageType === 'article') {
        // 移動するノードのタイプによって移動先を絞り込み
        if (containsCategory()) {
          filterForCategory(childNodeDataList)
        } else if (containsArticle()) {
          filterForArticle(childNodeDataList)
        } else {
          filter(childNodeDataList)
        }
      }

      // ツリービューにディレクトリノードを追加
      for (const childNodeData of childNodeDataList) {
        const parentPath = removeStartDirChars(_path.dirname(childNodeData.value))
        treeView.value!.addNode(childNodeData, {
          parent: parentPath,
        })
      }
    }

    /**
     * 指定されたディレクトリ直下の子ディレクトリを取得し、
     * 取得したディレクトリをツリーに追加可能なデータとして作成します。
     * @param dirPath
     */
    function createTreeDirNodeDataList(dirPath: string): StorageTreeNodeData[] {
      const result: StorageTreeNodeData[] = []

      // 引数ディレクトリ直下の子ディレクトリのデータを取得
      const nodes = pageLogic.getStorageChildren(dirPath)

      for (const node of nodes) {
        // ディレクトリノード以外はツリービューに追加しない
        if (node.nodeType !== StorageNodeType.Dir) continue
        // 移動ノードはツリービューに追加しない
        if (movingNodes.value.some(movingNode => movingNode.path === node.path)) continue
        // 現在の親ディレクトリは選択できないよう設定
        const unselectable = node.path === movingNodesParentPath.value

        result.push({
          ...pageLogic.nodeToTreeData(props.storageType, node),
          lazy: true,
          unselectable,
          disableContextMenu: true,
        })
      }

      return result
    }

    /**
     * 移動ノードに｢カテゴリ｣を含んでいるかを取得します。
     */
    function containsCategory(): boolean {
      return movingNodes.value.some(node => node.article?.dir?.type === StorageArticleDirType.Category)
    }

    /**
     * 移動ノードに｢記事｣を含んでいるかを取得します。
     */
    function containsArticle(): boolean {
      return movingNodes.value.some(node => node.article?.dir?.type === StorageArticleDirType.Article)
    }

    //--------------------------------------------------
    //  移動先絞り込みフィルター
    //--------------------------------------------------

    /**
     * 一般的なディレクトリまたはファイルの移動先を絞り込みます。
     * 一般的なディレクトリまたはファイルは｢一般ディレクトリ、記事｣へのみ移動可能です。
     * @param childNodeDataList
     */
    function filter(childNodeDataList: StorageTreeNodeData[]): StorageTreeNodeData[] {
      for (let i = 0; i < childNodeDataList.length; i++) {
        const nodeData = childNodeDataList[i]
        // 一般ディレクトリまたはファイルは｢一般ディレクトリ、記事｣へのみ移動可能であり、それ以外は選択不可
        const articleDirType = nodeData.article?.dir?.type
        if (!(!articleDirType || articleDirType === StorageArticleDirType.Article)) {
          nodeData.unselectable = true
        }
      }

      return childNodeDataList
    }

    /**
     * カテゴリの移動先を絞り込みます。
     * カテゴリは｢ツリーバンドル、カテゴリ｣へのみ移動可能です。
     * @param childNodeDataList
     */
    function filterForCategory(childNodeDataList: StorageTreeNodeData[]): StorageTreeNodeData[] {
      for (let i = 0; i < childNodeDataList.length; i++) {
        const nodeData = childNodeDataList[i]
        // カテゴリは｢ツリーバンドル、カテゴリ｣へのみ移動可能であり、それ以外の移動先ノードは除去
        const articleDirType = nodeData.article?.dir?.type
        if (!(articleDirType === StorageArticleDirType.TreeBundle || articleDirType === StorageArticleDirType.Category)) {
          childNodeDataList.splice(i--, 1)
        }
      }

      return childNodeDataList
    }

    /**
     * 記事の移動先を絞り込みます。
     * 記事は｢リストバンドル、ツリーバンドル、カテゴリ｣へのみ移動可能です。
     * @param childNodeDataList
     */
    function filterForArticle(childNodeDataList: StorageTreeNodeData[]): StorageTreeNodeData[] {
      for (let i = 0; i < childNodeDataList.length; i++) {
        const nodeData = childNodeDataList[i]
        // 記事は｢リストバンドル、ツリーバンドル、カテゴリ｣へのみ移動可能であり、それ以外の移動先ノードは除去
        const articleDirType = nodeData.article?.dir?.type
        if (
          !(
            articleDirType === StorageArticleDirType.ListBundle ||
            articleDirType === StorageArticleDirType.TreeBundle ||
            articleDirType === StorageArticleDirType.Category
          )
        ) {
          childNodeDataList.splice(i--, 1)
        }
      }

      return childNodeDataList
    }

    //----------------------------------------------------------------------
    //
    //  Event listeners
    //
    //----------------------------------------------------------------------

    /**
     * ツリービューでノードが選択された際のリスナです。
     * @param e
     */
    function treeViewOnSelectChange(e: TreeViewEvent<StorageTreeNode>) {
      errorMessage.value = ''
      toDirNode.value = e.node
    }

    /**
     * ツリービューで遅延ロードが開始された際のリスナです。
     * @param e
     */
    async function treeViewOnLazyLoad(e: TreeViewLazyLoadEvent<StorageTreeNode>) {
      await pullChildren(e.node.path)
      e.done()
      e.node.open()
    }

    function dialogOnShow() {}

    //----------------------------------------------------------------------
    //
    //  Result
    //
    //----------------------------------------------------------------------

    return {
      ...base,
      t,
      treeView,
      title,
      movingNodes,
      movingNodeLabel,
      movingNodeName,
      movingNodeIcon,
      movingNodeIconSize,
      errorMessage,
      open,
      close,
      move,
      treeViewOnSelectChange,
      treeViewOnLazyLoad,
      dialogOnShow,
    }
  }
}

export default StorageNodeMoveDialog.clazz
export { StorageNodeMoveDialog }
</script>
