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
          <q-item clickable v-close-popup @click="saveDraft" :disable="!enableSaveDraft">
            <q-item-section>
              <q-item-label>{{ t('article.saveDraft') }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item clickable v-close-popup @click="discardDraft" :disable="!enableDiscardDraft">
            <q-item-section>
              <q-item-label>{{ t('article.discardDraft') }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item clickable v-close-popup @click="saveMaster" :disable="!enableSaveMaster">
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
import { SaveArticleSrcMasterFileResult, StorageArticleFileType, StorageNode, StorageType } from '@/app/service'
import { computed, defineComponent, ref, watch } from '@vue/composition-api'
import { Dialogs } from '@/app/dialogs/dialogs.vue'
import { MarkdownEditor } from '@/app/components/markdown-editor'
import { StoragePageService } from '@/app/views/base/storage'
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

      const pageService = StoragePageService.getInstance(props.storageType)
      const i18n = useI18n()

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
      const enableSaveDraft = computed<boolean>(() => {
        // 画面の記事ソース編集内容とマスターの内容に差分があり、かつ下書きが編集されている場合
        return enableSaveMaster.value && draft.value.srcContent !== srcContent.value
      })

      /**
       * 下書きが行われており、下書き破棄が必要かを示すフラグです。
       */
      const enableDiscardDraft = computed<boolean>(() => {
        // 下書きが保存されている、または画面の記事ソース編集内容とマスターの内容に差分がある場合
        return Boolean(draft.value.srcContent) || enableSaveMaster.value
      })

      /**
       * 下書きをマスターへ反映する必要があるかを示すフラグです。
       */
      const enableSaveMaster = computed<boolean>(() => {
        // マスターの内容と画面の記事ソース編集内容に差分がある場合
        return master.value.srcContent !== srcContent.value
      })

      /**
       * 保存ドロップダウンボタンが有効かを示すフラグです。
       */
      const enableSaveDropdown = computed<boolean>(() => {
        return enableSaveMaster.value || enableSaveDraft.value || enableDiscardDraft.value
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
          const node = pageService.getStorageChildren(articlePath).find(node => node.article?.file?.type === 'Master')
          if (!node) {
            throw new Error(`Article source master file node was not found: '${articlePath}'`)
          }
          master.value.node = node

          const downloader = pageService.newFileDownloader('http', master.value.node.path)
          const srcContent = await downloader.execute('text')
          master.value.srcContent = srcContent ?? ''
        })()

        // 下書きのソースを取得
        await (async () => {
          const node = pageService.getStorageChildren(articlePath).find(node => node.article?.file?.type === 'Draft')
          if (!node) {
            throw new Error(`Article source draft file node was not found: '${articlePath}'`)
          }
          draft.value.node = node

          const downloader = pageService.newFileDownloader('http', draft.value.node.path)
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
          savedNode = await pageService.saveArticleSrcDraftFile(draft.value.node.dir, srcContent.value)
        } catch (err) {
          console.error(err)
          pageService.showNotification('error', String(i18n.t('article.saveDraftError')))
        }
        draft.value.node = savedNode
        draft.value.srcContent = srcContent.value
        discardLocalDraftData()

        spinning.value = false
      }

      async function discardDraft(): Promise<void> {
        const confirmed = await Dialogs.message.open({
          type: 'confirm',
          message: String(i18n.t('article.discardDraftQ')),
        })
        if (!confirmed) return

        spinning.value = true

        let discardedNode!: StorageNode
        try {
          discardedNode = await pageService.saveArticleSrcDraftFile(draft.value.node.dir, '')
        } catch (err) {
          console.error(err)
          pageService.showNotification('error', String(i18n.t('article.discardDraftError')))
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
          message: String(i18n.t('article.reflectMasterQ')),
        })
        if (!confirmed) return

        spinning.value = true

        let saved!: SaveArticleSrcMasterFileResult
        try {
          saved = await pageService.saveArticleSrcMasterFile(draft.value.node.dir, srcContent.value, editor.value!.getTextContent())
        } catch (err) {
          pageService.showNotification('error', String(i18n.t('article.reflectMasterError')))
        }
        master.value.node = saved.master
        master.value.srcContent = srcContent.value
        draft.value.node = saved.draft
        draft.value.srcContent = ''
        discardLocalDraftData()

        spinning.value = false
      }

      function getLocalDraftData(): { version: number; srcContent: string } {
        return pageService.getLocalArticleDraftData(draft.value.node.id)
      }

      function setLocalDraftData(): void {
        if (!master.value.node || !draft.value.node) return

        if (enableSaveMaster.value || enableSaveDraft.value || enableDiscardDraft.value) {
          // ローカルストレージに編集中の内容を保存
          pageService.setLocalArticleDraftData(draft.value.node.id, {
            version: draft.value.node.version,
            srcContent: srcContent.value,
          })
        } else {
          // ローカルストレージを破棄
          discardLocalDraftData()
        }
      }

      function discardLocalDraftData(): void {
        pageService.discardLocalArticleDraftData(draft.value.node.id)
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
        ...i18n,
        editor,
        srcContent,
        enableSaveMaster,
        enableSaveDraft,
        enableDiscardDraft,
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
