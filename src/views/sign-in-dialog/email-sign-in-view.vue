<style lang="postcss" scoped>
@import '../../styles/typography.pcss';

.title {
  @extend %comm-font-title;
}

.emphasis {
  font-weight: bold;
}

.input.pc,
.input.tab {
  width: 320px;
}

.input.sp {
  width: 250px;
}
</style>


<template>
  <form>
    <!--
      タイトル
    -->
    <div class="title comm-mb-20">{{ m_title }}</div>

    <!--
      コンテンツエリア
    -->
    <div class="layout vertical">
      <!-- メールアドレスインプット -->
      <sign-in-input
        ref="emailInput"
        v-show="m_currentStep === 'first' || m_currentStep === 'create' || m_currentStep === 'signIn'"
        v-model="m_inputEmail"
        type="email"
        name="email"
        item-name="Email"
        required
        :readonly="m_currentStep !== 'first'"
        @input="m_validateEmail()"
        class="input"
        :class="{ 'pc': f_pc, 'tab': f_tab, 'sp': f_sp }"
      ></sign-in-input>
      <!-- 表示名インプット -->
      <sign-in-input
        ref="displayNameInput"
        v-show="m_currentStep === 'create'"
        v-model="m_inputDisplayName"
        type="text"
        name="displayName"
        item-name="Display name"
        @input="m_validateDisplayName()"
        class="input"
        :class="{ 'pc': f_pc, 'tab': f_tab, 'sp': f_sp }"
      ></sign-in-input>
      <!-- パスワードインプット -->
      <sign-in-input
        ref="passwordInput"
        v-show="m_currentStep === 'create' || m_currentStep === 'signIn'"
        v-model="m_inputPassword"
        type="password"
        name="password"
        item-name="Password"
        required
        @input="m_validatePassword()"
        class="input"
        :class="{ 'pc': f_pc, 'tab': f_tab, 'sp': f_sp }"
      ></sign-in-input>
      <!-- メールアドレス確認メッセージ -->
      <div
        v-show="m_currentStep === 'waitVerify'"
        class="comm-mt-20"
      >
        Follow the instructions sent to <span class="emphasis">{{ m_inputEmail }}</span> to verify your email.
      </div>
      <!-- メールアドレスリセットメッセージ -->
      <div
        v-show="m_currentStep === 'reset' || m_currentStep === 'waitReset'"
        class="comm-mt-20"
      >
        Get instructions sent to <span class="emphasis">{{ m_inputEmail }}</span> that explain how to reset your password.
      </div>
    </div>

    <!--
      ボタンエリア
    -->
    <div class="layout horizontal center comm-mt-20">
      <!-- メールアドレスリセットリンク -->
      <div
        v-show="m_currentStep === 'signIn'"
        @click="m_setupReset()"
        class="comm-pseudo-link"
      >
        Trouble signing in?
      </div>
      <!-- スペーサー -->
      <div class="flex"></div>
      <!-- CANCELボタン -->
      <paper-button
        v-show="m_currentStep === 'first' || m_currentStep === 'create' || m_currentStep === 'signIn' || m_currentStep === 'reset'"
        @click="m_cancel()"
      >Cancel</paper-button>
      <!-- NEXTボタン -->
      <paper-button
        v-show="m_currentStep === 'first'"
        @click="m_setupNext()"
        raised
      >Next</paper-button>
      <!-- SAVEボタン -->
      <paper-button
        v-show="m_currentStep === 'create'"
        @click="m_create()"
        raised
      >Save</paper-button>
      <!-- SIGN INボタン -->
      <paper-button
        v-show="m_currentStep === 'signIn'"
        @click="m_signIn()"
        raised
      >Sign in</paper-button>
      <!-- SENDボタン -->
      <paper-button
        v-show="m_currentStep === 'reset'"
        @click="m_reset()"
        raised
      >Send</paper-button>
    </div>

  </form>
</template>


<script lang="ts">
import '@polymer/paper-button/paper-button';
import '@polymer/paper-input/paper-input';

import SignInInput from './sign-in-input.vue';
import { AuthProviderType } from '../../stores/types';
import { Component } from 'vue-property-decorator';
import { BaseComponent } from '../../base/component';
import { mixins } from 'vue-class-component';

enum StepType {
  First = 'first',
  Create = 'create',
  SignIn = 'signIn',
  WaitVerify = 'waitVerify',
  Reset = 'reset',
  WaitReset = 'waitReset',
}

interface ContainerDialog {
  close(): void;
  correctPosition(): void;
}

@Component({
  components: {
    'sign-in-input': SignInInput,
  },
})
export default class EmailSignInView extends mixins(BaseComponent) {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  m_containerDialog: ContainerDialog;

  m_currentStep: StepType = StepType.First;

  m_title: string = '';

  m_inputEmail: string = '';

  m_inputDisplayName: string = '';

  m_inputPassword: string = '';

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

  get m_emailInput(): SignInInput {
    return this.$refs.emailInput as any;
  }

  get m_displayNameInput(): SignInInput {
    return this.$refs.displayNameInput as any;
  }

