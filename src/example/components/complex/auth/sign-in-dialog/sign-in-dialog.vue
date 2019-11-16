<style lang="sass" scoped></style>

<template>
  <q-dialog v-model="opened" persistent>
    <provider-list-view
      v-if="m_state === 'list'"
      @select-google="m_selectGoogle()"
      @select-facebook="m_selectFacebook()"
      @select-email="m_selectEmail()"
      @select-anonymous="m_selectAnonymous()"
      @closed="close()"
    />
    <email-auth-view v-else-if="m_state === 'email'" @signed-in="close()" @closed="close()" />
  </q-dialog>
</template>

<script lang="ts">
import { BaseDialog } from '@/lib'
import { Component } from 'vue-property-decorator'
import EmailAuthView from '@/example/components/complex/auth/sign-in-dialog/email-auth-view.vue'
import ProviderListView from '@/example/components/complex/auth/base/provider-list-view.vue'
import { router } from '@/example/router'

@Component({
  components: {
    EmailAuthView,
    ProviderListView,
  },
})
export default class SignInDialog extends BaseDialog<void, void> {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private m_state: 'list' | 'email' = 'list'

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  open(): Promise<void> {
    this.m_state = 'list'
    return this.openProcess()
  }

  close(): void {
    this.closeProcess()
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  private async m_selectGoogle(): Promise<void> {
    router.removeDialogInfoFromURL()
    await this.$logic.auth.signInWithGoogle()
  }

  private async m_selectFacebook(): Promise<void> {
    router.removeDialogInfoFromURL()
    await this.$logic.auth.signInWithFacebook()
  }

  private m_selectEmail(): void {
    this.m_state = 'email'
  }

  private async m_selectAnonymous(): Promise<void> {
    router.removeDialogInfoFromURL()
    await this.$logic.auth.signInAnonymously()
  }
}
</script>
