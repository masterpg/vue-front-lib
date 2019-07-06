<style lang="stylus" scoped>
@import '../../styles/app.variables.styl'

.container {
  &.pc, &.tab {
    width: 340px
  }
  &.sp {
    min-width: 280px
  }
}

.title {
  @extend $text-h6
}

.emphasis {
  font-weight: $text-weights.medium
}

.error-message {
  @extend $text-caption
  color: $text-error-color
}
</style>

<template>
  <q-form class="container" :class="{ pc: screenSize.pc, tab: screenSize.tab, sp: screenSize.sp }">
    <q-card>
      <!-- タイトル -->
      <q-card-section>
        <div class="title">{{ m_title }}</div>
      </q-card-section>

      <!-- コンテンツエリア -->
      <q-card-section>
        <!-- メールアドレスインプット -->
        <q-input
          v-show="m_currentStep === 'first' || m_currentStep === 'create' || m_currentStep === 'signIn'"
          ref="emailInput"
          v-model="m_inputEmail"
          type="email"
          name="email"
          label="Email"
          :readonly="m_currentStep !== 'first'"
          :rules="m_emailRules"
        >
          <template v-slot:prepend>
            <q-icon name="mail" />
          </template>
        </q-input>
        <!-- 表示名インプット -->
        <q-input
          v-show="m_currentStep === 'create'"
          ref="displayNameInput"
          v-model="m_inputDisplayName"
          type="text"
          name="displayName"
          label="Display name"
          :rules="m_displayNameRules"
        />
        <!-- パスワードインプット -->
        <q-input
          v-show="m_currentStep === 'create' || m_currentStep === 'signIn'"
          ref="passwordInput"
          v-model="m_inputPassword"
          type="password"
          name="password"
          label="Password"
          :rules="m_passwordRules"
          @input="m_clearErrorMessage()"
        />
        <!-- メールアドレス確認メッセージ -->
        <div v-show="m_currentStep === 'waitVerify'">
          Follow the instructions sent to <span class="emphasis">{{ m_inputEmail }}</span> to verify your email.
        </div>
        <!-- メールアドレスリセットメッセージ -->
        <div v-show="m_currentStep === 'reset' || m_currentStep === 'waitReset'">
          Get instructions sent to <span class="emphasis">{{ m_inputEmail }}</span> that explain how to reset your password.
        </div>
      </q-card-section>

      <!-- エラーメッセージ -->
      <q-card-section v-show="!!m_errorMessage">
        <span class="error-message">{{ m_errorMessage }}</span>
      </q-card-section>

      <!-- ボタンエリア -->
      <q-card-section class="layout horizontal center">
        <!-- メールアドレスリセットリンク -->
        <div v-show="m_currentStep === 'signIn'" class="app-pseudo-link" @click="m_setupReset()">Trouble signing in?</div>
        <!-- スペーサー -->
        <div class="flex"></div>
        <!-- CANCELボタン -->
        <q-btn
          v-show="m_currentStep === 'first' || m_currentStep === 'create' || m_currentStep === 'signIn' || m_currentStep === 'reset'"
          flat
          rounded
          color="primary"
          label="Cancel"
          @click="m_cancel()"
        >
        </q-btn>
        <!-- NEXTボタン -->
        <q-btn v-show="m_currentStep === 'first'" flat rounded color="primary" label="Next" @click="m_setupNext()" />
        <!-- SAVEボタン -->
        <q-btn v-show="m_currentStep === 'create'" flat rounded color="primary" label="Save" @click="m_create()" />
        <!-- SIGN INボタン -->
        <q-btn v-show="m_currentStep === 'signIn'" flat rounded color="primary" label="Sign in" @click="m_signIn()" />
        <!-- SENDボタン -->
        <q-btn v-show="m_currentStep === 'reset'" flat rounded color="primary" label="Send" @click="m_reset()" />
      </q-card-section>
    </q-card>
  </q-form>
</template>

<script lang="ts">
import { BaseComponent, ResizableMixin } from '@/components'
import { AuthProviderType } from '@/logic'
import { Component } from 'vue-property-decorator'
import { NoCache } from '@/base/decorators'
import { QInput } from 'quasar'
import { mixins } from 'vue-class-component'
const isEmail = require('validator/lib/isEmail')

enum StepType {
  First = 'first',
  Create = 'create',
  SignIn = 'signIn',
  WaitVerify = 'waitVerify',
  Reset = 'reset',
  WaitReset = 'waitReset',
}

interface OwnerDialog {
  close(): void
}

@Component({
  components: {},
})
export default class EmailSignInView extends mixins(BaseComponent, ResizableMixin) {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  m_ownerDialog!: OwnerDialog

  m_currentStep: StepType = StepType.First

  m_title: string = ''

  m_inputEmail: string = ''

  m_inputDisplayName: string = ''

  m_inputPassword: string = ''

  m_errorMessage: string = ''

  m_emailRules = [val => !!val || 'Email is a required.', val => (!!val && isEmail(val)) || 'Email is invalid.']

  m_displayNameRules = [val => !!val || 'Display name is a required.']

  m_passwordRules = [val => !!val || 'Password is a required.']

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

  @NoCache
  get m_emailInput(): QInput {
    return this.$refs.emailInput as any
  }

