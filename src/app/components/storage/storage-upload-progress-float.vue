<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.StorageUploadProgressFloat
  margin: 10px
  background-color: white
  border-radius: 2px
  box-shadow: $shadow-2

  body.screen--lg &, body.screen--xl &
    width: 340px
  body.screen--md &
    width: 340px
  body.screen--xs &, body.screen--sm &
    width: 270px

.bar
  background-color: $primary
  color: white
  border-radius: 2px 2px 0 0

  .title
    @extend %text-caption

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
  <div ref="el" class="StorageUploadProgressFloat animate__animated" :class="{ animate__fadeInUp: opened, animate__fadeOutDown: !opened }" hidden>
    <q-bar class="bar">
      <div class="title">{{ t('storage.uploadTotalRatio', [uploadedNum, uploadNum]) }}</div>
      <q-space />
      <q-btn v-if="minimize" dense flat icon="maximize" size="xs" @click="maximizeButtonOnClick()"> </q-btn>
      <q-btn v-else dense flat icon="minimize" size="xs" @click="minimizeButtonOnClick()"> </q-btn>
      <q-btn dense flat icon="close" @click="closeButtonOnClick()"></q-btn>
    </q-bar>
    <div class="content" :class="{ minimize: minimize }">
      <div v-for="(item, index) in fileUploaders" :key="index" class="layout horizontal center item">
        <div class="name flex-8">{{ item.name }}</div>
        <q-btn class="cancel" dense flat round icon="clear" @click="uploadingFileOnCancel(item)" :invisible="item.ends"></q-btn>
        <div v-if="item.failed" class="error flex-4">{{ t('storage.uploadFileFailed') }}</div>
        <div v-else-if="item.canceled" class="error flex-4">{{ t('storage.uploadFileCanceled') }}</div>
        <q-linear-progress v-else :value="item.progress" :stripe="!item.completed" size="md" class="flex-4" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { StorageFileUploader, StorageUploader } from '@/app/services/modules/storage'
import { StorageType, injectService } from '@/app/services'
import { computed, defineComponent, onUnmounted, reactive, ref, watch } from '@vue/composition-api'
import { useI18n } from '@/app/i18n'

interface StorageUploadProgressFloat extends StorageUploadProgressFloat.Props {
  /**
   * OSのファイル選択ダイアログを表示します。
   * @param uploadDirPath
   */
  openFilesSelectDialog(uploadDirPath: string): void
  /**
   * OSのフォルダ選択ダイアログを表示します。
   * @param uploadDirPath
   */
  openDirSelectDialog(uploadDirPath: string): void
}

interface UploadEndedEvent {
  uploadDirPath: string
  uploadedFiles: { name: string; dir: string; path: string; size: number }[]
}

namespace StorageUploadProgressFloat {
  export const UPLOAD_ENDS = 'upload-ends'

  export interface Props {
    storageType: StorageType
  }

  export const clazz = defineComponent({
    name: 'StorageUploadProgressFloat',

    props: {
      storageType: { type: String, required: true },
    },

    setup(props: Readonly<Props>, ctx) {
      //----------------------------------------------------------------------
      //
      //  Lifecycle hooks
      //
      //----------------------------------------------------------------------

      onUnmounted(() => {
        uploader && uploader.cancel()
      })

      //----------------------------------------------------------------------
      //
      //  Variables
      //
      //----------------------------------------------------------------------

      const el = ref<HTMLElement>()

      const services = injectService()
      const i18n = useI18n()

      const state = reactive({
        opened: false,
        minimize: false,
        /**
         * アップロード先のディレクトリパスです。
         */
        uploadDirPath: '',
      })

      let uploader: StorageUploader
      switch (props.storageType) {
        case 'user':
          uploader = services.userStorage.newUploader(el)
          // uploader = services.userStorage.newUrlUploader(el)
          break
        case 'article':
          uploader = services.articleStorage.newUploader(el)
          break
        case 'app':
          uploader = services.appStorage.newUploader(el)
          break
      }

      const uploadedNum = computed(() => uploader.uploadedNum.value)

      const uploadNum = computed(() => uploader.uploadNum.value)

      const running = computed(() => uploader.running.value)

      const fileUploaders = computed(() => uploader.fileUploaders.value)

      const opened = computed(() => state.opened)

      const minimize = computed(() => state.minimize)

      //----------------------------------------------------------------------
      //
      //  Methods
      //
      //----------------------------------------------------------------------

      /**
       * OSのファイル選択ダイアログを表示します。
       * @param uploadDirPath
       */
      const openFilesSelectDialog: StorageUploadProgressFloat['openFilesSelectDialog'] = uploadDirPath => {
        state.uploadDirPath = uploadDirPath
        uploader.openFilesSelectDialog(uploadDirPath)
        state.minimize = false
      }

      /**
       * OSのフォルダ選択ダイアログを表示します。
       * @param uploadDirPath
       */
      const openDirSelectDialog: StorageUploadProgressFloat['openDirSelectDialog'] = uploadDirPath => {
        state.uploadDirPath = uploadDirPath
        uploader.openDirSelectDialog(uploadDirPath)
        state.minimize = false
      }

      //----------------------------------------------------------------------
      //
      //  Event listeners
      //
      //----------------------------------------------------------------------

      watch(
        () => uploader.running.value,
        running => {
          el.value?.removeAttribute('hidden')
          // アップロードマネージャの状態がアップロード中になったら自コンポーネントを開く
          if (running) state.opened = true
        }
      )

      watch(
        () => uploader.ends.value,
        ends => {
          if (!ends) return
          ctx.emit(UPLOAD_ENDS, {
            uploadDirPath: state.uploadDirPath,
            uploadedFiles: uploader.fileUploaders.value,
          } as UploadEndedEvent)
        }
      )

      function maximizeButtonOnClick() {
        state.minimize = false
      }

      function minimizeButtonOnClick() {
        state.minimize = true
      }

      function closeButtonOnClick() {
        if (uploader.ends.value) {
          state.opened = false
          // 閉じるアニメショーンと同時にアップロードマネージャをクリアすると、アニメショーンが
          // ガタつくので、アニメショーンが終わってからアップロードマネージャをクリアしている
          setTimeout(() => {
            uploader.clear()
          }, 500)
        } else {
          uploader.cancel()
        }
      }

      function uploadingFileOnCancel(uploadFile: StorageFileUploader) {
        uploadFile.cancel()
      }

      //----------------------------------------------------------------------
      //
      //  Result
      //
      //----------------------------------------------------------------------

      return {
        ...i18n,
        el,
        uploadedNum,
        uploadNum,
        running,
        fileUploaders,
        opened,
        minimize,
        openDirSelectDialog,
        openFilesSelectDialog,
        maximizeButtonOnClick,
        minimizeButtonOnClick,
        closeButtonOnClick,
        uploadingFileOnCancel,
      }
    },
  })
}

export default StorageUploadProgressFloat.clazz
// eslint-disable-next-line no-undef
export { StorageUploadProgressFloat, UploadEndedEvent }
</script>
