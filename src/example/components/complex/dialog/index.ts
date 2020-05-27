import HistoryDialogManager, { EmailChange, SignIn, SignUp, UserDelete, UserEntry } from './history-dialog-manager.vue'

//========================================================================
//
//  Implementation
//
//========================================================================

let dialog: HistoryDialogManager

function initDialog(d: HistoryDialogManager) {
  dialog = d
}

//========================================================================
//
//  Exports
//
//========================================================================

export { HistoryDialogManager, EmailChange, SignIn, SignUp, UserDelete, UserEntry, dialog, initDialog }