  get m_passwordInput(): SignInInput {
    return this.$refs.passwordInput as any;
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  /**
   * ビューを初期化します。
   */
  init(containerDialog: ContainerDialog): void {
    this.m_containerDialog = containerDialog;
    this.m_clear();
    this.m_currentStep = StepType.First;
    this.m_title = 'Sign in with email';
    this.m_emailInput.focus();
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
    this.m_title = '';
    this.m_inputEmail = '';
    this.m_inputDisplayName = '';
    this.m_inputPassword = '';
    this.m_emailInput.init();
    this.m_displayNameInput.init();
    this.m_passwordInput.init();
  }

  /**
   * 入力されたメールアドレスを検証します。
   */
  m_validateEmail(): boolean {
    return this.m_emailInput.validate();
  }

  /**
   * 入力された表示名を検証します。
   */
  m_validateDisplayName(): boolean {
    return this.m_displayNameInput.validate();
  }

  /**
   * 入力されたパスワードを検証します。
   */
  m_validatePassword(): boolean {
    return this.m_passwordInput.validate();
  }

  /**
   * 次のステップの画面設定を行います。
   */
  async m_setupNext(): Promise<void> {
    if (!this.m_validateEmail()) return;
    // 入力されたメールアドレスの認証プロバイダを取得
    const providers = await this.$stores.auth.fetchSignInMethodsForEmail(this.m_inputEmail);

    // 取得した認証プロバイダの中にパスワード認証があるかを取得
    const passwordProviderContains = providers.some(
      (provider) => provider === AuthProviderType.Password,
    );

    // パスワード認証があった場合、サインイン画面へ遷移
    if (passwordProviderContains) {
      this.m_setupSignIn();
    }
    // パスワード認証がなかった場合、アカウント作成画面へ遷移
    else {
      this.m_setupCreate();
    }
  }

  /**
   * アカウント作成画面へ遷移するための設定を行います。
   */
  m_setupCreate(): void {
    this.m_currentStep = StepType.Create;
    this.m_title = 'Create account';
    this.m_containerDialog.correctPosition();
    this.$nextTick(() => this.m_displayNameInput.focus());
  }

  /**
   * サインイン画面へ遷移するための設定を行います。
   */
  m_setupSignIn(): void {
    this.m_currentStep = StepType.SignIn;
    this.m_title = 'Sign in';
    this.m_containerDialog.correctPosition();
    this.$nextTick(() => this.m_passwordInput.focus());
  }

  /**
   * メールアドレス確認待ち画面へ遷移するための設定を行います。
   */
  m_setupWaitVerify(): void {
    this.m_currentStep = StepType.WaitVerify;
    this.m_title = 'Check your email';
    this.m_containerDialog.correctPosition();
  }

  /**
   * パスワードリセット画面へ遷移するための設定を行います。
   */
  m_setupReset(): void {
    this.m_currentStep = StepType.Reset;
    this.m_title = 'Recover password';
    this.m_containerDialog.correctPosition();
  }

  /**
   * パスワードリセット待ち画面へ遷移するための設定を行います。
   */
  m_setupWaitReset(): void {
    this.m_title = 'Recover password';
    this.m_containerDialog.correctPosition();
    this.m_currentStep = StepType.WaitReset;
  }

  /**
   * アカウント作成を行います。
   */
  async m_create(): Promise<void> {
    if (!this.m_validateEmail()) return;
    if (!this.m_validateDisplayName()) return;
    if (!this.m_validatePassword()) return;
    // メールアドレス＋パスワードでアカウントを作成
    await this.$stores.auth.createUserWithEmailAndPassword(
      this.m_inputEmail,
      this.m_inputPassword,
      {
        displayName: this.m_inputDisplayName,
        photoURL: null,
      },
    );
    // 作成されたアカウントのメールアドレスに確認メールを送信
    await this.$stores.auth.sendEmailVerification('http://localhost:5000');
    // メールアドレス確認待ち画面へ遷移
    this.m_setupWaitVerify();
  }

  /**
   * サインインを行います。
   */
  async m_signIn(): Promise<void> {
    if (!this.m_validateEmail()) return;
    if (!this.m_validatePassword()) return;

    // メールアドレス＋パスワードでサインイン
    const signInResult = await this.$stores.auth.signInWithEmailAndPassword(
      this.m_inputEmail,
      this.m_inputPassword,
    );
    if (!signInResult.result) {
      this.m_passwordInput.errorMessage = signInResult.errorMessage;
      return;
    }

    // メールアドレス確認が行われている場合
    if (this.$stores.auth.account.emailVerified) {
      // サインイン完了
      this.m_complete();
    }
    // メールアドレス確認が行われていない場合
    else {
      // アカウントのメールアドレスに確認メールを送信
      await this.$stores.auth.sendEmailVerification('http://localhost:5000');
      // メールアドレス確認待ち画面へ遷移
      this.m_setupWaitVerify();
    }
  }

  /**
   * パスワードリセットを行います。
   */
  async m_reset(): Promise<void> {
    try {
      // アカウントのメールアドレスにパスワードリセットのメールを送信
      await this.$stores.auth.sendPasswordResetEmail(this.m_inputEmail, 'http://localhost:5000');
      // パスワードリセット待ち画面へ遷移
      this.m_setupWaitReset();
    } catch (err) {
      console.error(err);
    }
  }

  m_cancel(): void {
    this.m_containerDialog.close();
  }

  m_complete(): void {
    this.m_containerDialog.close();
  }
}
</script>
