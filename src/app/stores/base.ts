import Vue from 'vue';
import { Apis } from '../apis/types';
import { clone, cloneDeep } from 'lodash';

export abstract class BaseStore<S> extends Vue {

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  protected readonly $apis: Apis;

  // @ts-ignore
  private m_state: S = null;

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
