<style lang="sass" scoped>
@import 'src/example/styles/app.variables'

.password-reset-view-main
  &.pc, &.tab
    width: 340px
  &.sp
    min-width: 280px

.title
  @extend %text-h6

.error-message
  @extend %text-caption
  color: $text-error-color
</style>

<template>
  <q-card class="password-reset-view-main" :class="{ pc: screenSize.pc, tab: screenSize.tab, sp: screenSize.sp }">
    <!-- タイトル -->
    <q-card-section>
      <div class="title">{{ $t('auth.resetPassword') }}</div>
    </q-card-section>

    <!-- コンテンツエリア -->
    <q-card-section>
      <!-- メールアドレスリセットメッセージ -->
      <div v-show="m_viewType === 'send'">{{ $t('auth.restPasswordSendMsg') }}</div>
      <div v-show="m_viewType === 'sent'">{{ $t('auth.restPasswordSentMsg', { email: m_email }) }}</div>

      <!-- メールアドレスインプット -->
      <q-input
        v-show="m_viewType === 'send'"
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
    <q-card-section class="layout horizontal center end-justified">
      <!-- CANCELボタン -->
      <q-btn v-show="m_viewType === 'send'" flat rounded color="primary" :label="$t('common.cancel')" @click="m_close()" />
      <!-- SENDボタン -->
      <q-btn v-show="m_viewType === 'send'" flat rounded color="primary" :label="$t('common.send')" @click="m_reset()" />
      <!-- CLOSEボタン -->
      <q-btn v-show="m_viewType === 'sent'" flat rounded color="primary" :label="$t('common.close')" @click="m_close()" />
    </q-card-section>
  </q-card>
</template>

<script lang="ts">
import { BaseComponent, NoCache, Resizable } from '@/lib'
import { Component } from 'vue-property-decorator'
import { QInput } from 'quasar'
import { SignIn } from '@/example/components'
import isEmail from 'validator/lib/isEmail'
import { mixins } from 'vue-class-component'
import { router } from '@/example/router'

@Component
export default class PasswordResetView extends mixins(BaseComponent, Resizable) {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private m_viewType: 'send' | 'sent' = 'send'

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
  //  Internal methods
  //
  //----------------------------------------------------------------------

  /**
   * パスワードリセットを行います。
   */
  private async m_reset(): Promise<void> {
    this.$q.loading.show()

    if (!this.m_validate()) {
      this.$q.loading.hide()
      return
    }

    // アカウントのメールアドレスにパスワードリセットのメールを送信
    const continueURL = `${window.location.origin}/?${router.getDialogInfoQuery(SignIn.name)}`
    const sendInResult = await this.$logic.auth.sendPasswordResetEmail(this.m_email!, continueURL)
    if (!sendInResult.result) {
      if (sendInResult.code) {
        this.m_errorMessage = sendInResult.errorMessage
      } else {
        console.error(sendInResult.errorMessage)
        this.m_errorMessage = 'Failed to send password reset email.'
      }
      this.$q.loading.hide()
      return
    }

    // 画面をパスワードリセットへ変更
    this.m_viewType = 'sent'

    this.$q.loading.hide()
  }

  private m_close(): void {
    this.m_clear()
    this.$emit('closed')
  }

  /**
   *  ビューをクリアします。
   */
  private m_clear(): void {
    this.m_email = null
    this.m_errorMessage = ''
  }

  /**
   * エラーメッセージエリアのメッセージをクリアします。
   */
  private m_clearErrorMessage(): void {
    this.m_errorMessage = ''
  }

  //--------------------------------------------------
  //  Validation
  //--------------------------------------------------

  /**
   * 入力値の検証を行います。
   */
  private m_validate(): boolean {
    this.m_email = this.m_email ?? ''
    if (this.m_validateEmail(this.m_email)) {
      return false
    }

    return true
  }

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
}
</script>
