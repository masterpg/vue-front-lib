<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

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
    <StorageDirTable
      ref="table"
      :data="dirChildNodes"
      :columns="columns"
      :selected.sync="dirSelectedNodes"
      :sort-method="sortChildNodesMethod"
      :loading="loading"
      row-key="id"
      @selection="onSelection"
    >
      <template v-slot:body="slotProps">
        <q-tr :props="slotProps.tr" @click="rowOnClick(slotProps.tr.row)">
          <q-td auto-width>
            <q-checkbox v-show="!isArticleFile(slotProps.tr.row.path)" v-model="slotProps.tr.selected" />
          </q-td>
          <q-td key="label" :props="slotProps.tr">
            <span
              v-if="slotProps.tr.row.isDir || isArticleFile(slotProps.tr.row.path)"
              class="th label"
              @click="nameCellOnClick(slotProps.tr.row, $event)"
            >
              <q-icon :name="slotProps.tr.row.icon" size="24px" class="app-mr-6" />
              <span>{{ slotProps.tr.row.label }}</span>
            </span>
            <span v-else-if="slotProps.tr.row.isFile" class="th">
              <q-icon :name="slotProps.tr.row.icon" size="24px" class="app-mr-6" />
              <span>{{ slotProps.tr.row.label }}</span>
            </span>
          </q-td>
          <q-td key="type" :props="slotProps.tr" class="th">{{ slotProps.tr.row.type }}</q-td>
          <q-td key="size" :props="slotProps.tr" class="th">{{ slotProps.tr.row.size }}</q-td>
          <q-td key="share" :props="slotProps.tr" class="th">
            <q-icon :name="slotProps.tr.row.share.icon" size="24px" />
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
  </div>
</template>

<script lang="ts">
import { StorageDirTableRow, StorageDirView } from '@/app/views/base/storage/storage-dir-view.vue'
import { StorageDirTable } from '@/app/views/base/storage/storage-dir-table.vue'
import { StorageLogic } from '@/app/logic/modules/storage'
import { StorageNodePopupMenu } from '@/app/views/base/storage/storage-node-popup-menu.vue'
import { StoragePageLogic } from '@/app/views/base/storage'
import { defineComponent } from '@vue/composition-api'
import { useConfig } from '@/app/config'
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
      const config = useConfig()
      const { t } = useI18n()

      base.columns.value = [
        { name: 'label', align: 'left', label: String(t('storage.nodeDetail.name')), field: 'label' },
        { name: 'type', align: 'left', label: String(t('storage.nodeDetail.type')), field: 'type' },
        { name: 'size', align: 'right', label: String(t('storage.nodeDetail.size')), field: 'size' },
        { name: 'share', align: 'center', label: String(t('storage.nodeDetail.share')), field: 'share' },
        { name: 'updatedAt', align: 'left', label: String(t('storage.nodeDetail.updatedAt')), field: 'updatedAt' },
      ]

      //----------------------------------------------------------------------
      //
      //  Internal methods
      //
      //----------------------------------------------------------------------

      base.sortChildNodesMethod.value = rows => {
        return StorageLogic.sortChildren(rows)
      }

      function isArticleFile(nodePath: string): boolean {
        return pageLogic.isArticleFile({ path: nodePath })
      }

      //----------------------------------------------------------------------
      //
      //  Event listeners
      //
      //----------------------------------------------------------------------

      async function onSelection(e: { rows: StorageDirTableRow[]; keys: string[]; added: boolean; evt: any }) {
        // 対象ディレクトリが記事ディレクトリの場合
        if (base.targetDir.value && pageLogic.isArticle(base.targetDir.value)) {
          // 選択に記事ファイル含まれていた場合、選択から記事ファイルを除去
          const articleFileIndex = e.keys.indexOf(config.storage.article.fileName)
          if (articleFileIndex >= 0) {
            e.rows.splice(articleFileIndex, 1)
          }
          base.dirSelectedNodes.value = e.rows
        }
      }

      //----------------------------------------------------------------------
      //
      //  Result
      //
      //----------------------------------------------------------------------

      return {
        ...base,
        isArticleFile,
        onSelection,
      }
    },
  })
}

export default ArticleDirView.clazz
export { ArticleDirView }
</script>
