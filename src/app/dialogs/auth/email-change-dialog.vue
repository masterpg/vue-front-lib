<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.EmailChangeDialog, .container
  width: 340px
  body.screen--lg &, body.screen--xl &, body.screen--md &
    width: 340px
  body.screen--xs &, body.screen--sm &
    width: 270px

.title
  @extend %text-h6

.emphasis
  font-weight: map-get($text-weights, "medium")

.error-message
  @extend %text-caption
  color: $text-error-color
</style>

<template>
  <q-dialog ref="dialog" class="EmailChangeDialog" v-model="opened" persistent>
    <!--
      サインインビュー
    -->
    <EmailSignInView
      v-if="state.viewType === 'EmailSignIn'"
      :title="state.title"
      :email="state.currentEmail"
      readonly-email
      @closed="emailSignInViewOnClose"
    />

    <!--
      メールアドレス未検証ビュー
    -->
    <AuthMessageView v-else-if="state.viewType === 'EmailUnverified'" :title="state.title">
      {{ t('auth.emailUnverifiedMsg') }}
    </AuthMessageView>

    <!--
      メールアドレス変更ビュー
    -->
    <q-card v-else-if="state.viewType === 'EmailChange'" class="container">
      <!-- タイトル -->
      <q-card-section>
        <div class="title">{{ state.title }}</div>
      </q-card-section>

      <!-- コンテンツエリア -->
      <q-card-section>
        <!-- メールアドレスインプット -->
        <q-input
          v-show="state.viewType === 'EmailChange'"
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
      <q-card-section align="right">
        <!-- CANCELボタン -->
        <q-btn v-show="state.viewType === 'EmailChange'" flat rounded color="primary" :label="t('common.cancel')" @click="close()" />
        <!-- NEXTボタン -->
        <q-btn v-show="state.viewType === 'EmailChange'" flat rounded color="primary" :label="t('common.next')" @click="changeEmail()" />
      </q-card-section>
    </q-card>

    <!--
      メールアドレス検証中ビュー
    -->
    <AuthMessageView v-else-if="state.viewType === 'EmailVerifying'" :title="state.title">
      <template v-slot:message>{{ t('auth.emailVerifyingMsg', { email: state.email }) }}</template>
    </AuthMessageView>
  </q-dialog>
</template>

<script lang="ts">
import { AuthStatus, injectService } from '@/app/service'
import { EmailSignInView, EmailSignInViewResult } from '@/app/dialogs/auth/parts/email-sign-in-view.vue'
import { Loading, QDialog, QInput } from 'quasar'
import { SetupContext, computed, defineComponent, nextTick, reactive, ref } from '@vue/composition-api'
import { AuthMessageView } from '@/app/dialogs/auth/parts/auth-message-view.vue'
import { Dialog } from '@/app/components/dialog'
import { Dialogs } from '@/app/dialogs'
import isEmail from 'validator/lib/isEmail'
import { useI18n } from '@/app/i18n'

interface EmailChangeDialog extends Dialog<void, void> {}

namespace EmailChangeDialog {
  export interface Props {}

  export const clazz = defineComponent({
    name: 'EmailChangeDialog',

    components: {
      EmailSignInView: EmailSignInView.clazz,
      AuthMessageView: AuthMessageView.clazz,
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
    const base = Dialog.setup<void>(dialog)
    const service = injectService()
    const i18n = useI18n()

    const emailInput = ref<QInput>()

    const state = reactive({
      title: String(i18n.t('auth.changeEmail')),
      viewType: 'EmailSignIn' as 'EmailSignIn' | 'EmailChange' | 'EmailUnverified' | 'EmailVerifying',
      currentEmail: null as string | null,
      email: null as string | null,
      emailErrorMessage: '',
      errorMessage: '',
    })

    const isEmailError = computed(() => validateEmail(state.email))
    const isError = computed(() => Boolean(state.errorMessage))

    //----------------------------------------------------------------------
    //
    //  Methods
    //
    //----------------------------------------------------------------------

    const open: EmailChangeDialog['open'] = async () => {
      if (!service.auth.isSignedIn) {
        Dialogs.clearQuery()
        return
      }
      state.currentEmail = service.auth.user.email
      state.viewType = 'EmailSignIn'
      return base.open()
    }

    const close: EmailChangeDialog['close'] = () => {
      clear()
      base.close()
    }

    //----------------------------------------------------------------------
    //
    //  Internal methods
    //
    //----------------------------------------------------------------------

    /**
     *  ビューをクリアします。
     */
    function clear(): void {
      state.email = null
      state.errorMessage = ''
    }

    /**
     * エラーメッセージをクリアします。
     */
    function clearErrorMessage(): void {
      state.errorMessage = ''
    }

    /**
     * メールアドレスの変更を実行します。
     */
    async function changeEmail(): Promise<void> {
      Loading.show()

      state.email = state.email ?? ''
      if (validateEmail(state.email)) return

      // メールアドレスを変更
      // (変更前のメールアドレスに変更通知のメールが送られる)
      await service.auth.updateEmail(state.email)
      // 変更されたメールアドレスに確認メールを送信
      await service.auth.sendEmailVerification(window.location.origin)
      // URLからダイアログクエリを削除
      Dialogs.clearQuery()
      // 画面をメールアドレス検証中へ変更
      state.viewType = 'EmailVerifying'

      Loading.hide()
    }

    //--------------------------------------------------
    //  Validation
    //--------------------------------------------------

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
    //  Event listeners
    //
    //----------------------------------------------------------------------

    async function emailSignInViewOnClose(closeResult: EmailSignInViewResult) {
      switch (closeResult.status) {
        case 'WaitForEmailVerified':
        case 'WaitForEntry': {
          state.viewType = 'EmailUnverified'
          break
        }
        case 'Available': {
          state.viewType = 'EmailChange'
          nextTick(() => emailInput.value!.focus())
          break
        }
        case 'Cancel': {
          close()
        }
      }
    }

    //----------------------------------------------------------------------
    //
    //  Result
    //
    //----------------------------------------------------------------------

    return {
      ...base,
      ...i18n,
      emailInput,
      state,
      isEmailError,
      isError,
      open,
      close,
      clearErrorMessage,
      changeEmail,
      emailSignInViewOnClose,
    }
  }
}

export default EmailChangeDialog.clazz
export { EmailChangeDialog }
</script>
