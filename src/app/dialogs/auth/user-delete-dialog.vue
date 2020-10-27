<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.UserDeleteDialog

.container
  width: 340px
  body.screen--lg &, body.screen--xl & body.screen--md &
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
  <q-dialog ref="dialog" v-model="opened" persistent class="UserDeleteDialog">
    <!--
      アカウント削除ビュー
    -->
    <q-card v-if="state.viewType === 'userDelete' || sate.viewType === 'userDelete.signIn'" class="container">
      <!-- タイトル -->
      <q-card-section>
        <div class="title">{{ t('auth.deleteUser') }}</div>
      </q-card-section>

      <!-- コンテンツエリア -->
      <q-card-section>
        <div v-if="state.viewType === 'userDelete'">{{ t('auth.deleteUserMsg') }}</div>
        <div v-else-if="state.viewType === 'userDelete.signIn'">{{ t('auth.deleteUserSignInMsg') }}</div>
      </q-card-section>

      <!-- エラーメッセージ -->
      <q-card-section v-show="isError">
        <span class="error-message">{{ state.errorMessage }}</span>
      </q-card-section>

      <!-- ボタンエリア -->
      <q-card-section class="layout horizontal center end-justified">
        <!-- CANCELボタン -->
        <q-btn flat rounded color="primary" :label="t('common.cancel')" @click="close()" />
        <!-- OKボタン -->
        <q-btn v-show="state.viewType === 'userDelete'" flat rounded color="primary" :label="t('common.ok')" @click="deleteUser()" />
        <!-- SIGN INボタン -->
        <q-btn
          v-show="state.viewType === 'userDelete.signIn'"
          flat
          rounded
          color="primary"
          :label="t('common.signIn')"
          @click="visibleProviderList()"
        />
      </q-card-section>
    </q-card>

    <!--
      プロバイダリストビュー
    -->
    <ProviderListView
      v-if="state.viewType === 'providerList'"
      :title="t('common.signIn')"
      type="signIn"
      :visible-providers="state.visibleProviders"
      @select-google="selectGoogle()"
      @select-facebook="selectFacebook()"
      @select-email="selectEmail()"
      @select-anonymous="selectAnonymous()"
      @closed="close()"
    />

    <!--
      サインインビュー
    -->
    <EmailSignInView
      v-else-if="state.viewType === 'emailSignIn'"
      :title="t('common.signIn')"
      :email="state.currentEmail"
      readonly-email
      @closed="emailSignInViewOnClose"
    />
  </q-dialog>
</template>

<script lang="ts">
import { AuthProviderType, AuthStatus, injectLogic } from '@/app/logic'
import { EmailSignInView, EmailSignInViewResult } from '@/app/dialogs/auth/parts/email-sign-in-view.vue'
import { Loading, QDialog } from 'quasar'
import { SetupContext, computed, defineComponent, reactive, ref } from '@vue/composition-api'
import { Dialog } from '@/app/components/dialog'
import { Dialogs } from '@/app/dialogs'
import { ProviderListView } from '@/app/dialogs/auth/parts/provider-list-view.vue'
import { useI18n } from '@/app/i18n'

interface UserDeleteDialog extends Dialog<void, void> {}

interface Props {}

namespace UserDeleteDialog {
  export const clazz = defineComponent({
    name: 'UserDeleteDialog',

    components: {
      ProviderListView: ProviderListView.clazz,
      EmailSignInView: EmailSignInView.clazz,
    },

    setup: (props: Props, ctx) => setup(props, ctx),
  })

  export function setup(props: Props, ctx: SetupContext) {
    //----------------------------------------------------------------------
    //
    //  Variables
    //
    //----------------------------------------------------------------------

    const dialog = ref<QDialog>()
    const base = Dialog.setup<void>(dialog)
    const logic = injectLogic()
    const { t } = useI18n()

    const state = reactive({
      title: String(t('auth.deleteUser')),
      viewType: 'userDelete' as 'userDelete' | 'userDelete.signIn' | 'providerList' | 'emailSignIn',
      currentEmail: null as string | null,
      visibleProviders: [] as AuthProviderType[],
      errorMessage: '',
    })

    const isError = computed(() => Boolean(state.errorMessage))

    //----------------------------------------------------------------------
    //
    //  Methods
    //
    //----------------------------------------------------------------------

    const open: UserDeleteDialog['open'] = async () => {
      if (!logic.auth.isSignedIn) {
        Dialogs.clearQuery()
        return
      }
      state.currentEmail = logic.auth.user.email
      visibleUserDelete()
      return base.open()
    }

    const close: UserDeleteDialog['close'] = () => {
      base.close()
    }

    //----------------------------------------------------------------------
    //
    //  Internal methods
    //
    //----------------------------------------------------------------------

    async function deleteUser(): Promise<void> {
      Loading.show()

      const deleteResult = await logic.auth.deleteUser()
      if (!deleteResult.result) {
        state.errorMessage = deleteResult.errorMessage
        // ユーザーの認証情報が古すぎる場合、再度サインインが必要
        if (deleteResult.code === 'auth/requires-recent-login') {
          state.viewType = 'userDelete.signIn'
        }
        Loading.hide()
        return
      }

      Loading.hide()
      close()
    }

    async function selectGoogle(): Promise<void> {
      await logic.auth.signInWithGoogle()
    }

    async function selectFacebook(): Promise<void> {
      await logic.auth.signInWithFacebook()
    }

    function selectEmail(): void {
      state.viewType = 'emailSignIn'
    }

    async function selectAnonymous(): Promise<void> {
      await logic.auth.signInAnonymously()
    }

    function visibleUserDelete() {
      state.errorMessage = ''
      state.viewType = 'userDelete'
    }

    async function visibleProviderList(): Promise<void> {
      const user = logic.auth.user
      state.visibleProviders = await logic.auth.fetchSignInMethodsForEmail(user.email)
      state.viewType = 'providerList'
    }

    //----------------------------------------------------------------------
    //
    //  Event listeners
    //
    //----------------------------------------------------------------------

    async function emailSignInViewOnClose(closeResult: EmailSignInViewResult) {
      switch (closeResult.status) {
        case AuthStatus.WaitForEmailVerified:
        case AuthStatus.WaitForEntry:
        case AuthStatus.Available: {
          visibleUserDelete()
          break
        }
        case 'cancel': {
          close()
        }
      }
    }

    //----------------------------------------------------------------------
    //
    //  Result
    //
    //----------------------------------------------------------------------

    return {
      ...base,
      t,
      state,
      isError,
      open,
      close,
      deleteUser,
      visibleProviderList,
      emailSignInViewOnClose,
    }
  }
}

export default UserDeleteDialog.clazz
export { UserDeleteDialog }
</script>
