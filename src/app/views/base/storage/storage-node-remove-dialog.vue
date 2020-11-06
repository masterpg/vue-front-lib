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
import { StorageNode, StorageNodeType, StorageType } from '@/app/logic'
import { Dialog } from '@/app/components/dialog'
import { QDialog } from 'quasar'
import { StoragePageLogic } from '@/app/views/base/storage/storage-page-logic'
import { useI18n } from '@/app/i18n'

interface StorageNodeRemoveDialog extends Dialog<string[], boolean> {}

interface Props {
  storageType: StorageType
}

namespace StorageNodeRemoveDialog {
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
    const pageLogic = StoragePageLogic.getInstance(props.storageType)
    const { t, tc } = useI18n()

    const state = reactive({
      removingNodes: [] as StorageNode[],
    })

    const title = computed(() => {
      if (state.removingNodes.length === 1) {
        const nodeTypeLabel = pageLogic.getNodeTypeLabel(state.removingNodes[0])
        return String(t('common.deleteSth', { sth: nodeTypeLabel }))
      } else if (state.removingNodes.length >= 2) {
        const sth = String(tc('common.item', state.removingNodes.length))
        return String(t('common.deleteSth', { sth }))
      }
      return ''
    })

    const message = computed(() => {
      if (!state.removingNodes.length) return ''

      // ダイアログ引数で渡されたノードが1つの場合
      if (state.removingNodes.length === 1) {
        const target = pageLogic.getDisplayNodeName(state.removingNodes[0])
        return String(t('storage.delete.deleteTargetQ', { target }))
      }
      // ダイアログ引数で渡されたノードが複数の場合
      else {
        let fileNum = 0
        let folderNum = 0
        for (const removingNode of state.removingNodes) {
          if (removingNode.nodeType === StorageNodeType.Dir) {
            folderNum++
          } else if (removingNode.nodeType === StorageNodeType.File) {
            fileNum++
          }
        }

        // ファイルとフォルダが指定された場合
        if (fileNum > 0 && folderNum > 0) {
          const fileType = String(tc('common.file', fileNum))
          const folderType = String(tc('common.folder', folderNum))
          return String(t('storage.delete.deleteFileAndFolderQ', { fileNum, fileType, folderNum, folderType }))
        }
        // ファイルが複数指定された場合
        else if (fileNum > 0) {
          const nodeType = String(tc('common.file', fileNum))
          return String(t('storage.delete.deleteNodeQ', { nodeNum: fileNum, nodeType }))
        }
        // フォルダが複数指定された場合
        else if (folderNum > 0) {
          const nodeType = String(tc('common.folder', folderNum))
          return String(t('storage.delete.deleteNodeQ', { nodeNum: folderNum, nodeType }))
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
        const node = pageLogic.sgetStorageNode({ path: nodePath })
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
      t,
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
