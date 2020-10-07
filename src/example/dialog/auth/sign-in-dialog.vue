<style lang="sass" scoped>
@import 'src/example/styles/app.variables'

.email-sign-in-view-main
</style>

<template>
  <q-dialog ref="dialog" v-model="opened" persistent class="email-sign-in-view-main">
    <!-- プロバイダリストビュー -->
    <provider-list-view
      v-if="m_viewType === 'providerList'"
      :title="m_title"
      type="signIn"
      @select-google="m_selectGoogle()"
      @select-facebook="m_selectFacebook()"
      @select-email="m_selectEmail()"
      @select-anonymous="m_selectAnonymous()"
      @closed="close()"
    />

    <!-- メールアドレスサインインビュー -->
    <email-sign-in-view v-else-if="m_viewType === 'emailSignIn'" :title="m_title" password-reset @closed="m_emailSignInViewOnClose" />

    <!-- パスワードリセットビュー -->
    <password-reset-view v-else-if="m_viewType === 'passwordReset'" @closed="close()" />

    <!-- メールアドレス検証中ビュー -->
    <auth-message-view v-else-if="m_viewType === 'emailVerifying'" :title="m_title" :email="m_email">
      <template v-slot:message>{{ $t('auth.emailVerifyingMsg', { email: m_email }) }}</template>
    </auth-message-view>
  </q-dialog>
</template>

<script lang="ts">
import { AuthMessageView, EmailSignInView, EmailSignInViewResult } from '@/example/dialog/auth/base'
import { AuthStatus } from '@/example/logic'
import { BaseDialog } from '@/example/base'
import { Component } from 'vue-property-decorator'
import PasswordResetView from '@/example/dialog/auth/base/password-reset-view.vue'
import ProviderListView from '@/example/dialog/auth//base/provider-list-view.vue'
import { QDialog } from 'quasar'
import { UserEntry } from '@/example/dialog/history-dialog-manager.vue'
import { dialogManager } from '@/example/dialog'
import { router } from '@/example/router'

@Component({
  components: {
    AuthMessageView,
    EmailSignInView,
    PasswordResetView,
    ProviderListView,
  },
})
export default class SignInDialog extends BaseDialog<void, void> {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private m_viewType: 'providerList' | 'emailSignIn' | 'passwordReset' | 'emailVerifying' = 'providerList'

  private get m_title(): string {
    return String(this.$t('common.signIn'))
  }

  private m_email = ''

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  open(): Promise<void> {
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

  private async m_selectAnonymous(): Promise<void> {
    router.removeDialogInfoFromURL()
    await this.$logic.auth.signInAnonymously()
  }

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------

  private async m_emailSignInViewOnClose(closeResult: EmailSignInViewResult) {
    switch (closeResult.status) {
      case AuthStatus.WaitForEmailVerified: {
        // メールアドレス検証中ビューに遷移
        this.m_email = closeResult.email
        this.m_viewType = 'emailVerifying'
        // URLからダイアログクエリを削除
        router.removeDialogInfoFromURL()
        break
      }
      case AuthStatus.WaitForEntry: {
        // ユーザー情報登録ダイアログを表示
        dialogManager.open(UserEntry.name)
        this.close()
        break
      }
      case AuthStatus.Available: {
        // サインイン完了
        this.close()
        break
      }
      case 'passwordReset': {
        // パスワードリセットビューに遷移
        this.m_viewType = 'passwordReset'
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
