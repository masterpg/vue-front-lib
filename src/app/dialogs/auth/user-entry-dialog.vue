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
        <!-- 名前インプット -->
        <q-input
          ref="fullNameInput"
          v-model="state.fullName"
          type="text"
          :label="t('auth.entry.fullName')"
          :error="isFullNameError"
          :error-message="state.fullNameErrorMessage"
          @input="clearErrorMessage()"
        />
        <!-- 表示名インプット -->
        <q-input
          ref="displayNameInput"
          v-model="state.displayName"
          type="text"
          :label="t('common.displayName')"
          :error="isDisplayNameError"
          :error-message="state.displayNameErrorMessage"
          @input="clearErrorMessage()"
        />
      </q-card-section>

      <!-- エラーメッセージ -->
      <q-card-section v-show="isError">
        <span class="error-message">{{ state.errorMessage }}</span>
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
import { Ref, SetupContext, computed, defineComponent, reactive, ref } from '@vue/composition-api'
import { Dialog } from '@/app/components/dialog'
import { injectLogic } from '@/app/logic'
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
    const logic = injectLogic()
    const { t } = useI18n()

    const fullNameInput = ref() as Ref<QInput>
    const displayNameInput = ref() as Ref<QInput>

    const state = reactive({
      errorMessage: '',
      fullName: null as string | null,
      fullNameErrorMessage: '',
      displayName: null as string | null,
      displayNameErrorMessage: '',
    })

    const isError = computed(() => Boolean(state.errorMessage))
    const isFullNameError = computed(() => validateFullName(state.fullName))
    const isDisplayNameError = computed(() => validateDisplayName(state.displayName))

    //----------------------------------------------------------------------
    //
    //  Methods
    //
    //----------------------------------------------------------------------

    const open: UserEntryDialog['open'] = async () => {
      return base.open()
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
      state.displayName = null
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
      }

      await logic.auth.setUser({
        fullName: state.fullName!,
        displayName: state.displayName!,
      })

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
      state.fullName = state.fullName ?? ''
      if (validateFullName(state.fullName)) {
        return false
      }

      state.displayName = state.displayName ?? ''
      if (validateDisplayName(state.displayName)) {
        return false
      }

      return true
    }

    /**
     * 名前の検証を行います。
     * @param value
     */
    function validateFullName(value: string | null): boolean {
      if (value === null) {
        return false
      }

      if (value === '') {
        const target = String(t('auth.entry.fullName'))
        state.fullNameErrorMessage = String(t('error.required', { target }))
        return true
      }

      return false
    }

    /**
     * 表示名の検証を行います。
     * @param value
     */
    function validateDisplayName(value: string | null): boolean {
      if (value === null) {
        return false
      }

      if (value === '') {
        const target = String(t('common.displayName'))
        state.displayNameErrorMessage = String(t('error.required', { target }))
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
      ...base,
      t,
      fullNameInput,
      displayNameInput,
      state,
      open,
      close,
      isError,
      isFullNameError,
      isDisplayNameError,
      clearErrorMessage,
      entry,
    }
  }
}

export default UserEntryDialog.clazz
export { UserEntryDialog }
</script>
