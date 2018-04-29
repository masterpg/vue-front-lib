import Vue from 'vue';
import { clone, cloneDeep } from 'lodash';

export abstract class BaseModule<S> extends Vue {

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

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

  protected init<T>(state: S): T {
    this.m_state = state;
    return (this as any) as T;
  }

  protected cloneDeep<T>(source: T): T {
    return cloneDeep(source);
  }

  protected cloneShallow<T>(source: T): T {
    return clone(source);
  }

}
