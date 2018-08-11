<style lang="stylus" scoped>
@import '../../../assets/styles/_typography.styl';

paper-dialog.sp {
  margin: 24px 10px;
}

.title {
  @extend .app-font-title;
}

.emphasis {
  font-weight: bold;
}

.input.pc, .input.tab {
  width 320px;
}

.input.sp {
  width 250px;
}
</style>


<template>
  <paper-dialog
    ref="dialog"
    modal
    with-backdrop
    entry-animation="fade-in-animation"
    exit-animation="fade-out-animation"
    :class="{ sp: f_sp }"
  >
    <div>

      <!--
        タイトル
      -->
      <div class="title">{{ m_title }}</div>

      <!--
        コンテンツエリア
      -->
      <div class="layout vertical">
        <!-- メールアドレスインプット -->
        <paper-input
          ref="emailInput"
          v-show="m_currentStep === 'first'"
          :value="m_inputEmail"
          @input="m_inputEmail = $event.target.value; m_validateEmail();"
          label="New email"
          type="email"
          required
          :readonly="m_currentStep !== 'first'"
          class="input"
          :class="{ 'pc': f_pc, 'tab': f_tab, 'sp': f_sp }"
        ></paper-input>
        <!-- メールアドレス確認メッセージ -->
        <div
          v-show="m_currentStep === 'waitVerify'"
          class="app-mt-20"
        >
          Follow the instructions sent to <span class="emphasis">{{ m_inputEmail }}</span> to verify your email.
        </div>
      </div>

      <!--
        ボタンエリア
      -->
      <div class="layout horizontal center end-justified app-mt-20">
        <!-- CANCELボタン -->
        <paper-button
          v-show="m_currentStep === 'first'"
          @click="m_cancel()"
        >Cancel</paper-button>
        <!-- NEXTボタン -->
        <paper-button
          v-show="m_currentStep === 'first'"
          @click="m_changeEmail()"
          raised
        >Next</paper-button>
      </div>

    </div>
  </paper-dialog>
</template>


<script lang="ts">
import '@polymer/paper-button/paper-button';
import '@polymer/paper-input/paper-input';
import { Component } from 'vue-property-decorator';
import { ElementComponent } from '../../components';
import { mixins } from 'vue-class-component';

enum StepType {
  First = 'first',
  WaitVerify = 'waitVerify',
}

@Component
export default class EmailChangeDialog extends mixins(ElementComponent) {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  m_currentStep: StepType = StepType.First;

  m_title: string = '';

  m_inputEmail: string = '';

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

  get m_dialog(): { open: () => void; close: () => void; fit: () => void } {
    return this.$refs.dialog as any;
  }

  get m_emailInput(): HTMLElement & {
    invalid: boolean;
    errorMessage: string;
    validate: () => void;
  } {
    return this.$refs.emailInput as any;
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  open(): void {
    this.m_clear();
    this.m_currentStep = StepType.First;
    this.m_title = 'Change email';
    this.$nextTick(() => this.m_emailInput.focus());
    this.m_dialog.open();
    this.correctPosition();
  }

  close(): void {
    this.m_dialog.close();
  }

  correctPosition(): void {
    this.$nextTick(() => this.m_dialog.fit());
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
    this.m_emailInput.invalid = false;
  }

  /**
   * 入力されたメールアドレスを検証します。
   */
  m_validateEmail(): boolean {
    if (!this.m_inputEmail) {
      this.m_emailInput.invalid = true;
      this.m_emailInput.errorMessage = 'Email is a required.';
      return false;
    } else {
      const validated = this.m_emailInput.validate();
      if (!validated) {
        this.m_emailInput.invalid = true;
        this.m_emailInput.errorMessage = 'Email is invalid.';
        return false;
      }
    }
    this.m_emailInput.invalid = false;
    return true;
  }

  /**
   * メールアドレスの変更を実行します。
   */
  async m_changeEmail(): Promise<void> {
    if (!this.m_validateEmail()) return;
    // メールアドレスを変更
    // (変更前のメールアドレスに変更通知のメールが送られる)
    await this.$stores.auth.updateEmail(this.m_inputEmail);
    // 変更されたメールアドレスに確認メールを送信
    await this.$stores.auth.sendEmailVerification('http://localhost:5000');
    // メールアドレス確認待ち画面へ遷移
    this.m_setupWaitVerify();
  }

  /**
   * メールアドレス確認待ち画面へ遷移するための設定を行います。
   */
  m_setupWaitVerify(): void {
    this.m_currentStep = StepType.WaitVerify;
    this.m_title = 'Check your email';
    this.correctPosition();
  }

  m_cancel(): void {
    this.close();
  }
}
</script>
