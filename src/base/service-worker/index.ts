import { i18n } from '@/base/i18n'
import { register } from 'register-service-worker'

export namespace sw {
  export enum ChangeState {
    ready = 'ready',
    registered = 'registered',
    cached = 'cached',
    updatefound = 'updatefound',
    updated = 'updated',
    offline = 'offline',
    error = 'error',
  }

  export interface StateChangeInfo {
    state: ChangeState
    message: string
  }

  export type StateChangeLister = (info: StateChangeInfo) => void

  /**
   * ServiceWorkerの状態が変化した際のリスナを登録します。
   * @param listener
   */
  export function addStateChangeListener(listener: StateChangeLister): void {
    stateChangeListeners.push(listener)
  }
}

/**
 * ServiceWorkerの初期化を行います。
 */
export function initServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return

  const execute = process.env.NODE_ENV === 'production'
  if (!execute) return

  register(`${process.env.BASE_URL}service-worker.js`, {
    ready() {
      dispatchToListeners(sw.ChangeState.ready, String(i18n.t('sw.ready')))
    },
    registered() {
      dispatchToListeners(sw.ChangeState.registered, String(i18n.t('sw.registered')))
    },
    cached() {
      dispatchToListeners(sw.ChangeState.cached, String(i18n.t('sw.cached')))
    },
    updatefound() {
      dispatchToListeners(sw.ChangeState.updatefound, String(i18n.t('sw.updatefound')))
    },
    updated() {
      dispatchToListeners(sw.ChangeState.updated, String(i18n.t('sw.updated')))
    },
    offline() {
      dispatchToListeners(sw.ChangeState.offline, String(i18n.t('sw.offline')))
    },
    error(error) {
      dispatchToListeners(sw.ChangeState.error, String(i18n.t('sw.error', { error })))
    },
  })
}

const stateChangeListeners: sw.StateChangeLister[] = []

/**
 * 登録されているサービスワーカーのイベントリスナーにイベントをディスパッチします。
 * @param state
 * @param message
 */
function dispatchToListeners(state: sw.ChangeState, message: string): void {
  for (const listener of stateChangeListeners) {
    listener({ state, message })
  }
}
