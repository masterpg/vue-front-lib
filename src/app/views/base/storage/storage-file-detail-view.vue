<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.StorageFileNodeView
  width: 100%
  padding: 0 16px 16px 32px

.content-area
  overflow-y: auto
  > *
    margin-top: 20px

.node-name
  @extend %text-h6
  word-break: break-all

.img
  --img-max-height: 300px

.item
  @extend %layout-horizontal
  &:not(:first-child)
    margin-top: 10px
  .title
    @extend %app-item-title
    width: 100px
  .value
    @extend %app-item-value
    @extend %layout-flex-1
    word-break: break-all
    &.link
      @extend %app-link

.btn
  @extend %app-link
  &[disabled]
    pointer-events: none
</style>

<template>
  <div class="StorageFileNodeView layout vertical">
    <!-- ノード名 -->
    <div class="layout horizontal center">
      <q-icon :name="icon" :size="iconSize" class="app-mr-12" />
      <div class="node-name flex-1">{{ fileName }}</div>
      <q-btn flat round color="primary" icon="close" @click="closeOnClick" />
    </div>
    <!-- コンテンツエリア -->
    <div class="content-area flex-1" style="overflow-y: auto">
      <!-- 画像 -->
      <div v-show="isImage" class="layout vertical center">
        <StorageImg :node-id="isImage ? id : ''" class="img" />
      </div>
      <!-- テキストデータ -->
      <q-input v-show="isText" v-model="textData" type="textarea" readonly filled />
      <!-- ダウンロード -->
      <div class="layout horizontal center end-justified app-mt-10">
        <q-linear-progress ref="downloadLinear" :value="progress" :stripe="running" size="md" class="flex-1" />
        <!-- ダウンロードボタン -->
        <div v-if="!running" class="btn app-ml-10" @click="download()">{{ $t('common.download') }}</div>
        <!-- キャンセルボタン -->
        <div v-else class="btn app-ml-10" @click="cancel()">{{ $t('common.cancel') }}</div>
      </div>
      <!-- ノード詳細 -->
      <div class="layout vertical">
        <div class="item">
          <div class="title">{{ t('storage.nodeDetail.url') }}</div>
          <a class="value link" :href="url" target="_blank">{{ url }}</a>
        </div>
        <div class="item">
          <div class="title">{{ t('storage.nodeDetail.id') }}</div>
          <div class="value">{{ id }}</div>
        </div>
        <div class="item">
          <div class="title">{{ t('storage.nodeDetail.path') }}</div>
          <div class="value">{{ path }}</div>
        </div>
        <div class="item" v-show="Boolean(displayPath)">
          <div class="title">{{ t('storage.nodeDetail.displayPath') }}</div>
          <div class="value">{{ displayPath }}</div>
        </div>
        <div class="item">
          <div class="title">{{ t('storage.nodeDetail.type') }}</div>
          <div class="value">{{ contentType }}</div>
        </div>
        <div class="item">
          <div class="title">{{ t('storage.nodeDetail.size') }}</div>
          <div class="value">{{ size }} ({{ bytes }} bytes)</div>
        </div>
        <div class="item">
          <div class="title">{{ t('storage.nodeDetail.share') }}</div>
          <div class="value">{{ share }}</div>
        </div>
        <div class="item">
          <div class="title">{{ t('storage.nodeDetail.createdAt') }}</div>
          <div class="value">{{ createdAt }}</div>
        </div>
        <div class="item">
          <div class="title">{{ t('storage.nodeDetail.updatedAt') }}</div>
          <div class="value">{{ updatedAt }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Ref, SetupContext, computed, defineComponent, ref } from '@vue/composition-api'
import { StorageNode, StorageType } from '@/app/logic'
import { Dialog } from '@/app/components/dialog'
import { QLinearProgress } from 'quasar'
import { StorageImg } from '@/app/components/storage/storage-img.vue'
import { StoragePageLogic } from '@/app/views/base/storage/storage-page-logic'
import _bytes from 'bytes'
import anime from 'animejs'
import { isFontAwesome } from '@/app/base'
import { removeBothEndsSlash } from 'web-base-lib'
import { useI18n } from '@/app/i18n'

interface StorageFileDetailView extends Dialog<string[], boolean>, StorageFileDetailView.Props {
  /**
   * ビューに表示するファイルのパスを設定します。
   * @param filePath
   */
  setNodePath(filePath: string): void
}

namespace StorageFileDetailView {
  export interface Props {
    storageType: StorageType
  }

