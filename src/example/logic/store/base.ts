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

export type StatePartial<T> = Partial<Omit<T, 'id'>> & { id: string }

export class StoreError<T> extends Error {
  constructor(type: T) {
    super()
    this.errorType = type
  }

  errorType: T
}
