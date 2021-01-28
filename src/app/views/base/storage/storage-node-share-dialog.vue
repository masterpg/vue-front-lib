<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.container
  body.screen--lg &, body.screen--xl &, body.screen--md &
    width: 400px
  body.screen--xs &, body.screen--sm &
    width: 270px

.title
  @extend %text-h6

.content-area
  body.screen--lg &, body.screen--xl &, body.screen--md &
    max-height: 50vh
  body.screen--xs &, body.screen--sm &
    max-height: 80vh

  padding: 0 0 16px 0
  margin: 0 16px

.error-message
  @extend %text-caption
  color: $text-error-color
</style>

<template>
  <div>
    <q-dialog ref="dialog" class="StorageNodeShareDialog" v-model="opened" @show="dialogOnShow()" @before-hide="close()">
      <q-card class="container">
        <!-- タイトル -->
        <q-card-section>
          <div class="title">{{ title }}</div>
        </q-card-section>

        <!-- コンテンツエリア -->
        <q-card-section class="content-area scroll">
          <q-input v-show="sharingNodes.length === 1" ref="newNameInput" v-model="targetNodeName" :label="targetNodeLabel" class="app-pb-20" readonly>
            <template v-slot:prepend>
              <q-icon :name="targetNodeIcon" :size="targetNodeIconSize" />
            </template>
          </q-input>
          <div class="app-mb-10">{{ selectPublicPrompt }}</div>
          <q-btn-toggle
            v-model="isPublic"
            toggle-color="primary"
            :options="[
              { label: t('storage.share.notSet'), value: null },
              { label: t('storage.share.private'), value: false },
              { label: t('storage.share.public'), value: true },
            ]"
          />
        </q-card-section>

        <!-- エラーメッセージ -->
        <q-card-section v-show="Boolean(errorMessage)">
          <span class="error-message">{{ errorMessage }}</span>
        </q-card-section>

        <!-- ボタンエリア -->
        <q-card-actions class="layout horizontal center end-justified">
          <!-- CANCELボタン -->
          <q-btn flat rounded color="primary" :label="t('common.cancel')" @click="close()" />
          <!-- OKボタン -->
          <q-btn flat rounded color="primary" :label="t('common.ok')" @click="setShareSettings()" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script lang="ts">
import { Ref, SetupContext, computed, defineComponent, ref } from '@vue/composition-api'
import { StorageNode, StorageNodeShareSettings, StorageType } from '@/app/service'
import { Dialog } from '@/app/components/dialog'
import { QDialog } from 'quasar'
import { StoragePageService } from '@/app/views/base/storage/storage-page-service'
import { isFontAwesome } from '@/app/base'
import { useI18n } from '@/app/i18n'

interface StorageNodeShareDialog extends Dialog<string[], StorageNodeShareSettings | undefined>, StorageNodeShareDialog.Props {}

namespace StorageNodeShareDialog {
  export interface Props {
    storageType: StorageType
  }

  export const clazz = defineComponent({
    name: 'StorageNodeShareDialog',

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

    const dialog = ref<QDialog>()
    const base = Dialog.setup<StorageNodeShareSettings | undefined>(dialog)
    const pageService = StoragePageService.getInstance(props.storageType)
    const { t, tc } = useI18n()

    const sharingNodes: Ref<StorageNode[]> = ref([])

    const title = computed(() => {
      if (sharingNodes.value.length === 1) {
        const nodeTypeLabel = pageService.getNodeTypeLabel(sharingNodes.value[0])
        return String(t('common.shareSth', { sth: nodeTypeLabel }))
      } else if (sharingNodes.value.length >= 2) {
        const sth = String(tc('common.item', sharingNodes.value.length))
        return String(t('common.shareSth', { sth }))
      }
      return ''
    })

    const selectPublicPrompt = computed(() => {
      if (sharingNodes.value.length === 1) {
        return String(t('storage.share.selectPublicPrompt'))
      } else if (sharingNodes.value.length >= 2) {
        return String(t('storage.share.selectPublicPrompt'))
      }
      return ''
    })

    const targetNodeLabel = computed(() => {
      if (sharingNodes.value.length === 1) {
        const nodeType = sharingNodes.value[0].nodeType
        return String(t('storage.share.sharingTarget'))
      }
      return ''
    })

    const targetNodeName = computed(() => {
      if (sharingNodes.value.length === 1) {
        return pageService.getDisplayNodeName(sharingNodes.value[0])
      }
      return ''
    })

    const targetNodeIcon = computed(() => {
      if (sharingNodes.value.length === 1) {
        return pageService.getNodeIcon(sharingNodes.value[0])
      }
      return ''
    })

    const targetNodeIconSize = computed(() => {
      return isFontAwesome(targetNodeIcon.value) ? '20px' : '24px'
    })

    const isPublic = ref<boolean | null>(null)

    const errorMessage = ref('')

    //----------------------------------------------------------------------
    //
    //  Methods
    //
    //----------------------------------------------------------------------

    const open: StorageNodeShareDialog['open'] = nodePaths => {
      sharingNodes.value = []
      for (const nodePath of nodePaths) {
        const node = pageService.sgetStorageNode({ path: nodePath })
        sharingNodes.value.push(node)
      }

      // ノードが複数指定された場合、親が同じであることを検証
      const sharingNodeParentPath = sharingNodes.value[0].dir
      for (const sharingNode of sharingNodes.value) {
        if (sharingNode.dir !== sharingNodeParentPath) {
          throw new Error('All nodes must have the same parent.')
        }
      }

      // 全てのノードの公開タイプが同じ場合、公開フラグのトグルボタンに反映する
      // 一つでも公開タイプが違う場合、公開フラグのトグルボタンは未設定にする
      let newIsPublic = sharingNodes.value[0].share.isPublic
      for (const sharingNode of sharingNodes.value) {
        if (newIsPublic !== sharingNode.share.isPublic) {
          newIsPublic = sharingNode.share.isPublic
          break
        }
      }
      isPublic.value = newIsPublic

      return base.open()
    }

    const close: StorageNodeShareDialog['close'] = input => {
      clear()
      base.close(input)
    }

    //----------------------------------------------------------------------
    //
    //  Internal methods
    //
    //----------------------------------------------------------------------

    function setShareSettings(): void {
      const input: StorageNodeShareSettings = {
        isPublic: isPublic.value,
        readUIds: null,
        writeUIds: null,
      }
      close(input)
    }

    function clear(): void {
      errorMessage.value = ''
    }

    //----------------------------------------------------------------------
    //
    //  Event listeners
    //
    //----------------------------------------------------------------------

    function dialogOnShow() {}

    //----------------------------------------------------------------------
    //
    //  Result
    //
    //----------------------------------------------------------------------

    return {
      ...base,
      t,
      sharingNodes,
      title,
      selectPublicPrompt,
      targetNodeLabel,
      targetNodeName,
      targetNodeIcon,
      targetNodeIconSize,
      isPublic,
      errorMessage,
      open,
      close,
      setShareSettings,
      dialogOnShow,
    }
  }
}

export default StorageNodeShareDialog.clazz
export { StorageNodeShareDialog }
</script>
