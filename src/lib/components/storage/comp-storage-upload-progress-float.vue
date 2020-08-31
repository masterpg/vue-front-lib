<style lang="sass" scoped>
@import 'src/lib/styles/lib.variables'

.comp-storage-upload-progress-float-main
  margin: 10px
  background-color: white
  border-radius: 2px
  box-shadow: $shadow-2

  &.pc, &.tab
    width: 340px
  &.sp
    width: 270px

  .title
    @extend %text-caption

.bar
  background-color: $primary
  color: white
  border-radius: 2px 2px 0 0

.content
  overflow-y: auto
  max-height: 120px
  transition: max-height 0.5s

  &.minimize
    max-height: 0

.item
  @extend %text-caption
  margin: 4px

  .name
    overflow: hidden
    text-overflow: ellipsis
    white-space: nowrap

  .error
    color: $text-error-color
    text-align: center

  .cancel
    font-size: 8px

  & > *:not(:first-child)
    margin-left: 4px
</style>

<template>
  <div
    class="comp-storage-upload-progress-float-main animated fadeInUp"
    :class="{ fadeOutDown: !m_opened, pc: screenSize.pc, tab: screenSize.tab, sp: screenSize.sp }"
  >
    <q-bar class="bar">
      <div class="title">{{ $t('storage.uploadTotalRatio', [m_uploader.uploadedNum, m_uploader.uploadNum]) }}</div>
      <q-space />
      <q-btn :invisible="m_uploader.running" dense flat icon="close" @click="m_closeButtonOnClick()"></q-btn>
      <q-btn v-if="m_minimize" dense flat icon="maximize" size="xs" @click="m_maximizeButtonOnClick()"> </q-btn>
      <q-btn v-else dense flat icon="minimize" size="xs" @click="m_minimizeButtonOnClick()"> </q-btn>
    </q-bar>
    <div class="content" :class="{ minimize: m_minimize }">
      <div v-for="(item, index) in m_uploader.fileUploaders" :key="index" class="layout horizontal center item">
        <div class="name flex-8">{{ item.name }}</div>
        <div v-if="item.failed" class="error flex-4">{{ $t('storage.uploadFileFailed') }}</div>
        <div v-else-if="item.canceled" class="error flex-4">{{ $t('storage.uploadFileCanceled') }}</div>
        <q-linear-progress v-else :value="item.progress" :stripe="!item.completed" size="md" class="flex-4" />
        <q-btn :disable="item.ends" class="cancel" dense flat round icon="clear" @click="m_uploadingFileOnCancel(item)"></q-btn>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { BaseComponent, Resizable } from '@/lib/base'
import { Component, Prop, Watch } from 'vue-property-decorator'
import { StorageFileUploader, StorageType, StorageUploader } from '@/lib/logic'
import { mixins } from 'vue-class-component'

export interface UploadEndedEvent {
  uploadDirPath: string
  uploadedFiles: { name: string; dir: string; path: string; size: number }[]
}

@Component
export default class CompStorageUploadProgressFloat extends mixins(BaseComponent, Resizable) {
  //----------------------------------------------------------------------
  //
  //  Constants
  //
  //----------------------------------------------------------------------

  static UPLOAD_ENDS = 'upload-ends'

  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  async mounted() {
    switch (this.storageType) {
      case 'user':
        this.m_uploader = this.$logic.userStorage.newUploader(this.$el)
        // this.m_uploader = this.$logic.userStorage.newUrlUploader(this.$el)
        break
      case 'article':
        this.m_uploader = this.$logic.articleStorage.newUploader(this.$el)
        break
      case 'app':
        this.m_uploader = this.$logic.appStorage.newUploader(this.$el)
        break
    }
  }

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  @Prop({ required: true })
  storageType!: StorageType

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private m_opened = false

  private m_uploader: StorageUploader = {} as any

  @Watch('m_uploader.running')
  private m_m_uploaderUploadingOnChange(newValue: boolean, oldValue: boolean): void {
    // アップロードマネージャの状態がアップロード中になったら自コンポーネントを開く
    if (this.m_uploader.running) {
      this.m_opened = true
    }
  }

  private m_minimize = false

  /**
   * アップロード先のディレクトリパスです。
   */
  private m_uploadDirPath: string | null = null

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  /**
   * OSのファイル選択ダイアログを表示します。
   * @param uploadDirPath
   */
  openFilesSelectDialog(uploadDirPath: string): void {
    this.m_uploadDirPath = uploadDirPath
    this.m_uploader.openFilesSelectDialog(uploadDirPath)
    this.m_minimize = false
  }

  /**
   * OSのフォルダ選択ダイアログを表示します。
   * @param uploadDirPath
   */
  openDirSelectDialog(uploadDirPath: string): void {
    this.m_uploadDirPath = uploadDirPath
    this.m_uploader.openDirSelectDialog(uploadDirPath)
    this.m_minimize = false
  }

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------

  private m_maximizeButtonOnClick() {
    this.m_minimize = false
  }

  private m_minimizeButtonOnClick() {
    this.m_minimize = true
  }

  private m_closeButtonOnClick() {
    this.m_opened = false
    // 閉じるアニメショーンと同時にアップロードマネージャをクリアすると、アニメショーンが
    // ガタつくので、アニメショーンが終わってからアップロードマネージャをクリアしている
    setTimeout(() => {
      this.m_uploader.clear()
    }, 500)
  }

  private m_uploadingFileOnCancel(uploadFile: StorageFileUploader) {
    uploadFile.cancel()
  }

  @Watch('m_uploader.ends')
  private m_uploaderOnEnds(newValue: boolean, oldValue: boolean) {
    if (!newValue) return
    this.$emit(CompStorageUploadProgressFloat.UPLOAD_ENDS, {
      uploadDirPath: this.m_uploadDirPath,
      uploadedFiles: this.m_uploader.fileUploaders,
    } as UploadEndedEvent)
  }
}
</script>
