<style lang="sass" scoped>
@import 'src/app/styles/app.variables'
</style>

<template>
  <q-dialog ref="dialog" class="SignUpDialog" v-model="opened" persistent>
    <!-- プロバイダリストビュー -->
    <ProviderListView
      v-if="state.viewType === 'ProviderList'"
      :title="state.title"
      type="SignUp"
      @select-google="selectGoogle()"
      @select-facebook="selectFacebook()"
      @select-email="selectEmail()"
      @closed="close()"
    />

    <!-- メールアドレスサインアップビュー -->
    <EmailSignUpView v-else-if="state.viewType === 'EmailSignUp'" :title="state.title" @closed="emailSignUpViewOnClose" />

    <!-- メールアドレス検証中ビュー -->
    <AuthMessageView v-else-if="state.viewType === 'EmailVerifying'" :title="state.title">
      <template v-slot:message>{{ t('auth.emailVerifyingMsg', { email: state.email }) }}</template>
    </AuthMessageView>
  </q-dialog>
</template>

<script lang="ts">
import { EmailSignUpView, EmailSignUpViewResult } from '@/app/dialogs/auth/sign-up-dialog/email-sign-up-view.vue'
import { SetupContext, defineComponent, reactive, ref } from '@vue/composition-api'
import { AuthMessageView } from '@/app/dialogs/auth/parts/auth-message-view.vue'
import { Dialog } from '@/app/components/dialog'
import { Dialogs } from '@/app/dialogs'
import { ProviderListView } from '@/app/dialogs/auth/parts/provider-list-view.vue'
import { QDialog } from 'quasar'
import { useI18n } from '@/app/i18n'
import { useService } from '@/app/services'

interface SignUpDialog extends Dialog<void, void>, SignUpDialog.Props {}

namespace SignUpDialog {
  export interface Props {}

  export const clazz = defineComponent({
    name: 'SignUpDialog',

    components: {
      ProviderListView: ProviderListView.clazz,
      EmailSignUpView: EmailSignUpView.clazz,
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
      title: String(i18n.t('common.signUp')),
      viewType: 'ProviderList' as 'ProviderList' | 'EmailSignUp' | 'EmailVerifying',
      email: '',
    })

    //----------------------------------------------------------------------
    //
    //  Methods
    //
    //----------------------------------------------------------------------

    const open: SignUpDialog['open'] = async () => {
      state.viewType = 'ProviderList'
      return base.open()
    }

    const close: SignUpDialog['close'] = () => {
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
      state.viewType = 'EmailSignUp'
    }

    async function emailSignUpViewOnClose(closeResult: EmailSignUpViewResult) {
      switch (closeResult.status) {
        case 'WaitForEmailVerified': {
          // メールアドレス検証中ビューに遷移
          state.email = closeResult.email
          state.viewType = 'EmailVerifying'
          // URLからダイアログクエリを削除
          Dialogs.clearQuery()
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
      emailSignUpViewOnClose,
    }
  }
}

export default SignUpDialog.clazz
export { SignUpDialog }
</script>
