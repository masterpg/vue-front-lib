import { BaseComponent } from './base-component'
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
 */
export abstract class BaseDialog<PARAMS = void, RESULT = void> extends mixins(BaseComponent, Resizable) implements Dialog<PARAMS, RESULT> {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  protected opened: boolean = false

  protected params: PARAMS | null = null

  private m_dialogResolver: ((value: RESULT) => void) | null = null

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  abstract open(params: PARAMS): Promise<RESULT>

  abstract close(result: RESULT): void

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  protected openProcess(params: PARAMS): Promise<RESULT> {
    this.params = params
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
