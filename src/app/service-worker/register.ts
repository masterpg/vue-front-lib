//========================================================================
//
//  Interfaces
//
//========================================================================

type ServiceWorkerChangeState = 'ready' | 'installing' | 'updating' | 'installed' | 'updated' | 'offline' | 'error'

type HookFunc = (state: ServiceWorkerChangeState) => void
type HookRegistrationFunc = (state: ServiceWorkerChangeState, registration: ServiceWorkerRegistration) => void
type HookErrorFunc = (state: 'error', error: Error) => void

interface Hooks {
  ready?: HookRegistrationFunc
  installing?: HookRegistrationFunc
  updating?: HookRegistrationFunc
  installed?: HookRegistrationFunc
  updated?: HookRegistrationFunc
  offline?: HookFunc
  error?: HookErrorFunc
  registrationOptions?: RegistrationOptions
}

//========================================================================
//
//  Implementation
//
//========================================================================

function register(serviceWorkerURL: string, hooks: Hooks = {}): void {
  const { registrationOptions = {} } = hooks
  delete hooks.registrationOptions

  //----------------------------------------------------------------------
  //
  //  Initialization
  //
  //----------------------------------------------------------------------

  function isLocalhost(): boolean {
    return Boolean(
      window.location.hostname === 'localhost' ||
        // [::1] is the IPv6 localhost address.
        window.location.hostname === '[::1]' ||
        // 127.0.0.1/8 is considered localhost for IPv4.
        window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
    )
  }

  const waitWindowLoad = new Promise(resolve => {
    window.addEventListener('load', resolve)
  })

  if ('serviceWorker' in navigator) {
    waitWindowLoad.then(async () => {
      // サーバーがローカルホストで実行されている場合
      if (isLocalhost()) {
        // This is running on localhost. Lets check if a service worker still exists or not.
        // ServiceWorkerの検証をした後、登録を行う
        await checkAndRegisterServiceWorker(serviceWorkerURL, registrationOptions)
      }
      // サーバーがローカルホストでない場合
      else {
        // ServiceWorkerの検証はせず登録を行う
        await registerServiceWorker(serviceWorkerURL, registrationOptions)
      }
    })
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  function emit(state: ServiceWorkerChangeState, registration_or_error?: ServiceWorkerRegistration | Error): void {
    switch (state) {
      case 'ready':
      case 'installing':
      case 'updating':
      case 'installed':
      case 'updated': {
        const hookFunc = hooks[state]
        hookFunc && hookFunc(state, registration_or_error as ServiceWorkerRegistration)
        break
      }
      case 'offline': {
        const hookFunc = hooks[state]
        hookFunc && hookFunc(state!)
        break
      }
      case 'error': {
        const hookFunc = hooks[state]
        hookFunc && hookFunc(state, registration_or_error as Error)
        break
      }
    }
  }

  async function registerServiceWorker(serviceWorkerURL: string, registrationOptions: RegistrationOptions) {
    let registration!: ServiceWorkerRegistration
    try {
      registration = await navigator.serviceWorker.register(serviceWorkerURL, registrationOptions)
    } catch (err) {
      handleError(err)
      return
    }

    //
    // installing
    //
    if (registration.installing) {
      const serviceWorker = registration.installing

      // ServiceWorkerにアップデートがあるかを取得
      registration.onupdatefound = () => {
        emit('installing', registration)
      }

      // インストール状態の変化を監視
      registration.installing.onstatechange = async () => {
        // ここでは次の順で状態(serviceWorker.state)が変化する
        // 'installed' -> 'activating' -> 'activated'
        if (serviceWorker.state === 'activated') {
          // インストール完了イベントを発火
          emit('installed', registration)
          // インストールされたServiceWorkerが使用可能になるまで待機
          await navigator.serviceWorker.ready.then()
          emit('ready', registration)
        }
      }
    }
    //
    // active
    //
    else if (registration.active) {
      const serviceWorker = registration.active

      // インストール済みServiceWorkerが使用可能になるまで待機
      await navigator.serviceWorker.ready.then()
      emit('ready', registration)

      // インストール済みServiceWorkerにアップデートがあるかを取得
      registration.onupdatefound = () => {
        emit('updating', registration)
      }

      // インストール済みServiceWorkerのアップデート状態の変化を監視
      registration.active.onstatechange = async () => {
        if (serviceWorker.state === 'redundant') {
          // アップデート完了イベントを発火
          emit('updated', registration)
          // アップデートされたServiceWorkerが使用可能になるまで待機
          await navigator.serviceWorker.ready.then()
          emit('ready', registration)
        }
      }
    }
    //
    // waiting
    //
    else if (registration.waiting) {
      // TODO ここはどのような状況で入ってくるのか確認できていない
      console.warn(`ServiceWorker: This block is not supposed to be executed.`)

      const serviceWorker = registration.waiting

      registration.waiting.onstatechange = () => {
        console.log('ServiceWorker waiting:', serviceWorker.state)
      }
    }
    //
    // others
    //
    else {
      // TODO ここはどのような状況で入ってくるのか確認できていない
      console.warn(`ServiceWorker: This block is not supposed to be executed.`)
    }
  }

  async function checkAndRegisterServiceWorker(serviceWorkerURL: string, registrationOptions: RegistrationOptions): Promise<void> {
    try {
      const response = await fetch(serviceWorkerURL)
      // ServiceWorkerの挙動を実装したJSファイルが存在するか検証
      if (response.status === 404) {
        emit('error', new Error(`ServiceWorker not found at ${serviceWorkerURL}`))
        await unregister()
      } else if (response.headers.get('content-type')!.indexOf('javascript') === -1) {
        emit('error', new Error(`Expected ${serviceWorkerURL} to have javascript content-type, but received ${response.headers.get('content-type')}`))
        await unregister()
      }
      // ServiceWorkerの挙動を実装したJSファイルが存在する場合
      else {
        // ServiceWorkerの登録実行
        await registerServiceWorker(serviceWorkerURL, registrationOptions)
      }
    } catch (err) {
      handleError(err)
    }
  }

  function handleError(error: Error) {
    if (!navigator.onLine) {
      emit('offline')
    }
    console.error('ServiceWorker', error)
    emit('error', error)
  }
}

async function unregister() {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready.then()
    await registration.unregister()
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { register, unregister, ServiceWorkerChangeState }
