<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.EmailSignInView
  width: 340px
  body.screen--lg &, body.screen--xl &, body.screen--md &
    width: 340px
  body.screen--xs &, body.screen--sm &
    width: 270px

.title
  @extend %text-h6

.error-message
  @extend %text-caption
  color: $text-error-color
</style>

<template>
  <q-card class="EmailSignInView">
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
          v-model="state.email"
          type="email"
          name="email"
          :label="t('common.email')"
          :error="isEmailError"
          :error-message="state.emailErrorMessage"
          :readonly="readonlyEmail"
          @input="clearErrorMessage()"
          class="app-pb-20"
        >
          <template v-slot:prepend>
            <q-icon name="mail" />
          </template>
        </q-input>

        <!-- パスワードインプット -->
        <q-input
          ref="passwordInput"
          v-model="state.password"
          type="password"
          name="password"
          :label="t('common.password')"
          :error="isPasswordError"
          :error-message="state.passwordErrorMessage"
          @input="clearErrorMessage()"
        />
      </q-card-section>

      <!-- エラーメッセージ -->
      <q-card-section v-show="isError">
        <span class="error-message">{{ state.errorMessage }}</span>
      </q-card-section>

      <!-- メールアドレスリセットリンク -->
      <q-card-section v-show="passwordReset">
        <span class="app-link" @click="resetPassword()">{{ t('auth.forgotPassword') }}</span>
      </q-card-section>

      <!-- ボタンエリア -->
      <q-card-section class="layout vertical">
        <div class="layout horizontal center end-justified">
          <!-- CANCELボタン -->
          <q-btn flat rounded color="primary" :label="t('common.cancel')" @click="close()" />
          <!-- SIGN INボタン -->
          <q-btn flat rounded color="primary" :label="t('common.signIn')" @click="signIn()" />
        </div>
      </q-card-section>
    </q-form>
  </q-card>
</template>

<script lang="ts">
import { AuthStatus, injectService } from '@/app/services'
import { Loading, QInput } from 'quasar'
import { Ref, computed, defineComponent, onMounted, reactive, ref } from '@vue/composition-api'
import { Dialogs } from '@/app/dialogs'
import isEmail from 'validator/lib/isEmail'
import { useI18n } from '@/app/i18n'

interface EmailSignInView extends EmailSignInView.Props {}

type EmailSignInViewResult = {
  status: EmailSignInViewStatus
  email: string
}

type EmailSignInViewStatus = 'WaitForEmailVerified' | 'WaitForEntry' | 'Available' | 'PasswordReset' | 'Cancel'

namespace EmailSignInView {
  export interface Props {
    title: string
    email: string | null
    passwordReset: boolean
    readonlyEmail: boolean
  }

