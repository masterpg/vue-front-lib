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
  <div>
    <q-dialog ref="dialog" class="StorageNodeRenameDialog" v-model="opened" @show="dialogOnShow()" @before-hide="close()">
      <q-card class="container">
        <!-- タイトル -->
        <q-card-section>
          <div class="title">{{ title }}</div>
        </q-card-section>

        <!-- コンテンツエリア -->
        <q-card-section>
          <q-input
            ref="newNameInput"
            v-model="newName"
            class="app-pb-20"
            :label="parentPath"
            :error="isError"
            :error-message="errorMessage"
            @input="newNameInputOnInput"
          >
            <template v-slot:prepend>
              <q-icon :name="nodeIcon" :size="nodeIconSize" />
            </template>
          </q-input>
        </q-card-section>

        <!-- ボタンエリア -->
        <q-card-actions class="layout horizontal center end-justified">
          <!-- CANCELボタン -->
          <q-btn flat rounded color="primary" :label="t('common.cancel')" @click="close()" />
          <!-- CREATEボタン -->
          <q-btn flat rounded color="primary" :label="t('common.ok')" @click="rename()" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script lang="ts">
import { QDialog, QInput } from 'quasar'
import { Ref, SetupContext, computed, defineComponent, ref } from '@vue/composition-api'
import { StorageNode, StorageType } from '@/app/services'
import { Dialog } from '@/app/components/dialog'
import { StoragePageService } from '@/app/views/base/storage/storage-page-service'
import _path from 'path'
import { isFontAwesome } from '@/app/base'
import { useI18n } from '@/app/i18n'

interface StorageNodeRenameDialog extends Dialog<string, string | undefined>, StorageNodeRenameDialog.Props {}

namespace StorageNodeRenameDialog {
  export interface Props {
    storageType: StorageType
  }

  export const clazz = defineComponent({
    name: 'StorageNodeRenameDialog',

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
    const pageService = StoragePageService.getInstance(props.storageType)
    const i18n = useI18n()

    const newNameInput = ref<QInput>()

    const targetNode: Ref<StorageNode | null> = ref(null)

    const title = computed(() => {
      if (!targetNode.value) return ''
      const nodeTypeLabel = pageService.getNodeTypeLabel(targetNode.value)
      return String(i18n.t('common.renameSth', { sth: nodeTypeLabel }))
    })

    const nodeIcon = computed(() => {
      if (!targetNode.value) return ''
      return pageService.getNodeIcon(targetNode.value)
    })

    const nodeIconSize = computed(() => {
      return isFontAwesome(nodeIcon.value) ? '20px' : '24px'
    })

    const newName = ref<string | null>(null)

    const parentPath = computed(() => {
      if (!targetNode.value) return ''
      return _path.join(pageService.getRootTreeNode().label, pageService.getDisplayNodePath({ path: targetNode.value.dir }), '/')
    })

    const isError = computed(() => !validate())

    const errorMessage = ref('')

    /**
     * 新しいノード名のインプットに変更があったか否かです。
     */
    const newNameInputChanged = ref(false)

    //----------------------------------------------------------------------
    //
    //  Methods
    //
    //----------------------------------------------------------------------

    const open: StorageNodeRenameDialog['open'] = targetNodePath => {
      targetNode.value = pageService.sgetStorageNode({ path: targetNodePath })
      newName.value = pageService.getDisplayNodeName(targetNode.value)

      return base.open()
    }

    const close: StorageNodeRenameDialog['close'] = newName => {
      clear()
      base.close(newName)
    }

    //----------------------------------------------------------------------
    //
    //  Internal methods
    //
    //----------------------------------------------------------------------

    async function rename(): Promise<void> {
      newName.value = newName.value === null ? '' : newName.value
      if (!validate()) return

      // 入力値が元のままの場合、キャンセルとして閉じる
      if (targetNode.value!.name === newName.value) {
        close('')
      }
      // 上記以外は入力値を結果にして閉じる
      else {
        close(newName.value!)
      }
    }

    function clear(): void {
      newName.value = null
      newNameInputChanged.value = false
      newNameInput.value!.resetValidation()
    }

    function validate(): boolean {
      if (!targetNode.value || !newNameInputChanged.value) return true

      // 必須入力チェック
      if (newName.value === '') {
        const target = String(i18n.t('common.sthName', { sth: pageService.getNodeTypeLabel(targetNode.value) }))
        errorMessage.value = String(i18n.t('error.required', { target }))
        return false
      }

      // 禁則文字チェック
      if (newName.value) {
        const matched = newName.value.match(/\r?\n|\t|\//g)
        if (matched) {
          errorMessage.value = String(i18n.t('error.unusable', { target: matched[0] }))
          return false
        }
      }

      // リネームされているかチェック(入力値が変更されていること)
      let nameChange = false
      if (!targetNode.value?.article?.dir?.name) {
        nameChange = newName.value !== targetNode.value.name
      } else {
        nameChange = newName.value !== targetNode.value?.article.dir.name
      }
      if (!nameChange) {
        errorMessage.value = String(i18n.t('storage.rename.renamingNodeNameIsNotChanged'))
        return false
      }

      // リネームしようとする名前のノードが存在しないことをチェック
      const parentNode = pageService.getStorageNode({ path: targetNode.value.dir })!
      const siblingNodes = pageService.getStorageChildren({ path: targetNode.value.dir })
      for (const siblingNode of siblingNodes) {
        if (siblingNode === targetNode.value) continue

        const existsSameName = siblingNode.name === newName.value
        const existsSameArticleName = siblingNode.article?.dir?.name && siblingNode.article?.dir?.name === newName.value
        if (existsSameName || existsSameArticleName) {
          errorMessage.value = String(
            i18n.t('storage.nodeAlreadyExists', { nodeName: newName.value, nodeType: pageService.getNodeTypeLabel(siblingNode) })
          )
          return false
        }
      }

      errorMessage.value = ''
      return true
    }

    //----------------------------------------------------------------------
    //
    //  Event listeners
    //
    //----------------------------------------------------------------------

    function dialogOnShow() {
      newNameInput.value!.focus()
      newNameInput.value!.select()
    }

    function newNameInputOnInput() {
      newNameInputChanged.value = true
    }

    //----------------------------------------------------------------------
    //
    //  Result
    //
    //----------------------------------------------------------------------

    return {
      ...base,
      ...i18n,
      newNameInput,
      title,
      nodeIcon,
      nodeIconSize,
      newName,
      parentPath,
      isError,
      errorMessage,
      open,
      close,
      rename,
      dialogOnShow,
      newNameInputOnInput,
    }
  }
}

export default StorageNodeRenameDialog.clazz
export { StorageNodeRenameDialog }
</script>
