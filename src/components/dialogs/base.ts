import { QDialog } from 'quasar'
import { ref } from '@vue/composition-api'

//========================================================================
//
//  Interfaces
//
//========================================================================

/**
 * ダイアログのインタフェースです。
 */
interface BaseDialog<PARAMS = void, RESULT = void> {
  open(params: PARAMS): Promise<RESULT>
  close(result: RESULT): void
}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace BaseDialog {
  export function setup<RESULT = void>() {
    //----------------------------------------------------------------------
    //
    //  Variables
    //
    //----------------------------------------------------------------------

    const dialog = ref<QDialog>()

    const opened = ref(false)

    let dialogResolver: ((value: RESULT) => void) | null = null

    let openedCallback: () => void = () => {}

    //----------------------------------------------------------------------
    //
    //  Internal methods
    //
    //----------------------------------------------------------------------

    function open(options: { opened?: () => void } = {}): Promise<RESULT> {
      openedCallback = options.opened ? options.opened : openedCallback

      dialog.value!.$once('show', () => {
        openedCallback()
      })

      return new Promise(resolve => {
        dialogResolver = resolve
        opened.value = true
      })
    }

    function close(value: RESULT): void {
      dialogResolver?.(value)
      dialogResolver = null
      opened.value = false
    }

    //----------------------------------------------------------------------
    //
    //  Result
    //
    //----------------------------------------------------------------------

    return {
      dialog,
      opened,
      open,
      close,
    }
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { BaseDialog }
