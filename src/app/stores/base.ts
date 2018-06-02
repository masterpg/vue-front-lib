import Vue from 'vue';
import { Apis } from '../apis/types';
import clone from 'lodash/clone';
import cloneDeep from 'lodash/cloneDeep';

export abstract class BaseStore<S> extends Vue {

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  protected readonly $apis: Apis;

  private m_state: S;

  protected get state(): S {
    return this.m_state;
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  protected initState(state: S): void {
    this.m_state = state;
  }

  protected cloneDeep<T>(source: T): T {
    return cloneDeep(source);
  }

  protected cloneShallow<T>(source: T): T {
    return clone(source);
  }

}
