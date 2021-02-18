<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.SignInDialog
</style>

<template>
  <q-dialog ref="dialog" class="SignInDialog" v-model="opened" persistent>
    <!-- プロバイダリストビュー -->
    <ProviderListView
      v-if="state.viewType === 'ProviderList'"
      :title="state.title"
      type="SignIn"
      @select-google="selectGoogle()"
      @select-facebook="selectFacebook()"
      @select-email="selectEmail()"
      @select-anonymous="selectAnonymous()"
      @closed="close()"
    />

    <!-- メールアドレスサインインビュー -->
    <EmailSignInView v-else-if="state.viewType === 'EmailSignIn'" :title="state.title" password-reset @closed="emailSignInViewOnClose" />

    <!-- パスワードリセットビュー -->
    <PasswordResetView v-else-if="state.viewType === 'PasswordReset'" @closed="close()" />

    <!-- メールアドレス検証中ビュー -->
    <AuthMessageView v-else-if="state.viewType === 'EmailVerifying'" :title="state.title">
      <template v-slot:message>{{ t('auth.emailVerifyingMsg', { email: state.email }) }}</template>
    </AuthMessageView>
  </q-dialog>
</template>

<script lang="ts">
import { EmailSignInView, EmailSignInViewResult } from '@/app/dialogs/auth/parts/email-sign-in-view.vue'
import { SetupContext, defineComponent, reactive, ref } from '@vue/composition-api'
import { AuthMessageView } from '@/app/dialogs/auth/parts/auth-message-view.vue'
import { Dialog } from '@/app/components/dialog'
import { Dialogs } from '@/app/dialogs'
import { PasswordResetView } from '@/app/dialogs/auth/parts/password-reset-view.vue'
import { ProviderListView } from '@/app/dialogs/auth/parts/provider-list-view.vue'
import { QDialog } from 'quasar'
import { useI18n } from '@/app/i18n'
import { useService } from '@/app/services'

interface SignInDialog extends Dialog<void, void> {}

namespace SignInDialog {
  export interface Props {}

  export const clazz = defineComponent({
    name: 'SignInDialog',

    components: {
      ProviderListView: ProviderListView.clazz,
      EmailSignInView: EmailSignInView.clazz,
      PasswordResetView: PasswordResetView.clazz,
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
    const services = useService()
    const i18n = useI18n()

    const state = reactive({
      title: String(i18n.t('common.signIn')),
      viewType: 'ProviderList' as 'ProviderList' | 'EmailSignIn' | 'PasswordReset' | 'EmailVerifying',
      email: '',
    })

    //----------------------------------------------------------------------
    //
    //  Methods
    //
    //----------------------------------------------------------------------

    const open: SignInDialog['open'] = async () => {
      state.viewType = 'ProviderList'
      return base.open()
    }

    const close: SignInDialog['close'] = () => {
      base.close()
    }

    //----------------------------------------------------------------------
    //
    //  Event listeners
    //
    //----------------------------------------------------------------------

    async function selectGoogle(): Promise<void> {
      Dialogs.clearQuery()
      await services.auth.signInWithGoogle()
    }

    async function selectFacebook(): Promise<void> {
      Dialogs.clearQuery()
      await services.auth.signInWithFacebook()
    }

    function selectEmail(): void {
      state.viewType = 'EmailSignIn'
    }

    async function selectAnonymous(): Promise<void> {
      Dialogs.clearQuery()
      await services.auth.signInAnonymously()
    }

    async function emailSignInViewOnClose(closeResult: EmailSignInViewResult) {
      switch (closeResult.status) {
        case 'WaitForEmailVerified': {
          // メールアドレス検証中ビューに遷移
          state.email = closeResult.email
          state.viewType = 'EmailVerifying'
          // URLからダイアログクエリを削除
          Dialogs.clearQuery()
          break
        }
        case 'WaitForEntry': {
          // ユーザー情報登録ダイアログを表示
          Dialogs.userEntry.open()
          close()
          break
        }
        case 'Available': {
          // サインイン完了
          close()
          break
        }
        case 'PasswordReset': {
          // パスワードリセットビューに遷移
          state.viewType = 'PasswordReset'
          break
        }
        case 'Cancel': {
          close()
          break
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
      state,
      open,
      close,
      selectGoogle,
      selectFacebook,
      selectEmail,
      selectAnonymous,
      emailSignInViewOnClose,
    }
  }
}

export default SignInDialog.clazz
export { SignInDialog }
</script>
