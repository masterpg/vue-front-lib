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
  <q-dialog ref="dialog" class="UserDeleteDialog" v-model="opened" persistent>
    <!--
      アカウント削除ビュー
    -->
    <q-card v-if="state.viewType === 'UserDelete' || sate.viewType === 'UserDelete.SignIn'" class="container">
      <!-- タイトル -->
      <q-card-section>
        <div class="title">{{ t('auth.deleteUser') }}</div>
      </q-card-section>

      <!-- コンテンツエリア -->
      <q-card-section>
        <div v-if="state.viewType === 'UserDelete'">{{ t('auth.deleteUserMsg') }}</div>
        <div v-else-if="state.viewType === 'UserDelete.SignIn'">{{ t('auth.deleteUserSignInMsg') }}</div>
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
        <q-btn v-show="state.viewType === 'UserDelete'" flat rounded color="primary" :label="t('common.ok')" @click="deleteUser()" />
        <!-- SIGN INボタン -->
        <q-btn
          v-show="state.viewType === 'UserDelete.SignIn'"
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
      v-if="state.viewType === 'ProviderList'"
      :title="t('common.signIn')"
      type="SignIn"
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
      v-else-if="state.viewType === 'EmailSignIn'"
      :title="t('common.signIn')"
      :email="state.currentEmail"
      readonly-email
      @closed="emailSignInViewOnClose"
    />
  </q-dialog>
</template>

<script lang="ts">
import { AuthProviderType, AuthStatus, injectService } from '@/app/service'
import { EmailSignInView, EmailSignInViewResult } from '@/app/dialogs/auth/parts/email-sign-in-view.vue'
import { Loading, QDialog } from 'quasar'
import { SetupContext, computed, defineComponent, reactive, ref } from '@vue/composition-api'
import { Dialog } from '@/app/components/dialog'
import { Dialogs } from '@/app/dialogs'
import { ProviderListView } from '@/app/dialogs/auth/parts/provider-list-view.vue'
import { useI18n } from '@/app/i18n'

interface UserDeleteDialog extends Dialog<void, void> {}

namespace UserDeleteDialog {
  export interface Props {}

  export const clazz = defineComponent({
    name: 'UserDeleteDialog',

    components: {
      ProviderListView: ProviderListView.clazz,
      EmailSignInView: EmailSignInView.clazz,
    },

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

    const state = reactive({
      title: String(i18n.t('auth.deleteUser')),
      viewType: 'UserDelete' as 'UserDelete' | 'UserDelete.SignIn' | 'ProviderList' | 'EmailSignIn',
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
      if (!service.auth.isSignedIn) {
        Dialogs.clearQuery()
        return
      }
      state.currentEmail = service.auth.user.email
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

      const deleteResult = await service.auth.deleteUser()
      if (!deleteResult.result) {
        state.errorMessage = deleteResult.errorMessage
        // ユーザーの認証情報が古すぎる場合、再度サインインが必要
        if (deleteResult.code === 'auth/requires-recent-login') {
          state.viewType = 'UserDelete.SignIn'
        }
        Loading.hide()
        return
      }

      Loading.hide()
      close()
    }

    async function selectGoogle(): Promise<void> {
      await service.auth.signInWithGoogle()
    }

    async function selectFacebook(): Promise<void> {
      await service.auth.signInWithFacebook()
    }

    function selectEmail(): void {
      state.viewType = 'EmailSignIn'
    }

    async function selectAnonymous(): Promise<void> {
      await service.auth.signInAnonymously()
    }

    function visibleUserDelete() {
      state.errorMessage = ''
      state.viewType = 'UserDelete'
    }

    async function visibleProviderList(): Promise<void> {
      const user = service.auth.user
      state.visibleProviders = await service.auth.fetchSignInMethodsForEmail(user.email)
      state.viewType = 'ProviderList'
    }

    //----------------------------------------------------------------------
    //
    //  Event listeners
    //
    //----------------------------------------------------------------------

    async function emailSignInViewOnClose(closeResult: EmailSignInViewResult) {
      switch (closeResult.status) {
        case 'WaitForEmailVerified':
        case 'WaitForEntry':
        case 'Available': {
          visibleUserDelete()
          break
        }
        case 'Cancel': {
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
      ...i18n,
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
