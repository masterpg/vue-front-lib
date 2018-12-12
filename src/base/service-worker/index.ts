import { register } from 'register-service-worker';

//----------------------------------------------------------------------
//
//  Definition
//
//----------------------------------------------------------------------

export enum ChangeState {
  ready = 'ready',
  registered = 'registered',
  cached = 'cached',
  updatefound = 'updatefound',
  updated = 'updated',
  offline = 'offline',
  error = 'error',
}

export type StateChangeLister = (info: StateChangeInfo) => void;

export interface StateChangeInfo {
  state: ChangeState;
  message: string;
}

//----------------------------------------------------------------------
//
//  Variables
//
//----------------------------------------------------------------------

const m_stateChangeListeners: StateChangeLister[] = [];

//----------------------------------------------------------------------
//
//  Methods
//
//----------------------------------------------------------------------

/**
 * ServiceWorkerの状態が変化した際のリスナを登録します。
 * @param listener
 */
export function addStateChangeListener(listener: StateChangeLister): void {
  m_stateChangeListeners.push(listener);
}

/**
 * ServiceWorkerの初期化を行います。
 */
export function initServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;

  const execute = process.env.VUE_APP_ENV === 'production' || process.env.VUE_APP_ENV === 'staging';
  if (!execute) return;

  register(`${process.env.BASE_URL}service-worker.js`, {
    ready() {
      m_dispatchToListeners(ChangeState.ready, 'App is being served from cache by a service worker.\nFor more details, visit https://goo.gl/AFskqB');
    },
    registered() {
      m_dispatchToListeners(ChangeState.registered, 'Service worker has been registered.');
    },
    cached() {
      m_dispatchToListeners(ChangeState.cached, 'Content has been cached for offline use.');
    },
    updatefound() {
      m_dispatchToListeners(ChangeState.updatefound, 'New content is downloading.');
    },
    updated() {
      m_dispatchToListeners(ChangeState.updated, 'New content is available; please refresh.');
    },
    offline() {
      m_dispatchToListeners(ChangeState.offline, 'No internet connection found. App is running in offline mode.');
    },
    error(error) {
      m_dispatchToListeners(ChangeState.error, 'Error during service worker registration:' + error);
    },
  });
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
function m_dispatchToListeners(state: ChangeState, message: string): void {
  for (const listener of m_stateChangeListeners) {
    listener({ state, message });
  }
}
