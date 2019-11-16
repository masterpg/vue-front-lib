import { Dialog, QBar, QBtn, QCheckbox, QIcon, QLinearProgress, QSpace, QSplitter } from 'quasar'

//========================================================================
//
//  Exports
//
//========================================================================

export namespace quasar {
  export function importExtras() {
    require('@quasar/extras/roboto-font/roboto-font.css')
    require('@quasar/extras/material-icons/material-icons.css')
    require('@quasar/extras/fontawesome-v5/fontawesome-v5.css')
  }

  export const components = {
    QBar,
    QBtn,
    QCheckbox,
    QIcon,
    QSpace,
    QLinearProgress,
    QSplitter,
  }

  export const config = {}

  export const directives = {}

  export const plugins = {
    Dialog,
  }
}
