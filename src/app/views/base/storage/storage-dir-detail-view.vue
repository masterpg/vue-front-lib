<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.StorageDirDetailView
  width: 100%

.content-area
  overflow-y: auto
  > *
    margin-top: 20px

.node-icon
  margin-top: 10px
  margin-right: 10px

.node-label
  @extend %text-subtitle1
  font-weight: map-get($text-weights, "bold")
  overflow-wrap: anywhere
  margin-top: 7px

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
    <div class="layout horizontal start">
      <q-icon :name="icon" :size="iconSize" class="node-icon" />
      <div class="node-label flex-1">{{ label }}</div>
      <q-btn flat round color="primary" icon="close" @click="closeOnClick" />
    </div>
    <!-- コンテンツエリア -->
    <div class="content-area flex-1" style="overflow-y: auto">
      <!-- ダウンロード -->
      <div class="layout horizontal center end-justified app-mt-10">
        <q-linear-progress ref="downloadLinear" :value="progress" :stripe="running" size="md" class="flex-1" />
        <!-- ダウンロードボタン -->
        <div v-if="!running" class="btn app-ml-10" @click="download()">{{ t('common.download') }}</div>
        <!-- キャンセルボタン -->
        <div v-else class="btn app-ml-10" @click="cancel()">{{ t('common.cancel') }}</div>
      </div>
      <!-- ノード詳細 -->
      <div class="layout vertical">
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
          <div class="value">{{ type }}</div>
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
import { StorageNode, StorageType, useService } from '@/app/services'
import { Dialog } from '@/app/components/dialog'
import { QLinearProgress } from 'quasar'
import { StoragePageService } from '@/app/views/base/storage/storage-page-service'
import _bytes from 'bytes'
import anime from 'animejs'
import { isFontAwesome } from '@/app/base'
import { removeBothEndsSlash } from 'web-base-lib'
import { useConfig } from '@/app/config'
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

    const pageService = StoragePageService.getInstance(props.storageType)
    const config = useConfig()
    const services = useService()
    const i18n = useI18n()

    const downloadLinear = ref<QLinearProgress>()

    const downloader = pageService.newDownloader()

    const dirNode: Ref<StorageNode | null> = ref(null)

    const icon = computed(() => {
      if (!dirNode.value) return ''
      return pageService.getNodeIcon(dirNode.value)
    })

    const iconSize = computed(() => {
      return isFontAwesome(icon.value) ? '20px' : '24px'
    })

    const label = computed(() => {
      if (!dirNode.value) return ''
      return pageService.getDisplayNodeName(dirNode.value)
    })

    const id = computed(() => {
      if (!dirNode.value) return ''
      return dirNode.value.id
    })

    const path = computed(() => {
      if (!dirNode.value) return ''
      if (config.env.mode === 'dev' || services.auth.user.isAppAdmin) {
        return pageService.toFullPath(dirNode.value.path)
      } else {
        return dirNode.value.path
      }
    })

    const displayPath = computed(() => {
      if (!dirNode.value) return ''
      if (props.storageType !== 'article') return ''
      return pageService.getDisplayNodePath(dirNode.value)
    })

    const type = computed(() => {
      if (!dirNode.value) return ''
      return pageService.getNodeTypeLabel(dirNode.value)
    })

    const size = computed(() => {
      if (!dirNode.value) return ''
      return _bytes(dirNode.value.size)
    })

    const share = computed(() => {
      if (!dirNode.value) return ''

      let result = ''

      if (dirNode.value.share.isPublic === null) {
        const inheritedShare = pageService.getInheritedShare(dirNode.value.path)
        if (inheritedShare.isPublic) {
          result = `${i18n.t('storage.share.public')}`
        } else {
          result = `${i18n.t('storage.share.private')}`
        }
        result += ` (${i18n.t('storage.share.notSet')})`
      } else {
        if (dirNode.value.share.isPublic) {
          result = `${i18n.t('storage.share.public')}`
        } else {
          result = `${i18n.t('storage.share.private')}`
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
      return `${i18n.d(dirNode.value.createdAt.toDate(), 'dateSec')}`
    })

    const updatedAt = computed(() => {
      if (!dirNode.value) return ''
      return `${i18n.d(dirNode.value.updatedAt.toDate(), 'dateSec')}`
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

      dirNode.value = pageService.sgetStorageNode({ path: dirPath })
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
      await pageService.fetchStorageChildren({ path: dirNode.value!.path })

      // ダウンロード進捗バーを表示
      showDownloadProgress(true, async () => {
        // ダウンロード実行
        const iterator = downloader.download('firebase', dirNode.value!.path)
        for (const downloader of iterator) {
          const responseData = await downloader.execute('blob')
          if (downloader.canceled) continue
          if (downloader.failed) {
            const message = String(i18n.t('storage.download.downloadFailure', { nodeName: downloader.name }))
            pageService.showNotification('warning', message)
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
      ...i18n,
      downloadLinear,
      icon,
      iconSize,
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
