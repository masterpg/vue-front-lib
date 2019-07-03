import Vue from 'vue'

let db: firebase.firestore.Firestore

export abstract class BaseModule<S> extends Vue {
  //----------------------------------------------------------------------
  //
  //  Constructors
  //
  //----------------------------------------------------------------------

  constructor() {
    super()
    this.m_initFirestore()
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private m_state!: S

  protected get state(): S {
    return this.m_state
  }

  get f_db(): firebase.firestore.Firestore {
    return db
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
    if (db) return

    // Firestoreインスタンスを初期化
    db = firebase.firestore()
    // Firestoreで日付オブジェクトを扱うのに必要な設定
    // 現段階ではこの設定がないとエラーになるため必須
    db.settings({ timestampsInSnapshots: true })
  }

  /**
   * Moduleにひも付くStateを初期化します。
   * @param state
   */
  protected initState(state: S): void {
    this.m_state = state
  }
}
