import HistoryDialogManager, { EmailChange, SignIn, SignUp, UserDelete, UserEntry } from './history-dialog-manager.vue'

//========================================================================
//
//  Implementation
//
//========================================================================

let dialogManager: HistoryDialogManager

function initDialog(d: HistoryDialogManager) {
  dialogManager = d
}

//========================================================================
//
//  Exports
//
//========================================================================

export { HistoryDialogManager, EmailChange, SignIn, SignUp, UserDelete, UserEntry, dialogManager, initDialog }
