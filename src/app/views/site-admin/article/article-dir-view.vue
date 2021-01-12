<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.ArticleDirView
  position: relative

.control-area
  padding-right: 10px

.th
  cursor: default
  &.label
    color: $app-link-color
    span
      @extend %app-link
      font-weight: map-get($text-weights, "medium")
      vertical-align: middle
</style>

<template>
  <div class="ArticleDirView">
    <div v-show="enableArticleSortOrder" class="control-area layout horizontal end-justified">
      <q-btn-group rounded outline>
        <q-btn
          rounded
          unelevated
          color="primary"
          padding="xs 10px"
          size="sm"
          icon="fas fa-angle-down"
          :disabled="!enableDownSort"
          @click="downSortButtonOnClick"
        />
        <q-btn
          rounded
          unelevated
          color="primary"
          padding="xs"
          size="sm"
          icon="fas fa-angle-up"
          :disabled="!enableUpSort"
          @click="upSortButtonOnClick"
        />
        <q-btn
          rounded
          unelevated
          color="primary"
          padding="xs 10px"
          size="sm"
          icon="fas fa-save"
          :disabled="!enableSaveSort"
          @click="saveSortOnClick"
        />
      </q-btn-group>
    </div>
    <StorageDirTable
      ref="table"
      :data="dirChildNodes"
      :columns="columns"
      :selected.sync="dirSelectedNodes"
      :sort-method="tableSortMethod"
      :loading="loading"
      row-key="id"
      @selection="onSelection"
    >
      <template v-slot:body="slotProps">
        <q-tr :props="slotProps.tr" @click="rowOnClick(slotProps.tr.row)">
          <q-td auto-width>
            <q-checkbox v-show="!slotProps.tr.row.isArticleFile" v-model="slotProps.tr.selected" />
          </q-td>
          <q-td key="label" :props="slotProps.tr">
            <span v-if="slotProps.tr.row.isDir || slotProps.tr.row.isArticleFile" class="th label" @click="nameCellOnClick(slotProps.tr.row, $event)">
              <q-icon :name="slotProps.tr.row.icon" :size="slotProps.tr.row.iconSize" class="app-mr-6" />
              <span>{{ slotProps.tr.row.label }}</span>
            </span>
            <span v-else-if="slotProps.tr.row.isFile" class="th">
              <q-icon :name="slotProps.tr.row.icon" :size="slotProps.tr.row.iconSize" class="app-mr-6" />
              <span>{{ slotProps.tr.row.label }}</span>
            </span>
          </q-td>
          <q-td key="type" :props="slotProps.tr" class="th">{{ slotProps.tr.row.type }}</q-td>
          <q-td key="size" :props="slotProps.tr" class="th">{{ slotProps.tr.row.size }}</q-td>
          <q-td key="share" :props="slotProps.tr" class="th">
            <q-icon :name="slotProps.tr.row.share.icon" :size="slotProps.tr.row.share.iconSize" />
          </q-td>
          <q-td key="updatedAt" :props="slotProps.tr" class="th">{{ slotProps.tr.row.updatedAt }}</q-td>
          <StorageNodePopupMenu
            :storage-type="storageType"
            :node="slotProps.tr.row"
            :selected-nodes="table.selected"
            context-menu
            @select="popupMenuOnNodeAction"
          />
        </q-tr>
      </template>
    </StorageDirTable>
    <q-inner-loading :showing="spinning">
      <q-spinner size="50px" color="primary" />
    </q-inner-loading>
  </div>
</template>

<script lang="ts">
import { StorageDirTableRow, StorageDirView } from '@/app/views/base/storage/storage-dir-view.vue'
import { computed, defineComponent, reactive, ref } from '@vue/composition-api'
import { StorageDirTable } from '@/app/views/base/storage/storage-dir-table.vue'
import { StorageNodePopupMenu } from '@/app/views/base/storage/storage-node-popup-menu.vue'
import { StoragePageLogic } from '@/app/views/base/storage'
import { StorageUtil } from '@/app/logic'
import { useI18n } from '@/app/i18n'

interface ArticleDirView extends ArticleDirView.Props {}

