<style lang="sass" scoped>
@import '../../../styles/app.variables'

.container
  &.pc, &.tab
    width: 340px
  &.sp
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
  <q-dialog ref="dialog" v-model="opened" persistent>
    <!--
      サインインビュー
    -->
    <email-sign-in-view
      v-if="m_viewType === 'emailSignIn'"
      :title="m_title"
      :email="m_currentEmail"
      readonly-email
      @closed="m_emailSignInViewOnClose"
    />

    <!--
      メールアドレス未検証ビュー
    -->
    <auth-message-view v-else-if="m_viewType === 'emailUnverified'" :title="m_title">{{ $t('auth.emailUnverifiedMsg') }}</auth-message-view>

    <!--
      メールアドレス変更ビュー
    -->
    <q-card v-else-if="m_viewType === 'emailChange'" class="container" :class="{ pc: screenSize.pc, tab: screenSize.tab, sp: screenSize.sp }">
      <!-- タイトル -->
      <q-card-section>
        <div class="title">{{ m_title }}</div>
      </q-card-section>

      <!-- コンテンツエリア -->
      <q-card-section>
        <!-- メールアドレスインプット -->
        <q-input
          v-show="m_viewType === 'emailChange'"
          ref="emailInput"
          v-model="m_email"
          type="email"
          name="email"
          :label="$t('common.email')"
          :error="m_emailError"
          :error-message="m_emailErrorMessage"
          @input="m_clearErrorMessage()"
        >
          <template v-slot:prepend>
            <q-icon name="mail" />
          </template>
        </q-input>
      </q-card-section>

      <!-- エラーメッセージ -->
      <q-card-section v-show="Boolean(m_errorMessage)">
        <span class="error-message">{{ m_errorMessage }}</span>
      </q-card-section>

      <!-- ボタンエリア -->
      <q-card-section align="right">
        <!-- CANCELボタン -->
        <q-btn v-show="m_viewType === 'emailChange'" flat rounded color="primary" :label="$t('common.cancel')" @click="close()" />
        <!-- NEXTボタン -->
        <q-btn v-show="m_viewType === 'emailChange'" flat rounded color="primary" :label="$t('common.next')" @click="m_changeEmail()" />
      </q-card-section>
    </q-card>

    <!--
      メールアドレス検証中ビュー
    -->
    <auth-message-view v-else-if="m_viewType === 'emailVerifying'" :title="m_title">
      <template v-slot:message>{{ $t('auth.emailVerifyingMsg', { email: m_email }) }}</template>
    </auth-message-view>
  </q-dialog>
</template>

<script lang="ts">
import { AuthMessageView, EmailSignInView, EmailSignInViewResult } from './base'
import { AuthStatus, BaseDialog, NoCache } from '@/lib'
import { QDialog, QInput } from 'quasar'
import { Component } from 'vue-property-decorator'
import { router } from '@/example/router'
const isEmail = require('validator/lib/isEmail')

@Component({
  components: {
    AuthMessageView,
    EmailSignInView,
  },
})
export default class EmailChangeDialog extends BaseDialog<void, void> {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  @NoCache
  protected get dialog(): QDialog {
    return this.$refs.dialog as QDialog
  }

  private m_viewType: 'emailSignIn' | 'emailChange' | 'emailUnverified' | 'emailVerifying' = 'emailSignIn'

  private get m_title(): string {
    return String(this.$t('auth.changeEmail'))
  }

  private m_currentEmail: string | null = null

  private m_email: string | null = null

  private get m_emailError(): boolean {
    return this.m_validateEmail(this.m_email)
  }

  private m_emailErrorMessage = ''

  private m_errorMessage = ''

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

  @NoCache
  private get m_emailInput(): QInput {
    return this.$refs.emailInput as any
  }

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
    this.m_viewType = 'emailSignIn'
    return this.openProcess()
  }

  close(): void {
    this.m_clear()
    this.closeProcess()
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  /**
   *  ビューをクリアします。
   */
  private m_clear(): void {
    this.m_email = null
    this.m_errorMessage = ''
  }

  /**
   * エラーメッセージをクリアします。
   */
  private m_clearErrorMessage(): void {
    this.m_errorMessage = ''
  }

  /**
   * メールアドレスの変更を実行します。
   */
  private async m_changeEmail(): Promise<void> {
    this.$q.loading.show()

    this.m_email = this.m_email ?? ''
    if (this.m_validateEmail(this.m_email)) return

    // メールアドレスを変更
    // (変更前のメールアドレスに変更通知のメールが送られる)
    await this.$logic.auth.updateEmail(this.m_email)
    // 変更されたメールアドレスに確認メールを送信
    await this.$logic.auth.sendEmailVerification(window.location.origin)
    // 画面をメールアドレス検証中へ変更
    this.m_viewType = 'emailVerifying'

    this.$q.loading.hide()
  }

  //--------------------------------------------------
  //  Validation
  //--------------------------------------------------

  /**
   * メールアドレスの検証を行います。
   * @param value
   */
  private m_validateEmail(value: string | null): boolean {
    if (value === null) {
      return false
    }

    if (value === '') {
      const target = String(this.$t('common.email'))
      this.m_emailErrorMessage = String(this.$t('error.required', { target }))
      return true
    }

    if (!isEmail(value)) {
      const target = String(this.$t('common.email'))
      this.m_emailErrorMessage = String(this.$t('error.invalid', { target }))
      return true
    }

    return false
  }

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------

  private async m_emailSignInViewOnClose(closeResult: EmailSignInViewResult) {
    switch (closeResult.status) {
      case AuthStatus.WaitForEmailVerified:
      case AuthStatus.WaitForEntry: {
        this.m_viewType = 'emailUnverified'
        break
      }
      case AuthStatus.Available: {
        this.m_viewType = 'emailChange'
        this.$nextTick(() => this.m_emailInput.focus())
        break
      }
      case 'cancel': {
        this.close()
      }
    }
  }
}
</script>
