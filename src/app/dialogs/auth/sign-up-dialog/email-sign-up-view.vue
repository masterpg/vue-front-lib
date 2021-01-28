<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.EmailSignUpView
  width: 340px
  body.screen--lg &, body.screen--xl &, body.screen--md &
    width: 340px
  body.screen--xs &, body.screen--sm &
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
  <q-card class="EmailSignUpView">
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
          :label="$t('common.email')"
          :error="isEmailError"
          :error-message="state.emailErrorMessage"
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
          :label="$t('common.password')"
          :error="isPasswordError"
          :error-message="state.passwordErrorMessage"
          @input="clearErrorMessage()"
        />
      </q-card-section>

      <!-- エラーメッセージ -->
      <q-card-section v-show="isError">
        <span class="error-message">{{ state.errorMessage }}</span>
      </q-card-section>

      <!-- ボタンエリア -->
      <q-card-section class="layout vertical">
        <div class="layout horizontal center end-justified">
          <!-- CANCELボタン -->
          <q-btn flat rounded color="primary" :label="$t('common.cancel')" @click="close()" />
          <!-- ENTRYボタン -->
          <q-btn flat rounded color="primary" :label="$t('common.entry')" @click="entry()" />
        </div>
      </q-card-section>
    </q-form>
  </q-card>
</template>

<script lang="ts">
import { AuthStatus, injectService } from '@/app/service'
import { Loading, QInput } from 'quasar'
import { Ref, computed, defineComponent, onMounted, reactive, ref } from '@vue/composition-api'
import { Dialogs } from '@/app/dialogs'
import isEmail from 'validator/lib/isEmail'
import { useI18n } from '@/app/i18n'

interface EmailSignUpView extends EmailSignUpView.Props {}

type EmailSignUpViewResult = {
  status: EmailSignUpViewStatus
  email: string
}

type EmailSignUpViewStatus = AuthStatus.WaitForEmailVerified | 'cancel'

namespace EmailSignUpView {
  export interface Props {
    title: string
  }

  export const clazz = defineComponent({
    name: 'EmailSignUpView',

    props: {
      title: { type: String, required: true },
    },

    setup(props: Readonly<Props>, ctx) {
      //----------------------------------------------------------------------
      //
      //  Lifecycle hooks
      //
      //----------------------------------------------------------------------

      onMounted(() => {
        clear()
        emailInput.value.focus()
      })

      //----------------------------------------------------------------------
      //
      //  Variables
      //
      //----------------------------------------------------------------------

      const service = injectService()
      const { t } = useI18n()

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
      function close(closeResult?: EmailSignUpViewResult) {
        closeResult = closeResult ?? { status: 'cancel', email: '' }
        ctx.emit('closed', closeResult)
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
       * 登録を行います。
       */
      async function entry(): Promise<void> {
        Loading.show()

        if (!validate()) {
          Loading.hide()
          return
        }

        // メールアドレス＋パスワードでアカウントを作成
        const signUpResult = await service.auth.createUserWithEmailAndPassword(state.email!, state.password!, {
          photoURL: null,
        })
        if (!signUpResult.result) {
          if (signUpResult.code) {
            state.errorMessage = signUpResult.errorMessage
          } else {
            console.error(signUpResult.errorMessage)
            state.errorMessage = String(t('auth.signUpFailed'))
          }
          Loading.hide()
          return
        }

        if (service.auth.status.value !== AuthStatus.WaitForEmailVerified) {
          Loading.hide()
          throw new Error(`This is a auth status not assumed: ${service.auth.status.value}`)
        }

        // メールアドレスに検証用メールを送信
        const continueURL = `${window.location.origin}/?${Dialogs.createQuery('userEntry')}`
        const authResult = await service.auth.sendEmailVerification(continueURL)
        if (!authResult.result) {
          if (authResult.code) {
            state.errorMessage = authResult.errorMessage
          } else {
            console.error(authResult.errorMessage)
            state.errorMessage = String(t('auth.signUpFailed'))
          }
          Loading.hide()
          return
        }

        close({
          status: AuthStatus.WaitForEmailVerified,
          email: state.email!,
        })

        Loading.hide()
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
          const target = String(t('common.email'))
          state.emailErrorMessage = String(t('error.required', { target }))
          return true
        }

        if (!isEmail(value)) {
          const target = String(t('common.email'))
          state.emailErrorMessage = String(t('error.invalid', { target }))
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
          const target = String(t('common.password'))
          state.passwordErrorMessage = String(t('error.required', { target }))
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
        t,
        emailInput,
        passwordInput,
        state,
        isEmailError,
        isPasswordError,
        isError,
        close,
        entry,
        clearErrorMessage,
      }
    },
  })
}

export default EmailSignUpView.clazz
// eslint-disable-next-line no-undef
export { EmailSignUpView, EmailSignUpViewResult, EmailSignUpViewStatus }
</script>