namespace ArticleDirView {
  export interface Props extends StorageDirView.Props {}

  export const clazz = defineComponent({
    name: 'StorageDirView',

    components: {
      StorageDirTable: StorageDirTable.clazz,
      StorageNodePopupMenu: StorageNodePopupMenu.clazz,
    },

    props: { ...StorageDirView.props },

    setup(props: Readonly<Props>, ctx) {
      //----------------------------------------------------------------------
      //
      //  Variables
      //
      //----------------------------------------------------------------------

      const base = StorageDirView.setup(props, ctx)

      const pageLogic = StoragePageLogic.getInstance(props.storageType)
      const { t } = useI18n()

      base.columns.value = [
        { name: 'label', align: 'left', label: String(t('storage.nodeDetail.name')), field: 'label' },
        { name: 'type', align: 'left', label: String(t('storage.nodeDetail.type')), field: 'type' },
        { name: 'size', align: 'right', label: String(t('storage.nodeDetail.size')), field: 'size' },
        { name: 'share', align: 'center', label: String(t('storage.nodeDetail.share')), field: 'share' },
        { name: 'updatedAt', align: 'left', label: String(t('storage.nodeDetail.updatedAt')), field: 'updatedAt' },
      ]

      /**
       * 記事ソートが有効か否かです。<br>
       * - これが有効な場合、ノードに設定されている記事ソートオーダーをもとにソートが行われます。
       * - これが無効な場合、一般的なディレクトリのソートが行われます。
       */
      const enableArticleSortOrder = computed<boolean>(() => {
        return base.targetDir.value?.path === pageLogic.getRootTreeNode().path || Boolean(base.targetDir.value?.article?.dir)
      })

      /**
       * ソート順のアップボタンの有効・無効を示すフラグです。
       */
      const enableDownSort = computed<boolean>(() => {
        if (!isSequenceSelected.value) return false

        // 最後尾のノードが選択されている場合、使用不可
        const lastNode = base.dirChildNodes.value[base.dirChildNodes.value.length - 1]
        if (lastNode.selected) return false

        // 選択ノードの中に記事系ディレクトリ以外のものがあった場合、使用不可
        for (const selectedIndex of selectedIndices.value) {
          const selectedNode = base.dirChildNodes.value[selectedIndex]
          if (!selectedNode.article?.dir) return false
        }

        // 最後尾の選択ノードの次のノードを取得
        const lastSelectedNextNode = (() => {
          const nodesLength = base.dirChildNodes.value.length
          const lastSelectedIndex = selectedIndices.value[selectedIndices.value.length - 1]
          if (lastSelectedIndex + 1 <= nodesLength) {
            return base.dirChildNodes.value[lastSelectedIndex + 1]
          } else {
            return null
          }
        })()

        // 最後尾の選択ノードの次のノードが記事系ディレクトリ以外(例: アセットなど)の場合、使用不可
        if (!lastSelectedNextNode?.article?.dir) return false

        return true
      })

      /**
       * ソート順のダウンボタンの有効・無効を示すフラグです。
       */
      const enableUpSort = computed<boolean>(() => {
        if (!isSequenceSelected.value) return false

        // 先頭のノードが選択されている場合、使用不可
        const firstNode = base.dirChildNodes.value[0]
        if (firstNode.selected) return false

        // 選択ノードの中に記事系ディレクトリ以外のものがあった場合、使用不可
        for (const selectedIndex of selectedIndices.value) {
          const selectedNode = base.dirChildNodes.value[selectedIndex]
          if (!selectedNode.article?.dir) return false
        }

        // 先頭の選択ノードの前のノードを取得
        const firstSelectedPrevNode = (() => {
          const firstSelectedIndex = selectedIndices.value[0]
          if (firstSelectedIndex - 1 >= 0) {
            return base.dirChildNodes.value[firstSelectedIndex - 1]
          } else {
            return null
          }
        })()

        // 先頭の選択ノードの前のノードが記事系ディレクトリ以外(例: アセットなど)の場合、使用不可
        if (!firstSelectedPrevNode?.article?.dir) return false

        return true
      })

      /**
       * ソート順の保存ボタンの有効・無効を示すフラグです。
       */
      const enableSaveSort = ref(false)

      /**
       * 選択ノードが連続しており、その間に未選択ノードが挟まっていないかを示すフラグです。
       */
      const isSequenceSelected = computed<boolean>(() => {
        if (!selectedIndices.value.length) return false

        let prevSelectedIndex = selectedIndices.value[0]
        for (let i = 1; i < selectedIndices.value.length; i++) {
          const curSelectedIndex = selectedIndices.value[i]
          if (curSelectedIndex !== prevSelectedIndex + 1) {
            return false
          }
          prevSelectedIndex = curSelectedIndex
        }

        return true
      })

      /**
       * 選択ノードのインデックスリストです。
       */
      const selectedIndices = computed<number[]>(() => {
        return base.dirChildNodes.value.reduce((result, node, index) => {
          node.selected && result.push(index)
          return result
        }, [] as number[])
      })

      const spinning = ref(false)

      //----------------------------------------------------------------------
      //
      //  Internal methods
      //
      //----------------------------------------------------------------------

      base.clear.value = () => {
        base.clear.super()
        enableSaveSort.value = false
      }

      base.tableSortMethod.value = rows => {
        return StorageUtil.sortChildren(rows)
      }

      //----------------------------------------------------------------------
      //
      //  Event listeners
      //
      //----------------------------------------------------------------------

      async function onSelection(e: { rows: StorageDirTableRow[]; keys: string[]; added: boolean; evt: any }) {
        // 対象ディレクトリが記事の場合
        if (base.targetDir.value && pageLogic.isArticle(base.targetDir.value)) {
          // 選択に記事ファイルが含まれていた場合、選択から記事ファイルを除去
          const articleFileIndex = e.rows.findIndex(row => row.article?.file)
          if (articleFileIndex >= 0) {
            e.rows.splice(articleFileIndex, 1)
          }
          base.dirSelectedNodes.value = e.rows
        }
      }

      /**
       * ソート順のダウンボタンがクリックされた際のリスナーです。
       */
      function downSortButtonOnClick() {
        const selectedLength = selectedIndices.value.length
        const firstSelectedIndex = selectedIndices.value[0]
        const selectedNodes = selectedIndices.value.map(index => base.dirChildNodes.value[index])
        base.dirChildNodes.value.splice(firstSelectedIndex, selectedLength)
        base.dirChildNodes.value.splice(firstSelectedIndex + 1, 0, ...selectedNodes)
        enableSaveSort.value = true
      }

      /**
       * ソート順のアップボタンがクリックされた際のリスナーです。
       */
      function upSortButtonOnClick() {
        const selectedLength = selectedIndices.value.length
        const firstSelectedIndex = selectedIndices.value[0]
        const selectedNodes = selectedIndices.value.map(index => base.dirChildNodes.value[index])
        base.dirChildNodes.value.splice(firstSelectedIndex, selectedLength)
        base.dirChildNodes.value.splice(firstSelectedIndex - 1, 0, ...selectedNodes)
        enableSaveSort.value = true
      }

      /**
       * ソート順の保存ボタンがクリックされた際のリスナーです。
       */
      async function saveSortOnClick() {
        spinning.value = true

        const orderNodePaths = base.dirChildNodes.value.reduce((result, node) => {
          node.article?.dir && result.push(node.path)
          return result
        }, [] as string[])
        await pageLogic.setArticleSortOrder(orderNodePaths)

        enableSaveSort.value = false
        base.buildDirChildNodes(base.targetDir.value!.path)

        spinning.value = false
      }

      //----------------------------------------------------------------------
      //
      //  Result
      //
      //----------------------------------------------------------------------

      return {
        ...base,
        enableArticleSortOrder,
        isSequenceSelected,
        enableDownSort,
        enableUpSort,
        enableSaveSort,
        spinning,
        onSelection,
        downSortButtonOnClick,
        upSortButtonOnClick,
        saveSortOnClick,
      }
    },
  })
}

export default ArticleDirView.clazz
export { ArticleDirView }
</script>
