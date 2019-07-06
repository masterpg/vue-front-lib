<style lang="stylus" scoped>
@import '../../styles/app.variables.styl'

.title {
  @extend $text-h6
}

.container {
  &.pc, &.tab {
    width: 340px
  }
  &.sp {
    width: 270px
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
  <q-dialog v-model="m_opened">
    <q-card class="container" :class="{ pc: screenSize.pc, tab: screenSize.tab, sp: screenSize.sp }">
      <!-- タイトル -->
      <q-card-section>
        <div class="title">{{ m_title }}</div>
      </q-card-section>

      <!-- コンテンツエリア -->
      <q-card-section>
        <!-- メールアドレスインプット -->
        <q-input
          v-if="m_currentStep === 'first'"
          ref="emailInput"
          v-model="m_inputEmail"
          type="email"
          name="email"
          label="Email"
          :rules="m_emailRules"
          @input="m_clearErrorMessage()"
        >
          <template v-slot:prepend>
            <q-icon name="mail" />
          </template>
        </q-input>
        <!-- メールアドレス確認メッセージ -->
        <div v-show="m_currentStep === 'waitVerify'">
          Follow the instructions sent to <span class="emphasis">{{ m_inputEmail }}</span> to verify your email.
        </div>
      </q-card-section>

      <!-- エラーメッセージ -->
      <q-card-section v-show="!!m_errorMessage">
        <span class="error-message">{{ m_errorMessage }}</span>
      </q-card-section>

      <!-- ボタンエリア -->
      <q-card-section align="right">
        <!-- CANCELボタン -->
        <q-btn v-show="m_currentStep === 'first'" flat rounded color="primary" label="Cancel" @click="m_cancel()" />
        <!-- NEXTボタン -->
        <q-btn v-show="m_currentStep === 'first'" flat rounded color="primary" label="Next" @click="m_changeEmail()" />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { BaseComponent, ResizableMixin } from '@/components'
import { Component, Watch } from 'vue-property-decorator'
import { NoCache } from '@/base/decorators'
import { QInput } from 'quasar'
import { mixins } from 'vue-class-component'
const isEmail = require('validator/lib/isEmail')

enum StepType {
  First = 'first',
  WaitVerify = 'waitVerify',
}

@Component({
  name: 'email-change-dialog',
  components: {},
})
export default class EmailChangeDialog extends mixins(BaseComponent, ResizableMixin) {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private m_opened: boolean = false

  @Watch('m_opened')
  private m_openedChanged(newValue: boolean, oldValue: boolean) {
    if (!newValue) {
      this.$emit('closed')
    }
  }

  private m_currentStep: StepType = StepType.First

  private m_title: string = ''

  private m_inputEmail: string = ''

  m_errorMessage: string = ''

  m_emailRules = [val => !!val || 'Email is a required.', val => (!!val && isEmail(val)) || 'Email is invalid.']

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

  @NoCache
  get m_emailInput(): QInput {
    return this.$refs.emailInput as any
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  open(): void {
    this.m_opened = true
    this.m_currentStep = StepType.First

    const intervalId = setInterval(() => {
      if (Object.keys(this.$refs).length === 0) return
      clearInterval(intervalId)
      this.m_clear()
      this.m_title = 'Change email'
      setTimeout(() => this.m_emailInput.focus(), 100)
    }, 10)
  }

  close(): void {
    this.m_opened = false
    this.$emit('closed')
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
    this.m_clearErrorMessage()
    this.m_emailInput.resetValidation()
  }

  /**
   * エラーメッセージをクリアします。
   */
  m_clearErrorMessage(): void {
    this.m_errorMessage = ''
  }

  /**
   * メールアドレスの変更を実行します。
   */
  async m_changeEmail(): Promise<void> {
    if (this.m_emailInput.hasError) return
    // メールアドレスを変更
    // (変更前のメールアドレスに変更通知のメールが送られる)
    await this.$logic.auth.updateEmail(this.m_inputEmail)
    // 変更されたメールアドレスに確認メールを送信
    await this.$logic.auth.sendEmailVerification('http://localhost:5000')
    // メールアドレス確認待ち画面へ遷移
    this.m_setupWaitVerify()
  }

  /**
   * メールアドレス確認待ち画面へ遷移するための設定を行います。
   */
  m_setupWaitVerify(): void {
    this.m_currentStep = StepType.WaitVerify
    this.m_title = 'Check your email'
  }

  m_cancel(): void {
    this.close()
  }
}
</script>
