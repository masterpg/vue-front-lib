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
  <div>
    <!-- メールアドレスによるアカウント登録・サインインビュー -->
    <q-card v-if="m_viewType !== 'passwordReset'" class="container" :class="{ pc: screenSize.pc, tab: screenSize.tab, sp: screenSize.sp }">
      <q-form>
        <!-- タイトル -->
        <q-card-section>
          <div class="title">{{ m_title }}</div>
        </q-card-section>

        <!-- コンテンツエリア -->
        <q-card-section>
          <!-- メールアドレスインプット -->
          <q-input
            v-show="m_viewType !== 'inVerification'"
            ref="emailInput"
            v-model="m_email"
            type="email"
            name="email"
            :label="$t('common.email')"
            :readonly="m_viewType !== 'first'"
            :error="m_emailError"
            :error-message="m_emailErrorMessage"
            class="app-pb-20"
          >
            <template v-slot:prepend>
              <q-icon name="mail" />
            </template>
          </q-input>

          <!-- 表示名インプット -->
          <q-input
            v-show="m_viewType === 'create'"
            ref="displayNameInput"
            v-model="m_displayName"
            type="text"
            name="displayName"
            :label="$t('common.displayName')"
            :error="m_displayNameError"
            :error-message="m_displayNameErrorMessage"
            @input="m_clearErrorMessage()"
          />

          <!-- パスワードインプット -->
          <q-input
            v-show="m_viewType === 'create' || m_viewType === 'signIn'"
            ref="passwordInput"
            v-model="m_password"
            type="password"
            name="password"
            :label="$t('common.password')"
            :error="m_passwordError"
            :error-message="m_passwordErrorMessage"
            @input="m_clearErrorMessage()"
          />

          <!-- メールアドレス検証中メッセージ -->
          <div v-show="m_viewType === 'inVerification'">
            Follow the instructions sent to <span class="emphasis">{{ m_email }}</span> to verify your email.
          </div>
        </q-card-section>

        <!-- エラーメッセージ -->
        <q-card-section v-show="Boolean(m_errorMessage)">
          <span class="error-message">{{ m_errorMessage }}</span>
        </q-card-section>

        <!-- ボタンエリア -->
        <q-card-section class="layout vertical">
          <!-- メールアドレスリセットリンク -->
          <span v-show="m_viewType === 'signIn'" class="app-link" @click="m_resetPassword()">{{ $t('auth.troubleSigningIn') }}</span>
          <div class="layout horizontal center end-justified">
            <!-- CANCELボタン -->
            <q-btn v-show="m_viewType !== 'inVerification'" flat rounded color="primary" :label="$t('common.cancel')" @click="m_close()" />
            <!-- NEXTボタン -->
            <q-btn v-show="m_viewType === 'first'" flat rounded color="primary" :label="$t('common.next')" @click="m_next()" />
            <!-- CREATEボタン -->
            <q-btn v-show="m_viewType === 'create'" flat rounded color="primary" :label="$t('common.create')" @click="m_create()" />
            <!-- SIGN INボタン -->
            <q-btn v-show="m_viewType === 'signIn'" flat rounded color="primary" :label="$t('common.signIn')" @click="m_signIn()" />
          </div>
        </q-card-section>
      </q-form>
    </q-card>

    <!-- パスワードリセットビュー -->
    <password-reset-view v-else-if="m_viewType === 'passwordReset'" :email="m_email" @closed="m_close()" />
  </div>
</template>

<script lang="ts">
import { AuthProviderType, BaseComponent, NoCache, Resizable } from '@/lib'
import { Component } from 'vue-property-decorator'
import PasswordResetView from '@/example/components/complex/auth/sign-in-dialog/password-reset-view.vue'
import { QInput } from 'quasar'
import { mixins } from 'vue-class-component'
import { router } from '@/example/router'
const isEmail = require('validator/lib/isEmail')

