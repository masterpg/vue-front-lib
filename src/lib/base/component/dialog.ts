import { BaseComponent } from './base-component'
import { Component } from 'vue-property-decorator'
import { QDialog } from 'quasar'
import { Resizable } from './resizable'
import Vue from 'vue'
import { mixins } from 'vue-class-component'

/**
 * ダイアログのインタフェースです。
 */
export interface Dialog<PARAMS = void, RESULT = void> extends Vue {
  open(params: PARAMS): Promise<RESULT>

  close(result: RESULT): void
}

/**
 * ダイアログの基底クラスです。
 *
 * mixin()を使用して本クラスを継承する場合について:
 *   本クラスはジェネリクスの指定が必要ですが、ジェネリクスを付与したクラスを`mixin()`に指定
 *   するとコンパイルエラーになります。このため一旦ジェネリクスを付与したクラスを作成し、
 *   このクラスを`mixin()`に渡すようにしてコンパイルエラーを回避してください。以下に例を示します。
 * ```
 * @Component
 * class BaseDialogMixin extends BaseDialog<string> {}
 *
 * @Component
 * export default class CustomDialog extends mixins(BaseDialogMixin, OtherMixin) {
 *   …
 * }
 * ```
 */
@Component
export class BaseDialog<PARAMS = void, RESULT = void> extends mixins(BaseComponent, Resizable) implements Dialog<PARAMS, RESULT> {
  //----------------------------------------------------------------------
  //
  //  Abstract members
  //
  //----------------------------------------------------------------------

  protected get dialog(): QDialog {
    throw new Error('Not implemented.')
  }

  open(params: PARAMS): Promise<RESULT> {
    throw new Error('Not implemented.')
  }

  close(result: RESULT): void {
    throw new Error('Not implemented.')
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  protected opened = false

  protected params: PARAMS | null = null

  private m_dialogResolver: ((value: RESULT) => void) | null = null

  private m_openedCallback: () => void = () => {}

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  protected openProcess(params: PARAMS, options: { opened?: () => void } = {}): Promise<RESULT> {
    this.params = params
    this.m_openedCallback = options.opened ? options.opened : this.m_openedCallback

    this.dialog.$once('show', () => {
      this.m_openedCallback()
    })

    return new Promise(resolve => {
      this.m_dialogResolver = resolve
      this.opened = true
    })
  }

  protected closeProcess(value: RESULT): void {
    this.m_dialogResolver && this.m_dialogResolver!(value)
    this.params = null
    this.m_dialogResolver = null
    this.opened = false
  }
}
