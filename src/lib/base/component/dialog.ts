import { BaseComponent } from './base-component'
import { Resizable } from './resizable'
import Vue from 'vue'
import { mixins } from 'vue-class-component'

/**
 * ダイアログのインタフェースです。
 */
export interface Dialog<PARAM = void, RESULT = void> extends Vue {
  open(param: PARAM): Promise<RESULT>

  close(result: RESULT): void
}

/**
 * ダイアログの基底クラスです。
 */
export abstract class BaseDialog<PARAM = void, RESULT = void> extends mixins(BaseComponent, Resizable) implements Dialog<PARAM, RESULT> {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  protected opened: boolean = false

  private m_dialogResolver: ((value: RESULT) => void) | null = null

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  abstract open(param: PARAM): Promise<RESULT>

  abstract close(result: RESULT): void

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  protected openProcess(param: PARAM): Promise<RESULT> {
    return new Promise(resolve => {
      this.m_dialogResolver = resolve
      this.opened = true
    })
  }

  protected closeProcess(value: RESULT): void {
    this.m_dialogResolver && this.m_dialogResolver!(value)
    this.m_dialogResolver = null
    this.opened = false
  }
}
