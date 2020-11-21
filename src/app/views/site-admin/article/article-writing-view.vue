<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.ArticleWritingView
  position: relative
</style>

<template>
  <div class="ArticleWritingView layout vertical">
    <transition appear enter-active-class="animated fadeIn" leave-active-class="animated fadeOut">
      <MarkdownEditor ref="editor" v-model="mdSrc" class="flex-1" />
    </transition>
    <div class="layout horizontal end-justified">
      <q-btn flat rounded color="primary" :label="t('common.save')" @click="save" />
    </div>
    <q-inner-loading :showing="spinning">
      <q-spinner size="50px" color="primary" />
    </q-inner-loading>
  </div>
</template>

<script lang="ts">
import { Ref, defineComponent, ref } from '@vue/composition-api'
import { StorageNode, StorageNodeType, StorageType } from '@/app/logic'
import { MarkdownEditor } from '@/app/components/markdown-editor'
import { StoragePageLogic } from '@/app/views/base/storage'
import { sleep } from 'web-base-lib'
import { useI18n } from '@/app/i18n'

interface ArticleWritingView extends ArticleWritingView.Props {
  load(filePath: string): Promise<void>
}

namespace ArticleWritingView {
  export interface Props {
    readonly storageType: StorageType
  }

  export const clazz = defineComponent({
    name: 'ArticleWritingView',

    components: {
      MarkdownEditor: MarkdownEditor.clazz,
    },

    props: {
      storageType: { type: String, required: true },
    },

    setup(props: Props, ctx) {
      //----------------------------------------------------------------------
      //
      //  Variables
      //
      //----------------------------------------------------------------------

      const pageLogic = StoragePageLogic.getInstance(props.storageType)
      const { t } = useI18n()

      const editor = ref<MarkdownEditor>()

      // const mdSrc = ref(cheatSheet)
      const mdSrc = ref('')

      const fileNode: Ref<StorageNode> = ref(null as any)

      const spinning = ref(false)

      //----------------------------------------------------------------------
      //
      //  Methods
      //
      //----------------------------------------------------------------------

      const load: ArticleWritingView['load'] = async filePath => {
        editor.value!.clear()
        spinning.value = true

        fileNode.value = pageLogic.sgetStorageNode({ path: filePath })
        if (fileNode.value.nodeType !== StorageNodeType.File) {
          throw new Error(`The specified node is not a file: '${filePath}'`)
        }

        const downloader = pageLogic.newFileDownloader('firebase', fileNode.value.path)
        const text = await downloader.execute('text')
        mdSrc.value = text ?? ''

        spinning.value = false
      }

      //----------------------------------------------------------------------
      //
      //  Internal methods
      //
      //----------------------------------------------------------------------

      async function save(): Promise<void> {
        spinning.value = true

        const uploader = pageLogic.newFileUploader({
          data: mdSrc.value,
          name: fileNode.value.name,
          dir: fileNode.value.dir,
          contentType: fileNode.value.contentType,
        })

        try {
          await uploader.execute()
        } catch (err) {
          // TODO 仮のエラーメッセージ
          pageLogic.showNotification('error', `記事の保存に失敗しました`)
        }

        spinning.value = false
      }

      //----------------------------------------------------------------------
      //
      //  Result
      //
      //----------------------------------------------------------------------

      return {
        t,
        editor,
        mdSrc,
        spinning,
        load,
        save,
      }
    },
  })
}

export default ArticleWritingView.clazz
export { ArticleWritingView }
</script>
