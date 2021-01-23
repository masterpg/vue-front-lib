<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.ArticleWritingView
  position: relative

.editor
  border-bottom: 1px solid $grey-4

.control-area
  padding: 10px
</style>

<template>
  <div class="ArticleWritingView layout vertical">
    <transition appear enter-active-class="animated fadeIn" leave-active-class="animated fadeOut">
      <MarkdownEditor ref="editor" v-model="srcContent" class="editor flex-1" />
    </transition>
    <div class="control-area layout horizontal end-justified">
      <q-btn-dropdown color="primary" :label="t('common.save')" :disable="!enableSaveDropdown">
        <q-list>
          <q-item clickable v-close-popup @click="saveDraft" :disable="!needSaveDraft">
            <q-item-section>
              <q-item-label>{{ t('article.saveDraft') }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item clickable v-close-popup @click="discardDraft" :disable="!needDiscardDraft">
            <q-item-section>
              <q-item-label>{{ t('article.discardDraft') }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item clickable v-close-popup @click="saveMaster" :disable="!needSaveMaster">
            <q-item-section>
              <q-item-label>{{ t('article.reflectMaster') }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-btn-dropdown>
    </div>
    <q-inner-loading :showing="spinning">
      <q-spinner size="50px" color="primary" />
    </q-inner-loading>
  </div>
</template>

<script lang="ts">
import { SaveArticleSrcMasterFileResult, StorageArticleFileType, StorageNode, StorageType } from '@/app/logic'
import { computed, defineComponent, ref, watch } from '@vue/composition-api'
import { Dialogs } from '@/app/dialogs/dialogs.vue'
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
    srcContent: string
  }

  interface DraftFileInfo {
    node: StorageNode
    srcContent: string
  }

  export const clazz = defineComponent({
    name: 'ArticleWritingView',

    components: {
      MarkdownEditor: MarkdownEditor.clazz,
    },

    props: {
      storageType: { type: String, required: true },
    },

    setup(props: Readonly<Props>, ctx) {
      //----------------------------------------------------------------------
      //
      //  Variables
      //
      //----------------------------------------------------------------------

      const pageLogic = StoragePageLogic.getInstance(props.storageType)
      const { t } = useI18n()

      const spinning = ref(false)

      const editor = ref<MarkdownEditor>()

      const srcContent = ref('')

      const master = ref<SrcFileInfo>({
        node: null as any,
        srcContent: '',
      })

      const draft = ref<DraftFileInfo>({
        node: null as any,
        srcContent: '',
      })

      /**
       * 下書きが行われており、下書き保存が必要かを示すフラグ
       */
      const needSaveDraft = computed<boolean>(() => {
        // 画面の記事ソース編集内容とマスターの内容に差分があり、かつ下書きが編集されている場合
        return needSaveMaster.value && draft.value.srcContent !== srcContent.value
      })

      /**
       * 下書きが行われており、下書き破棄が必要かを示すフラグです。
       */
      const needDiscardDraft = computed<boolean>(() => {
        // 下書きが保存されている、または画面の記事ソース編集内容とマスターの内容に差分がある場合
        return Boolean(draft.value.srcContent) || needSaveMaster.value
      })

      /**
       * マスターの内容と画面の記事ソース編集内容に差分があった場合、
       * 編集内容をマスターへ反映する必要があることを示すフラグです。
       */
      const needSaveMaster = computed<boolean>(() => {
        return master.value.srcContent !== srcContent.value
      })

      /**
       * 保存ドロップダウンボタンが有効かを示すフラグです。
       */
      const enableSaveDropdown = computed<boolean>(() => {
        return needSaveMaster.value || needSaveDraft.value || needDiscardDraft.value
      })

      //----------------------------------------------------------------------
      //
      //  Methods
      //
      //----------------------------------------------------------------------

      function clear(): void {
        master.value.node = null as any
        master.value.srcContent = ''

        draft.value.node = null as any
        draft.value.srcContent = ''

        srcContent.value = ''

        editor.value!.clear()
      }

      const load: ArticleWritingView['load'] = async articlePath => {
        spinning.value = true
        clear()

        // 記事ソースを取得
        await (async () => {
          const node = pageLogic.getStorageChildren(articlePath).find(node => node.article?.file?.type === StorageArticleFileType.Master)
          if (!node) {
            throw new Error(`Article source master file node was not found: '${articlePath}'`)
          }
          master.value.node = node

          const downloader = pageLogic.newFileDownloader('firebase', master.value.node.path)
          const srcContent = await downloader.execute('text')
          master.value.srcContent = srcContent ?? ''
        })()

        // 下書きのソースを取得
        await (async () => {
          const node = pageLogic.getStorageChildren(articlePath).find(node => node.article?.file?.type === StorageArticleFileType.Draft)
          if (!node) {
            throw new Error(`Article source draft file node was not found: '${articlePath}'`)
          }
          draft.value.node = node

          const downloader = pageLogic.newFileDownloader('firebase', draft.value.node.path)
          draft.value.srcContent = (await downloader.execute('text')) ?? ''

          const localDraftData = getLocalDraftData()
          if (draft.value.node.version === localDraftData.version) {
            srcContent.value = localDraftData.srcContent
          } else {
            // 下書きが行われていない場合
            if (draft.value.srcContent === '') {
              srcContent.value = master.value.srcContent
            }
            // 下書きが行われている場合
            else {
              srcContent.value = draft.value.srcContent
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

      async function saveDraft(): Promise<void> {
        spinning.value = true

        let savedNode!: StorageNode
        try {
          savedNode = await pageLogic.saveArticleSrcDraftFile(draft.value.node.dir, srcContent.value)
        } catch (err) {
          console.error(err)
          pageLogic.showNotification('error', String(t('article.saveDraftError')))
        }
        draft.value.node = savedNode
        draft.value.srcContent = srcContent.value
        discardLocalDraftData()

        spinning.value = false
      }

      async function discardDraft(): Promise<void> {
        const confirmed = await Dialogs.message.open({
          type: 'confirm',
          message: String(t('article.discardDraftQ')),
        })
        if (!confirmed) return

        spinning.value = true

        let discardedNode!: StorageNode
        try {
          discardedNode = await pageLogic.saveArticleSrcDraftFile(draft.value.node.dir, '')
        } catch (err) {
          console.error(err)
          pageLogic.showNotification('error', String(t('article.discardDraftError')))
        }
        draft.value.node = discardedNode
        draft.value.srcContent = ''
        srcContent.value = master.value.srcContent
        discardLocalDraftData()

        spinning.value = false
      }

      async function saveMaster(): Promise<void> {
        const confirmed = await Dialogs.message.open({
          type: 'confirm',
          message: String(t('article.reflectMasterQ')),
        })
        if (!confirmed) return

        spinning.value = true

        let saved!: SaveArticleSrcMasterFileResult
        try {
          saved = await pageLogic.saveArticleSrcMasterFile(draft.value.node.dir, srcContent.value, editor.value!.getTextContent())
        } catch (err) {
          pageLogic.showNotification('error', String(t('article.reflectMasterError')))
        }
        master.value.node = saved.master
        master.value.srcContent = srcContent.value
        draft.value.node = saved.draft
        draft.value.srcContent = ''
        discardLocalDraftData()

        spinning.value = false
      }

      function getLocalDraftData(): { version: number; srcContent: string } {
        const version = parseInt(localStorage.getItem(`article.draft.${draft.value.node.id}.version`) ?? '')
        const srcContent = localStorage.getItem(`article.draft.${draft.value.node.id}.srcContent`) ?? ''
        return { version, srcContent }
      }

      function setLocalDraftData(): void {
        if (!master.value.node || !draft.value.node || !srcContent.value) return

        if (needSaveMaster.value || needSaveDraft.value || needDiscardDraft.value) {
          // ローカルストレージに編集中の内容を保存
          localStorage.setItem(`article.draft.${draft.value.node.id}.version`, String(draft.value.node.version))
          localStorage.setItem(`article.draft.${draft.value.node.id}.srcContent`, srcContent.value)
        } else {
          // ローカルストレージを破棄
          discardLocalDraftData()
        }
      }

      function discardLocalDraftData(): void {
        localStorage.removeItem(`article.draft.${draft.value.node.id}.version`)
        localStorage.removeItem(`article.draft.${draft.value.node.id}.srcContent`)
      }

      //----------------------------------------------------------------------
      //
      //  Event listeners
      //
      //----------------------------------------------------------------------

      watch(
        () => srcContent.value,
        (newValue, oldValue) => {
          if (!draft.value.node) return
          setLocalDraftData()
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
        srcContent,
        needSaveMaster,
        needSaveDraft,
        needDiscardDraft,
        enableSaveDropdown,
        spinning,
        load,
        saveMaster,
        saveDraft,
        discardDraft,
      }
    },
  })
}

export default ArticleWritingView.clazz
export { ArticleWritingView }
</script>