  export const clazz = defineComponent({
    name: 'EmailSignInView',

    props: {
      title: { type: String, required: true },
      email: { type: String, default: null },
      passwordReset: { type: Boolean, default: false },
      readonlyEmail: { type: Boolean, default: false },
    },

    setup(props: Readonly<Props>, ctx) {
      //----------------------------------------------------------------------
      //
      //  Lifecycle hooks
      //
      //----------------------------------------------------------------------

      onMounted(() => {
        state.email = props.email
        if (props.readonlyEmail) {
          passwordInput.value.focus()
        } else {
          emailInput.value.focus()
        }
      })

      //----------------------------------------------------------------------
      //
      //  Variables
      //
      //----------------------------------------------------------------------

      const services = injectService()
      const i18n = useI18n()

      const emailInput = ref() as Ref<QInput>
      const passwordInput = ref() as Ref<QInput>

      const state = reactive({
        email: null as string | null,
        emailErrorMessage: '',
        password: null as string | null,
        passwordErrorMessage: '',
        errorMessage: '',
      })

      const isEmailError = computed(() => validateEmail(state.email))
      const isPasswordError = computed(() => validatePassword(state.password))
      const isError = computed(() => Boolean(state.errorMessage))

      //----------------------------------------------------------------------
      //
      //  Internal methods
      //
      //----------------------------------------------------------------------

      /**
       * ビューを閉じます。
       */
      function close(closeResult?: EmailSignInViewResult) {
        closeResult = closeResult ?? { status: 'Cancel', email: '' }
        ctx.emit('closed', closeResult)
        clear()
      }

      /**
       *  ビューをクリアします。
       */
      function clear(): void {
        state.email = null
        state.password = null
        state.errorMessage = ''
      }

      /**
       * エラーメッセージエリアのメッセージをクリアします。
       */
      function clearErrorMessage(): void {
        state.errorMessage = ''
      }

      /**
       * サインインを行います。
       */
      async function signIn(): Promise<void> {
        Loading.show()

        if (!validate()) {
          Loading.hide()
          return
        }

        // メールアドレス＋パスワードでサインイン
        const signInResult = await services.auth.signInWithEmailAndPassword(state.email!, state.password!)
        if (!signInResult.result) {
          if (signInResult.code) {
            state.errorMessage = signInResult.errorMessage
          } else {
            console.error(signInResult.errorMessage)
            state.errorMessage = String(i18n.t('auth.signInFailed'))
          }
          Loading.hide()
          return
        }

        if (services.auth.authStatus.value === 'None') {
          Loading.hide()
          throw new Error(`'authStatus' is set to an unexpected value: ${services.auth.authStatus.value}`)
        }

        // メールアドレス検証中の場合、再度検証用メールを送信
        if (services.auth.authStatus.value === 'WaitForEmailVerified') {
          const continueURL = `${window.location.origin}/?${Dialogs.createQuery('signIn')}`
          const authResult = await services.auth.sendEmailVerification(continueURL)
          if (!authResult.result) {
            if (authResult.code) {
              state.errorMessage = authResult.errorMessage
            } else {
              console.error(authResult.errorMessage)
              state.errorMessage = String(i18n.t('auth.signUpFailed'))
            }
            Loading.hide()
            return
          }
        }

        close({
          status: services.auth.authStatus.value,
          email: state.email!,
        })

        Loading.hide()
      }

      /**
       * パスワードリセット画面へ遷移します。
       */
      function resetPassword(): void {
        close({
          status: 'PasswordReset',
          email: state.email ?? '',
        })
      }

      //--------------------------------------------------
      //  Validation
      //--------------------------------------------------

      /**
       * 入力値の検証を行います。
       */
      function validate(): boolean {
        state.email = state.email ?? ''
        if (validateEmail(state.email)) {
          return false
        }

        state.password = state.password ?? ''
        if (validatePassword(state.password)) {
          return false
        }

        return true
      }

      /**
       * メールアドレスの検証を行います。
       * @param value
       */
      function validateEmail(value: string | null): boolean {
        if (value === null) {
          return false
        }

        if (value === '') {
          const target = String(i18n.t('common.email'))
          state.emailErrorMessage = String(i18n.t('error.required', { target }))
          return true
        }

        if (!isEmail(value)) {
          const target = String(i18n.t('common.email'))
          state.emailErrorMessage = String(i18n.t('error.invalid', { target }))
          return true
        }

        return false
      }

      /**
       * パスワードの検証を行います。
       * @param value
       */
      function validatePassword(value: string | null): boolean {
        if (value === null) {
          return false
        }

        if (value === '') {
          const target = String(i18n.t('common.password'))
          state.passwordErrorMessage = String(i18n.t('error.required', { target }))
          return true
        }

        return false
      }

      //----------------------------------------------------------------------
      //
      //  Result
      //
      //----------------------------------------------------------------------

      return {
        ...i18n,
        emailInput,
        passwordInput,
        state,
        isEmailError,
        isPasswordError,
        isError,
        close,
        clearErrorMessage,
        signIn,
        resetPassword,
      }
    },
  })
}

export default EmailSignInView.clazz
// eslint-disable-next-line no-undef
export { EmailSignInView, EmailSignInViewResult, EmailSignInViewStatus }
</script>
