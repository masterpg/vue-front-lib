<style lang="sass" scoped>
@import '../../../styles/app.variables'

.storage-file-node-view-main
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

.download-btn
  @extend %app-pseudo-link
</style>

<template>
  <div class="storage-file-node-view-main layout vertical">
    <!-- ノード名 -->
    <div class="layout horizontal center">
      <div class="node-name flex-1">{{ m_fileName }}</div>
      <q-btn flat round color="primary" icon="close" @click="m_closeOnClick" />
    </div>
    <!-- コンテンツエリア -->
    <div class="content-area flex-1" style="overflow-y: auto">
      <!-- 画像 -->
      <div v-show="m_isImage" class="layout vertical center">
        <comp-storage-img :src="m_url" class="img" />
      </div>
      <!-- テキストデータ -->
      <q-input v-show="m_isText" v-model="m_textData" type="textarea" readonly filled />
      <!-- ダウンロード -->
      <div class="layout horizontal center end-justified app-mt-10">
        <q-linear-progress
          ref="downloadLinear"
          :value="m_downloadProgress.progress"
          :stripe="m_downloadProgress.downloading"
          size="md"
          class="flex-1"
        />
        <div class="download-btn app-ml-10" :disabled="m_downloadProgress.downloading" @click="m_download()">{{ $t('common.download') }}</div>
      </div>
      <!-- ノード詳細 -->
      <div class="layout vertical">
        <div class="item">
          <div class="title">{{ this.$t('storage.nodeDetail.url') }}</div>
          <div class="value">{{ m_url }}</div>
        </div>
        <div class="item">
          <div class="title">{{ this.$t('storage.nodeDetail.path') }}</div>
          <div class="value">{{ m_path }}</div>
        </div>
        <div class="item">
          <div class="title">{{ this.$t('storage.nodeDetail.type') }}</div>
          <div class="value">{{ m_contentType }}</div>
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
          <div class="title">{{ this.$t('storage.nodeDetail.updated') }}</div>
          <div class="value">{{ m_updated }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import * as anime from 'animejs/lib/anime'
import { BaseComponent, Resizable } from '../../../../lib/base/component'
import { CompStorageImg, NoCache } from '@/lib'
import { Component } from 'vue-property-decorator'
import { QLinearProgress } from 'quasar'
import StorageTreeNode from '@/example/views/demo/storage/storage-tree-node.vue'
import { StorageTypeMixin } from '@/example/views/demo/storage/base'
import axios from 'axios'
import bytes from 'bytes'
import { mixins } from 'vue-class-component'
import { removeBothEndsSlash } from 'web-base-lib'

const EMPTY_DOWNLOAD_PROGRESS = { progress: 0, downloading: false }

@Component({
  components: { CompStorageImg },
})
export default class StorageNodeDetailView extends mixins(BaseComponent, Resizable, StorageTypeMixin) {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private m_nodePath: string | null = null

  private m_fileNode: StorageTreeNode | null = null

  private get m_isImage(): boolean {
    if (!this.m_fileNode) return false
    return this.m_fileNode.contentType.startsWith('image/')
  }

  private get m_isText(): boolean {
    if (!this.m_fileNode) return false
    return this.m_fileNode.contentType.startsWith('text/')
  }

  private get m_url(): string {
    if (!this.m_fileNode) return ''
    return this.m_fileNode.fileURL
  }

  private get m_fileName(): string {
    if (!this.m_fileNode) return ''
    return this.m_fileNode.label
  }

  private get m_contentType(): string {
    if (!this.m_fileNode) return ''
    return this.m_fileNode.contentType
  }

  private get m_size(): string {
    if (!this.m_fileNode) return ''
    return bytes(this.m_fileNode.size)
  }

  private get m_share(): string {
    if (!this.m_fileNode) return ''
    if (this.m_fileNode.share.isPublic) {
      return String(this.$t('storage.share.public'))
    } else {
      return String(this.$t('storage.share.private'))
    }
  }

  private get m_bytes(): string {
    if (!this.m_fileNode) return ''
    return this.m_fileNode.size.toLocaleString()
  }

  private get m_path(): string {
    if (!this.m_fileNode) return ''
    return this.m_fileNode.value
  }

  private get m_updated(): string {
    if (!this.m_fileNode) return ''
    return String(this.$d(this.m_fileNode.updatedDate.toDate(), 'dateSec'))
  }

  private m_textData: string | null = null

  private m_downloadProgress: { progress: number; downloading: boolean } = Object.assign({}, EMPTY_DOWNLOAD_PROGRESS)

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
   * ビューに表示するノードのパスを設定します。
   * @param nodePath
   */
  setNodePath(nodePath: string): void {
    const clear = () => {
      this.m_fileNode = null
      this.m_textData = ''
      this.m_downloadProgress = Object.assign({}, EMPTY_DOWNLOAD_PROGRESS)
      ;(this.m_downloadLinear.$el as HTMLElement).style.opacity = '0'
    }

    nodePath = removeBothEndsSlash(nodePath)
    if (this.m_nodePath !== nodePath) {
      clear()
    }

    this.m_nodePath = nodePath
    this.m_fileNode = this.treeStore.getNode(nodePath)!

    if (this.m_isText) {
      this.m_loadTextFile()
    }
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  private async m_loadTextFile(): Promise<void> {
    const authHeader = await this.m_getAuthHeader()

    const response = await axios.request({
      url: this.m_url,
      method: 'get',
      responseType: 'text',
      headers: { ...authHeader },
    })
    this.m_textData = response.data
  }

  /**
   * リクエスト用の認証ヘッダを取得します。
   */
  private async m_getAuthHeader(): Promise<{ Authorization?: string }> {
    const currentUser = firebase.auth().currentUser
    if (!currentUser) return {}

    const idToken = await currentUser.getIdToken()
    if (!idToken) return {}

    return {
      Authorization: `Bearer ${idToken}`,
    }
  }

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
    this.m_downloadProgress.downloading = true

    // 認証ヘッダの取得
    const authHeader = await this.m_getAuthHeader()

    // ダウンロード進捗バーを表示
    this.m_showDownloadProgress(true, async () => {
      // ダウンロード開始
      const response = await axios({
        url: this.m_url,
        method: 'GET',
        responseType: 'blob',
        headers: { ...authHeader },
        onDownloadProgress: e => {
          const total = this.m_fileNode!.size
          this.m_downloadProgress.progress = e.loaded / total
          if (e.loaded === total) {
            this.m_downloadProgress.downloading = false
          }
        },
      })

      // ダウンロードされたファイルをブラウザ経由でダウンロード
      const anchor = document.createElement('a')
      anchor.href = window.URL.createObjectURL(response.data)
      anchor.download = this.m_fileName
      anchor.click()

      // ダウンロード進捗バーの非表示後にダウンロード進捗をクリア
      this.m_showDownloadProgress(false, () => {
        this.m_downloadProgress = Object.assign({}, EMPTY_DOWNLOAD_PROGRESS)
      })
    })
  }
}
</script>
