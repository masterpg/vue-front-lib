import Vue from 'vue'

export abstract class BaseStore<S> extends Vue {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private m_state!: S

  protected get state(): S {
    return this.m_state
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  /**
   * Moduleにひも付くStateを初期化します。
   * @param state
   */
  protected initState(state: Required<S>): void {
    this.m_state = state
  }
}
