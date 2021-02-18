<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.container
  body.screen--lg &, body.screen--xl &, body.screen--md &
    width: 340px
  body.screen--xs &, body.screen--sm &
    width: 270px

.title
  @extend %text-h6
</style>

<template>
  <q-dialog ref="dialog" class="StorageNodeRemoveDialog" v-model="opened" @hide="close()">
    <q-card class="container">
      <!-- タイトル -->
      <q-card-section>
        <div class="title">{{ title }}</div>
      </q-card-section>

      <!-- コンテンツエリア -->
      <q-card-section>
        {{ message }}
      </q-card-section>

      <!-- ボタンエリア -->
      <q-card-actions class="layout horizontal center end-justified">
        <!-- CANCELボタン -->
        <q-btn flat rounded color="primary" :label="t('common.cancel')" @click="close()" />
        <!-- DELETEボタン -->
        <q-btn flat rounded color="primary" :label="t('common.delete')" @click="close(true)" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { SetupContext, computed, defineComponent, reactive, ref } from '@vue/composition-api'
import { StorageNode, StorageNodeType, StorageType } from '@/app/services'
import { Dialog } from '@/app/components/dialog'
import { QDialog } from 'quasar'
import { StoragePageService } from '@/app/views/base/storage/storage-page-service'
import { useI18n } from '@/app/i18n'

interface StorageNodeRemoveDialog extends Dialog<string[], boolean>, StorageNodeRemoveDialog.Props {}

namespace StorageNodeRemoveDialog {
  export interface Props {
    storageType: StorageType
  }

  export const clazz = defineComponent({
    name: 'StorageNodeRemoveDialog',

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
    const base = Dialog.setup<boolean>(dialog)
    const pageService = StoragePageService.getInstance(props.storageType)
    const i18n = useI18n()

    const state = reactive({
      removingNodes: [] as StorageNode[],
    })

    const title = computed(() => {
      if (state.removingNodes.length === 1) {
        const nodeTypeLabel = pageService.getNodeTypeLabel(state.removingNodes[0])
        return String(i18n.t('common.deleteSth', { sth: nodeTypeLabel }))
      } else if (state.removingNodes.length >= 2) {
        const sth = String(i18n.tc('common.item', state.removingNodes.length))
        return String(i18n.t('common.deleteSth', { sth }))
      }
      return ''
    })

    const message = computed(() => {
      if (!state.removingNodes.length) return ''

      // ダイアログ引数で渡されたノードが1つの場合
      if (state.removingNodes.length === 1) {
        const target = pageService.getDisplayNodeName(state.removingNodes[0])
        return String(i18n.t('storage.delete.deleteTargetQ', { target }))
      }
      // ダイアログ引数で渡されたノードが複数の場合
      else {
        let fileNum = 0
        let folderNum = 0
        for (const removingNode of state.removingNodes) {
          if (removingNode.nodeType === 'Dir') {
            folderNum++
          } else if (removingNode.nodeType === 'File') {
            fileNum++
          }
        }

        // ファイルとフォルダが指定された場合
        if (fileNum > 0 && folderNum > 0) {
          const fileType = String(i18n.tc('common.file', fileNum))
          const folderType = String(i18n.tc('common.folder', folderNum))
          return String(i18n.t('storage.delete.deleteFileAndFolderQ', { fileNum, fileType, folderNum, folderType }))
        }
        // ファイルが複数指定された場合
        else if (fileNum > 0) {
          const nodeType = String(i18n.tc('common.file', fileNum))
          return String(i18n.t('storage.delete.deleteNodeQ', { nodeNum: fileNum, nodeType }))
        }
        // フォルダが複数指定された場合
        else if (folderNum > 0) {
          const nodeType = String(i18n.tc('common.folder', folderNum))
          return String(i18n.t('storage.delete.deleteNodeQ', { nodeNum: folderNum, nodeType }))
        }
      }

      throw new Error('An unreachable line was reached.')
    })

    //----------------------------------------------------------------------
    //
    //  Methods
    //
    //----------------------------------------------------------------------

    const open: StorageNodeRemoveDialog['open'] = nodePaths => {
      state.removingNodes = []
      for (const nodePath of nodePaths) {
        const node = pageService.sgetStorageNode({ path: nodePath })
        state.removingNodes.push(node)
      }

      return base.open()
    }

    const close: StorageNodeRemoveDialog['close'] = isConfirmed => {
      base.close(isConfirmed)
    }

    //----------------------------------------------------------------------
    //
    //  Result
    //
    //----------------------------------------------------------------------

    return {
      ...base,
      ...i18n,
      title,
      message,
      open,
      close,
    }
  }
}

export default StorageNodeRemoveDialog.clazz
export { StorageNodeRemoveDialog }
</script>
