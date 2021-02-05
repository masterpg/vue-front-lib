<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.PasswordResetView
  width: 340px
  body.screen--lg &, body.screen--xl &, body.screen--md &
    width: 340px
  body.screen--xs &, body.screen--sm &
    width: 270px

.title
  @extend %text-h6

.error-message
  @extend %text-caption
  color: $text-error-color
</style>

<template>
  <q-card class="PasswordResetView">
    <!-- タイトル -->
    <q-card-section>
      <div class="title">{{ t('auth.resetPassword') }}</div>
    </q-card-section>

    <!-- コンテンツエリア -->
    <q-card-section>
      <!-- メールアドレスリセットメッセージ -->
      <div v-show="state.viewType === 'send'">{{ t('auth.restPasswordSendMsg') }}</div>
      <div v-show="state.viewType === 'sent'">{{ t('auth.restPasswordSentMsg', { email: state.email }) }}</div>

      <!-- メールアドレスインプット -->
      <q-input
        v-show="state.viewType === 'send'"
        ref="emailInput"
        v-model="state.email"
        type="email"
        name="email"
        :label="t('common.email')"
        :error="isEmailError"
        :error-message="state.emailErrorMessage"
        @input="clearErrorMessage()"
      >
        <template v-slot:prepend>
          <q-icon name="mail" />
        </template>
      </q-input>
    </q-card-section>

    <!-- エラーメッセージ -->
    <q-card-section v-show="isError">
      <span class="error-message">{{ state.errorMessage }}</span>
    </q-card-section>

    <!-- ボタンエリア -->
    <q-card-section class="layout horizontal center end-justified">
      <!-- CANCELボタン -->
      <q-btn v-show="state.viewType === 'send'" flat rounded color="primary" :label="t('common.cancel')" @click="close()" />
      <!-- SENDボタン -->
      <q-btn v-show="state.viewType === 'send'" flat rounded color="primary" :label="t('common.send')" @click="reset()" />
      <!-- CLOSEボタン -->
      <q-btn v-show="state.viewType === 'sent'" flat rounded color="primary" :label="t('common.close')" @click="close()" />
    </q-card-section>
  </q-card>
</template>

<script lang="ts">
import { Loading, QInput } from 'quasar'
import { Ref, computed, defineComponent, onMounted, reactive, ref } from '@vue/composition-api'
import { Dialogs } from '@/app/dialogs'
import { injectService } from '@/app/service'
import isEmail from 'validator/lib/isEmail'
import { useI18n } from '@/app/i18n'

interface PasswordResetView extends PasswordResetView.Props {}

namespace PasswordResetView {
  export interface Props {}

  export const clazz = defineComponent({
    name: 'PasswordResetView',

    setup(props: Readonly<Props>, ctx) {
      //----------------------------------------------------------------------
      //
      //  Lifecycle hooks
      //
      //----------------------------------------------------------------------

      onMounted(() => {
        emailInput.value.focus()
      })

      //----------------------------------------------------------------------
      //
      //  Variables
      //
      //----------------------------------------------------------------------

      const service = injectService()
      const i18n = useI18n()

      const emailInput = ref() as Ref<QInput>

      const state = reactive({
        viewType: 'send' as 'send' | 'sent',
        email: null as string | null,
        emailErrorMessage: '',
        errorMessage: '',
      })

      const isEmailError = computed(() => validateEmail(state.email))
      const isError = computed(() => Boolean(state.errorMessage))

      //----------------------------------------------------------------------
      //
      //  Internal methods
      //
      //----------------------------------------------------------------------

      /**
       * パスワードリセットを行います。
       */
      async function reset(): Promise<void> {
        Loading.show()

        if (!validate()) {
          Loading.hide()
          return
        }

        // アカウントのメールアドレスにパスワードリセットのメールを送信
        const continueURL = `${window.location.origin}/?${Dialogs.createQuery('signIn')}`
        const sendInResult = await service.auth.sendPasswordResetEmail(state.email!, continueURL)
        if (!sendInResult.result) {
          if (sendInResult.code) {
            state.errorMessage = sendInResult.errorMessage
          } else {
            console.error(sendInResult.errorMessage)
            state.errorMessage = 'Failed to send password reset email.'
          }
          Loading.hide()
          return
        }

        // 画面をパスワードリセットへ変更
        state.viewType = 'sent'

        Loading.hide()
      }

      function close(): void {
        clear()
        ctx.emit('closed')
      }

      /**
       *  ビューをクリアします。
       */
      function clear(): void {
        state.email = null
        state.errorMessage = ''
      }

      /**
       * エラーメッセージエリアのメッセージをクリアします。
       */
      function clearErrorMessage(): void {
        state.errorMessage = ''
      }

      //--------------------------------------------------
      //  Validation
      //--------------------------------------------------

      /**
       * 入力値の検証を行います。
       */
      function validate(): boolean {
        state.email = state.email ?? ''
        if (validateEmail(state.email)) {
          return false
        }

        return true
      }

      /**
       * メールアドレスの検証を行います。
       * @param value
       */
      function validateEmail(value: string | null): boolean {
        if (value === null) {
          return false
        }

        if (value === '') {
          const target = String(i18n.t('common.email'))
          state.emailErrorMessage = String(i18n.t('error.required', { target }))
          return true
        }

        if (!isEmail(value)) {
          const target = String(i18n.t('common.email'))
          state.emailErrorMessage = String(i18n.t('error.invalid', { target }))
          return true
        }

        return false
      }

      //----------------------------------------------------------------------
      //
      //  Result
      //
      //----------------------------------------------------------------------

      return {
        ...i18n,
        emailInput,
        state,
        isEmailError,
        isError,
        reset,
        close,
        clearErrorMessage,
      }
    },
  })
}

export default PasswordResetView.clazz
export { PasswordResetView }
</script>