@Component({
  components: {
    PasswordResetView,
  },
})
export default class EmailAuthView extends mixins(BaseComponent, Resizable) {
  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  mounted() {
    this.m_emailInput.focus()
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private m_viewType: 'first' | 'create' | 'signIn' | 'inVerification' | 'passwordReset' = 'first'

  private m_email: string | null = null

  private get m_emailError(): boolean {
    return this.m_validateEmail(this.m_email)
  }

  private m_emailErrorMessage = ''

  private m_displayName: string | null = null

  private get m_displayNameError(): boolean {
    return this.m_validateDisplayName(this.m_displayName)
  }

  private m_displayNameErrorMessage = ''

  private m_password: string | null = null

  private get m_passwordError(): boolean {
    return this.m_validatePassword(this.m_password)
  }

  private m_passwordErrorMessage = ''

  private m_errorMessage = ''

  private get m_title() {
    switch (this.m_viewType) {
      case 'first':
        return 'Input email'
      case 'create':
        return 'Create account'
      case 'signIn':
        return 'Sign in'
      case 'inVerification':
        return 'Email in verification'
    }
    return ''
  }

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

  @NoCache
  private get m_emailInput(): QInput {
    return this.$refs.emailInput as any
  }

  @NoCache
  private get m_displayNameInput(): QInput {
    return this.$refs.displayNameInput as any
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
  private m_close() {
    this.m_clear()
    this.$emit('closed')
  }

  /**
   *  ビューをクリアします。
   */
  private m_clear(): void {
    this.m_email = null
    this.m_displayName = null
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
   * 次の画面の設定を行います。
   */
  private async m_next(): Promise<void> {
    this.m_email = this.m_email ?? ''
    if (this.m_validateEmail(this.m_email)) return

    // 入力されたメールアドレスの認証プロバイダを取得
    const providers = await this.$logic.auth.fetchSignInMethodsForEmail(this.m_email)

    // 取得した認証プロバイダの中にパスワード認証があるかを取得
    const passwordProviderContains = providers.some(provider => provider === AuthProviderType.Password)

    // パスワード認証があった場合、サインイン画面へ遷移
    if (passwordProviderContains) {
      this.m_viewType = 'signIn'
      this.$nextTick(() => this.m_passwordInput.focus())
    }
    // パスワード認証がなかった場合、アカウント作成画面へ遷移
    else {
      this.m_viewType = 'create'
      this.$nextTick(() => this.m_displayNameInput.focus())
    }
  }

  /**
   * アカウント作成を行います。
   */
  private async m_create(): Promise<void> {
    this.m_email = this.m_email ?? ''
    if (this.m_validateEmail(this.m_email)) return
    this.m_displayName = this.m_displayName ?? ''
    if (this.m_validateDisplayName(this.m_displayName)) return
    this.m_password = this.m_password ?? ''
    if (this.m_validatePassword(this.m_password)) return

    // メールアドレス＋パスワードでアカウントを作成
    const createResult = await this.$logic.auth.createUserWithEmailAndPassword(this.m_email, this.m_password, {
      displayName: this.m_displayName,
      photoURL: null,
    })
    if (!createResult.result) {
      if (createResult.code) {
        this.m_errorMessage = createResult.errorMessage
      } else {
        console.error(createResult.errorMessage)
        this.m_errorMessage = String(this.$t('auth.accountCreationFailed'))
      }
      return
    }

    // 作成されたアカウントのメールアドレスに確認メールを送信
    await this.$logic.auth.sendEmailVerification('http://localhost:5000')
    // メールアドレス検証中
    this.m_inVerification()
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
      if (signInResult.code) {
        this.m_errorMessage = signInResult.errorMessage
      } else {
        console.error(signInResult.errorMessage)
        this.m_errorMessage = String(this.$t('auth.signInFailed'))
      }
      return
    }

    // メールアドレス確認が行われている場合
    if (this.$logic.auth.user.emailVerified) {
      // サインイン完了
      this.m_close()
    }
    // メールアドレス確認が行われていない場合
    else {
      // // アカウントのメールアドレスに確認メールを送信
      await this.$logic.auth.sendEmailVerification('http://localhost:5000')
      // メールアドレス検証中
      this.m_inVerification()
    }
  }

  /**
   * 画面をメールアドレス検証中に変更します。
   */
  private m_inVerification(): void {
    this.m_viewType = 'inVerification'
    router.removeDialogInfoFromURL()
  }

  /**
   * パスワードリセット画面へ遷移します。
   */
  private m_resetPassword(): void {
    this.m_viewType = 'passwordReset'
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
   * 表示名の検証を行います。
   * @param value
   */
  private m_validateDisplayName(value: string | null): boolean {
    if (value === null) {
      return false
    }

    if (value === '') {
      const target = String(this.$t('common.displayName'))
      this.m_emailErrorMessage = String(this.$t('error.required', { target }))
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
