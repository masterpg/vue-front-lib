<style lang="sass" scoped>
@import 'src/example/styles/app.variables'

.email-sign-in-view-main
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
  <q-card class="email-sign-in-view-main" :class="{ pc: screenSize.pc, tab: screenSize.tab, sp: screenSize.sp }">
    <q-form>
      <!-- タイトル -->
      <q-card-section>
        <div class="title">{{ title }}</div>
      </q-card-section>

      <!-- コンテンツエリア -->
      <q-card-section>
        <!-- メールアドレスインプット -->
        <q-input
          ref="emailInput"
          v-model="m_email"
          type="email"
          name="email"
          :label="$t('common.email')"
          :error="m_emailError"
          :error-message="m_emailErrorMessage"
          :readonly="readonlyEmail"
          @input="m_clearErrorMessage()"
          class="app-pb-20"
        >
          <template v-slot:prepend>
            <q-icon name="mail" />
          </template>
        </q-input>

        <!-- パスワードインプット -->
        <q-input
          ref="passwordInput"
          v-model="m_password"
          type="password"
          name="password"
          :label="$t('common.password')"
          :error="m_passwordError"
          :error-message="m_passwordErrorMessage"
          @input="m_clearErrorMessage()"
        />
      </q-card-section>

      <!-- エラーメッセージ -->
      <q-card-section v-show="Boolean(m_errorMessage)">
        <span class="error-message">{{ m_errorMessage }}</span>
      </q-card-section>

      <!-- メールアドレスリセットリンク -->
      <q-card-section v-show="passwordReset">
        <span class="app-link" @click="m_resetPassword()">{{ $t('auth.forgotPassword') }}</span>
      </q-card-section>

      <!-- ボタンエリア -->
      <q-card-section class="layout vertical">
        <div class="layout horizontal center end-justified">
          <!-- CANCELボタン -->
          <q-btn flat rounded color="primary" :label="$t('common.cancel')" @click="m_close()" />
          <!-- SIGN INボタン -->
          <q-btn flat rounded color="primary" :label="$t('common.signIn')" @click="m_signIn()" />
        </div>
      </q-card-section>
    </q-form>
  </q-card>
</template>

<script lang="ts">
import { AuthStatus, BaseComponent, NoCache, Resizable } from '@/lib'
import { Component, Prop } from 'vue-property-decorator'
import { QInput } from 'quasar'
import { UserEntry } from '../..'
import isEmail from 'validator/lib/isEmail'
import { mixins } from 'vue-class-component'
import { router } from '@/example/router'

export type EmailSignInViewResult = {
  status: EmailSignInViewStatus
  email: string
}

export type EmailSignInViewStatus = AuthStatus.WaitForEmailVerified | AuthStatus.WaitForEntry | AuthStatus.Available | 'passwordReset' | 'cancel'

@Component
export default class EmailSignInView extends mixins(BaseComponent, Resizable) {
  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  mounted() {
    this.m_email = this.email
    this.m_emailInput.focus()
  }

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  @Prop({ required: true })
  title!: string

  @Prop({ default: null })
  email!: string | null

  private m_email: string | null = null

  @Prop({ type: Boolean, default: false })
  passwordReset!: boolean

  @Prop({ type: Boolean, default: false })
  readonlyEmail!: boolean

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private get m_emailError(): boolean {
    return this.m_validateEmail(this.m_email)
  }

  private m_emailErrorMessage = ''

  private m_password: string | null = null

  private get m_passwordError(): boolean {
    return this.m_validatePassword(this.m_password)
  }

  private m_passwordErrorMessage = ''

  private m_errorMessage = ''

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

  @NoCache
  private get m_emailInput(): QInput {
    return this.$refs.emailInput as any
  }

  @NoCache
  private get m_passwordInput(): QInput {
    return this.$refs.passwordInput as any
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  /**
   * ビューを閉じます。
   */
  private m_close(closeResult?: EmailSignInViewResult) {
    closeResult = closeResult ?? { status: 'cancel', email: '' }
    this.$emit('closed', closeResult)
    this.m_clear()
  }

  /**
   *  ビューをクリアします。
   */
  private m_clear(): void {
    this.m_email = null
    this.m_password = null
    this.m_errorMessage = ''
  }

  /**
   * エラーメッセージエリアのメッセージをクリアします。
   */
  private m_clearErrorMessage(): void {
    this.m_errorMessage = ''
  }

  /**
   * サインインを行います。
   */
  private async m_signIn(): Promise<void> {
    this.$q.loading.show()

    if (!this.m_validate()) {
      this.$q.loading.hide()
      return
    }

    // メールアドレス＋パスワードでサインイン
    const signInResult = await this.$logic.auth.signInWithEmailAndPassword(this.m_email!, this.m_password!)
    if (!signInResult.result) {
      if (signInResult.code) {
        this.m_errorMessage = signInResult.errorMessage
      } else {
        console.error(signInResult.errorMessage)
        this.m_errorMessage = String(this.$t('auth.signInFailed'))
      }
      this.$q.loading.hide()
      return
    }

    if (this.$logic.auth.status === AuthStatus.None) {
      this.$q.loading.hide()
      throw new Error(`This is a auth status not assumed: ${this.$logic.auth.status}`)
    }

    // メールアドレス検証中の場合、再度検証用メールを送信
    if (this.$logic.auth.status === AuthStatus.WaitForEmailVerified) {
      const continueURL = `${window.location.origin}/?${router.getDialogInfoQuery(UserEntry.name)}`
      const authResult = await this.$logic.auth.sendEmailVerification(continueURL)
      if (!authResult.result) {
        if (authResult.code) {
          this.m_errorMessage = authResult.errorMessage
        } else {
          console.error(authResult.errorMessage)
          this.m_errorMessage = String(this.$t('auth.signUpFailed'))
        }
        this.$q.loading.hide()
        return
      }
    }

    this.m_close({
      status: this.$logic.auth.status,
      email: this.m_email!,
    })

    this.$q.loading.hide()
  }

  /**
   * パスワードリセット画面へ遷移します。
   */
  private m_resetPassword(): void {
    this.m_close({
      status: 'passwordReset',
      email: this.m_email ?? '',
    })
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

    this.m_password = this.m_password ?? ''
    if (this.m_validatePassword(this.m_password)) {
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

  /**
   * パスワードの検証を行います。
   * @param value
   */
  private m_validatePassword(value: string | null): boolean {
    if (value === null) {
      return false
    }

    if (value === '') {
      const target = String(this.$t('common.password'))
      this.m_passwordErrorMessage = String(this.$t('error.required', { target }))
      return true
    }

    return false
  }
}
</script>
