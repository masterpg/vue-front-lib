<style lang="sass" scoped>
@import 'src/example/styles/app.variables'

.storage-dir-node-view-main
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
  --comp-img-max-height: 300px

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
  <div class="storage-dir-node-view-main layout vertical">
    <!-- ノード名 -->
    <div class="layout horizontal center">
      <q-icon :name="m_icon" size="24px" class="app-mr-12" />
      <div class="node-label flex-1">{{ m_label }}</div>
      <q-btn flat round color="primary" icon="close" @click="m_closeOnClick" />
    </div>
    <!-- コンテンツエリア -->
    <div class="content-area flex-1" style="overflow-y: auto;">
      <!-- ダウンロード -->
      <div class="layout horizontal center end-justified app-mt-10">
        <q-linear-progress ref="downloadLinear" :value="m_downloader.progress" :stripe="m_downloader.running" size="md" class="flex-1" />
        <!-- ダウンロードボタン -->
        <div v-if="!m_downloader.running" class="btn app-ml-10" @click="m_download()">{{ $t('common.download') }}</div>
        <!-- キャンセルボタン -->
        <div v-else class="btn app-ml-10" @click="m_cancel()">{{ $t('common.cancel') }}</div>
      </div>
      <!-- ノード詳細 -->
      <div class="layout vertical">
        <div class="item">
          <div class="title">{{ this.$t('storage.nodeDetail.id') }}</div>
          <div class="value">{{ m_id }}</div>
        </div>
        <div class="item">
          <div class="title">{{ this.$t('storage.nodeDetail.path') }}</div>
          <div class="value">{{ m_path }}</div>
        </div>
        <div class="item" v-show="Boolean(m_displayPath)">
          <div class="title">{{ this.$t('storage.nodeDetail.displayPath') }}</div>
          <div class="value">{{ m_displayPath }}</div>
        </div>
        <div class="item">
          <div class="title">{{ this.$t('storage.nodeDetail.type') }}</div>
          <div class="value">{{ m_type }}</div>
        </div>
        <div class="item">
          <div class="title">{{ this.$t('storage.nodeDetail.size') }}</div>
          <div class="value">{{ m_size }} ({{ m_bytes }} bytes)</div>
        </div>
        <div class="item">
          <div class="title">{{ this.$t('storage.nodeDetail.share') }}</div>
          <div class="value">{{ m_share }}</div>
        </div>
        <div class="item">
          <div class="title">{{ this.$t('storage.nodeDetail.createdAt') }}</div>
          <div class="value">{{ m_createdAt }}</div>
        </div>
        <div class="item">
          <div class="title">{{ this.$t('storage.nodeDetail.updatedAt') }}</div>
          <div class="value">{{ m_updatedAt }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import * as anime from 'animejs/lib/anime'
import { BaseComponent, NoCache, Resizable } from '@/example/base'
import { Component, Watch } from 'vue-property-decorator'
import { RequiredStorageNodeShareSettings, StorageDownloader, StorageNode } from '@/example/logic'
import { CompStorageImg } from '@/example/components'
import { QLinearProgress } from 'quasar'
import { StoragePageMixin } from './storage-page-mixin'
import bytes from 'bytes'
import { mixins } from 'vue-class-component'
import { removeBothEndsSlash } from 'web-base-lib'

@Component({
  components: { CompStorageImg },
})
export default class StorageDirDetailView extends mixins(BaseComponent, Resizable, StoragePageMixin) {
  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  created() {
    this.m_downloader = this.storageLogic.newDownloader()
  }

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  private m_dirNode: StorageNode | null = null

  get fileNode(): StorageNode | null {
    return this.m_dirNode
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private m_dirPath: string | null = null

  private get m_icon(): string {
    if (!this.m_dirNode) return ''
    return this.getNodeIcon(this.m_dirNode)
  }

  private get m_label(): string {
    if (!this.m_dirNode) return ''
    return this.getDisplayName(this.m_dirNode)
  }

  private get m_id(): string {
    if (!this.m_dirNode) return ''
    return this.m_dirNode.id
  }

  private get m_path(): string {
    if (!this.m_dirNode) return ''
    return this.m_dirNode.path
  }

  private get m_displayPath(): string {
    if (!this.m_dirNode) return ''
    if (this.storageType !== 'article') return ''
    return this.getDisplayPath(this.m_dirNode.path)
  }

  private get m_type(): string {
    if (!this.m_dirNode) return ''
    return this.getNodeTypeLabel(this.m_dirNode)
  }

  private get m_size(): string {
    if (!this.m_dirNode) return ''
    return bytes(this.m_dirNode.size)
  }

  private get m_share(): string {
    if (!this.m_dirNode) return ''

    let result = ''

    if (this.m_dirNode.share.isPublic === null) {
      if (this.m_inheritedShare.isPublic) {
        result = `${this.$t('storage.share.public')}`
      } else {
        result = `${this.$t('storage.share.private')}`
      }
      result += ` (${this.$t('storage.share.notSet')})`
    } else {
      if (this.m_dirNode.share.isPublic) {
        result = `${this.$t('storage.share.public')}`
      } else {
        result = `${this.$t('storage.share.private')}`
      }
    }

    return result
  }

  private get m_bytes(): string {
    if (!this.m_dirNode) return ''
    return this.m_dirNode.size.toLocaleString()
  }

  private get m_createdAt(): string {
    if (!this.m_dirNode) return ''
    return `${this.$d(this.m_dirNode.createdAt.toDate(), 'dateSec')}`
  }

  private get m_updatedAt(): string {
    if (!this.m_dirNode) return ''
    return `${this.$d(this.m_dirNode.updatedAt.toDate(), 'dateSec')}`
  }

  private m_inheritedShare: RequiredStorageNodeShareSettings = {} as any

  private m_downloader: StorageDownloader = {} as any

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

  @NoCache
  private get m_downloadLinear(): QLinearProgress {
    return this.$refs.downloadLinear as QLinearProgress
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  /**
   * ビューに表示するディレクトリのパスを設定します。
   * @param dirPath
   */
  setNodePath(dirPath: string): void {
    const clear = () => {
      this.m_dirNode = null
      ;(this.m_downloadLinear.$el as HTMLElement).style.opacity = '0'
    }

    dirPath = removeBothEndsSlash(dirPath)
    if (this.m_dirPath !== dirPath) {
      clear()
    }

    this.m_dirPath = dirPath
    this.m_dirNode = this.storageLogic.sgetNode({ path: dirPath })
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
  private m_showDownloadProgress(isShow: boolean, complete?: () => void): void {
    anime({
      targets: this.m_downloadLinear.$el,
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

  private m_closeOnClick() {
    this.$emit('close')
  }

  private async m_download() {
    // ダウンロード進捗バーを表示
    this.m_showDownloadProgress(true, async () => {
      // ダウンロード実行
      const iterator = this.m_downloader.download('firebase', this.m_dirNode!.path)
      for (const downloader of iterator) {
        const responseData = await downloader.execute('blob')
        if (downloader.canceled) continue
        if (downloader.failed) {
          const message = String(this.$t('storage.download.downloadFailure', { nodeName: downloader.name }))
          this.showNotification('warning', message)
          continue
        }
        // ダウンロードされたファイルをブラウザ経由でダウンロード
        const anchor = document.createElement('a')
        anchor.href = window.URL.createObjectURL(responseData)
        anchor.download = downloader.name
        anchor.click()
      }
      // ダウンロード進捗バーの非表示後にダウンロード進捗をクリア
      this.m_showDownloadProgress(false, () => {
        this.m_downloader.clear()
      })
    })
  }

  private m_cancel() {
    this.m_downloader.cancel()
    this.m_showDownloadProgress(false, () => {
      this.m_downloader.clear()
    })
  }

  @Watch('m_dirNode.share', { deep: true })
  private m_shareOnChange(): void {
    if (!this.m_dirNode) {
      this.m_inheritedShare = {} as any
      return
    }
    this.m_inheritedShare = this.storageLogic.getInheritedShare(this.m_dirNode.path)
  }
}
</script>
