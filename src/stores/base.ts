import Vue from 'vue';
import { APIs } from '@/apis';

let db: firebase.firestore.Firestore;

export abstract class BaseStore<S> extends Vue {
  //----------------------------------------------------------------------
  //
  //  Constructors
  //
  //----------------------------------------------------------------------

  constructor() {
    super();
    this.m_initFirestore();
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

  get f_db(): firebase.firestore.Firestore {
    return db;
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  /**
   * Firestoreを初期化します。
   */
  m_initFirestore(): void {
    // Firestoreのインスタンスが既に初期化されている場合、処理を抜ける
    if (db) return;

    // Firestoreインスタンスを初期化
    db = firebase.firestore();
    // Firestoreで日付オブジェクトを扱うのに必要な設定
    // 現段階ではこの設定がないとエラーになるため必須
    db.settings({ timestampsInSnapshots: true });
  }

  /**
   * Storeにひも付くStateを初期化します。
   * @param state
   */
  f_initState(state: S): void {
    this.m_state = state;
  }
}
