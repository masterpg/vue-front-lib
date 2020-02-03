import { User } from './store'
import Vue from 'vue'

export type SignedInListenerFunc = (user: User) => any

export type SignedOutListenerFunc = (user: User) => any

let db: firebase.firestore.Firestore

const signedInListeners: SignedInListenerFunc[] = []

const signedOutListeners: SignedOutListenerFunc[] = []

export abstract class BaseLogic extends Vue {
  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
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

  protected get db(): firebase.firestore.Firestore {
    return db
  }

  protected get signedInListeners(): SignedInListenerFunc[] {
    return [...signedInListeners]
  }

  protected get signedOutListeners(): SignedOutListenerFunc[] {
    return [...signedOutListeners]
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  protected addSignedInListener(listener: SignedInListenerFunc): void {
    if (this.signedInListeners.includes(listener)) return
    signedInListeners.push(listener)
  }

  protected removeSignedInListener(listener: SignedInListenerFunc): void {
    const index = this.signedInListeners.indexOf(listener)
    if (index >= 0) {
      signedInListeners.splice(index, 1)
    }
  }

  protected addSignedOutListener(listener: SignedOutListenerFunc): void {
    if (signedOutListeners.includes(listener)) return
    signedOutListeners.push(listener)
  }

  protected removeSignedOutListener(listener: SignedOutListenerFunc): void {
    const index = signedOutListeners.indexOf(listener)
    if (index >= 0) {
      signedOutListeners.splice(index, 1)
    }
  }

  /**
   * Firestoreを初期化します。
   */
  private m_initFirestore(): void {
    // Firestoreのインスタンスが既に初期化されている場合、処理を抜ける
    if (db) return

    // Firestoreインスタンスを初期化
    db = firebase.firestore()
  }
}
