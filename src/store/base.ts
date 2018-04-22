import { Commit, Dispatch, Store } from 'vuex';
import { RootState } from './states';

//----------------------------------------------------------------------
//
//  Facades
//
//----------------------------------------------------------------------

export abstract class BaseFacade {
  constructor(store: VuexStore) {
    this._store = store;
  }
  readonly _store: VuexStore;
}

//----------------------------------------------------------------------
//
//  Vuex
//
//----------------------------------------------------------------------

export interface VuexStore extends Store<RootState> {}

export interface BehaviorContext {
  dispatch: Dispatch;
  commit: Commit;
}

export interface ActionContext<S, R, G> extends BehaviorContext {
  state: S;
  getters: G;
  rootState: R;
  rootGetters: any;
}
