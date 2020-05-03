<template>
  <div>
    <sign-in-dialog ref="signInDialog"></sign-in-dialog>
    <email-change-dialog ref="emailChangeDialog"></email-change-dialog>
    <account-delete-dialog ref="accountDeleteDialog"></account-delete-dialog>
  </div>
</template>

<script lang="ts">
import { AccountDeleteDialog, EmailChangeDialog, SignInDialog } from '@/example/components/complex/auth'
import { BaseHistoryDialogManager, Dialog } from '@/lib'
import { Component } from 'vue-property-decorator'

export namespace SignIn {
  export const name = 'signIn'
}

export namespace EmailChange {
  export const name = 'emailChange'
}

export namespace AccountDelete {
  export const name = 'accountDelete'
}

@Component({
  components: {
    SignInDialog,
    EmailChangeDialog,
    AccountDeleteDialog,
  },
})
export default class HistoryDialogManager extends BaseHistoryDialogManager {
  protected get dialogs(): { [dialogName: string]: Dialog } {
    return {
      [SignIn.name]: this.$refs.signInDialog as Dialog,
      [EmailChange.name]: this.$refs.emailChangeDialog as Dialog,
      [AccountDelete.name]: this.$refs.accountDeleteDialog as Dialog,
    }
  }
}
</script>
