<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.container
  min-width: 300px
  body.screen--lg &, body.screen--xl &, body.screen--md &
    max-width: 70vw
  body.screen--xs &, body.screen--sm &
    max-width: 90vw

.title
  @extend %text-h6

.message
  white-space: pre-line
</style>

<template>
  <q-dialog ref="dialog" class="MessageDialog" v-model="opened" :persistent="params.persistent" @hide="close(false)">
    <q-card class="container">
      <!-- タイトル -->
      <q-card-section v-if="Boolean(params.title)">
        <div class="title">{{ params.title }}</div>
      </q-card-section>

      <!-- コンテンツエリア -->
      <q-card-section class="row items-center">
        <div class="message">{{ params.message }}</div>
      </q-card-section>

      <!-- ボタンエリア -->
      <q-card-actions class="layout horizontal center end-justified">
        <!-- CANCELボタン -->
        <q-btn v-show="params.type === 'confirm'" flat rounded color="primary" :label="t('common.cancel')" @click="close(false)" />
        <!-- OKボタン -->
        <q-btn flat rounded color="primary" :label="t('common.ok')" @click="close(true)" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { SetupContext, defineComponent, reactive, ref, watch } from '@vue/composition-api'
import { Dialog } from '@/app/components/dialog/base'
import { QDialog } from 'quasar'
import merge from 'lodash/merge'
import { useI18n } from '@/app/i18n'

interface MessageDialog extends Dialog<MessageDialog.Props | void, boolean>, MessageDialog.Props {}

namespace MessageDialog {
  export interface Props {
    value?: boolean
    type?: 'alert' | 'confirm'
    title?: string
    message?: string
    persistent?: boolean
  }

  export const clazz = defineComponent({
    name: 'MessageDialog',

    props: {
      value: { type: Boolean, default: false },
      type: { type: String, default: 'alert' },
      title: { type: String },
      message: { type: String },
      persistent: { type: Boolean, default: false },
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
    const base = Dialog.setup<boolean>(dialog)
    const i18n = useI18n()

    const params = reactive<Required<Omit<Props, 'value'>>>({
      type: props.type!,
      title: props.title ?? '',
      message: props.message ?? '',
      persistent: props.persistent ?? false,
    })

    //----------------------------------------------------------------------
    //
    //  Methods
    //
    //----------------------------------------------------------------------

    const open: MessageDialog['open'] = p => {
      if (p) {
        const { type, title, message, persistent } = p
        merge(params, { type, title, message, persistent })
      }
      return base.open()
    }

    const close: MessageDialog['close'] = isConfirmed => {
      base.close(Boolean(isConfirmed))
    }

    //----------------------------------------------------------------------
    //
    //  Event listeners
    //
    //----------------------------------------------------------------------

    watch(
      () => base.opened.value,
      (newValue, oldValue) => {
        ctx.emit('input', newValue)
      }
    )

    watch(
      () => props.value,
      (newValue, oldValue) => {
        base.opened.value = newValue ?? false
      }
    )

    //----------------------------------------------------------------------
    //
    //  Result
    //
    //----------------------------------------------------------------------

    return {
      ...base,
      ...i18n,
      params,
      open,
      close,
    }
  }
}

export default MessageDialog.clazz
export { MessageDialog }
</script>
