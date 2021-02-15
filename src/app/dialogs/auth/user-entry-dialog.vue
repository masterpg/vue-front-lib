<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.container
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
  <q-dialog ref="dialog" class="UserEntryDialog" v-model="opened" persistent>
    <!-- ユーザー情報ビュー -->
    <q-card class="container">
      <!-- タイトル -->
      <q-card-section>
        <div class="title">{{ t('auth.entry.userInfo') }}</div>
      </q-card-section>

      <!-- コンテンツエリア -->
      <q-card-section>
        <!-- ユーザー名インプット -->
        <q-input
          ref="userNameInput"
          v-model="userName"
          type="text"
          :label="t('auth.entry.userName')"
          :error="Boolean(userNameErrorMessage)"
          :error-message="userNameErrorMessage"
        />
        <!-- フルネームインプット -->
        <q-input
          ref="fullNameInput"
          v-model="fullName"
          type="text"
          :label="t('auth.entry.fullName')"
          :error="Boolean(fullNameErrorMessage)"
          :error-message="fullNameErrorMessage"
        />
      </q-card-section>

      <!-- エラーメッセージ -->
      <q-card-section v-show="Boolean(errorMessage)">
        <span class="error-message">{{ errorMessage }}</span>
      </q-card-section>

      <!-- ボタンエリア -->
      <q-card-section class="layout horizontal center end-justified">
        <!-- CANCELボタン -->
        <q-btn flat rounded color="primary" :label="t('common.cancel')" @click="close()" />
        <!-- 登録ボタン -->
        <q-btn flat rounded color="primary" :label="t('common.entry')" @click="entry()" />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { Loading, QDialog, QInput } from 'quasar'
import { Ref, SetupContext, defineComponent, ref, watch } from '@vue/composition-api'
import { SetOwnUserInfoResultStatus, injectService } from '@/app/service'
import { Dialog } from '@/app/components/dialog'
import { useI18n } from '@/app/i18n'

interface UserEntryDialog extends Dialog<void, void> {}

namespace UserEntryDialog {
  export interface Props {}

  export const clazz = defineComponent({
    name: 'UserEntryDialog',

    setup: (props: Readonly<Props>, ctx) => setup(props, ctx),
  })

  export function setup(props: Readonly<Props>, ctx: SetupContext) {
    //----------------------------------------------------------------------
    //
    //  Variables
    //
    //----------------------------------------------------------------------

    const dialog = ref<QDialog>()
    const base = Dialog.setup<void>(dialog)
    const service = injectService()
    const i18n = useI18n()

    const userNameInput = ref() as Ref<QInput>
    const fullNameInput = ref() as Ref<QInput>

    const userName = ref<string | null>('')
    const fullName = ref<string | null>('')

    const errorMessage = ref('')
    const userNameErrorMessage = ref('')
    const fullNameErrorMessage = ref('')

    //----------------------------------------------------------------------
    //
    //  Methods
    //
    //----------------------------------------------------------------------

    const open: UserEntryDialog['open'] = async () => {
      return base.open({
        opened: () => {
          userNameInput.value.focus()
        },
      })
    }

    const close: UserEntryDialog['close'] = () => {
      clear()
      base.close()
    }

    //----------------------------------------------------------------------
    //
    //  Internal methods
    //
    //----------------------------------------------------------------------

    /**
     *  ビューをクリアします。
     */
    function clear(): void {
      userName.value = null
      fullName.value = null
      errorMessage.value = ''
      userNameErrorMessage.value = ''
      fullNameErrorMessage.value = ''
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

      const ret = await service.auth.setUserInfo({
        userName: userName.value!,
        fullName: fullName.value!,
      })

      if (ret.status === 'AlreadyExists') {
        userNameErrorMessage.value = String(i18n.t('auth.entry.userNameAlreadyExists'))
        Loading.hide()
        return
      }

      close()

      Loading.hide()
    }

    //--------------------------------------------------
    //  Validation
    //--------------------------------------------------

    /**
     * 入力値の検証を行います。
     */
    function validate(): boolean {
      userName.value = userName.value ?? ''
      if (!validateUserName(userName.value)) {
        return false
      }

      fullName.value = fullName.value ?? ''
      if (!validateFullName(fullName.value)) {
        return false
      }

      return true
    }

    /**
     * ユーザー名の検証を行います。
     * @param value
     */
    function validateUserName(value: string | null): boolean {
      function setInvalidError(): void {
        const target = String(i18n.t('auth.entry.userName'))
        userNameErrorMessage.value = String(i18n.t('error.invalid', { target }))
      }

      if (value === null) {
        return true
      }

      userNameErrorMessage.value = ''

      if (value === '') {
        const target = String(i18n.t('auth.entry.userName'))
        userNameErrorMessage.value = String(i18n.t('error.required', { target }))
        return false
      }

      // 60文字以下であることを検証
      if (value.length > 60) {
        setInvalidError()
        return false
      }

      // 英(大小)数と｢-_｣以外の文字が使用されていないことを検証
      if (/[^a-zA-Z0-9.\-_]/.test(value)) {
        setInvalidError()
        return false
      }

      return true
    }

    /**
     * フルネームの検証を行います。
     * @param value
     */
    function validateFullName(value: string | null): boolean {
      function setInvalidError(): void {
        const target = String(i18n.t('auth.entry.fullName'))
        fullNameErrorMessage.value = String(i18n.t('error.invalid', { target }))
      }

      if (value === null) {
        return true
      }

      fullNameErrorMessage.value = ''

      if (value === '') {
        const target = String(i18n.t('auth.entry.fullName'))
        fullNameErrorMessage.value = String(i18n.t('error.required', { target }))
        return false
      }

      // 60文字以下であることを検証
      if (value.length > 60) {
        setInvalidError()
        return false
      }

      // 禁則文字が使用されていないことを検証
      /* eslint-disable no-irregular-whitespace */
      // ※ 改行、タブ、｢<>^*~　｣
      if (/\n|\r|\r\n|\t|[<>^*~　]/.test(value)) {
        setInvalidError()
        return false
      }
      /* eslint-disable no-irregular-whitespace */

      return true
    }

    //----------------------------------------------------------------------
    //
    //  Event listeners
    //
    //----------------------------------------------------------------------

    watch(
      () => userName.value,
      (newValue, oldValue) => {
        validateUserName(userName.value)
      }
    )

    watch(
      () => fullName.value,
      (newValue, oldValue) => {
        validateFullName(fullName.value)
      }
    )

    //----------------------------------------------------------------------
    //
    //  Result
    //
    //----------------------------------------------------------------------

    return {
      ...base,
      ...i18n,
      fullNameInput,
      userNameInput,
      userName,
      fullName,
      errorMessage,
      userNameErrorMessage,
      fullNameErrorMessage,
      open,
      close,
      entry,
    }
  }
}

export default UserEntryDialog.clazz
export { UserEntryDialog }
</script>
