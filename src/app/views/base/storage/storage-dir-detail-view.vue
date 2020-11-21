<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.StorageDirDetailView
  width: 100%
  padding: 0 16px 16px 32px

.content-area
  overflow-y: auto
  > *
    margin-top: 20px

.node-label
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
  <div class="StorageDirDetailView layout vertical">
    <!-- ノード名 -->
    <div class="layout horizontal center">
      <q-icon :name="icon" size="24px" class="app-mr-12" />
      <div class="node-label flex-1">{{ label }}</div>
      <q-btn flat round color="primary" icon="close" @click="closeOnClick" />
    </div>
    <!-- コンテンツエリア -->
    <div class="content-area flex-1" style="overflow-y: auto;">
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
          <div class="title">{{ this.$t('storage.nodeDetail.id') }}</div>
          <div class="value">{{ id }}</div>
        </div>
        <div class="item">
          <div class="title">{{ this.$t('storage.nodeDetail.path') }}</div>
          <div class="value">{{ path }}</div>
        </div>
        <div class="item" v-show="Boolean(displayPath)">
          <div class="title">{{ this.$t('storage.nodeDetail.displayPath') }}</div>
          <div class="value">{{ displayPath }}</div>
        </div>
        <div class="item">
          <div class="title">{{ this.$t('storage.nodeDetail.type') }}</div>
          <div class="value">{{ type }}</div>
        </div>
        <div class="item">
          <div class="title">{{ this.$t('storage.nodeDetail.size') }}</div>
          <div class="value">{{ size }} ({{ bytes }} bytes)</div>
        </div>
        <div class="item">
          <div class="title">{{ this.$t('storage.nodeDetail.share') }}</div>
          <div class="value">{{ share }}</div>
        </div>
        <div class="item">
          <div class="title">{{ this.$t('storage.nodeDetail.createdAt') }}</div>
          <div class="value">{{ createdAt }}</div>
        </div>
        <div class="item">
          <div class="title">{{ this.$t('storage.nodeDetail.updatedAt') }}</div>
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
import { StoragePageLogic } from '@/app/views/base/storage/storage-page-logic'
import _bytes from 'bytes'
import anime from 'animejs'
import { removeBothEndsSlash } from 'web-base-lib'
import { useI18n } from '@/app/i18n'

interface StorageDirDetailView extends Dialog<string[], boolean>, StorageDirDetailView.Props {
  /**
   * ビューに表示するディレクトリのパスを設定します。
   * @param dirPath
   */
  setNodePath(dirPath: string): void
}

namespace StorageDirDetailView {
  export interface Props {
    storageType: StorageType
  }

  export const clazz = defineComponent({
    name: 'StorageDirDetailView',

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

    const dirNode: Ref<StorageNode | null> = ref(null)

    const icon = computed(() => {
      if (!dirNode.value) return ''
      return pageLogic.getNodeIcon(dirNode.value)
    })

    const label = computed(() => {
      if (!dirNode.value) return ''
      return pageLogic.getDisplayNodeName(dirNode.value)
    })

    const id = computed(() => {
      if (!dirNode.value) return ''
      return dirNode.value.id
    })

    const path = computed(() => {
      if (!dirNode.value) return ''
      return dirNode.value.path
    })

    const displayPath = computed(() => {
      if (!dirNode.value) return ''
      if (props.storageType !== 'article') return ''
      return pageLogic.getDisplayNodePath(dirNode.value)
    })

    const type = computed(() => {
      if (!dirNode.value) return ''
      return pageLogic.getNodeTypeLabel(dirNode.value)
    })

    const size = computed(() => {
      if (!dirNode.value) return ''
      return _bytes(dirNode.value.size)
    })

    const share = computed(() => {
      if (!dirNode.value) return ''

      let result = ''

      if (dirNode.value.share.isPublic === null) {
        const inheritedShare = pageLogic.getInheritedShare(dirNode.value.path)
        if (inheritedShare.isPublic) {
          result = `${t('storage.share.public')}`
        } else {
          result = `${t('storage.share.private')}`
        }
        result += ` (${t('storage.share.notSet')})`
      } else {
        if (dirNode.value.share.isPublic) {
          result = `${t('storage.share.public')}`
        } else {
          result = `${t('storage.share.private')}`
        }
      }

      return result
    })

    const bytes = computed(() => {
      if (!dirNode.value) return ''
      return dirNode.value.size.toLocaleString()
    })

    const createdAt = computed(() => {
      if (!dirNode.value) return ''
      return `${d(dirNode.value.createdAt.toDate(), 'dateSec')}`
    })

    const updatedAt = computed(() => {
      if (!dirNode.value) return ''
      return `${d(dirNode.value.updatedAt.toDate(), 'dateSec')}`
    })

    const progress = computed(() => downloader.progress.value)

    const running = computed(() => downloader.running.value)

    //----------------------------------------------------------------------
    //
    //  Methods
    //
    //----------------------------------------------------------------------

    /**
     * ビューに表示するディレクトリのパスを設定します。
     * @param dirPath
     */
    const setNodePath: StorageDirDetailView['setNodePath'] = dirPath => {
      const clear = () => {
        dirNode.value = null
        ;(downloadLinear.value!.$el as HTMLElement).style.opacity = '0'
      }

      dirPath = removeBothEndsSlash(dirPath)
      if (dirNode.value?.path !== dirPath) {
        clear()
      }

      dirNode.value = pageLogic.sgetStorageNode({ path: dirPath })
    }

    //----------------------------------------------------------------------
    //
    //  Internal methods
    //
    //----------------------------------------------------------------------

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
      // 自ディレクトリ直下のノードをサーバーから取得しておく
      await pageLogic.fetchStorageChildren(dirNode.value!.path)

      // ダウンロード進捗バーを表示
      showDownloadProgress(true, async () => {
        // ダウンロード実行
        const iterator = downloader.download('firebase', dirNode.value!.path)
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
      icon,
      label,
      id,
      path,
      displayPath,
      type,
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

export default StorageDirDetailView.clazz
export { StorageDirDetailView }
</script>