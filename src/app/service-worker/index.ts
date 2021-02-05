import { InjectionKey, inject, provide, reactive } from '@vue/composition-api'
import { ServiceWorkerChangeState } from '@/app/service-worker/register'
import { useConfig } from '@/app/config'
import { useI18n } from '@/app/i18n'
const path = require('path')

//========================================================================
//
//  Interfaces
//
//========================================================================

interface ServiceWorkerManager {
  /**
   * ServiceWorkerの状態が変化した際のリスナを登録します。
   * @param listener
   */
  addStateChangeListener(listener: StateChangeLister): void
}

type StateChangeLister = (info: ServiceWorkerStateChangeInfo) => void

interface ServiceWorkerStateChangeInfo {
  state: ServiceWorkerChangeState
  message: string
}

//========================================================================
//
//  Implementation
//
//========================================================================

const emptyInstance: ServiceWorkerManager = {
  addStateChangeListener(listener: StateChangeLister) {},
}

function createServiceWorker(): ServiceWorkerManager {
  if (!('serviceWorker' in navigator)) return emptyInstance

  const config = useConfig()

  if (config.env.mode !== 'prod') return emptyInstance

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  const state = reactive({
    stateChangeListeners: [] as StateChangeLister[],
  })

  const i18n = useI18n()

  //----------------------------------------------------------------------
  //
  //  Initialization
  //
  //----------------------------------------------------------------------

  const register = require('@/app/service-worker/register').register
  register(path.join(process.env.BASE_URL ?? '', 'service-worker.js'), {
    ready: () => {
      dispatchToListeners('ready', String(i18n.t('serviceWorker.ready')))
    },
    installing: () => {
      dispatchToListeners('installing', String(i18n.t('serviceWorker.installing')))
    },
    updating: () => {
      dispatchToListeners('updating', String(i18n.t('serviceWorker.updating')))
    },
    installed: () => {
      dispatchToListeners('installed', String(i18n.t('serviceWorker.installed')))
    },
    updated: () => {
      dispatchToListeners('updated', String(i18n.t('serviceWorker.updated')))
    },
    offline: () => {
      dispatchToListeners('offline', String(i18n.t('serviceWorker.offline')))
    },
    error: (err: Error) => {
      dispatchToListeners('error', String(i18n.t('serviceWorker.error')))
    },
  })

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  const addStateChangeListener: ServiceWorkerManager['addStateChangeListener'] = listener => {
    state.stateChangeListeners.push(listener)
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  /**
   * 登録されているサービスワーカーのイベントリスナーにイベントをディスパッチします。
   * @param changeState
   * @param message
   */
  function dispatchToListeners(changeState: ServiceWorkerChangeState, message: string): void {
    for (const listener of state.stateChangeListeners) {
      listener({ state: changeState, message })
    }
  }

  //----------------------------------------------------------------------
  //
  //  Result
  //
  //----------------------------------------------------------------------

  return {
    addStateChangeListener,
  }
}

const ServiceWorkerKey: InjectionKey<ServiceWorkerManager> = Symbol('ServiceWorkerManager')

function provideServiceWorker(): void {
  provide(ServiceWorkerKey, createServiceWorker())
}

function injectServiceWorker(): ServiceWorkerManager {
  validateServiceWorkerProvided()
  return inject(ServiceWorkerKey)!
}

function validateServiceWorkerProvided(): void {
  if (!inject(ServiceWorkerKey)) {
    throw new Error(`${ServiceWorkerKey.description} is not provided`)
  }
}

//========================================================================
//
//  Export
//
//========================================================================

export { ServiceWorkerKey, provideServiceWorker, createServiceWorker, injectServiceWorker, validateServiceWorkerProvided, ServiceWorkerChangeState }
