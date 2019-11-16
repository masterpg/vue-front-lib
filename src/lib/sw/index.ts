import { i18n } from '../i18n'

//========================================================================
//
//  Exports
//
//========================================================================

export let sw: BaseSWManager

export function setSW(value: BaseSWManager): void {
  sw = value
}

export enum SWChangeState {
  ready = 'ready',
  registered = 'registered',
  cached = 'cached',
  updatefound = 'updatefound',
  updated = 'updated',
  offline = 'offline',
  error = 'error',
}

export interface SWStateChangeInfo {
  state: SWChangeState
  message: string
}

export type StateChangeLister = (info: SWStateChangeInfo) => void

export abstract class BaseSWManager {
  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  constructor() {
    if (!('serviceWorker' in navigator)) return

    const execute = process.env.NODE_ENV === 'production'
    if (!execute) return

    const register = require('register-service-worker').register
    register(`${process.env.BASE_URL}service-worker.js`, {
      ready: () => {
        this.m_dispatchToListeners(SWChangeState.ready, String(i18n.t('sw.ready')))
      },
      registered: () => {
        this.m_dispatchToListeners(SWChangeState.registered, String(i18n.t('sw.registered')))
      },
      cached: () => {
        this.m_dispatchToListeners(SWChangeState.cached, String(i18n.t('sw.cached')))
      },
      updatefound: () => {
        this.m_dispatchToListeners(SWChangeState.updatefound, String(i18n.t('sw.updatefound')))
      },
      updated: () => {
        this.m_dispatchToListeners(SWChangeState.updated, String(i18n.t('sw.updated')))
      },
      offline: () => {
        this.m_dispatchToListeners(SWChangeState.offline, String(i18n.t('sw.offline')))
      },
      error: err => {
        this.m_dispatchToListeners(SWChangeState.error, String(i18n.t('sw.error', { err })))
      },
    })
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private m_stateChangeListeners: StateChangeLister[] = []

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  /**
   * ServiceWorkerの状態が変化した際のリスナを登録します。
   * @param listener
   */
  addStateChangeListener(listener: StateChangeLister): void {
    this.m_stateChangeListeners.push(listener)
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  /**
   * 登録されているサービスワーカーのイベントリスナーにイベントをディスパッチします。
   * @param state
   * @param message
   */
  private m_dispatchToListeners(state: SWChangeState, message: string): void {
    for (const listener of this.m_stateChangeListeners) {
      listener({ state, message })
    }
  }
}
