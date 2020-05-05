<style lang="sass" scoped>
@import '../../../../styles/app.variables'

.container
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
  <q-card class="container" :class="{ pc: screenSize.pc, tab: screenSize.tab, sp: screenSize.sp }">
    <q-form>
      <!-- タイトル -->
      <q-card-section>
        <div class="title">{{ $t('common.signIn') }}</div>
      </q-card-section>

      <!-- コンテンツエリア -->
      <q-card-section>
        <!-- メールアドレスインプット -->
        <q-input
          v-show="m_viewType === 'signIn'"
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

        <!-- パスワードインプット -->
        <q-input
          v-show="m_viewType === 'signIn'"
          ref="passwordInput"
          v-model="m_password"
          type="password"
          name="password"
          :label="$t('common.password')"
          :error="m_passwordError"
          :error-message="m_passwordErrorMessage"
          @input="m_clearErrorMessage()"
        />

        <!-- メールアドレス未検証メッセージ -->
        <div v-show="m_viewType === 'unverified'">
          <span class="emphasis">{{ m_email }}</span> has not been identified yet.
        </div>
      </q-card-section>

      <!-- エラーメッセージ -->
      <q-card-section v-show="Boolean(m_errorMessage)">
        <span class="error-message">{{ m_errorMessage }}</span>
      </q-card-section>

      <!-- ボタンエリア -->
      <q-card-section class="layout horizontal center end-justified">
        <!-- CANCELボタン -->
        <q-btn flat rounded color="primary" :label="$t('common.cancel')" @click="m_close()" />
        <!-- SIGN INボタン -->
        <q-btn v-show="m_viewType === 'signIn'" flat rounded color="primary" :label="$t('common.signIn')" @click="m_signIn()" />
      </q-card-section>
    </q-form>
  </q-card>
</template>

<script lang="ts">
import { BaseComponent, NoCache, Resizable } from '@/lib'
import { Component } from 'vue-property-decorator'
import { QInput } from 'quasar'
import { mixins } from 'vue-class-component'
const isEmail = require('validator/lib/isEmail')

@Component({
  components: {},
})
export default class EmailSignInView extends mixins(BaseComponent, Resizable) {
  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  mounted() {
    setTimeout(() => this.m_emailInput.focus(), 100)
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private m_viewType: 'signIn' | 'unverified' = 'signIn'

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

  private m_close() {
    this.m_clear()
    this.$emit('closed')
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
    this.m_email = this.m_email ?? ''
    if (this.m_validateEmail(this.m_email)) return
    this.m_password = this.m_password ?? ''
    if (this.m_validatePassword(this.m_password)) return

    // メールアドレス＋パスワードでサインイン
    const signInResult = await this.$logic.auth.signInWithEmailAndPassword(this.m_email, this.m_password)
    if (!signInResult.result) {
      this.m_errorMessage = signInResult.errorMessage
      return
    }

    // メールアドレス確認が行われている場合
    if (this.$logic.auth.user.emailVerified) {
      // サインイン完了
      this.$emit('signed-in', this.m_email)
    }
    // メールアドレス確認が行われていない場合
    else {
      // 画面をメールアドレス未検証へ変更
      this.m_viewType = 'unverified'
    }
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
