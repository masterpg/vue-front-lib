<style lang="sass" scoped>
@import 'src/example/styles/app.variables'

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
  <storage-dir-table
    ref="table"
    :data="m_dirChildNodes"
    :columns="columns"
    :selected.sync="dirSelectedNodes"
    :sort-method="sortChildNodesMethod"
    :loading="loading"
    row-key="label"
    @selection="m_onSelection"
  >
    <template v-slot:body="slotProps">
      <q-tr :props="slotProps.tr" @click="m_rowOnClick(slotProps.tr.row)">
        <q-td auto-width>
          <q-checkbox v-show="!m_isArticleFile(slotProps.tr.row.path)" v-model="slotProps.tr.selected" />
        </q-td>
        <q-td key="label" :props="slotProps.tr">
          <span
            v-if="slotProps.tr.row.isDir || m_isArticleFile(slotProps.tr.row.path)"
            class="th label"
            @click="m_nameCellOnClick(slotProps.tr.row, $event)"
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
        <storage-node-popup-menu
          :storage-type="storageType"
          :node="slotProps.tr.row"
          :selected-nodes="table.selected"
          context-menu
          @select="m_popupMenuOnNodeAction"
        />
      </q-tr>
    </template>
  </storage-dir-table>
</template>

<script lang="ts">
import { StorageDirTable, StorageDirTableRow, StorageDirView, StorageNodePopupMenu } from '@/example/views/base/storage'
import { Component } from 'vue-property-decorator'
import { StorageLogic } from '@/example/logic'
import { config } from '@/example/config'

@Component({
  components: {
    StorageDirTable,
    StorageNodePopupMenu,
  },
})
export default class ArticleAdminDirView extends StorageDirView {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  protected get columns() {
    return [
      { name: 'label', align: 'left', label: String(this.$t('storage.nodeDetail.name')), field: 'label' },
      { name: 'type', align: 'left', label: String(this.$t('storage.nodeDetail.type')), field: 'type' },
      { name: 'size', align: 'right', label: String(this.$t('storage.nodeDetail.size')), field: 'size' },
      { name: 'share', align: 'center', label: String(this.$t('storage.nodeDetail.share')), field: 'share' },
      { name: 'updatedAt', align: 'left', label: String(this.$t('storage.nodeDetail.updatedAt')), field: 'updatedAt' },
    ]
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  protected sortChildNodesMethod(rows: StorageDirTableRow[], sortBy: string, descending: boolean) {
    return StorageLogic.sortChildren(rows)
  }

  private m_isArticleFile(nodePath: string): boolean {
    return this.isArticleFile(nodePath)
  }

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------

  private async m_onSelection(e: { rows: StorageDirTableRow[]; keys: string[]; added: boolean; evt: any }) {
    // 対象ディレクトリが記事ディレクトリの場合
    if (this.targetDir && this.isArticle(this.targetDir)) {
      // 選択に記事ファイル含まれていた場合、選択から記事ファイルを除去
      const articleFileIndex = e.keys.indexOf(config.storage.article.fileName)
      if (articleFileIndex >= 0) {
        e.rows.splice(articleFileIndex, 1)
      }
      this.dirSelectedNodes = e.rows
    }
  }
}
</script>
