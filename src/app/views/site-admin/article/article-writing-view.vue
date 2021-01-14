<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.ArticleWritingView
  position: relative
</style>

<template>
  <div class="ArticleWritingView layout vertical">
    <transition appear enter-active-class="animated fadeIn" leave-active-class="animated fadeOut">
      <MarkdownEditor ref="editor" v-model="draft.modifiedContent" class="flex-1" />
    </transition>
    <div class="layout horizontal end-justified">
      <q-btn flat rounded color="primary" :label="t('article.reflectMaster')" @click="reflectMaster" />
      <q-btn flat rounded color="primary" :label="t('article.saveDraft')" :disable="!isDraftModified" @click="saveDraft" />
    </div>
    <q-inner-loading :showing="spinning">
      <q-spinner size="50px" color="primary" />
    </q-inner-loading>
  </div>
</template>

<script lang="ts">
import { StorageNode, StorageType } from '@/app/logic'
import { computed, defineComponent, ref, watch } from '@vue/composition-api'
import { MarkdownEditor } from '@/app/components/markdown-editor'
import { StoragePageLogic } from '@/app/views/base/storage'
import { useI18n } from '@/app/i18n'

interface ArticleWritingView extends ArticleWritingView.Props {
  load(articlePath: string): Promise<void>
}

namespace ArticleWritingView {
  export interface Props {
    readonly storageType: StorageType
  }

  interface SrcFileInfo {
    node: StorageNode
    content: string
  }

  interface DraftFileInfo {
    node: StorageNode
    modifiedContent: string
    content: string
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

      const spinning = ref(false)

      const editor = ref<MarkdownEditor>()

      const src = ref<SrcFileInfo>({
        node: null as any,
        content: '',
      })

      const draft = ref<DraftFileInfo>({
        node: null as any,
        modifiedContent: '',
        content: '',
      })

      const isDraftModified = computed<boolean>(() => {
        const { content, modifiedContent } = draft.value
        return content !== modifiedContent
      })

      //----------------------------------------------------------------------
      //
      //  Methods
      //
      //----------------------------------------------------------------------

      function clear(): void {
        src.value.node = null as any
        src.value.content = ''

        draft.value.node = null as any
        draft.value.content = ''
        draft.value.modifiedContent = ''

        editor.value!.clear()
      }

      const load: ArticleWritingView['load'] = async articlePath => {
        spinning.value = true
        clear()

        // 記事ソースを取得
        await (async () => {
          const node = pageLogic.getStorageChildren(articlePath).find(node => Boolean(node.article?.src))
          if (!node) {
            throw new Error(`Src file node was not found: '${articlePath}'`)
          }
          src.value.node = node

          const downloader = pageLogic.newFileDownloader('firebase', src.value.node.path)
          const content = await downloader.execute('text')
          src.value.content = content ?? ''
        })()

        // 下書きのソースを取得
        await (async () => {
          const node = pageLogic.getStorageChildren(articlePath).find(node => Boolean(node.article?.draft))!
          if (!node) {
            throw new Error(`Draft file node was not found: '${articlePath}'`)
          }
          draft.value.node = node

          const downloader = pageLogic.newFileDownloader('firebase', draft.value.node.path)
          const content = await downloader.execute('text')
          draft.value.content = content ?? ''

          const localDraftData = getLocalDraftData()
          if (draft.value.node.version === localDraftData.version) {
            draft.value.modifiedContent = localDraftData.content
          } else {
            // 下書きが行われていない場合
            if (draft.value.content === '') {
              draft.value.modifiedContent = src.value.content
            }
            // 下書きが行われている場合
            else {
              draft.value.modifiedContent = draft.value.content
            }
          }
        })()

        spinning.value = false
      }

      //----------------------------------------------------------------------
      //
      //  Internal methods
      //
      //----------------------------------------------------------------------

      async function reflectMaster(): Promise<void> {
        spinning.value = true

        // try {
        //   // 下書きの内容を記事ソースへ移す
        //   const uploader = pageLogic.newFileUploader({
        //     data: draftSrc.value,
        //     name: srcNode.value.name,
        //     dir: srcNode.value.dir,
        //     contentType: srcNode.value.contentType,
        //   })
        //   await uploader.execute()
        // } catch (err) {
        //   pageLogic.showNotification('error', String(t('article.publishError')))
        // }

        spinning.value = false
      }

      async function saveDraft(): Promise<void> {
        spinning.value = true

        draft.value.node = await pageLogic.saveDraftArticle(draft.value.node, draft.value.modifiedContent)
        draft.value.content = draft.value.modifiedContent

        spinning.value = false
      }

      function setLocalDraftData(content: string): void {
        localStorage.setItem(`article.draft.${draft.value.node.id}.version`, String(draft.value.node.version))
        localStorage.setItem(`article.draft.${draft.value.node.id}.content`, content)
      }

      function getLocalDraftData(): { version: number; content: string } {
        const version = parseInt(localStorage.getItem(`article.draft.${draft.value.node.id}.version`) ?? '')
        const content = localStorage.getItem(`article.draft.${draft.value.node.id}.content`) ?? ''
        return { version, content }
      }

      //----------------------------------------------------------------------
      //
      //  Event listeners
      //
      //----------------------------------------------------------------------

      watch(
        () => draft.value.modifiedContent,
        (newValue, oldValue) => {
          if (!draft.value.node) return
          setLocalDraftData(newValue)
        }
      )

      //----------------------------------------------------------------------
      //
      //  Result
      //
      //----------------------------------------------------------------------

      return {
        t,
        editor,
        draft,
        isDraftModified,
        spinning,
        load,
        reflectMaster,
        saveDraft,
      }
    },
  })
}

export default ArticleWritingView.clazz
export { ArticleWritingView }
</script>
