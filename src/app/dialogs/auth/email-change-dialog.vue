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
  <q-dialog ref="dialog" v-model="opened" persistent class="EmailChangeDialog">
    <!--
      サインインビュー
    -->
    <EmailSignInView
      v-if="state.viewType === 'emailSignIn'"
      :title="state.title"
      :email="state.currentEmail"
      readonly-email
      @closed="emailSignInViewOnClose"
    />

    <!--
      メールアドレス未検証ビュー
    -->
    <AuthMessageView v-else-if="state.viewType === 'emailUnverified'" :title="state.title">
      {{ t('auth.emailUnverifiedMsg') }}
    </AuthMessageView>

    <!--
      メールアドレス変更ビュー
    -->
    <q-card v-else-if="state.viewType === 'emailChange'" class="container">
      <!-- タイトル -->
      <q-card-section>
        <div class="title">{{ state.title }}</div>
      </q-card-section>

      <!-- コンテンツエリア -->
      <q-card-section>
        <!-- メールアドレスインプット -->
        <q-input
          v-show="state.viewType === 'emailChange'"
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
        <q-btn v-show="state.viewType === 'emailChange'" flat rounded color="primary" :label="t('common.cancel')" @click="close()" />
        <!-- NEXTボタン -->
        <q-btn v-show="state.viewType === 'emailChange'" flat rounded color="primary" :label="t('common.next')" @click="changeEmail()" />
      </q-card-section>
    </q-card>

    <!--
      メールアドレス検証中ビュー
    -->
    <AuthMessageView v-else-if="state.viewType === 'emailVerifying'" :title="state.title">
      <template v-slot:message>{{ t('auth.emailVerifyingMsg', { email: state.email }) }}</template>
    </AuthMessageView>
  </q-dialog>
</template>

<script lang="ts">
import { AuthStatus, injectLogic } from '@/app/logic'
import { EmailSignInView, EmailSignInViewResult } from '@/app/dialogs/auth/parts/email-sign-in-view.vue'
import { Loading, QDialog, QInput } from 'quasar'
import { SetupContext, computed, defineComponent, nextTick, reactive, ref } from '@vue/composition-api'
import { AuthMessageView } from '@/app/dialogs/auth/parts/auth-message-view.vue'
import { Dialog } from '@/app/components/dialog'
import { Dialogs } from '@/app/dialogs'
import isEmail from 'validator/lib/isEmail'
import { useI18n } from '@/app/i18n'

interface EmailChangeDialog extends Dialog<void, void> {}

interface Props {}

namespace EmailChangeDialog {
  export const clazz = defineComponent({
    name: 'EmailChangeDialog',

    components: {
      EmailSignInView: EmailSignInView.clazz,
      AuthMessageView: AuthMessageView.clazz,
    },

    setup: (props: Props, ctx) => setup(props, ctx),
  })

  export function setup(props: Props, ctx: SetupContext) {
    //----------------------------------------------------------------------
    //
    //  Variables
    //
    //----------------------------------------------------------------------

    const dialog = ref<QDialog>()
    const base = Dialog.setup<void>(dialog)
    const logic = injectLogic()
    const { t } = useI18n()

    const emailInput = ref<QInput>()

    const state = reactive({
      title: String(t('auth.changeEmail')),
      viewType: 'emailSignIn' as 'emailSignIn' | 'emailChange' | 'emailUnverified' | 'emailVerifying',
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
      if (!logic.auth.isSignedIn) {
        Dialogs.clearQuery()
        return
      }
      state.currentEmail = logic.auth.user.email
      state.viewType = 'emailSignIn'
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
      await logic.auth.updateEmail(state.email)
      // 変更されたメールアドレスに確認メールを送信
      await logic.auth.sendEmailVerification(window.location.origin)
      // URLからダイアログクエリを削除
      Dialogs.clearQuery()
      // 画面をメールアドレス検証中へ変更
      state.viewType = 'emailVerifying'

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
        const target = String(t('common.email'))
        state.emailErrorMessage = String(t('error.required', { target }))
        return true
      }

      if (!isEmail(value)) {
        const target = String(t('common.email'))
        state.emailErrorMessage = String(t('error.invalid', { target }))
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
        case AuthStatus.WaitForEmailVerified:
        case AuthStatus.WaitForEntry: {
          state.viewType = 'emailUnverified'
          break
        }
        case AuthStatus.Available: {
          state.viewType = 'emailChange'
          nextTick(() => emailInput.value!.focus())
          break
        }
        case 'cancel': {
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
      t,
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