  export const clazz = defineComponent({
    name: 'StorageFileDetailView',

    components: {
      StorageImg: StorageImg.clazz,
    },

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

    const pageLogic = StoragePageLogic.getInstance(props.storageType)
    const { t, d } = useI18n()

    const downloadLinear = ref<QLinearProgress>()

    const downloader = pageLogic.newDownloader()

    const fileNode: Ref<StorageNode | null> = ref(null)

    const textData: Ref<string | null> = ref(null)

    const icon = computed(() => {
      if (!fileNode.value) return ''
      return pageLogic.getNodeIcon(fileNode.value)
    })

    const iconSize = computed(() => {
      return isFontAwesome(icon.value) ? '20px' : '24px'
    })

    const isImage = computed(() => {
      if (!fileNode.value) return false
      return fileNode.value.contentType.startsWith('image/')
    })

    const isText = computed(() => {
      if (!fileNode.value) return false
      return fileNode.value.contentType.startsWith('text/')
    })

    const url = computed(() => {
      if (!fileNode.value) return ''
      return fileNode.value.url
    })

    const id = computed(() => {
      if (!fileNode.value) return ''
      return fileNode.value.id
    })

    const path = computed(() => {
      if (!fileNode.value) return ''
      return fileNode.value.path
    })

    const displayPath = computed(() => {
      if (!fileNode.value) return ''
      if (props.storageType !== 'article') return ''
      return pageLogic.getDisplayNodePath(fileNode.value)
    })

    const fileName = computed(() => {
      if (!fileNode.value) return ''
      return fileNode.value.name
    })

    const contentType = computed(() => {
      if (!fileNode.value) return ''
      return fileNode.value.contentType
    })

    const size = computed(() => {
      if (!fileNode.value) return ''
      return _bytes(fileNode.value.size)
    })

    const share = computed(() => {
      if (!fileNode.value) return ''

      let result = ''

      if (fileNode.value.share.isPublic === null) {
        const inheritedShare = pageLogic.getInheritedShare(fileNode.value.path)
        if (inheritedShare.isPublic) {
          result = `${t('storage.share.public')}`
        } else {
          result = `${t('storage.share.private')}`
        }
        result += ` (${t('storage.share.notSet')})`
      } else {
        if (fileNode.value.share.isPublic) {
          result = `${t('storage.share.public')}`
        } else {
          result = `${t('storage.share.private')}`
        }
      }

      return result
    })

    const bytes = computed(() => {
      if (!fileNode.value) return ''
      return fileNode.value.size.toLocaleString()
    })

    const createdAt = computed(() => {
      if (!fileNode.value) return ''
      return `${d(fileNode.value.createdAt.toDate(), 'dateSec')}`
    })

    const updatedAt = computed(() => {
      if (!fileNode.value) return ''
      return `${d(fileNode.value.updatedAt.toDate(), 'dateSec')}`
    })

    const progress = computed(() => downloader.progress.value)

    const running = computed(() => downloader.running.value)

    //----------------------------------------------------------------------
    //
    //  Methods
    //
    //----------------------------------------------------------------------

    /**
     * ビューに表示するファイルのパスを設定します。
     * @param filePath
     */
    const setNodePath: StorageFileDetailView['setNodePath'] = filePath => {
      const clear = () => {
        fileNode.value = null
        textData.value = ''
        ;(downloadLinear.value!.$el as HTMLElement).style.opacity = '0'
      }

      filePath = removeBothEndsSlash(filePath)
      if (fileNode.value?.path !== filePath) {
        clear()
      }

      fileNode.value = pageLogic.sgetStorageNode({ path: filePath })

      if (isText.value) {
        loadTextFile()
      }
    }

    //----------------------------------------------------------------------
    //
    //  Internal methods
    //
    //----------------------------------------------------------------------

    async function loadTextFile(): Promise<void> {
      const downloader = pageLogic.newFileDownloader('http', fileNode.value!.path)
      const text = await downloader.execute('text')
      textData.value = text ?? ''
    }

    /**
     * ダウンロード進捗バーの表示/非表示を行います。
     * @param isShow 表示/非表示を指定
     * @param complete 表示/非表示後に行う処理のコールバック関数を指定
     */
    function showDownloadProgress(isShow: boolean, complete?: () => void): void {
      anime({
        targets: downloadLinear.value!.$el,
        opacity: isShow ? 1 : 0,
        duration: isShow ? 250 : 500,
        easing: 'easeInOutQuad',
        complete,
      })
    }

    //----------------------------------------------------------------------
    //
    //  Event listeners
    //
    //----------------------------------------------------------------------

    function closeOnClick() {
      ctx.emit('close')
    }

    async function download() {
      // ダウンロード進捗バーを表示
      showDownloadProgress(true, async () => {
        // ダウンロード実行
        const iterator = downloader.download('firebase', fileNode.value!.path)
        for (const downloader of iterator) {
          const responseData = await downloader.execute('blob')
          if (downloader.canceled) continue
          if (downloader.failed) {
            const message = String(t('storage.download.downloadFailure', { nodeName: downloader.name }))
            pageLogic.showNotification('warning', message)
            continue
          }
          // ダウンロードされたファイルをブラウザ経由でダウンロード
          const anchor = document.createElement('a')
          anchor.href = window.URL.createObjectURL(responseData)
          anchor.download = downloader.name
          anchor.click()
        }
        // ダウンロード進捗バーの非表示後にダウンロード進捗をクリア
        showDownloadProgress(false, () => {
          downloader.clear()
        })
      })
    }

    function cancel() {
      downloader.cancel()
      showDownloadProgress(false, () => {
        downloader.clear()
      })
    }

    //----------------------------------------------------------------------
    //
    //  Result
    //
    //----------------------------------------------------------------------

    return {
      t,
      downloadLinear,
      textData,
      icon,
      iconSize,
      isImage,
      isText,
      url,
      id,
      path,
      displayPath,
      fileName,
      contentType,
      size,
      share,
      bytes,
      createdAt,
      updatedAt,
      progress,
      running,
      setNodePath,
      closeOnClick,
      download,
      cancel,
    }
  }
}

export default StorageFileDetailView.clazz
export { StorageFileDetailView }
</script>
