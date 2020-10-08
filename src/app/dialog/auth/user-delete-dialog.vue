<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.container
  &.pc, &.tab
    width: 340px
  &.sp
    width: 270px

.title
  @extend %text-h6

.error-message
  @extend %text-caption
  color: $text-error-color
</style>

<template>
  <q-dialog ref="dialog" v-model="opened" persistent>
    <!--
      アカウント削除ビュー
    -->
    <q-card
      v-if="m_viewType === 'userDelete' || m_viewType === 'userDelete.signIn'"
      class="container"
      :class="{ pc: screenSize.pc, tab: screenSize.tab, sp: screenSize.sp }"
    >
      <!-- タイトル -->
      <q-card-section>
        <div class="title">{{ $t('auth.deleteUser') }}</div>
      </q-card-section>

      <!-- コンテンツエリア -->
      <q-card-section>
        <div v-if="m_viewType === 'userDelete'">{{ $t('auth.deleteUserMsg') }}</div>
        <div v-else-if="m_viewType === 'userDelete.signIn'">{{ $t('auth.deleteUserSignInMsg') }}</div>
      </q-card-section>

      <!-- エラーメッセージ -->
      <q-card-section v-show="Boolean(m_errorMessage)">
        <span class="error-message">{{ m_errorMessage }}</span>
      </q-card-section>

      <!-- ボタンエリア -->
      <q-card-section class="layout horizontal center end-justified">
        <!-- CANCELボタン -->
        <q-btn flat rounded color="primary" :label="$t('common.cancel')" @click="close()" />
        <!-- OKボタン -->
        <q-btn v-show="m_viewType === 'userDelete'" flat rounded color="primary" :label="$t('common.ok')" @click="m_delete()" />
        <!-- SIGN INボタン -->
        <q-btn
          v-show="m_viewType === 'userDelete.signIn'"
          flat
          rounded
          color="primary"
          :label="$t('common.signIn')"
          @click="m_visibleProviderList()"
        />
      </q-card-section>
    </q-card>

    <!--
      プロバイダリストビュー
    -->
    <provider-list-view
      v-if="m_viewType === 'providerList'"
      :title="$t('common.signIn')"
      type="signIn"
      :visible-providers="m_visibleProviders"
      @select-google="m_selectGoogle()"
      @select-facebook="m_selectFacebook()"
      @select-email="m_selectEmail()"
      @select-anonymous="m_selectAnonymous()"
      @closed="close()"
    />

    <!--
      サインインビュー
    -->
    <email-sign-in-view
      v-else-if="m_viewType === 'emailSignIn'"
      :title="$t('common.signIn')"
      :email="m_currentEmail"
      readonly-email
      @closed="m_emailSignInViewOnClose"
    />
  </q-dialog>
</template>

<script lang="ts">
import { AuthProviderType, AuthStatus } from '@/app/logic'
import { BaseDialog, NoCache } from '@/app/base'
import { EmailSignInView, EmailSignInViewResult, ProviderListView } from '@/app/dialog/auth/base'
import { Component } from 'vue-property-decorator'
import { QDialog } from 'quasar'
import { router } from '@/app/router'

@Component({
  components: {
    ProviderListView,
    EmailSignInView,
  },
})
export default class UserDeleteDialog extends BaseDialog<void, void> {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  @NoCache
  protected get dialog(): QDialog {
    return this.$refs.dialog as QDialog
  }

  private m_viewType: 'userDelete' | 'userDelete.signIn' | 'providerList' | 'emailSignIn' = 'userDelete'

  private get m_title(): string {
    return String(this.$t('auth.deleteUser'))
  }

  private m_currentEmail: string | null = null

  private m_errorMessage = ''

  private m_visibleProviders: AuthProviderType[] = []

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  async open(): Promise<void> {
    if (!this.$logic.auth.isSignedIn) {
      router.removeDialogInfoFromURL()
      return
    }
    this.m_currentEmail = this.$logic.auth.user.email
    this.m_visibleUserDelete()
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

  private async m_delete(): Promise<void> {
    this.$q.loading.show()

    const deleteResult = await this.$logic.auth.deleteUser()
    if (!deleteResult.result) {
      this.m_errorMessage = deleteResult.errorMessage
      // ユーザーの認証情報が古すぎる場合、再度サインインが必要
      if (deleteResult.code === 'auth/requires-recent-login') {
        this.m_viewType = 'userDelete.signIn'
      }
      this.$q.loading.hide()
      return
    }

    this.$q.loading.hide()

    this.close()
  }

  private async m_selectGoogle(): Promise<void> {
    await this.$logic.auth.signInWithGoogle()
  }

  private async m_selectFacebook(): Promise<void> {
    await this.$logic.auth.signInWithFacebook()
  }

  private m_selectEmail(): void {
    this.m_viewType = 'emailSignIn'
  }

  private async m_selectAnonymous(): Promise<void> {
    await this.$logic.auth.signInAnonymously()
  }

  private m_visibleUserDelete() {
    this.m_errorMessage = ''
    this.m_viewType = 'userDelete'
  }

  private async m_visibleProviderList(): Promise<void> {
    const user = this.$logic.auth.user
    this.m_visibleProviders = await this.$logic.auth.fetchSignInMethodsForEmail(user.email)
    this.m_viewType = 'providerList'
  }

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------

  private async m_emailSignInViewOnClose(closeResult: EmailSignInViewResult) {
    switch (closeResult.status) {
      case AuthStatus.WaitForEmailVerified:
      case AuthStatus.WaitForEntry:
      case AuthStatus.Available: {
        this.m_visibleUserDelete()
        break
      }
      case 'cancel': {
        this.close()
      }
    }
  }
}
</script>
