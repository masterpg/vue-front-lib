import 'firebase/firestore';
import * as firebase from 'firebase';
import Vue from 'vue';
import { APIs } from '../apis/types';

export abstract class BaseStore<S> extends Vue {
  //----------------------------------------------------------------------
  //
  //  Constructors
  //
  //----------------------------------------------------------------------

  constructor() {
    super();
    this.f_db = firebase.firestore();
    this.f_db.settings({ timestampsInSnapshots: true });
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  protected readonly $apis: APIs;

  m_state: S;

  get f_state(): S {
    return this.m_state;
  }

  readonly f_db: firebase.firestore.Firestore;

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  /**
   * Storeにひも付くStateを初期化します。
   * @param state
   */
  f_initState(state: S): void {
    this.m_state = state;
  }
}
