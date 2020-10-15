<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.SignInDialog
</style>

<template>
  <q-dialog ref="dialog" v-model="opened" persistent class="SignInDialog">
    <!-- プロバイダリストビュー -->
    <ProviderListView
      v-if="state.viewType === 'providerList'"
      :title="state.title"
      type="signIn"
      @select-google="selectGoogle()"
      @select-facebook="selectFacebook()"
      @select-email="selectEmail()"
      @select-anonymous="selectAnonymous()"
      @closed="close()"
    />

    <!-- メールアドレスサインインビュー -->
    <EmailSignInView v-else-if="state.viewType === 'emailSignIn'" :title="state.title" password-reset @closed="emailSignInViewOnClose" />

    <!-- パスワードリセットビュー -->
    <PasswordResetView v-else-if="state.viewType === 'passwordReset'" @closed="close()" />

    <!-- メールアドレス検証中ビュー -->
    <AuthMessageView v-else-if="state.viewType === 'emailVerifying'" :title="state.title">
      <template v-slot:message>{{ t('auth.emailVerifyingMsg', { email: state.email }) }}</template>
    </AuthMessageView>
  </q-dialog>
</template>

<script lang="ts">
import { AuthStatus, injectLogic } from '@/app/logic'
import { EmailSignInView, EmailSignInViewResult } from '@/app/dialogs/auth/parts/email-sign-in-view.vue'
import { SetupContext, defineComponent, reactive, ref } from '@vue/composition-api'
import { AuthMessageView } from '@/app/dialogs/auth/parts/auth-message-view.vue'
import { Dialog } from '@/app/components/dialog'
import { PasswordResetView } from '@/app/dialogs/auth/parts/password-reset-view.vue'
import { ProviderListView } from '@/app/dialogs/auth/parts/provider-list-view.vue'
import { QDialog } from 'quasar'
import { injectDialogs } from '@/app/dialogs'
import { useI18n } from '@/app/i18n'

interface SignInDialog extends Dialog<void, void> {}

interface Props {}

namespace SignInDialog {
  export const clazz = defineComponent({
    name: 'SignInDialog',

    components: {
      ProviderListView: ProviderListView.clazz,
      EmailSignInView: EmailSignInView.clazz,
      PasswordResetView: PasswordResetView.clazz,
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
    const dialogs = injectDialogs()
    const { t } = useI18n()

    const state = reactive({
      title: String(t('common.signIn')),
      viewType: 'providerList' as 'providerList' | 'emailSignIn' | 'passwordReset' | 'emailVerifying',
      email: '',
    })

    //----------------------------------------------------------------------
    //
    //  Methods
    //
    //----------------------------------------------------------------------

    const open: SignInDialog['open'] = async () => {
      state.viewType = 'providerList'
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
      dialogs.clearQuery()
      await logic.auth.signInWithGoogle()
    }

    async function selectFacebook(): Promise<void> {
      dialogs.clearQuery()
      await logic.auth.signInWithFacebook()
    }

    function selectEmail(): void {
      state.viewType = 'emailSignIn'
    }

    async function selectAnonymous(): Promise<void> {
      dialogs.clearQuery()
      await logic.auth.signInAnonymously()
    }

    async function emailSignInViewOnClose(closeResult: EmailSignInViewResult) {
      switch (closeResult.status) {
        case AuthStatus.WaitForEmailVerified: {
          // メールアドレス検証中ビューに遷移
          state.email = closeResult.email
          state.viewType = 'emailVerifying'
          // URLからダイアログクエリを削除
          dialogs.clearQuery()
          break
        }
        case AuthStatus.WaitForEntry: {
          // ユーザー情報登録ダイアログを表示
          dialogs.userEntry.open()
          close()
          break
        }
        case AuthStatus.Available: {
          // サインイン完了
          close()
          break
        }
        case 'passwordReset': {
          // パスワードリセットビューに遷移
          state.viewType = 'passwordReset'
          break
        }
        case 'cancel': {
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
      t,
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
