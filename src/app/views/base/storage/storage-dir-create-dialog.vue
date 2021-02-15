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
  <q-dialog ref="dialog" class="StorageDirCreateDialog" v-model="opened" @show="dialogOnShow()" @before-hide="close()">
    <q-card class="container">
      <!-- タイトル -->
      <q-card-section>
        <div class="title">{{ title }}</div>
      </q-card-section>

      <!-- コンテンツエリア -->
      <q-card-section>
        <q-input ref="dirNameInput" v-model="dirName" class="app-pb-20" :label="parentPath" :error="isError" :error-message="errorMessage">
          <template v-slot:prepend>
            <q-icon :name="icon" :size="iconSize" />
          </template>
        </q-input>
      </q-card-section>

      <!-- ボタンエリア -->
      <q-card-actions class="layout horizontal center end-justified">
        <!-- CANCELボタン -->
        <q-btn flat rounded color="primary" :label="t('common.cancel')" @click="close()" />
        <!-- CREATEボタン -->
        <q-btn flat rounded color="primary" :label="t('common.create')" @click="create()" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { QDialog, QInput } from 'quasar'
import { Ref, SetupContext, computed, defineComponent, reactive, ref } from '@vue/composition-api'
import { StorageArticleSettings, StorageNode, StorageNodeType, StorageType } from '@/app/service'
import { DeepPartial } from 'web-base-lib'
import { Dialog } from '@/app/components/dialog'
import { StoragePageService } from '@/app/views/base/storage/storage-page-service'
import _path from 'path'
import { isFontAwesome } from '@/app/base'
import { useI18n } from '@/app/i18n'

interface StorageDirCreateDialog extends Dialog<DialogParams, DialogResult | undefined>, StorageDirCreateDialog.Props {}

interface DialogParams {
  parentPath: string
  article?: DeepPartial<StorageArticleSettings>
}

interface DialogResult {
  dir: string
  name: string
}

namespace StorageDirCreateDialog {
  export interface Props {
    storageType: StorageType
  }

  export const clazz = defineComponent({
    name: 'StorageDirCreateDialog',

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
    const base = Dialog.setup<DialogResult | undefined>(dialog)
    const pageService = StoragePageService.getInstance(props.storageType)
    const i18n = useI18n()

    const dirNameInput = ref<QInput>()

    const state = reactive({
      article: undefined as DeepPartial<StorageArticleSettings> | undefined,
    })

    const parentNode: Ref<StorageNode | null> = ref(null)

    const icon = computed(() => {
      return pageService.getNodeTypeIcon({ nodeType: 'Dir', article: state.article })
    })

    const iconSize = computed(() => {
      return isFontAwesome(icon.value) ? '20px' : '24px'
    })

    const title = computed(() => {
      const nodeTypeLabel = pageService.getNodeTypeLabel({ nodeType: 'Dir', article: state.article })
      return String(i18n.t('common.createSth', { sth: nodeTypeLabel }))
    })

    const dirName = ref<string | null>(null)

    const parentPath = computed(() => {
      if (!parentNode.value) {
        return _path.join(pageService.getRootTreeNode().label, '/')
      } else {
        return _path.join(pageService.getRootTreeNode().label, pageService.getDisplayNodePath(parentNode.value), '/')
      }
    })

    const errorMessage = ref('')

    const isError = computed(() => !validate())

    //----------------------------------------------------------------------
    //
    //  Methods
    //
    //----------------------------------------------------------------------

    const open: StorageDirCreateDialog['open'] = params => {
      if (params.parentPath === pageService.getRootTreeNode().path) {
        parentNode.value = null
      } else {
        parentNode.value = pageService.sgetStorageNode({ path: params.parentPath })
      }

      state.article = params.article

      return base.open()
    }

    const close: StorageDirCreateDialog['close'] = result => {
      clear()
      base.close(result)
    }

    //----------------------------------------------------------------------
    //
    //  Internal methods
    //
    //----------------------------------------------------------------------

    async function create(): Promise<void> {
      dirName.value = dirName.value === null ? '' : dirName.value
      if (!validate()) return

      let dialogResult: DialogResult
      if (!parentNode.value) {
        dialogResult = { dir: '', name: dirName.value! }
      } else {
        dialogResult = { dir: parentNode.value.path, name: dirName.value! }
      }
      close(dialogResult)
    }

    function clear(): void {
      dirName.value = null
      dirNameInput.value!.resetValidation()
    }

    function validate(): boolean {
      // ディレクトリ名必須入力チェック
      if (dirName.value === '') {
        const target = String(i18n.t('common.sthName', { sth: StorageNodeType.getLabel('Dir') }))
        errorMessage.value = String(i18n.t('error.required', { target }))
        return false
      }

      // 禁則文字チェック
      if (dirName.value) {
        const matched = dirName.value.match(/\r?\n|\t|\//g)
        if (matched) {
          errorMessage.value = String(i18n.t('error.unusable', { target: matched[0] }))
          return false
        }
      }

      // 作成しようとする名前のディレクトリが存在しないことをチェック
      const siblingNodes = pageService.getStorageChildren(parentNode.value ? parentNode.value.path : '')
      for (const siblingNode of siblingNodes) {
        if (siblingNode.name === dirName.value) {
          const nodeTypeName = i18n.tc('common.folder', 1)
          errorMessage.value = String(i18n.t('storage.nodeAlreadyExists', { nodeName: dirName.value, nodeType: nodeTypeName }))
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
      dirNameInput.value!.focus()
    }

    //----------------------------------------------------------------------
    //
    //  Result
    //
    //----------------------------------------------------------------------

    return {
      ...base,
      ...i18n,
      dirNameInput,
      icon,
      iconSize,
      title,
      dirName,
      parentPath,
      errorMessage,
      isError,
      open,
      close,
      create,
      dialogOnShow,
    }
  }
}

export default StorageDirCreateDialog.clazz
export { StorageDirCreateDialog }
</script>
