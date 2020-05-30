<style lang="sass" scoped>
@import 'src/example/styles/app.variables'

.email-sign-up-view-main
  &.pc, &.tab
    width: 340px
  &.sp
    width: 270px

.title
  @extend %text-h6

.emphasis
  font-weight: map_get($text-weights, "medium")

.error-message
  @extend %text-caption
  color: $text-error-color
</style>

<template>
  <q-card class="email-sign-up-view-main" :class="{ pc: screenSize.pc, tab: screenSize.tab, sp: screenSize.sp }">
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

      <!-- ボタンエリア -->
      <q-card-section class="layout vertical">
        <div class="layout horizontal center end-justified">
          <!-- CANCELボタン -->
          <q-btn flat rounded color="primary" :label="$t('common.cancel')" @click="m_close()" />
          <!-- ENTRYボタン -->
          <q-btn flat rounded color="primary" :label="$t('common.entry')" @click="m_entry()" />
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

export type EmailSignUpViewResult = {
  status: EmailSignUpViewStatus
  email: string
}

export type EmailSignUpViewStatus = AuthStatus.WaitForEmailVerified | 'cancel'

@Component
export default class EmailSignUpView extends mixins(BaseComponent, Resizable) {
  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  mounted() {
    this.m_clear()
    this.m_emailInput.focus()
  }

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  @Prop()
  title!: string

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private m_email: string | null = null

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
  private m_close(closeResult?: EmailSignUpViewResult) {
    closeResult = closeResult ?? { status: 'cancel', email: '' }
    this.$emit('closed', closeResult)
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
   * 登録を行います。
   */
  private async m_entry(): Promise<void> {
    this.$q.loading.show()

    if (!this.m_validate()) {
      this.$q.loading.hide()
      return
    }

    // メールアドレス＋パスワードでアカウントを作成
    const signUpResult = await this.$logic.auth.createUserWithEmailAndPassword(this.m_email!, this.m_password, {
      photoURL: null,
    })
    if (!signUpResult.result) {
      if (signUpResult.code) {
        this.m_errorMessage = signUpResult.errorMessage
      } else {
        console.error(signUpResult.errorMessage)
        this.m_errorMessage = String(this.$t('auth.signUpFailed'))
      }
      this.$q.loading.hide()
      return
    }

    if (this.$logic.auth.status !== AuthStatus.WaitForEmailVerified) {
      this.$q.loading.hide()
      throw new Error(`This is a asuth status not assumed: ${this.$logic.auth.status}`)
    }

    // メールアドレスに検証用メールを送信
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

    this.m_close({
      status: AuthStatus.WaitForEmailVerified,
      email: this.m_email!,
    })

    this.$q.loading.hide()
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
