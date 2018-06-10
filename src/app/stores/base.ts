import Vue from 'vue';
import { APIs } from '../apis/types';

export abstract class BaseStore<S> extends Vue {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  protected readonly $apis: APIs;

  private m_state: S;

  protected get state(): S {
    return this.m_state;
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  /**
   * Storeにひも付くStateを初期化します。
   * @param state
   */
  protected initState(state: S): void {
    this.m_state = state;
  }
}
