<template>
  <div>
    <sign-in-dialog ref="signInDialog"></sign-in-dialog>
    <sign-up-dialog ref="signUpDialog"></sign-up-dialog>
    <email-change-dialog ref="emailChangeDialog"></email-change-dialog>
    <user-delete-dialog ref="userDeleteDialog"></user-delete-dialog>
    <user-entry-dialog ref="userEntryDialog"></user-entry-dialog>
  </div>
</template>

<script lang="ts">
import { EmailChangeDialog, SignInDialog, SignUpDialog, UserDeleteDialog, UserEntryDialog } from '@/example/dialog/auth'
import { BaseHistoryDialogManager } from '@/example/components'
import { Component } from 'vue-property-decorator'
import { Dialog } from '@/example/base'

export namespace SignIn {
  export const name = 'signIn'
}

export namespace SignUp {
  export const name = 'signUp'
}

export namespace EmailChange {
  export const name = 'emailChange'
}

export namespace UserDelete {
  export const name = 'userDelete'
}

export namespace UserEntry {
  export const name = 'userEntry'
}

@Component({
  components: {
    SignInDialog,
    SignUpDialog,
    EmailChangeDialog,
    UserDeleteDialog,
    UserEntryDialog,
  },
})
export default class HistoryDialogManager extends BaseHistoryDialogManager {
  protected get dialogs(): { [dialogName: string]: Dialog } {
    return {
      [SignIn.name]: this.$refs.signInDialog as Dialog,
      [SignUp.name]: this.$refs.signUpDialog as Dialog,
      [EmailChange.name]: this.$refs.emailChangeDialog as Dialog,
      [UserDelete.name]: this.$refs.userDeleteDialog as Dialog,
      [UserEntry.name]: this.$refs.userEntryDialog as Dialog,
    }
  }
}
</script>
