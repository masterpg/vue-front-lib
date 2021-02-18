import * as _path from 'path'
import { Unsubscribe, createNanoEvents } from 'nanoevents'
import { ServiceWorkerChangeState } from '@/app/service-worker/register'
import { useConfig } from '@/app/config'
import { useI18n } from '@/app/i18n'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface ServiceWorkerManager {
  /**
   * サービスワーカーの状態変化を監視します。
   * @param cb
   */
  watchState(cb: StateChangeCallback): Unsubscribe
}

type StateChangeCallback = (info: ServiceWorkerStateChangeInfo) => void

interface ServiceWorkerStateChangeInfo {
  state: ServiceWorkerChangeState
  message: string
}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace ServiceWorkerManager {
  let instance: ServiceWorkerManager

  export function getInstance(): ServiceWorkerManager {
    instance = instance ?? newInstance()
    return instance
  }

  const StateChangeEvent = 'StateChange'

  const EmptyInstance: ServiceWorkerManager = (() => {
    const emitter = createNanoEvents()
    const watchState: ServiceWorkerManager['watchState'] = cb => {
      return emitter.on(StateChangeEvent, cb)
    }
    return { watchState }
  })()

  function newInstance(): ServiceWorkerManager {
    if (!('serviceWorker' in navigator)) return EmptyInstance

    const config = useConfig()

    if (config.env.mode !== 'prod') return EmptyInstance

    //----------------------------------------------------------------------
    //
    //  Variables
    //
    //----------------------------------------------------------------------

    const emitter = createNanoEvents()

    const i18n = useI18n()

    //----------------------------------------------------------------------
    //
    //  Initialization
    //
    //----------------------------------------------------------------------

    const register = require('@/app/service-worker/register').register
    register(_path.join(process.env.BASE_URL ?? '', 'service-worker.js'), {
      ready: () => {
        emitStateChange('ready', String(i18n.t('serviceWorker.ready')))
      },
      installing: () => {
        emitStateChange('installing', String(i18n.t('serviceWorker.installing')))
      },
      updating: () => {
        emitStateChange('updating', String(i18n.t('serviceWorker.updating')))
      },
      installed: () => {
        emitStateChange('installed', String(i18n.t('serviceWorker.installed')))
      },
      updated: () => {
        emitStateChange('updated', String(i18n.t('serviceWorker.updated')))
      },
      offline: () => {
        emitStateChange('offline', String(i18n.t('serviceWorker.offline')))
      },
      error: (err: Error) => {
        emitStateChange('error', String(i18n.t('serviceWorker.error')))
      },
    })

    //----------------------------------------------------------------------
    //
    //  Methods
    //
    //----------------------------------------------------------------------

    const watchState: ServiceWorkerManager['watchState'] = cb => {
      return emitter.on(StateChangeEvent, cb)
    }

    //----------------------------------------------------------------------
    //
    //  Internal methods
    //
    //----------------------------------------------------------------------

    /**
     * サービスワーカーの状態変更イベントを発火します。
     * @param state
     * @param message
     */
    function emitStateChange(state: ServiceWorkerChangeState, message: string): void {
      const info: ServiceWorkerStateChangeInfo = { state, message }
      emitter.emit(StateChangeEvent, info)
    }

    //----------------------------------------------------------------------
    //
    //  Result
    //
    //----------------------------------------------------------------------

    return {
      watchState,
    }
  }
}

function useServiceWorker(): ServiceWorkerManager {
  return ServiceWorkerManager.getInstance()
}

//========================================================================
//
//  Export
//
//========================================================================

export { ServiceWorkerChangeState, useServiceWorker }