  @NoCache
  get m_displayNameInput(): QInput {
    return this.$refs.displayNameInput as any
  }

  @NoCache
  get m_passwordInput(): QInput {
    return this.$refs.passwordInput as any
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  /**
   * ビューを初期化します。
   */
  init(containerDialog: OwnerDialog): void {
    this.m_ownerDialog = containerDialog
    this.m_clear()
    this.m_currentStep = StepType.First
    this.m_title = 'Sign in with email'
    this.m_emailInput.focus()
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  /**
   * 変数、入力項目などのクリアを行います。
   */
  m_clear(): void {
    this.m_title = ''
    this.m_inputEmail = ''
    this.m_inputDisplayName = ''
    this.m_inputPassword = ''
    this.m_clearErrorMessage()
    this.m_emailInput.resetValidation()
    this.m_displayNameInput.resetValidation()
    this.m_passwordInput.resetValidation()
  }

  /**
   * エラーメッセージをクリアします。
   */
  m_clearErrorMessage(): void {
    this.m_errorMessage = ''
  }

  /**
   * 次のステップの画面設定を行います。
   */
  async m_setupNext(): Promise<void> {
    if (this.m_emailInput.hasError) return

    // 入力されたメールアドレスの認証プロバイダを取得
    const providers = await this.$logic.auth.fetchSignInMethodsForEmail(this.m_inputEmail)

    // 取得した認証プロバイダの中にパスワード認証があるかを取得
    const passwordProviderContains = providers.some(provider => provider === AuthProviderType.Password)

    // パスワード認証があった場合、サインイン画面へ遷移
    if (passwordProviderContains) {
      this.m_setupSignIn()
    }
    // パスワード認証がなかった場合、アカウント作成画面へ遷移
    else {
      this.m_setupCreate()
    }
  }

  /**
   * アカウント作成画面へ遷移するための設定を行います。
   */
  m_setupCreate(): void {
    this.m_currentStep = StepType.Create
    this.m_title = 'Create account'
    this.$nextTick(() => this.m_displayNameInput.focus())
  }

  /**
   * サインイン画面へ遷移するための設定を行います。
   */
  m_setupSignIn(): void {
    this.m_currentStep = StepType.SignIn
    this.m_title = 'Sign in'
    this.$nextTick(() => this.m_passwordInput.focus())
  }

  /**
   * メールアドレス確認待ち画面へ遷移するための設定を行います。
   */
  m_setupWaitVerify(): void {
    this.m_currentStep = StepType.WaitVerify
    this.m_title = 'Check your email'
  }

  /**
   * パスワードリセット画面へ遷移するための設定を行います。
   */
  m_setupReset(): void {
    this.m_currentStep = StepType.Reset
    this.m_title = 'Recover password'
  }

  /**
   * パスワードリセット待ち画面へ遷移するための設定を行います。
   */
  m_setupWaitReset(): void {
    this.m_title = 'Recover password'
    this.m_currentStep = StepType.WaitReset
  }

  /**
   * アカウント作成を行います。
   */
  async m_create(): Promise<void> {
    if (this.m_emailInput.hasError || this.m_displayNameInput.hasError || this.m_passwordInput.hasError) return

    // メールアドレス＋パスワードでアカウントを作成
    await this.$logic.auth.createUserWithEmailAndPassword(this.m_inputEmail, this.m_inputPassword, {
      displayName: this.m_inputDisplayName,
      photoURL: null,
    })
    // 作成されたアカウントのメールアドレスに確認メールを送信
    await this.$logic.auth.sendEmailVerification('http://localhost:5000')
    // メールアドレス確認待ち画面へ遷移
    this.m_setupWaitVerify()
  }

  /**
   * サインインを行います。
   */
  async m_signIn(): Promise<void> {
    if (this.m_emailInput.hasError || this.m_passwordInput.hasError) return

    // メールアドレス＋パスワードでサインイン
    const signInResult = await this.$logic.auth.signInWithEmailAndPassword(this.m_inputEmail, this.m_inputPassword)
    if (!signInResult.result) {
      this.m_errorMessage = signInResult.errorMessage
      // this.m_passwordInput.errorMessage = signInResult.errorMessage
      return
    }

    // メールアドレス確認が行われている場合
    if (this.$logic.auth.account.emailVerified) {
      // サインイン完了
      this.m_complete()
    }
    // メールアドレス確認が行われていない場合
    else {
      // アカウントのメールアドレスに確認メールを送信
      await this.$logic.auth.sendEmailVerification('http://localhost:5000')
      // メールアドレス確認待ち画面へ遷移
      this.m_setupWaitVerify()
    }
  }

  /**
   * パスワードリセットを行います。
   */
  async m_reset(): Promise<void> {
    try {
      // アカウントのメールアドレスにパスワードリセットのメールを送信
      await this.$logic.auth.sendPasswordResetEmail(this.m_inputEmail, 'http://localhost:5000')
      // パスワードリセット待ち画面へ遷移
      this.m_setupWaitReset()
    } catch (err) {
      console.error(err)
    }
  }

  m_cancel(): void {
    this.m_ownerDialog.close()
  }

  m_complete(): void {
    this.m_ownerDialog.close()
  }
}
</script>
