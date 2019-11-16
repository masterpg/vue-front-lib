<template>
  <div>
    <sign-in-dialog ref="signInDialog"></sign-in-dialog>
    <email-change-dialog ref="emailChangeDialog"></email-change-dialog>
    <account-delete-dialog ref="accountDeleteDialog"></account-delete-dialog>
  </div>
</template>

<script lang="ts">
import { BaseHistoryDialogManager, Dialog } from '@/lib'
import {
  AccountDeleteDialog as _AccountDeleteDialog,
  EmailChangeDialog as _EmailChangeDialog,
  SignInDialog as _SignInDialog,
} from '@/example/components/complex/auth'
import { Component } from 'vue-property-decorator'

export namespace SignInDialog {
  export const name = 'SignInDialog'
}

export namespace EmailChangeDialog {
  export const name = 'EmailChangeDialog'
}

export namespace AccountDeleteDialog {
  export const name = 'AccountDeleteDialog'
}

@Component({
  components: {
    SignInDialog: _SignInDialog,
    EmailChangeDialog: _EmailChangeDialog,
    AccountDeleteDialog: _AccountDeleteDialog,
  },
})
export default class HistoryDialogManager extends BaseHistoryDialogManager {
  protected get dialogs(): { [dialogName: string]: Dialog } {
    return {
      [SignInDialog.name]: this.$refs.signInDialog as Dialog,
      [EmailChangeDialog.name]: this.$refs.emailChangeDialog as Dialog,
      [AccountDeleteDialog.name]: this.$refs.accountDeleteDialog as Dialog,
    }
  }
}
</script>
