import { AuthStatus } from './api'
import { Component } from 'vue-property-decorator'
import Vue from 'vue'

@Component
class BaseLogicStore extends Vue {
  m_db: firebase.firestore.Firestore | null = null

  get db(): firebase.firestore.Firestore {
    if (!this.m_db) this.m_db = firebase.firestore()
    return this.m_db
  }

  authStatus: AuthStatus = AuthStatus.None
}

const logicStore = new BaseLogicStore()

export abstract class BaseLogic extends Vue {
  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  constructor() {
    super()
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  protected get db(): firebase.firestore.Firestore {
    return logicStore.db
  }

  protected get authStatus(): AuthStatus {
    return logicStore.authStatus
  }

  protected setAuthStatus(value: AuthStatus): void {
    logicStore.authStatus = value
  }

  protected get isSignedIn(): boolean {
    return this.authStatus === AuthStatus.Available
  }
}
