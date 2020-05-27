<style lang="sass" scoped></style>

<template>
  <q-dialog ref="dialog" v-model="opened" persistent>
    <!-- プロバイダリストビュー -->
    <provider-list-view
      v-if="m_viewType === 'providerList'"
      :title="m_title"
      type="signUp"
      @select-google="m_selectGoogle()"
      @select-facebook="m_selectFacebook()"
      @select-email="m_selectEmail()"
      @closed="close()"
    />

    <!-- メールアドレスサインアップビュー -->
    <email-sign-up-view v-else-if="m_viewType === 'emailSignIn'" :title="m_title" @closed="m_emailSignUpViewOnClose" />

    <!-- メールアドレス検証中ビュー -->
    <auth-message-view v-else-if="m_viewType === 'emailVerifying'" :title="m_title" :email="m_email">
      <template v-slot:message>{{ $t('auth.emailVerifyingMsg', { email: m_email }) }}</template>
    </auth-message-view>
  </q-dialog>
</template>

<script lang="ts">
import { AuthMessageView, ProviderListView } from '../base'
import { AuthStatus, BaseDialog } from '@/lib'
import EmailSignUpView, { EmailSignUpViewResult } from './email-sign-up-view.vue'
import { Component } from 'vue-property-decorator'
import { QDialog } from 'quasar'
import { router } from '@/example/router'

@Component({
  components: {
    AuthMessageView,
    EmailSignUpView,
    ProviderListView,
  },
})
export default class SignUpDialog extends BaseDialog<void, void> {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private m_viewType: 'providerList' | 'emailSignIn' | 'emailVerifying' = 'providerList'

  private get m_title(): string {
    return String(this.$t('common.signUp'))
  }

  private m_email = ''

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  open(): Promise<void> {
    const user = firebase.auth().currentUser
    this.m_viewType = 'providerList'
    return this.openProcess()
  }

  close(): void {
    this.closeProcess()
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  protected get dialog(): QDialog {
    return this.$refs.dialog as QDialog
  }

  private async m_selectGoogle(): Promise<void> {
    router.removeDialogInfoFromURL()
    await this.$logic.auth.signInWithGoogle()
  }

  private async m_selectFacebook(): Promise<void> {
    router.removeDialogInfoFromURL()
    await this.$logic.auth.signInWithFacebook()
  }

  private m_selectEmail(): void {
    this.m_viewType = 'emailSignIn'
  }

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------

  private async m_emailSignUpViewOnClose(closeResult: EmailSignUpViewResult) {
    switch (closeResult.status) {
      case AuthStatus.WaitForEmailVerified: {
        // メールアドレス検証中ビューに遷移
        this.m_email = closeResult.email
        this.m_viewType = 'emailVerifying'
        // URLからダイアログクエリを削除
        router.removeDialogInfoFromURL()
        break
      }
      case 'cancel': {
        this.close()
        break
      }
    }
  }
}
</script>
