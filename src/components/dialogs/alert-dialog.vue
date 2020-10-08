<style lang="sass" scoped>
@import 'src/styles/app.variables'

.AlertDialog

.container
  min-width: 300px
  body.screen--lg &, body.screen--xl & body.screen--md &
    max-width: 70vw
  body.screen--xs &, body.screen--sm &
    max-width: 90vw

.title
  @extend %text-h6

.message
  white-space: pre-line
</style>

<template>
  <q-dialog ref="dialog" v-model="opened" class="AlertDialog" :persistent="params.persistent" @hide="close(false)">
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
import { SetupContext, defineComponent, reactive, watch } from '@vue/composition-api'
import { BaseDialog } from '@/components/dialogs/base'
import merge from 'lodash/merge'
import { useI18n } from '@/i18n'

interface AlertDialog extends BaseDialog<Props | void, boolean>, Readonly<Props> {}

interface Props {
  value?: boolean
  type?: 'alert' | 'confirm'
  title?: string
  message?: string
  persistent?: boolean
}

namespace AlertDialog {
  export const clazz = defineComponent({
    name: 'AlertDialog',

    props: {
      value: { type: Boolean, default: false },
      type: { type: String, default: 'alert' },
      title: { type: String },
      message: { type: String },
      persistent: { type: Boolean, default: false },
    },

    setup: (props: Props, ctx) => setup(props, ctx),
  })

  export function setup(props: Props, ctx: SetupContext) {
    //----------------------------------------------------------------------
    //
    //  Variables
    //
    //----------------------------------------------------------------------

    const base = BaseDialog.setup<boolean>()

    const { t } = useI18n()

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

    const open: AlertDialog['open'] = p => {
      if (p) {
        const { type, title, message, persistent } = p
        merge(params, { type, title, message, persistent })
      }
      return base.open()
    }

    const close: AlertDialog['close'] = isConfirmed => {
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
      t,
      params,
      open,
      close,
    }
  }
}

export default AlertDialog.clazz
export { AlertDialog }
</script>
